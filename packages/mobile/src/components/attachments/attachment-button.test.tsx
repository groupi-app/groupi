import {
  Children,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  onFilesSelected: vi.fn(),
  pickFiles: vi.fn(),
  pickMultipleImages: vi.fn(),
  showActionMenu: vi.fn(),
  takePhoto: vi.fn(),
}));

vi.mock('../../hooks/use-image-picker', () => ({
  useImagePicker: () => ({
    pickMultipleImages: mocks.pickMultipleImages,
    takePhoto: mocks.takePhoto,
  }),
}));
vi.mock('../../hooks/use-document-picker', () => ({
  useDocumentPicker: () => ({ pickFiles: mocks.pickFiles }),
}));
vi.mock('../ui/action-menu', () => ({
  useActionMenu: () => ({ showActionMenu: mocks.showActionMenu }),
}));
vi.mock('../ui/text', () => ({ Text: 'Text' }));
vi.mock('@expo/vector-icons', () => ({ Ionicons: 'Ionicons' }));
vi.mock('react-native', () => ({
  Platform: {
    OS: 'ios',
    select: (options: Record<string, unknown>) =>
      options.ios ?? options.default,
  },
  Pressable: 'Pressable',
  Text: 'Text',
  View: 'View',
}));

import { AttachmentButton } from './attachment-button';

function elements(node: ReactNode): ReactElement<Record<string, unknown>>[] {
  if (!isValidElement<Record<string, unknown>>(node)) return [];
  return [
    node,
    ...Children.toArray(node.props.children as ReactNode).flatMap(child =>
      elements(child)
    ),
  ];
}

describe('AttachmentButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows the post-editor label when requested', () => {
    const tree = elements(
      AttachmentButton({
        currentCount: 0,
        onFilesSelected: mocks.onFilesSelected,
        showLabel: true,
      })
    );
    const label = tree.find(
      element =>
        element.type === 'Text' && element.props.children === 'Add attachment'
    );

    expect(label).toBeDefined();
  });

  it('offers a file picker after the camera option', async () => {
    const tree = elements(
      AttachmentButton({
        currentCount: 0,
        onFilesSelected: mocks.onFilesSelected,
      })
    );
    const button = tree.find(
      element => element.props.accessibilityLabel === 'Add attachment'
    );
    const press = button?.props.onPress as (() => void) | undefined;
    press?.();

    const menu = mocks.showActionMenu.mock.calls[0]?.[0] as {
      options: Array<{ label: string; onPress: () => Promise<void> }>;
    };
    expect(menu.options.map(option => option.label)).toEqual([
      'Photo Library',
      'Take Photo',
      'Choose File',
    ]);

    mocks.pickFiles.mockResolvedValue([
      {
        uri: 'file:///document.pdf',
        filename: 'document.pdf',
        mimeType: 'application/pdf',
        size: 1024,
      },
    ]);
    await menu.options[2].onPress();

    expect(mocks.onFilesSelected).toHaveBeenCalledWith([
      expect.objectContaining({ filename: 'document.pdf' }),
    ]);
  });
});
