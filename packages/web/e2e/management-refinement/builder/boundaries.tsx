import type { ComponentProps } from 'react';

declare global {
  interface Window {
    builderFixture: {
      calls: { kind: string; input: unknown }[];
      failNext: boolean;
      holdNext: boolean;
      release?: () => void;
    };
  }
}
window.builderFixture = { calls: [], failNext: false, holdNext: false };
async function mutate(kind: string, input: unknown) {
  const fixture = window.builderFixture;
  fixture.calls.push({ kind, input });
  if (fixture.holdNext) {
    fixture.holdNext = false;
    await new Promise<void>(resolve => {
      fixture.release = resolve;
    });
  }
  if (fixture.failNext) {
    fixture.failNext = false;
    throw new Error('Synthetic save failed. Your draft is still here.');
  }
  return 'template-one';
}
export const useCreateTemplate = () => ({
  createTemplate: (input: unknown) => mutate('create', input),
  isPending: false,
});
export const useUpdateTemplate = () => ({
  updateTemplate: (input: unknown) => mutate('update', input),
  isPending: false,
});
export const usePublishTemplate = () => (input: unknown) =>
  mutate('publish', input);
export const useUnpublishTemplate = () => (input: unknown) =>
  mutate('unpublish', input);
const router = {
  push: (href: string) => {
    window.history.pushState({}, '', href);
  },
  replace: (href: string) => {
    window.history.replaceState({}, '', href);
  },
};
export const useRouter = () => router;
export const usePathname = () => window.location.pathname;
export function Link({
  href,
  children,
  onClick,
  ...props
}: ComponentProps<'a'>) {
  return (
    <a
      {...props}
      href={href}
      onClick={event => {
        onClick?.(event);
        if (!event.defaultPrevented && href) {
          event.preventDefault();
          router.push(href);
        }
      }}
    >
      {children}
    </a>
  );
}
export function MonacoBoundary({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <textarea
      className='min-h-80 w-full resize-y rounded-input border border-input bg-background p-3 font-mono text-sm'
      aria-label='YAML document'
      value={value}
      onChange={event => onChange(event.target.value)}
      spellCheck={false}
    />
  );
}
export const dynamic = () => MonacoBoundary;
export const useTheme = () => ({ resolvedTheme: 'light' });
// Public authoring exports include library screens; this fixture must never mount them.
export function useMyTemplates(): never {
  throw new Error('Library is outside the builder fixture');
}
export function useTemplate(): never {
  throw new Error('Template loading is outside the builder fixture');
}
export function useDeleteTemplate(): never {
  throw new Error('Deletion is outside the builder fixture');
}
export function useDuplicateTemplate(): never {
  throw new Error('Duplication is outside the builder fixture');
}
