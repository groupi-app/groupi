# CLI 0.1.0 command reference

cli-0.1.0 · Current · Source: packages/cli/docs/command-reference.json

Source availability does not establish hosted deployment or registry publication.

## groupi
Canonical passage: /cli/0.1.0/reference#groupi

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi [options] [command]

Groupi event planning

Options:
  -V, --version      output the version number
  --profile <name>   Named connection profile (default: "default")
  --api-key-stdin    Read one temporary API key from stdin (overrides environment)
  --non-interactive  Never open the terminal interface
  --format <format>  Output format (choices: "human", "json", default: "human")
  -h, --help         display help for command

Commands:
  tui                Open the keyboard-driven terminal interface
  auth               Manage authentication
  profile            Manage connection profiles
  events             Browse and manage your events
  discord            Discover authorized Discord servers using your linked account
  addons             Configure, use and author event add-ons
  friends            Manage friendships and friend requests
  blocks             Manage blocked users
  groups             Manage formal Group communities independently of events
  group-invites      Inspect and respond to your private Group invitations
  account            Read/update your account and open explicit browser exceptions
  settings           Manage ordinary preferences without a browser
  posts              Read/write safe discussion content; use explicit HTML files to preserve rich
                     formatting on edits
  replies            Read/write safe discussion content; use explicit HTML files to preserve rich
                     formatting on edits
  invites            Manage bearer link/email and recipient-bound username invitations
  invite-lists       Create and inspect private saved selections of existing people
  notifications      Read and clear your notifications
```

## groupi tui
Canonical passage: /cli/0.1.0/reference#groupi-tui

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi tui [options]

Open the keyboard-driven terminal interface

Options:
  -h, --help  display help for command
```

## groupi auth
Canonical passage: /cli/0.1.0/reference#groupi-auth

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi auth [options] [command]

Manage authentication

Options:
  -h, --help        display help for command

Commands:
  login [options]   Explicitly authorize this profile in your browser
  status            Verify the selected profile and account without revealing credentials
  logout [options]  Remove this profile’s saved credential; temporary keys are unchanged
  help [command]    display help for command
```

## groupi auth login
Canonical passage: /cli/0.1.0/reference#groupi-auth-login

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi auth login [options]

Explicitly authorize this profile in your browser

Options:
  --no-browser         Show the authorization URL for manual opening
  --timeout <seconds>  Authorization timeout (10–300 seconds) (default: "300")
  --web-url <origin>   Explicit authorization website for this login
  -h, --help           display help for command
```

## groupi auth status
Canonical passage: /cli/0.1.0/reference#groupi-auth-status

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi auth status [options]

Verify the selected profile and account without revealing credentials

Options:
  -h, --help  display help for command
```

## groupi auth logout
Canonical passage: /cli/0.1.0/reference#groupi-auth-logout

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi auth logout [options]

Remove this profile’s saved credential; temporary keys are unchanged

Options:
  --revoke    Also revoke this saved key on the server before removing it
  -h, --help  display help for command
```

## groupi profile
Canonical passage: /cli/0.1.0/reference#groupi-profile

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi profile [options] [command]

Manage connection profiles

Options:
  -h, --help            display help for command

Commands:
  add [options] <name>
  help [command]        display help for command
```

## groupi profile add
Canonical passage: /cli/0.1.0/reference#groupi-profile-add

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi profile add [options] <name>

Options:
  --api-url <url>  REST v2 API URL
  --web-url <url>  Authorization website origin for browser login
  -h, --help       display help for command
```

## groupi events
Canonical passage: /cli/0.1.0/reference#groupi-events

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi events [options] [command]

Browse and manage your events

Options:
  -h, --help                                     display help for command

Commands:
  create [options]                               Create an event with replay-safe request
                                                 identification
  edit [options] <event-id>                      Edit event details; uncertain writes are never
                                                 retried automatically
  list [options]
  get <event-id>                                 Read one accessible event
  audiences <event-id>                           Read only currently visible Group audiences and
                                                 authorized Friends state
  share-group <event-id> <group-id>              Share logistics with a whole Group; requires
                                                 Organizer and Group permission
  unshare-group [options] <event-id> <group-id>  Withdraw one Group grant, preserving all
                                                 independent grants
  friends-audience [options] <event-id>          Set independent Friends audience as Organizer;
                                                 Public basic details stay public
  mute <event-id>                                Mute event notifications
  unmute <event-id>                              Unmute event notifications
  mute-status <event-id>                         Inspect event notifications
  rsvp                                           Read and update your own attendance response
  availability                                   Provide your availability and inspect permitted
                                                 responses
  dates                                          Inspect proposed dates and manage the chosen date
  members [options] <event-id>                   List attendance when event permissions allow
  cover                                          Inspect, replace, or remove cover images from local
                                                 files
  transfer                                       Consensual Event ownership; Friends audience
                                                 follows accepted new Organizer
  applications                                   Configure, submit, or review private Event
                                                 applications
  preview <event-id>                             Read safe event logistics and entry action without
                                                 joining
  discover [options]                             Browse upcoming or undated Friends and Group Events
  join <event-id>                                Join as an Attendee with Pending RSVP; confirm
                                                 attendance separately
  leave [options] <event-id>                     leave an event
  delete [options] <event-id>                    delete an event
  membership                                     Manage event member roles and removal; inspect
                                                 using events members
  settings                                       Inspect and update event visibility, admission and
                                                 supported permissions
  help [command]                                 display help for command
```

## groupi events create
Canonical passage: /cli/0.1.0/reference#groupi-events-create

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi events create [options]

Create an event with replay-safe request identification

Options:
  --title <title>        Event title
  --description <text>   Event description
  --location <text>      Event location
  --start <iso>          Fixed start with explicit UTC offset or Z
  --end <iso>            Fixed end with explicit UTC offset or Z
  --date-options <json>  Proposed dates as [{start,end?,note?}] with explicit offsets
  --request-id <id>      Reuse the identifier from a previous attempt with the same inputs
  -h, --help             display help for command
```

## groupi events edit
Canonical passage: /cli/0.1.0/reference#groupi-events-edit

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi events edit [options] <event-id>

Edit event details; uncertain writes are never retried automatically

Options:
  --title <title>        New event title
  --description <text>   New description; empty string clears it
  --location <text>      New location; empty string clears it
  --date-options <json>  Replace proposed dates and clear availability; requires confirmation
  --yes                  Confirm replacing proposed dates and clearing availability
  -h, --help             display help for command
```

## groupi events list
Canonical passage: /cli/0.1.0/reference#groupi-events-list

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi events list [options]

Options:
  --limit <number>   Page size (1–100) (default: "20")
  --cursor <cursor>  Continue a previous page
  --all              Explicitly retrieve every page
  -h, --help         display help for command
```

## groupi events get
Canonical passage: /cli/0.1.0/reference#groupi-events-get

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi events get [options] <event-id>

Read one accessible event

Options:
  -h, --help  display help for command
```

## groupi events audiences
Canonical passage: /cli/0.1.0/reference#groupi-events-audiences

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi events audiences [options] <event-id>

Read only currently visible Group audiences and authorized Friends state

Options:
  -h, --help  display help for command
```

## groupi events share-group
Canonical passage: /cli/0.1.0/reference#groupi-events-share-group

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi events share-group [options] <event-id> <group-id>

Share logistics with a whole Group; requires Organizer and Group permission

Options:
  -h, --help  display help for command
```

## groupi events unshare-group
Canonical passage: /cli/0.1.0/reference#groupi-events-unshare-group

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi events unshare-group [options] <event-id> <group-id>

Withdraw one Group grant, preserving all independent grants

Options:
  --yes       Confirm withdrawal
  -h, --help  display help for command
```

## groupi events friends-audience
Canonical passage: /cli/0.1.0/reference#groupi-events-friends-audience

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi events friends-audience [options] <event-id>

Set independent Friends audience as Organizer; Public basic details stay public

Options:
  --enabled <boolean>  true or false
  -h, --help           display help for command
```

## groupi events mute
Canonical passage: /cli/0.1.0/reference#groupi-events-mute

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi events mute [options] <event-id>

Mute event notifications

Options:
  -h, --help  display help for command
```

## groupi events unmute
Canonical passage: /cli/0.1.0/reference#groupi-events-unmute

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi events unmute [options] <event-id>

Unmute event notifications

Options:
  -h, --help  display help for command
```

## groupi events mute-status
Canonical passage: /cli/0.1.0/reference#groupi-events-mute-status

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi events mute-status [options] <event-id>

Inspect event notifications

Options:
  -h, --help  display help for command
```

## groupi events rsvp
Canonical passage: /cli/0.1.0/reference#groupi-events-rsvp

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi events rsvp [options] [command]

Read and update your own attendance response

Options:
  -h, --help                display help for command

Commands:
  get <event-id>
  set [options] <event-id>
  help [command]            display help for command
```

## groupi events rsvp get
Canonical passage: /cli/0.1.0/reference#groupi-events-rsvp-get

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi events rsvp get [options] <event-id>

Options:
  -h, --help  display help for command
```

## groupi events rsvp set
Canonical passage: /cli/0.1.0/reference#groupi-events-rsvp-set

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi events rsvp set [options] <event-id>

Options:
  --status <status>  RSVP response (choices: "YES", "MAYBE", "NO", "PENDING")
  --note <text>      Note (up to 200 characters); omitted or empty clears it
  -h, --help         display help for command
```

## groupi events availability
Canonical passage: /cli/0.1.0/reference#groupi-events-availability

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi events availability [options] [command]

Provide your availability and inspect permitted responses

Options:
  -h, --help                      display help for command

Commands:
  set [options] <event-id>
  clear [options] <event-id>      Remove your availability responses and notes; RSVP is unchanged
  get [options] <event-id>        List proposed dates with your own responses
  responses [options] <event-id>  List member responses for one proposed date when permitted
  help [command]                  display help for command
```

## groupi events availability set
Canonical passage: /cli/0.1.0/reference#groupi-events-availability-set

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi events availability set [options] <event-id>

Options:
  --responses <json>  Array of {potentialDateTimeId,status:YES|MAYBE|NO,note?}
  -h, --help          display help for command
```

## groupi events availability clear
Canonical passage: /cli/0.1.0/reference#groupi-events-availability-clear

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi events availability clear [options] <event-id>

Remove your availability responses and notes; RSVP is unchanged

Options:
  --yes       Confirm clearing your responses
  -h, --help  display help for command
```

## groupi events availability get
Canonical passage: /cli/0.1.0/reference#groupi-events-availability-get

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi events availability get [options] <event-id>

List proposed dates with your own responses

Options:
  --limit <number>   Page size (1–100) (default: "20")
  --cursor <cursor>  Continue a prior page
  --all              Explicitly retrieve every page
  -h, --help         display help for command
```

## groupi events availability responses
Canonical passage: /cli/0.1.0/reference#groupi-events-availability-responses

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi events availability responses [options] <event-id>

List member responses for one proposed date when permitted

Options:
  --option <id>      Proposed date ID
  --limit <number>   Page size (1–100) (default: "20")
  --cursor <cursor>  Continue a prior page
  --all              Explicitly retrieve every page
  -h, --help         display help for command
```

## groupi events dates
Canonical passage: /cli/0.1.0/reference#groupi-events-dates

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi events dates [options] [command]

Inspect proposed dates and manage the chosen date

Options:
  -h, --help                   display help for command

Commands:
  choose [options] <event-id>  Choose a proposed poll date or manually set a future date (organizer
                               only)
  reset [options] <event-id>   Clear the chosen date while preserving responses (organizer only)
  list [options] <event-id>    List proposed dates and their notes
  help [command]               display help for command
```

## groupi events dates choose
Canonical passage: /cli/0.1.0/reference#groupi-events-dates-choose

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi events dates choose [options] <event-id>

Choose a proposed poll date or manually set a future date (organizer only)

Options:
  --option <id>  Proposed date ID from dates list
  --start <iso>  Manual start with explicit offset or Z
  --end <iso>    Optional manual end with explicit offset or Z
  --yes          Confirm choosing the event date and applying its response transitions
  -h, --help     display help for command
```

## groupi events dates reset
Canonical passage: /cli/0.1.0/reference#groupi-events-dates-reset

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi events dates reset [options] <event-id>

Clear the chosen date while preserving responses (organizer only)

Options:
  --yes       Confirm clearing the chosen date
  -h, --help  display help for command
```

## groupi events dates list
Canonical passage: /cli/0.1.0/reference#groupi-events-dates-list

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi events dates list [options] <event-id>

List proposed dates and their notes

Options:
  --limit <number>   Page size (1–100) (default: "20")
  --cursor <cursor>  Continue a prior page
  --all              Explicitly retrieve every page
  -h, --help         display help for command
```

## groupi events members
Canonical passage: /cli/0.1.0/reference#groupi-events-members

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi events members [options] <event-id>

List attendance when event permissions allow

Options:
  --limit <number>   Page size (1–100) (default: "20")
  --cursor <cursor>  Continue a prior page
  --all              Explicitly retrieve every page
  -h, --help         display help for command
```

## groupi events cover
Canonical passage: /cli/0.1.0/reference#groupi-events-cover

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi events cover [options] [command]

Inspect, replace, or remove cover images from local files

Options:
  -h, --help                   display help for command

Commands:
  get <event-id>
  set [options] <event-id>
  remove [options] <event-id>
  help [command]               display help for command
```

## groupi events cover get
Canonical passage: /cli/0.1.0/reference#groupi-events-cover-get

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi events cover get [options] <event-id>

Options:
  -h, --help  display help for command
```

## groupi events cover set
Canonical passage: /cli/0.1.0/reference#groupi-events-cover-set

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi events cover set [options] <event-id>

Options:
  --file <path>       Local JPEG, PNG, GIF, WebP, or SVG image, at most 10 MiB
  --focal-x <number>  Horizontal focal point (0–1)
  --focal-y <number>  Vertical focal point (0–1)
  -h, --help          display help for command
```

## groupi events cover remove
Canonical passage: /cli/0.1.0/reference#groupi-events-cover-remove

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi events cover remove [options] <event-id>

Options:
  --yes       Confirm removing this image
  -h, --help  display help for command
```

## groupi events transfer
Canonical passage: /cli/0.1.0/reference#groupi-events-transfer

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi events transfer [options] [command]

Consensual Event ownership; Friends audience follows accepted new Organizer

Options:
  -h, --help                                  display help for command

Commands:
  status <event-id>                           Inspect pending/resolved ownership
  offer [options] <event-id> <recipient-id>   offer the named ownership offer
  accept [options] <event-id> <transfer-id>   accept the named ownership offer
  decline [options] <event-id> <transfer-id>  decline the named ownership offer
  cancel [options] <event-id> <transfer-id>   cancel the named ownership offer
  help [command]                              display help for command
```

## groupi events transfer status
Canonical passage: /cli/0.1.0/reference#groupi-events-transfer-status

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi events transfer status [options] <event-id>

Inspect pending/resolved ownership

Options:
  -h, --help  display help for command
```

## groupi events transfer offer
Canonical passage: /cli/0.1.0/reference#groupi-events-transfer-offer

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi events transfer offer [options] <event-id> <recipient-id>

offer the named ownership offer

Options:
  --yes       Confirm ownership action and Friends audience consequence
  -h, --help  display help for command
```

## groupi events transfer accept
Canonical passage: /cli/0.1.0/reference#groupi-events-transfer-accept

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi events transfer accept [options] <event-id> <transfer-id>

accept the named ownership offer

Options:
  --yes       Confirm ownership action and Friends audience consequence
  -h, --help  display help for command
```

## groupi events transfer decline
Canonical passage: /cli/0.1.0/reference#groupi-events-transfer-decline

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi events transfer decline [options] <event-id> <transfer-id>

decline the named ownership offer

Options:
  --yes       Confirm ownership action and Friends audience consequence
  -h, --help  display help for command
```

## groupi events transfer cancel
Canonical passage: /cli/0.1.0/reference#groupi-events-transfer-cancel

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi events transfer cancel [options] <event-id> <transfer-id>

cancel the named ownership offer

Options:
  --yes       Confirm ownership action and Friends audience consequence
  -h, --help  display help for command
```

## groupi events applications
Canonical passage: /cli/0.1.0/reference#groupi-events-applications

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi events applications [options] [command]

Configure, submit, or review private Event applications

Options:
  -h, --help                          display help for command

Commands:
  form <event-id>                     Read permitted current settings (null after audience loss),
                                      your pending request, and action flags
  history [options] <event-id>        Read your private history
  list [options] <event-id>           Read current authorized reviewer queue and history
  configure [options] <event-id>      Set core admission form without changing add-ons or admission
                                      policy
  submit [options] <event-id>
  withdraw <application-id>
  approve [options] <application-id>  Admit immediately as Attendee/Pending, with no second
                                      acceptance
  decline [options] <application-id>  Decline this application; eligible people can reapply
  help [command]                      display help for command
```

## groupi events applications form
Canonical passage: /cli/0.1.0/reference#groupi-events-applications-form

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi events applications form [options] <event-id>

Read permitted current settings (null after audience loss), your pending request, and action flags

Options:
  -h, --help  display help for command
```

## groupi events applications history
Canonical passage: /cli/0.1.0/reference#groupi-events-applications-history

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi events applications history [options] <event-id>

Read your private history

Options:
  --limit <number>   Page size (1–100) (default: "20")
  --cursor <cursor>  Continue page
  -h, --help         display help for command
```

## groupi events applications list
Canonical passage: /cli/0.1.0/reference#groupi-events-applications-list

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi events applications list [options] <event-id>

Read current authorized reviewer queue and history

Options:
  --limit <number>   Page size (1–100) (default: "20")
  --cursor <cursor>  Continue page
  -h, --help         display help for command
```

## groupi events applications configure
Canonical passage: /cli/0.1.0/reference#groupi-events-applications-configure

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi events applications configure [options] <event-id>

Set core admission form without changing add-ons or admission policy

Options:
  --questions <json>          Question array; [] means no questions
  --reviewer-policy <policy>  ORGANIZERS_AND_MODERATORS or ORGANIZER_ONLY (default:
                              "ORGANIZERS_AND_MODERATORS")
  -h, --help                  display help for command
```

## groupi events applications submit
Canonical passage: /cli/0.1.0/reference#groupi-events-applications-submit

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi events applications submit [options] <event-id>

Options:
  --answers <json>  Answers object; pending submissions edit retained questions
  -h, --help        display help for command
```

## groupi events applications withdraw
Canonical passage: /cli/0.1.0/reference#groupi-events-applications-withdraw

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi events applications withdraw [options] <application-id>

Options:
  -h, --help  display help for command
```

## groupi events applications approve
Canonical passage: /cli/0.1.0/reference#groupi-events-applications-approve

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi events applications approve [options] <application-id>

Admit immediately as Attendee/Pending, with no second acceptance

Options:
  --reason <reason>  Private decision reason
  -h, --help         display help for command
```

## groupi events applications decline
Canonical passage: /cli/0.1.0/reference#groupi-events-applications-decline

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi events applications decline [options] <application-id>

Decline this application; eligible people can reapply

Options:
  --reason <reason>  Private decision reason
  -h, --help         display help for command
```

## groupi events preview
Canonical passage: /cli/0.1.0/reference#groupi-events-preview

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi events preview [options] <event-id>

Read safe event logistics and entry action without joining

Options:
  -h, --help  display help for command
```

## groupi events discover
Canonical passage: /cli/0.1.0/reference#groupi-events-discover

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi events discover [options]

Browse upcoming or undated Friends and Group Events

Options:
  --limit <number>   Page size (1–100) (default: "20")
  --cursor <cursor>  Continue a previous page
  --all              Retrieve every page explicitly
  -h, --help         display help for command
```

## groupi events join
Canonical passage: /cli/0.1.0/reference#groupi-events-join

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi events join [options] <event-id>

Join as an Attendee with Pending RSVP; confirm attendance separately

Options:
  -h, --help  display help for command
```

## groupi events leave
Canonical passage: /cli/0.1.0/reference#groupi-events-leave

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi events leave [options] <event-id>

leave an event

Options:
  --yes       Confirm leave for the named event
  -h, --help  display help for command
```

## groupi events delete
Canonical passage: /cli/0.1.0/reference#groupi-events-delete

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi events delete [options] <event-id>

delete an event

Options:
  --yes       Confirm delete for the named event
  -h, --help  display help for command
```

## groupi events membership
Canonical passage: /cli/0.1.0/reference#groupi-events-membership

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi events membership [options] [command]

Manage event member roles and removal; inspect using events members

Options:
  -h, --help                               display help for command

Commands:
  role [options] <event-id> <member-id>
  remove [options] <event-id> <member-id>
  help [command]                           display help for command
```

## groupi events membership role
Canonical passage: /cli/0.1.0/reference#groupi-events-membership-role

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi events membership role [options] <event-id> <member-id>

Options:
  --role <role>  New event role (choices: "MODERATOR", "ATTENDEE")
  --yes          Confirm role change for the named member
  -h, --help     display help for command
```

## groupi events membership remove
Canonical passage: /cli/0.1.0/reference#groupi-events-membership-remove

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi events membership remove [options] <event-id> <member-id>

Options:
  --yes       Confirm removal of the named member
  -h, --help  display help for command
```

## groupi events settings
Canonical passage: /cli/0.1.0/reference#groupi-events-settings

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi events settings [options] [command]

Inspect and update event visibility, admission and supported permissions

Options:
  -h, --help                display help for command

Commands:
  get <event-id>
  set [options] <event-id>
  help [command]            display help for command
```

## groupi events settings get
Canonical passage: /cli/0.1.0/reference#groupi-events-settings-get

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi events settings get [options] <event-id>

Options:
  -h, --help  display help for command
```

## groupi events settings set
Canonical passage: /cli/0.1.0/reference#groupi-events-settings-set

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi events settings set [options] <event-id>

Options:
  --visibility <visibility>     Event visibility (choices: "PRIVATE", "FRIENDS", "PUBLIC")
  --admission-policy <policy>   Entry policy, independent of visibility (choices: "INVITATION_ONLY",
                                "DIRECT", "APPLY")
  --create-posts <level>        create-posts permission (choices: "EVERYONE", "MODERATOR",
                                "ORGANIZER")
  --invite-members <level>      invite-members permission (choices: "EVERYONE", "MODERATOR",
                                "ORGANIZER")
  --view-attendee-list <level>  view-attendee-list permission (choices: "EVERYONE", "MODERATOR",
                                "ORGANIZER")
  -h, --help                    display help for command
```

## groupi discord
Canonical passage: /cli/0.1.0/reference#groupi-discord

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi discord [options] [command]

Discover authorized Discord servers using your linked account

Options:
  -h, --help      display help for command

Commands:
  guilds          Inspect and refresh guild eligibility; linking requires the app browser flow
  help [command]  display help for command
```

## groupi discord guilds
Canonical passage: /cli/0.1.0/reference#groupi-discord-guilds

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi discord guilds [options] [command]

Inspect and refresh guild eligibility; linking requires the app browser flow

Options:
  -h, --help      display help for command

Commands:
  list [options]  List cached available/invitable servers; expiresAt marks freshness
  refresh         Refresh your authorization cache from Discord (no event changes, no automatic
                  retries)
  help [command]  display help for command
```

## groupi discord guilds list
Canonical passage: /cli/0.1.0/reference#groupi-discord-guilds-list

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi discord guilds list [options]

List cached available/invitable servers; expiresAt marks freshness

Options:
  --limit <number>   Page size (1–100) (default: "20")
  --cursor <cursor>  Continue a prior page
  --all              Retrieve all pages
  -h, --help         display help for command
```

## groupi discord guilds refresh
Canonical passage: /cli/0.1.0/reference#groupi-discord-guilds-refresh

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi discord guilds refresh [options]

Refresh your authorization cache from Discord (no event changes, no automatic retries)

Options:
  -h, --help  display help for command
```

## groupi addons
Canonical passage: /cli/0.1.0/reference#groupi-addons

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi addons [options] [command]

Configure, use and author event add-ons

Options:
  -h, --help                                        display help for command

Commands:
  definitions                                       Author your custom add-on definitions
  get <event-id> <addon-type>                       Inspect enabled or disabled config
  list [options] <event-id>                         List event add-on configs, including disabled
                                                    ones
  templates [options]                               List your existing published custom templates
  enable [options] <event-id> <addon-type>          enable an existing add-on
  configure [options] <event-id> <addon-type>       Replace config; may reset participant responses
  disable [options] <event-id> <addon-type>         disable an existing add-on
  data [options] <event-id> <addon-type>            Inspect participant data and submission recovery
                                                    state
  respond [options] <event-id> <addon-type>         Participant respond; always acts as the
                                                    authenticated identity
  claim [options] <event-id> <addon-type>           Participant claim; always acts as the
                                                    authenticated identity
  vote [options] <event-id> <addon-type>            Participant vote; always acts as the
                                                    authenticated identity
  toggle [options] <event-id> <addon-type>          Participant toggle; always acts as the
                                                    authenticated identity
  execute [options] <event-id> <addon-type>         Participant execute; always acts as the
                                                    authenticated identity
  opt-in [options] <event-id> <addon-type>          Participant opt-in; always acts as the
                                                    authenticated identity
  opt-out [options] <event-id> <addon-type>         Participant opt-out; always acts as the
                                                    authenticated identity
  clear-response [options] <event-id> <addon-type>  Participant clear-response; always acts as the
                                                    authenticated identity
  clear-claims [options] <event-id> <addon-type>    Participant clear-claims; always acts as the
                                                    authenticated identity
  help [command]                                    display help for command
```

## groupi addons definitions
Canonical passage: /cli/0.1.0/reference#groupi-addons-definitions

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi addons definitions [options] [command]

Author your custom add-on definitions

Options:
  -h, --help                         display help for command

Commands:
  create [options]                   Import a portable definition as a new draft
  import [options]                   Import a portable definition as a new draft
  get <template-id>                  Inspect your definition and its current version
  export <template-id>               Write portable definition JSON to stdout; excludes owner and
                                     lifecycle metadata
  list [options]                     List all your draft and published definitions
  edit [options] <template-id>       Replace your definition using its inspected version; existing
                                     event copies are unchanged
  publish [options] <template-id>    publish your definition using its inspected version
  unpublish [options] <template-id>  unpublish your definition using its inspected version
  delete [options] <template-id>     delete your definition using its inspected version
  help [command]                     display help for command
```

## groupi addons definitions create
Canonical passage: /cli/0.1.0/reference#groupi-addons-definitions-create

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi addons definitions create [options]

Import a portable definition as a new draft

Options:
  --file <path>  Read a portable definition JSON file (64 KiB maximum)
  --stdin        Read a portable definition from piped standard input
  -h, --help     display help for command
```

## groupi addons definitions import
Canonical passage: /cli/0.1.0/reference#groupi-addons-definitions-import

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi addons definitions import [options]

Import a portable definition as a new draft

Options:
  --file <path>  Read a portable definition JSON file (64 KiB maximum)
  --stdin        Read a portable definition from piped standard input
  -h, --help     display help for command
```

## groupi addons definitions get
Canonical passage: /cli/0.1.0/reference#groupi-addons-definitions-get

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi addons definitions get [options] <template-id>

Inspect your definition and its current version

Options:
  -h, --help  display help for command
```

## groupi addons definitions export
Canonical passage: /cli/0.1.0/reference#groupi-addons-definitions-export

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi addons definitions export [options] <template-id>

Write portable definition JSON to stdout; excludes owner and lifecycle metadata

Options:
  -h, --help  display help for command
```

## groupi addons definitions list
Canonical passage: /cli/0.1.0/reference#groupi-addons-definitions-list

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi addons definitions list [options]

List all your draft and published definitions

Options:
  --limit <number>   Page size (1–100) (default: "20")
  --cursor <cursor>  Continue a page
  --all              Deliberately retrieve all pages
  -h, --help         display help for command
```

## groupi addons definitions edit
Canonical passage: /cli/0.1.0/reference#groupi-addons-definitions-edit

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi addons definitions edit [options] <template-id>

Replace your definition using its inspected version; existing event copies are unchanged

Options:
  --expected-version <number>  Version returned by definitions get; rejects concurrent changes
  --yes                        Confirm definition replacement or lifecycle change
  --file <path>                Read replacement portable JSON (64 KiB maximum)
  --stdin                      Read replacement portable JSON from piped standard input
  -h, --help                   display help for command
```

## groupi addons definitions publish
Canonical passage: /cli/0.1.0/reference#groupi-addons-definitions-publish

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi addons definitions publish [options] <template-id>

publish your definition using its inspected version

Options:
  --expected-version <number>  Version returned by definitions get; rejects concurrent changes
  --yes                        Confirm definition replacement or lifecycle change
  -h, --help                   display help for command
```

## groupi addons definitions unpublish
Canonical passage: /cli/0.1.0/reference#groupi-addons-definitions-unpublish

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi addons definitions unpublish [options] <template-id>

unpublish your definition using its inspected version

Options:
  --expected-version <number>  Version returned by definitions get; rejects concurrent changes
  --yes                        Confirm definition replacement or lifecycle change
  -h, --help                   display help for command
```

## groupi addons definitions delete
Canonical passage: /cli/0.1.0/reference#groupi-addons-definitions-delete

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi addons definitions delete [options] <template-id>

delete your definition using its inspected version

Options:
  --expected-version <number>  Version returned by definitions get; rejects concurrent changes
  --yes                        Confirm definition replacement or lifecycle change
  -h, --help                   display help for command
```

## groupi addons get
Canonical passage: /cli/0.1.0/reference#groupi-addons-get

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi addons get [options] <event-id> <addon-type>

Inspect enabled or disabled config

Options:
  -h, --help  display help for command
```

## groupi addons list
Canonical passage: /cli/0.1.0/reference#groupi-addons-list

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi addons list [options] <event-id>

List event add-on configs, including disabled ones

Options:
  --limit <number>   Page size (1–100) (default: "20")
  --cursor <cursor>  Continue page
  --all              Deliberately retrieve all pages
  -h, --help         display help for command
```

## groupi addons templates
Canonical passage: /cli/0.1.0/reference#groupi-addons-templates

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi addons templates [options]

List your existing published custom templates

Options:
  --limit <number>   Page size (1–100) (default: "20")
  --cursor <cursor>  Continue page
  --all              Deliberately retrieve all pages
  -h, --help         display help for command
```

## groupi addons enable
Canonical passage: /cli/0.1.0/reference#groupi-addons-enable

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi addons enable [options] <event-id> <addon-type>

enable an existing add-on

Options:
  --yes                       Confirm config replacement, response reset, or disable
  --config <json>             Validated JSON config object
  --config-file <path>        Read JSON configuration from a local file
  --reminder-offset <offset>  Reminders offset, e.g. 1_HOUR
  --questions <json>          Questionnaire questions array
  --items <json>              Bring-list items array
  --guild-id <id>             Discord guild ID (recent authorization required)
  --guild-name <name>         Discord guild name
  --template-id <id>          Existing published custom template ID; use custom:<id>
  -h, --help                  display help for command
```

## groupi addons configure
Canonical passage: /cli/0.1.0/reference#groupi-addons-configure

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi addons configure [options] <event-id> <addon-type>

Replace config; may reset participant responses

Options:
  --yes                       Confirm config replacement, response reset, or disable
  --config <json>             Validated JSON config object
  --config-file <path>        Read JSON configuration from a local file
  --reminder-offset <offset>  Reminders offset, e.g. 1_HOUR
  --questions <json>          Questionnaire questions array
  --items <json>              Bring-list items array
  --guild-id <id>             Discord guild ID (recent authorization required)
  --guild-name <name>         Discord guild name
  --template-id <id>          Existing published custom template ID; use custom:<id>
  -h, --help                  display help for command
```

## groupi addons disable
Canonical passage: /cli/0.1.0/reference#groupi-addons-disable

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi addons disable [options] <event-id> <addon-type>

disable an existing add-on

Options:
  --yes       Confirm config replacement, response reset, or disable
  -h, --help  display help for command
```

## groupi addons data
Canonical passage: /cli/0.1.0/reference#groupi-addons-data

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi addons data [options] <event-id> <addon-type>

Inspect participant data and submission recovery state

Options:
  --limit <number>   Page size (1–100) (default: "20")
  --cursor <cursor>  Continue page
  --all              Retrieve all pages
  -h, --help         display help for command
```

## groupi addons respond
Canonical passage: /cli/0.1.0/reference#groupi-addons-respond

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi addons respond [options] <event-id> <addon-type>

Participant respond; always acts as the authenticated identity

Options:
  --data <json>       Answers/claims object, vote {options:[]}, or toggle {enabled:boolean}
  --data-file <path>  Read submission JSON from a local file (64 KiB maximum)
  --field <id>        Custom vote, toggle, or action-button field ID
  --yes               Confirm clearing data or executing configured actions
  -h, --help          display help for command
```

## groupi addons claim
Canonical passage: /cli/0.1.0/reference#groupi-addons-claim

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi addons claim [options] <event-id> <addon-type>

Participant claim; always acts as the authenticated identity

Options:
  --data <json>       Answers/claims object, vote {options:[]}, or toggle {enabled:boolean}
  --data-file <path>  Read submission JSON from a local file (64 KiB maximum)
  --field <id>        Custom vote, toggle, or action-button field ID
  --yes               Confirm clearing data or executing configured actions
  -h, --help          display help for command
```

## groupi addons vote
Canonical passage: /cli/0.1.0/reference#groupi-addons-vote

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi addons vote [options] <event-id> <addon-type>

Participant vote; always acts as the authenticated identity

Options:
  --data <json>       Answers/claims object, vote {options:[]}, or toggle {enabled:boolean}
  --data-file <path>  Read submission JSON from a local file (64 KiB maximum)
  --field <id>        Custom vote, toggle, or action-button field ID
  --yes               Confirm clearing data or executing configured actions
  -h, --help          display help for command
```

## groupi addons toggle
Canonical passage: /cli/0.1.0/reference#groupi-addons-toggle

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi addons toggle [options] <event-id> <addon-type>

Participant toggle; always acts as the authenticated identity

Options:
  --data <json>       Answers/claims object, vote {options:[]}, or toggle {enabled:boolean}
  --data-file <path>  Read submission JSON from a local file (64 KiB maximum)
  --field <id>        Custom vote, toggle, or action-button field ID
  --yes               Confirm clearing data or executing configured actions
  -h, --help          display help for command
```

## groupi addons execute
Canonical passage: /cli/0.1.0/reference#groupi-addons-execute

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi addons execute [options] <event-id> <addon-type>

Participant execute; always acts as the authenticated identity

Options:
  --data <json>       Answers/claims object, vote {options:[]}, or toggle {enabled:boolean}
  --data-file <path>  Read submission JSON from a local file (64 KiB maximum)
  --field <id>        Custom vote, toggle, or action-button field ID
  --yes               Confirm clearing data or executing configured actions
  -h, --help          display help for command
```

## groupi addons opt-in
Canonical passage: /cli/0.1.0/reference#groupi-addons-opt-in

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi addons opt-in [options] <event-id> <addon-type>

Participant opt-in; always acts as the authenticated identity

Options:
  --data <json>       Answers/claims object, vote {options:[]}, or toggle {enabled:boolean}
  --data-file <path>  Read submission JSON from a local file (64 KiB maximum)
  --field <id>        Custom vote, toggle, or action-button field ID
  --yes               Confirm clearing data or executing configured actions
  -h, --help          display help for command
```

## groupi addons opt-out
Canonical passage: /cli/0.1.0/reference#groupi-addons-opt-out

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi addons opt-out [options] <event-id> <addon-type>

Participant opt-out; always acts as the authenticated identity

Options:
  --data <json>       Answers/claims object, vote {options:[]}, or toggle {enabled:boolean}
  --data-file <path>  Read submission JSON from a local file (64 KiB maximum)
  --field <id>        Custom vote, toggle, or action-button field ID
  --yes               Confirm clearing data or executing configured actions
  -h, --help          display help for command
```

## groupi addons clear-response
Canonical passage: /cli/0.1.0/reference#groupi-addons-clear-response

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi addons clear-response [options] <event-id> <addon-type>

Participant clear-response; always acts as the authenticated identity

Options:
  --data <json>       Answers/claims object, vote {options:[]}, or toggle {enabled:boolean}
  --data-file <path>  Read submission JSON from a local file (64 KiB maximum)
  --field <id>        Custom vote, toggle, or action-button field ID
  --yes               Confirm clearing data or executing configured actions
  -h, --help          display help for command
```

## groupi addons clear-claims
Canonical passage: /cli/0.1.0/reference#groupi-addons-clear-claims

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi addons clear-claims [options] <event-id> <addon-type>

Participant clear-claims; always acts as the authenticated identity

Options:
  --data <json>       Answers/claims object, vote {options:[]}, or toggle {enabled:boolean}
  --data-file <path>  Read submission JSON from a local file (64 KiB maximum)
  --field <id>        Custom vote, toggle, or action-button field ID
  --yes               Confirm clearing data or executing configured actions
  -h, --help          display help for command
```

## groupi friends
Canonical passage: /cli/0.1.0/reference#groupi-friends

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi friends [options] [command]

Manage friendships and friend requests

Options:
  -h, --help                         display help for command

Commands:
  list [options]                     List accepted friendships
  incoming [options]                 Inspect received pending requests
  outgoing [options]                 Inspect sent pending requests
  status <person-id>                 Inspect your relationship with a person
  request <person-id>                request social relationship
  accept <friendship-id>             accept social relationship
  decline [options] <friendship-id>  decline social relationship
  cancel [options] <friendship-id>   cancel social relationship
  remove [options] <friendship-id>   remove social relationship
  help [command]                     display help for command
```

## groupi friends list
Canonical passage: /cli/0.1.0/reference#groupi-friends-list

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi friends list [options]

List accepted friendships

Options:
  --limit <number>   Page size (1–100) (default: "20")
  --cursor <cursor>  Continue a prior page
  --all              Retrieve every page deliberately
  -h, --help         display help for command
```

## groupi friends incoming
Canonical passage: /cli/0.1.0/reference#groupi-friends-incoming

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi friends incoming [options]

Inspect received pending requests

Options:
  --limit <number>   Page size (1–100) (default: "20")
  --cursor <cursor>  Continue a prior page
  --all              Retrieve every page deliberately
  -h, --help         display help for command
```

## groupi friends outgoing
Canonical passage: /cli/0.1.0/reference#groupi-friends-outgoing

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi friends outgoing [options]

Inspect sent pending requests

Options:
  --limit <number>   Page size (1–100) (default: "20")
  --cursor <cursor>  Continue a prior page
  --all              Retrieve every page deliberately
  -h, --help         display help for command
```

## groupi friends status
Canonical passage: /cli/0.1.0/reference#groupi-friends-status

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi friends status [options] <person-id>

Inspect your relationship with a person

Options:
  -h, --help  display help for command
```

## groupi friends request
Canonical passage: /cli/0.1.0/reference#groupi-friends-request

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi friends request [options] <person-id>

request social relationship

Options:
  -h, --help  display help for command
```

## groupi friends accept
Canonical passage: /cli/0.1.0/reference#groupi-friends-accept

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi friends accept [options] <friendship-id>

accept social relationship

Options:
  -h, --help  display help for command
```

## groupi friends decline
Canonical passage: /cli/0.1.0/reference#groupi-friends-decline

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi friends decline [options] <friendship-id>

decline social relationship

Options:
  --yes       Confirm this social change
  -h, --help  display help for command
```

## groupi friends cancel
Canonical passage: /cli/0.1.0/reference#groupi-friends-cancel

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi friends cancel [options] <friendship-id>

cancel social relationship

Options:
  --yes       Confirm this social change
  -h, --help  display help for command
```

## groupi friends remove
Canonical passage: /cli/0.1.0/reference#groupi-friends-remove

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi friends remove [options] <friendship-id>

remove social relationship

Options:
  --yes       Confirm this social change
  -h, --help  display help for command
```

## groupi blocks
Canonical passage: /cli/0.1.0/reference#groupi-blocks

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi blocks [options] [command]

Manage blocked users

Options:
  -h, --help                     display help for command

Commands:
  list [options]                 List users you blocked
  status <person-id>             Inspect your relationship with a person
  block [options] <person-id>    block social relationship
  unblock [options] <person-id>  unblock social relationship
  help [command]                 display help for command
```

## groupi blocks list
Canonical passage: /cli/0.1.0/reference#groupi-blocks-list

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi blocks list [options]

List users you blocked

Options:
  --limit <number>   Page size (1–100) (default: "20")
  --cursor <cursor>  Continue a prior page
  --all              Retrieve every page deliberately
  -h, --help         display help for command
```

## groupi blocks status
Canonical passage: /cli/0.1.0/reference#groupi-blocks-status

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi blocks status [options] <person-id>

Inspect your relationship with a person

Options:
  -h, --help  display help for command
```

## groupi blocks block
Canonical passage: /cli/0.1.0/reference#groupi-blocks-block

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi blocks block [options] <person-id>

block social relationship

Options:
  --yes       Confirm this social change
  -h, --help  display help for command
```

## groupi blocks unblock
Canonical passage: /cli/0.1.0/reference#groupi-blocks-unblock

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi blocks unblock [options] <person-id>

unblock social relationship

Options:
  --yes       Confirm this social change
  -h, --help  display help for command
```

## groupi groups
Canonical passage: /cli/0.1.0/reference#groupi-groups

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi groups [options] [command]

Manage formal Group communities independently of events

Options:
  -h, --help                                                  display help for command

Commands:
  transfer                                                    Offer consensual Group responsibility; pending offers remain unresolved
  list [options]                                              List your admitted Groups
  get <group-id>                                              Read an admitted Group
  create [options]                                            Create an owner-only Group
  edit [options] <group-id>                                   Update Group identity as owner
  delete [options] <group-id>                                 Explicitly retire an owned Group and its data; independent Events remain
  announce [options] <group-id>                               Explicitly announce to permitted members; reports queued notifications
  announcement-status [options] <group-id>                    Recover your aggregate announcement status
  members [options] <group-id>                                Read admitted Group roster
  invites [options] <group-id>                                Inspect Group invitations as manager
  invite <group-id> <person-id>                               Invite an existing user to your Group
  invitation-policy [options] <group-id>                      Configure Group invitations as owner
  member-role [options] <group-id> <person-id>                Appoint or demote a moderator as owner
  remove-member [options] <group-id> <person-id>              Remove an ordinary member without banning
  ban [options] <group-id> <person-id>                        Ban an ordinary member or nonmember
  lift-ban [options] <group-id> <person-id>                   Lift a Group ban without admitting membership
  leave [options] <group-id>                                  Leave your own Group membership
  bans [options] <group-id>                                   List private active Group bans as manager
  questionnaire                                               Post-admission questionnaire and private retained records
  forms                                                       Persistent ordinary forms, separate from the joining questionnaire
  polls                                                       Persistent independent polls; never selects Event dates or RSVP
  lists                                                       Persistent community lists, independent of Invite Lists and Event Bring Lists
  application-form <group-id>                                 Read admission form and your private pending application
  application-get <group-id> <application-id>                 Read a private application as author or current manager
  application-history [options] <group-id>                    Read your retained private application history
  applications [options] <group-id>                           Review private Group applications as manager
  application-settings [options] <group-id>                   Configure Group applications as owner
  apply [options] <group-id>                                  Apply for Group membership
  application-edit [options] <group-id> <application-id>      Edit your pending saved answers
  application-withdraw [options] <group-id> <application-id>  Withdraw your pending application
  application-review [options] <group-id> <application-id>    Record an application decision as current manager
  events [options] <group-id>                                 Page safe upcoming/undated shared Events; no participation effects
  withdraw-event [options] <group-id> <event-id>              Withdraw only this Group audience as current Group manager
  event-sharing [options] <group-id>                          Owner sets managers-only (default) or all eligible members sharing
  help [command]                                              display help for command
```

## groupi groups transfer
Canonical passage: /cli/0.1.0/reference#groupi-groups-transfer

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi groups transfer [options] [command]

Offer consensual Group responsibility; pending offers remain unresolved

Options:
  -h, --help                                  display help for command

Commands:
  status <group-id>                           Read the current participant-only transfer status
  offer [options] <group-id> <person-id>      Offer to an admitted member without changing ownership
                                              yet
  accept [options] <group-id> <transfer-id>   Accept responsibility as the single owner; former
                                              owner becomes Moderator
  decline [options] <group-id> <transfer-id>  Decline the observed offer without changing ownership
  cancel [options] <group-id> <transfer-id>   Cancel the observed pending offer as owner
  help [command]                              display help for command
```

## groupi groups transfer status
Canonical passage: /cli/0.1.0/reference#groupi-groups-transfer-status

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi groups transfer status [options] <group-id>

Read the current participant-only transfer status

Options:
  -h, --help  display help for command
```

## groupi groups transfer offer
Canonical passage: /cli/0.1.0/reference#groupi-groups-transfer-offer

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi groups transfer offer [options] <group-id> <person-id>

Offer to an admitted member without changing ownership yet

Options:
  --yes       Confirm offering responsibility
  -h, --help  display help for command
```

## groupi groups transfer accept
Canonical passage: /cli/0.1.0/reference#groupi-groups-transfer-accept

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi groups transfer accept [options] <group-id> <transfer-id>

Accept responsibility as the single owner; former owner becomes Moderator

Options:
  --yes       Confirm acceptance
  -h, --help  display help for command
```

## groupi groups transfer decline
Canonical passage: /cli/0.1.0/reference#groupi-groups-transfer-decline

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi groups transfer decline [options] <group-id> <transfer-id>

Decline the observed offer without changing ownership

Options:
  --yes       Confirm acceptance
  -h, --help  display help for command
```

## groupi groups transfer cancel
Canonical passage: /cli/0.1.0/reference#groupi-groups-transfer-cancel

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi groups transfer cancel [options] <group-id> <transfer-id>

Cancel the observed pending offer as owner

Options:
  --yes       Confirm acceptance
  -h, --help  display help for command
```

## groupi groups list
Canonical passage: /cli/0.1.0/reference#groupi-groups-list

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi groups list [options]

List your admitted Groups

Options:
  --limit <number>   Page size (1–100) (default: "20")
  --cursor <cursor>  Continue a page
  --all              Retrieve every page deliberately
  -h, --help         display help for command
```

## groupi groups get
Canonical passage: /cli/0.1.0/reference#groupi-groups-get

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi groups get [options] <group-id>

Read an admitted Group

Options:
  -h, --help  display help for command
```

## groupi groups create
Canonical passage: /cli/0.1.0/reference#groupi-groups-create

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi groups create [options]

Create an owner-only Group

Options:
  --name <name>         Trimmed Group name (1–100 characters)
  --description <text>  Description (at most 2000 characters)
  --image <url>         HTTPS image URL
  -h, --help            display help for command
```

## groupi groups edit
Canonical passage: /cli/0.1.0/reference#groupi-groups-edit

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi groups edit [options] <group-id>

Update Group identity as owner

Options:
  --name <name>         Trimmed Group name (1–100 characters)
  --description <text>  Description (at most 2000 characters)
  --image <url>         HTTPS image URL
  --clear-description   Remove description
  --clear-image         Remove image
  -h, --help            display help for command
```

## groupi groups delete
Canonical passage: /cli/0.1.0/reference#groupi-groups-delete

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi groups delete [options] <group-id>

Explicitly retire an owned Group and its data; independent Events remain

Options:
  --yes                           Confirm Group deletion
  --acknowledge-discord-handback  Hand retained Discord access to staff; owed removals continue,
                                  server and bot remain
  -h, --help                      display help for command
```

## groupi groups announce
Canonical passage: /cli/0.1.0/reference#groupi-groups-announce

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi groups announce [options] <group-id>

Explicitly announce to permitted members; reports queued notifications

Options:
  --title <title>      Announcement title (1–100 characters)
  --message <message>  Announcement message (1–2000 characters)
  --request-id <id>    Stable <unix-ms>.<uuid-v4> key; preserve body on recovery
  -h, --help           display help for command
```

## groupi groups announcement-status
Canonical passage: /cli/0.1.0/reference#groupi-groups-announcement-status

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi groups announcement-status [options] <group-id>

Recover your aggregate announcement status

Options:
  --request-id <id>  Original announcement request key
  -h, --help         display help for command
```

## groupi groups members
Canonical passage: /cli/0.1.0/reference#groupi-groups-members

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi groups members [options] <group-id>

Read admitted Group roster

Options:
  --limit <number>   Page size (1–100) (default: "20")
  --cursor <cursor>  Continue a page
  --all              Retrieve every page deliberately
  -h, --help         display help for command
```

## groupi groups invites
Canonical passage: /cli/0.1.0/reference#groupi-groups-invites

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi groups invites [options] <group-id>

Inspect Group invitations as manager

Options:
  --limit <number>   Page size (1–100) (default: "20")
  --cursor <cursor>  Continue a page
  --all              Retrieve every page deliberately
  --status <status>  PENDING, ACCEPTED, DECLINED or CANCELLED
  -h, --help         display help for command
```

## groupi groups invite
Canonical passage: /cli/0.1.0/reference#groupi-groups-invite

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi groups invite [options] <group-id> <person-id>

Invite an existing user to your Group

Options:
  -h, --help  display help for command
```

## groupi groups invitation-policy
Canonical passage: /cli/0.1.0/reference#groupi-groups-invitation-policy

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi groups invitation-policy [options] <group-id>

Configure Group invitations as owner

Options:
  --enabled <boolean>  true or false
  -h, --help           display help for command
```

## groupi groups member-role
Canonical passage: /cli/0.1.0/reference#groupi-groups-member-role

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi groups member-role [options] <group-id> <person-id>

Appoint or demote a moderator as owner

Options:
  --yes          Confirm Group membership or moderation change
  --role <role>  MODERATOR or MEMBER
  -h, --help     display help for command
```

## groupi groups remove-member
Canonical passage: /cli/0.1.0/reference#groupi-groups-remove-member

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi groups remove-member [options] <group-id> <person-id>

Remove an ordinary member without banning

Options:
  --yes       Confirm Group membership or moderation change
  -h, --help  display help for command
```

## groupi groups ban
Canonical passage: /cli/0.1.0/reference#groupi-groups-ban

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi groups ban [options] <group-id> <person-id>

Ban an ordinary member or nonmember

Options:
  --yes       Confirm Group membership or moderation change
  -h, --help  display help for command
```

## groupi groups lift-ban
Canonical passage: /cli/0.1.0/reference#groupi-groups-lift-ban

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi groups lift-ban [options] <group-id> <person-id>

Lift a Group ban without admitting membership

Options:
  --yes       Confirm Group membership or moderation change
  -h, --help  display help for command
```

## groupi groups leave
Canonical passage: /cli/0.1.0/reference#groupi-groups-leave

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi groups leave [options] <group-id>

Leave your own Group membership

Options:
  --yes       Confirm Group membership or moderation change
  -h, --help  display help for command
```

## groupi groups bans
Canonical passage: /cli/0.1.0/reference#groupi-groups-bans

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi groups bans [options] <group-id>

List private active Group bans as manager

Options:
  --limit <number>   Page size (1–100) (default: "20")
  --cursor <cursor>  Continue a page
  --all              Retrieve every page deliberately
  -h, --help         display help for command
```

## groupi groups questionnaire
Canonical passage: /cli/0.1.0/reference#groupi-groups-questionnaire

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi groups questionnaire [options] [command]

Post-admission questionnaire and private retained records

Options:
  -h, --help                      display help for command

Commands:
  get <group-id>                  Read your private current form and saved definitions
  status <group-id>               Read current completion and member-content access status
  history [options] <group-id>    Read paginated retained own answered definitions
  responses [options] <group-id>  Review private responses as current owner or moderator
  configure [options] <group-id>  Configure exactly one joining form as owner; preserves retained
                                  answers
  submit [options] <group-id>     Submit or edit private answers as a currently admitted member
  help [command]                  display help for command
```

## groupi groups questionnaire get
Canonical passage: /cli/0.1.0/reference#groupi-groups-questionnaire-get

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi groups questionnaire get [options] <group-id>

Read your private current form and saved definitions

Options:
  -h, --help  display help for command
```

## groupi groups questionnaire status
Canonical passage: /cli/0.1.0/reference#groupi-groups-questionnaire-status

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi groups questionnaire status [options] <group-id>

Read current completion and member-content access status

Options:
  -h, --help  display help for command
```

## groupi groups questionnaire history
Canonical passage: /cli/0.1.0/reference#groupi-groups-questionnaire-history

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi groups questionnaire history [options] <group-id>

Read paginated retained own answered definitions

Options:
  --limit <number>         Page size (1–100) (default: "20")
  --cursor <cursor>        Continue page
  --author-id <person-id>  Review this author as current manager
  -h, --help               display help for command
```

## groupi groups questionnaire responses
Canonical passage: /cli/0.1.0/reference#groupi-groups-questionnaire-responses

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi groups questionnaire responses [options] <group-id>

Review private responses as current owner or moderator

Options:
  --limit <number>   Page size (1–100) (default: "20")
  --cursor <cursor>  Continue page
  -h, --help         display help for command
```

## groupi groups questionnaire configure
Canonical passage: /cli/0.1.0/reference#groupi-groups-questionnaire-configure

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi groups questionnaire configure [options] <group-id>

Configure exactly one joining form as owner; preserves retained answers

Options:
  --enabled <boolean>              true or false; disabling preserves records
  --questions <json>               At most 50 stable-ID core questions
  --required-completion <boolean>  Require completion before Group member content; true or false
  -h, --help                       display help for command
```

## groupi groups questionnaire submit
Canonical passage: /cli/0.1.0/reference#groupi-groups-questionnaire-submit

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi groups questionnaire submit [options] <group-id>

Submit or edit private answers as a currently admitted member

Options:
  --form-version <number>  Current questionnaire version from get
  --answers <json>         Current answer object, replacing optional values
  -h, --help               display help for command
```

## groupi groups forms
Canonical passage: /cli/0.1.0/reference#groupi-groups-forms

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi groups forms [options] [command]

Persistent ordinary forms, separate from the joining questionnaire

Options:
  -h, --help                                             display help for command

Commands:
  list [options] <group-id>                              list persistent forms
  get <group-id> <tool-id>                               get persistent forms
  settings <group-id> <tool-id>                          settings persistent forms (eligible
                                                         managers; disabled forms remain manageable)
  history [options] <group-id> <tool-id>                 history persistent forms (your retained
                                                         response snapshots)
  results [options] <group-id> <tool-id>                 results persistent forms (stated results
                                                         visibility applies)
  create [options] <group-id>                            create a persistent Group form
  configure [options] <group-id> <tool-id>               configure a persistent Group form
  submit [options] <group-id> <tool-id>                  submit a persistent Group form
  remove-own [options] <group-id> <tool-id>              remove-own a persistent Group form response
                                                         and retained history
  delete [options] <group-id> <tool-id>                  delete a persistent Group form
  moderate [options] <group-id> <tool-id> <response-id>  moderate a persistent Group form
  policy                                                 Owner controls ordinary form availability
                                                         and creation
  help [command]                                         display help for command
```

## groupi groups forms list
Canonical passage: /cli/0.1.0/reference#groupi-groups-forms-list

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi groups forms list [options] <group-id>

list persistent forms

Options:
  --limit <number>   Page size (1–100) (default: "20")
  --cursor <cursor>  Continue page
  -h, --help         display help for command
```

## groupi groups forms get
Canonical passage: /cli/0.1.0/reference#groupi-groups-forms-get

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi groups forms get [options] <group-id> <tool-id>

get persistent forms

Options:
  -h, --help  display help for command
```

## groupi groups forms settings
Canonical passage: /cli/0.1.0/reference#groupi-groups-forms-settings

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi groups forms settings [options] <group-id> <tool-id>

settings persistent forms (eligible managers; disabled forms remain manageable)

Options:
  -h, --help  display help for command
```

## groupi groups forms history
Canonical passage: /cli/0.1.0/reference#groupi-groups-forms-history

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi groups forms history [options] <group-id> <tool-id>

history persistent forms (your retained response snapshots)

Options:
  --limit <number>   Page size (1–100) (default: "20")
  --cursor <cursor>  Continue page
  -h, --help         display help for command
```

## groupi groups forms results
Canonical passage: /cli/0.1.0/reference#groupi-groups-forms-results

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi groups forms results [options] <group-id> <tool-id>

results persistent forms (stated results visibility applies)

Options:
  --limit <number>   Page size (1–100) (default: "20")
  --cursor <cursor>  Continue page
  -h, --help         display help for command
```

## groupi groups forms create
Canonical passage: /cli/0.1.0/reference#groupi-groups-forms-create

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi groups forms create [options] <group-id>

create a persistent Group form

Options:
  --title <text>                     Form title
  --description <text>               Form description
  --questions-json <json>            Stable-ID core questions JSON (at most 50)
  --results-visibility <visibility>  Immutable MANAGERS or MEMBERS results visibility
  -h, --help                         display help for command
```

## groupi groups forms configure
Canonical passage: /cli/0.1.0/reference#groupi-groups-forms-configure

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi groups forms configure [options] <group-id> <tool-id>

configure a persistent Group form

Options:
  --title <text>           Form title
  --description <text>     Form description
  --questions-json <json>  Stable-ID core questions JSON (at most 50)
  --form-version <number>  Current form version from get
  -h, --help               display help for command
```

## groupi groups forms submit
Canonical passage: /cli/0.1.0/reference#groupi-groups-forms-submit

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi groups forms submit [options] <group-id> <tool-id>

submit a persistent Group form

Options:
  --form-version <number>       Current form version from get
  --expected-revision <number>  Current own response revision; 0 for first submission
  --answers-json <json>         Answers JSON object
  -h, --help                    display help for command
```

## groupi groups forms remove-own
Canonical passage: /cli/0.1.0/reference#groupi-groups-forms-remove-own

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi groups forms remove-own [options] <group-id> <tool-id>

remove-own a persistent Group form response and retained history

Options:
  --yes       Confirm permanent removal
  -h, --help  display help for command
```

## groupi groups forms delete
Canonical passage: /cli/0.1.0/reference#groupi-groups-forms-delete

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi groups forms delete [options] <group-id> <tool-id>

delete a persistent Group form

Options:
  --yes       Confirm permanent removal
  -h, --help  display help for command
```

## groupi groups forms moderate
Canonical passage: /cli/0.1.0/reference#groupi-groups-forms-moderate

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi groups forms moderate [options] <group-id> <tool-id> <response-id>

moderate a persistent Group form

Options:
  --yes       Confirm permanent removal
  -h, --help  display help for command
```

## groupi groups forms policy
Canonical passage: /cli/0.1.0/reference#groupi-groups-forms-policy

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi groups forms policy [options] [command]

Owner controls ordinary form availability and creation

Options:
  -h, --help                display help for command

Commands:
  get <group-id>            Read forms policy
  set [options] <group-id>  Set forms policy as owner
  help [command]            display help for command
```

## groupi groups forms policy get
Canonical passage: /cli/0.1.0/reference#groupi-groups-forms-policy-get

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi groups forms policy get [options] <group-id>

Read forms policy

Options:
  -h, --help  display help for command
```

## groupi groups forms policy set
Canonical passage: /cli/0.1.0/reference#groupi-groups-forms-policy-set

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi groups forms policy set [options] <group-id>

Set forms policy as owner

Options:
  --enabled <boolean>  true or false
  --creation <role>    MANAGERS or MEMBERS
  -h, --help           display help for command
```

## groupi groups polls
Canonical passage: /cli/0.1.0/reference#groupi-groups-polls

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi groups polls [options] [command]

Persistent independent polls; never selects Event dates or RSVP

Options:
  -h, --help                                         display help for command

Commands:
  list [options] <group-id>                          list persistent polls
  get <group-id> <tool-id>                           get persistent polls
  settings <group-id> <tool-id>                      settings persistent polls (eligible managers;
                                                     disabled polls remain manageable)
  history [options] <group-id> <tool-id>             history persistent polls (your retained vote
                                                     snapshots)
  results [options] <group-id> <tool-id>             results persistent polls (stated results
                                                     visibility applies)
  create [options] <group-id>                        create a persistent Group poll
  configure [options] <group-id> <tool-id>           configure a persistent Group poll
  submit [options] <group-id> <tool-id>              submit a persistent Group poll
  remove-own [options] <group-id> <tool-id>          remove-own a persistent Group poll vote and
                                                     retained history
  delete [options] <group-id> <tool-id>              delete a persistent Group poll
  moderate [options] <group-id> <tool-id> <vote-id>  moderate a persistent Group poll
  policy                                             Owner controls ordinary poll availability and
                                                     creation
  help [command]                                     display help for command
```

## groupi groups polls list
Canonical passage: /cli/0.1.0/reference#groupi-groups-polls-list

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi groups polls list [options] <group-id>

list persistent polls

Options:
  --limit <number>   Page size (1–100) (default: "20")
  --cursor <cursor>  Continue page
  -h, --help         display help for command
```

## groupi groups polls get
Canonical passage: /cli/0.1.0/reference#groupi-groups-polls-get

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi groups polls get [options] <group-id> <tool-id>

get persistent polls

Options:
  -h, --help  display help for command
```

## groupi groups polls settings
Canonical passage: /cli/0.1.0/reference#groupi-groups-polls-settings

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi groups polls settings [options] <group-id> <tool-id>

settings persistent polls (eligible managers; disabled polls remain manageable)

Options:
  -h, --help  display help for command
```

## groupi groups polls history
Canonical passage: /cli/0.1.0/reference#groupi-groups-polls-history

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi groups polls history [options] <group-id> <tool-id>

history persistent polls (your retained vote snapshots)

Options:
  --limit <number>   Page size (1–100) (default: "20")
  --cursor <cursor>  Continue page
  -h, --help         display help for command
```

## groupi groups polls results
Canonical passage: /cli/0.1.0/reference#groupi-groups-polls-results

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi groups polls results [options] <group-id> <tool-id>

results persistent polls (stated results visibility applies)

Options:
  --limit <number>   Page size (1–100) (default: "20")
  --cursor <cursor>  Continue page
  -h, --help         display help for command
```

## groupi groups polls create
Canonical passage: /cli/0.1.0/reference#groupi-groups-polls-create

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi groups polls create [options] <group-id>

create a persistent Group poll

Options:
  --title <text>                     Poll title
  --mode <mode>                      SINGLE or MULTIPLE
  --description <text>               Poll description
  --options-json <json>              Stable-ID {id,label} options JSON (2–50)
  --results-visibility <visibility>  Immutable MANAGERS or MEMBERS results visibility
  -h, --help                         display help for command
```

## groupi groups polls configure
Canonical passage: /cli/0.1.0/reference#groupi-groups-polls-configure

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi groups polls configure [options] <group-id> <tool-id>

configure a persistent Group poll

Options:
  --title <text>           Poll title
  --mode <mode>            SINGLE or MULTIPLE
  --description <text>     Poll description
  --options-json <json>    Stable-ID {id,label} options JSON (2–50)
  --poll-version <number>  Current poll version from get
  -h, --help               display help for command
```

## groupi groups polls submit
Canonical passage: /cli/0.1.0/reference#groupi-groups-polls-submit

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi groups polls submit [options] <group-id> <tool-id>

submit a persistent Group poll

Options:
  --poll-version <number>       Current poll version from get
  --expected-revision <number>  Current own vote revision; 0 for first submission
  --selections-json <json>      Selected option-ID JSON array
  -h, --help                    display help for command
```

## groupi groups polls remove-own
Canonical passage: /cli/0.1.0/reference#groupi-groups-polls-remove-own

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi groups polls remove-own [options] <group-id> <tool-id>

remove-own a persistent Group poll vote and retained history

Options:
  --expected-revision <number>  Current vote revision
  --yes                         Confirm permanent removal
  -h, --help                    display help for command
```

## groupi groups polls delete
Canonical passage: /cli/0.1.0/reference#groupi-groups-polls-delete

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi groups polls delete [options] <group-id> <tool-id>

delete a persistent Group poll

Options:
  --yes       Confirm permanent removal
  -h, --help  display help for command
```

## groupi groups polls moderate
Canonical passage: /cli/0.1.0/reference#groupi-groups-polls-moderate

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi groups polls moderate [options] <group-id> <tool-id> <vote-id>

moderate a persistent Group poll

Options:
  --expected-revision <number>  Current vote revision
  --yes                         Confirm permanent removal
  -h, --help                    display help for command
```

## groupi groups polls policy
Canonical passage: /cli/0.1.0/reference#groupi-groups-polls-policy

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi groups polls policy [options] [command]

Owner controls ordinary poll availability and creation

Options:
  -h, --help                display help for command

Commands:
  get <group-id>            Read polls policy
  set [options] <group-id>  Set polls policy as owner
  help [command]            display help for command
```

## groupi groups polls policy get
Canonical passage: /cli/0.1.0/reference#groupi-groups-polls-policy-get

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi groups polls policy get [options] <group-id>

Read polls policy

Options:
  -h, --help  display help for command
```

## groupi groups polls policy set
Canonical passage: /cli/0.1.0/reference#groupi-groups-polls-policy-set

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi groups polls policy set [options] <group-id>

Set polls policy as owner

Options:
  --enabled <boolean>  true or false
  --creation <role>    MANAGERS or MEMBERS
  -h, --help           display help for command
```

## groupi groups lists
Canonical passage: /cli/0.1.0/reference#groupi-groups-lists

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi groups lists [options] [command]

Persistent community lists, independent of Invite Lists and Event Bring Lists

Options:
  -h, --help                                        display help for command

Commands:
  list [options] <group-id>                         list Group lists; stated visibility applies
  get <group-id> <tool-id>                          get Group lists; stated visibility applies
  settings <group-id> <tool-id>                     Current eligible managers read settings even
                                                    while disabled
  entries [options] <group-id> <tool-id>            entries Group lists; stated visibility applies
  own [options] <group-id> <tool-id>                Read only your retained list contributions
  create [options] <group-id>                       create a persistent list
  configure [options] <group-id> <tool-id>          configure a persistent list
  add [options] <group-id> <tool-id>                add a persistent list entry: MANAGERS personal
                                                    to author/managers; MEMBERS shared latest
                                                    survives anonymously on account deletion
  edit [options] <group-id> <tool-id> <entry-id>    edit a persistent list
  remove [options] <group-id> <tool-id> <entry-id>  remove a persistent list
  delete [options] <group-id> <tool-id>             delete a persistent list
  policy                                            Owner controls list availability/creation
  help [command]                                    display help for command
```

## groupi groups lists list
Canonical passage: /cli/0.1.0/reference#groupi-groups-lists-list

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi groups lists list [options] <group-id>

list Group lists; stated visibility applies

Options:
  --limit <number>   Page size 1–100 (default: "20")
  --cursor <cursor>  Continue page
  -h, --help         display help for command
```

## groupi groups lists get
Canonical passage: /cli/0.1.0/reference#groupi-groups-lists-get

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi groups lists get [options] <group-id> <tool-id>

get Group lists; stated visibility applies

Options:
  -h, --help  display help for command
```

## groupi groups lists settings
Canonical passage: /cli/0.1.0/reference#groupi-groups-lists-settings

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi groups lists settings [options] <group-id> <tool-id>

Current eligible managers read settings even while disabled

Options:
  -h, --help  display help for command
```

## groupi groups lists entries
Canonical passage: /cli/0.1.0/reference#groupi-groups-lists-entries

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi groups lists entries [options] <group-id> <tool-id>

entries Group lists; stated visibility applies

Options:
  --limit <number>   Page size 1–100 (default: "20")
  --cursor <cursor>  Continue page
  -h, --help         display help for command
```

## groupi groups lists own
Canonical passage: /cli/0.1.0/reference#groupi-groups-lists-own

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi groups lists own [options] <group-id> <tool-id>

Read only your retained list contributions

Options:
  --limit <number>   Page size 1–100 (default: "20")
  --cursor <cursor>  Continue page
  -h, --help         display help for command
```

## groupi groups lists create
Canonical passage: /cli/0.1.0/reference#groupi-groups-lists-create

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi groups lists create [options] <group-id>

create a persistent list

Options:
  --title <text>                     List title
  --description <text>               List description
  --results-visibility <visibility>  Fixed MANAGERS personal or MEMBERS shared visibility
  -h, --help                         display help for command
```

## groupi groups lists configure
Canonical passage: /cli/0.1.0/reference#groupi-groups-lists-configure

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi groups lists configure [options] <group-id> <tool-id>

configure a persistent list

Options:
  --title <text>           List title
  --description <text>     List description
  --list-version <number>  Current configuration version
  -h, --help               display help for command
```

## groupi groups lists add
Canonical passage: /cli/0.1.0/reference#groupi-groups-lists-add

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi groups lists add [options] <group-id> <tool-id>

add a persistent list entry: MANAGERS personal to author/managers; MEMBERS shared latest survives
anonymously on account deletion

Options:
  --list-version <number>  Current configuration version
  --text <text>            Entry text1–2000 characters
  --request-id <id>        <unix-ms>.<uuid-v4>, reuse only for exact original request
  -h, --help               display help for command
```

## groupi groups lists edit
Canonical passage: /cli/0.1.0/reference#groupi-groups-lists-edit

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi groups lists edit [options] <group-id> <tool-id> <entry-id>

edit a persistent list

Options:
  --list-version <number>       Current configuration version
  --text <text>                 Entry text1–2000 characters
  --expected-revision <number>  Current entry revision
  --completed <boolean>         true or false, a list status only
  -h, --help                    display help for command
```

## groupi groups lists remove
Canonical passage: /cli/0.1.0/reference#groupi-groups-lists-remove

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi groups lists remove [options] <group-id> <tool-id> <entry-id>

remove a persistent list

Options:
  --expected-revision <number>  Current entry revision, stale removals conflict
  --yes                         Confirm permanent removal
  -h, --help                    display help for command
```

## groupi groups lists delete
Canonical passage: /cli/0.1.0/reference#groupi-groups-lists-delete

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi groups lists delete [options] <group-id> <tool-id>

delete a persistent list

Options:
  --yes       Confirm permanent removal
  -h, --help  display help for command
```

## groupi groups lists policy
Canonical passage: /cli/0.1.0/reference#groupi-groups-lists-policy

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi groups lists policy [options] [command]

Owner controls list availability/creation

Options:
  -h, --help                display help for command

Commands:
  get <group-id>
  set [options] <group-id>
  help [command]            display help for command
```

## groupi groups lists policy get
Canonical passage: /cli/0.1.0/reference#groupi-groups-lists-policy-get

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi groups lists policy get [options] <group-id>

Options:
  -h, --help  display help for command
```

## groupi groups lists policy set
Canonical passage: /cli/0.1.0/reference#groupi-groups-lists-policy-set

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi groups lists policy set [options] <group-id>

Options:
  --enabled <boolean>  true or false
  --creation <role>    MANAGERS or MEMBERS
  -h, --help           display help for command
```

## groupi groups application-form
Canonical passage: /cli/0.1.0/reference#groupi-groups-application-form

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi groups application-form [options] <group-id>

Read admission form and your private pending application

Options:
  -h, --help  display help for command
```

## groupi groups application-get
Canonical passage: /cli/0.1.0/reference#groupi-groups-application-get

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi groups application-get [options] <group-id> <application-id>

Read a private application as author or current manager

Options:
  -h, --help  display help for command
```

## groupi groups application-history
Canonical passage: /cli/0.1.0/reference#groupi-groups-application-history

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi groups application-history [options] <group-id>

Read your retained private application history

Options:
  --limit <number>   Page size (1–100) (default: "20")
  --cursor <cursor>  Continue a page
  --all              Retrieve every page deliberately
  -h, --help         display help for command
```

## groupi groups applications
Canonical passage: /cli/0.1.0/reference#groupi-groups-applications

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi groups applications [options] <group-id>

Review private Group applications as manager

Options:
  --limit <number>   Page size (1–100) (default: "20")
  --cursor <cursor>  Continue a page
  --all              Retrieve every page deliberately
  --status <status>  PENDING, WITHDRAWN, APPROVED or DECLINED
  -h, --help         display help for command
```

## groupi groups application-settings
Canonical passage: /cli/0.1.0/reference#groupi-groups-application-settings

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi groups application-settings [options] <group-id>

Configure Group applications as owner

Options:
  --enabled <boolean>  true or false
  --questions <json>   JSON admission question array
  -h, --help           display help for command
```

## groupi groups apply
Canonical passage: /cli/0.1.0/reference#groupi-groups-apply

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi groups apply [options] <group-id>

Apply for Group membership

Options:
  --answers <json>  JSON answer object
  -h, --help        display help for command
```

## groupi groups application-edit
Canonical passage: /cli/0.1.0/reference#groupi-groups-application-edit

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi groups application-edit [options] <group-id> <application-id>

Edit your pending saved answers

Options:
  --answers <json>  JSON answer object
  -h, --help        display help for command
```

## groupi groups application-withdraw
Canonical passage: /cli/0.1.0/reference#groupi-groups-application-withdraw

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi groups application-withdraw [options] <group-id> <application-id>

Withdraw your pending application

Options:
  --yes       Confirm application resolution
  -h, --help  display help for command
```

## groupi groups application-review
Canonical passage: /cli/0.1.0/reference#groupi-groups-application-review

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi groups application-review [options] <group-id> <application-id>

Record an application decision as current manager

Options:
  --decision <decision>  APPROVED or DECLINED
  --yes                  Confirm application resolution
  -h, --help             display help for command
```

## groupi groups events
Canonical passage: /cli/0.1.0/reference#groupi-groups-events

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi groups events [options] <group-id>

Page safe upcoming/undated shared Events; no participation effects

Options:
  --limit <number>   Association scan page size (1–100) (default: "20")
  --cursor <cursor>  Continue even an empty page
  --all              Retrieve every page deliberately
  -h, --help         display help for command
```

## groupi groups withdraw-event
Canonical passage: /cli/0.1.0/reference#groupi-groups-withdraw-event

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi groups withdraw-event [options] <group-id> <event-id>

Withdraw only this Group audience as current Group manager

Options:
  --yes       Confirm withdrawal
  -h, --help  display help for command
```

## groupi groups event-sharing
Canonical passage: /cli/0.1.0/reference#groupi-groups-event-sharing

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi groups event-sharing [options] <group-id>

Owner sets managers-only (default) or all eligible members sharing

Options:
  --policy <policy>  MANAGERS or MEMBERS
  -h, --help         display help for command
```

## groupi group-invites
Canonical passage: /cli/0.1.0/reference#groupi-group-invites

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi group-invites [options] [command]

Inspect and respond to your private Group invitations

Options:
  -h, --help                     display help for command

Commands:
  list [options]                 List your own Group invitation states
  accept <invite-id>             accept your Group invitation
  decline [options] <invite-id>  decline your Group invitation
  cancel [options] <invite-id>   Cancel a pending invitation as Group manager
  help [command]                 display help for command
```

## groupi group-invites list
Canonical passage: /cli/0.1.0/reference#groupi-group-invites-list

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi group-invites list [options]

List your own Group invitation states

Options:
  --limit <number>   Page size (1–100) (default: "20")
  --cursor <cursor>  Continue a page
  --all              Retrieve every page deliberately
  --status <status>  PENDING, ACCEPTED, DECLINED or CANCELLED
  -h, --help         display help for command
```

## groupi group-invites accept
Canonical passage: /cli/0.1.0/reference#groupi-group-invites-accept

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi group-invites accept [options] <invite-id>

accept your Group invitation

Options:
  -h, --help  display help for command
```

## groupi group-invites decline
Canonical passage: /cli/0.1.0/reference#groupi-group-invites-decline

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi group-invites decline [options] <invite-id>

decline your Group invitation

Options:
  --yes       Confirm invitation resolution
  -h, --help  display help for command
```

## groupi group-invites cancel
Canonical passage: /cli/0.1.0/reference#groupi-group-invites-cancel

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi group-invites cancel [options] <invite-id>

Cancel a pending invitation as Group manager

Options:
  --yes       Confirm invitation resolution
  -h, --help  display help for command
```

## groupi account
Canonical passage: /cli/0.1.0/reference#groupi-account

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi account [options] [command]

Read/update your account and open explicit browser exceptions

Options:
  -h, --help                         display help for command

Commands:
  avatar                             Inspect, replace, or remove avatar images from local files
  get                                Read your selected identity’s profile
  edit [options]                     Update ordinary profile fields without browser interaction
  passkeys                           Explicitly open account settings; complete this action in the
                                     browser/device
  linked-accounts                    Explicitly open account settings; complete this action in the
                                     browser/device
  responsibilities [options]         Enumerate owned Groups or Events; pending offers remain
                                     unresolved
  readiness                          Read current resolution status; final deletion rechecks it
  delete-event [options] <event-id>  Explicitly resolve an Event by permanent deletion
  delete [options]                   Delete your resolved account and credentials; all owned Groups
                                     and Events must be resolved first
  help [command]                     display help for command
```

## groupi account avatar
Canonical passage: /cli/0.1.0/reference#groupi-account-avatar

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi account avatar [options] [command]

Inspect, replace, or remove avatar images from local files

Options:
  -h, --help        display help for command

Commands:
  get
  set [options]
  remove [options]
  help [command]    display help for command
```

## groupi account avatar get
Canonical passage: /cli/0.1.0/reference#groupi-account-avatar-get

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi account avatar get [options]

Options:
  -h, --help  display help for command
```

## groupi account avatar set
Canonical passage: /cli/0.1.0/reference#groupi-account-avatar-set

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi account avatar set [options]

Options:
  --file <path>  Local JPEG, PNG, GIF, WebP, or SVG image, at most 10 MiB
  -h, --help     display help for command
```

## groupi account avatar remove
Canonical passage: /cli/0.1.0/reference#groupi-account-avatar-remove

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi account avatar remove [options]

Options:
  --yes       Confirm removing this image
  -h, --help  display help for command
```

## groupi account get
Canonical passage: /cli/0.1.0/reference#groupi-account-get

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi account get [options]

Read your selected identity’s profile

Options:
  -h, --help  display help for command
```

## groupi account edit
Canonical passage: /cli/0.1.0/reference#groupi-account-edit

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi account edit [options]

Update ordinary profile fields without browser interaction

Options:
  --name <text>      Display name
  --username <text>  Unique username
  --bio <text>       Bio; empty text clears it
  --pronouns <text>  Pronouns; empty text clears them
  -h, --help         display help for command
```

## groupi account passkeys
Canonical passage: /cli/0.1.0/reference#groupi-account-passkeys

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi account passkeys [options]

Explicitly open account settings; complete this action in the browser/device

Options:
  -h, --help  display help for command
```

## groupi account linked-accounts
Canonical passage: /cli/0.1.0/reference#groupi-account-linked-accounts

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi account linked-accounts [options]

Explicitly open account settings; complete this action in the browser/device

Options:
  -h, --help  display help for command
```

## groupi account responsibilities
Canonical passage: /cli/0.1.0/reference#groupi-account-responsibilities

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi account responsibilities [options]

Enumerate owned Groups or Events; pending offers remain unresolved

Options:
  --kind <kind>      GROUP or EVENT
  --limit <number>   Page size (1–100) (default: "20")
  --cursor <cursor>  Continue a page
  --all              Enumerate every page
  -h, --help         display help for command
```

## groupi account readiness
Canonical passage: /cli/0.1.0/reference#groupi-account-readiness

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi account readiness [options]

Read current resolution status; final deletion rechecks it

Options:
  -h, --help  display help for command
```

## groupi account delete-event
Canonical passage: /cli/0.1.0/reference#groupi-account-delete-event

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi account delete-event [options] <event-id>

Explicitly resolve an Event by permanent deletion

Options:
  --yes       Confirm permanent Event deletion
  -h, --help  display help for command
```

## groupi account delete
Canonical passage: /cli/0.1.0/reference#groupi-account-delete

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi account delete [options]

Delete your resolved account and credentials; all owned Groups and Events must be resolved first

Options:
  --confirm-username <username>  Current username confirmation
  --yes                          Confirm permanent account deletion
  -h, --help                     display help for command
```

## groupi settings
Canonical passage: /cli/0.1.0/reference#groupi-settings

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi settings [options] [command]

Manage ordinary preferences without a browser

Options:
  -h, --help      display help for command

Commands:
  privacy         Who may send friend requests and event invitations
  notifications   Notification delivery methods and per-type settings
  theme           Saved theme and system light/dark preferences
  help [command]  display help for command
```

## groupi settings privacy
Canonical passage: /cli/0.1.0/reference#groupi-settings-privacy

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi settings privacy [options] [command]

Who may send friend requests and event invitations

Options:
  -h, --help      display help for command

Commands:
  get
  set [options]
  help [command]  display help for command
```

## groupi settings privacy get
Canonical passage: /cli/0.1.0/reference#groupi-settings-privacy-get

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi settings privacy get [options]

Options:
  -h, --help  display help for command
```

## groupi settings privacy set
Canonical passage: /cli/0.1.0/reference#groupi-settings-privacy-set

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi settings privacy set [options]

Options:
  --friend-requests <permission>  EVERYONE, EVENT_MEMBERS, or NO_ONE
  --group-invites <permission>    EVERYONE, FRIENDS, or NO_ONE
  --event-invites <permission>    EVERYONE, EVENT_MEMBERS, FRIENDS, or NO_ONE
  -h, --help                      display help for command
```

## groupi settings notifications
Canonical passage: /cli/0.1.0/reference#groupi-settings-notifications

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi settings notifications [options] [command]

Notification delivery methods and per-type settings

Options:
  -h, --help      display help for command

Commands:
  get
  set [options]
  help [command]  display help for command
```

## groupi settings notifications get
Canonical passage: /cli/0.1.0/reference#groupi-settings-notifications-get

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi settings notifications get [options]

Options:
  -h, --help  display help for command
```

## groupi settings notifications set
Canonical passage: /cli/0.1.0/reference#groupi-settings-notifications-set

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi settings notifications set [options]

Options:
  --data <json>  JSON object with notificationMethods array; omitted methods are deleted
  --yes          Confirm replacing methods and removing omitted methods
  -h, --help     display help for command
```

## groupi settings theme
Canonical passage: /cli/0.1.0/reference#groupi-settings-theme

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi settings theme [options] [command]

Saved theme and system light/dark preferences

Options:
  -h, --help      display help for command

Commands:
  get
  set [options]
  help [command]  display help for command
```

## groupi settings theme get
Canonical passage: /cli/0.1.0/reference#groupi-settings-theme-get

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi settings theme get [options]

Options:
  -h, --help  display help for command
```

## groupi settings theme set
Canonical passage: /cli/0.1.0/reference#groupi-settings-theme-set

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi settings theme set [options]

Options:
  --data <json>  JSON with selectedThemeType, selectedThemeId, useSystemPreference,
                 systemLightThemeId, systemDarkThemeId; selectedCustomThemeId optional
  -h, --help     display help for command
```

## groupi posts
Canonical passage: /cli/0.1.0/reference#groupi-posts

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi posts [options] [command]

Read/write safe discussion content; use explicit HTML files to preserve rich formatting on edits

Options:
  -h, --help                  display help for command

Commands:
  list [options] <parent-id>
  get <id>                    Read full original HTML and attachment metadata; JSON preserves
                              formatting for editing
  create [options] <id>       Create atomically in the event/post ID
  edit [options] <id>         Edit only supplied fields; omitted rich content is preserved
  delete [options] <id>
  attachments                 Inspect/remove attachment metadata on accessible parent content
  mute <post-id>              Mute discussion notifications
  unmute <post-id>            Unmute discussion notifications
  mute-status <post-id>       Inspect discussion notifications
  help [command]              display help for command
```

## groupi posts list
Canonical passage: /cli/0.1.0/reference#groupi-posts-list

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi posts list [options] <parent-id>

Options:
  --limit <n>        Page size, 1–100 (default: "20")
  --cursor <cursor>
  --all              Explicitly retrieve all pages
  -h, --help         display help for command
```

## groupi posts get
Canonical passage: /cli/0.1.0/reference#groupi-posts-get

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi posts get [options] <id>

Read full original HTML and attachment metadata; JSON preserves formatting for editing

Options:
  -h, --help  display help for command
```

## groupi posts create
Canonical passage: /cli/0.1.0/reference#groupi-posts-create

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi posts create [options] <id>

Create atomically in the event/post ID

Options:
  --content <text>
  --file <path>                Read UTF-8 content file
  --stdin                      Read UTF-8 content from stdin
  --content-format <format>    text, markdown, or explicit html (default: "text")
  --attach <path...>           Upload local files before atomic publication
  --remove-attachment <id...>  Remove attachment IDs while editing
  --yes                        Confirm attachment removal
  --title <text>
  -h, --help                   display help for command
```

## groupi posts edit
Canonical passage: /cli/0.1.0/reference#groupi-posts-edit

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi posts edit [options] <id>

Edit only supplied fields; omitted rich content is preserved

Options:
  --content <text>
  --file <path>                Read UTF-8 content file
  --stdin                      Read UTF-8 content from stdin
  --content-format <format>    text, markdown, or explicit html (default: "text")
  --attach <path...>           Upload local files before atomic publication
  --remove-attachment <id...>  Remove attachment IDs while editing
  --yes                        Confirm attachment removal
  --title <text>
  -h, --help                   display help for command
```

## groupi posts delete
Canonical passage: /cli/0.1.0/reference#groupi-posts-delete

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi posts delete [options] <id>

Options:
  --yes       Confirm deletion
  -h, --help  display help for command
```

## groupi posts attachments
Canonical passage: /cli/0.1.0/reference#groupi-posts-attachments

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi posts attachments [options] [command]

Inspect/remove attachment metadata on accessible parent content

Options:
  -h, --help                             display help for command

Commands:
  list <id>
  remove [options] <id> <attachment-id>
  help [command]                         display help for command
```

## groupi posts attachments list
Canonical passage: /cli/0.1.0/reference#groupi-posts-attachments-list

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi posts attachments list [options] <id>

Options:
  -h, --help  display help for command
```

## groupi posts attachments remove
Canonical passage: /cli/0.1.0/reference#groupi-posts-attachments-remove

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi posts attachments remove [options] <id> <attachment-id>

Options:
  --yes       Confirm removal
  -h, --help  display help for command
```

## groupi posts mute
Canonical passage: /cli/0.1.0/reference#groupi-posts-mute

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi posts mute [options] <post-id>

Mute discussion notifications

Options:
  -h, --help  display help for command
```

## groupi posts unmute
Canonical passage: /cli/0.1.0/reference#groupi-posts-unmute

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi posts unmute [options] <post-id>

Unmute discussion notifications

Options:
  -h, --help  display help for command
```

## groupi posts mute-status
Canonical passage: /cli/0.1.0/reference#groupi-posts-mute-status

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi posts mute-status [options] <post-id>

Inspect discussion notifications

Options:
  -h, --help  display help for command
```

## groupi replies
Canonical passage: /cli/0.1.0/reference#groupi-replies

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi replies [options] [command]

Read/write safe discussion content; use explicit HTML files to preserve rich formatting on edits

Options:
  -h, --help                  display help for command

Commands:
  list [options] <parent-id>
  get <id>                    Read full original HTML and attachment metadata; JSON preserves
                              formatting for editing
  create [options] <id>       Create atomically in the event/post ID
  edit [options] <id>         Edit only supplied fields; omitted rich content is preserved
  delete [options] <id>
  attachments                 Inspect/remove attachment metadata on accessible parent content
  help [command]              display help for command
```

## groupi replies list
Canonical passage: /cli/0.1.0/reference#groupi-replies-list

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi replies list [options] <parent-id>

Options:
  --limit <n>        Page size, 1–100 (default: "20")
  --cursor <cursor>
  --all              Explicitly retrieve all pages
  -h, --help         display help for command
```

## groupi replies get
Canonical passage: /cli/0.1.0/reference#groupi-replies-get

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi replies get [options] <id>

Read full original HTML and attachment metadata; JSON preserves formatting for editing

Options:
  -h, --help  display help for command
```

## groupi replies create
Canonical passage: /cli/0.1.0/reference#groupi-replies-create

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi replies create [options] <id>

Create atomically in the event/post ID

Options:
  --content <text>
  --file <path>                Read UTF-8 content file
  --stdin                      Read UTF-8 content from stdin
  --content-format <format>    text, markdown, or explicit html (default: "text")
  --attach <path...>           Upload local files before atomic publication
  --remove-attachment <id...>  Remove attachment IDs while editing
  --yes                        Confirm attachment removal
  -h, --help                   display help for command
```

## groupi replies edit
Canonical passage: /cli/0.1.0/reference#groupi-replies-edit

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi replies edit [options] <id>

Edit only supplied fields; omitted rich content is preserved

Options:
  --content <text>
  --file <path>                Read UTF-8 content file
  --stdin                      Read UTF-8 content from stdin
  --content-format <format>    text, markdown, or explicit html (default: "text")
  --attach <path...>           Upload local files before atomic publication
  --remove-attachment <id...>  Remove attachment IDs while editing
  --yes                        Confirm attachment removal
  -h, --help                   display help for command
```

## groupi replies delete
Canonical passage: /cli/0.1.0/reference#groupi-replies-delete

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi replies delete [options] <id>

Options:
  --yes       Confirm deletion
  -h, --help  display help for command
```

## groupi replies attachments
Canonical passage: /cli/0.1.0/reference#groupi-replies-attachments

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi replies attachments [options] [command]

Inspect/remove attachment metadata on accessible parent content

Options:
  -h, --help                             display help for command

Commands:
  list <id>
  remove [options] <id> <attachment-id>
  help [command]                         display help for command
```

## groupi replies attachments list
Canonical passage: /cli/0.1.0/reference#groupi-replies-attachments-list

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi replies attachments list [options] <id>

Options:
  -h, --help  display help for command
```

## groupi replies attachments remove
Canonical passage: /cli/0.1.0/reference#groupi-replies-attachments-remove

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi replies attachments remove [options] <id> <attachment-id>

Options:
  --yes       Confirm removal
  -h, --help  display help for command
```

## groupi invites
Canonical passage: /cli/0.1.0/reference#groupi-invites

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi invites [options] [command]

Manage bearer link/email and recipient-bound username invitations

Options:
  -h, --help      display help for command

Commands:
  links           Create, inspect and manage link/email bearer invitations
  email           Create email bearer invitations and queue delivery
  members         Send and respond to recipient-bound username invitations
  help [command]  display help for command
```

## groupi invites links
Canonical passage: /cli/0.1.0/reference#groupi-invites-links

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi invites links [options] [command]

Create, inspect and manage link/email bearer invitations

Options:
  -h, --help                    display help for command

Commands:
  create [options] <event-id>   Create a shareable bearer invitation
  edit [options] <invite-id>    Change an invitation label, access limit, or expiry; requires
                                confirmation
  accept [options] <token>
  revoke [options] <invite-id>
  get <token>                   Inspect the invitation using the selected identity
  list [options] <event-id>     List all bearer invitations, including email invitations
  help [command]                display help for command
```

## groupi invites links create
Canonical passage: /cli/0.1.0/reference#groupi-invites-links-create

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi invites links create [options] <event-id>

Create a shareable bearer invitation

Options:
  --name <name>      Invitation label
  --uses <number>    Maximum uses (at least 1)
  --expires <iso>    Expiry with explicit UTC offset or Z
  --request-id <id>  Reuse the identifier and original inputs after an uncertain attempt
  -h, --help         display help for command
```

## groupi invites links edit
Canonical passage: /cli/0.1.0/reference#groupi-invites-links-edit

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi invites links edit [options] <invite-id>

Change an invitation label, access limit, or expiry; requires confirmation

Options:
  --name <name>    New invitation label
  --uses <number>  New maximum uses (1–10000)
  --unlimited      Remove the usage limit
  --expires <iso>  New future expiry with explicit offset or Z
  --no-expiry      Remove the expiry
  --yes            Confirm changing this invitation
  -h, --help       display help for command
```

## groupi invites links accept
Canonical passage: /cli/0.1.0/reference#groupi-invites-links-accept

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi invites links accept [options] <token>

Options:
  --yes       Confirm revoking this invitation
  -h, --help  display help for command
```

## groupi invites links revoke
Canonical passage: /cli/0.1.0/reference#groupi-invites-links-revoke

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi invites links revoke [options] <invite-id>

Options:
  --yes       Confirm revoking this invitation
  -h, --help  display help for command
```

## groupi invites links get
Canonical passage: /cli/0.1.0/reference#groupi-invites-links-get

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi invites links get [options] <token>

Inspect the invitation using the selected identity

Options:
  -h, --help  display help for command
```

## groupi invites links list
Canonical passage: /cli/0.1.0/reference#groupi-invites-links-list

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi invites links list [options] <event-id>

List all bearer invitations, including email invitations

Options:
  --limit <number>   Page size (1–100) (default: "20")
  --cursor <cursor>  Continue a previous page
  --all              Retrieve all pages explicitly
  --kind <kind>      Filter bearer invitation kind (choices: "link", "email", "all")
  -h, --help         display help for command
```

## groupi invites email
Canonical passage: /cli/0.1.0/reference#groupi-invites-email

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi invites email [options] [command]

Create email bearer invitations and queue delivery

Options:
  -h, --help                         display help for command

Commands:
  send [options] <event-id>
  send-pending [options] <event-id>  Queue unsent email invitations once per request ID
  help [command]                     display help for command
```

## groupi invites email send
Canonical passage: /cli/0.1.0/reference#groupi-invites-email-send

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi invites email send [options] <event-id>

Options:
  --invites <json>   Array of {email,recipientName?,plusOnes?}
  --message <text>   Message included with email invitations
  --expires <iso>    Expiry with explicit offset or Z
  --no-send          Create the batch without queuing any new or existing pending email
  --request-id <id>  Reuse a prior request ID with identical inputs
  -h, --help         display help for command
```

## groupi invites email send-pending
Canonical passage: /cli/0.1.0/reference#groupi-invites-email-send-pending

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi invites email send-pending [options] <event-id>

Queue unsent email invitations once per request ID

Options:
  --request-id <id>  Reuse a prior request ID
  -h, --help         display help for command
```

## groupi invites members
Canonical passage: /cli/0.1.0/reference#groupi-invites-members

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi invites members [options] [command]

Send and respond to recipient-bound username invitations

Options:
  -h, --help                     display help for command

Commands:
  send [options] <event-id>
  accept [options] <invite-id>
  decline [options] <invite-id>
  revoke [options] <invite-id>
  get <invite-id>                Inspect the invitation using the selected identity
  list [options] [event-id]      List received pending invitations, or invitations sent for an event
  help [command]                 display help for command
```

## groupi invites members send
Canonical passage: /cli/0.1.0/reference#groupi-invites-members-send

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi invites members send [options] <event-id>

Options:
  --username <username>  Recipient username without @
  --role <role>          Granted event role (choices: "ATTENDEE", "MODERATOR")
  --message <text>       Invitation message
  --request-id <id>      Reuse a prior request ID with identical inputs
  -h, --help             display help for command
```

## groupi invites members accept
Canonical passage: /cli/0.1.0/reference#groupi-invites-members-accept

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi invites members accept [options] <invite-id>

Options:
  --yes       Confirm declining or revoking this invitation
  -h, --help  display help for command
```

## groupi invites members decline
Canonical passage: /cli/0.1.0/reference#groupi-invites-members-decline

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi invites members decline [options] <invite-id>

Options:
  --yes       Confirm declining or revoking this invitation
  -h, --help  display help for command
```

## groupi invites members revoke
Canonical passage: /cli/0.1.0/reference#groupi-invites-members-revoke

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi invites members revoke [options] <invite-id>

Options:
  --yes       Confirm declining or revoking this invitation
  -h, --help  display help for command
```

## groupi invites members get
Canonical passage: /cli/0.1.0/reference#groupi-invites-members-get

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi invites members get [options] <invite-id>

Inspect the invitation using the selected identity

Options:
  -h, --help  display help for command
```

## groupi invites members list
Canonical passage: /cli/0.1.0/reference#groupi-invites-members-list

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi invites members list [options] [event-id]

List received pending invitations, or invitations sent for an event

Options:
  --limit <number>   Page size (1–100) (default: "20")
  --cursor <cursor>  Continue a previous page
  --all              Retrieve all pages explicitly
  --status <status>  Status filter; received defaults to PENDING, event list to all (choices:
                     "PENDING", "ACCEPTED", "DECLINED", "all")
  -h, --help         display help for command
```

## groupi invite-lists
Canonical passage: /cli/0.1.0/reference#groupi-invite-lists

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi invite-lists [options] [command]

Create and inspect private saved selections of existing people

Options:
  -h, --help                  display help for command

Commands:
  create [options]            Save people privately; sends no invitations or notifications
  list                        Browse all owned lists (up to 100), including Needs attention status
  get <list-id>               Inspect current people; missing profiles are anonymous and all-missing
                              lists Need attention
  edit [options] <list-id>    Rename a private list or replace its saved people without sending
                              invitations
  delete [options] <list-id>  Delete a private list; requires confirmation and leaves prior
                              invitations unchanged
  invite [options] <list-id>  Explicitly invite current people with 24-hour recovery; repair Needs
                              attention lists before a fresh send
  people [options]            Find existing selectable people without an event; friendship is
                              optional
  help [command]              display help for command
```

## groupi invite-lists create
Canonical passage: /cli/0.1.0/reference#groupi-invite-lists-create

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi invite-lists create [options]

Save people privately; sends no invitations or notifications

Options:
  --name <name>        Creator-unique list name, 1–100 trimmed characters
  --person-ids <json>  JSON array of 1–100 distinct existing person IDs
  -h, --help           display help for command
```

## groupi invite-lists list
Canonical passage: /cli/0.1.0/reference#groupi-invite-lists-list

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi invite-lists list [options]

Browse all owned lists (up to 100), including Needs attention status

Options:
  -h, --help  display help for command
```

## groupi invite-lists get
Canonical passage: /cli/0.1.0/reference#groupi-invite-lists-get

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi invite-lists get [options] <list-id>

Inspect current people; missing profiles are anonymous and all-missing lists Need attention

Options:
  -h, --help  display help for command
```

## groupi invite-lists edit
Canonical passage: /cli/0.1.0/reference#groupi-invite-lists-edit

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi invite-lists edit [options] <list-id>

Rename a private list or replace its saved people without sending invitations

Options:
  --name <name>        New creator-unique name, 1–100 trimmed characters
  --person-ids <json>  Replace people with 1–100 distinct IDs; include an existing person to repair
                       Needs attention
  -h, --help           display help for command
```

## groupi invite-lists delete
Canonical passage: /cli/0.1.0/reference#groupi-invite-lists-delete

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi invite-lists delete [options] <list-id>

Delete a private list; requires confirmation and leaves prior invitations unchanged

Options:
  --yes       Confirm deleting this private invite list
  -h, --help  display help for command
```

## groupi invite-lists invite
Canonical passage: /cli/0.1.0/reference#groupi-invite-lists-invite

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi invite-lists invite [options] <list-id>

Explicitly invite current people with 24-hour recovery; repair Needs attention lists before a fresh
send

Options:
  --event <event-id>  Target event; requires existing event invitation permission
  --role <role>       Common event role; MODERATOR is organizer-only (choices: "ATTENDEE",
                      "MODERATOR", default: "ATTENDEE")
  --message <text>    Common invitation message, at most 480 characters
  --request-id <id>   Retain and reuse this identifier with original inputs after an uncertain send
  -h, --help          display help for command
```

## groupi invite-lists people
Canonical passage: /cli/0.1.0/reference#groupi-invite-lists-people

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi invite-lists people [options]

Find existing selectable people without an event; friendship is optional

Options:
  --search <username>  Username search, at least 2 trimmed characters
  --friends            List accepted friends as convenient choices
  -h, --help           display help for command
```

## groupi notifications
Canonical passage: /cli/0.1.0/reference#groupi-notifications

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi notifications [options] [command]

Read and clear your notifications

Options:
  -h, --help                         display help for command

Commands:
  list [options]                     List notifications (default 20, newest first)
  count                              Show unread count
  read <notification-id>
  unread <notification-id>
  read-all
  read-event <event-id>
  read-post <post-id>
  clear [options] <notification-id>
  clear-all [options]
  help [command]                     display help for command
```

## groupi notifications list
Canonical passage: /cli/0.1.0/reference#groupi-notifications-list

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi notifications list [options]

List notifications (default 20, newest first)

Options:
  --unread           Only unread notifications
  --limit <number>   Page size (1–100) (default: "20")
  --cursor <cursor>  Continue a previous page
  --all              Retrieve every page deliberately
  -h, --help         display help for command
```

## groupi notifications count
Canonical passage: /cli/0.1.0/reference#groupi-notifications-count

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi notifications count [options]

Show unread count

Options:
  -h, --help  display help for command
```

## groupi notifications read
Canonical passage: /cli/0.1.0/reference#groupi-notifications-read

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi notifications read [options] <notification-id>

Options:
  -h, --help  display help for command
```

## groupi notifications unread
Canonical passage: /cli/0.1.0/reference#groupi-notifications-unread

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi notifications unread [options] <notification-id>

Options:
  -h, --help  display help for command
```

## groupi notifications read-all
Canonical passage: /cli/0.1.0/reference#groupi-notifications-read-all

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi notifications read-all [options]

Options:
  -h, --help  display help for command
```

## groupi notifications read-event
Canonical passage: /cli/0.1.0/reference#groupi-notifications-read-event

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi notifications read-event [options] <event-id>

Options:
  -h, --help  display help for command
```

## groupi notifications read-post
Canonical passage: /cli/0.1.0/reference#groupi-notifications-read-post

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi notifications read-post [options] <post-id>

Options:
  -h, --help  display help for command
```

## groupi notifications clear
Canonical passage: /cli/0.1.0/reference#groupi-notifications-clear

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi notifications clear [options] <notification-id>

Options:
  --yes       Confirm permanently clearing notifications
  -h, --help  display help for command
```

## groupi notifications clear-all
Canonical passage: /cli/0.1.0/reference#groupi-notifications-clear-all

Generated @groupi/cli 0.1.0 command help. Source/local availability; registry release unverified.

```text
Usage: groupi notifications clear-all [options]

Options:
  --yes       Confirm permanently clearing notifications
  -h, --help  display help for command
```
