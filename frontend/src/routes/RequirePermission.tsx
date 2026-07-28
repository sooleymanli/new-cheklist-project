import { Result, Button } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { usePermissions } from '@/shared/hooks/usePermissions';

interface RequirePermissionProps {
  permission?: string;
  anyOf?: string[];
  children: React.ReactNode;
}

export function RequirePermission({ permission, anyOf, children }: RequirePermissionProps) {
  const { has, hasAny } = usePermissions();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const allowed = anyOf ? hasAny(anyOf) : has(permission);

  if (!allowed) {
    return (
      <Result
        status="403"
        title={t('error.forbiddenTitle')}
        subTitle={t('error.forbiddenSubtitle')}
        extra={
          <Button type="primary" onClick={() => navigate('/dashboard')}>
            {t('error.goHome')}
          </Button>
        }
      />
    );
  }

  return <>{children}</>;
}
