import { useEffect, useRef, useState } from 'react';

export function useIsOverflowing() {
  const ref = useRef<HTMLDivElement>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);

  useEffect(() => {
    function checkOverflow() {
      if (ref.current) {
        const { scrollHeight, clientHeight } = ref.current;
        setIsOverflowing(scrollHeight > clientHeight);
      }
    }

    checkOverflow();

    window.addEventListener('resize', checkOverflow);
    return () => window.removeEventListener('resize', checkOverflow);
  }, []);

  return [ref, isOverflowing] as const;
}
