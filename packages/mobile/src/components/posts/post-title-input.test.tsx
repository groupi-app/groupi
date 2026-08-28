import { describe, expect, it, vi } from 'vitest';

vi.mock('../ui/labeled-input', () => ({ LabeledInput: 'LabeledInput' }));

import { PostTitleInput } from './post-title-input';

describe('PostTitleInput', () => {
  it('gives the larger title font enough vertical space to render', () => {
    const input = PostTitleInput({ value: 'TEST', onChangeText: vi.fn() });

    expect(input.props.className).toBe(
      'h-12 border-0 px-0 py-2 text-xl font-bold leading-7'
    );
    expect(input.props.placeholder).toBe('Post title');
  });
});
