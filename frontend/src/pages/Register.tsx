import React from 'react';
import { Form, Input, Button, App } from 'antd';
import { useNavigate } from 'react-router-dom';
import request from '../utils/request';

const Register: React.FC = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const { message } = App.useApp();

  const onFinish = async (values: any) => {
    try {
      // 注册逻辑 - 假设后端有 /auth/register 接口
      // 如果后端没有注册接口，这里需要先实现或模拟
      // 假设注册参数与 UserCreate 类似
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
      // request 工具类会自动提示错误，这里可以补充处理
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
        {/* 背景装饰球 - 复用 Login 样式 */}
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
            <h1 style={{ fontSize: 40, fontWeight: 700, margin: 0, color: '#1d1d1f' }}>创建账号</h1>
            <p style={{ fontSize: 17, color: '#86868b', marginTop: 8 }}>注册以开始使用</p>
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
            style={{ marginBottom: 24 }}
          >
            <Input 
                placeholder="用户名" 
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
            name="email"
            rules={[
                { required: true, message: '请输入邮箱' },
                { type: 'email', message: '请输入有效的邮箱地址' }
            ]}
            style={{ marginBottom: 24 }}
          >
            <Input 
                placeholder="邮箱 (name@example.com)" 
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
            name="nickname"
            style={{ marginBottom: 24 }}
          >
            <Input 
                placeholder="昵称 (可选)" 
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
              注册
            </Button>
          </Form.Item>
          
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <span style={{ color: '#86868b', marginRight: 8 }}>已有账号?</span>
              <a href="/login" style={{ color: '#0071e3', fontSize: 14 }} onClick={e => { e.preventDefault(); navigate('/login'); }}>登录</a>
          </div>
        </Form>
      </div>
    </div>
  );
};

export default Register;
