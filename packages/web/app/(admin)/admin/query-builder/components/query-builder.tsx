'use client';

import { useState, useCallback, useEffect } from 'react';
import { useQuery } from 'convex/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Icons } from '@/components/icons';
import { FilterGroup } from './filter-group';
import { SortConfig } from './sort-config';
import { PresetManager, type QueryPreset } from './preset-manager';
import { ResultsPanel } from './results-panel';
import { QueryPreview } from './query-preview';

// Lazy-load the API
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

export type FilterCondition = {
  id: string;
  field: string;
  operator: string;
  value: string | number;
  valueLabel?: string; // Display label for entity picker selections
};

export type FilterGroupData = {
  id: string;
  logic: 'AND' | 'OR';
  conditions: FilterCondition[];
};

export type QueryState = {
  entity: EntityType;
  filterGroups: FilterGroupData[];
  sortField: string;
  sortDirection: 'asc' | 'desc';
};

const defaultQueryState: QueryState = {
  entity: 'users',
  filterGroups: [],
  sortField: 'createdAt',
  sortDirection: 'desc',
};

export function QueryBuilder() {
  const [queryState, setQueryState] = useState<QueryState>(defaultQueryState);
  const [executeEnabled, setExecuteEnabled] = useState(false);
  const [cursor, setCursor] = useState<string | undefined>(undefined);

  const api = getApi();

  // Fetch entity fields for the selected entity
  const entityFields = useQuery(api.admin.queryBuilder.getEntityFields, {
    entity: queryState.entity,
  });

  // Build query filters - keep all conditions including relationship ones in their groups
  const buildQueryFilters = () => {
    // Transform conditions to include relationship metadata
    return queryState.filterGroups.map(group => ({
      logic: group.logic,
      conditions: group.conditions.map(c => ({
        field: c.field,
        operator: c.operator,
        value: c.value,
      })),
    }));
  };

  // Execute query
  const filters = executeEnabled ? buildQueryFilters() : [];

  const queryArgs = executeEnabled
    ? {
        entity: queryState.entity,
        filters: filters.length > 0 ? filters : undefined,
        sortField: queryState.sortField || undefined,
        sortDirection: queryState.sortDirection,
        cursor,
        limit: 50,
      }
    : 'skip';

  const queryResult = useQuery(
    api.admin.queryBuilder.executeQuery,
    queryArgs
  );

  // Reset cursor when query parameters change
  // Use JSON.stringify for filterGroups to ensure stable dependency comparison
  const filterGroupsKey = JSON.stringify(queryState.filterGroups);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- resetting cursor on query param changes
    setCursor(undefined);
  }, [
    queryState.entity,
    filterGroupsKey,
    queryState.sortField,
    queryState.sortDirection,
  ]);

  // Handler for entity change
  const handleEntityChange = useCallback((entity: EntityType) => {
    setQueryState(prev => ({
      ...prev,
      entity,
      filterGroups: [],
      sortField: 'createdAt',
    }));
    setExecuteEnabled(false);
  }, []);

  // Handler for adding a filter group
  const handleAddFilterGroup = useCallback(() => {
    const newGroup: FilterGroupData = {
      id: `group-${Date.now()}`,
      logic: 'AND',
      conditions: [
        {
          id: `condition-${Date.now()}`,
          field: entityFields?.[0]?.name || '',
          operator: 'contains',
          value: '',
        },
      ],
    };
    setQueryState(prev => ({
      ...prev,
      filterGroups: [...prev.filterGroups, newGroup],
    }));
  }, [entityFields]);

  // Handler for updating a filter group
  const handleUpdateFilterGroup = useCallback((groupId: string, data: Partial<FilterGroupData>) => {
    setQueryState(prev => ({
      ...prev,
      filterGroups: prev.filterGroups.map(g =>
        g.id === groupId ? { ...g, ...data } : g
      ),
    }));
  }, []);

  // Handler for removing a filter group
  const handleRemoveFilterGroup = useCallback((groupId: string) => {
    setQueryState(prev => ({
      ...prev,
      filterGroups: prev.filterGroups.filter(g => g.id !== groupId),
    }));
  }, []);

  // Handler for sort change
  const handleSortChange = useCallback((field: string, direction: 'asc' | 'desc') => {
    setQueryState(prev => ({
      ...prev,
      sortField: field,
      sortDirection: direction,
    }));
  }, []);

  // Handler for executing query
  const handleExecute = useCallback(() => {
    setExecuteEnabled(true);
    setCursor(undefined);
  }, []);

  // Handler for clearing query
  const handleClear = useCallback(() => {
    setQueryState({
      ...defaultQueryState,
      entity: queryState.entity,
    });
    setExecuteEnabled(false);
  }, [queryState.entity]);

  // Handler for loading a preset
  const handleLoadPreset = useCallback((preset: QueryPreset) => {
    setQueryState(preset.query);
    setExecuteEnabled(false);
  }, []);

  return (
    <div className="space-y-6">
      {/* Entity Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Select Entity</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={queryState.entity} onValueChange={v => handleEntityChange(v as EntityType)}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="users" className="flex items-center gap-2">
                <Icons.users className="h-4 w-4" />
                <span className="hidden sm:inline">Users</span>
              </TabsTrigger>
              <TabsTrigger value="events" className="flex items-center gap-2">
                <Icons.calendar className="h-4 w-4" />
                <span className="hidden sm:inline">Events</span>
              </TabsTrigger>
              <TabsTrigger value="posts" className="flex items-center gap-2">
                <Icons.messageSquare className="h-4 w-4" />
                <span className="hidden sm:inline">Posts</span>
              </TabsTrigger>
              <TabsTrigger value="replies" className="flex items-center gap-2">
                <Icons.reply className="h-4 w-4" />
                <span className="hidden sm:inline">Replies</span>
              </TabsTrigger>
              <TabsTrigger value="memberships" className="flex items-center gap-2">
                <Icons.people className="h-4 w-4" />
                <span className="hidden sm:inline">Memberships</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Query Configuration */}
        <div className="lg:col-span-2 space-y-6">
          {/* Filters */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg">Filters</CardTitle>
              <Button variant="outline" size="sm" onClick={handleAddFilterGroup}>
                <Icons.plus className="h-4 w-4 mr-2" />
                Add Filter Group
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {queryState.filterGroups.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No filters applied. Click &quot;Add Filter Group&quot; to start filtering.
                </div>
              ) : (
                queryState.filterGroups.map(group => (
                  <FilterGroup
                    key={group.id}
                    group={group}
                    fields={entityFields || []}
                    onUpdate={data => handleUpdateFilterGroup(group.id, data)}
                    onRemove={() => handleRemoveFilterGroup(group.id)}
                  />
                ))
              )}

            </CardContent>
          </Card>

          {/* Sort */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Sort</CardTitle>
            </CardHeader>
            <CardContent>
              <SortConfig
                fields={entityFields || []}
                sortField={queryState.sortField}
                sortDirection={queryState.sortDirection}
                onChange={handleSortChange}
              />
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex items-center gap-4">
            <Button onClick={handleExecute} className="flex-1">
              <Icons.search className="h-4 w-4 mr-2" />
              Execute Query
            </Button>
            <Button variant="outline" onClick={handleClear}>
              <Icons.x className="h-4 w-4 mr-2" />
              Clear
            </Button>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Query Preview */}
          <QueryPreview queryState={queryState} />

          {/* Preset Manager */}
          <PresetManager
            currentQuery={queryState}
            onLoadPreset={handleLoadPreset}
          />
        </div>
      </div>

      {/* Results */}
      {executeEnabled && (
        <ResultsPanel
          entity={queryState.entity}
          results={queryResult?.results || []}
          totalCount={queryResult?.totalCount || 0}
          hasMore={queryResult?.hasMore || false}
          isLoading={queryResult === undefined}
          onLoadMore={() => setCursor(queryResult?.nextCursor)}
        />
      )}
    </div>
  );
}
