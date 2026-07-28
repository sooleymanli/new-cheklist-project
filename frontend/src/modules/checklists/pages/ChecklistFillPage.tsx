import { useEffect } from 'react';
import { Card, Button, Form, Input, InputNumber, Select, Checkbox, DatePicker, Upload, App, Spin, Tag, Result } from 'antd';
import { ArrowLeftOutlined, SendOutlined, UploadOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import {
  useGetChecklistInstanceQuery,
  useSubmitChecklistInstanceMutation,
} from '../checklistInstances.api';

export default function ChecklistFillPage() {
  const { t } = useTranslation();
  const { message } = App.useApp();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [form] = Form.useForm();

  const { data: instance, isLoading } = useGetChecklistInstanceQuery(id!);
  const [submitChecklist, { isLoading: submitting }] = useSubmitChecklistInstanceMutation();

  // Pre-fill with existing responses (for rejected → re-edit)
  useEffect(() => {
    if (instance?.responses?.length) {
      const values: Record<string, any> = {};
      instance.responses.forEach((r) => {
        values[r.fieldId] = r.value;
        if (r.notes) values[`${r.fieldId}_notes`] = r.notes;
      });
      form.setFieldsValue(values);
    }
  }, [instance]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const fields = instance!.template.fields;
      const responses = fields.map((field) => ({
        fieldId: field.id,
        value: values[field.id] ?? null,
        notes: values[`${field.id}_notes`] || undefined,
      }));

      const res: any = await submitChecklist({ id: id!, responses }).unwrap();
      if (res?.message) message.success(res.message);
      navigate('/my-checklists');
    } catch (err: any) {
      if (err?.data?.message) message.error(err.data.message);
    }
  };

  if (isLoading) return <Spin size="large" style={{ display: 'flex', justifyContent: 'center', marginTop: '20vh' }} />;
  if (!instance) return <Result status="404" title={t('error.unexpected')} />;

  const renderField = (field: any) => {
    const config = field.fieldConfig || {};
    const rules = config.required ? [{ required: true, message: t('common.required') }] : [];

    switch (field.fieldType) {
      case 'text':
        return (
          <Form.Item key={field.id} name={field.id} label={field.fieldLabel} rules={rules} help={config.helpText}>
            <Input placeholder={config.placeholder} />
          </Form.Item>
        );
      case 'number':
        return (
          <Form.Item key={field.id} name={field.id} label={field.fieldLabel} rules={rules} help={config.helpText}>
            <InputNumber style={{ width: '100%' }} min={config.min} max={config.max} placeholder={config.placeholder} />
          </Form.Item>
        );
      case 'checkbox':
        return (
          <Form.Item key={field.id} name={field.id} label={field.fieldLabel} valuePropName="checked" help={config.helpText}>
            <Checkbox />
          </Form.Item>
        );
      case 'yes_no':
        return (
          <Form.Item key={field.id} name={field.id} label={field.fieldLabel} rules={rules} help={config.helpText}>
            <Select options={[{ label: t('common.yes'), value: 'yes' }, { label: t('common.no'), value: 'no' }]} placeholder={config.placeholder} />
          </Form.Item>
        );
      case 'select':
        return (
          <Form.Item key={field.id} name={field.id} label={field.fieldLabel} rules={rules} help={config.helpText}>
            <Select options={config.options?.map((o: string) => ({ label: o, value: o }))} placeholder={config.placeholder} />
          </Form.Item>
        );
      case 'multi_select':
        return (
          <Form.Item key={field.id} name={field.id} label={field.fieldLabel} rules={rules} help={config.helpText}>
            <Select mode="multiple" options={config.options?.map((o: string) => ({ label: o, value: o }))} placeholder={config.placeholder} />
          </Form.Item>
        );
      case 'date':
        return (
          <Form.Item key={field.id} name={field.id} label={field.fieldLabel} rules={rules} help={config.helpText}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
        );
      case 'file_upload':
      case 'photo':
        return (
          <Form.Item key={field.id} name={field.id} label={field.fieldLabel} rules={rules} help={config.helpText} valuePropName="fileList" getValueFromEvent={(e) => e?.fileList}>
            <Upload
              action="/api/v1/files/upload"
              listType={field.fieldType === 'photo' ? 'picture-card' : 'text'}
              maxCount={5}
              accept={field.fieldType === 'photo' ? 'image/*' : undefined}
            >
              <Button icon={<UploadOutlined />}>{t('checklists.upload')}</Button>
            </Upload>
          </Form.Item>
        );
      case 'signature':
        return (
          <Form.Item key={field.id} name={field.id} label={field.fieldLabel} rules={rules} help={config.helpText}>
            <Input placeholder={t('checklists.signaturePlaceholder')} />
          </Form.Item>
        );
      default:
        return (
          <Form.Item key={field.id} name={field.id} label={field.fieldLabel} rules={rules}>
            <Input />
          </Form.Item>
        );
    }
  };

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/my-checklists')} />
        <Tag color="orange">{t(`checklists.instanceStatus_${instance.status}`)}</Tag>
      </div>

      {instance.location && (
        <div style={{ marginBottom: 16, color: '#666' }}>
          📍 {instance.location.building?.name} / {instance.location.floor?.name} / {instance.location.name}
        </div>
      )}

      <Card>
        <Form form={form} layout="vertical">
          {instance.template.fields.map((field) => renderField(field))}
        </Form>

        <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end' }}>
          <Button type="primary" icon={<SendOutlined />} loading={submitting} onClick={handleSubmit} size="large">
            {t('checklists.submit')}
          </Button>
        </div>
      </Card>
    </div>
  );
}
