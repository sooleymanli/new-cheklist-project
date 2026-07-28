import { useState, useEffect, useMemo } from 'react';
import { Card, Form, Input, Button, App, TreeSelect, Spin, Modal, Tag, Row, Col, Grid } from 'antd';
import { SaveOutlined, ArrowLeftOutlined, FullscreenOutlined, CheckCircleOutlined, StopOutlined, TableOutlined, PlusOutlined, UndoOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  useGetChecklistTemplateQuery,
  useCreateChecklistTemplateMutation,
  useUpdateChecklistTemplateMutation,
  useActivateChecklistTemplateMutation,
  useDeactivateChecklistTemplateMutation,
  type TemplateField,
} from '../checklistTemplates.api';
import { useGetBuildingsQuery } from '@/modules/buildings/buildings.api';
import { useGetFloorsQuery } from '@/modules/buildings/floors.api';
import { useGetLocationsQuery } from '@/modules/buildings/locations.api';
import { TableVisualizer, type TableColumn, type TableLocation } from '../components/TableVisualizer';

export default function TemplateBuilderPage() {
  const { t } = useTranslation();
  const { message } = App.useApp();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isNew = id === 'new';

  const { data: template, isLoading } = useGetChecklistTemplateQuery(id!, { skip: isNew });
  const { data: buildingsData } = useGetBuildingsQuery({});
  const { data: floorsData } = useGetFloorsQuery({});
  const { data: locationsData } = useGetLocationsQuery({});
  const [createTemplate, { isLoading: creating }] = useCreateChecklistTemplateMutation();
  const [updateTemplate, { isLoading: updating }] = useUpdateChecklistTemplateMutation();
  const [activateTemplate] = useActivateChecklistTemplateMutation();
  const [deactivateTemplate] = useDeactivateChecklistTemplateMutation();

  const { useBreakpoint } = Grid;
  const screens = useBreakpoint();
  void screens;

  const [form] = Form.useForm();
  const [fields, setFields] = useState<TemplateField[]>([]);
  const [selectedLocationValues, setSelectedLocationValues] = useState<string[]>([]);
  const [locationQrMap, setLocationQrMap] = useState<Record<string, boolean>>({});
  const [searchParams, setSearchParams] = useSearchParams();
  const [tableModalOpen, setTableModalOpen] = useState(searchParams.get('table') === 'open');
  const [tableColumns, setTableColumns] = useState<TableColumn[]>([]);
  const [savedTableColumns, setSavedTableColumns] = useState<TableColumn[]>([]);
  const [savedLocations, setSavedLocations] = useState<TableLocation[]>([]);

  // Build tree data: Building > Floor > Location
  const treeData = useMemo(() => {
    const buildings = (buildingsData as any)?.data || buildingsData || [];
    const floors = floorsData || [];
    const locations: any[] = (locationsData as any)?.data || locationsData || [];

    return buildings.map((b: any) => ({
      title: b.name,
      value: `building:${b.id}`,
      key: `building:${b.id}`,
      children: [
        // Floors under this building
        ...floors
          .filter((f: any) => f.buildingId === b.id)
          .map((f: any) => ({
            title: f.name,
            value: `floor:${f.id}`,
            key: `floor:${f.id}`,
            children: locations
              .filter((l: any) => l.floorId === f.id)
              .map((l: any) => ({
                title: l.name,
                value: `location:${l.id}`,
                key: `location:${l.id}`,
              })),
          })),
        // Locations without floor (directly under building)
        ...locations
          .filter((l: any) => l.buildingId === b.id && !l.floorId)
          .map((l: any) => ({
            title: l.name,
            value: `location:${l.id}`,
            key: `location:${l.id}`,
          })),
      ],
    }));
  }, [buildingsData, floorsData, locationsData]);

  useEffect(() => {
    if (template) {
      form.setFieldsValue({ name: template.name, description: template.description });
      // Separate table field from other fields
      const tableField = template.fields?.find((f: any) => f.fieldType === 'table');
      const otherFields = template.fields?.filter((f: any) => f.fieldType !== 'table') || [];
      setFields(otherFields);
      if (tableField?.fieldConfig?.tableColumns) {
        setTableColumns(tableField.fieldConfig.tableColumns);
      }
      if (tableField?.fieldConfig?.tableLocations) {
        setLocationQrMap(
          Object.fromEntries(tableField.fieldConfig.tableLocations.map((l: any) => [l.id, l.qrRequired ?? false]))
        );
      }
      // Convert saved locationIds to tree values
      setSelectedLocationValues(template.locations?.map((l: any) => `location:${l.locationId}`) || []);
    }
  }, [template]);

  const handleSave = async () => {
    try {
      const values = await form.validateFields();

      // Extract actual locationIds from tree selection (resolve building/floor to their locations)
      const locationIds = resolveLocationIds(selectedLocationValues);

      const payload = {
        ...values,
        fields: [
          // Include table as a field if columns exist
          ...(tableColumns.length > 0
            ? [{
                orderNo: 0,
                fieldKey: 'inspection_table',
                fieldLabel: 'Inspection Table',
                fieldType: 'table',
                fieldConfig: {
                  tableColumns: tableColumns,
                  tableLocations: resolvedLocations,
                },
              }]
            : []),
          // Include other fields after the table
          ...fields.map((f, i) => ({
            orderNo: (tableColumns.length > 0 ? 1 : 0) + i,
            fieldKey: f.fieldKey,
            fieldLabel: f.fieldLabel,
            fieldType: f.fieldType,
            category: f.category || undefined,
            fieldConfig: f.fieldConfig || {},
          })),
        ],
        locationIds,
      };

      console.log('SAVE PAYLOAD:', JSON.stringify(payload, null, 2));

      let res: any;
      if (isNew) {
        res = await createTemplate(payload).unwrap();
      } else {
        res = await updateTemplate({ id: id!, body: payload }).unwrap();
      }
      if (res?.message) message.success(res.message);
      navigate('/checklist-templates', { replace: true });
    } catch (err: any) {
      if (err?.data?.message) message.error(err.data.message);
    }
  };

  // Resolve tree values to actual location IDs
  const resolveLocationIds = (values: string[]): string[] => {
    const locations: any[] = (locationsData as any)?.data || locationsData || [];
    const ids = new Set<string>();

    values.forEach((val) => {
      if (val.startsWith('location:')) {
        ids.add(val.replace('location:', ''));
      } else if (val.startsWith('floor:')) {
        const floorId = val.replace('floor:', '');
        locations.filter((l: any) => l.floorId === floorId).forEach((l: any) => ids.add(l.id));
      } else if (val.startsWith('building:')) {
        const buildingId = val.replace('building:', '');
        locations.filter((l: any) => l.buildingId === buildingId).forEach((l: any) => ids.add(l.id));
      }
    });

    return Array.from(ids);
  };

  // Resolved locations for table display
  const allLocationsList = useMemo(() => {
    const locs: any[] = (locationsData as any)?.data || locationsData || [];
    return locs.map((l: any) => ({ id: l.id, name: l.name }));
  }, [locationsData]);

  const resolvedLocations: TableLocation[] = useMemo(() => {
    const allLocations: any[] = (locationsData as any)?.data || locationsData || [];
    const ids = resolveLocationIds(selectedLocationValues);
    return ids.map((locId) => {
      const loc = allLocations.find((l: any) => l.id === locId);
      return loc
        ? { id: loc.id, name: loc.name, qrRequired: locationQrMap[locId] ?? false }
        : { id: locId, name: locId, qrRequired: locationQrMap[locId] ?? false };
    });
  }, [selectedLocationValues, locationsData, locationQrMap]);

  const handleLocationsChangeFromTable = (newLocs: TableLocation[]) => {
    setSelectedLocationValues(newLocs.map((l) => `location:${l.id}`));
    const qrMap: Record<string, boolean> = {};
    newLocs.forEach((l) => { qrMap[l.id] = l.qrRequired ?? false; });
    setLocationQrMap(qrMap);
  };

  const handleActivate = async () => {
    try {
      const res: any = await activateTemplate(id!).unwrap();
      if (res?.message) message.success(res.message);
    } catch (err: any) {
      message.error(err?.data?.message || t('error.unexpected'));
    }
  };

  const handleDeactivate = async () => {
    try {
      const res: any = await deactivateTemplate(id!).unwrap();
      if (res?.message) message.success(res.message);
    } catch (err: any) {
      message.error(err?.data?.message || t('error.unexpected'));
    }
  };

  if (isLoading && !isNew) return <Spin size="large" style={{ display: 'flex', justifyContent: 'center', marginTop: '20vh' }} />;

  const openTableModal = () => {
    if (tableColumns.length === 0) {
      setTableColumns([
        { id: `col_${Date.now()}_1`, label: '', type: 'yes_no', required: false, fileRequirement: 'none' },
        { id: `col_${Date.now()}_2`, label: '', type: 'yes_no', required: false, fileRequirement: 'none' },
        { id: `col_${Date.now()}_3`, label: '', type: 'yes_no', required: false, fileRequirement: 'none' },
        { id: `col_${Date.now()}_4`, label: '', type: 'yes_no', required: false, fileRequirement: 'none' },
      ]);
    }
    setSavedTableColumns(JSON.parse(JSON.stringify(tableColumns)));
    setSavedLocations(JSON.parse(JSON.stringify(resolvedLocations)));
    setTableModalOpen(true);
    setSearchParams({ table: 'open' }, { replace: true });
  };

  const closeTableModal = () => {
    setTableModalOpen(false);
    searchParams.delete('table');
    setSearchParams(searchParams, { replace: true });
  };

  const handleResetTable = () => {
    setTableColumns(savedTableColumns);
    handleLocationsChangeFromTable(savedLocations);
  };

  const handleSaveTable = () => {
    closeTableModal();
    message.success(t('checklists.tableChangesSaved'));
  };

  const locationCount = resolveLocationIds(selectedLocationValues).length;
  const columnCount = tableColumns.length;

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/checklist-templates')} />
          {!isNew && template && (
            <Tag color={template.status === 'active' ? 'green' : template.status === 'draft' ? 'default' : 'red'}>
              {t(`checklists.status_${template.status}`)}
            </Tag>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {!isNew && template && template.status !== 'active' && (
            <Button icon={<CheckCircleOutlined />} onClick={handleActivate} style={{ background: '#52c41a', borderColor: '#52c41a', color: '#fff' }}>
              {t('checklists.activate')}
            </Button>
          )}
          {!isNew && template && template.status === 'active' && (
            <Button danger icon={<StopOutlined />} onClick={handleDeactivate}>
              {t('checklists.deactivate')}
            </Button>
          )}
          <Button type="primary" icon={<SaveOutlined />} loading={creating || updating} onClick={handleSave}>
            {t('common.save')}
          </Button>
        </div>
      </div>

      <Row gutter={[20, 20]}>
        {/* Left: Form */}
        <Col xs={24} md={14} lg={15}>
          <Card title={t('checklists.templateInfo')} size="small">
            <Form form={form} layout="vertical">
              <Form.Item name="name" label={t('checklists.templateName')} rules={[{ required: true }]}>
                <Input />
              </Form.Item>
              <Form.Item name="description" label={t('checklists.description')}>
                <Input.TextArea rows={3} />
              </Form.Item>
              <Form.Item label={t('checklists.locations')}>
                <TreeSelect
                  treeData={treeData}
                  value={selectedLocationValues}
                  onChange={setSelectedLocationValues}
                  treeCheckable
                  showCheckedStrategy={TreeSelect.SHOW_PARENT}
                  placeholder={t('checklists.selectLocations')}
                  style={{ width: '100%' }}
                  treeDefaultExpandAll
                  allowClear
                  maxTagCount={5}
                  filterTreeNode={(input, node) =>
                    (node?.title as string)?.toLowerCase().includes(input.toLowerCase())
                  }
                />
              </Form.Item>
            </Form>
          </Card>
        </Col>

        {/* Right: Table Preview Card */}
        <Col xs={24} md={10} lg={9}>
          <Card
            size="small"
            hoverable
            onClick={openTableModal}
            style={{ cursor: 'pointer', height: '100%', minHeight: 220, border: '1px solid #e6f4ff', background: 'linear-gradient(135deg, #f0f7ff 0%, #ffffff 100%)' }}
            styles={{ body: { display: 'flex', flexDirection: 'column', height: '100%', padding: 0 } }}
          >
            {/* Mini table header */}
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #e6f4ff', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 30, height: 30, borderRadius: 6, background: '#1677ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <TableOutlined style={{ fontSize: 15, color: '#fff' }} />
                </div>
                <span style={{ fontWeight: 600, fontSize: 14 }}>{t('checklists.visualizeTable')}</span>
              </div>
              {columnCount > 0 && (
                <div style={{ display: 'flex', gap: 6 }}>
                  <span style={{ fontSize: 11, background: '#e6f4ff', color: '#1677ff', padding: '2px 8px', borderRadius: 10, fontWeight: 500 }}>
                    {columnCount} {t('checklists.fields').toLowerCase()}
                  </span>
                  <span style={{ fontSize: 11, background: '#f6ffed', color: '#52c41a', padding: '2px 8px', borderRadius: 10, fontWeight: 500 }}>
                    {locationCount} {t('checklists.locations').toLowerCase()}
                  </span>
                </div>
              )}
            </div>

            {/* Mini table preview */}
            <div style={{ flex: 1, padding: 12, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              {columnCount > 0 ? (
                <div style={{ borderRadius: 8, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                  {/* Header row */}
                  <div style={{ display: 'flex', background: 'linear-gradient(90deg, #1677ff 0%, #4096ff 100%)' }}>
                    <div style={{ width: '25%', minWidth: 70, padding: '7px 8px', fontSize: 10, fontWeight: 600, color: '#fff', borderRight: '1px solid rgba(255,255,255,0.2)' }}>
                      {t('checklists.locations')}
                    </div>
                    {tableColumns.slice(0, 4).map((col, i) => (
                      <div key={col.id} style={{
                        flex: 1, padding: '7px 6px', fontSize: 10, fontWeight: 500, color: 'rgba(255,255,255,0.9)',
                        borderRight: i < Math.min(tableColumns.length, 4) - 1 ? '1px solid rgba(255,255,255,0.2)' : undefined,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {col.label || `#${i + 1}`}
                      </div>
                    ))}
                    {columnCount > 4 && (
                      <div style={{ width: 30, padding: '7px 4px', fontSize: 10, color: 'rgba(255,255,255,0.7)', fontWeight: 500, textAlign: 'center' }}>+{columnCount - 4}</div>
                    )}
                  </div>
                  {/* Data rows */}
                  {[0, 1, 2].map((rowIdx) => (
                    <div key={rowIdx} style={{
                      display: 'flex',
                      borderBottom: rowIdx < 2 ? '1px solid #f5f5f5' : undefined,
                      background: rowIdx % 2 === 0 ? '#fff' : '#fafbfc',
                    }}>
                      <div style={{ width: '25%', minWidth: 70, padding: '6px 8px', fontSize: 10, color: '#333', fontWeight: 500, borderRight: '1px solid #f0f0f0' }}>
                        {resolvedLocations[rowIdx]?.name || '—'}
                      </div>
                      {tableColumns.slice(0, 4).map((col, i) => (
                        <div key={col.id} style={{
                          flex: 1, padding: '6px 6px', fontSize: 10, textAlign: 'center',
                          borderRight: i < Math.min(tableColumns.length, 4) - 1 ? '1px solid #f0f0f0' : undefined,
                          color: col.type === 'yes_no' ? '#52c41a' : col.type === 'number' ? '#1677ff' : '#666',
                        }}>
                          {col.type === 'yes_no' ? '✓' : col.type === 'number' ? '123' : col.type === 'select' ? '▾' : col.type === 'photo' ? '📷' : col.type === 'formula' ? 'ƒ' : '—'}
                        </div>
                      ))}
                      {columnCount > 4 && <div style={{ width: 30, padding: '6px 4px', fontSize: 10 }} />}
                    </div>
                  ))}
                  {locationCount > 3 && (
                    <div style={{ padding: '5px 8px', fontSize: 10, color: '#999', textAlign: 'center', background: '#fafbfc', borderTop: '1px solid #f5f5f5' }}>
                      +{locationCount - 3} ...
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <div style={{ width: 56, height: 56, borderRadius: 12, background: '#f0f5ff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                    <TableOutlined style={{ fontSize: 28, color: '#1677ff' }} />
                  </div>
                  <div style={{ fontSize: 13, color: '#333', fontWeight: 500, marginBottom: 4 }}>{t('checklists.noTableYet')}</div>
                  <div style={{ fontSize: 12, color: '#999' }}>{t('checklists.clickToCreateTable')}</div>
                </div>
              )}
            </div>

            {/* Footer button */}
            <div style={{ padding: '10px 16px', borderTop: '1px solid #e6f4ff', textAlign: 'center' }}>
              <Button type="primary" icon={columnCount > 0 ? <FullscreenOutlined /> : <PlusOutlined />} block>
                {columnCount > 0 ? t('checklists.openTable') : t('checklists.createTable')}
              </Button>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Full-screen Table Visualization Modal */}
      <Modal
        title={t('checklists.visualizeTable')}
        open={tableModalOpen}
        onCancel={closeTableModal}
        footer={
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Button icon={<UndoOutlined />} onClick={handleResetTable}>
              {t('checklists.reset')}
            </Button>
            <Button type="primary" icon={<SaveOutlined />} onClick={handleSaveTable}>
              {t('checklists.saveChanges')}
            </Button>
          </div>
        }
        width="100vw"
        style={{ top: 0, maxWidth: '100vw', margin: 0, padding: 0 }}
        styles={{ body: { height: 'calc(100vh - 110px)', overflow: 'auto', padding: 16 } }}
      >
        <TableVisualizer
          columns={tableColumns}
          onColumnsChange={setTableColumns}
          locations={resolvedLocations}
          allLocations={allLocationsList}
          onLocationsChange={handleLocationsChangeFromTable}
          locationTreeData={treeData}
        />
      </Modal>
    </div>
  );
}
