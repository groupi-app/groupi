import type { Editor } from '@tiptap/react';
import type { SlashCommand } from './slash-command-list';

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- Parameter required for API consistency but not used
export const getSlashCommands = (_editor?: Editor): SlashCommand[] => {
  return [
    {
      id: 'heading',
      label: 'Heading',
      description: 'Add a heading',
      command: (editor: unknown) => {
        (editor as Editor).chain().focus().toggleHeading({ level: 2 }).run();
      },
    },
    {
      id: 'bold',
      label: 'Bold',
      description: 'Make text bold',
      command: (editor: unknown) => {
        (editor as Editor).chain().focus().toggleBold().run();
      },
    },
    {
      id: 'italic',
      label: 'Italic',
      description: 'Make text italic',
      command: (editor: unknown) => {
        (editor as Editor).chain().focus().toggleItalic().run();
      },
    },
    {
      id: 'underline',
      label: 'Underline',
      description: 'Underline text',
      command: (editor: unknown) => {
        (editor as Editor).chain().focus().toggleUnderline().run();
      },
    },
    {
      id: 'strike',
      label: 'Strikethrough',
      description: 'Strike through text',
      command: (editor: unknown) => {
        (editor as Editor).chain().focus().toggleStrike().run();
      },
    },
    {
      id: 'code',
      label: 'Code',
      description: 'Format as code',
      command: (editor: unknown) => {
        (editor as Editor).chain().focus().toggleCode().run();
      },
    },
    {
      id: 'bulletList',
      label: 'Bullet List',
      description: 'Create a bulleted list',
      command: (editor: unknown) => {
        (editor as Editor).chain().focus().toggleBulletList().run();
      },
    },
    {
      id: 'orderedList',
      label: 'Numbered List',
      description: 'Create a numbered list',
      command: (editor: unknown) => {
        (editor as Editor).chain().focus().toggleOrderedList().run();
      },
    },
  ];
};

