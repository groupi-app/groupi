import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EventImageUpload } from './event-image-upload';

// Mock the file upload hook
vi.mock('@/hooks/convex/use-file-upload', () => ({
  useFileUpload: () => ({
    uploadFile: vi.fn(),
    isUploading: false,
  }),
  ALLOWED_MIME_TYPES: {
    IMAGE: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  },
}));

describe('EventImageUpload', () => {
  const mockOnFileChange = vi.fn();
  const mockOnRemoveExisting = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('empty state', () => {
    it('renders upload placeholder when no image', () => {
      render(<EventImageUpload onFileChange={mockOnFileChange} />);

      expect(screen.getByText('Add a cover image')).toBeInTheDocument();
      expect(
        screen.getByText('Drag and drop or click to upload')
      ).toBeInTheDocument();
    });

    it('has clickable upload area', () => {
      render(<EventImageUpload onFileChange={mockOnFileChange} />);

      // The upload area with cursor-pointer is the parent of the text
      const uploadArea = screen
        .getByText('Add a cover image')
        .closest('[class*="cursor-pointer"]');
      expect(uploadArea).toBeInTheDocument();
    });

    it('shows disabled state when disabled prop is true', () => {
      render(<EventImageUpload onFileChange={mockOnFileChange} disabled />);

      // When disabled, the area should have opacity-50 and cursor-not-allowed
      const uploadArea = screen
        .getByText('Add a cover image')
        .closest('[class*="opacity-50"]');
      expect(uploadArea).toBeInTheDocument();
    });
  });

  describe('with existing image URL', () => {
    it('renders image preview when imageUrl is provided', () => {
      render(
        <EventImageUpload
          imageUrl='https://example.com/image.jpg'
          onFileChange={mockOnFileChange}
        />
      );

      const image = screen.getByAltText('Event cover image preview');
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute('src', 'https://example.com/image.jpg');
    });

    it('shows remove button', () => {
      render(
        <EventImageUpload
          imageUrl='https://example.com/image.jpg'
          onFileChange={mockOnFileChange}
        />
      );

      const removeButton = screen.getByRole('button', { name: /remove/i });
      expect(removeButton).toBeInTheDocument();
    });

    it('calls onFileChange with null and onRemoveExisting when remove is clicked', () => {
      render(
        <EventImageUpload
          imageUrl='https://example.com/image.jpg'
          onFileChange={mockOnFileChange}
          onRemoveExisting={mockOnRemoveExisting}
        />
      );

      const removeButton = screen.getByRole('button', { name: /remove/i });
      fireEvent.click(removeButton);

      expect(mockOnFileChange).toHaveBeenCalledWith(null);
      expect(mockOnRemoveExisting).toHaveBeenCalled();
    });
  });

  describe('file input', () => {
    it('has hidden file input', () => {
      render(<EventImageUpload onFileChange={mockOnFileChange} />);

      const fileInput = document.querySelector('input[type="file"]');
      expect(fileInput).toBeInTheDocument();
      expect(fileInput).toHaveClass('hidden');
    });

    it('accepts image mime types', () => {
      render(<EventImageUpload onFileChange={mockOnFileChange} />);

      const fileInput = document.querySelector('input[type="file"]');
      expect(fileInput).toHaveAttribute(
        'accept',
        'image/jpeg,image/png,image/gif,image/webp'
      );
    });
  });

  describe('drag and drop', () => {
    it('shows drag state on drag over', () => {
      render(<EventImageUpload onFileChange={mockOnFileChange} />);

      // Find the drop zone (the clickable area)
      const uploadArea = screen
        .getByText('Add a cover image')
        .closest('[class*="border-dashed"]');
      fireEvent.dragOver(uploadArea!);

      // After drag over, should have border-primary class
      expect(uploadArea?.className).toContain('border-primary');
    });

    it('removes drag state on drag leave', () => {
      render(<EventImageUpload onFileChange={mockOnFileChange} />);

      const uploadArea = screen
        .getByText('Add a cover image')
        .closest('[class*="border-dashed"]');
      fireEvent.dragOver(uploadArea!);
      fireEvent.dragLeave(uploadArea!);

      // After drag leave, should not have border-primary
      expect(uploadArea?.className).not.toContain('border-primary');
    });
  });

  describe('file selection', () => {
    it('calls onFileChange when file is selected', async () => {
      render(<EventImageUpload onFileChange={mockOnFileChange} />);

      const fileInput = document.querySelector(
        'input[type="file"]'
      ) as HTMLInputElement;
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

      Object.defineProperty(fileInput, 'files', {
        value: [file],
      });

      fireEvent.change(fileInput);

      expect(mockOnFileChange).toHaveBeenCalledWith(file);
    });

    it('does not call onFileChange for non-image files', async () => {
      render(<EventImageUpload onFileChange={mockOnFileChange} />);

      const fileInput = document.querySelector(
        'input[type="file"]'
      ) as HTMLInputElement;
      const file = new File(['test'], 'test.txt', { type: 'text/plain' });

      Object.defineProperty(fileInput, 'files', {
        value: [file],
      });

      fireEvent.change(fileInput);

      // Should not be called because the file type is not allowed
      expect(mockOnFileChange).not.toHaveBeenCalled();
    });
  });

  describe('with file prop', () => {
    it('shows blob URL preview when file is provided', () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

      // Mock URL.createObjectURL
      const mockBlobUrl = 'blob:http://localhost/test-blob-id';
      vi.spyOn(URL, 'createObjectURL').mockReturnValue(mockBlobUrl);

      render(<EventImageUpload file={file} onFileChange={mockOnFileChange} />);

      const image = screen.getByAltText('Event cover image preview');
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute('src', mockBlobUrl);
    });

    it('prefers blob URL over imageUrl when both are provided', () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

      // Mock URL.createObjectURL
      const mockBlobUrl = 'blob:http://localhost/test-blob-id';
      vi.spyOn(URL, 'createObjectURL').mockReturnValue(mockBlobUrl);

      render(
        <EventImageUpload
          imageUrl='https://example.com/image.jpg'
          file={file}
          onFileChange={mockOnFileChange}
        />
      );

      const image = screen.getByAltText('Event cover image preview');
      expect(image).toHaveAttribute('src', mockBlobUrl);
    });
  });
});
