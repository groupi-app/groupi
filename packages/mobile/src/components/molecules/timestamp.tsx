import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';

function formatTimeAgo(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m`;
  if (hours < 24) return `${hours}h`;
  if (days < 7) return `${days}d`;
  if (days < 30) return `${Math.floor(days / 7)}w`;
  return `${Math.floor(days / 30)}mo`;
}

interface TimestampProps {
  time: number;
  className?: string;
}

export function Timestamp({ time, className }: TimestampProps) {
  return (
    <Text className={cn('text-sm text-muted-foreground', className)}>
      {formatTimeAgo(time)}
    </Text>
  );
}

export { formatTimeAgo };
