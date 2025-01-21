import React, { useState, useCallback, useEffect } from 'react';
import classNames from 'classnames'; // v2.x
import { useTheme } from '@mui/material'; // v5.x
import { useMediaQuery } from '@mui/material'; // v5.x

// Internal imports
import {
  DashboardContainer,
  MainContent,
  SidebarContainer
} from './DashboardLayout.styles';
import Header from '../../organisms/Header/Header';
import Sidebar from '../../organisms/Sidebar/Sidebar';

/**
 * Props interface for DashboardLayout component
 */
export interface DashboardLayoutProps {
  /** Child components to render in main content area */
  children: React.ReactNode;
  /** Optional CSS class name for custom styling */
  className?: string;
  /** Optional initial collapsed state for sidebar */
  initialSidebarState?: boolean;
}

/**
 * Main dashboard layout template component with responsive behavior and accessibility features
 * Implements WCAG 2.1 Level AA compliance with theme support
 * 
 * @version 1.0.0
 */
export const DashboardLayout: React.FC<DashboardLayoutProps> = React.memo(({
  children,
  className,
  initialSidebarState = false
}) => {
  // Theme and responsive state management
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(initialSidebarState);

  // Handle sidebar toggle with state management
  const handleSidebarToggle = useCallback(() => {
    setIsSidebarCollapsed(prev => !prev);
  }, []);

  // Handle responsive behavior
  useEffect(() => {
    if (isMobile) {
      setIsSidebarCollapsed(true);
    }
  }, [isMobile]);

  // Handle keyboard navigation for sidebar
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isSidebarCollapsed && isMobile) {
        setIsSidebarCollapsed(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isSidebarCollapsed, isMobile]);

  return (
    <>
      {/* Skip navigation link for accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only"
        tabIndex={0}
        aria-label="Skip to main content"
      >
        Skip to main content
      </a>

      <DashboardContainer
        className={classNames('dashboard-layout', className)}
        data-testid="dashboard-layout"
      >
        {/* Header with theme-aware styling */}
        <Header
          className="dashboard-header"
          data-testid="dashboard-header"
        />

        {/* Collapsible sidebar with accessibility support */}
        <SidebarContainer
          role="navigation"
          aria-label="Main navigation"
          data-testid="dashboard-sidebar"
          isCollapsed={isSidebarCollapsed}
        >
          <Sidebar
            className="dashboard-sidebar"
            defaultCollapsed={isSidebarCollapsed}
            onCollapsedChange={setIsSidebarCollapsed}
          />
        </SidebarContainer>

        {/* Main content area with proper landmarks */}
        <MainContent
          id="main-content"
          role="main"
          aria-label="Main content"
          className={classNames('dashboard-content', {
            'content-expanded': !isSidebarCollapsed,
            'content-collapsed': isSidebarCollapsed
          })}
          data-testid="dashboard-content"
        >
          {children}
        </MainContent>
      </DashboardContainer>
    </>
  );
});

// Display name for debugging
DashboardLayout.displayName = 'DashboardLayout';

// Default export
export default DashboardLayout;