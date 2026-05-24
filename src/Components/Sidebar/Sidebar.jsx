import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Scale,
  Gavel,
  FileText,
  MessageSquare,
  PanelRightClose,
  PanelRightOpen,
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { useAuth } from '../../Context/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';
import './Sidebar.css';

// sidebar component
const Sidebar = ({ activeItem, onNavigate, onToggle, isCollapsed }) => {
  const [internalCollapsed, setInternalCollapsed] = useState(isCollapsed);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  // Check if screen is mobile
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (!mobile && isMobileOpen) {
        setIsMobileOpen(false);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [isMobileOpen]);

  // Sync internal state with prop
  useEffect(() => {
    setInternalCollapsed(isCollapsed);
  }, [isCollapsed]);

  // Close mobile menu on outside click
  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (isMobile && isMobileOpen &&
        !event.target.closest('.sidebar') &&
        !event.target.closest('.mobile-toggle-btn')) {
        setIsMobileOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isMobile, isMobileOpen]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobile && isMobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobile, isMobileOpen]);

  const menuItems = [
    {
      name: 'Dashboard',
      icon: LayoutDashboard
    },
    {
      name: 'Law Simplifier',
      icon: Scale
    },
    {
      name: 'Judgment Simplifier',
      icon: Gavel
    },
    // {
    //   name: 'Document Creator',
    //   icon: FileText
    // },
    {
      name: 'Vidhora AI Chatbot',
      icon: MessageSquare
    }
  ];

  const toggleSidebar = () => {
    if (isMobile) {
      setIsMobileOpen(!isMobileOpen);
    } else {
      const newCollapsedState = !internalCollapsed;
      setInternalCollapsed(newCollapsedState);
      if (onToggle) {
        onToggle(newCollapsedState);
      }
    }
  };

  const handleItemClick = (itemName) => {
    if (onNavigate) {
      onNavigate(itemName);
    }
    // Close mobile menu after selection
    if (isMobile && isMobileOpen) {
      setIsMobileOpen(false);
    }
  };

  const handleLogout = () => {
    console.log('Logout clicked');
    logout();
    navigate('/login');
    // Close mobile menu after logout
    if (isMobile && isMobileOpen) {
      setIsMobileOpen(false);
    }
  };

  const sidebarClasses = [
    'sidebar',
    internalCollapsed && !isMobile ? 'collapsed' : '',
    isMobile && isMobileOpen ? 'mobile-open' : '',
    isMobile ? 'mobile' : ''
  ].filter(Boolean).join(' ');

  return (
    <>
      {/* Mobile Toggle Button - Only for opening */}
      {isMobile && !isMobileOpen && (
        <button
          className="mobile-toggle-btn"
          onClick={toggleSidebar}
          aria-label="Open mobile menu"
        >
          <Menu size={24} />
        </button>
      )}

      {/* Mobile Overlay */}
      {isMobile && isMobileOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <div className={sidebarClasses}>
        {/* Background Effects */}
        <div className="sidebar-background">
          <div className="sidebar-pattern"></div>
          <div className="sidebar-gradient"></div>
        </div>

        {/* Header */}
        <div className="sidebar-header">
          <div className="logo">
            {(!internalCollapsed || isMobile) && (
              <>
                <div className="brand-icon">
                  <Scale size={24} />
                </div>
                <div className="brand-text">
                  <span className="logo-text">Justice Bridge</span>
                  <span className="logo-tagline">Making Law Simple</span>
                </div>
              </>
            )}
          </div>

          {/* Toggle/Close Button */}
          <button className="toggle-btn" onClick={toggleSidebar}>
            {isMobile ? (
              <X size={20} />
            ) : (
              internalCollapsed ? <PanelRightClose size={20} /> : <PanelRightOpen size={20} />
            )}
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="sidebar-nav">
          <ul className="nav-list">
            {menuItems.map((item, index) => {
              const IconComponent = item.icon;
              return (
                <li key={item.name} className="nav-item">
                  <button
                    className={`nav-link ${activeItem === item.name ? 'active' : ''}`}
                    onClick={() => handleItemClick(item.name)}
                    title={internalCollapsed && !isMobile ? item.name : ''}
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="nav-icon">
                      <IconComponent size={24} />
                    </div>
                    {(!internalCollapsed || isMobile) && (
                      <span className="nav-text">{item.name}</span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Logout Button */}
        <div className="sidebar-footer">
          <button className="logout-btn1" onClick={handleLogout}>
            <div className="nav-icon">
              <LogOut size={24} />
            </div>
            {(!internalCollapsed || isMobile) && (
              <span className="nav-text">Logout</span>
            )}
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
