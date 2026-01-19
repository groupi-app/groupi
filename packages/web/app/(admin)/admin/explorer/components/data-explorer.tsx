'use client';

import { useState, useCallback } from 'react';
import { useQuery } from 'convex/react';
import { EntityTabs } from './entity-tabs';
import { EntityTable } from './entity-table';
import { EntityDetailPanel } from './entity-detail-panel';
import { BreadcrumbTrail, type BreadcrumbItem } from './breadcrumb-trail';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Icons } from '@/components/icons';

// Lazy-load the API to avoid deep type instantiation issues
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _api: any;
function getApi() {
  if (!_api) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    _api = require('@/convex/_generated/api').api;
  }
  return _api;
}

export type EntityType = 'users' | 'events' | 'posts' | 'replies' | 'memberships';

export type DetailTarget = {
  type: 'user' | 'event' | 'post';
  id: string;
};

export function DataExplorer() {
  const [activeTab, setActiveTab] = useState<EntityType>('users');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [sortField, setSortField] = useState<string | undefined>(undefined);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [detailTarget, setDetailTarget] = useState<DetailTarget | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([]);

  // Debounce search
  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    const timer = setTimeout(() => {
      setDebouncedSearch(value);
      setCursor(undefined); // Reset pagination on search
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  // Tab change handler
  const handleTabChange = (tab: EntityType) => {
    setActiveTab(tab);
    setCursor(undefined);
    setSearch('');
    setDebouncedSearch('');
    setSortField(undefined);
    setBreadcrumbs([]);
  };

  // Handle clicking on a relation link
  const handleRelationClick = useCallback(
    (target: DetailTarget, label: string) => {
      // Add to breadcrumbs
      const newBreadcrumb: BreadcrumbItem = {
        label,
        target,
        timestamp: Date.now(),
      };
      setBreadcrumbs(prev => [...prev, newBreadcrumb]);
      setDetailTarget(target);
    },
    []
  );

  // Handle breadcrumb navigation
  const handleBreadcrumbClick = useCallback((index: number) => {
    if (index === -1) {
      // Clicked on "All" - close detail panel
      setBreadcrumbs([]);
      setDetailTarget(null);
    } else {
      // Clicked on a specific breadcrumb
      const crumb = breadcrumbs[index];
      setBreadcrumbs(prev => prev.slice(0, index + 1));
      if (crumb) {
        setDetailTarget(crumb.target);
      }
    }
  }, [breadcrumbs]);

  // Handle detail panel close
  const handleDetailClose = useCallback(() => {
    setDetailTarget(null);
    setBreadcrumbs([]);
  }, []);

  // Sort handler
  const handleSort = useCallback((field: string) => {
    setSortField(prev => {
      if (prev === field) {
        setSortDirection(d => (d === 'asc' ? 'desc' : 'asc'));
        return field;
      }
      setSortDirection('desc');
      return field;
    });
  }, []);

  // Fetch data based on active tab
  const api = getApi();
  const queryArgs = {
    cursor,
    limit: 50,
    search: debouncedSearch || undefined,
  };

  const usersData = useQuery(
    api.admin.queries.getUsersAdmin,
    activeTab === 'users' ? queryArgs : 'skip'
  );

  const eventsData = useQuery(
    api.admin.queries.getEventsAdmin,
    activeTab === 'events' ? queryArgs : 'skip'
  );

  const postsData = useQuery(
    api.admin.queries.getPostsAdmin,
    activeTab === 'posts' ? queryArgs : 'skip'
  );

  const repliesData = useQuery(
    api.admin.queries.getRepliesAdmin,
    activeTab === 'replies' ? queryArgs : 'skip'
  );

  const membershipsData = useQuery(
    api.admin.explorerQueries.getMembershipsAdmin,
    activeTab === 'memberships' ? queryArgs : 'skip'
  );

  // Get current data based on active tab
  const getCurrentData = () => {
    switch (activeTab) {
      case 'users':
        return usersData
          ? { items: usersData.users, ...usersData }
          : undefined;
      case 'events':
        return eventsData
          ? { items: eventsData.events, ...eventsData }
          : undefined;
      case 'posts':
        return postsData
          ? { items: postsData.posts, ...postsData }
          : undefined;
      case 'replies':
        return repliesData
          ? { items: repliesData.replies, ...repliesData }
          : undefined;
      case 'memberships':
        return membershipsData
          ? { items: membershipsData.memberships, ...membershipsData }
          : undefined;
      default:
        return undefined;
    }
  };

  const currentData = getCurrentData();
  const isLoading = currentData === undefined;

  return (
    <div className="space-y-4">
      <EntityTabs activeTab={activeTab} onTabChange={handleTabChange} />

      <Card>
        <CardContent className="pt-6">
          {/* Search */}
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1 max-w-sm">
              <Icons.search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={`Search ${activeTab}...`}
                value={search}
                onChange={e => handleSearchChange(e.target.value)}
                className="pl-9"
              />
            </div>
            {currentData && (
              <span className="text-sm text-muted-foreground">
                {currentData.totalCount} total
              </span>
            )}
          </div>

          {/* Breadcrumbs */}
          {breadcrumbs.length > 0 && (
            <BreadcrumbTrail
              items={breadcrumbs}
              onNavigate={handleBreadcrumbClick}
              entityType={activeTab}
            />
          )}

          {/* Table */}
          <EntityTable
            entityType={activeTab}
            data={currentData?.items || []}
            isLoading={isLoading}
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={handleSort}
            onRelationClick={handleRelationClick}
            hasMore={currentData?.hasMore ?? false}
            onLoadMore={() => setCursor(currentData?.nextCursor)}
          />
        </CardContent>
      </Card>

      {/* Detail Panel */}
      <EntityDetailPanel
        target={detailTarget}
        onClose={handleDetailClose}
        onNavigate={handleRelationClick}
      />
    </div>
  );
}
