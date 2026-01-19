/**
 * Tests for Card components
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from './card';

describe('Card', () => {
  it('should render children', () => {
    render(<Card>Card content</Card>);

    expect(screen.getByText('Card content')).toBeInTheDocument();
  });

  it('should have data-slot attribute', () => {
    render(<Card data-testid="card">Content</Card>);

    const card = screen.getByTestId('card');
    expect(card).toHaveAttribute('data-slot', 'card');
  });

  it('should apply base styling', () => {
    render(<Card data-testid="card">Content</Card>);

    const card = screen.getByTestId('card');
    expect(card).toHaveClass('rounded-lg');
    expect(card).toHaveClass('border');
    expect(card).toHaveClass('bg-card');
    expect(card).toHaveClass('text-card-foreground');
  });

  it('should merge custom className', () => {
    render(<Card className="shadow-lg" data-testid="card">Content</Card>);

    const card = screen.getByTestId('card');
    expect(card).toHaveClass('shadow-lg');
  });

  it('should render as div element', () => {
    render(<Card data-testid="card">Content</Card>);

    const card = screen.getByTestId('card');
    expect(card.tagName).toBe('DIV');
  });
});

describe('CardHeader', () => {
  it('should render children', () => {
    render(<CardHeader>Header content</CardHeader>);

    expect(screen.getByText('Header content')).toBeInTheDocument();
  });

  it('should have data-slot attribute', () => {
    render(<CardHeader data-testid="header">Header</CardHeader>);

    const header = screen.getByTestId('header');
    expect(header).toHaveAttribute('data-slot', 'card-header');
  });

  it('should apply base styling', () => {
    render(<CardHeader data-testid="header">Header</CardHeader>);

    const header = screen.getByTestId('header');
    expect(header).toHaveClass('flex');
    expect(header).toHaveClass('flex-col');
    expect(header).toHaveClass('space-y-1.5');
    expect(header).toHaveClass('p-6');
  });

  it('should merge custom className', () => {
    render(<CardHeader className="pb-2" data-testid="header">Header</CardHeader>);

    const header = screen.getByTestId('header');
    expect(header).toHaveClass('pb-2');
  });
});

describe('CardTitle', () => {
  it('should render children', () => {
    render(<CardTitle>My Card Title</CardTitle>);

    expect(screen.getByText('My Card Title')).toBeInTheDocument();
  });

  it('should have data-slot attribute', () => {
    render(<CardTitle data-testid="title">Title</CardTitle>);

    const title = screen.getByTestId('title');
    expect(title).toHaveAttribute('data-slot', 'card-title');
  });

  it('should render as h3 element', () => {
    render(<CardTitle data-testid="title">Title</CardTitle>);

    const title = screen.getByTestId('title');
    expect(title.tagName).toBe('H3');
  });

  it('should apply base styling', () => {
    render(<CardTitle data-testid="title">Title</CardTitle>);

    const title = screen.getByTestId('title');
    expect(title).toHaveClass('text-2xl');
    expect(title).toHaveClass('font-semibold');
    expect(title).toHaveClass('leading-none');
    expect(title).toHaveClass('tracking-tight');
  });

  it('should merge custom className', () => {
    render(<CardTitle className="text-primary" data-testid="title">Title</CardTitle>);

    const title = screen.getByTestId('title');
    expect(title).toHaveClass('text-primary');
  });
});

describe('CardDescription', () => {
  it('should render children', () => {
    render(<CardDescription>Card description text</CardDescription>);

    expect(screen.getByText('Card description text')).toBeInTheDocument();
  });

  it('should have data-slot attribute', () => {
    render(<CardDescription data-testid="desc">Description</CardDescription>);

    const desc = screen.getByTestId('desc');
    expect(desc).toHaveAttribute('data-slot', 'card-description');
  });

  it('should render as p element', () => {
    render(<CardDescription data-testid="desc">Description</CardDescription>);

    const desc = screen.getByTestId('desc');
    expect(desc.tagName).toBe('P');
  });

  it('should apply base styling', () => {
    render(<CardDescription data-testid="desc">Description</CardDescription>);

    const desc = screen.getByTestId('desc');
    expect(desc).toHaveClass('text-sm');
    expect(desc).toHaveClass('text-muted-foreground');
  });

  it('should merge custom className', () => {
    render(<CardDescription className="mt-2" data-testid="desc">Description</CardDescription>);

    const desc = screen.getByTestId('desc');
    expect(desc).toHaveClass('mt-2');
  });
});

describe('CardContent', () => {
  it('should render children', () => {
    render(<CardContent>Main content here</CardContent>);

    expect(screen.getByText('Main content here')).toBeInTheDocument();
  });

  it('should have data-slot attribute', () => {
    render(<CardContent data-testid="content">Content</CardContent>);

    const content = screen.getByTestId('content');
    expect(content).toHaveAttribute('data-slot', 'card-content');
  });

  it('should apply base styling', () => {
    render(<CardContent data-testid="content">Content</CardContent>);

    const content = screen.getByTestId('content');
    expect(content).toHaveClass('p-6');
    expect(content).toHaveClass('pt-0');
  });

  it('should merge custom className', () => {
    render(<CardContent className="space-y-4" data-testid="content">Content</CardContent>);

    const content = screen.getByTestId('content');
    expect(content).toHaveClass('space-y-4');
  });
});

describe('CardFooter', () => {
  it('should render children', () => {
    render(<CardFooter>Footer content</CardFooter>);

    expect(screen.getByText('Footer content')).toBeInTheDocument();
  });

  it('should have data-slot attribute', () => {
    render(<CardFooter data-testid="footer">Footer</CardFooter>);

    const footer = screen.getByTestId('footer');
    expect(footer).toHaveAttribute('data-slot', 'card-footer');
  });

  it('should apply base styling', () => {
    render(<CardFooter data-testid="footer">Footer</CardFooter>);

    const footer = screen.getByTestId('footer');
    expect(footer).toHaveClass('flex');
    expect(footer).toHaveClass('items-center');
    expect(footer).toHaveClass('p-6');
    expect(footer).toHaveClass('pt-0');
  });

  it('should merge custom className', () => {
    render(<CardFooter className="justify-between" data-testid="footer">Footer</CardFooter>);

    const footer = screen.getByTestId('footer');
    expect(footer).toHaveClass('justify-between');
  });
});

describe('Card composition', () => {
  it('should render complete card with all parts', () => {
    render(
      <Card data-testid="card">
        <CardHeader>
          <CardTitle>Settings</CardTitle>
          <CardDescription>Manage your account settings</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Card body content</p>
        </CardContent>
        <CardFooter>
          <button>Save</button>
        </CardFooter>
      </Card>
    );

    expect(screen.getByTestId('card')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
    expect(screen.getByText('Manage your account settings')).toBeInTheDocument();
    expect(screen.getByText('Card body content')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
  });
});
