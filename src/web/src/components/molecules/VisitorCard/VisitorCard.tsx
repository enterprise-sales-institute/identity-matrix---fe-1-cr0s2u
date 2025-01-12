/**
 * A React component that displays visitor information in a card format
 * Implements theme support, responsive design, and WCAG 2.1 Level AA accessibility
 * @version 1.0.0
 */

import React, { useMemo, useCallback } from 'react';
import { 
  CardContainer, 
  CardHeader, 
  CardContent, 
  StatusIndicator, 
  VisitorInfo, 
  LastSeen 
} from './VisitorCard.styles';
import { Visitor, VisitorStatus } from '../../../types/visitor.types';
import { getRelativeTime } from '../../../utils/date.util';

/**
 * Props interface for VisitorCard component
 */
interface VisitorCardProps {
  /** Visitor data object */
  visitor: Visitor;
  /** Optional click handler for card interaction */
  onClick?: (visitor: Visitor) => void;
  /** Optional CSS class name */
  className?: string;
  /** Optional ARIA label override */
  ariaLabel?: string;
  /** Optional test ID for testing */
  testId?: string;
}

/**
 * Maps visitor status to human-readable label with proper contrast ratio
 */
const getStatusLabel = (status: VisitorStatus): string => {
  switch (status) {
    case VisitorStatus.IDENTIFIED:
      return 'Identified';
    case VisitorStatus.ENRICHED:
      return 'Enriched';
    case VisitorStatus.ANONYMOUS:
    default:
      return 'Anonymous';
  }
};

/**
 * Maps visitor status to status indicator state
 */
const getStatusIndicatorState = (status: VisitorStatus): 'active' | 'inactive' | 'new' => {
  switch (status) {
    case VisitorStatus.ENRICHED:
      return 'active';
    case VisitorStatus.IDENTIFIED:
      return 'new';
    default:
      return 'inactive';
  }
};

/**
 * VisitorCard component displaying visitor information with theme and accessibility support
 */
const VisitorCard: React.FC<VisitorCardProps> = React.memo(({
  visitor,
  onClick,
  className = '',
  ariaLabel,
  testId = 'visitor-card'
}) => {
  // Memoize computed values
  const statusLabel = useMemo(() => getStatusLabel(visitor.status), [visitor.status]);
  const statusState = useMemo(() => getStatusIndicatorState(visitor.status), [visitor.status]);
  const lastSeenTime = useMemo(() => getRelativeTime(visitor.lastSeen), [visitor.lastSeen]);

  // Memoize click handler
  const handleClick = useCallback(() => {
    if (onClick) {
      onClick(visitor);
    }
  }, [onClick, visitor]);

  // Handle keyboard interaction
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (onClick && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      onClick(visitor);
    }
  }, [onClick, visitor]);

  // Generate accessible ARIA label
  const cardAriaLabel = ariaLabel || `Visitor ${visitor.email || 'Anonymous'} - ${statusLabel}`;

  return (
    <CardContainer
      className={`visitor-card ${className}`.trim()}
      onClick={onClick ? handleClick : undefined}
      onKeyDown={onClick ? handleKeyDown : undefined}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={cardAriaLabel}
      data-testid={testId}
    >
      <CardHeader>
        <div className="visitor-status">
          <StatusIndicator 
            status={statusState}
            aria-label={`Status: ${statusLabel}`}
          />
          <span>{statusLabel}</span>
        </div>
      </CardHeader>

      <CardContent>
        <VisitorInfo>
          <label htmlFor={`visitor-email-${visitor.id}`}>Email</label>
          <span id={`visitor-email-${visitor.id}`}>
            {visitor.email || 'Anonymous'}
          </span>
        </VisitorInfo>

        {visitor.enrichedData && (
          <>
            <VisitorInfo>
              <label htmlFor={`visitor-company-${visitor.id}`}>Company</label>
              <span id={`visitor-company-${visitor.id}`}>
                {visitor.enrichedData.company}
              </span>
            </VisitorInfo>

            <VisitorInfo>
              <label htmlFor={`visitor-title-${visitor.id}`}>Title</label>
              <span id={`visitor-title-${visitor.id}`}>
                {visitor.enrichedData.title}
              </span>
            </VisitorInfo>

            <VisitorInfo>
              <label htmlFor={`visitor-industry-${visitor.id}`}>Industry</label>
              <span id={`visitor-industry-${visitor.id}`}>
                {visitor.enrichedData.industry}
              </span>
            </VisitorInfo>
          </>
        )}

        <VisitorInfo>
          <label htmlFor={`visitor-location-${visitor.id}`}>Location</label>
          <span id={`visitor-location-${visitor.id}`}>
            {`${visitor.metadata.location.city}, ${visitor.metadata.location.country}`}
          </span>
        </VisitorInfo>

        <LastSeen 
          dateTime={visitor.lastSeen}
          aria-label={`Last seen ${lastSeenTime}`}
        >
          {lastSeenTime}
        </LastSeen>
      </CardContent>
    </CardContainer>
  );
});

// Display name for debugging
VisitorCard.displayName = 'VisitorCard';

export default VisitorCard;