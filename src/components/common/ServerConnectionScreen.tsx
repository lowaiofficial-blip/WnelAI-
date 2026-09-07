import React from 'react';
import { ServiceShutdownScreen } from './ServiceShutdownScreen';

interface ServerConnectionScreenProps {
  onAdminUnlock?: () => void;
}

/**
 * ServerConnectionScreen
 * 
 * Re-exports the official permanent ServiceShutdownScreen.
 */
export function ServerConnectionScreen(props: ServerConnectionScreenProps) {
  return <ServiceShutdownScreen {...props} />;
}

export { ServiceShutdownScreen };
