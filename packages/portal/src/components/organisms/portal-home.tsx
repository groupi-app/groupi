'use client';
export function PortalHome() {
  return (
    <section className='landing'>
      <p className='eyebrow'>Groupi developers</p>
      <h1 tabIndex={-1}>Build with Groupi.</h1>
      <p>
        Create Events, build private widgets and connect your tools. Start with
        a simulated example, then run it locally with your own account.
      </p>
      <div className='journeys'>
        <a href='/v2/integrator' aria-label='Create your first Event'>
          Create your first Event
          <small>
            Try an editable simulation, then create one Event locally.
          </small>
        </a>
        <a href='/v2/reference/api' aria-label='Explore the API reference'>
          Explore the API reference
          <small>Find exact operations, request schemas and responses.</small>
        </a>
      </div>
      <div className='route-cards'>
        <a href='/v2/introduction'>
          Introduction<span>Choose a task and an account boundary</span>
        </a>
        <a href='/v2/event-widget' aria-label='Build a private Event widget'>
          Build a private Event widget
          <span>
            Read and display an Event with useful loading and error states
          </span>
        </a>
        <a href='/v2/agents' aria-label='Build with an agent'>
          Build with an agent
          <span>Direct Markdown guides for your integration</span>
        </a>
        <a href='/v2/group-events'>
          Group Events<span>Read Events your account may access</span>
        </a>
        <a href='/v2/event-updates'>
          Update an Event<span>Check authority before a deliberate change</span>
        </a>
        <a href='/v2/connect-users'>
          Connect another user<span>Delegated access and consent</span>
        </a>
        <a href='/cli/0.1.0/guide'>
          Automate with the CLI
          <span>Profiles, structured output and replay recovery</span>
        </a>
        <a href='/v2/addons'>
          Author an add-on<span>Source handlers and reusable templates</span>
        </a>
        <a href='/v2/self-hosting'>
          Own-instance roadmap
          <span>Proposed · no supported install quickstart</span>
        </a>
        <a href='/v2/concepts'>
          Learn the concepts
          <span>Roles, Groups, invite lists and event audiences</span>
        </a>
        <a href='/v2/sdks'>
          SDK availability
          <span>TypeScript and Python · upcoming source candidates</span>
        </a>
        <a href='/v2/auth'>
          Authorization availability
          <span>Bounded credentials and delegated sign-in</span>
        </a>
        <a href='/v2/versions'>
          Versions and status
          <span>Current, upcoming and proposed capabilities</span>
        </a>
      </div>
    </section>
  );
}
