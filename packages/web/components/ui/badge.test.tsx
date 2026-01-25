/**
 * Tests for Badge component
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Badge, badgeVariants } from './badge';

describe('Badge', () => {
  it('should render children', () => {
    render(<Badge>Test Badge</Badge>);

    expect(screen.getByText('Test Badge')).toBeInTheDocument();
  });

  it('should apply default variant styling', () => {
    render(<Badge>Default</Badge>);

    const badge = screen.getByText('Default');
    expect(badge).toHaveClass('bg-primary');
    expect(badge).toHaveClass('text-primary-foreground');
  });

  it('should apply secondary variant styling', () => {
    render(<Badge variant='secondary'>Secondary</Badge>);

    const badge = screen.getByText('Secondary');
    expect(badge).toHaveClass('bg-secondary');
    expect(badge).toHaveClass('text-secondary-foreground');
  });

  it('should apply destructive variant styling', () => {
    render(<Badge variant='destructive'>Destructive</Badge>);

    const badge = screen.getByText('Destructive');
    expect(badge).toHaveClass('bg-destructive');
    expect(badge).toHaveClass('text-destructive-foreground');
  });

  it('should apply outline variant styling', () => {
    render(<Badge variant='outline'>Outline</Badge>);

    const badge = screen.getByText('Outline');
    expect(badge).toHaveClass('text-foreground');
    expect(badge).not.toHaveClass('bg-primary');
  });

  it('should merge custom className', () => {
    render(<Badge className='custom-class'>Custom</Badge>);

    const badge = screen.getByText('Custom');
    expect(badge).toHaveClass('custom-class');
    expect(badge).toHaveClass('rounded-full');
  });

  it('should pass through additional HTML attributes', () => {
    render(
      <Badge data-testid='my-badge' id='badge-1'>
        Attrs
      </Badge>
    );

    const badge = screen.getByTestId('my-badge');
    expect(badge).toHaveAttribute('id', 'badge-1');
  });

  it('should render as a div', () => {
    render(<Badge>Div Badge</Badge>);

    const badge = screen.getByText('Div Badge');
    expect(badge.tagName).toBe('DIV');
  });
});

describe('badgeVariants', () => {
  it('should return default variant classes', () => {
    const classes = badgeVariants({ variant: 'default' });

    expect(classes).toContain('bg-primary');
    expect(classes).toContain('text-primary-foreground');
  });

  it('should return secondary variant classes', () => {
    const classes = badgeVariants({ variant: 'secondary' });

    expect(classes).toContain('bg-secondary');
    expect(classes).toContain('text-secondary-foreground');
  });

  it('should return destructive variant classes', () => {
    const classes = badgeVariants({ variant: 'destructive' });

    expect(classes).toContain('bg-destructive');
    expect(classes).toContain('text-destructive-foreground');
  });

  it('should return outline variant classes', () => {
    const classes = badgeVariants({ variant: 'outline' });

    expect(classes).toContain('text-foreground');
  });

  it('should include base classes in all variants', () => {
    const defaultClasses = badgeVariants({});
    const secondaryClasses = badgeVariants({ variant: 'secondary' });

    expect(defaultClasses).toContain('rounded-full');
    expect(secondaryClasses).toContain('rounded-full');
    expect(defaultClasses).toContain('inline-flex');
    expect(secondaryClasses).toContain('inline-flex');
  });
});
