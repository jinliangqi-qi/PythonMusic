import React, { useEffect } from 'react';
import { Form, Input, Button, Checkbox, App } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import { login, getUserInfo } from '../api/auth';
import { useUserStore } from '../store/useUserStore';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setToken, setUserInfo, token } = useUserStore();
  const [form] = Form.useForm();
  const { message } = App.useApp();

  useEffect(() => {
    if (token) {
      navigate('/dashboard');
    }
    // 恢复记住的账号
    const savedUsername = localStorage.getItem('remember_username');
    if (savedUsername) {
        form.setFieldsValue({ username: savedUsername, remember: true });
    }
  }, [token, navigate, form]);

  const onFinish = async (values: any) => {
    try {
      const res: any = await login({
        username: values.username,
        password: values.password
      });
      
      // 后端直接返回了 { token: { access_token: ... }, user_info: { ... } }
      // 前端拦截器可能没有处理这一层结构，导致直接返回了整个对象
      const accessToken = res.token?.access_token || res.access_token;
      
      if (!accessToken) {
          throw new Error('登录返回数据异常: 未找到 Token');
      }

      setToken(accessToken);
      message.success('登录成功');

      // 优先使用登录接口返回的用户信息，减少额外请求
      if (res.user_info) {
          setUserInfo(res.user_info);
      } else {
          try {
            const userInfo: any = await getUserInfo();
            setUserInfo(userInfo);
          } catch (e) {
            console.error('Failed to get user info', e);
            // 即使获取用户信息失败，也允许跳转，BasicLayout 会处理
          }
      }

      // 处理"记住我"逻辑
      if (values.remember) {
          localStorage.setItem('remember_username', values.username);
      } else {
          localStorage.removeItem('remember_username');
      }

      // 跳转回原页面或首页
      const from = (location.state as any)?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    } catch (error: any) {
      console.error(error);
      message.error(error.message || '登录失败，请检查用户名或密码');
    }
  };

  return (
    <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh', 
        background: '#f5f5f7',
        backgroundImage: `
            radial-gradient(at 0% 0%, hsla(253,16%,7%,0) 0, hsla(253,16%,7%,0) 50%), 
            radial-gradient(at 50% 0%, hsla(225,39%,30%,0) 0, hsla(225,39%,30%,0) 50%), 
            radial-gradient(at 100% 0%, hsla(339,49%,30%,0) 0, hsla(339,49%,30%,0) 50%)
        `,
        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", Helvetica, Arial, sans-serif',
        position: 'relative',
        overflow: 'hidden'
    }}>
        {/* 背景装饰球 - Orbs */}
        <div style={{
            position: 'absolute',
            top: '20%',
            left: '20%',
            width: '300px',
            height: '300px',
            background: 'linear-gradient(180deg, #ffc3a0 0%, #ffafbd 100%)',
            borderRadius: '50%',
            filter: 'blur(80px)',
            opacity: 0.6,
            zIndex: 0
        }} />
        <div style={{
            position: 'absolute',
            bottom: '20%',
            right: '20%',
            width: '400px',
            height: '400px',
            background: 'linear-gradient(180deg, #a1c4fd 0%, #c2e9fb 100%)',
            borderRadius: '50%',
            filter: 'blur(100px)',
            opacity: 0.6,
            zIndex: 0
        }} />

      <div style={{ 
          width: 440, 
          padding: '40px', 
          textAlign: 'center',
          background: 'rgba(255, 255, 255, 0.4)',
          backdropFilter: 'blur(20px) saturate(180%)',
          borderRadius: '24px',
          boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.4)',
          zIndex: 1
      }}>
        <div style={{ marginBottom: 40 }}>
            <h1 style={{ fontSize: 40, fontWeight: 700, margin: 0, color: '#1d1d1f' }}>音乐管理系统</h1>
            <p style={{ fontSize: 17, color: '#86868b', marginTop: 8 }}>登录以管理您的音乐库</p>
        </div>
        
        <Form
          form={form}
          name="login"
          initialValues={{ remember: true }}
          onFinish={onFinish}
          size="large"
          layout="vertical"
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: '请输入用户名' }]}
            style={{ marginBottom: 24 }}
          >
            <Input 
                placeholder="用户名 / 邮箱" 
                style={{ 
                    height: 56, 
                    fontSize: 17, 
                    borderRadius: 12,
                    background: 'rgba(255,255,255,0.6)',
                    border: '1px solid rgba(0,0,0,0.05)',
                    backdropFilter: 'blur(5px)'
                }} 
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
            style={{ marginBottom: 32 }}
          >
            <Input.Password 
                placeholder="密码" 
                style={{ 
                    height: 56, 
                    fontSize: 17, 
                    borderRadius: 12,
                    background: 'rgba(255,255,255,0.6)',
                    border: '1px solid rgba(0,0,0,0.05)',
                    backdropFilter: 'blur(5px)'
                }} 
            />
          </Form.Item>
          
          <Form.Item style={{ marginBottom: 24 }}>
            <Button type="primary" htmlType="submit" style={{ width: '100%', height: 50, fontSize: 17, borderRadius: 12 }}>
              登录
            </Button>
          </Form.Item>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Form.Item name="remember" valuePropName="checked" noStyle>
                <Checkbox style={{ color: '#86868b' }}>记住我</Checkbox>
              </Form.Item>
              <div>
                  <a href="/register" style={{ color: '#0071e3', fontSize: 14, marginRight: 16 }} onClick={e => { e.preventDefault(); navigate('/register'); }}>注册账号</a>
                  <a href="/forgot-password" style={{ color: '#0071e3', fontSize: 14 }} onClick={e => { e.preventDefault(); navigate('/forgot-password'); }}>忘记密码？</a>
              </div>
          </div>
          
          <div style={{ marginTop: 40, color: '#86868b', fontSize: 12 }}>
             测试账号: admin / 123456
          </div>
        </Form>
      </div>
    </div>
  );
};

export default Login;
