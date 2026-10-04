# Groupi command reference

Generated from @groupi/cli 0.1.0. Run `groupi --version` to verify the installed version.
Regenerate with `pnpm --filter @groupi/cli docs:generate`; CI checks for stale definitions.

Global options are inherited by commands. Live defaults can reflect `GROUPI_PROFILE`; this reference shows the packaged default.

## Table of Contents

- [groupi](#groupi)
- [groupi tui](#groupi-tui)
- [groupi auth](#groupi-auth)
- [groupi auth login](#groupi-auth-login)
- [groupi auth status](#groupi-auth-status)
- [groupi auth logout](#groupi-auth-logout)
- [groupi profile](#groupi-profile)
- [groupi profile add](#groupi-profile-add)
- [groupi events](#groupi-events)
- [groupi events create](#groupi-events-create)
- [groupi events edit](#groupi-events-edit)
- [groupi events list](#groupi-events-list)
- [groupi events get](#groupi-events-get)
- [groupi events mute](#groupi-events-mute)
- [groupi events unmute](#groupi-events-unmute)
- [groupi events mute-status](#groupi-events-mute-status)
- [groupi events rsvp](#groupi-events-rsvp)
- [groupi events rsvp get](#groupi-events-rsvp-get)
- [groupi events rsvp set](#groupi-events-rsvp-set)
- [groupi events availability](#groupi-events-availability)
- [groupi events availability set](#groupi-events-availability-set)
- [groupi events availability clear](#groupi-events-availability-clear)
- [groupi events availability get](#groupi-events-availability-get)
- [groupi events availability responses](#groupi-events-availability-responses)
- [groupi events dates](#groupi-events-dates)
- [groupi events dates choose](#groupi-events-dates-choose)
- [groupi events dates reset](#groupi-events-dates-reset)
- [groupi events dates list](#groupi-events-dates-list)
- [groupi events members](#groupi-events-members)
- [groupi events cover](#groupi-events-cover)
- [groupi events cover get](#groupi-events-cover-get)
- [groupi events cover set](#groupi-events-cover-set)
- [groupi events cover remove](#groupi-events-cover-remove)
- [groupi events transfer](#groupi-events-transfer)
- [groupi events transfer status](#groupi-events-transfer-status)
- [groupi events transfer offer](#groupi-events-transfer-offer)
- [groupi events transfer accept](#groupi-events-transfer-accept)
- [groupi events transfer decline](#groupi-events-transfer-decline)
- [groupi events transfer cancel](#groupi-events-transfer-cancel)
- [groupi events preview](#groupi-events-preview)
- [groupi events discover](#groupi-events-discover)
- [groupi events join](#groupi-events-join)
- [groupi events leave](#groupi-events-leave)
- [groupi events delete](#groupi-events-delete)
- [groupi events membership](#groupi-events-membership)
- [groupi events membership role](#groupi-events-membership-role)
- [groupi events membership remove](#groupi-events-membership-remove)
- [groupi events settings](#groupi-events-settings)
- [groupi events settings get](#groupi-events-settings-get)
- [groupi events settings set](#groupi-events-settings-set)
- [groupi discord](#groupi-discord)
- [groupi discord guilds](#groupi-discord-guilds)
- [groupi discord guilds list](#groupi-discord-guilds-list)
- [groupi discord guilds refresh](#groupi-discord-guilds-refresh)
- [groupi addons](#groupi-addons)
- [groupi addons definitions](#groupi-addons-definitions)
- [groupi addons definitions create](#groupi-addons-definitions-create)
- [groupi addons definitions import](#groupi-addons-definitions-import)
- [groupi addons definitions get](#groupi-addons-definitions-get)
- [groupi addons definitions export](#groupi-addons-definitions-export)
- [groupi addons definitions list](#groupi-addons-definitions-list)
- [groupi addons definitions edit](#groupi-addons-definitions-edit)
- [groupi addons definitions publish](#groupi-addons-definitions-publish)
- [groupi addons definitions unpublish](#groupi-addons-definitions-unpublish)
- [groupi addons definitions delete](#groupi-addons-definitions-delete)
- [groupi addons get](#groupi-addons-get)
- [groupi addons list](#groupi-addons-list)
- [groupi addons templates](#groupi-addons-templates)
- [groupi addons enable](#groupi-addons-enable)
- [groupi addons configure](#groupi-addons-configure)
- [groupi addons disable](#groupi-addons-disable)
- [groupi addons data](#groupi-addons-data)
- [groupi addons respond](#groupi-addons-respond)
- [groupi addons claim](#groupi-addons-claim)
- [groupi addons vote](#groupi-addons-vote)
- [groupi addons toggle](#groupi-addons-toggle)
- [groupi addons execute](#groupi-addons-execute)
- [groupi addons opt-in](#groupi-addons-opt-in)
- [groupi addons opt-out](#groupi-addons-opt-out)
- [groupi addons clear-response](#groupi-addons-clear-response)
- [groupi addons clear-claims](#groupi-addons-clear-claims)
- [groupi friends](#groupi-friends)
- [groupi friends list](#groupi-friends-list)
- [groupi friends incoming](#groupi-friends-incoming)
- [groupi friends outgoing](#groupi-friends-outgoing)
- [groupi friends status](#groupi-friends-status)
- [groupi friends request](#groupi-friends-request)
- [groupi friends accept](#groupi-friends-accept)
- [groupi friends decline](#groupi-friends-decline)
- [groupi friends cancel](#groupi-friends-cancel)
- [groupi friends remove](#groupi-friends-remove)
- [groupi blocks](#groupi-blocks)
- [groupi blocks list](#groupi-blocks-list)
- [groupi blocks status](#groupi-blocks-status)
- [groupi blocks block](#groupi-blocks-block)
- [groupi blocks unblock](#groupi-blocks-unblock)
- [groupi groups](#groupi-groups)
- [groupi groups list](#groupi-groups-list)
- [groupi groups get](#groupi-groups-get)
- [groupi groups create](#groupi-groups-create)
- [groupi groups edit](#groupi-groups-edit)
- [groupi groups delete](#groupi-groups-delete)
- [groupi account](#groupi-account)
- [groupi account avatar](#groupi-account-avatar)
- [groupi account avatar get](#groupi-account-avatar-get)
- [groupi account avatar set](#groupi-account-avatar-set)
- [groupi account avatar remove](#groupi-account-avatar-remove)
- [groupi account get](#groupi-account-get)
- [groupi account edit](#groupi-account-edit)
- [groupi account passkeys](#groupi-account-passkeys)
- [groupi account linked-accounts](#groupi-account-linked-accounts)
- [groupi account delete](#groupi-account-delete)
- [groupi settings](#groupi-settings)
- [groupi settings privacy](#groupi-settings-privacy)
- [groupi settings privacy get](#groupi-settings-privacy-get)
- [groupi settings privacy set](#groupi-settings-privacy-set)
- [groupi settings notifications](#groupi-settings-notifications)
- [groupi settings notifications get](#groupi-settings-notifications-get)
- [groupi settings notifications set](#groupi-settings-notifications-set)
- [groupi settings theme](#groupi-settings-theme)
- [groupi settings theme get](#groupi-settings-theme-get)
- [groupi settings theme set](#groupi-settings-theme-set)
- [groupi posts](#groupi-posts)
- [groupi posts list](#groupi-posts-list)
- [groupi posts get](#groupi-posts-get)
- [groupi posts create](#groupi-posts-create)
- [groupi posts edit](#groupi-posts-edit)
- [groupi posts delete](#groupi-posts-delete)
- [groupi posts attachments](#groupi-posts-attachments)
- [groupi posts attachments list](#groupi-posts-attachments-list)
- [groupi posts attachments remove](#groupi-posts-attachments-remove)
- [groupi posts mute](#groupi-posts-mute)
- [groupi posts unmute](#groupi-posts-unmute)
- [groupi posts mute-status](#groupi-posts-mute-status)
- [groupi replies](#groupi-replies)
- [groupi replies list](#groupi-replies-list)
- [groupi replies get](#groupi-replies-get)
- [groupi replies create](#groupi-replies-create)
- [groupi replies edit](#groupi-replies-edit)
- [groupi replies delete](#groupi-replies-delete)
- [groupi replies attachments](#groupi-replies-attachments)
- [groupi replies attachments list](#groupi-replies-attachments-list)
- [groupi replies attachments remove](#groupi-replies-attachments-remove)
- [groupi invites](#groupi-invites)
- [groupi invites links](#groupi-invites-links)
- [groupi invites links create](#groupi-invites-links-create)
- [groupi invites links edit](#groupi-invites-links-edit)
- [groupi invites links accept](#groupi-invites-links-accept)
- [groupi invites links revoke](#groupi-invites-links-revoke)
- [groupi invites links get](#groupi-invites-links-get)
- [groupi invites links list](#groupi-invites-links-list)
- [groupi invites email](#groupi-invites-email)
- [groupi invites email send](#groupi-invites-email-send)
- [groupi invites email send-pending](#groupi-invites-email-send-pending)
- [groupi invites members](#groupi-invites-members)
- [groupi invites members send](#groupi-invites-members-send)
- [groupi invites members accept](#groupi-invites-members-accept)
- [groupi invites members decline](#groupi-invites-members-decline)
- [groupi invites members revoke](#groupi-invites-members-revoke)
- [groupi invites members get](#groupi-invites-members-get)
- [groupi invites members list](#groupi-invites-members-list)
- [groupi notifications](#groupi-notifications)
- [groupi notifications list](#groupi-notifications-list)
- [groupi notifications count](#groupi-notifications-count)
- [groupi notifications read](#groupi-notifications-read)
- [groupi notifications unread](#groupi-notifications-unread)
- [groupi notifications read-all](#groupi-notifications-read-all)
- [groupi notifications read-event](#groupi-notifications-read-event)
- [groupi notifications read-post](#groupi-notifications-read-post)
- [groupi notifications clear](#groupi-notifications-clear)
- [groupi notifications clear-all](#groupi-notifications-clear-all)

## groupi

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
  account            Read/update your account and open explicit browser exceptions
  settings           Manage ordinary preferences without a browser
  posts              Read/write safe discussion content; use explicit HTML files to preserve rich
                     formatting on edits
  replies            Read/write safe discussion content; use explicit HTML files to preserve rich
                     formatting on edits
  invites            Manage bearer link/email and recipient-bound username invitations
  notifications      Read and clear your notifications
```

## groupi tui

```text
Usage: groupi tui [options]

Open the keyboard-driven terminal interface

Options:
  -h, --help  display help for command
```

## groupi auth

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

```text
Usage: groupi auth status [options]

Verify the selected profile and account without revealing credentials

Options:
  -h, --help  display help for command
```

## groupi auth logout

```text
Usage: groupi auth logout [options]

Remove this profile’s saved credential; temporary keys are unchanged

Options:
  --revoke    Also revoke this saved key on the server before removing it
  -h, --help  display help for command
```

## groupi profile

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

```text
Usage: groupi profile add [options] <name>

Options:
  --api-url <url>  REST v2 API URL
  --web-url <url>  Authorization website origin for browser login
  -h, --help       display help for command
```

## groupi events

```text
Usage: groupi events [options] [command]

Browse and manage your events

Options:
  -h, --help                    display help for command

Commands:
  create [options]              Create an event with replay-safe request identification
  edit [options] <event-id>     Edit event details; uncertain writes are never retried automatically
  list [options]
  get <event-id>                Read one accessible event
  mute <event-id>               Mute event notifications
  unmute <event-id>             Unmute event notifications
  mute-status <event-id>        Inspect event notifications
  rsvp                          Read and update your own attendance response
  availability                  Provide your availability and inspect permitted responses
  dates                         Inspect proposed dates and manage the chosen date
  members [options] <event-id>  List attendance when event permissions allow
  cover                         Inspect, replace, or remove cover images from local files
  transfer                      Consensual Event ownership; Friends audience follows accepted new
                                Organizer
  preview <event-id>            Read safe event logistics and entry action without joining
  discover [options]            Browse upcoming friends events you can join
  join <event-id>               Join as an Attendee with Pending RSVP; confirm attendance separately
  leave [options] <event-id>    leave an event
  delete [options] <event-id>   delete an event
  membership                    Manage event member roles and removal; inspect using events members
  settings                      Inspect and update event visibility, admission and supported
                                permissions
  help [command]                display help for command
```

## groupi events create

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

```text
Usage: groupi events list [options]

Options:
  --limit <number>   Page size (1–100) (default: "20")
  --cursor <cursor>  Continue a previous page
  --all              Explicitly retrieve every page
  -h, --help         display help for command
```

## groupi events get

```text
Usage: groupi events get [options] <event-id>

Read one accessible event

Options:
  -h, --help  display help for command
```

## groupi events mute

```text
Usage: groupi events mute [options] <event-id>

Mute event notifications

Options:
  -h, --help  display help for command
```

## groupi events unmute

```text
Usage: groupi events unmute [options] <event-id>

Unmute event notifications

Options:
  -h, --help  display help for command
```

## groupi events mute-status

```text
Usage: groupi events mute-status [options] <event-id>

Inspect event notifications

Options:
  -h, --help  display help for command
```

## groupi events rsvp

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

```text
Usage: groupi events rsvp get [options] <event-id>

Options:
  -h, --help  display help for command
```

## groupi events rsvp set

```text
Usage: groupi events rsvp set [options] <event-id>

Options:
  --status <status>  RSVP response (choices: "YES", "MAYBE", "NO", "PENDING")
  --note <text>      Note (up to 200 characters); omitted or empty clears it
  -h, --help         display help for command
```

## groupi events availability

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

```text
Usage: groupi events availability set [options] <event-id>

Options:
  --responses <json>  Array of {potentialDateTimeId,status:YES|MAYBE|NO,note?}
  -h, --help          display help for command
```

## groupi events availability clear

```text
Usage: groupi events availability clear [options] <event-id>

Remove your availability responses and notes; RSVP is unchanged

Options:
  --yes       Confirm clearing your responses
  -h, --help  display help for command
```

## groupi events availability get

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

```text
Usage: groupi events dates reset [options] <event-id>

Clear the chosen date while preserving responses (organizer only)

Options:
  --yes       Confirm clearing the chosen date
  -h, --help  display help for command
```

## groupi events dates list

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

```text
Usage: groupi events cover get [options] <event-id>

Options:
  -h, --help  display help for command
```

## groupi events cover set

```text
Usage: groupi events cover set [options] <event-id>

Options:
  --file <path>       Local JPEG, PNG, GIF, WebP, or SVG image, at most 10 MiB
  --focal-x <number>  Horizontal focal point (0–1)
  --focal-y <number>  Vertical focal point (0–1)
  -h, --help          display help for command
```

## groupi events cover remove

```text
Usage: groupi events cover remove [options] <event-id>

Options:
  --yes       Confirm removing this image
  -h, --help  display help for command
```

## groupi events transfer

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

```text
Usage: groupi events transfer status [options] <event-id>

Inspect pending/resolved ownership

Options:
  -h, --help  display help for command
```

## groupi events transfer offer

```text
Usage: groupi events transfer offer [options] <event-id> <recipient-id>

offer the named ownership offer

Options:
  --yes       Confirm ownership action and Friends audience consequence
  -h, --help  display help for command
```

## groupi events transfer accept

```text
Usage: groupi events transfer accept [options] <event-id> <transfer-id>

accept the named ownership offer

Options:
  --yes       Confirm ownership action and Friends audience consequence
  -h, --help  display help for command
```

## groupi events transfer decline

```text
Usage: groupi events transfer decline [options] <event-id> <transfer-id>

decline the named ownership offer

Options:
  --yes       Confirm ownership action and Friends audience consequence
  -h, --help  display help for command
```

## groupi events transfer cancel

```text
Usage: groupi events transfer cancel [options] <event-id> <transfer-id>

cancel the named ownership offer

Options:
  --yes       Confirm ownership action and Friends audience consequence
  -h, --help  display help for command
```

## groupi events preview

```text
Usage: groupi events preview [options] <event-id>

Read safe event logistics and entry action without joining

Options:
  -h, --help  display help for command
```

## groupi events discover

```text
Usage: groupi events discover [options]

Browse upcoming friends events you can join

Options:
  --limit <number>   Page size (1–100) (default: "20")
  --cursor <cursor>  Continue a previous page
  --all              Retrieve every page explicitly
  -h, --help         display help for command
```

## groupi events join

```text
Usage: groupi events join [options] <event-id>

Join as an Attendee with Pending RSVP; confirm attendance separately

Options:
  -h, --help  display help for command
```

## groupi events leave

```text
Usage: groupi events leave [options] <event-id>

leave an event

Options:
  --yes       Confirm leave for the named event
  -h, --help  display help for command
```

## groupi events delete

```text
Usage: groupi events delete [options] <event-id>

delete an event

Options:
  --yes       Confirm delete for the named event
  -h, --help  display help for command
```

## groupi events membership

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

```text
Usage: groupi events membership role [options] <event-id> <member-id>

Options:
  --role <role>  New event role (choices: "MODERATOR", "ATTENDEE")
  --yes          Confirm role change for the named member
  -h, --help     display help for command
```

## groupi events membership remove

```text
Usage: groupi events membership remove [options] <event-id> <member-id>

Options:
  --yes       Confirm removal of the named member
  -h, --help  display help for command
```

## groupi events settings

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

```text
Usage: groupi events settings get [options] <event-id>

Options:
  -h, --help  display help for command
```

## groupi events settings set

```text
Usage: groupi events settings set [options] <event-id>

Options:
  --visibility <visibility>     Event visibility (choices: "PRIVATE", "FRIENDS", "PUBLIC")
  --admission-policy <policy>   Entry policy, independent of visibility (choices: "INVITATION_ONLY",
                                "DIRECT")
  --create-posts <level>        create-posts permission (choices: "EVERYONE", "MODERATOR",
                                "ORGANIZER")
  --invite-members <level>      invite-members permission (choices: "EVERYONE", "MODERATOR",
                                "ORGANIZER")
  --view-attendee-list <level>  view-attendee-list permission (choices: "EVERYONE", "MODERATOR",
                                "ORGANIZER")
  -h, --help                    display help for command
```

## groupi discord

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

```text
Usage: groupi discord guilds refresh [options]

Refresh your authorization cache from Discord (no event changes, no automatic retries)

Options:
  -h, --help  display help for command
```

## groupi addons

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

```text
Usage: groupi addons definitions create [options]

Import a portable definition as a new draft

Options:
  --file <path>  Read a portable definition JSON file (64 KiB maximum)
  --stdin        Read a portable definition from piped standard input
  -h, --help     display help for command
```

## groupi addons definitions import

```text
Usage: groupi addons definitions import [options]

Import a portable definition as a new draft

Options:
  --file <path>  Read a portable definition JSON file (64 KiB maximum)
  --stdin        Read a portable definition from piped standard input
  -h, --help     display help for command
```

## groupi addons definitions get

```text
Usage: groupi addons definitions get [options] <template-id>

Inspect your definition and its current version

Options:
  -h, --help  display help for command
```

## groupi addons definitions export

```text
Usage: groupi addons definitions export [options] <template-id>

Write portable definition JSON to stdout; excludes owner and lifecycle metadata

Options:
  -h, --help  display help for command
```

## groupi addons definitions list

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

```text
Usage: groupi addons definitions publish [options] <template-id>

publish your definition using its inspected version

Options:
  --expected-version <number>  Version returned by definitions get; rejects concurrent changes
  --yes                        Confirm definition replacement or lifecycle change
  -h, --help                   display help for command
```

## groupi addons definitions unpublish

```text
Usage: groupi addons definitions unpublish [options] <template-id>

unpublish your definition using its inspected version

Options:
  --expected-version <number>  Version returned by definitions get; rejects concurrent changes
  --yes                        Confirm definition replacement or lifecycle change
  -h, --help                   display help for command
```

## groupi addons definitions delete

```text
Usage: groupi addons definitions delete [options] <template-id>

delete your definition using its inspected version

Options:
  --expected-version <number>  Version returned by definitions get; rejects concurrent changes
  --yes                        Confirm definition replacement or lifecycle change
  -h, --help                   display help for command
```

## groupi addons get

```text
Usage: groupi addons get [options] <event-id> <addon-type>

Inspect enabled or disabled config

Options:
  -h, --help  display help for command
```

## groupi addons list

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

```text
Usage: groupi addons disable [options] <event-id> <addon-type>

disable an existing add-on

Options:
  --yes       Confirm config replacement, response reset, or disable
  -h, --help  display help for command
```

## groupi addons data

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

```text
Usage: groupi friends status [options] <person-id>

Inspect your relationship with a person

Options:
  -h, --help  display help for command
```

## groupi friends request

```text
Usage: groupi friends request [options] <person-id>

request social relationship

Options:
  -h, --help  display help for command
```

## groupi friends accept

```text
Usage: groupi friends accept [options] <friendship-id>

accept social relationship

Options:
  -h, --help  display help for command
```

## groupi friends decline

```text
Usage: groupi friends decline [options] <friendship-id>

decline social relationship

Options:
  --yes       Confirm this social change
  -h, --help  display help for command
```

## groupi friends cancel

```text
Usage: groupi friends cancel [options] <friendship-id>

cancel social relationship

Options:
  --yes       Confirm this social change
  -h, --help  display help for command
```

## groupi friends remove

```text
Usage: groupi friends remove [options] <friendship-id>

remove social relationship

Options:
  --yes       Confirm this social change
  -h, --help  display help for command
```

## groupi blocks

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

```text
Usage: groupi blocks status [options] <person-id>

Inspect your relationship with a person

Options:
  -h, --help  display help for command
```

## groupi blocks block

```text
Usage: groupi blocks block [options] <person-id>

block social relationship

Options:
  --yes       Confirm this social change
  -h, --help  display help for command
```

## groupi blocks unblock

```text
Usage: groupi blocks unblock [options] <person-id>

unblock social relationship

Options:
  --yes       Confirm this social change
  -h, --help  display help for command
```

## groupi groups

```text
Usage: groupi groups [options] [command]

Manage formal Group communities independently of events

Options:
  -h, --help                   display help for command

Commands:
  list [options]               List your admitted Groups
  get <group-id>               Read an admitted Group
  create [options]             Create an owner-only Group
  edit [options] <group-id>    Update Group identity as owner
  delete [options] <group-id>  Explicitly delete an owned Group
  help [command]               display help for command
```

## groupi groups list

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

```text
Usage: groupi groups get [options] <group-id>

Read an admitted Group

Options:
  -h, --help  display help for command
```

## groupi groups create

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

```text
Usage: groupi groups delete [options] <group-id>

Explicitly delete an owned Group

Options:
  --yes       Confirm Group deletion
  -h, --help  display help for command
```

## groupi account

```text
Usage: groupi account [options] [command]

Read/update your account and open explicit browser exceptions

Options:
  -h, --help       display help for command

Commands:
  avatar           Inspect, replace, or remove avatar images from local files
  get              Read your selected identity’s profile
  edit [options]   Update ordinary profile fields without browser interaction
  passkeys         Explicitly open account settings; complete this action in the browser/device
  linked-accounts  Explicitly open account settings; complete this action in the browser/device
  delete           Explicitly open account settings; complete this action in the browser/device
  help [command]   display help for command
```

## groupi account avatar

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

```text
Usage: groupi account avatar get [options]

Options:
  -h, --help  display help for command
```

## groupi account avatar set

```text
Usage: groupi account avatar set [options]

Options:
  --file <path>  Local JPEG, PNG, GIF, WebP, or SVG image, at most 10 MiB
  -h, --help     display help for command
```

## groupi account avatar remove

```text
Usage: groupi account avatar remove [options]

Options:
  --yes       Confirm removing this image
  -h, --help  display help for command
```

## groupi account get

```text
Usage: groupi account get [options]

Read your selected identity’s profile

Options:
  -h, --help  display help for command
```

## groupi account edit

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

```text
Usage: groupi account passkeys [options]

Explicitly open account settings; complete this action in the browser/device

Options:
  -h, --help  display help for command
```

## groupi account linked-accounts

```text
Usage: groupi account linked-accounts [options]

Explicitly open account settings; complete this action in the browser/device

Options:
  -h, --help  display help for command
```

## groupi account delete

```text
Usage: groupi account delete [options]

Explicitly open account settings; complete this action in the browser/device

Options:
  -h, --help  display help for command
```

## groupi settings

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

```text
Usage: groupi settings privacy get [options]

Options:
  -h, --help  display help for command
```

## groupi settings privacy set

```text
Usage: groupi settings privacy set [options]

Options:
  --friend-requests <permission>  EVERYONE, EVENT_MEMBERS, or NO_ONE
  --event-invites <permission>    EVERYONE, EVENT_MEMBERS, FRIENDS, or NO_ONE
  -h, --help                      display help for command
```

## groupi settings notifications

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

```text
Usage: groupi settings notifications get [options]

Options:
  -h, --help  display help for command
```

## groupi settings notifications set

```text
Usage: groupi settings notifications set [options]

Options:
  --data <json>  JSON object with notificationMethods array; omitted methods are deleted
  --yes          Confirm replacing methods and removing omitted methods
  -h, --help     display help for command
```

## groupi settings theme

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

```text
Usage: groupi settings theme get [options]

Options:
  -h, --help  display help for command
```

## groupi settings theme set

```text
Usage: groupi settings theme set [options]

Options:
  --data <json>  JSON with selectedThemeType, selectedThemeId, useSystemPreference,
                 systemLightThemeId, systemDarkThemeId; selectedCustomThemeId optional
  -h, --help     display help for command
```

## groupi posts

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

```text
Usage: groupi posts list [options] <parent-id>

Options:
  --limit <n>        Page size, 1–100 (default: "20")
  --cursor <cursor>
  --all              Explicitly retrieve all pages
  -h, --help         display help for command
```

## groupi posts get

```text
Usage: groupi posts get [options] <id>

Read full original HTML and attachment metadata; JSON preserves formatting for editing

Options:
  -h, --help  display help for command
```

## groupi posts create

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

```text
Usage: groupi posts delete [options] <id>

Options:
  --yes       Confirm deletion
  -h, --help  display help for command
```

## groupi posts attachments

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

```text
Usage: groupi posts attachments list [options] <id>

Options:
  -h, --help  display help for command
```

## groupi posts attachments remove

```text
Usage: groupi posts attachments remove [options] <id> <attachment-id>

Options:
  --yes       Confirm removal
  -h, --help  display help for command
```

## groupi posts mute

```text
Usage: groupi posts mute [options] <post-id>

Mute discussion notifications

Options:
  -h, --help  display help for command
```

## groupi posts unmute

```text
Usage: groupi posts unmute [options] <post-id>

Unmute discussion notifications

Options:
  -h, --help  display help for command
```

## groupi posts mute-status

```text
Usage: groupi posts mute-status [options] <post-id>

Inspect discussion notifications

Options:
  -h, --help  display help for command
```

## groupi replies

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

```text
Usage: groupi replies list [options] <parent-id>

Options:
  --limit <n>        Page size, 1–100 (default: "20")
  --cursor <cursor>
  --all              Explicitly retrieve all pages
  -h, --help         display help for command
```

## groupi replies get

```text
Usage: groupi replies get [options] <id>

Read full original HTML and attachment metadata; JSON preserves formatting for editing

Options:
  -h, --help  display help for command
```

## groupi replies create

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

```text
Usage: groupi replies delete [options] <id>

Options:
  --yes       Confirm deletion
  -h, --help  display help for command
```

## groupi replies attachments

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

```text
Usage: groupi replies attachments list [options] <id>

Options:
  -h, --help  display help for command
```

## groupi replies attachments remove

```text
Usage: groupi replies attachments remove [options] <id> <attachment-id>

Options:
  --yes       Confirm removal
  -h, --help  display help for command
```

## groupi invites

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

```text
Usage: groupi invites links accept [options] <token>

Options:
  --yes       Confirm revoking this invitation
  -h, --help  display help for command
```

## groupi invites links revoke

```text
Usage: groupi invites links revoke [options] <invite-id>

Options:
  --yes       Confirm revoking this invitation
  -h, --help  display help for command
```

## groupi invites links get

```text
Usage: groupi invites links get [options] <token>

Inspect the invitation using the selected identity

Options:
  -h, --help  display help for command
```

## groupi invites links list

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

```text
Usage: groupi invites email send-pending [options] <event-id>

Queue unsent email invitations once per request ID

Options:
  --request-id <id>  Reuse a prior request ID
  -h, --help         display help for command
```

## groupi invites members

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

```text
Usage: groupi invites members accept [options] <invite-id>

Options:
  --yes       Confirm declining or revoking this invitation
  -h, --help  display help for command
```

## groupi invites members decline

```text
Usage: groupi invites members decline [options] <invite-id>

Options:
  --yes       Confirm declining or revoking this invitation
  -h, --help  display help for command
```

## groupi invites members revoke

```text
Usage: groupi invites members revoke [options] <invite-id>

Options:
  --yes       Confirm declining or revoking this invitation
  -h, --help  display help for command
```

## groupi invites members get

```text
Usage: groupi invites members get [options] <invite-id>

Inspect the invitation using the selected identity

Options:
  -h, --help  display help for command
```

## groupi invites members list

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

## groupi notifications

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

```text
Usage: groupi notifications count [options]

Show unread count

Options:
  -h, --help  display help for command
```

## groupi notifications read

```text
Usage: groupi notifications read [options] <notification-id>

Options:
  -h, --help  display help for command
```

## groupi notifications unread

```text
Usage: groupi notifications unread [options] <notification-id>

Options:
  -h, --help  display help for command
```

## groupi notifications read-all

```text
Usage: groupi notifications read-all [options]

Options:
  -h, --help  display help for command
```

## groupi notifications read-event

```text
Usage: groupi notifications read-event [options] <event-id>

Options:
  -h, --help  display help for command
```

## groupi notifications read-post

```text
Usage: groupi notifications read-post [options] <post-id>

Options:
  -h, --help  display help for command
```

## groupi notifications clear

```text
Usage: groupi notifications clear [options] <notification-id>

Options:
  --yes       Confirm permanently clearing notifications
  -h, --help  display help for command
```

## groupi notifications clear-all

```text
Usage: groupi notifications clear-all [options]

Options:
  --yes       Confirm permanently clearing notifications
  -h, --help  display help for command
```
