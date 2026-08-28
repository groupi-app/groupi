import { useCallback } from 'react';

interface PickImageOptions {
  allowsEditing?: boolean;
  aspect?: [number, number];
  quality?: number;
  mediaTypes?: string[];
}

interface PickedImage {
  uri: string;
  filename: string;
  mimeType: string;
  width: number;
  height: number;
  fileSize?: number;
}

// Lazy-loaded at call time. If expo-image-picker isn't linked in the
// native build the functions gracefully return null / [].
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _IP: any;
function ip() {
  if (_IP === undefined) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      _IP = require('expo-image-picker');
    } catch {
      _IP = null;
    }
  }
  return _IP;
}

export function useImagePicker() {
  const pickImage = useCallback(
    async (options?: PickImageOptions): Promise<PickedImage | null> => {
      const mod = ip();
      if (!mod) return null;

      const result = await mod.launchImageLibraryAsync({
        mediaTypes: options?.mediaTypes ?? ['images'],
        allowsEditing: options?.allowsEditing ?? false,
        aspect: options?.aspect,
        quality: options?.quality ?? 0.8,
        allowsMultipleSelection: false,
      });

      if (result.canceled || !result.assets[0]) return null;

      const asset = result.assets[0];
      return {
        uri: asset.uri,
        filename: asset.fileName ?? asset.uri.split('/').pop() ?? 'image.jpg',
        mimeType: asset.mimeType ?? 'image/jpeg',
        width: asset.width,
        height: asset.height,
        fileSize: asset.fileSize,
      };
    },
    []
  );

  const pickMultipleImages = useCallback(
    async (
      options?: Omit<PickImageOptions, 'allowsMultipleSelection'>
    ): Promise<PickedImage[]> => {
      const mod = ip();
      if (!mod) return [];

      const result = await mod.launchImageLibraryAsync({
        mediaTypes: options?.mediaTypes ?? ['images'],
        allowsEditing: false,
        quality: options?.quality ?? 0.8,
        allowsMultipleSelection: true,
      });

      if (result.canceled || !result.assets?.length) return [];

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return result.assets.map((asset: any) => ({
        uri: asset.uri,
        filename: asset.fileName ?? asset.uri.split('/').pop() ?? 'image.jpg',
        mimeType: asset.mimeType ?? 'image/jpeg',
        width: asset.width,
        height: asset.height,
        fileSize: asset.fileSize,
      }));
    },
    []
  );

  const takePhoto = useCallback(
    async (options?: PickImageOptions): Promise<PickedImage | null> => {
      const mod = ip();
      if (!mod) return null;

      const permission = await mod.requestCameraPermissionsAsync();
      if (!permission.granted) return null;

      const result = await mod.launchCameraAsync({
        mediaTypes: options?.mediaTypes ?? ['images'],
        allowsEditing: options?.allowsEditing ?? true,
        aspect: options?.aspect,
        quality: options?.quality ?? 0.8,
      });

      if (result.canceled || !result.assets[0]) return null;

      const asset = result.assets[0];
      return {
        uri: asset.uri,
        filename: asset.fileName ?? `photo_${Date.now()}.jpg`,
        mimeType: asset.mimeType ?? 'image/jpeg',
        width: asset.width,
        height: asset.height,
        fileSize: asset.fileSize,
      };
    },
    []
  );

  return { pickImage, pickMultipleImages, takePhoto };
}
