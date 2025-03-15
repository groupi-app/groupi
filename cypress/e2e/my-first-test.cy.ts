describe("template spec", () => {
  before(() => {
    cy.task("seedUsers");
  });

  beforeEach(() => {
    cy.task("refreshUser", "testuser1");
  });

  it(
    "Basic test",
    {
      defaultCommandTimeout: 10000,
    },
    () => {
      // Log in
      cy.visit("/", { failOnStatusCode: false });
      cy.get("[data-test='profile-dropdown']").should("not.exist");
      cy.clerkSignIn({
        strategy: "email_code",
        identifier: "testuser1+clerk_test@example.com",
      });
      cy.get("[data-test='profile-dropdown']").should("exist");

      // New Event
      cy.visit("/create");
      cy.get("[data-test='new-event-title']")
        .should("exist")
        .type("Test Event");
      cy.get("[data-test='new-event-description']")
        .should("exist")
        .type("Test Description");
      cy.get("[data-test='new-event-location']")
        .should("exist")
        .type("Test Location");
      cy.get("[data-test='new-event-next-button']").should("exist").click();

      // Datetime
      cy.get("[data-test='single-date-button']").should("exist").click();
      cy.get("[data-test='new-event-single-time']")
        .should("exist")
        .type("16:20");
      cy.get("[data-test='new-event-single-submit']").should("exist").click();

      // Event page
      cy.get("[data-test='event-title']")
        .should("exist")
        .contains("Test Event");
      cy.get("[data-test='event-description']")
        .should("exist")
        .contains("Test Description");
      cy.get("[data-test='event-location']")
        .should("exist")
        .contains("Test Location");
      const date = new Date();
      date.setHours(16, 20, 0, 0);
      cy.get("[data-test='event-datetime']")
        .should("exist")
        .contains(
          date.toLocaleString([], {
            weekday: "long",
            year: "numeric",
            month: "numeric",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
          })
        );

      // New Post
      cy.get("[data-test='new-post-button']").should("exist").click();

      // Error handling
      cy.get("[data-test='post-editor-submit']").should("exist").click();
      cy.get("[data-test='post-editor-title-error']")
        .should("exist")
        .contains("Title is required");
      cy.get("[data-test='post-editor-content-error']")
        .should("exist")
        .contains("Post body is required");

      cy.get("[data-test='post-editor-title']")
        .should("exist")
        .type("A".repeat(101));
      cy.get("[data-test='tiptap-editor']").type("A".repeat(3001), {
        delay: 0,
      });
      cy.get("[data-test='post-editor-submit']").should("exist").click();

      cy.get("[data-test='post-editor-title-error']")
        .should("exist")
        .contains("Your title is too long!");
      cy.get("[data-test='post-editor-content-error']")
        .should("exist")
        .contains("Your post is too long!");

      // Correct input
      cy.get("[data-test='post-editor-title']").clear().type("Test Post Title");
      cy.get("[data-test='tiptap-editor']").clear().type("Test Post Content");

      cy.get("[data-test='post-editor-submit']").should("exist").click();

      // Post page
      cy.get("[data-test='post-card']").should("exist").click();
      cy.get("[data-test='full-post-title']")
        .should("exist")
        .contains("Test Post Title");
      cy.get("[data-test='full-post-content']")
        .should("exist")
        .contains("Test Post Content");
      cy.get("[data-test='full-post-back']").should("exist").click();

      // Log out
      cy.clerkSignOut();
    }
  );
});
