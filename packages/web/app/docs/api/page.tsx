const METHOD_STYLES: Record<string, string> = {
  GET: 'bg-green-400/20 text-green-400',
  POST: 'bg-blue-400/20 text-blue-400',
  PATCH: 'bg-amber-400/20 text-amber-400',
  PUT: 'bg-purple-400/20 text-purple-400',
  DELETE: 'bg-red-400/20 text-red-400',
};

function MethodBadge({ method }: { method: string }) {
  return (
    <span
      className={`inline-flex px-2 py-0.5 rounded text-xs font-mono font-bold ${METHOD_STYLES[method] ?? ''}`}
    >
      {method}
    </span>
  );
}

function Endpoint({
  method,
  path,
  summary,
  description,
  body,
  response,
  curl,
}: {
  method: string;
  path: string;
  summary: string;
  description?: React.ReactNode;
  body?: string;
  response?: string;
  curl?: string;
}) {
  return (
    <details className='group rounded-card bg-card border border-border'>
      <summary className='flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-muted/30 transition-colors list-none [&::-webkit-details-marker]:hidden'>
        <svg
          className='size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-90'
          viewBox='0 0 24 24'
          fill='none'
          stroke='currentColor'
          strokeWidth='2'
          strokeLinecap='round'
          strokeLinejoin='round'
        >
          <path d='m9 18 6-6-6-6' />
        </svg>
        <MethodBadge method={method} />
        <code className='font-mono text-sm'>{path}</code>
        <span className='text-sm text-muted-foreground ml-auto hidden sm:inline'>
          {summary}
        </span>
      </summary>
      <div className='px-4 pb-4 pt-1 border-t border-border space-y-3'>
        <p className='text-sm text-muted-foreground'>
          {description || summary}
        </p>
        {body && (
          <div>
            <p className='text-xs font-medium mb-1'>Request Body</p>
            <pre className='bg-bg-sunken rounded-input p-3 text-xs overflow-x-auto'>
              {body}
            </pre>
          </div>
        )}
        {response && (
          <div>
            <p className='text-xs font-medium mb-1'>Response</p>
            <pre className='bg-bg-sunken rounded-input p-3 text-xs overflow-x-auto'>
              {response}
            </pre>
          </div>
        )}
        {curl && (
          <div>
            <p className='text-xs font-medium mb-1'>Example</p>
            <pre className='bg-bg-sunken rounded-input p-3 text-xs overflow-x-auto'>
              {curl}
            </pre>
          </div>
        )}
      </div>
    </details>
  );
}

function Section({
  title,
  id,
  children,
}: {
  title: string;
  id: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className='mb-8 scroll-mt-20'>
      <h2 className='text-lg font-semibold mb-3'>{title}</h2>
      <div className='space-y-2'>{children}</div>
    </section>
  );
}

const NAV_SECTIONS = [
  { id: 'auth', label: 'Authentication' },
  { id: 'events', label: 'Events' },
  { id: 'posts', label: 'Posts' },
  { id: 'replies', label: 'Replies' },
  { id: 'members', label: 'Members' },
  { id: 'availability', label: 'Availability' },
  { id: 'friends', label: 'Friends' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'profile', label: 'Profile' },
  { id: 'invites', label: 'Invites' },
  { id: 'addons', label: 'Add-ons' },
  { id: 'settings', label: 'Settings' },
  { id: 'themes', label: 'Themes' },
  { id: 'muting', label: 'Muting' },
  { id: 'reports', label: 'Reports' },
  { id: 'admin', label: 'Admin' },
  { id: 'responses', label: 'Response Format' },
];

export default function APIReferencePage() {
  return (
    <div className='mx-auto max-w-5xl px-4 py-12 lg:grid lg:grid-cols-[200px_1fr] lg:gap-8'>
      <nav className='hidden lg:block'>
        <div className='sticky top-20 space-y-0.5'>
          <p className='text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2'>
            On this page
          </p>
          {NAV_SECTIONS.map(s => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className='block text-sm text-muted-foreground hover:text-foreground py-1 transition-colors'
            >
              {s.label}
            </a>
          ))}
        </div>
      </nav>
      <div>
        <div className='mb-8'>
          <h1 className='text-2xl font-bold mb-2'>API Reference</h1>
          <p className='text-muted-foreground'>
            The Groupi REST API. All endpoints require an API key via the{' '}
            <code className='text-sm'>x-api-key</code> header.
          </p>
        </div>

        <section id='auth' className='mb-8 scroll-mt-20'>
          <h2 className='text-lg font-semibold mb-3'>Authentication</h2>
          <div className='rounded-card bg-card p-4 text-sm space-y-2'>
            <p>
              Include your API key in the{' '}
              <code className='text-amber-400'>x-api-key</code> header:
            </p>
            <pre className='bg-bg-sunken rounded-input p-3 text-xs overflow-x-auto'>
              {`curl -H "x-api-key: grp_your_key_here" \\
  https://api.groupi.gg/api/v1/events`}
            </pre>
            <p className='text-muted-foreground'>
              Create API keys in your{' '}
              <a
                href='/settings/account'
                className='underline hover:text-foreground'
              >
                account settings
              </a>
              .
            </p>
          </div>
        </section>

        <Section title='Events' id='events'>
          <Endpoint
            method='GET'
            path='/events'
            summary='List events'
            description='Get all events the authenticated user is a member of.'
            response={`[{
  "id": "k170...",
  "title": "Team Offsite",
  "description": "Annual event",
  "location": "Mountain View",
  "chosenDateTime": 1704067200000,
  "memberCount": 12,
  "userRole": "ORGANIZER",
  "userRsvpStatus": "YES"
}]`}
            curl={`curl -H "x-api-key: grp_xxx" \\
  https://api.groupi.gg/api/v1/events`}
          />
          <Endpoint
            method='POST'
            path='/events'
            summary='Create event'
            description={
              <>
                Create a new event. Use{' '}
                <code className='text-xs'>potentialDateTimeOptions</code> for
                explicit ISO dates, or <code className='text-xs'>gdl</code> for
                a Groupi Date Language expression (not both). GDL is parsed
                server-side with no AI dependency — see the{' '}
                <a href='/gdl' className='underline hover:text-foreground'>
                  GDL reference
                </a>{' '}
                for more information. Invalid expressions return{' '}
                <code className='text-xs'>GDL_PARSE_ERROR</code>.
              </>
            }
            body={`{
  "title": "Team Dinner",            // required, 1-200 chars
  "description": "Quarterly meetup",  // optional, max 5000
  "location": "Downtown",            // optional, max 500
  "gdl": "[Tu,Th]@18-20",            // optional GDL expression
  "potentialDateTimeOptions": [{      // optional (mutually exclusive with gdl)
    "start": "2024-02-15T18:00:00Z",
    "end": "2024-02-15T21:00:00Z"
  }],
  "chosenDateTime": "...",            // optional, for single-date events
  "chosenEndDateTime": "...",         // optional
  "reminderOffset": "1_DAY"           // optional
}`}
            response={`{
  "eventId": "k170...",
  "membershipId": "k171..."
}`}
            curl={`curl -X POST -H "x-api-key: grp_xxx" \\
  -H "Content-Type: application/json" \\
  -d '{"title":"Dinner","gdl":"Fr@19"}' \\
  https://api.groupi.gg/api/v1/events`}
          />
          <Endpoint
            method='GET'
            path='/events/{eventId}'
            summary='Get event details'
            description='Get full details of a specific event. Requires membership.'
            response={`{
  "id": "k170...",
  "title": "Team Offsite",
  "description": "...",
  "location": "...",
  "timezone": "America/New_York",
  "chosenDateTime": null,
  "reminderOffset": "1_DAY",
  "creator": {
    "id": "k172...",
    "user": { "name": "Alice", "username": "alice" }
  }
}`}
          />
          <Endpoint
            method='PATCH'
            path='/events/{eventId}'
            summary='Update event'
            description='Update event details. Requires MODERATOR role or higher.'
            body={`{
  "title": "New Title",          // optional
  "description": "Updated",     // optional
  "location": "New Location",   // optional
  "reminderOffset": "2_HOURS"   // optional, null to remove
}`}
          />
          <Endpoint
            method='DELETE'
            path='/events/{eventId}'
            summary='Delete event'
            description='Permanently delete an event and all associated data. Requires ORGANIZER role.'
          />
        </Section>

        <Section title='Posts' id='posts'>
          <Endpoint
            method='GET'
            path='/events/{eventId}/posts'
            summary='List posts'
            description='Get all posts for an event. Requires membership.'
          />
          <Endpoint
            method='POST'
            path='/events/{eventId}/posts'
            summary='Create post'
            description='Create a new post in an event. Requires membership.'
            body={`{
  "title": "Meeting Notes",   // required
  "content": "Discussed..."   // required
}`}
            response={`{ "postId": "k173..." }`}
          />
          <Endpoint
            method='GET'
            path='/posts/{postId}'
            summary='Get post'
            description='Get a post with its replies.'
          />
          <Endpoint
            method='PATCH'
            path='/posts/{postId}'
            summary='Update post'
            description='Update a post. Requires author or MODERATOR role.'
            body={`{ "title": "...", "content": "..." }`}
          />
          <Endpoint
            method='DELETE'
            path='/posts/{postId}'
            summary='Delete post'
            description='Delete a post and its replies. Requires author or MODERATOR role.'
          />
        </Section>

        <Section title='Replies' id='replies'>
          <Endpoint
            method='GET'
            path='/posts/{postId}/replies'
            summary='List replies'
          />
          <Endpoint
            method='POST'
            path='/posts/{postId}/replies'
            summary='Create reply'
            body={`{ "text": "Sounds good!" }`}
          />
          <Endpoint
            method='PATCH'
            path='/replies/{replyId}'
            summary='Update reply'
            body={`{ "text": "Updated text" }`}
          />
          <Endpoint
            method='DELETE'
            path='/replies/{replyId}'
            summary='Delete reply'
          />
        </Section>

        <Section title='Members' id='members'>
          <Endpoint
            method='GET'
            path='/events/{eventId}/members'
            summary='List members'
            description='Get all members of an event with their roles and RSVP status.'
            response={`[{
  "id": "k174...",
  "role": "ATTENDEE",
  "rsvpStatus": "YES",
  "person": { "id": "...", "userId": "..." },
  "user": { "name": "Bob", "username": "bob" }
}]`}
          />
          <Endpoint
            method='PATCH'
            path='/events/{eventId}/members/{memberId}'
            summary='Update member role'
            description="Change a member's role. Requires MODERATOR or higher."
            body={`{ "role": "MODERATOR" }  // ORGANIZER, MODERATOR, or ATTENDEE`}
          />
          <Endpoint
            method='DELETE'
            path='/events/{eventId}/members/{memberId}'
            summary='Remove member'
            description='Remove a member from the event. Requires MODERATOR or higher.'
          />
          <Endpoint
            method='POST'
            path='/events/{eventId}/leave'
            summary='Leave event'
            description='Remove yourself from an event. Cannot leave as the last organizer.'
          />
        </Section>

        <Section title='Availability' id='availability'>
          <Endpoint
            method='GET'
            path='/events/{eventId}/availability'
            summary='Get availability grid'
            description="Get the full availability voting grid showing all members' votes on all potential dates."
          />
          <Endpoint
            method='POST'
            path='/events/{eventId}/availability'
            summary='Submit availability'
            description='Submit or update your availability votes for potential dates.'
            body={`{
  "votes": [
    { "potentialDateTimeId": "k175...", "status": "YES" },
    { "potentialDateTimeId": "k176...", "status": "MAYBE" },
    { "potentialDateTimeId": "k177...", "status": "NO" }
  ]
}`}
          />
          <Endpoint
            method='GET'
            path='/events/{eventId}/potential-dates'
            summary='Get potential dates'
            description='Get the list of potential date/time options for an event.'
          />
        </Section>

        <Section title='Friends' id='friends'>
          <Endpoint method='GET' path='/friends' summary='List friends' />
          <Endpoint
            method='GET'
            path='/friends/requests/incoming'
            summary='Incoming friend requests'
          />
          <Endpoint
            method='GET'
            path='/friends/requests/outgoing'
            summary='Outgoing friend requests'
          />
          <Endpoint
            method='GET'
            path='/friends/search?q={query}'
            summary='Search users'
            description='Search for users by name or username.'
          />
          <Endpoint
            method='GET'
            path='/friends/status/{targetPersonId}'
            summary='Get friendship status'
          />
        </Section>

        <Section title='Notifications' id='notifications'>
          <Endpoint
            method='GET'
            path='/notifications'
            summary='List notifications'
            description='Get notifications. Add ?unread=true to filter.'
          />
          <Endpoint
            method='GET'
            path='/notifications/count'
            summary='Get unread count'
            response={`{ "count": 5 }`}
          />
          <Endpoint
            method='POST'
            path='/notifications/{notificationId}/read'
            summary='Mark as read'
          />
          <Endpoint
            method='POST'
            path='/notifications/read-all'
            summary='Mark all as read'
          />
        </Section>

        <Section title='Profile' id='profile'>
          <Endpoint method='GET' path='/profile' summary='Get your profile' />
          <Endpoint
            method='GET'
            path='/profile/{username}'
            summary='Get profile by username'
          />
          <Endpoint
            method='PUT'
            path='/profile'
            summary='Update profile'
            body={`{ "bio": "Hello!", "pronouns": "they/them" }`}
          />
        </Section>

        <Section title='Invites' id='invites'>
          <Endpoint
            method='GET'
            path='/events/{eventId}/invites'
            summary='List event invites'
          />
          <Endpoint
            method='POST'
            path='/events/{eventId}/invites'
            summary='Create invite link'
            response={`{ "id": "...", "token": "abc123" }`}
          />
          <Endpoint
            method='DELETE'
            path='/invites/{inviteId}'
            summary='Delete invite'
          />
          <Endpoint
            method='POST'
            path='/invites/{token}/accept'
            summary='Accept invite'
          />
        </Section>

        <Section title='Add-ons' id='addons'>
          <Endpoint
            method='GET'
            path='/events/{eventId}/addons'
            summary='List add-on configs'
          />
          <Endpoint
            method='POST'
            path='/events/{eventId}/addons/{addonType}/enable'
            summary='Enable add-on'
            description='Enable an add-on for an event. Requires MODERATOR or higher.'
            body={`{ "config": { ... } }  // addon-specific config`}
          />
          <Endpoint
            method='POST'
            path='/events/{eventId}/addons/{addonType}/disable'
            summary='Disable add-on'
          />
          <Endpoint
            method='PATCH'
            path='/events/{eventId}/addons/{addonType}/config'
            summary='Update add-on config'
            body={`{ "config": { ... } }`}
          />
        </Section>

        <Section title='Settings' id='settings'>
          <Endpoint
            method='GET'
            path='/settings/privacy'
            summary='Get privacy settings'
          />
          <Endpoint
            method='PUT'
            path='/settings/privacy'
            summary='Update privacy settings'
          />
          <Endpoint
            method='GET'
            path='/settings/notifications'
            summary='Get notification preferences'
          />
        </Section>

        <Section title='Themes' id='themes'>
          <Endpoint method='GET' path='/themes' summary='List custom themes' />
          <Endpoint
            method='GET'
            path='/themes/preferences'
            summary='Get theme preferences'
          />
          <Endpoint
            method='POST'
            path='/themes'
            summary='Create custom theme'
          />
          <Endpoint
            method='PUT'
            path='/themes/{themeId}'
            summary='Update theme'
          />
          <Endpoint
            method='DELETE'
            path='/themes/{themeId}'
            summary='Delete theme'
          />
        </Section>

        <Section title='Muting' id='muting'>
          <Endpoint
            method='GET'
            path='/muting'
            summary='List muted items'
            description='List muted events and posts. Filter with ?type=events or ?type=posts.'
          />
          <Endpoint
            method='POST'
            path='/muting/events/{eventId}'
            summary='Mute event'
          />
          <Endpoint
            method='DELETE'
            path='/muting/events/{eventId}'
            summary='Unmute event'
          />
          <Endpoint
            method='POST'
            path='/muting/posts/{postId}'
            summary='Mute post'
          />
          <Endpoint
            method='DELETE'
            path='/muting/posts/{postId}'
            summary='Unmute post'
          />
        </Section>

        <Section title='Reports' id='reports'>
          <Endpoint
            method='POST'
            path='/reports'
            summary='Report content'
            description='Report a post, reply, or user for review.'
            body={`{
  "targetType": "post",        // "post", "reply", or "user"
  "targetId": "k178...",
  "reason": "Spam or abuse"
}`}
          />
        </Section>

        <Section title='Admin' id='admin'>
          <Endpoint
            method='GET'
            path='/admin/users'
            summary='List all users'
            description='Admin only.'
          />
          <Endpoint
            method='DELETE'
            path='/admin/users/{userId}'
            summary='Delete user'
            description='Admin only. Deletes user and associated data.'
          />
          <Endpoint
            method='PUT'
            path='/admin/users/{userId}/role'
            summary='Set user role'
            description='Admin only.'
          />
          <Endpoint
            method='GET'
            path='/admin/events'
            summary='List all events'
            description='Admin only.'
          />
        </Section>

        <section id='responses' className='mb-8 scroll-mt-20'>
          <h2 className='text-lg font-semibold mb-3'>Response Format</h2>
          <div className='rounded-card bg-card p-4 text-sm space-y-3'>
            <div>
              <p className='font-medium mb-1'>Success</p>
              <p className='text-muted-foreground text-xs mb-1'>
                Data is returned directly — no envelope. HTTP status code
                indicates success (200, 201, 204).
              </p>
              <pre className='bg-bg-sunken rounded-input p-3 text-xs'>
                {`// GET /events/{eventId} → 200
{ "id": "k170...", "title": "Team Offsite", ... }

// DELETE /events/{eventId} → 204 No Content`}
              </pre>
            </div>
            <div>
              <p className='font-medium mb-1'>Error</p>
              <pre className='bg-bg-sunken rounded-input p-3 text-xs'>
                {`{
  "error": {
    "code": "NOT_FOUND",
    "message": "Event not found"
  }
}`}
              </pre>
            </div>
            <div>
              <p className='font-medium mb-1'>Common Error Codes</p>
              <div className='grid grid-cols-2 gap-1 text-xs mt-2'>
                <code className='text-red-400'>UNAUTHORIZED</code>
                <span className='text-muted-foreground'>
                  Missing or invalid API key
                </span>
                <code className='text-red-400'>FORBIDDEN</code>
                <span className='text-muted-foreground'>
                  Insufficient permissions
                </span>
                <code className='text-red-400'>NOT_FOUND</code>
                <span className='text-muted-foreground'>
                  Resource does not exist
                </span>
                <code className='text-red-400'>VALIDATION_ERROR</code>
                <span className='text-muted-foreground'>
                  Invalid request body
                </span>
                <code className='text-red-400'>GDL_PARSE_ERROR</code>
                <span className='text-muted-foreground'>
                  Invalid GDL expression
                </span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
