import React, { useState, useEffect } from 'react';
import { Layout, Avatar, Dropdown, Button, Space } from 'antd';
import { Scale } from 'lucide-react';
import { UserOutlined, SettingOutlined, LogoutOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../Context/AuthContext';
import vidhoraLogo from '../../assets/logo/vidhora_logo.jpeg';
import './Navbar.css';

const { Header } = Layout;

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isApp = location.pathname.startsWith('/app');

  const userMenuItems = [
    {
      key: 'user-info',
      disabled: true,
      label: (
        <div style={{ padding: '4px 0', minWidth: '150px', cursor: 'default' }}>
          <div style={{ fontWeight: 600, color: '#1f2937', fontSize: '14px' }}>{user?.name || 'User Name'}</div>
          <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>{user?.email || 'user@example.com'}</div>
        </div>
      ),
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Logout',
      danger: true,
    },
  ];

  const handleUserMenuClick = async ({ key }) => {
    if (key === 'logout') {
      await logout();
      navigate('/login');
    }
    // Profile / Settings can be handled later if needed
  };

  const scrollToSection = (sectionId) => {
    if (location.pathname !== '/') {
      navigate('/');
      // Delay to ensure the page has loaded before scrolling
      setTimeout(() => {
        const element = document.getElementById(sectionId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    } else {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  return (
    <Header className={`${isApp ? "app-navbar" : "premium-navbar"} ${scrolled ? "scrolled" : ""}`}>
      <div className="navbar-left">
        <div className="navbar-logo" onClick={() => navigate(isApp ? '/app/dashboard' : '/')}>
          <img 
            src={vidhoraLogo} 
            alt="Vidhora Logo" 
            style={{ 
              height: isApp ? '32px' : '40px', 
              borderRadius: '8px',
              objectFit: 'contain',
              boxShadow: '0 2px 10px rgba(0, 0, 0, 0.12)'
            }} 
          />
          <span className={isApp ? "logo-text-app" : "logo-text"}>VIDHORA AI</span>
        </div>
      </div>

      {!isApp && (
        <div className="navbar-center">
          <nav className="nav-links">
            <span onClick={() => {
              if (location.pathname === '/') {
                window.scrollTo({ top: 0, behavior: 'smooth' });
              } else {
                navigate('/');
              }
            }}>Home</span>
            <span onClick={() => scrollToSection('features')}>Features</span>
            <span onClick={() => scrollToSection('tools')}>Tools</span>
          </nav>
        </div>
      )}

      <div className="navbar-right">
        {!user ? (
          <Space size="middle">

            <Button
              className="navbar-cta"
              onClick={() => navigate('/login')}
            >
              Login
            </Button>
          </Space>
        ) : (
          <Space size="middle">

            <Dropdown
              menu={{ items: userMenuItems, onClick: handleUserMenuClick }}
              trigger={["click"]}
              placement="bottomRight"
            >
              <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                <Avatar
                  className={isApp ? "navbar-avatar-app" : "navbar-avatar"}
                  size="large"
                >
                  {(user?.name || 'U').trim().charAt(0).toUpperCase()}
                </Avatar>
              </div>
            </Dropdown>
          </Space>
        )}
      </div>
    </Header>
  );
};

export default Navbar;
