import React, { useState } from 'react';
import { Layout, Menu, Button, Avatar, Dropdown, theme } from 'antd';
import { useNavigate, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Scale } from 'lucide-react';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  DashboardOutlined,
  FileTextOutlined,
  SolutionOutlined,
  FileAddOutlined,
  MessageOutlined,
  UserOutlined,
  LogoutOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import Dashboard from '../../Components/Dashboard/Dashboard';
import LawSimplifier from '../../Components/LawSimplifier/LawSimplifier';
import JudgmentSimplifier from '../../Components/JudgmentSimplifier/JudgmentSimplifier';
import DocumentCreator from '../../Components/DocumentCreator/DocumentCreator';
import LexChatbot from '../../Components/LexChatbot/LexChatbot';
import Navbar from '../../Components/Navbar/Navbar';
import { useAuth } from '../../Context/AuthContext';
import '../../App.css';

const { Header, Sider, Content } = Layout;

function MainApp() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  // Map URL paths to menu keys
  const pathToKey = {
    '/app/dashboard': 'dashboard',
    '/app/law-simplifier': 'law-simplifier',
    '/app/judgment-simplifier': 'judgment-simplifier',
    '/app/document-creator': 'document-creator',
    '/app/lex-chatbot': 'lex-chatbot',
  };

  // Get current selected key based on URL
  const getCurrentKey = () => {
    return pathToKey[location.pathname] || 'dashboard';
  };

  // Menu items configuration
  const menuItems = [
    {
      key: 'dashboard',
      icon: <DashboardOutlined />,
      label: 'Dashboard',
    },
    {
      key: 'law-simplifier',
      icon: <FileTextOutlined />,
      label: 'Law Simplifier',
    },
    {
      key: 'judgment-simplifier',
      icon: <SolutionOutlined />,
      label: 'Judgment Simplifier',
    },
    // {
    //   key: 'document-creator',
    //   icon: <FileAddOutlined />,
    //   label: 'Document Creator',
    // },
    {
      key: 'lex-chatbot',
      icon: <MessageOutlined />,
      label: 'Vidhora Chatbot',
    },
  ];

  // Removed userMenuItems and handleUserMenuClick as they are now handled by Navbar

  const handleMenuClick = ({ key }) => {
    navigate(`/app/${key}`);
  };

  return (
    <Layout style={{ minHeight: '100vh', background: '#ffffff' }}>
      {/* Sidebar */}
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        breakpoint="lg"
        collapsedWidth={80}
        width={250}
        onBreakpoint={(broken) => {
          if (broken) {
            setCollapsed(true);
          }
        }}
        style={{
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
        }}
      >
        {/* Logo is now exclusively in the Navbar */}
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[getCurrentKey()]}
          items={menuItems}
          onClick={handleMenuClick}
          style={{ marginTop: '16px' }}
        />

        {/* Toggle Button in Sidebar */}
        <div
          style={{
            position: 'absolute',
            bottom: 20,
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
            padding: '0 16px',
          }}
        >
          <Button
            type="default"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{
              width: collapsed ? '48px' : '100%',
              backgroundColor: '#1d4ed8',
              borderColor: '#1d4ed8',
              color: 'white',
            }}
          >
            {!collapsed && 'Collapse'}
          </Button>
        </div>
      </Sider>

      {/* Main Layout Content */}
      <Layout style={{ marginLeft: collapsed ? 80 : 250, transition: 'all 0.2s', minHeight: '100vh', background: '#ffffff' }}>
        <Navbar />
        <Content
          style={{
            padding: '24px',
            minHeight: 280,
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <Routes>
            <Route path="/" element={<Navigate to="/app/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard onNavigate={(key) => navigate(`/app/${key.toLowerCase().replace(/ /g, '-')}`)} userInfo={user} />} />
            <Route path="/law-simplifier" element={<LawSimplifier />} />
            <Route path="/judgment-simplifier" element={<JudgmentSimplifier />} />
            <Route path="/document-creator" element={<DocumentCreator />} />
            <Route path="/lex-chatbot" element={<LexChatbot />} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  );
}

export default MainApp;
