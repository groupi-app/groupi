'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { cn } from '@/lib/utils';
import { StatusIndicator } from '@/components/atoms';
import { DisplayStatus, getStatusDisplayText } from '@/lib/utils';
import {
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Check } from 'lucide-react';
import { toast } from 'sonner';

// Dynamic require to avoid deep type instantiation errors with complex Convex API types
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let presenceApi: any;
function initApi() {
  if (!presenceApi) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { api } = require('@/convex/_generated/api');
    presenceApi = api.presence ?? {};
  }
}
initApi();

type StatusType = 'ONLINE' | 'IDLE' | 'DO_NOT_DISTURB' | 'INVISIBLE';
type StatusDuration =
  | '15_MINUTES'
  | '1_HOUR'
  | '8_HOURS'
  | '24_HOURS'
  | '3_DAYS'
  | 'FOREVER';

const STATUS_OPTIONS: {
  value: StatusType;
  label: string;
  displayStatus: DisplayStatus;
  description: string;
}[] = [
  {
    value: 'ONLINE',
    label: 'Online',
    displayStatus: 'online',
    description: 'Show as online',
  },
  {
    value: 'IDLE',
    label: 'Idle',
    displayStatus: 'idle',
    description: 'Show as away',
  },
  {
    value: 'DO_NOT_DISTURB',
    label: 'Do Not Disturb',
    displayStatus: 'dnd',
    description: 'Mute notifications',
  },
  {
    value: 'INVISIBLE',
    label: 'Invisible',
    displayStatus: 'invisible',
    description: 'Appear offline',
  },
];

const DURATION_OPTIONS: {
  value: StatusDuration;
  label: string;
}[] = [
  { value: '15_MINUTES', label: '15 minutes' },
  { value: '1_HOUR', label: '1 hour' },
  { value: '8_HOURS', label: '8 hours' },
  { value: '24_HOURS', label: '24 hours' },
  { value: '3_DAYS', label: '3 days' },
  { value: 'FOREVER', label: 'Until I change it' },
];

interface StatusPickerProps {
  className?: string;
  onStatusChange?: () => void;
}

/**
 * StatusPicker - Status selection submenu for the profile dropdown
 *
 * Allows users to set their online status with optional duration:
 * - Online (green dot) - default
 * - Idle (yellow crescent) - away but available
 * - Do Not Disturb (red minus) - blocks notifications
 * - Invisible (gray dot) - appears offline to others
 */
// Return type of getMyStatus query
type MyStatusResult = {
  status: 'ONLINE' | 'IDLE' | 'DO_NOT_DISTURB' | 'INVISIBLE';
  statusExpiresAt: number | undefined;
  statusSetAt: number | undefined;
  autoIdleEnabled: boolean;
  statusVisibility: 'EVERYONE' | 'FRIENDS' | 'NONE';
  lastSeen: number | undefined;
} | null;

export function StatusPicker({ className, onStatusChange }: StatusPickerProps) {
  const myStatus: MyStatusResult | undefined = useQuery(
    presenceApi.getMyStatus
  );
  const setStatusMutation = useMutation(presenceApi.setStatus);

  const currentStatus = myStatus?.status ?? 'ONLINE';
  const currentDisplayStatus: DisplayStatus =
    currentStatus === 'DO_NOT_DISTURB'
      ? 'dnd'
      : (currentStatus.toLowerCase() as DisplayStatus);

  // Track current time for expiration display with periodic updates
  const [currentTime, setCurrentTime] = useState(Date.now);

  // Update time every minute for expiration countdown
  useEffect(() => {
    if (!myStatus?.statusExpiresAt) return;

    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [myStatus?.statusExpiresAt]);

  const timeRemainingText = myStatus?.statusExpiresAt
    ? formatTimeRemaining(myStatus.statusExpiresAt - currentTime)
    : null;

  const handleStatusSelect = async (
    status: StatusType,
    duration?: StatusDuration
  ) => {
    try {
      await setStatusMutation({
        status,
        duration: status === 'ONLINE' ? undefined : duration,
      });
      onStatusChange?.();

      const statusLabel =
        STATUS_OPTIONS.find(s => s.value === status)?.label ?? status;
      if (duration && duration !== 'FOREVER' && status !== 'ONLINE') {
        const durationLabel =
          DURATION_OPTIONS.find(d => d.value === duration)?.label ?? duration;
        toast.success(`Status set to ${statusLabel} for ${durationLabel}`);
      } else {
        toast.success(`Status set to ${statusLabel}`);
      }
    } catch (error) {
      toast.error('Failed to update status');
      console.error('Failed to set status:', error);
    }
  };

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger className={cn('cursor-pointer', className)}>
        <div className='flex items-center gap-2 w-full'>
          <StatusIndicator
            status={currentDisplayStatus}
            size='sm'
            showBorder={false}
          />
          <span>{getStatusDisplayText(currentStatus)}</span>
        </div>
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent className='w-56'>
        {STATUS_OPTIONS.map(option => {
          const isSelected = currentStatus === option.value;

          // For non-ONLINE statuses, show duration submenu
          if (option.value !== 'ONLINE') {
            return (
              <DropdownMenuSub key={option.value}>
                <DropdownMenuSubTrigger className='cursor-pointer'>
                  <div className='flex items-center gap-2 flex-1'>
                    <StatusIndicator
                      status={option.displayStatus}
                      size='sm'
                      showBorder={false}
                    />
                    <div className='flex flex-col'>
                      <span>{option.label}</span>
                      <span className='text-xs text-muted-foreground'>
                        {option.description}
                      </span>
                    </div>
                  </div>
                  {isSelected && <Check className='size-4 ml-auto' />}
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className='w-44'>
                  {DURATION_OPTIONS.map(duration => (
                    <DropdownMenuItem
                      key={duration.value}
                      className='cursor-pointer'
                      onClick={() =>
                        handleStatusSelect(option.value, duration.value)
                      }
                    >
                      {duration.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            );
          }

          // ONLINE status - no duration submenu
          return (
            <DropdownMenuItem
              key={option.value}
              className='cursor-pointer'
              onClick={() => handleStatusSelect(option.value)}
            >
              <div className='flex items-center gap-2 flex-1'>
                <StatusIndicator
                  status={option.displayStatus}
                  size='sm'
                  showBorder={false}
                />
                <div className='flex flex-col'>
                  <span>{option.label}</span>
                  <span className='text-xs text-muted-foreground'>
                    {option.description}
                  </span>
                </div>
              </div>
              {isSelected && <Check className='size-4 ml-auto' />}
            </DropdownMenuItem>
          );
        })}

        {/* Show expiration info if status is set with duration */}
        {timeRemainingText && (
          <>
            <DropdownMenuSeparator />
            <div className='px-2 py-1.5 text-xs text-muted-foreground'>
              Reverts to Online {timeRemainingText}
            </div>
          </>
        )}
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  );
}

/**
 * Format remaining time for status expiration
 */
function formatTimeRemaining(ms: number): string {
  if (ms <= 0) return 'soon';

  const minutes = Math.floor(ms / (60 * 1000));
  const hours = Math.floor(ms / (60 * 60 * 1000));
  const days = Math.floor(ms / (24 * 60 * 60 * 1000));

  if (days > 0) return `in ${days} day${days > 1 ? 's' : ''}`;
  if (hours > 0) return `in ${hours} hour${hours > 1 ? 's' : ''}`;
  if (minutes > 0) return `in ${minutes} minute${minutes > 1 ? 's' : ''}`;
  return 'in less than a minute';
}
