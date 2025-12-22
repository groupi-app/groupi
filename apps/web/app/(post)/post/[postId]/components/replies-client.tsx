'use client';

import { ReplyFeedClient } from './reply-feed-client';
import ReplyForm from './reply-form';
import type { PostDetailPageData } from '@groupi/schema/data';
import { useEffect, useRef, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { fetchPostDetail } from '@/lib/queries/post-queries';
import { qk } from '@/lib/query-keys';

type Reply_Type = PostDetailPageData['post']['replies'][0];
type UserMembership = PostDetailPageData['userMembership'];
type Post = PostDetailPageData['post'];

interface RepliesClientProps {
  postId: string;
  userId: string;
  replies: Reply_Type[];
  userMembership: UserMembership;
  post: Post;
}

/**
 * Client wrapper that connects ReplyForm and ReplyFeedClient
 * Realtime sync handles all updates automatically
 */
export function RepliesClient({
  postId,
  userId,
  replies: initialReplies,
  userMembership,
  post,
}: RepliesClientProps) {
  const newestReplyRef = useRef<HTMLDivElement>(null);
  const [showJumpToPresent, setShowJumpToPresent] = useState(false);
  const [buttonRight, setButtonRight] = useState<number | undefined>(undefined);
  const [buttonBottom, setButtonBottom] = useState<number>(99);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [newMessageCount, setNewMessageCount] = useState(0);
  const previousReplyCountRef = useRef<number>(initialReplies.length);
  const isScrollingRef = useRef(false);

  // Watch for reply changes to detect new messages
  const { data: postDetail } = useQuery({
    queryKey: qk.posts.detail(post.id),
    queryFn: () => fetchPostDetail(post.id),
    initialData: {
      post: { ...post, replies: initialReplies },
      userMembership,
    } as PostDetailPageData,
    staleTime: 30 * 1000,
    select: data => data.post.replies,
  });

  const currentReplies = postDetail || initialReplies;
  const currentReplyCount = currentReplies.length;

  const scrollToPresent = useCallback(() => {
    if (!newestReplyRef.current) {
      console.log('[scrollToPresent] No ref available');
      return;
    }

    console.log('[scrollToPresent] Starting scroll');

    // Reset badge count when manually scrolling
    setNewMessageCount(0);
    setIsAtBottom(true);

    // Get the form element to calculate its height
    const formElement = document.querySelector(
      '[data-reply-form]'
    ) as HTMLElement;
    const formHeight = formElement ? formElement.offsetHeight : 0;

    // Get the position of the newest reply relative to the document
    const rect = newestReplyRef.current.getBoundingClientRect();
    const currentScrollTop = window.scrollY || document.documentElement.scrollTop;
    const elementTop = rect.top + currentScrollTop;
    const elementHeight = rect.height;
    const elementBottom = elementTop + elementHeight;

    // Calculate the target scroll position so the reply is fully visible above the form
    // We want: scrollTop + viewportHeight = elementBottom + formHeight + padding
    const viewportHeight = window.innerHeight;
    const padding = 8;
    const targetScroll = elementBottom + formHeight + padding - viewportHeight;

    console.log('[scrollToPresent] Scroll calculation:', {
      formHeight,
      rectTop: rect.top,
      rectHeight: rect.height,
      currentScrollTop,
      elementTop,
      elementBottom,
      viewportHeight,
      padding,
      targetScroll,
      finalScroll: Math.max(0, targetScroll),
    });

    window.scrollTo({
      top: Math.max(0, targetScroll),
      behavior: 'smooth',
    });
  }, []);

  // Check if newest reply is visible and calculate button position
  useEffect(() => {
    let observer: IntersectionObserver | null = null;
    let timeoutId: NodeJS.Timeout | null = null;

    const calculateButtonPosition = () => {
      // Find the form container to get its right edge and height
      const formElement = document.querySelector(
        '[data-reply-form]'
      ) as HTMLElement;
      if (formElement) {
        const rect = formElement.getBoundingClientRect();
        const rightEdge = window.innerWidth - rect.right;
        setButtonRight(rightEdge);
        // Position button above the form with some spacing (8px)
        const spacing = 8;
        setButtonBottom(rect.height + spacing);
      }
    };

    const setupObserver = () => {
      if (!newestReplyRef.current) {
        setShowJumpToPresent(false);
        return;
      }

      // Disconnect any existing observer
      if (observer) {
        observer.disconnect();
      }

      // Use IntersectionObserver for reliable visibility detection
      observer = new IntersectionObserver(
        entries => {
          const entry = entries[0];
          // Show button if element is not fully visible (intersectionRatio < 1)
          // or if it's above the viewport (boundingClientRect.top < 0)
          const isFullyVisible =
            entry.isIntersecting &&
            entry.intersectionRatio >= 1 &&
            entry.boundingClientRect.top >= 0;
          setShowJumpToPresent(!isFullyVisible);
        },
        {
          threshold: [0, 0.1, 0.5, 1], // Multiple thresholds for better detection
          rootMargin: '0px',
        }
      );

      observer.observe(newestReplyRef.current);
      calculateButtonPosition();
    };

    // Try to set up observer immediately, then retry if ref isn't ready
    setupObserver();

    // If ref wasn't ready, retry after a short delay
    if (!newestReplyRef.current) {
      timeoutId = setTimeout(() => {
        setupObserver();
      }, 100);
    }

    const handleResize = () => {
      calculateButtonPosition();
    };

    // Observe form height changes (e.g., when field grows on mobile)
    const formElement = document.querySelector(
      '[data-reply-form]'
    ) as HTMLElement;
    let resizeObserver: ResizeObserver | null = null;

    if (formElement && typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        calculateButtonPosition();
      });
      resizeObserver.observe(formElement);
    }

    window.addEventListener('resize', handleResize, { passive: true });

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      if (observer) {
        observer.disconnect();
      }
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      window.removeEventListener('resize', handleResize);
    };
  }, [initialReplies]);

  // Check if user is at bottom of page
  useEffect(() => {
    const checkIfAtBottom = () => {
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const scrollBottom = scrollTop + windowHeight;

      // Consider "at bottom" if within 200px of bottom (more lenient for autoscroll)
      const autoscrollThreshold = 200;
      const distanceFromBottom = documentHeight - scrollBottom;
      
      const isNearBottom = distanceFromBottom <= autoscrollThreshold;

      if (isNearBottom && !isAtBottom) {
        // User scrolled back to bottom, reset count
        setIsAtBottom(true);
        setNewMessageCount(0);
      } else if (!isNearBottom && isAtBottom) {
        setIsAtBottom(false);
      }
    };

    checkIfAtBottom();
    window.addEventListener('scroll', checkIfAtBottom, { passive: true });
    window.addEventListener('resize', checkIfAtBottom, { passive: true });

    return () => {
      window.removeEventListener('scroll', checkIfAtBottom);
      window.removeEventListener('resize', checkIfAtBottom);
    };
  }, [isAtBottom]);

  // Detect new messages and either scroll or increment count
  useEffect(() => {
    if (currentReplyCount > previousReplyCountRef.current) {
      const newMessages = currentReplyCount - previousReplyCountRef.current;
      
      console.log('[Autoscroll] New message detected:', {
        previousCount: previousReplyCountRef.current,
        currentCount: currentReplyCount,
        newMessages,
      });
      
      // Get the newest reply to check if it's from the current user
      const newestReply = currentReplies.length > 0 ? currentReplies[currentReplies.length - 1] : null;
      const isMyMessage = newestReply?.author?.id === userId;
      
      console.log('[Autoscroll] Message details:', {
        newestReplyId: newestReply?.id,
        newestReplyAuthorId: newestReply?.author?.id,
        userId,
        isMyMessage,
      });
      
      const autoscrollThreshold = 200; // Autoscroll if within 200px of bottom
      const badgeThreshold = 300; // Only show badge if more than 300px from bottom

      // Helper function to attempt scrolling
      const attemptScroll = (attempts = 0, forceScroll = false) => {
        console.log('[Autoscroll] Attempt scroll:', { attempts, forceScroll, hasRef: !!newestReplyRef.current });
        
        if (attempts > 20) {
          // Give up after 20 attempts (2 seconds)
          console.log('[Autoscroll] Giving up after 20 attempts');
          isScrollingRef.current = false;
          return;
        }

        if (newestReplyRef.current) {
          console.log('[Autoscroll] Ref attached, scrolling now');
          // Ref is attached, scroll now
          requestAnimationFrame(() => {
            console.log('[Autoscroll] Calling scrollToPresent');
            scrollToPresent();
            // Reset scrolling flag after scroll completes
            setTimeout(() => {
              isScrollingRef.current = false;
              console.log('[Autoscroll] Scroll complete, flag reset');
            }, 500);
          });
        } else {
          // Ref not ready yet, try again
          console.log('[Autoscroll] Ref not ready, retrying...');
          setTimeout(() => attemptScroll(attempts + 1, forceScroll), 100);
        }
      };

      if (isMyMessage) {
        // Always scroll when user sends their own message, regardless of position
        console.log('[Autoscroll] My message - forcing scroll');
        if (!isScrollingRef.current) {
          isScrollingRef.current = true;
          setTimeout(() => attemptScroll(0, true), 50);
        } else {
          console.log('[Autoscroll] Already scrolling, skipping');
        }
      } else {
        // For Pusher messages (other people's messages), check scroll position
        const windowHeight = window.innerHeight;
        const scrollTop = window.scrollY || document.documentElement.scrollTop;
        const scrollBottom = scrollTop + windowHeight;
        const documentHeight = document.documentElement.scrollHeight;
        const distanceFromBottom = documentHeight - scrollBottom;
        
        console.log('[Autoscroll] Pusher message - checking position:', {
          scrollTop,
          scrollBottom,
          documentHeight,
          distanceFromBottom,
          autoscrollThreshold,
          badgeThreshold,
        });
        
        const wasNearBottom = distanceFromBottom <= autoscrollThreshold;

        if (wasNearBottom && !isScrollingRef.current) {
          // User was near bottom, auto-scroll to new message
          console.log('[Autoscroll] Near bottom - scrolling');
          isScrollingRef.current = true;
          setTimeout(() => attemptScroll(0, false), 50);
        } else if (distanceFromBottom > badgeThreshold) {
          // User is scrolled up significantly, increment badge count
          console.log('[Autoscroll] Scrolled up - incrementing badge:', newMessages);
          setNewMessageCount(prev => prev + newMessages);
        } else {
          console.log('[Autoscroll] Not near bottom and not far enough for badge - no action');
        }
      }
    }

    previousReplyCountRef.current = currentReplyCount;
  }, [currentReplyCount, currentReplies, userId, scrollToPresent]);

  return (
    <div className='flex flex-col mt-6'>
      {/* Divider between post and replies */}
      <div className='border-t border-border mb-6'></div>
      <div className='flex flex-col gap-4 -mx-4 sm:mx-0'>
        <ReplyFeedClient
          replies={initialReplies}
          userMembership={userMembership}
          userId={userId}
          post={post}
          newestReplyRef={newestReplyRef}
        />
        <ReplyForm postId={postId} userId={userId} post={post} />
      </div>

      {showJumpToPresent && (
        <Button
          onClick={scrollToPresent}
          variant='secondary'
          className={cn(
            'fixed z-20 shadow-lg text-xs w-auto',
            'animate-in fade-in slide-in-from-bottom-4'
          )}
          style={{
            right: buttonRight !== undefined ? `${buttonRight}px` : '16px',
            bottom: `${buttonBottom}px`,
          }}
          size='sm'
        >
          <div className='relative flex items-center'>
            <Icons.down className='h-3 w-3 mr-1.5' />
            Jump to Present
            {newMessageCount > 0 && (
              <span className='absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-bold'>
                {newMessageCount > 99 ? '99+' : newMessageCount}
              </span>
            )}
          </div>
        </Button>
      )}
    </div>
  );
}
