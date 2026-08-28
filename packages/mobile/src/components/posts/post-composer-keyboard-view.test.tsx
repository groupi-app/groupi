import { describe, expect, it } from 'vitest';

import {
  getPostComposerKeyboardBehavior,
  PostComposerKeyboardView,
} from './post-composer-keyboard-view';

describe('PostComposerKeyboardView', () => {
  it('shrinks the composer around the iOS keyboard', () => {
    expect(getPostComposerKeyboardBehavior('ios')).toBe('padding');

    const view = PostComposerKeyboardView({ children: 'Composer' });
    expect(view.props.style).toEqual({ flex: 1 });
    expect(view.props.behavior).toBe('padding');
    expect(view.props.children).toBe('Composer');
  });

  it('uses height adjustment on other native platforms', () => {
    expect(getPostComposerKeyboardBehavior('android')).toBe('height');
  });
});
