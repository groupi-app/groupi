import * as React from 'react';
import * as SliderPrimitive from '@radix-ui/react-slider';

import { cn } from '@/lib/utils';

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    data-slot='slider'
    className={cn(
      'relative flex w-full touch-none select-none items-center',
      className
    )}
    {...props}
  >
    <SliderPrimitive.Track
      data-slot='slider-track'
      className='relative h-2 w-full grow overflow-hidden rounded-pill bg-secondary'
    >
      <SliderPrimitive.Range
        data-slot='slider-range'
        className='absolute h-full bg-primary transition-all duration-fast'
      />
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb
      data-slot='slider-thumb'
      className='block h-5 w-5 rounded-avatar border-2 border-primary bg-background shadow-floating ring-offset-background transition-all duration-fast ease-bounce hover:scale-110 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50'
    />
  </SliderPrimitive.Root>
));
Slider.displayName = SliderPrimitive.Root.displayName;

export { Slider };
