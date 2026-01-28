import { Page, Locator } from '@playwright/test';
import { BasePage } from './base.page';

/**
 * Page object for the create event wizard.
 *
 * Handles:
 * - Event info input (title, description, location)
 * - Date type selection (single vs multi-date)
 * - Date selection
 * - Event creation
 */
export class CreateEventPage extends BasePage {
  // Locators
  readonly titleInput: Locator;
  readonly descriptionInput: Locator;
  readonly locationInput: Locator;
  readonly singleDateOption: Locator;
  readonly multiDateOption: Locator;
  readonly dateInput: Locator;
  readonly timeInput: Locator;
  readonly nextButton: Locator;
  readonly backButton: Locator;
  readonly createButton: Locator;

  constructor(page: Page) {
    super(page);

    // Use data-test attributes for reliable element selection
    this.titleInput = page.getByTestId('new-event-title');
    this.descriptionInput = page.getByTestId('new-event-description');
    this.locationInput = page.getByTestId('new-event-location');
    this.singleDateOption = page.getByTestId('single-date-button');
    this.multiDateOption = page.getByTestId('multi-date-button');
    this.dateInput = page.getByLabel(/date/i);
    this.timeInput = page.getByLabel(/time/i);
    this.nextButton = page.getByTestId('new-event-next-button');
    this.backButton = page.getByRole('button', { name: /back/i });
    this.createButton = page.getByTestId('create-event-button');
  }

  /**
   * Navigate to the create event page.
   */
  async goto(): Promise<void> {
    await super.goto('/create');
    await this.waitForDataLoad();
  }

  /**
   * Check if we're on the create event page.
   */
  async isDisplayed(): Promise<boolean> {
    return this.isOnPath('/create');
  }

  /**
   * Fill in the event info form.
   */
  async fillEventInfo(data: {
    title: string;
    description?: string;
    location?: string;
  }): Promise<void> {
    await this.titleInput.fill(data.title);

    if (data.description) {
      await this.descriptionInput.fill(data.description);
    }

    if (data.location) {
      await this.locationInput.fill(data.location);
    }
  }

  /**
   * Select single date event type.
   */
  async selectSingleDate(): Promise<void> {
    await this.singleDateOption.click();
  }

  /**
   * Select multi-date event type.
   */
  async selectMultiDate(): Promise<void> {
    await this.multiDateOption.click();
  }

  /**
   * Fill in date and time for a single date event.
   */
  async fillDateTime(data: { date: string; time?: string }): Promise<void> {
    // Look for date picker or input
    const dateInputs = this.page.locator(
      'input[type="date"], [data-date-picker]'
    );
    const count = await dateInputs.count();

    if (count > 0) {
      await dateInputs.first().fill(data.date);
    } else {
      // Try clicking on a calendar day
      await this.page.getByText(data.date.split('-')[2]).click();
    }

    if (data.time) {
      const timeInputs = this.page.locator(
        'input[type="time"], [data-time-picker]'
      );
      const timeCount = await timeInputs.count();

      if (timeCount > 0) {
        await timeInputs.first().fill(data.time);
      }
    }
  }

  /**
   * Click the next button to proceed to the next step.
   */
  async clickNext(): Promise<void> {
    await this.nextButton.click();
  }

  /**
   * Click the back button to go to the previous step.
   */
  async clickBack(): Promise<void> {
    await this.backButton.click();
  }

  /**
   * Create the event.
   */
  async createEvent(): Promise<void> {
    await this.createButton.click();

    // Wait for redirect to the new event page
    await this.waitForNavigation(/\/event\//);
  }

  /**
   * Complete the full event creation flow for a single date event.
   */
  async createSingleDateEvent(data: {
    title: string;
    description?: string;
    location?: string;
    date?: string;
    time?: string;
  }): Promise<void> {
    // Fill event info
    await this.fillEventInfo({
      title: data.title,
      description: data.description,
      location: data.location,
    });

    // Select single date
    await this.selectSingleDate();

    // Fill date if provided
    if (data.date) {
      await this.fillDateTime({ date: data.date, time: data.time });
    }

    // Create the event
    await this.createEvent();
  }

  /**
   * Get validation error messages.
   */
  async getValidationErrors(): Promise<string[]> {
    const errorElements = this.page.locator(
      '[data-error], .error-message, [role="alert"], [aria-invalid="true"] ~ span'
    );
    const count = await errorElements.count();
    const errors: string[] = [];

    for (let i = 0; i < count; i++) {
      const text = await errorElements.nth(i).textContent();
      if (text) {
        errors.push(text.trim());
      }
    }

    return errors;
  }

  /**
   * Check if the create button is enabled.
   */
  async isCreateEnabled(): Promise<boolean> {
    return this.createButton.isEnabled();
  }

  /**
   * Get the current step indicator (if present).
   */
  async getCurrentStep(): Promise<number | null> {
    const stepIndicator = this.page.locator(
      '[data-step], [aria-current="step"]'
    );
    const isVisible = await stepIndicator.isVisible().catch(() => false);

    if (!isVisible) {
      return null;
    }

    const text = await stepIndicator.textContent();
    const match = text?.match(/(\d+)/);
    return match ? parseInt(match[1], 10) : null;
  }
}
