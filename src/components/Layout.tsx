import React from 'react';
import { authService } from '../services/auth';
import './Layout.css';

interface LayoutProps {
  children: React.ReactNode;
  title: string;
}

const Layout: React.FC<LayoutProps> = ({ children, title }) => {
  const user = authService.getUser();

  const handleLogout = () => {
    if (window.confirm('Yakin mau logout?')) {
      authService.logout();
    }
  };

  return (
    <div className="layout">
      {/* Simple Header */}
      <header className="header">
        <div className="header-content">
          <div className="logo">
            <span className="logo-icon">📚</span>
            <span className="logo-text">Perpustakaan</span>
          </div>
          
          <div className="user-menu">
            <span className="welcome-text">Halo, {user?.name}</span>
            <button 
              onClick={handleLogout}
              className="logout-btn"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Page Title */}
      <div className="page-title">
        <h1>{title}</h1>
      </div>

      {/* Main Content */}
      <main className="main-content">
        {children}
      </main>
    </div>
  );
};

export default Layout;