import { Component, type ReactNode } from 'react';
import { Button, Result } from 'antd';
import i18n from '@/locales';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Result
            status="500"
            title={i18n.t('error.title')}
            subTitle={this.state.error?.message || i18n.t('error.unexpected')}
            extra={
              <Button type="primary" onClick={this.handleReset}>
                {i18n.t('error.goHome')}
              </Button>
            }
          />
        </div>
      );
    }

    return this.props.children;
  }
}
