import { useCallback } from 'react';

import { ALLOWED_FILE_TYPES } from '@/lib/file-upload-policy';

interface PickedDocument {
  uri: string;
  filename: string;
  mimeType: string;
  size?: number;
}

// Lazy-loaded so an older development build without the native module can
// still launch. The file picker becomes available after the next native build.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let documentPickerModule: any;
function documentPicker() {
  if (documentPickerModule === undefined) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      documentPickerModule = require('expo-document-picker');
    } catch {
      documentPickerModule = null;
    }
  }
  return documentPickerModule;
}

export function useDocumentPicker() {
  const pickFiles = useCallback(async (): Promise<PickedDocument[]> => {
    const picker = documentPicker();
    if (!picker) return [];

    const result = await picker.getDocumentAsync({
      type: [...ALLOWED_FILE_TYPES],
      multiple: true,
      copyToCacheDirectory: true,
    });

    if (result.canceled || !result.assets?.length) return [];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return result.assets.map((asset: any) => ({
      uri: asset.uri,
      filename: asset.name ?? asset.uri.split('/').pop() ?? 'attachment',
      mimeType: asset.mimeType ?? 'application/octet-stream',
      size: asset.size,
    }));
  }, []);

  return { pickFiles };
}
