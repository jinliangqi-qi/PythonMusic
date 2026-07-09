import React from 'react';
import { Form, Input, Button, App, Card, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';
import request from '../utils/request';
import { DatabaseOutlined, LockOutlined, UserOutlined, MailOutlined, SmileOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

const Register: React.FC = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const { message } = App.useApp();

  const onFinish = async (values: any) => {
    try {
      await request.post('/auth/register', {
          username: values.username,
          password: values.password,
          email: values.email,
          nickname: values.nickname
      });
      
      message.success('注册成功，请登录');
      navigate('/login');
    } catch (error: any) {
      console.error(error);
      message.error(error.message || '注册失败，请稍后重试');
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
            <Text type="secondary" style={{ fontSize: 14, marginTop: 8, display: 'block' }}>注册新账号</Text>
          </div>
          
          <Form
            form={form}
            name="register"
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
              name="email"
              rules={[
                  { required: true, message: '请输入邮箱' },
                  { type: 'email', message: '请输入有效的邮箱地址' }
              ]}
              style={{ marginBottom: 20 }}
            >
              <Input 
                  placeholder="邮箱地址" 
                  prefix={<MailOutlined style={{ color: '#8f959e' }} />}
                  style={{ height: 44, fontSize: 14, borderRadius: 8 }}
              />
            </Form.Item>

            <Form.Item
              name="nickname"
              style={{ marginBottom: 20 }}
            >
              <Input 
                  placeholder="昵称 (可选)" 
                  prefix={<SmileOutlined style={{ color: '#8f959e' }} />}
                  style={{ height: 44, fontSize: 14, borderRadius: 8 }}
              />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[
                { required: true, message: '请输入密码' },
                { min: 6, message: '密码至少6位' }
              ]}
              style={{ marginBottom: 24 }}
            >
              <Input.Password 
                  placeholder="密码" 
                  prefix={<LockOutlined style={{ color: '#8f959e' }} />}
                  style={{ height: 44, fontSize: 14, borderRadius: 8 }}
              />
            </Form.Item>
            
            <Form.Item style={{ marginBottom: 24 }}>
              <Button type="primary" htmlType="submit" style={{ width: '100%', height: 44, fontSize: 16, borderRadius: 8 }}>
                注 册
              </Button>
            </Form.Item>
            
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', paddingTop: 20, borderTop: '1px solid #f0f1f5' }}>
                <Text type="secondary" style={{ marginRight: 8 }}>已有账号?</Text>
                <a href="/login" style={{ color: '#1890ff', fontSize: 14 }} onClick={e => { e.preventDefault(); navigate('/login'); }}>立即登录</a>
            </div>
          </Form>
        </Card>
    </div>
  );
};

export default Register;