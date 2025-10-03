import React, { useState } from 'react';
import { Form, Input, Button, Card, message, Typography } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import type { LoginCredentials } from '../types';
import '../styles/Login.css';

const { Title } = Typography;

const Login: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const onFinish = async (values: LoginCredentials) => {
        setLoading(true);
        try {
            console.log('🔐 开始登录流程:', values.username);

            const response = await authAPI.login(values);

            console.log('📨 登录响应:', response);

            if (response.success) {
                message.success('登录成功');
                console.log('✅ 登录成功，跳转到首页');
                navigate('/');
            } else {
                message.error(response.message || '登录失败');
                console.error('❌ 登录失败:', response.message);
            }
        } catch (error: any) {
            console.error('❌ 登录异常:', error);

            // 根据错误类型显示不同消息
            if (error.response?.status === 401) {
                message.error('用户名或密码错误');
            } else if (error.message) {
                message.error(error.message);
            } else {
                message.error('登录失败，请重试');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <Card className="login-card">
                <div className="login-header">
                    <Title level={2}>商户管理系统</Title>
                    <p>请使用管理员账号登录</p>
                </div>
                <Form
                    name="login"
                    onFinish={onFinish}
                    autoComplete="off"
                    size="large"
                >
                    <Form.Item
                        name="username"
                        rules={[{ required: true, message: '请输入用户名!' }]}
                    >
                        <Input prefix={<UserOutlined />} placeholder="用户名" />
                    </Form.Item>

                    <Form.Item
                        name="password"
                        rules={[{ required: true, message: '请输入密码!' }]}
                    >
                        <Input.Password prefix={<LockOutlined />} placeholder="密码" />
                    </Form.Item>

                    <Form.Item>
                        <Button type="primary" htmlType="submit" loading={loading} block>
                            登录
                        </Button>
                    </Form.Item>
                </Form>
                <div className="login-tip">
                    <p>测试账号：hw0401</p>
                    <p>测试密码：hw0401</p>
                </div>
            </Card>
        </div>
    );
};

export default Login;