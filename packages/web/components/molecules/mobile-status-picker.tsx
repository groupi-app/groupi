'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { cn } from '@/lib/utils';
import { StatusIndicator } from '@/components/atoms';
import { DisplayStatus, getStatusDisplayText } from '@/lib/utils';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Check, ChevronLeft } from 'lucide-react';
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

interface MobileStatusPickerProps {
  className?: string;
  onStatusChange?: () => void;
}

// Return type of getMyStatus query
type MyStatusResult = {
  status: 'ONLINE' | 'IDLE' | 'DO_NOT_DISTURB' | 'INVISIBLE';
  statusExpiresAt: number | undefined;
  statusSetAt: number | undefined;
  autoIdleEnabled: boolean;
  statusVisibility: 'EVERYONE' | 'FRIENDS' | 'NONE';
  lastSeen: number | undefined;
} | null;

/**
 * MobileStatusPicker - Standalone status selection for mobile nav
 *
 * Opens in a bottom sheet with drill-down navigation for duration selection.
 */
export function MobileStatusPicker({
  className,
  onStatusChange,
}: MobileStatusPickerProps) {
  const myStatus: MyStatusResult | undefined = useQuery(
    presenceApi.getMyStatus
  );
  const setStatusMutation = useMutation(presenceApi.setStatus);

  // Optimistic status state for instant UI feedback
  const [optimisticStatus, setOptimisticStatus] = useState<StatusType | null>(
    null
  );

  // Use optimistic status if set, otherwise use server status
  const currentStatus = optimisticStatus ?? myStatus?.status ?? 'ONLINE';
  const currentDisplayStatus: DisplayStatus =
    currentStatus === 'DO_NOT_DISTURB'
      ? 'dnd'
      : (currentStatus.toLowerCase() as DisplayStatus);

  const [isOpen, setIsOpen] = useState(false);
  // Track which status is selected for duration view (null = main view)
  const [selectedStatus, setSelectedStatus] = useState<StatusType | null>(null);

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

  // Handle sheet open state and reset state when closing
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setSelectedStatus(null);
      setOptimisticStatus(null);
    }
  };

  const timeRemainingText = myStatus?.statusExpiresAt
    ? formatTimeRemaining(myStatus.statusExpiresAt - currentTime)
    : null;

  const handleStatusSelect = async (
    status: StatusType,
    duration?: StatusDuration
  ) => {
    // Optimistically update the UI immediately
    setOptimisticStatus(status);
    // Go back to main view (don't close the drawer)
    setSelectedStatus(null);

    try {
      await setStatusMutation({
        status,
        duration: status === 'ONLINE' ? undefined : duration,
      });
      onStatusChange?.();
      // Clear optimistic state once server confirms
      setOptimisticStatus(null);

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
      // Revert optimistic update on error
      setOptimisticStatus(null);
      toast.error('Failed to update status');
      console.error('Failed to set status:', error);
    }
  };

  const selectedStatusOption = selectedStatus
    ? STATUS_OPTIONS.find(s => s.value === selectedStatus)
    : null;

  return (
    <Sheet open={isOpen} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        <button
          className={cn(
            'flex items-center justify-between w-full text-base',
            className
          )}
        >
          <div className='flex items-center gap-3'>
            <StatusIndicator
              status={currentDisplayStatus}
              size='md'
              showBorder={false}
            />
            <div className='flex flex-col items-start'>
              <span className='font-medium'>
                {getStatusDisplayText(currentStatus)}
              </span>
              {timeRemainingText && (
                <span className='text-xs text-muted-foreground'>
                  Reverts to Online {timeRemainingText}
                </span>
              )}
            </div>
          </div>
        </button>
      </SheetTrigger>
      <SheetContent side='bottom' className='max-h-[80vh] overflow-y-auto'>
        {/* Duration selection view */}
        {selectedStatus && selectedStatusOption ? (
          <>
            <SheetHeader className='flex-row items-center gap-2'>
              <button
                onClick={() => setSelectedStatus(null)}
                className='p-2 -ml-2 rounded-full hover:bg-accent/80 transition-colors'
                aria-label='Go back'
              >
                <ChevronLeft className='size-5' />
              </button>
              <div className='flex items-center gap-2'>
                <StatusIndicator
                  status={selectedStatusOption.displayStatus}
                  size='md'
                  showBorder={false}
                />
                <SheetTitle>{selectedStatusOption.label}</SheetTitle>
              </div>
            </SheetHeader>
            <div className='mt-4 space-y-1'>
              <p className='text-sm text-muted-foreground mb-3'>
                How long do you want to appear{' '}
                {selectedStatusOption.label.toLowerCase()}?
              </p>
              {DURATION_OPTIONS.map(duration => (
                <button
                  key={duration.value}
                  onClick={() =>
                    handleStatusSelect(selectedStatus, duration.value)
                  }
                  className='flex items-center w-full p-4 text-base rounded-button hover:bg-accent/80 transition-colors text-left'
                >
                  {duration.label}
                </button>
              ))}
            </div>
          </>
        ) : (
          /* Main status selection view */
          <>
            <SheetHeader>
              <SheetTitle>Set Your Status</SheetTitle>
            </SheetHeader>
            <div className='mt-6 space-y-2'>
              {STATUS_OPTIONS.map(option => {
                const isSelected = currentStatus === option.value;

                // For ONLINE status - direct selection
                if (option.value === 'ONLINE') {
                  return (
                    <button
                      key={option.value}
                      onClick={() => handleStatusSelect(option.value)}
                      className='flex items-center gap-3 w-full p-4 rounded-button hover:bg-accent/80 transition-colors'
                    >
                      <StatusIndicator
                        status={option.displayStatus}
                        size='md'
                        showBorder={false}
                      />
                      <div className='flex flex-col items-start flex-1'>
                        <span className='text-base font-medium'>
                          {option.label}
                        </span>
                        <span className='text-sm text-muted-foreground'>
                          {option.description}
                        </span>
                      </div>
                      {isSelected && <Check className='size-5 text-success' />}
                    </button>
                  );
                }

                // For other statuses - navigate to duration view
                return (
                  <button
                    key={option.value}
                    onClick={() => setSelectedStatus(option.value)}
                    className='flex items-center gap-3 w-full p-4 rounded-button hover:bg-accent/80 transition-colors'
                  >
                    <StatusIndicator
                      status={option.displayStatus}
                      size='md'
                      showBorder={false}
                    />
                    <div className='flex flex-col items-start flex-1'>
                      <span className='text-base font-medium'>
                        {option.label}
                      </span>
                      <span className='text-sm text-muted-foreground'>
                        {option.description}
                      </span>
                    </div>
                    {isSelected && <Check className='size-5 text-success' />}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
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
