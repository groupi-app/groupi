import { useMemo } from 'react';
import { View, Linking } from 'react-native';
import { Text } from '@/components/ui/text';
import { router } from 'expo-router';
import { cn } from '@/lib/utils';

interface HtmlContentProps {
  html: string;
  className?: string;
}

interface TextSegment {
  text: string;
  bold?: boolean;
  italic?: boolean;
  mentionId?: string;
  href?: string;
}

interface ContentBlock {
  type: 'paragraph' | 'heading' | 'list-item' | 'code';
  segments: TextSegment[];
  level?: number;
  ordered?: boolean;
}

/**
 * Lightweight HTML renderer for post content.
 * Handles the subset of HTML that BlockNote produces:
 * <p>, <strong>, <em>, <a>, <h1-h3>, <li>, <code>, and mention spans.
 */
export function HtmlContent({ html, className }: HtmlContentProps) {
  const blocks = useMemo(() => parseHtml(html), [html]);

  if (blocks.length === 0) {
    return (
      <Text className={cn('text-base text-foreground', className)}>{html}</Text>
    );
  }

  return (
    <View className={cn('gap-2', className)}>
      {blocks.map((block, index) => (
        <ContentBlockView key={index} block={block} />
      ))}
    </View>
  );
}

function ContentBlockView({ block }: { block: ContentBlock }) {
  const textClassName =
    block.type === 'heading'
      ? block.level === 1
        ? 'text-xl font-bold text-foreground'
        : block.level === 2
          ? 'text-lg font-bold text-foreground'
          : 'text-base font-semibold text-foreground'
      : block.type === 'code'
        ? 'text-sm font-mono text-foreground bg-muted px-2 py-1 rounded-input'
        : 'text-base leading-relaxed text-foreground';

  if (block.type === 'list-item') {
    return (
      <View className='flex-row gap-2 pl-2'>
        <Text className='text-base text-muted-foreground'>
          {block.ordered ? '•' : '•'}
        </Text>
        <Text className={textClassName}>
          <SegmentedText segments={block.segments} />
        </Text>
      </View>
    );
  }

  return (
    <Text className={textClassName}>
      <SegmentedText segments={block.segments} />
    </Text>
  );
}

function SegmentedText({ segments }: { segments: TextSegment[] }) {
  return (
    <>
      {segments.map((seg, i) => {
        if (seg.mentionId) {
          return (
            <Text
              key={i}
              className='font-semibold text-primary'
              onPress={() => router.push(`/profile/${seg.mentionId}`)}
            >
              {seg.text}
            </Text>
          );
        }

        if (seg.href) {
          return (
            <Text
              key={i}
              className='text-primary underline'
              onPress={() => {
                if (seg.href) Linking.openURL(seg.href);
              }}
            >
              {seg.text}
            </Text>
          );
        }

        let textStyle = '';
        if (seg.bold && seg.italic) textStyle = 'font-bold italic';
        else if (seg.bold) textStyle = 'font-bold';
        else if (seg.italic) textStyle = 'italic';

        return (
          <Text key={i} className={textStyle || undefined}>
            {seg.text}
          </Text>
        );
      })}
    </>
  );
}

// Simple HTML parser for BlockNote output
function parseHtml(html: string): ContentBlock[] {
  const blocks: ContentBlock[] = [];

  // Strip wrapping divs
  let content = html.trim();
  if (!content) return blocks;

  // Check if this looks like HTML
  if (!content.includes('<')) {
    return [{ type: 'paragraph', segments: [{ text: content }] }];
  }

  // Split by block-level tags
  const blockPattern =
    /<(p|h[1-6]|li|pre|blockquote|div)[^>]*>([\s\S]*?)<\/\1>/gi;
  let match;

  while ((match = blockPattern.exec(content)) !== null) {
    const tag = match[1].toLowerCase();
    const inner = match[2];

    let type: ContentBlock['type'] = 'paragraph';
    let level: number | undefined;

    if (tag.startsWith('h')) {
      type = 'heading';
      level = parseInt(tag[1], 10);
    } else if (tag === 'li') {
      type = 'list-item';
    } else if (tag === 'pre') {
      type = 'code';
    }

    const segments = parseInlineHtml(inner);
    if (segments.length > 0) {
      blocks.push({ type, segments, level });
    }
  }

  // If no blocks matched, treat entire content as paragraph
  if (blocks.length === 0) {
    const segments = parseInlineHtml(content);
    if (segments.length > 0) {
      blocks.push({ type: 'paragraph', segments });
    }
  }

  return blocks;
}

function parseInlineHtml(html: string): TextSegment[] {
  const segments: TextSegment[] = [];

  // Remove nested block tags
  let content = html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/?(?:p|div|ul|ol)[^>]*>/gi, '');

  // Process inline tags
  const inlinePattern =
    /<(strong|b|em|i|a|span)([^>]*)>([\s\S]*?)<\/\1>|([^<]+)/gi;
  let match;

  while ((match = inlinePattern.exec(content)) !== null) {
    if (match[4]) {
      // Plain text
      const text = decodeEntities(match[4]);
      if (text.trim()) {
        segments.push({ text });
      }
      continue;
    }

    const tag = match[1].toLowerCase();
    const attrs = match[2] || '';
    const inner = decodeEntities(stripTags(match[3]));

    if (!inner.trim()) continue;

    if (tag === 'strong' || tag === 'b') {
      segments.push({ text: inner, bold: true });
    } else if (tag === 'em' || tag === 'i') {
      segments.push({ text: inner, italic: true });
    } else if (tag === 'a') {
      const hrefMatch = attrs.match(/href="([^"]*)"/);
      segments.push({ text: inner, href: hrefMatch?.[1] });
    } else if (tag === 'span') {
      // Check for mention
      const mentionMatch = attrs.match(/data-id="([^"]*)"/);
      if (mentionMatch || attrs.includes('mention')) {
        segments.push({ text: inner, mentionId: mentionMatch?.[1] });
      } else {
        segments.push({ text: inner });
      }
    }
  }

  return segments;
}

function stripTags(html: string): string {
  return html.replace(/<[^>]*>/g, '');
}

function decodeEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');
}
