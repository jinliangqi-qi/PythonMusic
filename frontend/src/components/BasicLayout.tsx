import React, { useState, useEffect } from 'react';
import { Layout, Menu, theme, Button, Avatar, Dropdown, Spin, Typography, Badge, Breadcrumb } from 'antd';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
  DashboardOutlined,
  PackageOutlined,
  ShoppingCartOutlined,
  TeamOutlined,
  DollarOutlined,
  StockOutlined,
  BugOutlined,
  UnorderedListOutlined,
  ShopOutlined,
  FileTextOutlined,
  DatabaseOutlined,
  BarChartOutlined,
  NavigationOutlined,
  BellOutlined,
  SettingsOutlined,
  LogoutOutlined,
  ChevronRightOutlined,
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useUserStore } from '../store/useUserStore';
import { getUserInfo } from '../api/auth';

const { Header, Sider, Content } = Layout;
const { Title, Text } = Typography;

const BasicLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const {
    token: { borderRadiusLG },
  } = theme.useToken();
  const navigate = useNavigate();
  const location = useLocation();
  const { userInfo, setUserInfo, clearUser, hasRole } = useUserStore();
  const [loadingUser, setLoadingUser] = useState(!userInfo);
  const [notificationCount, setNotificationCount] = useState(3);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 1200) {
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
      label: '数据看板',
    },
    {
      type: 'divider' as const,
    },
    {
      key: '/products',
      icon: <PackageOutlined />,
      label: '产品管理',
    },
    {
      key: '/categories',
      icon: <UnorderedListOutlined />,
      label: '分类管理',
    },
    {
      key: '/warehouses',
      icon: <ShopOutlined />,
      label: '仓库管理',
    },
    {
      type: 'divider' as const,
    },
    {
      key: '/suppliers',
      icon: <TeamOutlined />,
      label: '供应商管理',
    },
    {
      key: '/customers',
      icon: <UserOutlined />,
      label: '客户管理',
    },
    {
      type: 'divider' as const,
    },
    {
      key: '/purchases',
      icon: <ShoppingCartOutlined />,
      label: '采购订单',
    },
    {
      key: '/sales',
      icon: <DollarOutlined />,
      label: '销售订单',
    },
    {
      key: '/inventory',
      icon: <StockOutlined />,
      label: '库存管理',
    },
    {
      type: 'divider' as const,
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
      label: '系统日志',
      roles: ['super_admin', 'admin']
    },
    {
      key: '/app_logs',
      icon: <FileTextOutlined />,
      label: '应用日志',
      roles: ['super_admin', 'admin']
    },
  ];

  const filteredMenuItems = menuItems.filter(item => {
    if (item.type === 'divider') return true;
    if (!item.roles || item.roles.length === 0) return true;
    if (loadingUser && item.key !== '/dashboard') return false;
    if (!userInfo && !loadingUser) return false;
    return hasRole(item.roles);
  });

  const getBreadcrumbItems = () => {
    const pathMap: Record<string, string> = {
      '/dashboard': '数据看板',
      '/products': '产品管理',
      '/categories': '分类管理',
      '/warehouses': '仓库管理',
      '/suppliers': '供应商管理',
      '/customers': '客户管理',
      '/purchases': '采购订单',
      '/sales': '销售订单',
      '/inventory': '库存管理',
      '/users': '用户管理',
      '/sys_logs': '系统日志',
      '/app_logs': '应用日志',
    };
    const pathSegments = location.pathname.split('/').filter(s => s);
    return pathSegments.map((segment, index) => {
      const path = `/${pathSegments.slice(0, index + 1).join('/')}`;
      return {
        title: pathMap[path] || segment,
        href: index === pathSegments.length - 1 ? undefined : path,
      };
    });
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider 
        trigger={null} 
        collapsible 
        collapsed={collapsed}
        width={260} 
        theme="dark"
        style={{
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          top: 0,
          left: 0,
          zIndex: 100,
          background: 'linear-gradient(180deg, #1e1b4b 0%, #312e81 50%, #1e1b4b 100%)',
          borderRight: '1px solid rgba(255,255,255,0.08)',
        }}
        breakpoint="lg"
        onBreakpoint={(broken) => {
          setCollapsed(broken);
        }}
      >
        <div style={{ 
          height: 72, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: collapsed ? 'center' : 'space-between',
          padding: collapsed ? '0 16px' : '0 24px',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          background: 'rgba(0,0,0,0.2)',
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: collapsed ? 0 : 14 }}>
            <div style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 16px rgba(99, 102, 241, 0.4)',
            }}>
              <DatabaseOutlined style={{ fontSize: 22, color: '#fff' }} />
            </div>
            {!collapsed && (
              <div>
                <Title level={4} style={{ margin: 0, color: '#fff', fontSize: 18, fontWeight: 700 }}>
                  进销存
                </Title>
                <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', letterSpacing: 2 }}>INVENTORY</Text>
              </div>
            )}
          </div>
          {!collapsed && (
            <div style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: '#10b981',
              boxShadow: '0 0 8px rgba(16, 185, 129, 0.6)',
            }} />
          )}
        </div>
        
        <div style={{ padding: '20px 0', marginTop: 8 }}>
          <Menu
            theme="dark"
            mode="inline"
            defaultSelectedKeys={['/dashboard']}
            selectedKeys={[location.pathname]}
            items={filteredMenuItems}
            onClick={({ key }) => navigate(key)}
            style={{ 
              borderRight: 'none', 
              background: 'transparent', 
              padding: '0 8px',
            }}
            inlineIndent={0}
          />
        </div>

        {!collapsed && (
          <div style={{ 
            position: 'fixed', 
            bottom: 0, 
            left: 0, 
            width: 260,
            padding: '16px 20px',
            borderTop: '1px solid rgba(255,255,255,0.05)',
            background: 'rgba(30, 27, 75, 0.9)',
            backdropFilter: 'blur(12px)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <UserOutlined style={{ fontSize: 18, color: '#fff' }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 500, color: '#fff' }}>
                  {userInfo?.nickname || userInfo?.username || '用户'}
                </div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
                  {userInfo?.role || '普通用户'}
                </div>
              </div>
              <ChevronRightOutlined style={{ fontSize: 16, color: 'rgba(255,255,255,0.4)' }} />
            </div>
          </div>
        )}
        
        {loadingUser && (
           <div style={{ textAlign: 'center', padding: 20 }}>
             <Spin size="small" style={{ color: '#6366f1' }} />
           </div>
        )}
      </Sider>
      
      <Layout style={{ marginLeft: collapsed ? 80 : 260, transition: 'margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}>
        <Header style={{ 
          padding: 0, 
          background: 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(12px)',
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          paddingRight: 24,
          position: 'sticky',
          top: 0,
          zIndex: 99,
          borderBottom: '1px solid rgba(0,0,0,0.05)',
          boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{
                fontSize: '18px',
                width: 72,
                height: 72,
                color: '#64748b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            />
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingLeft: 8 }}>
              <Breadcrumb items={getBreadcrumbItems()} />
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Button type="text" icon={<BellOutlined />} style={{ fontSize: 20, color: '#64748b' }}>
              <Badge count={notificationCount} size="small" color="#ef4444" />
            </Button>
            <Button type="text" icon={<SettingsOutlined />} style={{ fontSize: 20, color: '#64748b' }} />
            
            <Dropdown
              menu={{
                items: [
                  {
                    key: 'profile',
                    label: '个人中心',
                    icon: <UserOutlined />,
                  },
                  {
                    key: 'settings',
                    label: '系统设置',
                    icon: <SettingsOutlined />,
                  },
                  {
                    type: 'divider' as const,
                  },
                  {
                    key: 'logout',
                    label: '退出登录',
                    icon: <LogoutOutlined />,
                    danger: true,
                    onClick: handleLogout
                  }
                ]
              }}
            >
              <div style={{ 
                cursor: 'pointer', 
                display: 'flex', 
                alignItems: 'center', 
                gap: 12,
                padding: '8px 16px',
                borderRadius: 10,
                transition: 'all 0.2s',
                hover: { background: '#f1f5f9' }
              }}>
                <Avatar 
                  icon={<UserOutlined />} 
                  src={userInfo?.avatar}
                  size={40}
                  style={{ 
                    backgroundColor: 'transparent',
                    border: '2px solid #e2e8f0',
                  }}
                />
                {!collapsed && (
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 14, fontWeight: 500, color: '#1e293b' }}>
                      {userInfo?.nickname || userInfo?.username || '用户'}
                    </div>
                    <div style={{ fontSize: 12, color: '#94a3b8' }}>
                      {userInfo?.role || '普通用户'}
                    </div>
                  </div>
                )}
              </div>
            </Dropdown>
          </div>
        </Header>
        
        <Content
          style={{
            margin: '24px',
            minHeight: 'calc(100vh - 120px)',
            borderRadius: borderRadiusLG,
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default BasicLayout;