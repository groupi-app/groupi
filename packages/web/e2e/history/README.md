# Invite List browser history regressions

Run `pnpm --filter @groupi/web test:history` with Playwright Chromium installed.
For an existing system Chrome installation, set `PLAYWRIGHT_CHANNEL=chrome`.
The runner is platform independent and limits each isolated case to two minutes.
Reports and screenshots go to the ignored `packages/web/test-results/history/`.

These fixtures were promoted from the Invite Lists browser investigation. They
exercise the actual Settings/editor/dialog, guard, head bootstrap, Radix and
Zustand code. Source is transpiled in memory for test execution; Playwright
fulfills fixture requests without a listening server. External requests fail the
tests. No application build, authentication or Convex server is involved.

The five cases cover regular component interaction, early native anchors and
Next-listener ordering, discontinuous history scopes and fragment focus, unknown
history Keep/manual recovery, and create/edit Discard with Next's null-state
handler. The installed Next handler is extracted rather than copied; a changed
handler shape fails explicitly and requires reviewing the boundary fixture.
Navigation API capability is disabled to exercise the legacy fallback. This does
not establish compatibility with an actual older Safari/Firefox engine.

Convex and router interfaces are synthetic. These tests cannot prove deployed
Next route unmounting, authenticated backend behavior, or native screen-reader
behavior. The deployed E2E navigation spec supplies the first boundary when run
against an authorized matching preview and its existing E2E authentication setup.
Original RED/GREEN investigation artifacts remain unchanged outside this checkout;
maintained tests always require the corrected behavior and exit nonzero on failure.
