'use client';

import { useState } from 'react';
import { useBuilder } from './builder-context';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { VisualEditor } from './visual-editor';
import { YamlEditor } from './yaml-editor';
import { ToolboxPanel } from './toolbox-panel';

export function EditorPanel() {
  const [mode, setMode] = useState('visual');
  const [yamlOpened, setYamlOpened] = useState(false);
  const { yamlPending, yamlInvalid } = useBuilder();
  return (
    <div className='space-y-4'>
      <Tabs
        value={mode}
        onValueChange={value => {
          setMode(value);
          if (value === 'yaml') setYamlOpened(true);
        }}
      >
        <TabsList className='mb-4' aria-label='Editor mode'>
          <TabsTrigger value='visual'>Visual</TabsTrigger>
          <TabsTrigger value='yaml'>YAML</TabsTrigger>
        </TabsList>
        <TabsContent
          value='visual'
          hidden={mode !== 'visual'}
          forceMount
          className='data-[state=inactive]:hidden'
        >
          {(yamlPending || yamlInvalid) && (
            <p className='mb-3 text-sm text-muted-foreground'>
              Finish or revert the YAML draft before editing visually.
            </p>
          )}
          <fieldset disabled={yamlPending || yamlInvalid} className='min-w-0'>
            <legend className='sr-only'>Visual editor</legend>
            <VisualEditor />
          </fieldset>
        </TabsContent>
        {yamlOpened && (
          <TabsContent
            value='yaml'
            hidden={mode !== 'yaml'}
            forceMount
            className='data-[state=inactive]:hidden'
          >
            <YamlEditor />
          </TabsContent>
        )}
      </Tabs>

      <details className='rounded-card border border-border bg-card p-4 text-sm'>
        <summary className='cursor-pointer font-semibold focus-visible:outline-2 focus-visible:outline-ring'>
          Variables & actions reference
        </summary>
        <div className='mt-3'>
          <ToolboxPanel />
        </div>
      </details>
    </div>
  );
}
