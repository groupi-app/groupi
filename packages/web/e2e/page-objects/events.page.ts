import { Page, Locator } from '@playwright/test';
import { BasePage } from './base.page';

/**
 * Page object for the events list page.
 *
 * Handles:
 * - Viewing event list
 * - Creating new events
 * - Filtering and sorting events
 */
export class EventsPage extends BasePage {
  // Locators
  readonly eventCards: Locator;
  readonly createEventButton: Locator;
  readonly emptyState: Locator;
  readonly filterControls: Locator;
  readonly sortControls: Locator;

  constructor(page: Page) {
    super(page);

    this.eventCards = page.locator(
      '[data-event-card], article[data-testid*="event"]'
    );
    this.createEventButton = page.getByRole('link', {
      name: /create|new event/i,
    });
    this.emptyState = page.getByText(
      /no events|get started|create your first/i
    );
    this.filterControls = page.locator('[data-filter-controls]');
    this.sortControls = page.locator('[data-sort-controls]');
  }

  /**
   * Navigate to the events page.
   */
  async goto(): Promise<void> {
    await super.goto('/events');
    await this.waitForDataLoad();
  }

  /**
   * Wait for events data to load.
   */
  override async waitForDataLoad(
    options: { timeout?: number } = {}
  ): Promise<void> {
    await super.waitForDataLoad(options);

    // Wait for either event cards or empty state to appear
    const timeout = options.timeout || 10000;
    await Promise.race([
      this.eventCards
        .first()
        .waitFor({ state: 'visible', timeout })
        .catch(() => {}),
      this.emptyState.waitFor({ state: 'visible', timeout }).catch(() => {}),
    ]);
  }

  /**
   * Check if we're on the events page.
   */
  async isDisplayed(): Promise<boolean> {
    return this.isOnPath('/events');
  }

  /**
   * Get all event cards.
   */
  async getEventCards(): Promise<Locator> {
    return this.eventCards;
  }

  /**
   * Get the count of visible events.
   */
  async getEventCount(): Promise<number> {
    return this.eventCards.count();
  }

  /**
   * Check if the empty state is displayed.
   */
  async isEmptyStateDisplayed(): Promise<boolean> {
    return this.emptyState.isVisible();
  }

  /**
   * Click on an event by its title.
   */
  async clickEvent(title: string): Promise<void> {
    const eventCard = this.eventCards.filter({ hasText: title });
    await eventCard.click();
  }

  /**
   * Click the create new event button.
   */
  async createNewEvent(): Promise<void> {
    await this.createEventButton.click();
    await this.waitForNavigation(/\/create/);
  }

  /**
   * Get all event titles.
   */
  async getEventTitles(): Promise<string[]> {
    const cards = await this.eventCards.all();
    const titles: string[] = [];

    for (const card of cards) {
      const titleElement = card.locator('h2, h3, [data-event-title]');
      const title = await titleElement.textContent();
      if (title) {
        titles.push(title.trim());
      }
    }

    return titles;
  }

  /**
   * Check if a specific event is displayed.
   */
  async hasEvent(title: string): Promise<boolean> {
    const eventCard = this.eventCards.filter({ hasText: title });
    return eventCard.isVisible();
  }

  /**
   * Get the event card by title.
   */
  getEventCard(title: string): Locator {
    return this.eventCards.filter({ hasText: title });
  }

  /**
   * Wait for a new event to appear in the list.
   */
  async waitForEvent(
    title: string,
    options: { timeout?: number } = {}
  ): Promise<void> {
    const timeout = options.timeout || 10000;
    await this.eventCards
      .filter({ hasText: title })
      .waitFor({ state: 'visible', timeout });
  }
}
