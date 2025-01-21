import React, { useState, useCallback, useMemo } from 'react'; // v18.x
import { formatDistanceToNow } from 'date-fns'; // v2.x

import {
  CardContainer,
  CardHeader,
  CardContent,
  CardFooter,
  IntegrationIcon,
  StatusIndicator
} from './IntegrationCard.styles';
import { Button } from '../../atoms/Button/Button';
import { useTheme } from '../../../hooks/useTheme';
import {
  Integration,
  IntegrationType,
  IntegrationStatus,
} from '../../../types/integration.types';

interface IntegrationCardProps {
  /** Integration data object with extended status information */
  integration: Integration;
  /** Async handler for connect action with loading state */
  onConnect: (id: string) => Promise<void>;
  /** Async handler for disconnect action with loading state */
  onDisconnect: (id: string) => Promise<void>;
  /** Async handler for configure action with loading state */
  onConfigure: (id: string) => Promise<void>;
  /** Optional CSS class for external styling */
  className?: string;
  /** Optional test ID for E2E testing */
  testId?: string;
}

/**
 * A molecular component that displays CRM integration information with status indicators
 * and action buttons. Supports theme-aware styling and WCAG 2.1 Level AA compliance.
 */
export const IntegrationCard = React.memo<IntegrationCardProps>(({
  integration,
  onConnect,
  onDisconnect,
  onConfigure,
  className,
  testId = 'integration-card'
}) => {
  const { theme } = useTheme();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Format last sync time with relative formatting
  const lastSyncText = useMemo(() => {
    if (!integration.lastSyncAt) return 'Never synced';
    return `Last sync ${formatDistanceToNow(new Date(integration.lastSyncAt))} ago`;
  }, [integration.lastSyncAt]);

  // Get integration type display name
  const integrationName = useMemo(() => {
    const names: Record<IntegrationType, string> = {
      [IntegrationType.SALESFORCE]: 'Salesforce',
      [IntegrationType.HUBSPOT]: 'HubSpot',
      [IntegrationType.PIPEDRIVE]: 'Pipedrive',
      [IntegrationType.ZOHO]: 'Zoho CRM'
    };
    return names[integration.type] || 'Unknown Integration';
  }, [integration.type]);

  // Action handlers with loading states
  const handleConnect = useCallback(async () => {
    try {
      setLoading('connect');
      setError(null);
      await onConnect(integration.id);
    } catch (err) {
      setError('Failed to connect integration');
    } finally {
      setLoading(null);
    }
  }, [integration.id, onConnect]);

  const handleDisconnect = useCallback(async () => {
    try {
      setLoading('disconnect');
      setError(null);
      await onDisconnect(integration.id);
    } catch (err) {
      setError('Failed to disconnect integration');
    } finally {
      setLoading(null);
    }
  }, [integration.id, onDisconnect]);

  const handleConfigure = useCallback(async () => {
    try {
      setLoading('configure');
      setError(null);
      await onConfigure(integration.id);
    } catch (err) {
      setError('Failed to configure integration');
    } finally {
      setLoading(null);
    }
  }, [integration.id, onConfigure]);

  // Determine button states based on integration status
  const isConnected = integration.status === IntegrationStatus.ACTIVE;
  const hasError = integration.status === IntegrationStatus.ERROR;

  return (
    <CardContainer
      className={className}
      data-testid={testId}
      role="article"
      aria-label={`${integrationName} integration - ${integration.status.toLowerCase()}`}
    >
      <CardHeader>
        <IntegrationIcon
          data-loading={loading !== null}
          aria-hidden="true"
        >
          {/* Integration type icon would be rendered here */}
        </IntegrationIcon>
        <h3>{integrationName}</h3>
      </CardHeader>

      <CardContent>
        <div>
          <StatusIndicator
            status={integration.status.toLowerCase()}
            aria-hidden="true"
          />
          <span>{integration.status}</span>
        </div>
        <p aria-label="Last synchronization time">
          {lastSyncText}
        </p>
        {error && (
          <p
            role="alert"
            aria-live="polite"
            style={{ color: theme.colors.text.primary }}
          >
            {error}
          </p>
        )}
      </CardContent>

      <CardFooter>
        {!isConnected && (
          <Button
            variant="primary"
            size="medium"
            onClick={handleConnect}
            loading={loading === 'connect'}
            disabled={loading !== null}
            aria-label={`Connect ${integrationName}`}
          >
            Connect
          </Button>
        )}

        {isConnected && (
          <Button
            variant="secondary"
            size="medium"
            onClick={handleDisconnect}
            loading={loading === 'disconnect'}
            disabled={loading !== null}
            aria-label={`Disconnect ${integrationName}`}
          >
            Disconnect
          </Button>
        )}

        <Button
          variant="text"
          size="medium"
          onClick={handleConfigure}
          loading={loading === 'configure'}
          disabled={loading !== null || (!isConnected && !hasError)}
          aria-label={`Configure ${integrationName}`}
        >
          Configure
        </Button>
      </CardFooter>
    </CardContainer>
  );
});

IntegrationCard.displayName = 'IntegrationCard';

export default IntegrationCard;