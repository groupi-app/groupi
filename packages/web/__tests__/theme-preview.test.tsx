import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it } from 'vitest';
import { baseThemeRegistry } from '@groupi/shared/design/themes';
import { ThemePreview } from '@/app/(settings)/settings/appearance/components/theme-preview';

it('previews independently readable action and status colors for saved fills', async () => {
  const user = userEvent.setup();
  render(
    <ThemePreview
      baseTheme={baseThemeRegistry['groupi-light']}
      overrides={{
        brand: { primary: '#fff', secondary: '#000', accent: '#fff' },
        status: { success: '#fff', warning: '#fff', error: '#000' },
      }}
    />
  );
  const primary = screen.getByRole('button', { name: 'Primary' });
  expect(primary).toHaveStyle({ color: 'var(--preview-primary-foreground)' });
  expect(screen.getByRole('button', { name: 'Secondary' })).toHaveStyle({
    color: 'var(--preview-secondary-foreground)',
  });
  const container = screen
    .getByText('Theme Preview')
    .closest('.overflow-hidden')!;
  expect(container).toHaveStyle({
    '--preview-primary-foreground': '#000000',
    '--preview-secondary-foreground': '#ffffff',
    '--preview-warning-foreground': '#000000',
  });
  expect(screen.getByText('Warning')).toHaveStyle({
    color: 'var(--preview-warning-foreground)',
  });
  await user.hover(primary);
  expect(primary).toHaveStyle({
    backgroundColor: 'var(--preview-primary-hover)',
    color: 'var(--preview-primary-hover-foreground)',
  });
});
