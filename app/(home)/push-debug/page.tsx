import { Metadata } from 'next';
import { PushDebugClient } from '@/components/push-debug-client';

export const metadata: Metadata = {
  title: 'Push Debug - Groupi',
  description: 'Debug push notification functionality',
};

export default function PushDebugPage() {
  return <PushDebugClient />;
}
