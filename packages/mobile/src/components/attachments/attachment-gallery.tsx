import { useState } from 'react';
import {
  View,
  Image,
  Pressable,
  Dimensions,
  Modal,
  Text,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from '@/components/ui/safe-area-view';

interface Attachment {
  _id: string;
  url?: string | null;
  type: string;
  filename: string;
  width?: number;
  height?: number;
  mimeType: string;
  isSpoiler?: boolean;
  altText?: string;
}

interface AttachmentGalleryProps {
  attachments: Attachment[];
}

const screenWidth = Dimensions.get('window').width;
const GALLERY_PADDING = 32; // px-4 = 16 * 2
const GAP = 4;

export function AttachmentGallery({ attachments }: AttachmentGalleryProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [revealedSpoilers, setRevealedSpoilers] = useState<Set<string>>(
    new Set()
  );

  const images = attachments.filter(a => a.type === 'IMAGE' && a.url);

  if (images.length === 0) return null;

  const availableWidth = screenWidth - GALLERY_PADDING;

  function handlePress(attachment: Attachment, index: number) {
    if (attachment.isSpoiler && !revealedSpoilers.has(attachment._id)) {
      setRevealedSpoilers(prev => new Set(prev).add(attachment._id));
      return;
    }
    setLightboxIndex(index);
  }

  function renderGrid() {
    if (images.length === 1) {
      const img = images[0];
      const aspectRatio =
        img.width && img.height ? img.width / img.height : 16 / 9;
      const height = Math.min(availableWidth / aspectRatio, 300);

      return (
        <Pressable onPress={() => handlePress(img, 0)}>
          <ImageTile
            attachment={img}
            width={availableWidth}
            height={height}
            isRevealed={revealedSpoilers.has(img._id)}
          />
        </Pressable>
      );
    }

    if (images.length === 2) {
      const tileWidth = (availableWidth - GAP) / 2;
      return (
        <View className='flex-row' style={{ gap: GAP }}>
          {images.map((img, i) => (
            <Pressable key={img._id} onPress={() => handlePress(img, i)}>
              <ImageTile
                attachment={img}
                width={tileWidth}
                height={tileWidth}
                isRevealed={revealedSpoilers.has(img._id)}
              />
            </Pressable>
          ))}
        </View>
      );
    }

    // 3+ images: first full-width, then 2-up rows
    const rows: Attachment[][] = [];
    rows.push([images[0]]);
    for (let i = 1; i < images.length; i += 2) {
      rows.push(images.slice(i, i + 2));
    }

    return (
      <View style={{ gap: GAP }}>
        {rows.map((row, rowIdx) => {
          if (row.length === 1 && rowIdx === 0) {
            const img = row[0];
            return (
              <Pressable key={img._id} onPress={() => handlePress(img, 0)}>
                <ImageTile
                  attachment={img}
                  width={availableWidth}
                  height={180}
                  isRevealed={revealedSpoilers.has(img._id)}
                />
              </Pressable>
            );
          }

          const tileWidth =
            row.length === 1 ? availableWidth : (availableWidth - GAP) / 2;

          return (
            <View key={rowIdx} className='flex-row' style={{ gap: GAP }}>
              {row.map(img => {
                const flatIndex = images.indexOf(img);
                return (
                  <Pressable
                    key={img._id}
                    onPress={() => handlePress(img, flatIndex)}
                  >
                    <ImageTile
                      attachment={img}
                      width={tileWidth}
                      height={tileWidth * 0.75}
                      isRevealed={revealedSpoilers.has(img._id)}
                    />
                  </Pressable>
                );
              })}
            </View>
          );
        })}
      </View>
    );
  }

  return (
    <View className='mt-3'>
      {renderGrid()}

      {/* Lightbox */}
      <Modal
        visible={lightboxIndex !== null}
        transparent
        animationType='fade'
        onRequestClose={() => setLightboxIndex(null)}
      >
        <SafeAreaView className='flex-1 bg-black'>
          <View className='flex-row items-center justify-between px-4 py-2'>
            <Pressable onPress={() => setLightboxIndex(null)} className='p-2'>
              <Ionicons name='close' size={28} color='#ffffff' />
            </Pressable>
            <Text className='text-sm text-white/70'>
              {lightboxIndex !== null ? lightboxIndex + 1 : 0} / {images.length}
            </Text>
            <View className='w-10' />
          </View>

          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            contentOffset={{
              x: (lightboxIndex ?? 0) * screenWidth,
              y: 0,
            }}
          >
            {images.map(img => (
              <View
                key={img._id}
                className='items-center justify-center'
                style={{ width: screenWidth }}
              >
                <Image
                  source={{ uri: img.url! }}
                  className='h-full w-full'
                  resizeMode='contain'
                />
              </View>
            ))}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

function ImageTile({
  attachment,
  width,
  height,
  isRevealed,
}: {
  attachment: Attachment;
  width: number;
  height: number;
  isRevealed: boolean;
}) {
  const isSpoiler = attachment.isSpoiler && !isRevealed;

  return (
    <View className='overflow-hidden rounded-input' style={{ width, height }}>
      <Image
        source={{ uri: attachment.url! }}
        style={{ width, height }}
        resizeMode='cover'
        blurRadius={isSpoiler ? 30 : 0}
      />
      {isSpoiler ? (
        <View className='absolute inset-0 items-center justify-center bg-black/30'>
          <Ionicons name='eye-off' size={24} color='#ffffff' />
          <Text className='mt-1 text-xs font-bold text-white'>SPOILER</Text>
        </View>
      ) : null}
    </View>
  );
}
