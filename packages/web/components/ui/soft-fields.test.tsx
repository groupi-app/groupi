import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { Input } from './input';
import { Textarea } from './textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs';

describe('quiet field and navigation treatment', () => {
  it('keeps fields writable and their validation descriptions connected', async () => {
    render(
      <>
        <label htmlFor='group-name'>Group name</label>
        <Input
          presentation='soft'
          id='group-name'
          aria-invalid
          aria-describedby='name-error'
        />
        <p id='name-error'>Choose a name.</p>
        <label htmlFor='description'>Description</label>
        <Textarea presentation='soft' id='description' />
      </>
    );
    const name = screen.getByRole('textbox', { name: 'Group name' });
    expect(name).toHaveAccessibleDescription('Choose a name.');
    expect(name).toBeInvalid();
    await userEvent.type(name, 'Weekend walks');
    await userEvent.type(
      screen.getByRole('textbox', { name: 'Description' }),
      'A walk each Saturday.'
    );
    expect(name).toHaveValue('Weekend walks');
    expect(screen.getByRole('textbox', { name: 'Description' })).toHaveValue(
      'A walk each Saturday.'
    );
  });

  it('keeps selection and keyboard focus distinct as tabs change', async () => {
    render(
      <Tabs presentation='soft' defaultValue='groups'>
        <TabsList aria-label='Groups views'>
          <TabsTrigger value='groups'>My groups</TabsTrigger>
          <TabsTrigger value='discover'>Discover</TabsTrigger>
          <TabsTrigger value='unavailable' disabled>
            Unavailable
          </TabsTrigger>
        </TabsList>
        <TabsContent value='groups'>Your communities</TabsContent>
        <TabsContent value='discover'>Find a community</TabsContent>
      </Tabs>
    );
    const current = screen.getByRole('tab', { name: 'My groups' });
    await userEvent.tab();
    expect(current).toHaveFocus();
    await userEvent.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: 'Discover' })).toHaveFocus();
    expect(screen.getByRole('tab', { name: 'Discover' })).toHaveAttribute(
      'aria-selected',
      'true'
    );
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Find a community');
  });
});
