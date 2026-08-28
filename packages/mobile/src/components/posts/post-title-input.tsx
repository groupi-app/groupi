import type { ComponentProps } from 'react';

import { LabeledInput } from '../ui/labeled-input';

type PostTitleInputProps = Omit<
  ComponentProps<typeof LabeledInput>,
  'className' | 'placeholder'
>;

/**
 * The larger post title needs its own height and line height so native fonts
 * have enough room to render descenders without clipping.
 */
export function PostTitleInput(props: PostTitleInputProps) {
  return (
    <LabeledInput
      className='h-12 border-0 px-0 py-2 text-xl font-bold leading-7'
      placeholder='Post title'
      {...props}
    />
  );
}
