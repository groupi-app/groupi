import { Icons } from '@/components/icons';
import { Toggle } from '@/components/ui/toggle';

/**
 * Standalone toolbar skeleton for loading states
 * Replaces the Tiptap Toolbar.Skeleton component
 */
export function ToolbarSkeleton() {
  return (
    <div className='flex items-center gap-2 rounded-md flex-wrap mb-2'>
      <Toggle size='sm' disabled>
        <Icons.heading />
      </Toggle>
      <Toggle size='sm' disabled>
        <Icons.bold />
      </Toggle>
      <Toggle size='sm' disabled>
        <Icons.italic />
      </Toggle>
      <Toggle size='sm' disabled>
        <Icons.underline />
      </Toggle>
      <Toggle size='sm' disabled>
        <Icons.strikethrough />
      </Toggle>
      <Toggle size='sm' disabled>
        <Icons.code />
      </Toggle>
      <Toggle size='sm' disabled>
        <Icons.list />
      </Toggle>
      <Toggle size='sm' disabled>
        <Icons.listOrdered />
      </Toggle>
    </div>
  );
}
