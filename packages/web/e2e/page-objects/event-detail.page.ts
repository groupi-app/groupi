import { Page, Locator } from '@playwright/test';
import { BasePage } from './base.page';

/**
 * Page object for the event detail page.
 *
 * Handles:
 * - Viewing event information
 * - Navigation to sub-pages (attendees, availability, invite)
 * - Creating posts
 * - Editing event
 */
export class EventDetailPage extends BasePage {
  // Locators
  readonly eventTitle: Locator;
  readonly eventDescription: Locator;
  readonly eventLocation: Locator;
  readonly eventDate: Locator;
  readonly postFeed: Locator;
  readonly newPostButton: Locator;
  readonly editButton: Locator;
  readonly inviteButton: Locator;
  readonly attendeesTab: Locator;
  readonly availabilityTab: Locator;
  readonly settingsButton: Locator;

  constructor(page: Page) {
    super(page);

    this.eventTitle = page.locator('h1, [data-event-title]');
    this.eventDescription = page.locator('[data-event-description]');
    this.eventLocation = page.locator('[data-event-location]');
    this.eventDate = page.locator('[data-event-date]');
    this.postFeed = page.locator('[data-post-feed], [data-posts]');
    this.newPostButton = page.getByRole('link', {
      name: /new post|create post|add post/i,
    });
    this.editButton = page.getByRole('link', { name: /edit/i });
    this.inviteButton = page.getByRole('link', { name: /invite/i });
    this.attendeesTab = page.getByRole('link', {
      name: /attendees|members|people/i,
    });
    this.availabilityTab = page.getByRole('link', {
      name: /availability|schedule|when/i,
    });
    this.settingsButton = page.getByRole('button', {
      name: /settings|options/i,
    });
  }

  /**
   * Navigate to a specific event page.
   */
  async gotoEvent(eventId: string): Promise<void> {
    await super.goto(`/event/${eventId}`);
    await this.waitForDataLoad();
  }

  /**
   * Wait for event data to load.
   */
  override async waitForDataLoad(
    options: { timeout?: number } = {}
  ): Promise<void> {
    await super.waitForDataLoad(options);

    // Wait for event title to appear
    const timeout = options.timeout || 10000;
    await this.eventTitle.waitFor({ state: 'visible', timeout });
  }

  /**
   * Check if we're on an event detail page.
   */
  async isDisplayed(): Promise<boolean> {
    return this.isOnPath(/\/event\//);
  }

  /**
   * Get the event title.
   */
  async getTitle(): Promise<string> {
    const text = await this.eventTitle.textContent();
    return text?.trim() || '';
  }

  /**
   * Get the event description.
   */
  async getDescription(): Promise<string | null> {
    const isVisible = await this.eventDescription
      .isVisible()
      .catch(() => false);
    if (!isVisible) {
      return null;
    }
    const text = await this.eventDescription.textContent();
    return text?.trim() || null;
  }

  /**
   * Get the event location.
   */
  async getLocation(): Promise<string | null> {
    const isVisible = await this.eventLocation.isVisible().catch(() => false);
    if (!isVisible) {
      return null;
    }
    const text = await this.eventLocation.textContent();
    return text?.trim() || null;
  }

  /**
   * Navigate to create new post.
   */
  async clickNewPost(): Promise<void> {
    await this.newPostButton.click();
    await this.waitForNavigation(/\/new-post/);
  }

  /**
   * Navigate to edit event.
   */
  async clickEdit(): Promise<void> {
    await this.editButton.click();
    await this.waitForNavigation(/\/edit/);
  }

  /**
   * Navigate to invite page.
   */
  async clickInvite(): Promise<void> {
    await this.inviteButton.click();
    await this.waitForNavigation(/\/invite/);
  }

  /**
   * Navigate to attendees tab.
   */
  async clickAttendees(): Promise<void> {
    await this.attendeesTab.click();
    await this.waitForNavigation(/\/attendees/);
  }

  /**
   * Navigate to availability tab.
   */
  async clickAvailability(): Promise<void> {
    await this.availabilityTab.click();
    await this.waitForNavigation(/\/availability/);
  }

  /**
   * Get all post cards in the feed.
   */
  getPostCards(): Locator {
    return this.page.locator('[data-post-card], article[data-testid*="post"]');
  }

  /**
   * Get post count in the feed.
   */
  async getPostCount(): Promise<number> {
    return this.getPostCards().count();
  }

  /**
   * Click on a specific post by title.
   */
  async clickPost(title: string): Promise<void> {
    const postCard = this.getPostCards().filter({ hasText: title });
    await postCard.click();
    await this.waitForNavigation(/\/post\//);
  }

  /**
   * Check if a post with the given title exists.
   */
  async hasPost(title: string): Promise<boolean> {
    const postCard = this.getPostCards().filter({ hasText: title });
    return postCard.isVisible();
  }

  /**
   * Wait for a new post to appear.
   */
  async waitForPost(
    title: string,
    options: { timeout?: number } = {}
  ): Promise<void> {
    const timeout = options.timeout || 10000;
    await this.getPostCards()
      .filter({ hasText: title })
      .waitFor({ state: 'visible', timeout });
  }

  /**
   * Check if the user can edit the event.
   */
  async canEdit(): Promise<boolean> {
    return this.editButton.isVisible();
  }

  /**
   * Check if the user can invite others.
   */
  async canInvite(): Promise<boolean> {
    return this.inviteButton.isVisible();
  }
}
