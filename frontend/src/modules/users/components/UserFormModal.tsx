import { useEffect } from 'react';
import { Modal, Form, Input, Select, App } from 'antd';
import { useTranslation } from 'react-i18next';
import { useCreateUserMutation, useUpdateUserMutation, type User } from '../users.api';
import { useGetRolesSelectQuery } from '@/modules/roles/roles.api';

// Azerbaijan mobile prefixes: 50, 51, 55, 60, 70, 77, 99, 10, 12
const AZ_PHONE_REGEX = /^\+994(50|51|55|60|70|77|99|10|12)\d{7}$/;

function formatPhoneInput(value: string): string {
  const digits = value.replace(/\D/g, '');
  // Remove leading 994 if user typed it (we add prefix automatically)
  let num = digits;
  if (num.startsWith('994')) num = num.slice(3);
  if (num.length === 0) return '+994 ';
  if (num.length <= 2) return `+994 ${num}`;
  if (num.length <= 5) return `+994 ${num.slice(0, 2)} ${num.slice(2)}`;
  if (num.length <= 7) return `+994 ${num.slice(0, 2)} ${num.slice(2, 5)} ${num.slice(5)}`;
  return `+994 ${num.slice(0, 2)} ${num.slice(2, 5)} ${num.slice(5, 7)} ${num.slice(7, 9)}`;
}

function stripPhone(value: string): string {
  return '+994' + value.replace(/\D/g, '').replace(/^994/, '');
}

interface Props {
  open: boolean;
  user: User | null;
  onClose: () => void;
}

export function UserFormModal({ open, user, onClose }: Props) {
  const { t } = useTranslation();
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const { data: roles } = useGetRolesSelectQuery();
  const [createUser, { isLoading: creating }] = useCreateUserMutation();
  const [updateUser, { isLoading: updating }] = useUpdateUserMutation();

  const isEdit = !!user;

  useEffect(() => {
    if (open) {
      if (user) {
        form.setFieldsValue({
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          mobile: user.mobile ? formatPhoneInput(user.mobile.replace('+994', '')) : '',
          position: user.position,
          roleId: user.role.id,
        });
      } else {
        form.resetFields();
      }
    }
  }, [open, user, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      // Strip phone formatting before sending
      if (values.mobile) {
        values.mobile = stripPhone(values.mobile);
      }
      let res;
      if (isEdit) {
        const { password, ...body } = values;
        res = await updateUser({ id: user.id, body }).unwrap();
      } else {
        res = await createUser(values).unwrap();
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
      destroyOnClose
            mask={{ enabled: true, blur: true }}

    >
      <Form form={form} layout="vertical" validateMessages={{ required: '${label} ' + t('common.required') }}>
        <Form.Item name="firstName" label={t('users.name')} rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item name="lastName" label={t('users.surname')} rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item name="email" label={t('auth.email')} rules={[{ required: true }, { type: 'email', message: t('common.invalidEmail') }]}>
          <Input />
        </Form.Item>
        {!isEdit && (
          <Form.Item name="password" label={t('auth.password')} rules={[{ required: true }, { min: 6, message: t('common.minLength', { count: 6 }) }]}>
            <Input.Password />
          </Form.Item>
        )}
        <Form.Item name="roleId" label={t('users.role')} rules={[{ required: true }]}>
          <Select options={roles?.map((r) => ({ label: r.name, value: r.id }))} />
        </Form.Item>
        <Form.Item
          name="mobile"
          label={t('users.phone')}
          rules={[
            { required: !isEdit, message: t('users.phoneInvalid') },
            {
              validator: (_, value) => {
                if (!value || value === '+994 ' || value.replace(/\D/g, '').length === 0) return Promise.resolve();
                const raw = stripPhone(value);
                if (AZ_PHONE_REGEX.test(raw)) return Promise.resolve();
                return Promise.reject(t('users.phoneInvalid'));
              },
            },
          ]}
          getValueFromEvent={(e) => formatPhoneInput(e.target.value)}
        >
          <Input placeholder="+994 50 999 33 66" maxLength={18} />
        </Form.Item>
        <Form.Item name="position" label={t('users.position')}>
          <Input />
        </Form.Item>
      </Form>
    </Modal>
  );
}
