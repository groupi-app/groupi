import {
  Children,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
const state = vi.hoisted(() => ({ setError: vi.fn(), index: 0 }));
vi.mock('react', async original => ({
  ...(await original<typeof import('react')>()),
  useState: <T,>(initial: T) => {
    const index = state.index++;
    return [initial, index === 4 ? state.setError : vi.fn()];
  },
}));
vi.mock('../ui/text', () => ({ Text: 'Text' }));
vi.mock('../ui/input', () => ({ Input: 'Input' }));
vi.mock('../ui/button', () => ({ Button: 'Button' }));
import { GroupForm } from './group-form';
function elements(node: ReactNode): ReactElement<Record<string, unknown>>[] {
  if (!isValidElement<Record<string, unknown>>(node)) return [];
  return [
    node,
    ...Children.toArray(node.props.children as ReactNode).flatMap(elements),
  ];
}
async function save(
  initial: { name: string; description?: string; image?: string },
  onSave = vi.fn()
) {
  const tree = elements(GroupForm({ initial, onSave }));
  const button = tree.find(
    element =>
      element.type === 'Button' &&
      element.props.accessibilityLabel === 'Save Group'
  );
  await (button?.props.onPress as () => Promise<void>)();
  return { tree, onSave };
}
describe('Native Group identity form', () => {
  beforeEach(() => {
    state.index = 0;
    vi.clearAllMocks();
  });
  it('submits a trimmed identity and allows clearing optional fields', async () => {
    const { tree, onSave } = await save({
      name: '  Reading friends  ',
      description: '  ',
      image: '',
    });
    expect(onSave).toHaveBeenCalledWith({
      name: 'Reading friends',
      description: '',
      image: '',
    });
    expect(
      tree
        .filter(element => element.type === 'Input')
        .map(element => element.props.accessibilityLabel)
    ).toEqual(['Group name', 'Group description', 'Group image URL']);
  });
  it.each([
    [{ name: '   ' }, 'Use a Group name of 1–100 characters.'],
    [
      { name: 'Club', image: 'http://example.com/image.png' },
      'Use an HTTPS image URL of at most 2,048 characters.',
    ],
    [
      { name: 'Club', description: 'a'.repeat(2001) },
      'Description must be at most 2,000 characters.',
    ],
  ])('rejects invalid identity before mutating', async (initial, message) => {
    const { onSave } = await save(initial);
    expect(onSave).not.toHaveBeenCalled();
    expect(state.setError).toHaveBeenCalledWith(message);
  });
  it('shows mutation errors and keeps the form available for retry', async () => {
    await save(
      { name: 'Club' },
      vi.fn().mockRejectedValue(new Error('Group no longer exists'))
    );
    expect(state.setError).toHaveBeenCalledWith('Group no longer exists');
  });
});
