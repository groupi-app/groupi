'use client';

import { useState, useMemo, useCallback } from 'react';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Icons } from '@/components/icons';
import { cn } from '@/lib/utils';
import {
  type AddonConfigProps,
  type EventCardProps,
  type ManageConfigProps,
  type AddonPageProps,
  registerAddon,
} from '../addon-registry';
import {
  useAddonData,
  useSetAddonData,
  useDeleteAddonData,
} from '@/hooks/convex/use-addons';
import {
  useEventHeaderData,
  useEventAttendeesData,
} from '@/hooks/convex/use-events';
import { useGlobalUser } from '@/context/global-user-context';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitialsFromName } from '@/lib/utils';
import { downloadFile, toCSV, toJSON } from '@/lib/export-utils';

// ===== Types =====

interface BringListItem {
  id: string;
  name: string;
  quantity: number;
}

interface MemberInfo {
  name: string;
  username?: string;
  image?: string;
}

// ===== Item Builder (shared between create + manage) =====

function ItemBuilder({
  items,
  onChange,
}: {
  items: BringListItem[];
  onChange: (items: BringListItem[]) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newQuantity, setNewQuantity] = useState(1);

  const handleAdd = () => {
    if (!newName.trim()) return;

    const item: BringListItem = {
      id: crypto.randomUUID(),
      name: newName.trim(),
      quantity: Math.max(1, newQuantity),
    };

    onChange([...items, item]);
    setNewName('');
    setNewQuantity(1);
    setAdding(false);
  };

  const handleRemove = (id: string) => {
    onChange(items.filter(i => i.id !== id));
  };

  return (
    <div className='space-y-3'>
      {items.map(item => (
        <div
          key={item.id}
          className='flex items-center gap-2 p-3 bg-muted rounded-card'
        >
          <div className='flex-1 min-w-0'>
            <p className='text-sm font-medium truncate'>{item.name}</p>
            <p className='text-xs text-muted-foreground'>
              Quantity: {item.quantity}
            </p>
          </div>
          <Button
            type='button'
            variant='ghost'
            size='sm'
            onClick={() => handleRemove(item.id)}
            className='shrink-0'
          >
            <Icons.delete className='size-4 text-muted-foreground' />
          </Button>
        </div>
      ))}

      {adding ? (
        <div className='space-y-3 p-3 border rounded-card'>
          <Input
            placeholder='Item name (e.g. "Chips")'
            value={newName}
            onChange={e => setNewName(e.target.value)}
            autoFocus
          />
          <div className='flex items-center gap-2'>
            <label className='text-sm text-muted-foreground whitespace-nowrap'>
              Quantity needed:
            </label>
            <Input
              type='number'
              min={1}
              value={newQuantity}
              onChange={e => setNewQuantity(Number(e.target.value) || 1)}
              className='w-20'
            />
          </div>
          <div className='flex gap-2'>
            <Button type='button' size='sm' onClick={handleAdd}>
              Add
            </Button>
            <Button
              type='button'
              variant='ghost'
              size='sm'
              onClick={() => setAdding(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <Button
          type='button'
          variant='outline'
          size='sm'
          onClick={() => setAdding(true)}
          className='w-full'
        >
          <Icons.plus className='size-4 mr-1' />
          Add Item
        </Button>
      )}
    </div>
  );
}

// ===== Create Wizard Config =====

function BringListCreateConfig({ formState, setFormState }: AddonConfigProps) {
  const items: BringListItem[] =
    (formState.addonConfigs?.['bring-list']?.items as BringListItem[]) ?? [];

  const handleChange = (updated: BringListItem[]) => {
    setFormState({
      ...formState,
      addonConfigs: {
        ...formState.addonConfigs,
        'bring-list': { items: updated },
      },
    });
  };

  return (
    <div className='space-y-2'>
      <label className='text-sm font-medium leading-none'>
        Items for attendees to bring
      </label>
      <ItemBuilder items={items} onChange={handleChange} />
      {items.length === 0 && (
        <p className='text-sm text-muted-foreground'>
          Add at least one item to enable the bring list.
        </p>
      )}
    </div>
  );
}

// ===== Event Page Card =====

function BringListEventCard({ eventId, config }: EventCardProps) {
  const allData = useAddonData(eventId, 'bring-list');
  const eventData = useEventHeaderData(eventId);
  const isOrganizer = eventData?.userMembership?.role === 'ORGANIZER';

  const items = (config?.items as BringListItem[]) ?? [];
  const totalNeeded = items.reduce((sum, i) => sum + i.quantity, 0);

  const totalClaimed = useMemo(() => {
    if (!allData) return 0;
    const claims = allData.filter((d: { key: string }) =>
      d.key.startsWith('claims:')
    );
    let claimed = 0;
    for (const entry of claims) {
      const data = entry.data as Record<string, number>;
      for (const qty of Object.values(data)) {
        if (qty > 0) claimed += qty;
      }
    }
    return claimed;
  }, [allData]);

  return (
    <Card className='rounded-card shadow-raised p-4 w-fit'>
      <div className='flex items-center gap-3'>
        <div className='flex items-center justify-center size-9 rounded-card bg-bg-info-subtle text-info shrink-0'>
          <Icons.listChecks className='size-5' />
        </div>
        <div>
          <p className='font-medium'>Bring List</p>
          <p className='text-sm text-muted-foreground'>
            {totalClaimed} / {totalNeeded} items claimed
          </p>
        </div>
        <Button variant='outline' size='sm' asChild className='shrink-0'>
          <a href={`/event/${eventId}/addon/bring-list`}>
            {isOrganizer ? 'View Claims' : 'View List'}
          </a>
        </Button>
      </div>
    </Card>
  );
}

// ===== Manage Page Config =====

function BringListManageConfig({
  config,
  onSave,
  onDisable,
  isSaving,
}: ManageConfigProps) {
  const currentItems = (config?.items as BringListItem[]) ?? [];
  const [items, setItems] = useState<BringListItem[]>(currentItems);
  const enabled = config !== null;
  const [pendingEnable, setPendingEnable] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const isOn = enabled || pendingEnable;

  const handleToggle = async (checked: boolean) => {
    if (!checked) {
      setExpanded(false);
      setPendingEnable(false);
      await onDisable();
    } else if (items.length > 0) {
      await onSave({ items });
      setExpanded(true);
    } else {
      setPendingEnable(true);
      setExpanded(true);
    }
  };

  const handleSaveItems = async () => {
    if (items.length === 0) {
      toast.error('Add at least one item');
      return;
    }
    await onSave({ items });
    setPendingEnable(false);
  };

  const hasChanges = JSON.stringify(items) !== JSON.stringify(currentItems);

  return (
    <Card
      className={cn(
        'transition-all duration-normal',
        isOn && 'ring-2 ring-primary/30'
      )}
    >
      <div className='flex items-center gap-3 p-4'>
        <div className='flex size-10 shrink-0 items-center justify-center rounded-button bg-muted'>
          <Icons.listChecks className='size-5 text-muted-foreground' />
        </div>
        <div className='flex-1 min-w-0'>
          <p className='text-sm font-medium leading-none'>Bring List</p>
          <p className='text-sm text-muted-foreground mt-1'>
            Coordinate what attendees bring to the event
          </p>
        </div>
        {isOn && (
          <button
            type='button'
            onClick={() => setExpanded(prev => !prev)}
            className='shrink-0 p-1 rounded-md hover:bg-muted transition-colors duration-fast'
            aria-label={expanded ? 'Collapse settings' : 'Expand settings'}
          >
            <Icons.down
              className={cn(
                'size-4 text-muted-foreground transition-transform duration-normal',
                expanded && 'rotate-180'
              )}
            />
          </button>
        )}
        <Switch
          checked={isOn}
          onCheckedChange={handleToggle}
          disabled={isSaving}
          data-test='addon-toggle-bring-list'
        />
      </div>
      <Collapsible open={isOn && expanded}>
        <CollapsibleContent>
          <div className='px-4 pb-4 pt-0 space-y-3'>
            <ItemBuilder items={items} onChange={setItems} />
            {(hasChanges || pendingEnable) && items.length > 0 && (
              <>
                <p className='text-sm text-warning'>
                  Saving changes will reset all existing claims and notify
                  members.
                </p>
                <Button
                  type='button'
                  size='sm'
                  onClick={handleSaveItems}
                  disabled={isSaving}
                  isLoading={isSaving}
                >
                  Save Items
                </Button>
              </>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

// ===== Claim helpers =====

type ClaimsMap = Record<string, number>;

interface ClaimSummary {
  totalClaimed: number;
  claimants: Array<{
    personId: string;
    quantity: number;
    member?: MemberInfo;
  }>;
}

function buildClaimSummaries(
  allData: Array<{ key: string; data: unknown }> | undefined,
  memberLookup: Map<string, MemberInfo>
): Record<string, ClaimSummary> {
  const summaries: Record<string, ClaimSummary> = {};

  if (!allData) return summaries;

  const claims = allData.filter(d => d.key.startsWith('claims:'));
  for (const entry of claims) {
    const personId = entry.key.replace('claims:', '');
    const data = entry.data as ClaimsMap;
    for (const [itemId, qty] of Object.entries(data)) {
      if (qty <= 0) continue;
      if (!summaries[itemId]) {
        summaries[itemId] = { totalClaimed: 0, claimants: [] };
      }
      summaries[itemId].totalClaimed += qty;
      summaries[itemId].claimants.push({
        personId,
        quantity: qty,
        member: memberLookup.get(personId),
      });
    }
  }

  return summaries;
}

// ===== Bring List Page =====

function BringListPageComponent({ eventId, config }: AddonPageProps) {
  const { person } = useGlobalUser();
  const allData = useAddonData(eventId, 'bring-list');
  const setAddonData = useSetAddonData();
  const deleteAddonData = useDeleteAddonData();
  const eventData = useEventHeaderData(eventId);
  const attendeesData = useEventAttendeesData(eventId);
  const isOrganizer = eventData?.userMembership?.role === 'ORGANIZER';

  const items = (config?.items as BringListItem[]) ?? [];
  const personId = person?._id as string | undefined;

  // Build member lookup
  const memberLookup = useMemo(() => {
    const members = attendeesData?.event?.memberships;
    if (!members) return new Map<string, MemberInfo>();
    const map = new Map<string, MemberInfo>();
    for (const m of members) {
      if (m.person) {
        map.set(m.personId as string, {
          name: m.person.user?.name || m.person.user?.email || 'Unknown',
          username: m.person.user?.username || undefined,
          image: m.person.user?.image || undefined,
        });
      }
    }
    return map;
  }, [attendeesData]);

  // Build claim summaries per item
  const claimSummaries = useMemo(
    () => buildClaimSummaries(allData, memberLookup),
    [allData, memberLookup]
  );

  // Current user's claims
  const myClaims: ClaimsMap = useMemo(() => {
    if (!allData || !personId) return {};
    const entry = allData.find(
      (d: { key: string }) => d.key === `claims:${personId}`
    );
    return entry ? (entry.data as ClaimsMap) : {};
  }, [allData, personId]);

  const saveClaims = useCallback(
    async (updatedClaims: ClaimsMap) => {
      if (!personId) return;

      // Filter out zero-quantity entries
      const nonZero: ClaimsMap = {};
      for (const [itemId, qty] of Object.entries(updatedClaims)) {
        if (qty > 0) nonZero[itemId] = qty;
      }

      if (Object.keys(nonZero).length === 0) {
        // No claims — delete the entry
        try {
          await deleteAddonData(eventId, 'bring-list', `claims:${personId}`);
        } catch {
          // Entry may not exist, which is fine
        }
      } else {
        await setAddonData(
          eventId,
          'bring-list',
          `claims:${personId}`,
          nonZero
        );
      }
    },
    [eventId, personId, setAddonData, deleteAddonData]
  );

  if (!config || items.length === 0) {
    return (
      <p className='text-muted-foreground'>
        The bring list has not been configured yet.
      </p>
    );
  }

  return (
    <div className='space-y-6'>
      <BringListOverview
        items={items}
        claimSummaries={claimSummaries}
        showExport={isOrganizer}
      />
      <div className='space-y-3'>
        {items.map(item => (
          <BringListItemRow
            key={item.id}
            item={item}
            summary={claimSummaries[item.id]}
            myClaimQty={myClaims[item.id] ?? 0}
            onClaim={qty => {
              const updated = { ...myClaims, [item.id]: qty };
              saveClaims(updated);
            }}
          />
        ))}
      </div>
    </div>
  );
}

// ===== Single Item Row =====

function BringListItemRow({
  item,
  summary,
  myClaimQty,
  onClaim,
}: {
  item: BringListItem;
  summary?: ClaimSummary;
  myClaimQty: number;
  onClaim: (qty: number) => void;
}) {
  const [editingQty, setEditingQty] = useState(false);
  const [qtyInput, setQtyInput] = useState(1);

  const totalClaimed = summary?.totalClaimed ?? 0;
  const remaining = item.quantity - totalClaimed;
  const iAmBringing = myClaimQty > 0;

  const handleBring = () => {
    if (item.quantity === 1) {
      // Toggle behavior for single-quantity items
      onClaim(iAmBringing ? 0 : 1);
    } else if (iAmBringing) {
      // Already claiming — unclaim
      onClaim(0);
    } else {
      // Show quantity picker
      setQtyInput(Math.min(1, remaining));
      setEditingQty(true);
    }
  };

  const handleConfirmQty = () => {
    const qty = Math.max(0, Math.min(qtyInput, remaining + myClaimQty));
    onClaim(qty);
    setEditingQty(false);
  };

  return (
    <Card className='rounded-card shadow-raised p-4'>
      <div className='flex items-start gap-3'>
        <div className='flex-1 min-w-0'>
          <p className='font-medium'>{item.name}</p>
          <p className='text-sm text-muted-foreground mt-0.5'>
            {totalClaimed} / {item.quantity} claimed
          </p>

          {/* Claimants */}
          {summary && summary.claimants.length > 0 && (
            <div className='flex flex-wrap gap-2 mt-2'>
              {summary.claimants.map(c => (
                <div
                  key={c.personId}
                  className='flex items-center gap-1.5 text-xs bg-muted rounded-badge px-2 py-1'
                >
                  <Avatar className='size-5'>
                    <AvatarImage src={c.member?.image} />
                    <AvatarFallback className='text-[10px]'>
                      {getInitialsFromName(
                        c.member?.name ?? null,
                        c.member?.username
                      )}
                    </AvatarFallback>
                  </Avatar>
                  <span className='truncate max-w-[100px]'>
                    {c.member?.name ?? 'Unknown'}
                  </span>
                  {c.quantity > 1 && (
                    <span className='text-muted-foreground'>×{c.quantity}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className='shrink-0 flex flex-col items-end gap-2'>
          {editingQty ? (
            <div className='flex items-center gap-2'>
              <Input
                type='number'
                min={1}
                max={remaining + myClaimQty}
                value={qtyInput}
                onChange={e => setQtyInput(Number(e.target.value) || 1)}
                className='w-16 h-8 text-sm'
                autoFocus
              />
              <Button size='sm' onClick={handleConfirmQty}>
                Save
              </Button>
              <Button
                size='sm'
                variant='ghost'
                onClick={() => setEditingQty(false)}
              >
                <Icons.close className='size-4' />
              </Button>
            </div>
          ) : (
            <Button
              size='sm'
              variant={iAmBringing ? 'secondary' : 'default'}
              onClick={handleBring}
              disabled={!iAmBringing && remaining <= 0}
            >
              {iAmBringing
                ? `Bringing${myClaimQty > 1 ? ` ×${myClaimQty}` : ''}`
                : remaining <= 0
                  ? 'All Claimed'
                  : "I'll Bring This"}
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}

// ===== Overview Card =====

function BringListOverview({
  items,
  claimSummaries,
  showExport,
}: {
  items: BringListItem[];
  claimSummaries: Record<string, ClaimSummary>;
  showExport: boolean;
}) {
  const totalItems = items.length;
  const totalNeeded = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalClaimed = Object.values(claimSummaries).reduce(
    (sum, s) => sum + s.totalClaimed,
    0
  );

  const handleExport = useCallback(
    (format: 'csv' | 'json') => {
      const headers = ['Item', 'Needed', 'Claimed', 'Remaining', 'Claimants'];
      const date = new Date().toISOString().slice(0, 10);
      const filename = `bring-list-${date}.${format}`;

      if (format === 'csv') {
        const rows = items.map(item => {
          const summary = claimSummaries[item.id];
          const claimed = summary?.totalClaimed ?? 0;
          const claimantStr =
            summary?.claimants
              .map(c => {
                const name = c.member?.name ?? 'Unknown';
                return c.quantity > 1 ? `${name} (×${c.quantity})` : name;
              })
              .join('; ') ?? '';

          return [
            item.name,
            String(item.quantity),
            String(claimed),
            String(item.quantity - claimed),
            claimantStr,
          ];
        });
        downloadFile(toCSV(headers, rows), filename, 'text/csv');
      } else {
        const rows = items.map(item => {
          const summary = claimSummaries[item.id];
          const claimed = summary?.totalClaimed ?? 0;
          return {
            Item: item.name,
            Needed: item.quantity,
            Claimed: claimed,
            Remaining: item.quantity - claimed,
            Claimants:
              summary?.claimants.map(c => ({
                name: c.member?.name ?? 'Unknown',
                quantity: c.quantity,
              })) ?? [],
          };
        });
        downloadFile(toJSON(headers, rows), filename, 'application/json');
      }

      toast.success(`Exported bring list as ${format.toUpperCase()}`);
    },
    [items, claimSummaries]
  );

  return (
    <Card className='rounded-card shadow-raised p-4'>
      <div className='flex items-center justify-between'>
        <div>
          <p className='font-medium'>Overview</p>
          <p className='text-sm text-muted-foreground'>
            {totalClaimed} / {totalNeeded} items claimed across {totalItems}{' '}
            {totalItems === 1 ? 'type' : 'types'}
          </p>
        </div>
        {showExport && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant='outline' size='sm'>
                <Icons.download className='size-4 mr-1.5' />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end'>
              <DropdownMenuItem onClick={() => handleExport('csv')}>
                Export as CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('json')}>
                Export as JSON
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </Card>
  );
}

// ===== Registration =====

registerAddon({
  id: 'bring-list',
  name: 'Bring List',
  description: 'Coordinate what attendees bring to the event',
  iconName: 'listChecks',
  author: { name: 'Groupi' },

  // Create wizard
  CreateConfigComponent: BringListCreateConfig,
  isEnabled: formState => formState.addonConfigs?.['bring-list'] !== undefined,
  onEnable: formState => ({
    addonConfigs: {
      ...formState.addonConfigs,
      'bring-list': { items: [] },
    },
  }),
  onDisable: formState => {
    const { 'bring-list': _, ...rest } = formState.addonConfigs ?? {};
    return { addonConfigs: rest };
  },
  getConfigFromFormState: formState => {
    const config = formState.addonConfigs?.['bring-list'];
    if (!config) return null;
    const items = config.items as BringListItem[] | undefined;
    if (!items || items.length === 0) return null;
    return config;
  },

  // Event page
  EventCardComponent: BringListEventCard,

  // Manage page
  ManageConfigComponent: BringListManageConfig,

  // Dedicated page
  PageComponent: BringListPageComponent,
  pageTitle: 'Bring List',

  // No opt-out, no gating
  supportsOptOut: false,
  requiresCompletion: false,
});
