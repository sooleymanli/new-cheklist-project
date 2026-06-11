import { Provider, useSelector } from 'react-redux';
import { ConfigProvider, theme, App as AntApp, Modal } from 'antd';
import { RouterProvider } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import azAZ from 'antd/locale/az_AZ';
import enUS from 'antd/locale/en_US';
import ruRU from 'antd/locale/ru_RU';
import { store, RootState } from '@/store';
import { router } from '@/routes';
import { ErrorBoundary } from './ErrorBoundary';
import '@/locales';

const antLocales: Record<string, typeof azAZ> = {
  az: azAZ,
  en: enUS,
  ru: ruRU,
};

function ThemedApp() {
  const isDark = useSelector((state: RootState) => state.ui.darkMode);
  const { i18n } = useTranslation();
  const antLocale = antLocales[i18n.language] || azAZ;

  return (
    <ConfigProvider
      locale={antLocale}
      theme={{
        algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          colorPrimary: '#1677ff',
        },
      }}
    >
      <AntApp>
        <RouterProvider router={router} />
      </AntApp>
    </ConfigProvider>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <Provider store={store}>
        <ThemedApp />
      </Provider>
    </ErrorBoundary>
  );
}

export default App;
