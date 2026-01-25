import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EventImageUpload } from './event-image-upload';
import { Id } from '@/convex/_generated/dataModel';

// Mock the file upload hook
const mockUploadFile = vi.fn();
vi.mock('@/hooks/convex/use-file-upload', () => ({
  useFileUpload: () => ({
    uploadFile: mockUploadFile,
    isUploading: false,
  }),
  ALLOWED_MIME_TYPES: {
    IMAGE: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  },
}));

describe('EventImageUpload', () => {
  const mockOnImageChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('empty state', () => {
    it('renders upload placeholder when no image', () => {
      render(<EventImageUpload onImageChange={mockOnImageChange} />);

      expect(screen.getByText('Add a cover image')).toBeInTheDocument();
      expect(
        screen.getByText('Drag and drop or click to upload')
      ).toBeInTheDocument();
    });

    it('has clickable upload area', () => {
      render(<EventImageUpload onImageChange={mockOnImageChange} />);

      // The upload area with cursor-pointer is the parent of the text
      const uploadArea = screen
        .getByText('Add a cover image')
        .closest('[class*="cursor-pointer"]');
      expect(uploadArea).toBeInTheDocument();
    });

    it('shows disabled state when disabled prop is true', () => {
      render(<EventImageUpload onImageChange={mockOnImageChange} disabled />);

      // When disabled, the area should have opacity-50 and cursor-not-allowed
      const uploadArea = screen
        .getByText('Add a cover image')
        .closest('[class*="opacity-50"]');
      expect(uploadArea).toBeInTheDocument();
    });
  });

  describe('with existing image', () => {
    it('renders image preview when imageUrl is provided', () => {
      render(
        <EventImageUpload
          imageUrl='https://example.com/image.jpg'
          onImageChange={mockOnImageChange}
        />
      );

      const image = screen.getByAltText('Event cover image preview');
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute('src', 'https://example.com/image.jpg');
    });

    it('shows remove button on hover', () => {
      render(
        <EventImageUpload
          imageUrl='https://example.com/image.jpg'
          onImageChange={mockOnImageChange}
        />
      );

      const removeButton = screen.getByRole('button', { name: /remove/i });
      expect(removeButton).toBeInTheDocument();
    });

    it('calls onImageChange with null when remove is clicked', () => {
      render(
        <EventImageUpload
          imageUrl='https://example.com/image.jpg'
          onImageChange={mockOnImageChange}
        />
      );

      const removeButton = screen.getByRole('button', { name: /remove/i });
      fireEvent.click(removeButton);

      expect(mockOnImageChange).toHaveBeenCalledWith(null);
    });
  });

  describe('file input', () => {
    it('has hidden file input', () => {
      render(<EventImageUpload onImageChange={mockOnImageChange} />);

      const fileInput = document.querySelector('input[type="file"]');
      expect(fileInput).toBeInTheDocument();
      expect(fileInput).toHaveClass('hidden');
    });

    it('accepts image mime types', () => {
      render(<EventImageUpload onImageChange={mockOnImageChange} />);

      const fileInput = document.querySelector('input[type="file"]');
      expect(fileInput).toHaveAttribute(
        'accept',
        'image/jpeg,image/png,image/gif,image/webp'
      );
    });
  });

  describe('drag and drop', () => {
    it('shows drag state on drag over', () => {
      render(<EventImageUpload onImageChange={mockOnImageChange} />);

      // Find the drop zone (the clickable area)
      const uploadArea = screen
        .getByText('Add a cover image')
        .closest('[class*="border-dashed"]');
      fireEvent.dragOver(uploadArea!);

      // After drag over, should have border-primary class
      expect(uploadArea?.className).toContain('border-primary');
    });

    it('removes drag state on drag leave', () => {
      render(<EventImageUpload onImageChange={mockOnImageChange} />);

      const uploadArea = screen
        .getByText('Add a cover image')
        .closest('[class*="border-dashed"]');
      fireEvent.dragOver(uploadArea!);
      fireEvent.dragLeave(uploadArea!);

      // After drag leave, should not have border-primary
      expect(uploadArea?.className).not.toContain('border-primary');
    });
  });

  describe('upload flow', () => {
    it('calls uploadFile when file is selected', async () => {
      const mockStorageId = 'test-storage-id' as Id<'_storage'>;
      mockUploadFile.mockResolvedValue({ storageId: mockStorageId });

      render(<EventImageUpload onImageChange={mockOnImageChange} />);

      const fileInput = document.querySelector(
        'input[type="file"]'
      ) as HTMLInputElement;
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

      Object.defineProperty(fileInput, 'files', {
        value: [file],
      });

      fireEvent.change(fileInput);

      // Wait for the upload to be called
      await vi.waitFor(() => {
        expect(mockUploadFile).toHaveBeenCalledWith(file);
      });
    });

    it('calls onImageChange with storageId after successful upload', async () => {
      const mockStorageId = 'test-storage-id' as Id<'_storage'>;
      mockUploadFile.mockResolvedValue({ storageId: mockStorageId });

      render(<EventImageUpload onImageChange={mockOnImageChange} />);

      const fileInput = document.querySelector(
        'input[type="file"]'
      ) as HTMLInputElement;
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

      Object.defineProperty(fileInput, 'files', {
        value: [file],
      });

      fireEvent.change(fileInput);

      await vi.waitFor(() => {
        expect(mockOnImageChange).toHaveBeenCalledWith(mockStorageId);
      });
    });
  });
});
