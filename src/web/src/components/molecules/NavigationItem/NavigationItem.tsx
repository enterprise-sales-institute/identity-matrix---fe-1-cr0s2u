import React, { useCallback, useMemo } from 'react';
import { useLocation } from 'react-router-dom'; // v6.x
import { NavigationItemContainer, NavigationLink } from './NavigationItem.styles';
import Icon from '../../atoms/Icon/Icon';
import { ThemeConfig } from '../../../types/theme.types';

/**
 * Props interface for NavigationItem component with enhanced accessibility support
 */
export interface NavigationItemProps {
  /** Name of the icon to display in the navigation item */
  icon: string;
  /** Text label for the navigation item */
  label: string;
  /** Route path for navigation */
  to: string;
  /** Optional CSS class name for custom styling */
  className?: string;
  /** Optional test ID for testing purposes */
  testId?: string;
}

/**
 * A molecular component that renders a navigation item with icon and text
 * Implements WCAG 2.1 Level AA compliance with enhanced keyboard navigation
 * and screen reader support
 *
 * @param props - NavigationItem component props
 * @returns JSX.Element - Rendered navigation item component
 */
export const NavigationItem: React.FC<NavigationItemProps> = React.memo(({
  icon,
  label,
  to,
  className,
  testId = 'nav-item'
}) => {
  // Get current location for active state detection
  const location = useLocation();

  // Determine if this navigation item is currently active
  const isActive = useMemo(() => {
    return location.pathname === to || location.pathname.startsWith(`${to}/`);
  }, [location.pathname, to]);

  // Create accessible label combining icon and text description
  const accessibleLabel = useMemo(() => {
    return `${label} ${isActive ? '(current page)' : ''}`;
  }, [label, isActive]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLAnchorElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      event.currentTarget.click();
    }
  }, []);

  return (
    <NavigationItemContainer
      data-testid={testId}
      className={className}
    >
      <NavigationLink
        to={to}
        isActive={isActive}
        aria-current={isActive ? 'page' : undefined}
        aria-label={accessibleLabel}
        role="link"
        onKeyDown={handleKeyDown}
      >
        <Icon
          name={icon}
          size="medium"
          color="currentColor"
          ariaLabel={`${label} icon`}
          className="nav-item-icon"
        />
        <span className="nav-item-label">{label}</span>
      </NavigationLink>
    </NavigationItemContainer>
  );
});

// Display name for debugging
NavigationItem.displayName = 'NavigationItem';

// Default export
export default NavigationItem;