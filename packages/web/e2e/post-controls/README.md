# Post controls local browser fixture

Run `node packages/web/e2e/post-controls/run.mjs` from the repository root. Uses installed Playwright Chromium, esbuild, actual generated Tailwind CSS and bundled Geologica. The browser is headless and all requests are fulfilled in memory at a synthetic origin; unexpected external requests are blocked. No local web or Convex server is started.

Evidence is written to `../artifacts/post-controls/after/` relative to the repository root. This is independent actual-component verification, not authenticated acceptance testing.

Real UI: Group post detail, editor and feed; Event PostCard, FullPost and PostFeed; DiscussionComposer; shared post-state actions, responsive ActionMenu, ActionMenuButton and mobile hooks. Synthetic hooks model localStorage persistence, mutation acknowledgement/revisions, pending delay, rejected cap and retry, permissions, presence, uploads and router. The rich text editor is replaced by a textarea so this does not verify BlockNote editing. Unrelated avatar/profile/report rendering and GroupPollFeed use fixture boundaries; post menus themselves remain actual components. Existing Group replies use the actual discussion content renderer.

The Group feed query deliberately includes pinned records to verify the UI's deduplication; a separate synthetic pin query provides three unsorted records. This does not establish real query pagination or backend ordering. Cap failures are injected rejection messages, not proof of backend cap enforcement. Normal-author, unrelated-member and manager permissions are explicit query projections, not proof of backend authorization.

No live auth, credentials, shared data mutations, external notifications or uploads are used. Event reply-list and BlockNote integration, live Event/Group feed queries/pagination and subscriptions remain outside this fixture.

The Event FullPost scene mounts only FullPost; it does not mount RepliesSection or replace an Event old-replies component. Locked old-reply readability is verified through the actual Group thread/reply components. Both Event and Group feed composition are mounted; poll cards use a labeled boundary marker solely to establish ordering.

Run `node packages/web/e2e/post-controls/run.mjs --reuse` for a focused regression that reuses the same real Event FullPost instance across synthetic post IDs after acknowledgements and a rejected action. This writes separate `after/reuse/` evidence. It is a prop/subscription boundary test, not a real Next route transition.
