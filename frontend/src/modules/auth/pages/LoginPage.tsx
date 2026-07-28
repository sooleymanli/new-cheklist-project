import { useState } from 'react';
import { App, Input, Button, Form } from 'antd';
import { MailOutlined, LockOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLoginMutation } from '../auth.api';
import { useAppDispatch, useAppSelector } from '@/shared/hooks/useStore';
import { setCredentials } from '@/store/auth.slice';
import { toggleTheme } from '@/store/ui.slice';
import './LoginPage.css';

const DEMO_EMAIL = 'admin@facility.com';
const DEMO_PASS = 'Admin123!';
const BRAND_PRIMARY = '#1677ff';
const BRAND_RADIUS = 8;

const LANGS = ['az', 'en', 'ru'] as const;

function CheckIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden="true">
      <circle cx="8" cy="8" r="7.25" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.55" />
      <path d="M4.8 8.2 L7 10.4 L11.2 5.8" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function LoginPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { message } = App.useApp();
  const [login, { isLoading }] = useLoginMutation();
  const isDark = useAppSelector((s) => s.ui.darkMode);
  const theme = isDark ? 'dark' : 'light';

  const [formError, setFormError] = useState<string | null>(null);

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/dashboard';

  const setLang = (lng: string) => i18n.changeLanguage(lng);

  const tr = (key: string) => t(`login.${key}`);

  const handleFinish = async (values: { email: string; password: string }) => {
    if (isLoading) return;
    setFormError(null);

    try {
      const data = await login({ email: values.email.trim(), password: values.password }).unwrap();
      dispatch(
        setCredentials({
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
        }),
      );
      message.success(t('auth.loginSuccess'));
      navigate(from, { replace: true });
    } catch (err: any) {
      setFormError(err?.data?.message || tr('errWrong'));
    }
  };

  return (
    <div
      className="login-app lg-split"
      data-theme={theme}
      style={{ ['--lg-primary' as never]: BRAND_PRIMARY, ['--lg-radius' as never]: `${BRAND_RADIUS}px` }}
    >
      {/* top-right chrome */}
      <div className="lg-chrome">
        <div className="lg-lang-switch" role="group" aria-label="Language">
          {LANGS.map((l) => (
            <button
              key={l}
              type="button"
              className={'lg-lang-btn' + (i18n.language === l ? ' active' : '')}
              onClick={() => setLang(l)}
            >
              {l.toUpperCase()}
            </button>
          ))}
        </div>
        <button
          type="button"
          className="lg-theme-toggle"
          aria-label={isDark ? 'Light mode' : 'Dark mode'}
          onClick={() => dispatch(toggleTheme())}
        >
          {isDark ? (
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
              <circle cx="12" cy="12" r="4.2" />
              <line x1="12" y1="2.5" x2="12" y2="5" />
              <line x1="12" y1="19" x2="12" y2="21.5" />
              <line x1="2.5" y1="12" x2="5" y2="12" />
              <line x1="19" y1="12" x2="21.5" y2="12" />
              <line x1="5.3" y1="5.3" x2="7" y2="7" />
              <line x1="17" y1="17" x2="18.7" y2="18.7" />
              <line x1="5.3" y1="18.7" x2="7" y2="17" />
              <line x1="17" y1="7" x2="18.7" y2="5.3" />
            </svg>
          ) : (
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
            </svg>
          )}
        </button>
      </div>

      {/* brand panel */}
      <aside className="lg-brand-panel">
        <div className="lg-glow g1" />
        <div className="lg-glow g2" />
        <img className="lg-brand-mark" src="/brand/mark-white.svg" alt="" draggable={false} />

        <div className="lg-brand-top">
          <img src="/brand/logo-white.svg" alt="Paşa Həyat" style={{ height: 44 }} draggable={false} />
        </div>

        <div className="lg-brand-mid">
          <h2 className="lg-brand-tagline">{tr('tagline')}</h2>

          <div className="lg-stack">
            <div className="lg-glass-card">
              <div className="lg-glass-head">
                <span className="lg-glass-loc">{tr('cardLocation')}</span>
                <span className="lg-glass-chip">{tr('cardStatus')}</span>
              </div>
              <ul className="lg-glass-list">
                {[tr('cardItem1'), tr('cardItem2'), tr('cardItem3')].map((x, i) => (
                  <li key={i}>
                    <CheckIcon size={15} />
                    <span>{x}</span>
                  </li>
                ))}
              </ul>
              <div className="lg-progress-row">
                <div className="lg-progress">
                  <div className="lg-progress-fill" />
                </div>
                <span className="lg-progress-num">87%</span>
              </div>
            </div>

            <div className="lg-qr">
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
                <path d="M4 8V5.5A1.5 1.5 0 0 1 5.5 4H8" />
                <path d="M16 4h2.5A1.5 1.5 0 0 1 20 5.5V8" />
                <path d="M20 16v2.5a1.5 1.5 0 0 1-1.5 1.5H16" />
                <path d="M8 20H5.5A1.5 1.5 0 0 1 4 18.5V16" />
                <line x1="7.5" y1="12" x2="16.5" y2="12" />
              </svg>
              <span>{tr('qrScanned')}</span>
            </div>
          </div>
        </div>

        <div className="lg-brand-foot">{tr('copyright')}</div>
      </aside>

      {/* form stage */}
      <main className="lg-stage">
        <div className="lg-stage-logo lg-only-mobile">
          <img src={isDark ? '/brand/logo-white.svg' : '/brand/logo-blue.svg'} alt="Paşa Həyat" style={{ height: 42 }} draggable={false} />
        </div>

        <div className="lg-card">
          <Form className="lg-form" layout="vertical" onFinish={handleFinish} requiredMark={false} noValidate >
            <h1 className="lg-title">{tr('welcome')}</h1>
            <p className="lg-subtitle">{tr('subtitle')}</p>

            {formError && (
              <div className="lg-alert lg-alert-error" role="alert">
                <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
                  <circle cx="8" cy="8" r="7" fill="none" stroke="currentColor" strokeWidth="1.5" />
                  <line x1="8" y1="4.5" x2="8" y2="8.8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                  <circle cx="8" cy="11.4" r="1" fill="currentColor" />
                </svg>
                <div>{formError}</div>
              </div>
            )}

            <Form.Item
              name="email"
              label={tr('email')}
              rules={[
                { required: true, message: tr('errEmailRequired') },
                { type: 'email', message: tr('errEmailInvalid') },
              ]}
            >
              <Input
                size="large"
                autoComplete="username"
                prefix={<MailOutlined />}
                placeholder={tr('emailPh')}
              />
            </Form.Item>

            <Form.Item
              name="password"
              label={tr('password')}
              rules={[{ required: true, message: tr('errPasswordRequired') }]}
              style={{marginTop:24}}
            >
              <Input.Password
                size="large"
                autoComplete="current-password"
                prefix={<LockOutlined />}
                placeholder={tr('passwordPh')}
              />
            </Form.Item>

            <div className="lg-form-row">
              <Button type="link" className="lg-link" style={{ padding: 0, height: 'auto' }}>
                {tr('forgot')}
              </Button>
            </div>

            <Button type="primary" size="large" htmlType="submit" block loading={isLoading} className="lg-submit-btn">
              {isLoading ? `${tr('checking')}…` : tr('login')}
            </Button>

            <div className="lg-demo-hint">
              {tr('demo')} <code>{DEMO_EMAIL}</code> · <code>{DEMO_PASS}</code>
            </div>
          </Form>
        </div>
      </main>
    </div>
  );
}
