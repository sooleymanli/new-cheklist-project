import { Card, Form, Input, Button, Typography, App } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLoginMutation } from '../auth.api';
import { useAppDispatch } from '@/shared/hooks/useStore';
import { setCredentials } from '@/store/auth.slice';

const { Title } = Typography;

export default function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { message } = App.useApp();
  const [login, { isLoading }] = useLoginMutation();

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/dashboard';

  const onFinish = async (values: { email: string; password: string }) => {
    try {
      const data = await login(values).unwrap();
      dispatch(setCredentials({
        accessToken: data.accessToken,
        user: {
          id: data.user.id,
          email: data.user.email,
          firstName: data.user.firstName,
          lastName: data.user.lastName,
          role: {
            id: data.user.role.id,
            name: data.user.role.name,
            permissions: data.user.permissions,
          },
        },
      }));
      localStorage.setItem('refreshToken', data.refreshToken);
      message.success(t('auth.loginSuccess'));
      navigate(from, { replace: true });
    } catch (err: any) {
      message.error(err?.data?.message || t('auth.loginError'));
    }
  };

  return (
    <Card style={{ width: 400 }}>
      <Title level={3} style={{ textAlign: 'center' }}>
        {t('auth.loginTitle')}
      </Title>
      <Form
        name="login"
        onFinish={onFinish}
        layout="vertical"
        size="large"
      >
        <Form.Item
          name="email"
          rules={[
            { required: true, message: `${t('auth.email')} required` },
            { type: 'email', message: 'Invalid email' },
          ]}
        >
          <Input prefix={<UserOutlined />} placeholder={t('auth.email')} />
        </Form.Item>

        <Form.Item
          name="password"
          rules={[{ required: true, message: `${t('auth.password')} required` }]}
        >
          <Input.Password prefix={<LockOutlined />} placeholder={t('auth.password')} />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" block loading={isLoading}>
            {t('common.login')}
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
}
