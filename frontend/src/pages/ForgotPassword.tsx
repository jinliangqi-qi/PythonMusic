import React, { useState } from 'react';
import { Form, Input, Button, App } from 'antd';
import { useNavigate } from 'react-router-dom';
import { forgotPassword, resetPassword } from '../api/auth';

const ForgotPassword: React.FC = () => {
  const navigate = useNavigate();
  const { message, notification } = App.useApp();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');

  // 发送验证码
  const handleSendCode = async (values: any) => {
    setLoading(true);
    try {
      const res: any = await forgotPassword(values.email);
      setEmail(values.email);
      
      // 演示环境提示
      if (res.debug_code) {
          notification.info({
              message: '验证码已发送 (演示)',
              description: `您的验证码是: ${res.debug_code}`,
              duration: 10,
          });
      } else {
          message.success('验证码已发送至您的邮箱');
      }
      
      setCurrentStep(1);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // 重置密码
  const handleResetPassword = async (values: any) => {
    setLoading(true);
    try {
      await resetPassword({
          email,
          code: values.code,
          new_password: values.new_password
      });
      message.success('密码重置成功，请登录');
      navigate('/login');
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
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
        {/* 背景装饰球 */}
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
        <div style={{ marginBottom: 32 }}>
            <h1 style={{ fontSize: 32, fontWeight: 700, margin: 0, color: '#1d1d1f' }}>找回密码</h1>
            <p style={{ fontSize: 16, color: '#86868b', marginTop: 8 }}>
                {currentStep === 0 ? "输入邮箱以获取验证码" : "输入验证码和新密码"}
            </p>
        </div>
        
        {/* 步骤 1: 输入邮箱 */}
        {currentStep === 0 && (
            <Form
                name="forgot-step1"
                onFinish={handleSendCode}
                size="large"
                layout="vertical"
            >
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
                
                <Form.Item style={{ marginBottom: 24 }}>
                    <Button 
                        type="primary" 
                        htmlType="submit" 
                        loading={loading}
                        style={{ width: '100%', height: 50, fontSize: 17, borderRadius: 12 }}
                    >
                        发送验证码
                    </Button>
                </Form.Item>
            </Form>
        )}

        {/* 步骤 2: 重置密码 */}
        {currentStep === 1 && (
            <Form
                name="forgot-step2"
                onFinish={handleResetPassword}
                size="large"
                layout="vertical"
            >
                <Form.Item
                    name="code"
                    rules={[{ required: true, message: '请输入验证码' }]}
                    style={{ marginBottom: 24 }}
                >
                    <Input 
                        placeholder="验证码 (6位数字)" 
                        maxLength={6}
                        style={{ 
                            height: 56, 
                            fontSize: 17, 
                            borderRadius: 12,
                            background: 'rgba(255,255,255,0.6)',
                            border: '1px solid rgba(0,0,0,0.05)',
                            backdropFilter: 'blur(5px)',
                            textAlign: 'center',
                            letterSpacing: '4px'
                        }} 
                    />
                </Form.Item>

                <Form.Item
                    name="new_password"
                    rules={[{ required: true, message: '请输入新密码', min: 6 }]}
                    style={{ marginBottom: 32 }}
                >
                    <Input.Password 
                        placeholder="新密码" 
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
                    <Button 
                        type="primary" 
                        htmlType="submit" 
                        loading={loading}
                        style={{ width: '100%', height: 50, fontSize: 17, borderRadius: 12 }}
                    >
                        重置密码
                    </Button>
                </Form.Item>
            </Form>
        )}
          
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <a href="/login" style={{ color: '#0071e3', fontSize: 14 }} onClick={e => { e.preventDefault(); navigate('/login'); }}>返回登录</a>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
