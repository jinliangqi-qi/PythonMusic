import React, { useState, useEffect } from 'react';
import { Layout, Menu, theme, Button, Avatar, Dropdown, Spin } from 'antd';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
  DashboardOutlined,
  PackageOutlined,
  ShoppingCartOutlined,
  UsersOutlined,
  ShoppingOutlined,
  StockOutlined,
  BugOutlined
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useUserStore } from '../store/useUserStore';
import { getUserInfo } from '../api/auth';
import ResponsiveContainer from './ResponsiveContainer';

const { Header, Sider, Content } = Layout;

const BasicLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const {
    token: { borderRadiusLG },
  } = theme.useToken();
  const navigate = useNavigate();
  const location = useLocation();
  const { userInfo, setUserInfo, clearUser, hasRole } = useUserStore();
  const [loadingUser, setLoadingUser] = useState(!userInfo);

  // 响应式监听逻辑
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 1440) {
        setCollapsed(true);
      } else {
        setCollapsed(false);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const initUser = async () => {
      if (!userInfo) {
        setLoadingUser(true);
        try {
          const res: any = await getUserInfo();
          setUserInfo(res);
        } catch (error) {
          console.error('Failed to fetch user info:', error);
          // 如果获取用户信息失败，可能需要重新登录，或者仅显示部分无权限菜单
        } finally {
          setLoadingUser(false);
        }
      } else {
        setLoadingUser(false);
      }
    };
    initUser();
  }, [userInfo, setUserInfo]);

  const handleLogout = () => {
    clearUser();
    navigate('/login');
  };

  const menuItems = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: '仪表盘',
    },
    {
      key: '/products',
      icon: <PackageOutlined />,
      label: '产品管理',
    },
    {
      key: '/suppliers',
      icon: <ShoppingCartOutlined />,
      label: '供应商管理',
    },
    {
      key: '/customers',
      icon: <UsersOutlined />,
      label: '客户管理',
    },
    {
      key: '/purchases',
      icon: <ShoppingCartOutlined />,
      label: '采购管理',
    },
    {
      key: '/sales',
      icon: <ShoppingOutlined />,
      label: '销售管理',
    },
    {
      key: '/inventory',
      icon: <StockOutlined />,
      label: '库存管理',
    },
    {
      key: '/users',
      icon: <UserOutlined />,
      label: '用户管理',
      roles: ['super_admin', 'admin']
    },
    {
      key: '/sys_logs',
      icon: <BugOutlined />,
      label: '日志管理',
      roles: ['super_admin', 'admin']
    },
  ];

  // 根据权限过滤菜单
  const filteredMenuItems = menuItems.filter(item => {
    // 如果没有配置 roles，则默认所有人可见
    if (!item.roles || item.roles.length === 0) return true;
    
    // 如果正在加载用户信息，暂时不显示需要权限的菜单，防止闪烁或错误
    // 但为了避免菜单全空，可以保留 Dashboard
    if (loadingUser && item.key !== '/dashboard') return false;

    // 如果加载完成但仍无用户信息（可能获取失败），隐藏
    if (!userInfo && !loadingUser) return false;

    return hasRole(item.roles);
  });

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider 
        trigger={null} 
        collapsible 
        collapsed={collapsed}
        width={240} 
        theme="light"
        style={{
          overflow: 'auto',
          height: '100vh',
          position: 'sticky',
          top: 0,
          left: 0,
          zIndex: 100,
          background: 'rgba(255,255,255,0.6)',
          backdropFilter: 'blur(20px) saturate(180%)',
          borderRight: '1px solid rgba(255,255,255,0.3)'
        }}
        breakpoint="lg"
        onBreakpoint={(broken) => {
          setCollapsed(broken);
        }}
      >
        <div className="demo-logo-vertical" style={{ 
          height: 64, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          color: '#1d1d1f',
          fontSize: 18,
          fontWeight: 600,
          background: 'transparent',
          borderBottom: '1px solid rgba(255,255,255,0.3)'
        }}>
          {collapsed ? 'I' : '进销存管理'}
        </div>
        <Menu
          theme="light"
          mode="inline"
          defaultSelectedKeys={['/dashboard']}
          selectedKeys={[location.pathname]}
          items={filteredMenuItems}
          onClick={({ key }) => navigate(key)}
          style={{ borderRight: 'none', background: 'transparent', padding: '8px' }}
        />
        {loadingUser && (
           <div style={{ textAlign: 'center', padding: 20 }}>
             <Spin size="small" />
           </div>
        )}
      </Sider>
      <Layout style={{ background: 'transparent' }}>
        <Header style={{ 
          padding: 0, 
          background: 'rgba(255,255,255,0.6)',
          backdropFilter: 'blur(20px) saturate(180%)',
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          paddingRight: 24,
          position: 'sticky',
          top: 0,
          zIndex: 99,
          borderBottom: '1px solid rgba(255,255,255,0.3)',
          boxShadow: 'none'
        }}>
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{
              fontSize: '16px',
              width: 64,
              height: 64,
            }}
          />
          <Dropdown
            menu={{
              items: [
                {
                  key: 'logout',
                  label: '退出登录',
                  onClick: handleLogout
                }
              ]
            }}
          >
            <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Avatar icon={<UserOutlined />} src={userInfo?.avatar} />
              <span>{userInfo?.nickname || userInfo?.username || 'User'}</span>
            </div>
          </Dropdown>
        </Header>
        <Content
          style={{
            margin: '24px 16px',
            // padding: 24, // 移交给 ResponsiveContainer 管理 padding
            minHeight: 280,
            // background: colorBgContainer, // 背景色也可根据需要调整
            borderRadius: borderRadiusLG,
          }}
        >
          {/* 使用响应式容器包裹内容区域 */}
          <ResponsiveContainer>
             <Outlet />
          </ResponsiveContainer>
        </Content>
      </Layout>
    </Layout>
  );
};

export default BasicLayout;
