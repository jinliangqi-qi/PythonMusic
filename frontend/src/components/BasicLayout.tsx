import React, { useState, useEffect } from 'react';
import { Layout, Menu, theme, Button, Avatar, Dropdown, Spin } from 'antd';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
  DashboardOutlined,
  SoundOutlined,
  TeamOutlined,
  FolderOutlined,
  TagsOutlined,
  AuditOutlined,
  BugOutlined
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useUserStore } from '../store/useUserStore';
import { getUserInfo } from '../api/auth';
import ResponsiveContainer from './ResponsiveContainer'; // 引入我们之前封装的容器
import MusicPlayer from './MusicPlayer';

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
      // roles: ['super_admin', 'admin', 'user', 'auditor'] // 仪表盘应该所有人可见
    },
    {
      key: '/users',
      icon: <UserOutlined />,
      label: '用户管理',
      roles: ['super_admin', 'admin']
    },
    {
      key: '/musics',
      icon: <SoundOutlined />,
      label: '音乐管理',
      roles: ['super_admin', 'admin', 'user', 'auditor']
    },
    {
      key: '/singers',
      icon: <TeamOutlined />,
      label: '歌手管理',
      roles: ['super_admin', 'admin']
    },
    {
      key: '/albums',
      icon: <FolderOutlined />,
      label: '专辑管理',
      roles: ['super_admin', 'admin']
    },
    {
      key: '/categories',
      icon: <FolderOutlined />,
      label: '分类管理',
      roles: ['super_admin', 'admin']
    },
    {
      key: '/tags',
      icon: <TagsOutlined />,
      label: '标签管理',
      roles: ['super_admin', 'admin']
    },
    {
      key: '/sys_logs',
      icon: <BugOutlined />,
      label: '日志管理',
      roles: ['super_admin', 'admin']
    },
    {
      key: '/audit',
      icon: <AuditOutlined />,
      label: '审核管理',
      roles: ['super_admin', 'auditor']
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
          {collapsed ? 'M' : 'Music Admin'}
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
        {/* 全局播放器 */}
        <div style={{ height: 80 }}></div> {/* 占位符，防止内容被遮挡 */}
        <MusicPlayer />
      </Layout>
    </Layout>
  );
};

export default BasicLayout;
