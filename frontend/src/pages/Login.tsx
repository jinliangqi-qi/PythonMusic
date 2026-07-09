import React, { useEffect } from 'react';
import { Form, Input, Button, Checkbox, App, Card, Typography } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import { login, getUserInfo } from '../api/auth';
import { useUserStore } from '../store/useUserStore';
import { DatabaseOutlined, LockOutlined, UserOutlined, EyeOutlined, EyeOffOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setToken, setUserInfo, token } = useUserStore();
  const [form] = Form.useForm();
  const [showPassword, setShowPassword] = React.useState(false);
  const { message } = App.useApp();

  useEffect(() => {
    if (token) {
      navigate('/dashboard');
    }
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
      
      const accessToken = res.token?.access_token || res.access_token;
      
      if (!accessToken) {
          throw new Error('登录返回数据异常: 未找到 Token');
      }

      setToken(accessToken);
      message.success('登录成功');

      if (res.user_info) {
          setUserInfo(res.user_info);
      } else {
          try {
            const userInfo: any = await getUserInfo();
            setUserInfo(userInfo);
          } catch (e) {
            console.error('Failed to get user info', e);
          }
      }

      if (values.remember) {
          localStorage.setItem('remember_username', values.username);
      } else {
          localStorage.removeItem('remember_username');
      }

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
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        position: 'relative',
        overflow: 'hidden'
    }}>
        {/* 背景装饰 */}
        <div style={{
            position: 'absolute',
            top: '-10%',
            right: '-10%',
            width: '500px',
            height: '500px',
            background: 'rgba(255,255,255,0.1)',
            borderRadius: '50%',
            filter: 'blur(80px)',
        }} />
        <div style={{
            position: 'absolute',
            bottom: '-10%',
            left: '-10%',
            width: '400px',
            height: '400px',
            background: 'rgba(255,255,255,0.08)',
            borderRadius: '50%',
            filter: 'blur(60px)',
        }} />

        <Card 
            style={{ 
                width: 420, 
                padding: '40px', 
                borderRadius: 12,
                border: 'none',
                boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                background: '#ffffff',
            }}
            bodyStyle={{ padding: 0 }}
        >
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <div style={{ 
                width: 64, 
                height: 64, 
                borderRadius: 16, 
                background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                margin: '0 auto 20px',
                boxShadow: '0 4px 16px rgba(24, 144, 255, 0.3)'
            }}>
              <DatabaseOutlined style={{ fontSize: 32, color: '#fff' }} />
            </div>
            <Title level={2} style={{ margin: 0, fontSize: 24, fontWeight: 600 }}>进销存管理系统</Title>
            <Text type="secondary" style={{ fontSize: 14, marginTop: 8, display: 'block' }}>登录以管理您的进销存业务</Text>
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
              style={{ marginBottom: 20 }}
            >
              <Input 
                placeholder="用户名" 
                prefix={<UserOutlined style={{ color: '#8f959e' }} />}
                style={{ height: 44, fontSize: 14, borderRadius: 8 }}
              />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[{ required: true, message: '请输入密码' }]}
              style={{ marginBottom: 24 }}
            >
              <Input.Password 
                placeholder="密码" 
                prefix={<LockOutlined style={{ color: '#8f959e' }} />}
                iconRender={(visible) => (
                  <div onClick={() => setShowPassword(!visible)} style={{ cursor: 'pointer' }}>
                    {visible ? <EyeOutlined /> : <EyeOffOutlined />}
                  </div>
                )}
                style={{ height: 44, fontSize: 14, borderRadius: 8 }}
              />
            </Form.Item>
            
            <Form.Item style={{ marginBottom: 24 }}>
              <Button type="primary" htmlType="submit" style={{ width: '100%', height: 44, fontSize: 16, borderRadius: 8 }}>
                登 录
              </Button>
            </Form.Item>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Form.Item name="remember" valuePropName="checked" noStyle>
                  <Checkbox style={{ color: '#8f959e' }}>记住我</Checkbox>
                </Form.Item>
                <div>
                    <a href="/register" style={{ color: '#1890ff', fontSize: 14, marginRight: 16 }} onClick={e => { e.preventDefault(); navigate('/register'); }}>注册账号</a>
                    <a href="/forgot-password" style={{ color: '#1890ff', fontSize: 14 }} onClick={e => { e.preventDefault(); navigate('/forgot-password'); }}>忘记密码？</a>
                </div>
            </div>
            
            <div style={{ marginTop: 32, paddingTop: 20, borderTop: '1px solid #f0f1f5', textAlign: 'center' }}>
               <Text type="secondary" style={{ fontSize: 12 }}>
                 测试账号: <span style={{ fontWeight: 500 }}>admin</span> / <span style={{ fontWeight: 500 }}>123456</span>
               </Text>
            </div>
          </Form>
        </Card>
    </div>
  );
};

export default Login;