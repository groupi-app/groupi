import { useEffect, useRef, useState } from 'react';
import {
  FlatList,
  View,
  Image,
  Pressable,
  Modal,
  Text,
  useWindowDimensions,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCSSVariable } from 'uniwind';
import { SafeAreaView } from '@/components/ui/safe-area-view';
import { getSafeExternalUrl } from '@/lib/safe-links';
import { toast } from '@groupi/shared/platform';

interface Attachment {
  _id: string;
  url?: string | null;
  type: string;
  filename: string;
  width?: number;
  height?: number;
  mimeType: string;
  size?: number;
  isSpoiler?: boolean;
  altText?: string;
}

interface AttachmentGalleryProps {
  attachments: Attachment[];
}

const GALLERY_PADDING = 32; // px-4 = 16 * 2
const GAP = 4;

export function AttachmentGallery({ attachments }: AttachmentGalleryProps) {
  const { width: screenWidth } = useWindowDimensions();
  const lightboxRef = useRef<FlatList<Attachment>>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [revealedSpoilers, setRevealedSpoilers] = useState<Set<string>>(
    new Set()
  );

  const images = attachments.filter(a => a.type === 'IMAGE' && a.url);
  const files = attachments.filter(a => a.type !== 'IMAGE' && a.url);

  const availableWidth = screenWidth - GALLERY_PADDING;

  useEffect(() => {
    if (lightboxIndex === null) return;
    lightboxRef.current?.scrollToOffset({
      offset: lightboxIndex * screenWidth,
      animated: false,
    });
  }, [lightboxIndex, screenWidth]);

  if (images.length === 0 && files.length === 0) return null;

  async function handleFilePress(attachment: Attachment) {
    const safeUrl = getSafeExternalUrl(attachment.url ?? undefined);
    if (!safeUrl) {
      toast.error('This attachment link is unavailable');
      return;
    }

    try {
      await Linking.openURL(safeUrl);
    } catch {
      toast.error('Unable to open this attachment');
    }
  }

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
        <Pressable
          onPress={() => handlePress(img, 0)}
          accessibilityRole='button'
          accessibilityLabel={img.altText ?? `View ${img.filename}`}
          accessibilityHint={
            img.isSpoiler ? 'Reveals spoiler image' : undefined
          }
        >
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
            <Pressable
              key={img._id}
              onPress={() => handlePress(img, i)}
              accessibilityRole='button'
              accessibilityLabel={img.altText ?? `View ${img.filename}`}
              accessibilityHint={
                img.isSpoiler ? 'Reveals spoiler image' : undefined
              }
            >
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
              <Pressable
                key={img._id}
                onPress={() => handlePress(img, 0)}
                accessibilityRole='button'
                accessibilityLabel={img.altText ?? `View ${img.filename}`}
                accessibilityHint={
                  img.isSpoiler ? 'Reveals spoiler image' : undefined
                }
              >
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
                    accessibilityRole='button'
                    accessibilityLabel={img.altText ?? `View ${img.filename}`}
                    accessibilityHint={
                      img.isSpoiler ? 'Reveals spoiler image' : undefined
                    }
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
    <View className='mt-3 gap-2'>
      {images.length > 0 ? renderGrid() : null}

      {files.map(file => (
        <FileAttachment
          key={file._id}
          attachment={file}
          onPress={() => void handleFilePress(file)}
        />
      ))}

      {/* Lightbox */}
      <Modal
        visible={lightboxIndex !== null}
        transparent
        animationType='fade'
        onRequestClose={() => setLightboxIndex(null)}
      >
        <SafeAreaView className='flex-1 bg-black'>
          <View className='flex-row items-center justify-between px-4 py-2'>
            <Pressable
              onPress={() => setLightboxIndex(null)}
              className='min-h-[44px] min-w-[44px] items-center justify-center'
              accessibilityRole='button'
              accessibilityLabel='Close image viewer'
            >
              <Ionicons name='close' size={28} color='#ffffff' />
            </Pressable>
            <Text className='text-sm text-white/70'>
              {lightboxIndex !== null ? lightboxIndex + 1 : 0} / {images.length}
            </Text>
            <View className='w-10' />
          </View>

          <FlatList
            ref={lightboxRef}
            data={images}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={item => item._id}
            initialNumToRender={1}
            maxToRenderPerBatch={2}
            windowSize={3}
            getItemLayout={(_, index) => ({
              length: screenWidth,
              offset: screenWidth * index,
              index,
            })}
            onMomentumScrollEnd={event => {
              setLightboxIndex(
                Math.round(event.nativeEvent.contentOffset.x / screenWidth)
              );
            }}
            renderItem={({ item: img }) => (
              <View
                className='items-center justify-center'
                style={{ width: screenWidth }}
              >
                <Image
                  source={{ uri: img.url! }}
                  className='h-full w-full'
                  resizeMode='contain'
                  accessibilityLabel={img.altText ?? img.filename}
                />
              </View>
            )}
          />
        </SafeAreaView>
      </Modal>
    </View>
  );
}

function getFileIcon(type: string): keyof typeof Ionicons.glyphMap {
  if (type === 'VIDEO') return 'videocam-outline';
  if (type === 'AUDIO') return 'musical-notes-outline';
  return 'document-text-outline';
}

function formatFileSize(size?: number) {
  if (!size || size <= 0) return null;
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function FileAttachment({
  attachment,
  onPress,
}: {
  attachment: Attachment;
  onPress: () => void;
}) {
  const primaryColor = String(
    useCSSVariable('--color-primary') ?? 'transparent'
  );
  const fileSize = formatFileSize(attachment.size);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole='link'
      accessibilityLabel={`Open attachment ${attachment.filename}`}
      className='flex-row items-center gap-3 rounded-card border border-border bg-card p-3'
    >
      <View className='h-10 w-10 items-center justify-center rounded-input bg-primary/10'>
        <Ionicons
          name={getFileIcon(attachment.type)}
          size={21}
          color={primaryColor}
        />
      </View>
      <View className='flex-1'>
        <Text
          className='text-sm font-semibold text-foreground'
          numberOfLines={1}
        >
          {attachment.filename}
        </Text>
        <Text className='mt-0.5 text-xs text-muted-foreground'>
          {[attachment.mimeType, fileSize].filter(Boolean).join(' · ')}
        </Text>
      </View>
      <Ionicons name='open-outline' size={18} color={primaryColor} />
    </Pressable>
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
        accessible={false}
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
