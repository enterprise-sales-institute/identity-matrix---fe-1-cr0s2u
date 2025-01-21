/**
 * A reusable atomic Card component that provides a themed container with optional sections
 * Implements theme-aware styling, responsive behavior, and accessibility features
 * @version 1.0.0
 */

import React from 'react'; // v18.x
import { CardContainer, CardHeader, CardContent, CardFooter } from './Card.styles';

/**
 * Props interface for the Card component
 * Extends HTML div attributes for complete element control
 */
export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Main content of the card */
  children: React.ReactNode;
  /** Optional header content */
  header?: React.ReactNode;
  /** Optional footer content */
  footer?: React.ReactNode;
  /** Additional CSS class names */
  className?: string;
  /** Click handler for interactive cards */
  onClick?: (event: React.MouseEvent<HTMLDivElement>) => void;
}

/**
 * Card component that provides a themed container with optional header and footer sections
 * Implements WCAG 2.1 Level AA compliance for accessibility
 * 
 * @example
 * Basic usage:
 * <Card>Content</Card>
 * 
 * @example
 * With header and footer:
 * <Card 
 *   header={<h2>Title</h2>}
 *   footer={<button>Action</button>}
 * >
 *   Content
 * </Card>
 */
const Card: React.FC<CardProps> = ({
  children,
  header,
  footer,
  className = '',
  onClick,
  ...divProps
}) => {
  // Generate combined className for additional styling
  const cardClassName = `im-card ${className}`.trim();

  // Handle keyboard interaction for onClick functionality
  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (onClick && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      onClick(event as unknown as React.MouseEvent<HTMLDivElement>);
    }
  };

  // Add interactive props if onClick is provided
  const interactiveProps = onClick ? {
    onClick,
    onKeyDown: handleKeyDown,
    role: 'button',
    tabIndex: 0,
  } : {};

  return (
    <CardContainer 
      className={cardClassName}
      {...interactiveProps}
      {...divProps}
    >
      {header && (
        <CardHeader className="im-card-header">
          {header}
        </CardHeader>
      )}
      
      <CardContent className="im-card-content">
        {children}
      </CardContent>

      {footer && (
        <CardFooter className="im-card-footer">
          {footer}
        </CardFooter>
      )}
    </CardContainer>
  );
};

// Default display name for debugging
Card.displayName = 'Card';

export default Card;