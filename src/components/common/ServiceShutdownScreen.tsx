import React from 'react';
import { ServerConnectionScreen } from './ServerConnectionScreen';

interface ServiceShutdownScreenProps {
  onAdminUnlock?: () => void;
}

export function ServiceShutdownScreen(props: ServiceShutdownScreenProps) {
  return <ServerConnectionScreen {...props} />;
}

export { ServerConnectionScreen };
