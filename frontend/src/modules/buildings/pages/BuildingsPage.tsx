import { useState, useEffect } from 'react';
import { Table, Button, Space, Tag, Input, App, Modal, Form, Grid, Card, List, Pagination, Switch, Segmented, theme } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, QrcodeOutlined, ApartmentOutlined, EnvironmentOutlined, FullscreenOutlined, ExclamationCircleOutlined, RightOutlined, DownOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import {
  useGetBuildingsQuery,
  useCreateBuildingMutation,
  useUpdateBuildingMutation,
  useDeleteBuildingMutation,
  useActivateBuildingMutation,
  useDeactivateBuildingMutation,
  type Building,
} from '../buildings.api';
import { useGenerateQrMutation } from '../qr.api';
import { FloorsSection } from '../components/FloorsSection';
import { LocationsSection } from '../components/LocationsSection';
import { useGetFloorsQuery } from '../floors.api';
import { useGetLocationsQuery } from '../locations.api';
import { QrModal } from '../components/QrModal';
import { highlightText } from '@/shared/utils/highlightText';

export default function BuildingsPage() {
  const { t } = useTranslation();
  const { message, modal } = App.useApp();
  const { token } = theme.useToken();
  const screens = Grid.useBreakpoint();
  const isMobile = typeof screens.md === 'undefined' ? window.innerWidth < 768 : !screens.md;
  const [searchParams, setSearchParams] = useSearchParams();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Building | null>(null);
  const [qrEntityId, setQrEntityId] = useState<string | null>(null);
  const [form] = Form.useForm();

  const page = Number(searchParams.get('page')) || 1;
  const pageSize = Number(searchParams.get('pageSize')) || 10;
  const search = searchParams.get('search') || '';
  const expandedId = searchParams.get('expanded') || null;
  const expandedTab = (searchParams.get('tab') as 'floors' | 'locations') || 'floors';
  const fullscreenId = searchParams.get('fullscreen') || null;
  const fullscreenTab = (searchParams.get('fsTab') as 'floors' | 'locations') || 'floors';

  const { data, isLoading } = useGetBuildingsQuery({ page, pageSize, search });
  const [createBuilding, { isLoading: creating }] = useCreateBuildingMutation();
  const [updateBuilding, { isLoading: updating }] = useUpdateBuildingMutation();
  const [deleteBuilding] = useDeleteBuildingMutation();
  const [activateBuilding] = useActivateBuildingMutation();
  const [deactivateBuilding] = useDeactivateBuildingMutation();
  const [generateQr] = useGenerateQrMutation();

  // Auto-expand building row when search matches floor/location (not building name/desc)
  const { data: expandedFloors } = useGetFloorsQuery({ buildingId: expandedId! }, { skip: !expandedId || !search });
  const { data: expandedLocations } = useGetLocationsQuery({ buildingId: expandedId! }, { skip: !expandedId || !search });

  useEffect(() => {
    if (!search || !data?.data?.length) return;
    const lowerSearch = search.toLowerCase();
    const matchedByChild = data.data.find((b) => {
      const nameMatch = b.name.toLowerCase().includes(lowerSearch);
      const descMatch = b.description?.toLowerCase().includes(lowerSearch);
      return !nameMatch && !descMatch;
    });
    if (matchedByChild) {
      setSearchParams((p) => {
        p.set('expanded', matchedByChild.id);
        return p;
      });
    }
  }, [search, data]);

  // Determine correct tab based on which child entity matched
  useEffect(() => {
    if (!search || !expandedId) return;
    const lowerSearch = search.toLowerCase();
    const floorMatch = expandedFloors?.some((f) => f.name.toLowerCase().includes(lowerSearch) || f.description?.toLowerCase().includes(lowerSearch));
    const locationMatch = expandedLocations?.some((l) => l.name.toLowerCase().includes(lowerSearch) || l.description?.toLowerCase().includes(lowerSearch));
    if (locationMatch && !floorMatch) {
      setSearchParams((p) => { p.set('tab', 'locations'); return p; });
    } else if (floorMatch) {
      setSearchParams((p) => { p.set('tab', 'floors'); return p; });
    }
  }, [expandedFloors, expandedLocations, search, expandedId]);

  const handleToggleActive = async (building: Building) => {
    try {
      const res: any = building.isActive
        ? await deactivateBuilding(building.id).unwrap()
        : await activateBuilding(building.id).unwrap();
      if (res?.message) message.success(res.message);
    } catch { message.error(t('error.unexpected')); }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      let res: any;
      if (editing) {
        res = await updateBuilding({ id: editing.id, body: values }).unwrap();
      } else {
        res = await createBuilding(values).unwrap();
      }
      if (res?.message) message.success(res.message);
      setFormOpen(false);
      setEditing(null);
      form.resetFields();
    } catch (err: any) {
      if (err?.data?.message) message.error(err.data.message);
    }
  };

  const handleDelete = (id: string) => {
    modal.confirm({
      title: t('buildings.confirmDelete'),
      icon: <ExclamationCircleOutlined />,
      okText: t('common.delete'),
      okType: 'danger',
      cancelText: t('common.cancel'),
      centered: true,
      onOk: async () => {
        try {
          const res: any = await deleteBuilding(id).unwrap();
          if (res?.message) message.success(res.message);
          else message.success('✓');
        } catch { message.error(t('error.unexpected')); }
      },
    });
  };

  const handleQr = async (building: Building) => {
    try {
      await generateQr({ entityType: 'building', entityId: building.id }).unwrap();
      setQrEntityId(building.id);
    } catch { message.error('QR generation failed'); }
  };

  const columns = [
  
    { title: t('buildings.name'), dataIndex: 'name', render: (v: string) => <strong>{highlightText(v, search)}</strong>,
width: 200, },
    { title: t('buildings.description'), dataIndex: 'description', width: 200, render: (v: string) => v ? highlightText(v, search) : null },
    {
      title: t('buildings.floors'),
      responsive: ['md'] as any,
      render: (_: unknown, r: Building) => r._count?.floors ?? 0,
      width: 100,
    },
    {
      title: t('buildings.locations'),
      responsive: ['md'] as any,
      render: (_: unknown, r: Building) => r._count?.locations ?? 0,
      width: 110,
    },
      {
      title: t('common.status'),
      dataIndex: 'isActive',
      width: 90,
      render: (v: boolean, record: Building) => (
        <span onClick={(e) => e.stopPropagation()}>
          <Switch
            checked={v}
            checkedChildren={t('common.active')}
            unCheckedChildren={t('common.inactive')}
            onChange={() => handleToggleActive(record)}
          />
        </span>
      ),
    },
    {
      title: t('common.actions'),
      width: 130,
      render: (_: unknown, record: Building) => (
        <Space size="small" onClick={(e) => e.stopPropagation()}>
          <Button type="link" size="small" icon={<QrcodeOutlined />} onClick={() => handleQr(record)} />
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => { setEditing(record); form.setFieldsValue(record); setFormOpen(true); }} />
          <Button type="link" size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record.id)} />
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'space-between' }}>
        <Input
          placeholder={t('common.search')}
          prefix={<SearchOutlined />}
          value={search}
          onChange={(e) => setSearchParams((p) => { 
            const val = e.target.value;
            if (val) { p.set('search', val); } else { p.delete('search'); p.delete('expanded'); p.delete('tab'); }
            p.set('page', '1'); 
            return p; 
          })}
          style={{ width: isMobile ? '100%' : 250 }}
          allowClear
        />
        <Button block={isMobile} type="primary" icon={<PlusOutlined />} onClick={() => { setEditing(null); form.resetFields(); setFormOpen(true); }}>
          { t('common.create')}
        </Button>
      </div>

      {isMobile ? (
        <>
          <List
            loading={isLoading}
            dataSource={data?.data}
            renderItem={(building: Building) => (
              <Card
                size="small"
                style={{ marginBottom: 8, ...(!building.isActive && { opacity: 0.5 }), cursor: 'pointer' }}
                onClick={() => setSearchParams((p) => {
                  if (expandedId === building.id) { p.delete('expanded'); p.delete('tab'); }
                  else { p.set('expanded', building.id); p.set('tab', 'floors'); }
                  return p;
                })}
                actions={[
                  <Button type="link" size="small" icon={<QrcodeOutlined />} onClick={(e) => { e.stopPropagation(); handleQr(building); }} />,
                  <Button type="link" size="small" icon={<EditOutlined />} onClick={(e) => { e.stopPropagation(); setEditing(building); form.setFieldsValue(building); setFormOpen(true); }} />,
                  <Button type="link" size="small" danger icon={<DeleteOutlined />} onClick={(e) => { e.stopPropagation(); handleDelete(building.id); }} />,
                ]}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong>{highlightText(building.name, search)}</strong>
                    {building.description && <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{highlightText(building.description, search)}</div>}
                    <Space size="small" style={{ marginTop: 4 }}>
                      <Tag>{t('common.status')}: {building.isActive ? t('common.active') : t('common.inactive')}</Tag>
                      <Tag color="blue">{t('buildings.floors')}: {building._count?.floors ?? 0}</Tag>
                      <Tag color="green">{t('buildings.locations')}: {building._count?.locations ?? 0}</Tag>
                    </Space>
                  </div>
                  {expandedId === building.id ? <DownOutlined /> : <RightOutlined />}
                </div>
                {expandedId === building.id && (
                  <div style={{ marginTop: 12 }} onClick={(e) => e.stopPropagation()}>
                    <Segmented
                      size="small"
                      value={expandedTab}
                      onChange={(val) => setSearchParams((p) => { p.set('tab', val as string); return p; })}
                      options={[
                        { label: <span><ApartmentOutlined /> {t('menu.floors')}</span>, value: 'floors' },
                        { label: <span><EnvironmentOutlined /> {t('menu.locations')}</span>, value: 'locations' },
                      ]}
                      style={{ marginBottom: 12 }}
                    />
                    <div style={{ background: token.colorBgContainer, borderRadius: 8, border: `1px solid ${token.colorBorder}`, padding: '8px 12px' }}>
                      {expandedTab === 'floors' ? (
                        <FloorsSection buildingId={building.id} search={search} />
                      ) : (
                        <LocationsSection buildingId={building.id} search={search} />
                      )}
                    </div>
                  </div>
                )}
              </Card>
            )}
          />
          <Pagination
            current={page}
            pageSize={pageSize}
            total={data?.meta?.total}
            simple
            style={{ textAlign: 'center', marginTop: 12 }}
            onChange={(p, ps) => setSearchParams((prev) => { prev.set('page', String(p)); prev.set('pageSize', String(ps)); return prev; })}
          />
        </>
      ) : (
        <Table
          rowKey="id"
          columns={columns}
          dataSource={data?.data}
          loading={isLoading}
          scroll={{ x: 500 }}
          rowClassName={(record) => !record.isActive ? 'row-disabled' : ''}
          onRow={(record) => ({
            onClick: () => {
              setSearchParams((p) => {
                if (expandedId === record.id) { p.delete('expanded'); p.delete('tab'); }
                else { p.set('expanded', record.id); p.set('tab', 'floors'); }
                return p;
              });
            },
            style: { cursor: 'pointer' },
          })}
          pagination={{
            current: page,
            pageSize,
            total: data?.meta?.total,
            showSizeChanger: true,
            onChange: (p, ps) => setSearchParams((prev) => { prev.set('page', String(p)); prev.set('pageSize', String(ps)); return prev; }),
          }}
          expandable={{
            expandedRowKeys: expandedId ? [expandedId] : [],
            expandIcon: ({ expanded, onExpand, record }) => expanded ? <DownOutlined style={{ cursor: 'pointer' }} onClick={(e) => onExpand(record, e)} /> : <RightOutlined style={{ cursor: 'pointer' }} onClick={(e) => onExpand(record, e)} />,
            onExpand: (expanded, record) => { setSearchParams((p) => { if (expanded) { p.set('expanded', record.id); p.set('tab', 'floors'); } else { p.delete('expanded'); p.delete('tab'); } return p; }); },
            expandedRowRender: (record) => (
              <div style={{ padding: '16px 24px', background: token.colorBgElevated, borderRadius: 12, border: `1px solid ${token.colorBorderSecondary}`, margin: '4px 0' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 16 }}>
                  <Segmented
                    value={expandedTab}
                    onChange={(val) => setSearchParams((p) => { p.set('tab', val as string); return p; })}
                    options={[
                      { label: <span><ApartmentOutlined /> {t('menu.floors')}</span>, value: 'floors' },
                      { label: <span><EnvironmentOutlined /> {t('menu.locations')}</span>, value: 'locations' },
                    ]}
                  />
                  <Button
                    type="text"
                    icon={<FullscreenOutlined />}
                    onClick={() => setSearchParams((p) => { p.set('fullscreen', record.id); p.set('fsTab', expandedTab); return p; })}
                  />
                </div>
                <div style={{ background: token.colorBgContainer, borderRadius: 8, border: `1px solid ${token.colorBorder}`, padding: '12px 16px' }}>
                  {expandedTab === 'floors' ? (
                    <FloorsSection buildingId={record.id} search={search} />
                  ) : (
                    <LocationsSection buildingId={record.id} search={search} />
                  )}
                </div>
              </div>
            ),
          }}
        />
      )}

      <Modal
        title={editing ? t('common.edit') : t('common.create')}
        open={formOpen}
        onOk={handleSubmit}
        onCancel={() => { setFormOpen(false); setEditing(null); }}
        confirmLoading={creating || updating}
              mask={{ enabled: true, blur: true }}

      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label={t('buildings.name')} rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label={t('buildings.description')}>
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
            mask={{ enabled: true, blur: true }}

        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span>{data?.data?.find((b) => b.id === fullscreenId)?.name}</span>
            <Segmented
              value={fullscreenTab}
              onChange={(val) => setSearchParams((p) => { p.set('fsTab', val as string); return p; })}
              options={[
                { label: <span><ApartmentOutlined /> {t('menu.floors')}</span>, value: 'floors' },
                { label: <span><EnvironmentOutlined /> {t('menu.locations')}</span>, value: 'locations' },
              ]}
            />
          </div>
        }
        open={!!fullscreenId}
        onCancel={() => setSearchParams((p) => { p.delete('fullscreen'); p.delete('fsTab'); return p; })}
        footer={null}
        width="100vw"
        style={{ top: 0, maxWidth: '100vw', margin: 0, padding: 0 }}
        styles={{ body: { height: 'calc(100vh - 55px)', overflow: 'auto', padding: '16px 24px' } }}
      >
        {fullscreenId && (
          fullscreenTab === 'floors' ? (
            <FloorsSection buildingId={fullscreenId} search={search} />
          ) : (
            <LocationsSection buildingId={fullscreenId} search={search} />
          )
        )}
      </Modal>

      <QrModal entityType="building" entityId={qrEntityId} onClose={() => setQrEntityId(null)} />
    </div>
  );
}
