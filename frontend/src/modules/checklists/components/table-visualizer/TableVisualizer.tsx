import { useState, useCallback, useRef, useEffect } from 'react';
import { Button, Input, InputNumber, Modal, Form, Select, Switch, Radio, TreeSelect, Slider } from 'antd';
import { PlusOutlined, ZoomInOutlined, ZoomOutOutlined, ExpandOutlined, FunctionOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  horizontalListSortingStrategy,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import type { TableColumn, TableLocation } from './types';
import { SortableColumnHeader } from './SortableColumnHeader';
import { OptionsEditor } from './OptionsEditor';
import { SortableRow } from './SortableRow';

interface Props {
  columns: TableColumn[];
  onColumnsChange: (columns: TableColumn[]) => void;
  locations: TableLocation[];
  allLocations: { id: string; name: string }[];
  onLocationsChange: (locations: TableLocation[]) => void;
  locationTreeData?: any[];
}

export function TableVisualizer({ columns, onColumnsChange, locations, allLocations, onLocationsChange, locationTreeData }: Props) {
  const { t } = useTranslation();
  const [settingsColumnId, setSettingsColumnId] = useState<string | null>(null);
  const [settingsForm] = Form.useForm();
  const [addLocationOpen, setAddLocationOpen] = useState(false);
  const [pendingLocationValues, setPendingLocationValues] = useState<string[]>([]);
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({});

  // Canvas mode toggle
  const [canvasMode, setCanvasMode] = useState(false);

  // Zoom & Pan state
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef({ x: 0, y: 0 });
  const translateStart = useRef({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.05 : 0.05;
      setScale((s) => Math.min(3, Math.max(0.2, s + delta)));
    }
  }, []);

  const handleCanvasMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 1) {
      e.preventDefault();
      setIsPanning(true);
      panStart.current = { x: e.clientX, y: e.clientY };
      translateStart.current = { ...translate };
    }
  }, [translate]);

  const handleCanvasMouseMove = useCallback((e: React.MouseEvent) => {
    if (isPanning) {
      setTranslate({
        x: translateStart.current.x + (e.clientX - panStart.current.x),
        y: translateStart.current.y + (e.clientY - panStart.current.y),
      });
    }
  }, [isPanning]);

  const handleCanvasMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  // Space key for panning
  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat) {
        el.style.cursor = 'grab';
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        el.style.cursor = '';
        setIsPanning(false);
      }
    };
    const onMouseDown = (e: MouseEvent) => {
      if (e.button === 0 && el.style.cursor === 'grab') {
        setIsPanning(true);
        panStart.current = { x: e.clientX, y: e.clientY };
        translateStart.current = { ...translate };
        el.style.cursor = 'grabbing';
      }
    };
    el.addEventListener('keydown', handleKeyDown);
    el.addEventListener('keyup', handleKeyUp);
    el.addEventListener('mousedown', onMouseDown as any);
    return () => {
      el.removeEventListener('keydown', handleKeyDown);
      el.removeEventListener('keyup', handleKeyUp);
      el.removeEventListener('mousedown', onMouseDown as any);
    };
  }, [translate]);

  const resetView = () => {
    setScale(1);
    setTranslate({ x: 0, y: 0 });
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor),
  );

  const handleColumnDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = columns.findIndex((c) => c.id === active.id);
      const newIndex = columns.findIndex((c) => c.id === over.id);
      onColumnsChange(arrayMove(columns, oldIndex, newIndex));
    }
  };

  const handleRowDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = locations.findIndex((l) => l.id === active.id);
      const newIndex = locations.findIndex((l) => l.id === over.id);
      onLocationsChange(arrayMove(locations, oldIndex, newIndex));
    }
  };

  const handleColumnResize = useCallback((id: string, width: number) => {
    setColumnWidths((prev) => ({ ...prev, [id]: width }));
  }, []);

  const getColumnWidth = (id: string) => columnWidths[id] as number | undefined;

  const handleAddColumn = () => {
    const newCol: TableColumn = {
      id: `col_${Date.now()}`,
      label: '',
      type: 'yes_no',
      required: false,
      fileRequirement: 'none',
    };
    onColumnsChange([...columns, newCol]);
    settingsForm.setFieldsValue({
      label: '',
      type: 'yes_no',
      required: false,
      fileRequirement: 'none',
      textRequirement: 'none',
      placeholder: '',
      options: [],
      selectOptionType: 'text',
      normativeOperator: 'gte',
      normativeValue: undefined,
      normativeOptions: [],
      textSelectOptions: [],
      numberSelectOptions: [],
      yesNoNormative: 'both',
      formulaOperation: 'avg',
      formulaColumnIds: [],
      formulaExpression: '',
    });
    setSettingsColumnId(newCol.id);
  };

  const handleRename = (id: string, label: string) => {
    onColumnsChange(columns.map((c) => c.id === id ? { ...c, label } : c));
  };

  const handleDelete = (id: string) => {
    onColumnsChange(columns.filter((c) => c.id !== id));
  };

  const handleOpenSettings = (id: string) => {
    const col = columns.find((c) => c.id === id);
    if (col) {
      settingsForm.setFieldsValue({
        label: col.label,
        type: col.type,
        required: col.required,
        fileRequirement: col.fileRequirement,
        textRequirement: col.textRequirement ?? 'none',
        placeholder: col.placeholder ?? '',
        options: col.options ?? [],
        selectOptionType: col.selectOptionType ?? 'text',
        normativeOperator: col.normativeOperator ?? 'gte',
        normativeValue: col.normativeValue,
        normativeOptions: col.normativeOptions ?? [],
        textSelectOptions: col.textSelectOptions ?? [],
        numberSelectOptions: col.numberSelectOptions ?? [],
        yesNoNormative: col.yesNoNormative ?? 'both',
        formulaOperation: col.formulaOperation ?? 'avg',
        formulaColumnIds: col.formulaColumnIds ?? [],
        formulaExpression: col.formulaExpression ?? '',
      });
      setSettingsColumnId(id);
    }
  };

  const handleSaveSettings = () => {
    const values = settingsForm.getFieldsValue();
    onColumnsChange(columns.map((c) =>
      c.id === settingsColumnId ? {
        ...c,
        label: values.label,
        type: values.type,
        required: values.required,
        fileRequirement: values.fileRequirement,
        textRequirement: values.textRequirement,
        placeholder: values.placeholder,
        options: values.options,
        selectOptionType: values.selectOptionType,
        normativeOperator: values.normativeOperator,
        normativeValue: values.normativeValue,
        normativeOptions: values.normativeOptions,
        textSelectOptions: values.textSelectOptions,
        numberSelectOptions: values.numberSelectOptions,
        yesNoNormative: values.yesNoNormative,
        formulaOperation: values.formulaOperation,
        formulaColumnIds: values.formulaColumnIds,
        formulaExpression: values.formulaExpression,
      } : c
    ));
    setSettingsColumnId(null);
  };

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>

      {/* Table content (shared between modes) */}
      {(() => {
        const tableContent = (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleColumnDragEnd}>
            <SortableContext items={columns.map((c) => c.id)} strategy={horizontalListSortingStrategy}>
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleRowDragEnd}>
                <SortableContext items={locations.map((l) => l.id)} strategy={verticalListSortingStrategy}>
                  <table style={{ borderCollapse: 'collapse', fontSize: 13, width: 'max-content' }}>
                    <thead>
                      <tr>
                        <th style={{
                          background: '#fafafa',
                          border: '1px solid #e8e8e8',
                          padding: '8px 12px',
                          whiteSpace: 'nowrap',
                          fontWeight: 600,
                          textAlign: 'left',
                          position: 'sticky',
                          left: 0,
                          zIndex: 2,
                        }}>
                          {t('checklists.locations')}
                        </th>
                        {columns.map((col) => (
                          <SortableColumnHeader
                            key={col.id}
                            column={col}
                            onRename={handleRename}
                            onDelete={handleDelete}
                            onOpenSettings={handleOpenSettings}
                            width={getColumnWidth(col.id)}
                            onResize={handleColumnResize}
                          />
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {locations.length === 0 ? (
                        <tr>
                          <td
                            colSpan={columns.length + 1}
                            style={{ border: '1px solid #e8e8e8', padding: 24, textAlign: 'center', color: '#999' }}
                          >
                            {t('checklists.noLocationsSelected')}
                          </td>
                        </tr>
                      ) : (
                        locations.map((loc) => (
                          <SortableRow
                            key={loc.id}
                            loc={loc}
                            columns={columns}
                            locations={locations}
                            onLocationsChange={onLocationsChange}
                            columnWidths={Object.fromEntries(columns.map((c) => [c.id, getColumnWidth(c.id)]))}
                          />
                        ))
                      )}
                    </tbody>
                  </table>
                </SortableContext>
              </DndContext>
            </SortableContext>
          </DndContext>
        );

        return (<>
      {/* Toolbar */}
      <div style={{ marginBottom: 12, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAddColumn}>
          {t('checklists.addColumn')}
        </Button>
        <Button icon={<PlusOutlined />} onClick={() => {
          setPendingLocationValues(locations.map((l) => `location:${l.id}`));
          setAddLocationOpen(true);
        }}>
          {t('checklists.addLocation')}
        </Button>
        <div style={{ flex: 1 }} />
        {canvasMode && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#f5f5f5', borderRadius: 6, padding: '2px 8px' }}>
            <Button type="text" size="small" icon={<ZoomOutOutlined />} onClick={() => setScale((s) => Math.max(0.2, s - 0.1))} />
            <Slider
              min={20}
              max={300}
              value={Math.round(scale * 100)}
              onChange={(v) => setScale(v / 100)}
              style={{ width: 100, margin: '0 4px' }}
              tooltip={{ formatter: (v) => `${v}%` }}
            />
            <Button type="text" size="small" icon={<ZoomInOutlined />} onClick={() => setScale((s) => Math.min(3, s + 0.1))} />
            <span style={{ fontSize: 11, color: '#666', minWidth: 36, textAlign: 'center' }}>{Math.round(scale * 100)}%</span>
            <Button type="text" size="small" icon={<ExpandOutlined />} onClick={resetView} title="Reset" />
          </div>
        )}
        <Button
          type={canvasMode ? 'primary' : 'default'}
          icon={<ExpandOutlined />}
          onClick={() => { setCanvasMode((v) => !v); resetView(); }}
        >
          {t('checklists.canvasMode')}
        </Button>
      </div>

      {canvasMode ? (
        /* Canvas mode - zoom & pan */
        <div
          ref={canvasRef}
          tabIndex={0}
          onWheel={handleWheel}
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
          onMouseLeave={handleCanvasMouseUp}
          style={{
            flex: 1,
            overflow: 'hidden',
            position: 'relative',
            background: '#f0f0f0',
            borderRadius: 8,
            cursor: isPanning ? 'grabbing' : undefined,
          }}
        >
          <div style={{
            transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`,
            transformOrigin: '0 0',
            padding: 24,
            display: 'inline-block',
          }}>
            {tableContent}
          </div>
        </div>
      ) : (
        /* Normal mode - scrollable */
        <div style={{ flex: 1, overflow: 'auto' }}>
          {tableContent}
        </div>
      )}
      </>);
      })()}

      {/* Column Settings Modal */}
      <Modal
        title={t('checklists.columnSettings')}
        open={!!settingsColumnId}
        onOk={handleSaveSettings}
        onCancel={() => setSettingsColumnId(null)}
        okText={t('common.save')}
        cancelText={t('common.cancel')}
        destroyOnClose
      >
        <Form form={settingsForm} layout="vertical">
          <Form.Item name="label" label={t('checklists.columnName')} rules={[{ required: true }]}>
            <Input placeholder={t('checklists.columnName')} />
          </Form.Item>
          <Form.Item name="type" label={t('checklists.fieldType')}>
            <Select
              options={[
                { label: t('checklists.fieldType_yes_no'), value: 'yes_no' },
                { label: t('checklists.fieldType_text'), value: 'text' },
                { label: t('checklists.fieldType_number'), value: 'number' },
                { label: t('checklists.fieldType_select'), value: 'select' },
                { label: t('checklists.fieldType_photo'), value: 'photo' },
                { label: t('checklists.fieldType_file_upload'), value: 'file_upload' },
                { label: t('checklists.fieldType_signature'), value: 'signature' },
                { label: t('checklists.fieldType_formula'), value: 'formula' },
              ]}
            />
          </Form.Item>
          <Form.Item noStyle shouldUpdate={(prev, cur) => prev.type !== cur.type}>
            {({ getFieldValue }) => {
              const colType = getFieldValue('type');
              if (colType === 'formula') return null;
              return (
                <Form.Item name="required" label={t('checklists.required')} valuePropName="checked">
                  <Switch />
                </Form.Item>
              );
            }}
          </Form.Item>
          <Form.Item noStyle shouldUpdate={(prev, cur) => prev.type !== cur.type}>
            {({ getFieldValue }) => {
              const colType = getFieldValue('type');
              return (
                <>
                  {colType === 'yes_no' && (
                    <Form.Item name="fileRequirement" label={t('checklists.fileRequirement')}>
                      <Radio.Group style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <Radio value="onNo">{t('checklists.fileReq_onNo')}</Radio>
                        <Radio value="onYes">{t('checklists.fileReq_onYes')}</Radio>
                        <Radio value="always">{t('checklists.fileReq_always')}</Radio>
                        <Radio value="none">{t('checklists.fileReq_none')}</Radio>
                        <Radio value="optional">{t('checklists.fileReq_optional')}</Radio>
                      </Radio.Group>
                    </Form.Item>
                  )}
                  {colType === 'yes_no' && (
                    <Form.Item name="yesNoNormative" label={t('checklists.normative')}>
                      <Radio.Group style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <Radio value="yes">{t('checklists.yes')}</Radio>
                        <Radio value="no">{t('checklists.no')}</Radio>
                        <Radio value="both">{t('checklists.norm_both')}</Radio>
                      </Radio.Group>
                    </Form.Item>
                  )}
                  {(colType === 'text' || colType === 'number') && (
                    <Form.Item name="fileRequirement" label={t('checklists.fileRequirement')}>
                      <Radio.Group style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <Radio value="required">{t('checklists.fileReq_required')}</Radio>
                        <Radio value="optional">{t('checklists.fileReq_optional')}</Radio>
                        <Radio value="none">{t('checklists.fileReq_none')}</Radio>
                      </Radio.Group>
                    </Form.Item>
                  )}
                  {(colType === 'text' || colType === 'number' || colType === 'select') && (
                    <Form.Item name="placeholder" label={t('checklists.placeholder')}>
                      <Input placeholder={t('checklists.placeholder')} />
                    </Form.Item>
                  )}
                  {colType === 'number' && (
                    <div style={{ padding: 10, background: '#f6f8fa', borderRadius: 6, border: '1px solid #e8e8e8', marginBottom: 16 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8, color: '#333' }}>{t('checklists.normative')}</div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <Form.Item name="normativeOperator" noStyle>
                          <Select
                            style={{ flex: 1 }}
                            options={[
                              { label: t('checklists.norm_gte'), value: 'gte' },
                              { label: t('checklists.norm_lte'), value: 'lte' },
                              { label: t('checklists.norm_eq'), value: 'eq' },
                            ]}
                          />
                        </Form.Item>
                        <Form.Item name="normativeValue" noStyle>
                          <InputNumber style={{ flex: 1 }} placeholder={t('checklists.normativeValue')} />
                        </Form.Item>
                      </div>
                    </div>
                  )}
                  {colType === 'select' && (
                    <Form.Item label={t('checklists.options')}>
                      <Form.Item name="options" noStyle>
                        <OptionsEditor
                          selectOptionType={settingsForm.getFieldValue('selectOptionType') ?? 'text'}
                          normativeOperator={settingsForm.getFieldValue('normativeOperator')}
                          normativeValue={settingsForm.getFieldValue('normativeValue')}
                          normativeOptions={settingsForm.getFieldValue('normativeOptions') ?? []}
                          textSelectOptions={settingsForm.getFieldValue('textSelectOptions') ?? []}
                          numberSelectOptions={settingsForm.getFieldValue('numberSelectOptions') ?? []}
                          onSelectOptionTypeChange={(val) => settingsForm.setFieldValue('selectOptionType', val)}
                          onNormativeOperatorChange={(val) => settingsForm.setFieldValue('normativeOperator', val)}
                          onNormativeValueChange={(val) => settingsForm.setFieldValue('normativeValue', val)}
                          onNormativeOptionsChange={(val) => settingsForm.setFieldValue('normativeOptions', val)}
                          onTextSelectOptionsChange={(val) => settingsForm.setFieldValue('textSelectOptions', val)}
                          onNumberSelectOptionsChange={(val) => settingsForm.setFieldValue('numberSelectOptions', val)}
                        />
                      </Form.Item>
                      {/* Hidden fields to persist values */}
                      <Form.Item name="selectOptionType" hidden><Input /></Form.Item>
                      <Form.Item name="normativeOperator" hidden><Input /></Form.Item>
                      <Form.Item name="normativeValue" hidden><InputNumber /></Form.Item>
                      <Form.Item name="normativeOptions" hidden><Input /></Form.Item>
                      <Form.Item name="textSelectOptions" hidden><Input /></Form.Item>
                      <Form.Item name="numberSelectOptions" hidden><Input /></Form.Item>
                    </Form.Item>
                  )}
                  {colType === 'formula' && (
                    <div style={{ padding: 12, background: '#f6f8fa', borderRadius: 6, border: '1px solid #e8e8e8', marginBottom: 16 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 10, color: '#333', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <FunctionOutlined />
                        {t('checklists.formulaSettings')}
                      </div>
                      <Form.Item name="formulaOperation" label={t('checklists.formulaOperation')}>
                        <Select
                          options={[
                            { label: t('checklists.formula_avg'), value: 'avg' },
                            { label: t('checklists.formula_sum'), value: 'sum' },
                            { label: t('checklists.formula_min'), value: 'min' },
                            { label: t('checklists.formula_max'), value: 'max' },
                            { label: t('checklists.formula_custom'), value: 'custom' },
                          ]}
                        />
                      </Form.Item>
                      <Form.Item name="formulaColumnIds" label={t('checklists.formulaColumns')}>
                        <Select
                          mode="multiple"
                          placeholder={t('checklists.selectColumns')}
                          options={columns
                            .filter((c) => c.id !== settingsColumnId && c.type === 'number')
                            .map((c) => ({ label: c.label || c.id, value: c.id }))}
                        />
                      </Form.Item>
                      <Form.Item noStyle shouldUpdate={(prev, cur) => prev.formulaOperation !== cur.formulaOperation}>
                        {({ getFieldValue: gfv }) => gfv('formulaOperation') === 'custom' ? (
                          <>
                            <Form.Item name="formulaExpression" label={t('checklists.formulaExpression')}>
                              <Input.TextArea
                                rows={3}
                                placeholder="({col1} + {col2}) / {col3}"
                                style={{ fontFamily: 'monospace', fontSize: 13 }}
                              />
                            </Form.Item>
                            <div style={{ marginBottom: 12 }}>
                              <div style={{ fontSize: 11, fontWeight: 500, marginBottom: 6, color: '#666' }}>
                                {t('checklists.clickToInsert')}:
                              </div>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                                {columns
                                  .filter((c) => c.id !== settingsColumnId && c.type === 'number')
                                  .map((c) => (
                                    <Button
                                      key={c.id}
                                      size="small"
                                      type="dashed"
                                      style={{ fontSize: 11, fontFamily: 'monospace' }}
                                      onClick={() => {
                                        const current = settingsForm.getFieldValue('formulaExpression') || '';
                                        settingsForm.setFieldsValue({
                                          formulaExpression: current + `{${c.label || c.id}}`,
                                        });
                                      }}
                                    >
                                      {`{${c.label || c.id}}`}
                                    </Button>
                                  ))}
                              </div>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
                                {['+', '-', '*', '/', '(', ')', '.'].map((op) => (
                                  <Button
                                    key={op}
                                    size="small"
                                    style={{ fontSize: 13, fontFamily: 'monospace', minWidth: 32 }}
                                    onClick={() => {
                                      const current = settingsForm.getFieldValue('formulaExpression') || '';
                                      settingsForm.setFieldsValue({
                                        formulaExpression: current + ` ${op} `,
                                      });
                                    }}
                                  >
                                    {op}
                                  </Button>
                                ))}
                              </div>
                            </div>
                          </>
                        ) : null}
                      </Form.Item>
                      <div style={{ fontSize: 11, color: '#999', marginTop: 4 }}>
                        {t('checklists.formulaHint')}
                      </div>
                    </div>
                  )}
                </>
              );
            }}
          </Form.Item>
        </Form>
      </Modal>

      {/* Add Location Modal */}
      <Modal
        title={t('checklists.addLocation')}
        open={addLocationOpen}
        onCancel={() => { setAddLocationOpen(false); setPendingLocationValues([]); }}
        onOk={() => {
          const resolveLeafLocations = (values: string[]): string[] => {
            const ids = new Set<string>();
            const collectLeaves = (nodes: any[]): string[] => {
              const leaves: string[] = [];
              for (const node of nodes) {
                if (node.children && node.children.length > 0) {
                  leaves.push(...collectLeaves(node.children));
                } else if ((node.value as string).startsWith('location:')) {
                  leaves.push((node.value as string).replace('location:', ''));
                }
              }
              return leaves;
            };
            const findNode = (nodes: any[], value: string): any => {
              for (const node of nodes) {
                if (node.value === value) return node;
                if (node.children) {
                  const found = findNode(node.children, value);
                  if (found) return found;
                }
              }
              return null;
            };
            const tree = locationTreeData || [];
            for (const val of values) {
              if (val.startsWith('location:')) {
                ids.add(val.replace('location:', ''));
              } else {
                const node = findNode(tree, val);
                if (node) {
                  collectLeaves([node]).forEach((id) => ids.add(id));
                }
              }
            }
            return Array.from(ids);
          };

          const resolvedIds = resolveLeafLocations(pendingLocationValues);
          const updatedLocations = resolvedIds
            .map((id) => {
              const existing = locations.find((l) => l.id === id);
              if (existing) return existing;
              const loc = allLocations.find((l) => l.id === id);
              return loc ? { id: loc.id, name: loc.name, qrRequired: false } : null;
            })
            .filter(Boolean) as TableLocation[];
          onLocationsChange(updatedLocations);
          setPendingLocationValues([]);
          setAddLocationOpen(false);
        }}
        okText={t('checklists.add')}
      >
        {locationTreeData ? (
          <TreeSelect
            treeData={locationTreeData}
            value={pendingLocationValues}
            onChange={setPendingLocationValues}
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
        ) : (
          <div style={{ maxHeight: 400, overflow: 'auto' }}>
            {allLocations
              .filter((al) => !locations.some((l) => l.id === al.id))
              .map((loc) => (
                <div
                  key={loc.id}
                  style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '8px 12px', borderBottom: '1px solid #f0f0f0', cursor: 'pointer',
                  }}
                  onClick={() => {
                    onLocationsChange([...locations, loc]);
                  }}
                >
                  <span>{loc.name}</span>
                  <Button type="link" size="small">{t('checklists.add')}</Button>
                </div>
              ))}
            {allLocations.filter((al) => !locations.some((l) => l.id === al.id)).length === 0 && (
              <div style={{ padding: 24, textAlign: 'center', color: '#999' }}>
                {t('checklists.allLocationsAdded')}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
