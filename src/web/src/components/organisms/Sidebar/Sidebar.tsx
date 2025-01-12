import React, { useState, useCallback, useEffect } from 'react';
import debounce from 'lodash/debounce'; // v4.17.x

// Internal imports
import {
  SidebarContainer,
  SidebarLogo,
  SidebarNav,
  SidebarFooter
} from './Sidebar.styles';
import NavigationItem from '../../molecules/NavigationItem/NavigationItem';
import { useTheme } from '../../../hooks/useTheme';

// Navigation items configuration
const NAVIGATION_ITEMS = [
  {
    icon: 'pulse',
    label: 'Pulse',
    to: '/pulse',
    ariaLabel: 'View pulse page'
  },
  {
    icon: 'integration',
    label: 'Integrations',
    to: '/integrations',
    ariaLabel: 'Manage integrations'
  },
  {
    icon: 'team',
    label: 'Team',
    to: '/team',
    ariaLabel: 'View team members'
  },
  {
    icon: 'settings',
    label: 'Settings',
    to: '/settings',
    ariaLabel: 'Manage settings'
  }
] as const;

// Constants
const THEME_TOGGLE_DEBOUNCE_MS = 150;
const COLLAPSE_BREAKPOINT = 768;

interface SidebarProps {
  /** Optional CSS class name for custom styling */
  className?: string;
  /** Initial collapsed state of sidebar */
  defaultCollapsed?: boolean;
  /** Callback for collapse state changes */
  onCollapsedChange?: (isCollapsed: boolean) => void;
}

/**
 * A responsive, theme-aware sidebar component that provides main navigation
 * for the application with enhanced accessibility features.
 *
 * @param props - Sidebar component props
 * @returns JSX.Element - Rendered sidebar component
 */
export const Sidebar: React.FC<SidebarProps> = React.memo(({
  className,
  defaultCollapsed = false,
  onCollapsedChange
}) => {
  // State management
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const [isMobile, setIsMobile] = useState(window.innerWidth < COLLAPSE_BREAKPOINT);
  
  // Theme management
  const { isDark, toggleTheme } = useTheme();

  // Debounced theme toggle to prevent rapid changes
  const handleThemeToggle = useCallback(
    debounce(() => {
      toggleTheme();
    }, THEME_TOGGLE_DEBOUNCE_MS, { leading: true }),
    [toggleTheme]
  );

  // Handle sidebar collapse toggle
  const handleCollapseToggle = useCallback(() => {
    const newCollapsedState = !isCollapsed;
    setIsCollapsed(newCollapsedState);
    onCollapsedChange?.(newCollapsedState);
  }, [isCollapsed, onCollapsedChange]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Escape' && !isCollapsed) {
      handleCollapseToggle();
    }
  }, [handleCollapseToggle, isCollapsed]);

  // Handle responsive behavior
  useEffect(() => {
    const handleResize = debounce(() => {
      const newIsMobile = window.innerWidth < COLLAPSE_BREAKPOINT;
      setIsMobile(newIsMobile);
      
      // Auto-collapse on mobile
      if (newIsMobile && !isCollapsed) {
        setIsCollapsed(true);
        onCollapsedChange?.(true);
      }
    }, 100);

    window.addEventListener('resize', handleResize);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('keydown', handleKeyDown);
      handleResize.cancel();
      handleThemeToggle.cancel();
    };
  }, [handleKeyDown, handleThemeToggle, isCollapsed, onCollapsedChange]);

  return (
    <SidebarContainer
      className={className}
      isCollapsed={isCollapsed}
      isMobile={isMobile}
      role="navigation"
      aria-label="Main navigation"
      aria-expanded={!isCollapsed}
      data-testid="sidebar"
    >
      <SidebarLogo>
        <img
          src="/assets/logo.svg"
          alt="Identity Matrix"
          width={isCollapsed ? 32 : 120}
          height={32}
        />
      </SidebarLogo>

      <SidebarNav isMobile={isMobile}>
        {NAVIGATION_ITEMS.map((item) => (
          <NavigationItem
            key={item.to}
            icon={item.icon}
            label={item.label}
            to={item.to}
            aria-label={item.ariaLabel}
            data-testid={`nav-item-${item.label.toLowerCase()}`}
          />
        ))}
      </SidebarNav>

      <SidebarFooter>
        <button
          onClick={handleThemeToggle}
          aria-label={`Switch to ${isDark ? 'light' : 'dark'} theme`}
          data-testid="theme-toggle"
        >
          <NavigationItem
            icon={isDark ? 'sun' : 'moon'}
            label={`${isDark ? 'Light' : 'Dark'} Mode`}
            to="#"
          />
        </button>
        
        {!isMobile && (
          <button
            onClick={handleCollapseToggle}
            aria-label={`${isCollapsed ? 'Expand' : 'Collapse'} sidebar`}
            data-testid="collapse-toggle"
          >
            <NavigationItem
              icon={isCollapsed ? 'chevron-right' : 'chevron-left'}
              label={isCollapsed ? 'Expand' : 'Collapse'}
              to="#"
            />
          </button>
        )}
      </SidebarFooter>
    </SidebarContainer>
  );
});

// Display name for debugging
Sidebar.displayName = 'Sidebar';

// Default export
export default Sidebar;