/** Keep an index alongside Next's own history metadata, without adding entries. */
const INDEX_KEY = '__groupiNavigationIndex';
const SCOPE_KEY = '__groupiNavigationScope';

export function getNavigationHistoryScope(
  state: unknown = window.history.state
) {
  return state && typeof state === 'object'
    ? (state as Record<string, unknown>)[SCOPE_KEY]
    : undefined;
}

/** Navigation API positions also cover entries created before app hydration. */
export function getBrowserHistoryIndex() {
  const index = (
    window as Window & {
      navigation?: { currentEntry?: { index: number } | null };
    }
  ).navigation?.currentEntry?.index;
  return typeof index === 'number' && index >= 0 ? index : undefined;
}

export function getNavigationHistoryIndex(
  state: unknown = window.history.state
) {
  if (!state || typeof state !== 'object') return undefined;
  const index = (state as Record<string, unknown>)[INDEX_KEY];
  return typeof index === 'number' ? index : undefined;
}

export function trackNavigationHistory() {
  const history = window.history;
  const pushState = history.pushState;
  const replaceState = history.replaceState;
  const initialScope = getNavigationHistoryScope() ?? crypto.randomUUID();
  let fragmentClick:
    | {
        event: MouseEvent;
        from: string;
        to: string;
        state: unknown;
        index: number;
        scope: unknown;
      }
    | undefined;
  const withIndex = (state: unknown, index: number) =>
    state != null && typeof state !== 'object'
      ? state
      : {
          ...state,
          [INDEX_KEY]: index,
          [SCOPE_KEY]: getNavigationHistoryScope() ?? initialScope,
        };
  replaceState.call(
    history,
    withIndex(history.state, getNavigationHistoryIndex() ?? 0),
    '',
    window.location.href
  );
  const push: History['pushState'] = (state, unused, url) => {
    fragmentClick = undefined;
    pushState.call(
      history,
      withIndex(state, (getNavigationHistoryIndex() ?? 0) + 1),
      unused,
      url
    );
  };
  const replace: History['replaceState'] = (state, unused, url) => {
    fragmentClick = undefined;
    replaceState.call(
      history,
      withIndex(state, getNavigationHistoryIndex() ?? 0),
      unused,
      url
    );
  };
  history.pushState = push;
  history.replaceState = replace;

  function click(event: MouseEvent) {
    fragmentClick = undefined;
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    )
      return;
    const anchor =
      event.target instanceof Element ? event.target.closest('a') : null;
    if (
      !anchor ||
      anchor.hasAttribute('download') ||
      (anchor.target && anchor.target !== '_self')
    )
      return;
    const from = new URL(window.location.href);
    const to = new URL(anchor.href, from);
    const index = getNavigationHistoryIndex();
    if (
      index === undefined ||
      to.origin !== from.origin ||
      to.pathname !== from.pathname ||
      to.search !== from.search ||
      to.href === from.href
    )
      return;
    fragmentClick = {
      event,
      from: from.href,
      to: to.href,
      state: history.state,
      index,
      scope: getNavigationHistoryScope(),
    };
  }

  function stampFragment() {
    const clicked = fragmentClick;
    fragmentClick = undefined;
    if (
      !clicked ||
      clicked.event.defaultPrevented ||
      window.location.href !== clicked.to
    )
      return;
    // Only an accepted same-document anchor click identifies a fresh fragment
    // entry. A hashchange alone could instead be traversal to an old entry.
    // Native fragment navigation may clear state; keep Next's same-route tree.
    const state = history.state ?? clicked.state;
    if (state != null && typeof state !== 'object') return;
    replaceState.call(
      history,
      {
        ...state,
        [INDEX_KEY]: clicked.index + 1,
        [SCOPE_KEY]: clicked.scope,
      },
      ''
    );
  }

  function hash(event: HashChangeEvent) {
    if (fragmentClick?.from === event.oldURL) stampFragment();
    else fragmentClick = undefined;
  }
  // Native hash navigation fires popstate before hashchange in supported
  // browsers. Stamp before downstream guards read the newly created entry;
  // hashchange also handles engines which emit only that event.
  document.addEventListener('click', click);
  window.addEventListener('popstate', stampFragment, true);
  window.addEventListener('hashchange', hash);
  return () => {
    document.removeEventListener('click', click);
    window.removeEventListener('popstate', stampFragment, true);
    window.removeEventListener('hashchange', hash);
    if (history.pushState === push) history.pushState = pushState;
    if (history.replaceState === replace) history.replaceState = replaceState;
  };
}
