import { useState } from 'react';
import { Card, Button, Space, Input, Select, Switch, InputNumber, Form, Modal, Tag, Empty } from 'antd';
import { PlusOutlined, DeleteOutlined, EditOutlined, HolderOutlined, ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import type { TemplateField, FieldConfig } from '../checklistTemplates.api';

const FIELD_TYPES = [
  { value: 'text', labelKey: 'checklists.fieldType_text' },
  { value: 'number', labelKey: 'checklists.fieldType_number' },
  { value: 'checkbox', labelKey: 'checklists.fieldType_checkbox' },
  { value: 'yes_no', labelKey: 'checklists.fieldType_yes_no' },
  { value: 'select', labelKey: 'checklists.fieldType_select' },
  { value: 'multi_select', labelKey: 'checklists.fieldType_multi_select' },
  { value: 'date', labelKey: 'checklists.fieldType_date' },
  { value: 'file_upload', labelKey: 'checklists.fieldType_file_upload' },
  { value: 'photo', labelKey: 'checklists.fieldType_photo' },
  { value: 'signature', labelKey: 'checklists.fieldType_signature' },
];

interface Props {
  fields: TemplateField[];
  onChange: (fields: TemplateField[]) => void;
}

export function FieldsBuilder({ fields, onChange }: Props) {
  const { t } = useTranslation();
  const [editingField, setEditingField] = useState<TemplateField | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();

  const handleAdd = () => {
    const newField: TemplateField = {
      id: `temp_${Date.now()}`,
      orderNo: fields.length,
      fieldKey: `field_${fields.length + 1}`,
      fieldLabel: '',
      fieldType: 'text',
      fieldConfig: { required: false },
    };
    setEditingField(newField);
    form.setFieldsValue({
      fieldLabel: '',
      fieldKey: `field_${fields.length + 1}`,
      fieldType: 'text',
      category: '',
      required: false,
      placeholder: '',
      helpText: '',
      options: '',
      min: undefined,
      max: undefined,
    });
    setModalOpen(true);
  };

  const handleEdit = (field: TemplateField) => {
    setEditingField(field);
    form.setFieldsValue({
      fieldLabel: field.fieldLabel,
      fieldKey: field.fieldKey,
      fieldType: field.fieldType,
      category: field.category || '',
      required: field.fieldConfig?.required || false,
      placeholder: field.fieldConfig?.placeholder || '',
      helpText: field.fieldConfig?.helpText || '',
      options: field.fieldConfig?.options?.join(', ') || '',
      min: field.fieldConfig?.min,
      max: field.fieldConfig?.max,
    });
    setModalOpen(true);
  };

  const handleSaveField = () => {
    form.validateFields().then((values) => {
      const config: FieldConfig = {
        required: values.required,
        placeholder: values.placeholder || undefined,
        helpText: values.helpText || undefined,
        options: values.options ? values.options.split(',').map((o: string) => o.trim()).filter(Boolean) : undefined,
        min: values.min,
        max: values.max,
      };

      const updatedField: TemplateField = {
        ...editingField!,
        fieldLabel: values.fieldLabel,
        fieldKey: values.fieldKey,
        fieldType: values.fieldType,
        category: values.category || undefined,
        fieldConfig: config,
      };

      const exists = fields.find((f) => f.id === updatedField.id);
      if (exists) {
        onChange(fields.map((f) => f.id === updatedField.id ? updatedField : f));
      } else {
        onChange([...fields, updatedField]);
      }
      setModalOpen(false);
      setEditingField(null);
    });
  };

  const handleDelete = (id: string) => {
    onChange(fields.filter((f) => f.id !== id));
  };

  const handleMove = (index: number, direction: -1 | 1) => {
    const newFields = [...fields];
    const target = index + direction;
    if (target < 0 || target >= newFields.length) return;
    const temp = newFields[index]!;
    newFields[index] = newFields[target]!;
    newFields[target] = temp;
    onChange(newFields.map((f, i) => ({ ...f, orderNo: i })));
  };

  const fieldTypeLabel = (type: string) => {
    const ft = FIELD_TYPES.find((f) => f.value === type);
    return ft ? t(ft.labelKey) : type;
  };

  const watchFieldType = Form.useWatch('fieldType', form);

  return (
    <div>
      {fields.length === 0 ? (
        <Empty description={t('checklists.noFields')} style={{ margin: '40px 0' }} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {fields.map((field, index) => (
            <Card key={field.id} size="small" style={{ borderLeft: `3px solid ${field.fieldConfig?.required ? '#ff4d4f' : '#1677ff'}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <HolderOutlined style={{ color: '#999', cursor: 'grab' }} />
                <div style={{ flex: 1 }}>
                  <strong>{field.fieldLabel || field.fieldKey}</strong>
                  <div style={{ fontSize: 12, color: '#888' }}>
                    <Tag>{fieldTypeLabel(field.fieldType)}</Tag>
                    {field.fieldConfig?.required && <Tag color="red">{t('common.required')}</Tag>}
                    {field.category && <Tag color="blue">{field.category}</Tag>}
                    <span style={{ marginLeft: 4 }}>{field.fieldKey}</span>
                  </div>
                </div>
                <Space size="small">
                  <Button type="text" size="small" icon={<ArrowUpOutlined />} disabled={index === 0} onClick={() => handleMove(index, -1)} />
                  <Button type="text" size="small" icon={<ArrowDownOutlined />} disabled={index === fields.length - 1} onClick={() => handleMove(index, 1)} />
                  <Button type="text" size="small" icon={<EditOutlined />} onClick={() => handleEdit(field)} />
                  <Button type="text" size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete(field.id)} />
                </Space>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Button type="dashed" block icon={<PlusOutlined />} style={{ marginTop: 16 }} onClick={handleAdd}>
        {t('checklists.addField')}
      </Button>

      <Modal
        title={editingField && fields.find((f) => f.id === editingField.id) ? t('checklists.editField') : t('checklists.addField')}
        open={modalOpen}
        onOk={handleSaveField}
        onCancel={() => { setModalOpen(false); setEditingField(null); }}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item name="fieldLabel" label={t('checklists.fieldLabel')} rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="fieldKey" label={t('checklists.fieldKey')} rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="fieldType" label={t('checklists.fieldType')} rules={[{ required: true }]}>
            <Select options={FIELD_TYPES.map((ft) => ({ label: t(ft.labelKey), value: ft.value }))} />
          </Form.Item>
          <Form.Item name="category" label={t('checklists.category')}>
            <Input placeholder="Otaqlar, Təmizlik, Temperator..." />
          </Form.Item>
          <Form.Item name="required" label={t('checklists.required')} valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item name="placeholder" label={t('checklists.placeholder')}>
            <Input />
          </Form.Item>
          <Form.Item name="helpText" label={t('checklists.helpText')}>
            <Input />
          </Form.Item>
          {(watchFieldType === 'select' || watchFieldType === 'multi_select') && (
            <Form.Item name="options" label={t('checklists.optionsCommaSep')} rules={[{ required: true }]}>
              <Input.TextArea rows={2} placeholder="Option1, Option2, Option3" />
            </Form.Item>
          )}
          {watchFieldType === 'number' && (
            <Space>
              <Form.Item name="min" label={t('checklists.min')}>
                <InputNumber />
              </Form.Item>
              <Form.Item name="max" label={t('checklists.max')}>
                <InputNumber />
              </Form.Item>
            </Space>
          )}
        </Form>
      </Modal>
    </div>
  );
}
