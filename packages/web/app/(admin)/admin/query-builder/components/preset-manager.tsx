'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Icons } from '@/components/icons';
import type { QueryState } from './query-builder';

export type QueryPreset = {
  id: string;
  name: string;
  query: QueryState;
  createdAt: number;
};

const STORAGE_KEY = 'groupi-admin-query-presets';

interface PresetManagerProps {
  currentQuery: QueryState;
  onLoadPreset: (preset: QueryPreset) => void;
}

export function PresetManager({
  currentQuery,
  onLoadPreset,
}: PresetManagerProps) {
  const [presets, setPresets] = useState<QueryPreset[]>([]);
  const [newPresetName, setNewPresetName] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Load presets from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- loading from localStorage on mount
        setPresets(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to load presets:', e);
    }
  }, []);

  // Save presets to localStorage
  const savePresets = (newPresets: QueryPreset[]) => {
    setPresets(newPresets);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newPresets));
    } catch (e) {
      console.error('Failed to save presets:', e);
    }
  };

  // Handle saving a new preset
  const handleSavePreset = () => {
    if (!newPresetName.trim()) return;

    const newPreset: QueryPreset = {
      id: `preset-${Date.now()}`,
      name: newPresetName.trim(),
      query: currentQuery,
      createdAt: Date.now(),
    };

    savePresets([newPreset, ...presets]);
    setNewPresetName('');
    setIsDialogOpen(false);
  };

  // Handle deleting a preset
  const handleDeletePreset = (presetId: string) => {
    savePresets(presets.filter(p => p.id !== presetId));
  };

  // Get entity label
  const getEntityLabel = (entity: string) => {
    const labels: Record<string, string> = {
      users: 'Users',
      events: 'Events',
      posts: 'Posts',
      replies: 'Replies',
      memberships: 'Memberships',
    };
    return labels[entity] || entity;
  };

  return (
    <Card>
      <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
        <CardTitle className='text-lg'>Saved Presets</CardTitle>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant='outline' size='sm'>
              <Icons.save className='h-4 w-4 mr-2' />
              Save
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Save Query Preset</DialogTitle>
              <DialogDescription>
                Save the current query configuration for quick access later.
              </DialogDescription>
            </DialogHeader>
            <div className='py-4'>
              <Input
                placeholder='Preset name...'
                value={newPresetName}
                onChange={e => setNewPresetName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSavePreset()}
              />
            </div>
            <DialogFooter>
              <Button variant='outline' onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleSavePreset}
                disabled={!newPresetName.trim()}
              >
                Save Preset
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {presets.length === 0 ? (
          <div className='text-center py-6 text-muted-foreground text-sm'>
            No saved presets yet
          </div>
        ) : (
          <div className='space-y-2'>
            {presets.map(preset => (
              <div
                key={preset.id}
                className='flex items-center justify-between p-2 rounded-md border hover:bg-muted/50'
              >
                <button
                  className='flex-1 text-left'
                  onClick={() => onLoadPreset(preset)}
                >
                  <div className='font-medium text-sm'>{preset.name}</div>
                  <div className='text-xs text-muted-foreground'>
                    {getEntityLabel(preset.query.entity)}
                    {preset.query.filterGroups.length > 0 &&
                      ` - ${preset.query.filterGroups.reduce(
                        (acc, g) => acc + g.conditions.length,
                        0
                      )} filters`}
                  </div>
                </button>
                <Button
                  variant='ghost'
                  size='sm'
                  className='h-8 w-8 p-0'
                  onClick={() => handleDeletePreset(preset.id)}
                >
                  <Icons.x className='h-4 w-4' />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
