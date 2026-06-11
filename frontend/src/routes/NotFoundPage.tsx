import { Result, Button } from 'antd';
import { useTranslation } from 'react-i18next';

export function NotFoundPage() {
  const { t } = useTranslation();

  return (
    <Result
      status="404"
      title={t('error.notFoundTitle')}
      subTitle={t('error.notFoundSubtitle')}
      extra={
        <Button type="primary" href="/dashboard">
          {t('error.goHome')}
        </Button>
      }
    />
  );
}
