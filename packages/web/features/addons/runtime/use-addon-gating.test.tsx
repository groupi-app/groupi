import { render, renderHook, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useQuery } from 'convex/react';
import { getFunctionName, type FunctionReturnType } from 'convex/server';
import { api } from '@/convex/_generated/api';
import type { Doc, Id } from '@/convex/_generated/dataModel';
import { useAddonGating } from './use-addon-gating';
import { EventAddonGate } from './event-addon-gate';

vi.unmock('@/convex/_generated/api');
const navigation = vi.hoisted(() => ({
  pathname: '/event/event-a',
  replace: vi.fn(),
}));
vi.mock('next/navigation', () => ({
  usePathname: () => navigation.pathname,
  useRouter: () => ({ replace: navigation.replace }),
}));

const eventId = 'event-a' as Id<'events'>;
type Status = FunctionReturnType<
  typeof api.addons.queries.getAddonCompletionStatus
>;
let status: Status | undefined;
let configs: Doc<'eventAddonConfigs'>[] | undefined;

function savedConfig(
  addonType = 'questionnaire',
  options: { required?: boolean; cardOnly?: boolean; enabled?: boolean } = {}
): Doc<'eventAddonConfigs'> {
  return {
    _id: 'config-a' as Id<'eventAddonConfigs'>,
    _creationTime: 1,
    createdAt: 1,
    updatedAt: 1,
    eventId,
    addonType,
    enabled: options.enabled ?? true,
    config: addonType.startsWith('custom:')
      ? {
          templateId: 'shared-template',
          template: {
            name: 'Event copy',
            description: '',
            iconName: 'list',
            sections: [],
            settings: {
              requiresCompletion: options.required ?? true,
              cardOnly: options.cardOnly ?? false,
            },
          },
        }
      : {},
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  navigation.pathname = `/event/${eventId}`;
  status = {
    isOrganizer: false,
    availability: { required: false, completed: false },
    addons: [{ addonType: 'questionnaire', completed: false }],
  };
  configs = [savedConfig()];
  vi.mocked(useQuery).mockImplementation((query, args?) => {
    if (args === 'skip') return undefined;
    switch (getFunctionName(query)) {
      case 'addons/queries:getAddonCompletionStatus':
        return status;
      case 'addons/queries:getEventAddons':
        return configs;
      default:
        throw new Error(`Unexpected query: ${getFunctionName(query)}`);
    }
  });
});

describe('useAddonGating', () => {
  it('waits for completion status and event configuration', () => {
    status = undefined;
    const { result, rerender } = renderHook(() => useAddonGating(eventId));
    expect(result.current).toEqual({ redirectTo: null, isLoading: true });
    status = {
      isOrganizer: false,
      availability: { required: false, completed: false },
      addons: [],
    };
    configs = undefined;
    rerender();
    expect(result.current).toEqual({ redirectTo: null, isLoading: true });
  });

  it('does not query member-only configs without membership', () => {
    status = null;
    const { result } = renderHook(() => useAddonGating(eventId));
    expect(result.current).toEqual({ redirectTo: null, isLoading: false });
    expect(useQuery).toHaveBeenCalledWith(
      api.addons.queries.getEventAddons,
      'skip'
    );
  });

  it('exempts organizers even when availability and add-ons are incomplete', () => {
    status!.isOrganizer = true;
    status!.availability.required = true;
    configs = undefined;
    const { result } = renderHook(() => useAddonGating(eventId));
    expect(result.current).toEqual({ redirectTo: null, isLoading: false });
  });

  it('checks availability before waiting for required add-on configs', () => {
    status!.availability.required = true;
    configs = undefined;
    const { result } = renderHook(() => useAddonGating(eventId));
    expect(result.current.redirectTo).toBe(`/event/${eventId}/availability`);
  });

  it('finds required built-ins on first navigation without registration imports', () => {
    const { result } = renderHook(() => useAddonGating(eventId));
    expect(result.current.redirectTo).toBe(
      `/event/${eventId}/addon/questionnaire`
    );
  });

  it('unblocks event content after completion', () => {
    const { result, rerender } = renderHook(() => useAddonGating(eventId));
    expect(result.current.redirectTo).toContain('/addon/questionnaire');
    status!.addons[0].completed = true;
    rerender();
    expect(result.current).toEqual({ redirectTo: null, isLoading: false });
  });

  it('uses each event copy when switching between events using one custom template', () => {
    status!.addons = [
      { addonType: 'custom:shared-template', completed: false },
    ];
    configs = [savedConfig('custom:shared-template')];
    const { result, rerender } = renderHook(({ id }) => useAddonGating(id), {
      initialProps: { id: eventId },
    });
    expect(result.current.redirectTo).toBe(
      `/event/${eventId}/addon/custom:shared-template`
    );
    configs = [savedConfig('custom:shared-template', { required: false })];
    rerender({ id: 'event-b' as Id<'events'> });
    expect(result.current.redirectTo).toBeNull();
    configs = [savedConfig('custom:shared-template')];
    rerender({ id: eventId });
    expect(result.current.redirectTo).toBe(
      `/event/${eventId}/addon/custom:shared-template`
    );
  });

  it.each([
    ['disabled', savedConfig('questionnaire', { enabled: false })],
    ['optional', savedConfig('reminders')],
    ['unsupported', savedConfig('unknown-addon')],
    ['card-only', savedConfig('custom:shared-template', { cardOnly: true })],
  ])('does not gate a %s add-on', (_, config) => {
    configs = [config];
    status!.addons = [{ addonType: config.addonType, completed: false }];
    const { result } = renderHook(() => useAddonGating(eventId));
    expect(result.current.redirectTo).toBeNull();
  });

  it('preserves completion-query ordering', () => {
    configs = [savedConfig(), savedConfig('custom:shared-template')];
    status!.addons = [
      { addonType: 'custom:shared-template', completed: false },
      { addonType: 'questionnaire', completed: false },
    ];
    const { result } = renderHook(() => useAddonGating(eventId));
    expect(result.current.redirectTo).toBe(
      `/event/${eventId}/addon/custom:shared-template`
    );
  });
});

describe('EventAddonGate', () => {
  it('hides event content while loading and while redirecting', () => {
    status = undefined;
    const { rerender } = render(
      <EventAddonGate eventId={eventId}>
        <p>Event discussion</p>
      </EventAddonGate>
    );
    expect(screen.queryByText('Event discussion')).not.toBeInTheDocument();
    expect(screen.getByRole('status')).toBeInTheDocument();
    status = {
      isOrganizer: false,
      availability: { required: false, completed: false },
      addons: [{ addonType: 'questionnaire', completed: false }],
    };
    rerender(
      <EventAddonGate eventId={eventId}>
        <p>Event discussion</p>
      </EventAddonGate>
    );
    expect(screen.queryByText('Event discussion')).not.toBeInTheDocument();
    expect(navigation.replace).toHaveBeenCalledWith(
      `/event/${eventId}/addon/questionnaire`
    );
    status.addons[0].completed = true;
    rerender(
      <EventAddonGate eventId={eventId}>
        <p>Event discussion</p>
      </EventAddonGate>
    );
    expect(screen.getByText('Event discussion')).toBeInTheDocument();
  });

  it.each([
    '/availability',
    '/addon/questionnaire',
    '/addon/custom:shared-template',
    '/manage-addons',
    '/settings',
    '/settings/details',
    '/settings/addons',
  ])('permits the workflow route %s', route => {
    navigation.pathname = `/event/${eventId}${route}`;
    render(
      <EventAddonGate eventId={eventId}>
        <p>Workflow</p>
      </EventAddonGate>
    );
    expect(screen.getByText('Workflow')).toBeInTheDocument();
    expect(navigation.replace).not.toHaveBeenCalled();
  });

  it.each([
    '/post/settings',
    '/settings-extra',
    '/post/availability',
    '/addon/questionnaire/posts',
  ])('does not exempt a substring or nested route %s', route => {
    navigation.pathname = `/event/${eventId}${route}`;
    render(
      <EventAddonGate eventId={eventId}>
        <p>Event discussion</p>
      </EventAddonGate>
    );
    expect(screen.queryByText('Event discussion')).not.toBeInTheDocument();
    expect(navigation.replace).toHaveBeenCalledWith(
      `/event/${eventId}/addon/questionnaire`
    );
  });
});
