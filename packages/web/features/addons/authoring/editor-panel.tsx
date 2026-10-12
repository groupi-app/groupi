'use client';

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { VisualEditor } from './visual-editor';
import { YamlEditor } from './yaml-editor';
import { ToolboxPanel } from './toolbox-panel';

export function EditorPanel() {
  return (
    <div className='space-y-4'>
      <Tabs defaultValue='visual'>
        <TabsList className='mb-4'>
          <TabsTrigger value='visual'>Visual</TabsTrigger>
          <TabsTrigger value='yaml'>YAML</TabsTrigger>
        </TabsList>
        <TabsContent value='visual'>
          <VisualEditor />
        </TabsContent>
        <TabsContent value='yaml'>
          <YamlEditor />
        </TabsContent>
      </Tabs>

      <ToolboxPanel />
    </div>
  );
}
