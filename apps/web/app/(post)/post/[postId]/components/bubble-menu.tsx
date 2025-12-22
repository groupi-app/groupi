'use client';

import { useEffect, useRef, useState } from 'react';
import type { Editor } from '@tiptap/core';

export function BubbleMenu({
  editor,
  children,
  className,
}: {
  editor: Editor | null;
  children: React.ReactNode;
  className?: string;
}) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!editor || !menuRef.current) return;

    const update = () => {
      const { from, to } = editor.state.selection;
      if (from !== to) {
        // Show menu when text is selected
        setIsVisible(true);
        // Position menu near selection (simplified positioning)
        const coords = editor.view.coordsAtPos(from);
        if (menuRef.current) {
          menuRef.current.style.position = 'fixed';
          menuRef.current.style.top = `${coords.top - 40}px`;
          menuRef.current.style.left = `${coords.left}px`;
        }
      } else {
        setIsVisible(false);
      }
    };

    editor.on('selectionUpdate', update);
    editor.on('focus', update);

    return () => {
      editor.off('selectionUpdate', update);
      editor.off('focus', update);
    };
  }, [editor]);

  if (!editor || !isVisible) return null;

  return (
    <div ref={menuRef} className={className} style={{ zIndex: 1000 }}>
      {children}
    </div>
  );
}

