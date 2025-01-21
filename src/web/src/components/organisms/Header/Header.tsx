import React, { useCallback, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Internal imports
import {
  HeaderContainer,
  LogoSection,
  NavigationSection,
  UserSection
} from './Header.styles';
import NavigationItem from '../../molecules/NavigationItem/NavigationItem';
import Icon from '../../atoms/Icon/Icon';
import { useTheme } from '../../../hooks/useTheme';
import { useAuth } from '../../../hooks/useAuth';

/**
 * Props interface for Header component
 */
export interface HeaderProps {
  /** Optional CSS class name */
  className?: string;
  /** RTL direction support */
  dir?: 'ltr' | 'rtl';
}

/**
 * Enhanced header component with accessibility and responsiveness
 * Implements WCAG 2.1 Level AA compliance with theme support
 * @version 1.0.0
 */
export const Header: React.FC<HeaderProps> = React.memo(({
  className,
  dir = 'ltr'
}) => {
  // State for mobile menu visibility
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Hooks
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { logout, loading } = useAuth();

  /**
   * Handle theme toggle with error boundary
   */
  const handleThemeToggle = useCallback(async () => {
    try {
      await toggleTheme();
    } catch (error) {
      console.error('Theme toggle failed:', error);
    }
  }, [toggleTheme]);

  /**
   * Handle user logout with loading state
   */
  const handleLogout = useCallback(async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }, [logout]);

  /**
   * Handle mobile menu toggle
   */
  const toggleMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(prev => !prev);
  }, []);

  /**
   * Close mobile menu on route change
   */
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  /**
   * Handle keyboard navigation
   */
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'Escape' && isMobileMenuOpen) {
      setIsMobileMenuOpen(false);
    }
  }, [isMobileMenuOpen]);

  return (
    <HeaderContainer
      className={className}
      dir={dir}
      role="banner"
      onKeyDown={handleKeyDown}
      data-testid="header"
    >
      <LogoSection>
        <Icon
          name="logo"
          size="large"
          ariaLabel="Identity Matrix Logo"
          testId="header-logo"
        />
      </LogoSection>

      <NavigationSection
        role="navigation"
        aria-label="Main navigation"
        aria-expanded={isMobileMenuOpen}
        id="main-navigation"
      >
        <NavigationItem
          icon="pulse"
          label="Pulse"
          to="/pulse"
          testId="nav-pulse"
        />
        <NavigationItem
          icon="integrations"
          label="Integrations"
          to="/integrations"
          testId="nav-integrations"
        />
        <NavigationItem
          icon="team"
          label="Team"
          to="/team"
          testId="nav-team"
        />
        <NavigationItem
          icon="settings"
          label="Settings"
          to="/settings"
          testId="nav-settings"
        />
      </NavigationSection>

      <UserSection>
        <button
          onClick={handleThemeToggle}
          aria-label={`Switch to ${theme.mode === 'dark' ? 'light' : 'dark'} theme`}
          title="Toggle theme"
          data-testid="theme-toggle"
        >
          <Icon
            name={theme.mode === 'dark' ? 'sun' : 'moon'}
            size="medium"
            ariaLabel="Theme toggle icon"
          />
        </button>

        <button
          onClick={() => {}}
          aria-label="Help and documentation"
          title="Help"
          data-testid="help-button"
        >
          <Icon
            name="help"
            size="medium"
            ariaLabel="Help icon"
          />
        </button>

        <button
          onClick={handleLogout}
          aria-label="Logout"
          title="Logout"
          disabled={loading}
          data-testid="logout-button"
        >
          <Icon
            name="logout"
            size="medium"
            ariaLabel="Logout icon"
            disabled={loading}
          />
        </button>

        <button
          onClick={toggleMobileMenu}
          aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
          aria-controls="main-navigation"
          aria-expanded={isMobileMenuOpen}
          className="mobile-menu-toggle"
          data-testid="mobile-menu-toggle"
        >
          <Icon
            name={isMobileMenuOpen ? 'close' : 'menu'}
            size="medium"
            ariaLabel="Mobile menu toggle icon"
          />
        </button>
      </UserSection>
    </HeaderContainer>
  );
});

// Display name for debugging
Header.displayName = 'Header';

// Default export
export default Header;