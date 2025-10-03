import React from 'react';
import { Layout, Button, Typography, Dropdown } from 'antd';
import { LogoutOutlined, UserOutlined, DownOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { logout, getUsername } from '../utils/auth';
import type { MenuProps } from 'antd';

const { Header, Content } = Layout;
const { Title } = Typography;

interface AdminLayoutProps {
    children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const userMenuItems: MenuProps['items'] = [
        {
            key: 'logout',
            icon: <LogoutOutlined />,
            label: '退出登录',
            onClick: handleLogout
        }
    ];

    return (
        <Layout style={{ minHeight: '100vh' }}>
            <Header style={{
                background: '#fff',
                padding: '0 24px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                boxShadow: '0 1px 4px rgba(0,21,41,.08)'
            }}>
                <Title level={3} style={{ margin: 0 }}>
                    商户信息管理系统
                </Title>
                <Dropdown
                    menu={{ items: userMenuItems }}
                    trigger={['click']}
                >
                    <Button type="text">
                        <UserOutlined />
                        {getUsername()}
                        <DownOutlined />
                    </Button>
                </Dropdown>
            </Header>
            <Content style={{
                margin: '24px',
                padding: '24px',
                background: '#fff',
                borderRadius: '6px'
            }}>
                {children}
            </Content>
        </Layout>
    );
};

export default AdminLayout;