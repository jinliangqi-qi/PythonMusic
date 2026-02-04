import { ConfigProvider, App as AntdApp } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import AppRouter from './router';
import './App.css';
import { useGlobalAntd } from './utils/globalAntd';

// 创建一个子组件来使用 App.useApp
const GlobalAntdContext = () => {
  useGlobalAntd();
  return null;
};

function App() {
  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        token: {
          colorPrimary: '#0071e3', // Apple Blue
          borderRadius: 12,
          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", Helvetica, Arial, sans-serif',
          colorText: '#1d1d1f',
          colorTextSecondary: '#86868b',
          colorBgLayout: '#f5f5f7',
        },
        components: {
          Button: {
            borderRadius: 999,
            controlHeight: 36,
          },
          Input: {
            controlHeight: 36,
            colorBgContainer: 'rgba(0,0,0,0.03)',
            colorBorder: 'transparent',
          },
          Select: {
            controlHeight: 36,
            colorBgContainer: 'rgba(0,0,0,0.03)',
            colorBorder: 'transparent',
          },
          Card: {
            colorBgContainer: 'rgba(255, 255, 255, 0.8)',
          }
        }
      }}
    >
      <AntdApp>
        <GlobalAntdContext />
        <AppRouter />
      </AntdApp>
    </ConfigProvider>
  );
}

export default App;
