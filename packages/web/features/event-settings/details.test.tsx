import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { EventDetailsFields } from './details';
const fixture = vi.hoisted(() => ({
  busy: false,
  role: 'ORGANIZER',
  audiences: {
    friendsShared: false,
    groups: [{ groupId: 'retained-group', name: 'Neighbors' }],
  },
  file: null as File | null,
  setSection: vi.fn(),
  setImageFile: vi.fn(),
  details: {
    title: 'Dinner',
    description: '',
    location: 'Home',
    visibility: 'PRIVATE',
    imageStorageId: 'stored-cover',
    imageUrl: 'https://fixture.example/cover.png',
    imageFocalPoint: { x: 0.3, y: 0.6 },
  },
}));
vi.mock('./draft', () => ({
  useEventSettingsDraft: () => ({
    values: {
      details: fixture.details,
      role: fixture.role,
      audiences: fixture.audiences,
    },
    setSection: fixture.setSection,
    busy: fixture.busy,
    imageFile: fixture.file,
    setImageFile: fixture.setImageFile,
  }),
}));
vi.mock('@/components/event-image-upload', () => ({
  EventImageUpload: ({
    onFileChange,
    onRemoveExisting,
    onFocalPointChange,
    disabled,
  }: {
    onFileChange: (file: File | null) => void;
    onRemoveExisting?: () => void;
    onFocalPointChange: (point: null) => void;
    disabled: boolean;
  }) => (
    <button
      disabled={disabled}
      onClick={() => {
        onFileChange(null);
        onRemoveExisting?.();
        onFocalPointChange(null);
      }}
    >
      Remove image
    </button>
  ),
}));
afterEach(cleanup);
beforeEach(() => {
  vi.clearAllMocks();
  fixture.busy = false;
  fixture.file = null;
  fixture.details.title = 'Dinner';
  fixture.details.visibility = 'PRIVATE';
  fixture.role = 'ORGANIZER';
});
describe('existing Event cover removal', () => {
  it('preserves an existing Public value during title edits', () => {
    fixture.details.visibility = 'PUBLIC';
    render(<EventDetailsFields />);
    expect(screen.getByLabelText('Visibility')).toHaveValue('PUBLIC');
    fireEvent.change(screen.getByLabelText('Title'), {
      target: { value: 'New dinner' },
    });
    expect(fixture.setSection).toHaveBeenCalledExactlyOnceWith('details', {
      ...fixture.details,
      title: 'New dinner',
      visibility: 'PUBLIC',
    });
  });
  it('stages visibility and its Friends discovery effect while retaining Group audiences', () => {
    render(<EventDetailsFields />);
    fireEvent.change(screen.getByLabelText('Visibility'), {
      target: { value: 'FRIENDS' },
    });
    expect(fixture.setSection).toHaveBeenNthCalledWith(1, 'details', {
      ...fixture.details,
      visibility: 'FRIENDS',
    });
    expect(fixture.setSection).toHaveBeenNthCalledWith(2, 'audiences', {
      friendsShared: true,
      groupIds: ['retained-group'],
    });
    expect(
      screen.queryByRole('button', { name: 'Save changes' })
    ).not.toBeInTheDocument();
  });
  it('does not expose organizer visibility controls to moderators', () => {
    fixture.role = 'MODERATOR';
    render(<EventDetailsFields />);
    expect(screen.queryByLabelText('Visibility')).not.toBeInTheDocument();
  });

  it('asks before staging removal and leaves the entire draft unchanged on cancellation', () => {
    render(<EventDetailsFields />);
    fireEvent.click(screen.getByRole('button', { name: 'Remove image' }));
    expect(
      screen.getByRole('dialog', { name: 'Remove cover image?' })
    ).toHaveTextContent('when you save changes');
    expect(fixture.setSection).not.toHaveBeenCalled();
    expect(fixture.setImageFile).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(fixture.setSection).not.toHaveBeenCalled();
    expect(fixture.setImageFile).not.toHaveBeenCalled();
  });
  it('stages only the confirmed removal for the existing global Save/Revert flow', async () => {
    const { rerender } = render(<EventDetailsFields />);
    fireEvent.click(screen.getByRole('button', { name: 'Remove image' }));
    fixture.details = { ...fixture.details, title: 'Updated draft' };
    rerender(<EventDetailsFields />);
    fireEvent.click(screen.getByRole('button', { name: 'Remove cover' }));
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    );
    expect(fixture.setSection).toHaveBeenCalledExactlyOnceWith('details', {
      ...fixture.details,
      imageStorageId: null,
      imageFocalPoint: null,
    });
    expect(fixture.setImageFile).not.toHaveBeenCalled();
  });
  it('blocks removal and confirmation while the global save is pending', async () => {
    const { rerender } = render(<EventDetailsFields />);
    fireEvent.click(screen.getByRole('button', { name: 'Remove image' }));
    fixture.busy = true;
    rerender(<EventDetailsFields />);
    const pending = screen.getByRole('button', { name: 'Processing...' });
    expect(pending).toBeDisabled();
    fireEvent.click(pending);
    expect(fixture.setSection).not.toHaveBeenCalled();
    fixture.busy = false;
    rerender(<EventDetailsFields />);
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    fixture.busy = true;
    rerender(<EventDetailsFields />);
    expect(screen.getByRole('button', { name: 'Remove image' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Remove image' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(fixture.setSection).not.toHaveBeenCalled();
  });
  it('discards a newly selected local file without removing or confirming the persisted cover', () => {
    fixture.file = new File(['local'], 'local.png', { type: 'image/png' });
    render(<EventDetailsFields />);
    fireEvent.click(screen.getByRole('button', { name: 'Remove image' }));
    expect(fixture.setImageFile).toHaveBeenCalledExactlyOnceWith(null);
    expect(fixture.setSection).not.toHaveBeenCalled();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
