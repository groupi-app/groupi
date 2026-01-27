import { Page, Locator } from '@playwright/test';
import { BasePage } from './base.page';

/**
 * Page object for the invite page.
 *
 * Handles:
 * - Viewing invite details
 * - Accepting invites
 * - Creating invites (on event invite management page)
 */
export class InvitePage extends BasePage {
  // Locators
  readonly eventTitle: Locator;
  readonly eventDescription: Locator;
  readonly acceptButton: Locator;
  readonly declineButton: Locator;
  readonly signInPrompt: Locator;
  readonly alreadyMemberMessage: Locator;
  readonly expiredMessage: Locator;
  readonly invalidMessage: Locator;

  // Invite management locators
  readonly createInviteButton: Locator;
  readonly inviteNameInput: Locator;
  readonly maxUsesInput: Locator;
  readonly inviteLinkDisplay: Locator;
  readonly copyLinkButton: Locator;
  readonly inviteList: Locator;

  constructor(page: Page) {
    super(page);

    // Accept invite page
    this.eventTitle = page.locator('h1, [data-event-title]');
    this.eventDescription = page.locator('[data-event-description]');
    this.acceptButton = page.getByRole('button', { name: /accept|join/i });
    this.declineButton = page.getByRole('button', {
      name: /decline|no thanks/i,
    });
    this.signInPrompt = page.getByText(/sign in|log in|create account/i);
    this.alreadyMemberMessage = page.getByText(
      /already a member|already joined/i
    );
    this.expiredMessage = page.getByText(/expired|no longer valid/i);
    this.invalidMessage = page.getByText(/invalid|not found/i);

    // Invite management page
    this.createInviteButton = page.getByRole('button', {
      name: /create invite|new invite|generate/i,
    });
    this.inviteNameInput = page.getByLabel(/name|label/i);
    this.maxUsesInput = page.getByLabel(/uses|limit/i);
    this.inviteLinkDisplay = page.locator(
      '[data-invite-link], input[readonly]'
    );
    this.copyLinkButton = page.getByRole('button', { name: /copy/i });
    this.inviteList = page.locator('[data-invite-list] > *');
  }

  /**
   * Navigate to an invite acceptance page.
   */
  async gotoInvite(inviteToken: string): Promise<void> {
    await super.goto(`/invite/${inviteToken}`);
    await this.waitForDataLoad();
  }

  /**
   * Navigate to event invite management page.
   */
  async gotoInviteManagement(eventId: string): Promise<void> {
    await super.goto(`/event/${eventId}/invite`);
    await this.waitForDataLoad();
  }

  /**
   * Wait for invite data to load.
   */
  override async waitForDataLoad(
    options: { timeout?: number } = {}
  ): Promise<void> {
    await super.waitForDataLoad(options);

    // Wait for either event title or error message
    const timeout = options.timeout || 10000;
    await Promise.race([
      this.eventTitle.waitFor({ state: 'visible', timeout }).catch(() => {}),
      this.expiredMessage
        .waitFor({ state: 'visible', timeout })
        .catch(() => {}),
      this.invalidMessage
        .waitFor({ state: 'visible', timeout })
        .catch(() => {}),
      this.signInPrompt.waitFor({ state: 'visible', timeout }).catch(() => {}),
    ]);
  }

  /**
   * Get the event title from the invite.
   */
  async getEventTitle(): Promise<string | null> {
    const isVisible = await this.eventTitle.isVisible().catch(() => false);
    if (!isVisible) {
      return null;
    }
    const text = await this.eventTitle.textContent();
    return text?.trim() || null;
  }

  /**
   * Accept the invite.
   */
  async acceptInvite(): Promise<void> {
    await this.acceptButton.click();

    // Wait for redirect to event page
    await this.waitForNavigation(/\/event\//);
  }

  /**
   * Decline the invite.
   */
  async declineInvite(): Promise<void> {
    await this.declineButton.click();

    // Wait for redirect
    await this.waitForNavigation(/\/(events|$)/);
  }

  /**
   * Check if the invite is valid and can be accepted.
   */
  async canAccept(): Promise<boolean> {
    return this.acceptButton.isVisible();
  }

  /**
   * Check if sign-in is required to accept.
   */
  async requiresSignIn(): Promise<boolean> {
    return this.signInPrompt.isVisible();
  }

  /**
   * Check if the invite has expired.
   */
  async isExpired(): Promise<boolean> {
    return this.expiredMessage.isVisible();
  }

  /**
   * Check if the invite is invalid.
   */
  async isInvalid(): Promise<boolean> {
    return this.invalidMessage.isVisible();
  }

  /**
   * Check if user is already a member.
   */
  async isAlreadyMember(): Promise<boolean> {
    return this.alreadyMemberMessage.isVisible();
  }

  // === Invite Management Methods ===

  /**
   * Create a new invite.
   */
  async createInvite(options?: {
    name?: string;
    maxUses?: number;
  }): Promise<string> {
    if (options?.name) {
      await this.inviteNameInput.fill(options.name);
    }

    if (options?.maxUses) {
      await this.maxUsesInput.fill(options.maxUses.toString());
    }

    await this.createInviteButton.click();

    // Wait for invite link to appear
    await this.inviteLinkDisplay.waitFor({ state: 'visible' });

    // Get the invite link
    const link = await this.inviteLinkDisplay.inputValue().catch(() => null);
    if (link) {
      return link;
    }

    const text = await this.inviteLinkDisplay.textContent();
    return text?.trim() || '';
  }

  /**
   * Copy the invite link to clipboard.
   */
  async copyInviteLink(): Promise<void> {
    await this.copyLinkButton.click();

    // Wait for success toast
    await this.waitForToast(/copied/i);
  }

  /**
   * Get the count of existing invites.
   */
  async getInviteCount(): Promise<number> {
    return this.inviteList.count();
  }

  /**
   * Get all invite links displayed on the management page.
   */
  async getInviteLinks(): Promise<string[]> {
    const invites = await this.inviteList.all();
    const links: string[] = [];

    for (const invite of invites) {
      const linkElement = invite.locator('input[readonly], [data-invite-link]');
      const link =
        (await linkElement.inputValue().catch(() => null)) ||
        (await linkElement.textContent());
      if (link) {
        links.push(link.trim());
      }
    }

    return links;
  }
}
