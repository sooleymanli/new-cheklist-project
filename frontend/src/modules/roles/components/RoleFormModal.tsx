import { useEffect } from 'react';
import { Modal, Form, Input, App } from 'antd';
import { useTranslation } from 'react-i18next';
import { useCreateRoleMutation, useUpdateRoleMutation, type Role } from '../roles.api';

interface Props {
  open: boolean;
  role: Role | null;
  onClose: () => void;
}

export function RoleFormModal({ open, role, onClose }: Props) {
  const { t } = useTranslation();
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [createRole, { isLoading: creating }] = useCreateRoleMutation();
  const [updateRole, { isLoading: updating }] = useUpdateRoleMutation();

  const isEdit = !!role;

  useEffect(() => {
    if (open) {
      if (role) {
        form.setFieldsValue({ name: role.name, description: role.description });
      } else {
        form.resetFields();
      }
    }
  }, [open, role, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      let res;
      if (isEdit) {
        res = await updateRole({ id: role.id, body: values }).unwrap();
      } else {
        res = await createRole(values).unwrap();
      }
      message.success(res.message || '✓');
      onClose();
    } catch (err: any) {
      if (err?.data?.message) message.error(err.data.message);
    }
  };

  return (
    <Modal
      title={isEdit ? t('common.edit') : t('common.create')}
      open={open}
      onOk={handleSubmit}
      onCancel={onClose}
      confirmLoading={creating || updating}
      okText={t('common.save')}
      cancelText={t('common.cancel')}
      destroyOnClose
      mask={{ enabled: true, blur: true }}
    >
      <Form form={form} layout="vertical" validateMessages={{ required: '${label} ' + t('common.required') }}>
        <Form.Item name="name" label={t('roles.name')} rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item name="description" label={t('roles.description')}>
          <Input.TextArea rows={3} />
        </Form.Item>
      </Form>
    </Modal>
  );
}
