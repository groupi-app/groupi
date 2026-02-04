/**
 * Tests for Alert component
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Alert, AlertTitle, AlertDescription } from './alert';

describe('Alert', () => {
  it('should render with default variant', () => {
    render(<Alert>Alert content</Alert>);

    const alert = screen.getByRole('alert');
    expect(alert).toBeInTheDocument();
    expect(alert).toHaveClass('bg-background');
    expect(alert).toHaveClass('text-foreground');
  });

  it('should render with destructive variant', () => {
    render(<Alert variant='destructive'>Error alert</Alert>);

    const alert = screen.getByRole('alert');
    expect(alert).toHaveClass('border-destructive/50');
    expect(alert).toHaveClass('text-destructive');
  });

  it('should have alert role', () => {
    render(<Alert>Accessible alert</Alert>);

    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('should have data-slot attribute', () => {
    render(<Alert>Slotted alert</Alert>);

    const alert = screen.getByRole('alert');
    expect(alert).toHaveAttribute('data-slot', 'alert');
  });

  it('should merge custom className', () => {
    render(<Alert className='custom-alert'>Custom styled</Alert>);

    const alert = screen.getByRole('alert');
    expect(alert).toHaveClass('custom-alert');
    expect(alert).toHaveClass('rounded-card');
  });

  it('should pass through additional props', () => {
    render(
      <Alert id='my-alert' data-testid='test-alert'>
        With props
      </Alert>
    );

    const alert = screen.getByTestId('test-alert');
    expect(alert).toHaveAttribute('id', 'my-alert');
  });
});

describe('AlertTitle', () => {
  it('should render as h5', () => {
    render(<AlertTitle>Alert Title</AlertTitle>);

    const title = screen.getByText('Alert Title');
    expect(title.tagName).toBe('H5');
  });

  it('should have data-slot attribute', () => {
    render(<AlertTitle>Title</AlertTitle>);

    const title = screen.getByText('Title');
    expect(title).toHaveAttribute('data-slot', 'alert-title');
  });

  it('should apply base styling', () => {
    render(<AlertTitle>Styled Title</AlertTitle>);

    const title = screen.getByText('Styled Title');
    expect(title).toHaveClass('font-semibold');
    expect(title).toHaveClass('leading-none');
    expect(title).toHaveClass('tracking-tight');
  });

  it('should merge custom className', () => {
    render(<AlertTitle className='text-lg'>Large Title</AlertTitle>);

    const title = screen.getByText('Large Title');
    expect(title).toHaveClass('text-lg');
    expect(title).toHaveClass('font-semibold');
  });

  it('should pass through additional props', () => {
    render(<AlertTitle id='title-id'>Props Title</AlertTitle>);

    const title = screen.getByText('Props Title');
    expect(title).toHaveAttribute('id', 'title-id');
  });
});

describe('AlertDescription', () => {
  it('should render as div', () => {
    render(<AlertDescription>Description text</AlertDescription>);

    const desc = screen.getByText('Description text');
    expect(desc.tagName).toBe('DIV');
  });

  it('should have data-slot attribute', () => {
    render(<AlertDescription>Desc</AlertDescription>);

    const desc = screen.getByText('Desc');
    expect(desc).toHaveAttribute('data-slot', 'alert-description');
  });

  it('should apply base styling', () => {
    render(<AlertDescription>Styled Desc</AlertDescription>);

    const desc = screen.getByText('Styled Desc');
    expect(desc).toHaveClass('text-sm');
  });

  it('should merge custom className', () => {
    render(<AlertDescription className='mt-2'>Custom Desc</AlertDescription>);

    const desc = screen.getByText('Custom Desc');
    expect(desc).toHaveClass('mt-2');
    expect(desc).toHaveClass('text-sm');
  });

  it('should render children', () => {
    render(
      <AlertDescription>
        <p>Paragraph 1</p>
        <p>Paragraph 2</p>
      </AlertDescription>
    );

    expect(screen.getByText('Paragraph 1')).toBeInTheDocument();
    expect(screen.getByText('Paragraph 2')).toBeInTheDocument();
  });
});

describe('Alert composition', () => {
  it('should render complete alert with title and description', () => {
    render(
      <Alert>
        <AlertTitle>Important Notice</AlertTitle>
        <AlertDescription>Please read this carefully.</AlertDescription>
      </Alert>
    );

    const alert = screen.getByRole('alert');
    expect(alert).toBeInTheDocument();
    expect(screen.getByText('Important Notice')).toBeInTheDocument();
    expect(screen.getByText('Please read this carefully.')).toBeInTheDocument();
  });

  it('should render destructive alert with all parts', () => {
    render(
      <Alert variant='destructive'>
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>Something went wrong.</AlertDescription>
      </Alert>
    );

    const alert = screen.getByRole('alert');
    expect(alert).toHaveClass('text-destructive');
    expect(screen.getByText('Error')).toBeInTheDocument();
    expect(screen.getByText('Something went wrong.')).toBeInTheDocument();
  });
});
