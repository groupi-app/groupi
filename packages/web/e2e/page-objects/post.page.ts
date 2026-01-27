import { Page, Locator } from '@playwright/test';
import { BasePage } from './base.page';

/**
 * Page object for the post detail page.
 *
 * Handles:
 * - Viewing post content
 * - Adding replies
 * - Editing post
 */
export class PostPage extends BasePage {
  // Locators
  readonly postTitle: Locator;
  readonly postContent: Locator;
  readonly postAuthor: Locator;
  readonly replyForm: Locator;
  readonly replyInput: Locator;
  readonly submitReplyButton: Locator;
  readonly replies: Locator;
  readonly editButton: Locator;
  readonly deleteButton: Locator;
  readonly backButton: Locator;

  constructor(page: Page) {
    super(page);

    this.postTitle = page.locator('h1, [data-post-title]');
    this.postContent = page.locator('[data-post-content], article > div');
    this.postAuthor = page.locator('[data-post-author]');
    this.replyForm = page.locator('[data-reply-form], form');
    this.replyInput = page.getByPlaceholder(/reply|comment|write/i);
    this.submitReplyButton = page.getByRole('button', {
      name: /send|submit|reply/i,
    });
    this.replies = page.locator('[data-reply], [data-replies] > *');
    this.editButton = page.getByRole('button', { name: /edit/i });
    this.deleteButton = page.getByRole('button', { name: /delete/i });
    this.backButton = page.getByRole('link', { name: /back/i });
  }

  /**
   * Navigate to a specific post.
   */
  async gotoPost(postId: string): Promise<void> {
    await super.goto(`/post/${postId}`);
    await this.waitForDataLoad();
  }

  /**
   * Wait for post data to load.
   */
  override async waitForDataLoad(
    options: { timeout?: number } = {}
  ): Promise<void> {
    await super.waitForDataLoad(options);

    // Wait for post title to appear
    const timeout = options.timeout || 10000;
    await this.postTitle.waitFor({ state: 'visible', timeout });
  }

  /**
   * Check if we're on a post page.
   */
  async isDisplayed(): Promise<boolean> {
    return this.isOnPath(/\/post\//);
  }

  /**
   * Get the post title.
   */
  async getTitle(): Promise<string> {
    const text = await this.postTitle.textContent();
    return text?.trim() || '';
  }

  /**
   * Get the post content.
   */
  async getContent(): Promise<string> {
    const text = await this.postContent.textContent();
    return text?.trim() || '';
  }

  /**
   * Get the post author name.
   */
  async getAuthor(): Promise<string | null> {
    const isVisible = await this.postAuthor.isVisible().catch(() => false);
    if (!isVisible) {
      return null;
    }
    const text = await this.postAuthor.textContent();
    return text?.trim() || null;
  }

  /**
   * Add a reply to the post.
   */
  async addReply(text: string): Promise<void> {
    await this.replyInput.fill(text);
    await this.submitReplyButton.click();

    // Wait for reply to appear
    await this.waitForReply(text);
  }

  /**
   * Get the count of replies.
   */
  async getReplyCount(): Promise<number> {
    return this.replies.count();
  }

  /**
   * Get all replies.
   */
  getReplies(): Locator {
    return this.replies;
  }

  /**
   * Check if a specific reply exists.
   */
  async hasReply(text: string): Promise<boolean> {
    const reply = this.replies.filter({ hasText: text });
    return reply.isVisible();
  }

  /**
   * Wait for a new reply to appear.
   */
  async waitForReply(
    text: string,
    options: { timeout?: number } = {}
  ): Promise<void> {
    const timeout = options.timeout || 10000;
    await this.replies
      .filter({ hasText: text })
      .waitFor({ state: 'visible', timeout });
  }

  /**
   * Click the edit button.
   */
  async clickEdit(): Promise<void> {
    await this.editButton.click();
    await this.waitForNavigation(/\/edit/);
  }

  /**
   * Delete the post.
   */
  async deletePost(): Promise<void> {
    await this.deleteButton.click();

    // Confirm deletion if dialog appears
    const confirmButton = this.page.getByRole('button', {
      name: /confirm|delete|yes/i,
    });
    const isConfirmVisible = await confirmButton.isVisible().catch(() => false);
    if (isConfirmVisible) {
      await confirmButton.click();
    }

    // Wait for redirect back to event
    await this.waitForNavigation(/\/event\//);
  }

  /**
   * Navigate back to the event.
   */
  async goBack(): Promise<void> {
    await this.backButton.click();
    await this.waitForNavigation(/\/event\//);
  }

  /**
   * Check if the current user can edit this post.
   */
  async canEdit(): Promise<boolean> {
    return this.editButton.isVisible();
  }

  /**
   * Check if the current user can delete this post.
   */
  async canDelete(): Promise<boolean> {
    return this.deleteButton.isVisible();
  }
}
