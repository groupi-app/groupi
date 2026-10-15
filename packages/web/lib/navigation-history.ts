/** Keep an index alongside Next's own history metadata, without adding entries. */
const INDEX_KEY = '__groupiNavigationIndex';
const SCOPE_KEY = '__groupiNavigationScope';

const HISTORY_KEYS = {
  index: INDEX_KEY,
  scope: SCOPE_KEY,
  tracker: '__groupiNavigationTracker',
};

interface NavigationHistoryTracker {
  acquire: () => () => void;
  subscribe: (listener: (event: PopStateEvent) => void) => () => void;
}

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

/**
 * Also emitted into the synchronous root-head script. Keep all runtime
 * dependencies inside this function or in its explicitly serialized argument.
 * Ordinary functions/Object.assign avoid compiler-generated spread helpers.
 */
function installNavigationHistory(keys: typeof HISTORY_KEYS) {
  const trackers = window as unknown as Record<
    string,
    NavigationHistoryTracker | undefined
  >;
  const existing = trackers[keys.tracker];
  if (existing) return existing.acquire();
  const history = window.history;
  const pushState = history.pushState;
  const replaceState = history.replaceState;
  function scope(state: unknown = history.state) {
    return state && typeof state === 'object'
      ? (state as Record<string, unknown>)[keys.scope]
      : undefined;
  }
  function index(state: unknown = history.state) {
    if (!state || typeof state !== 'object') return undefined;
    const value = (state as Record<string, unknown>)[keys.index];
    return typeof value === 'number' ? value : undefined;
  }
  function trackedScope() {
    const value = scope();
    return index() !== undefined && typeof value === 'string' && value
      ? value
      : undefined;
  }
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
  function withIndex(state: unknown, position: number, trackerScope: string) {
    if (state != null && typeof state !== 'object') return state;
    const metadata: Record<string, unknown> = {};
    metadata[keys.index] = position;
    metadata[keys.scope] = trackerScope;
    return Object.assign({}, state, metadata);
  }
  // A new document may inherit metadata from its reloaded history entry. Only
  // an existing singleton proves same-document continuity.
  replaceState.call(
    history,
    withIndex(history.state, 0, crypto.randomUUID()),
    ''
  );
  const push: History['pushState'] = function (state, unused, url) {
    fragmentClick = undefined;
    const predecessorScope = trackedScope();
    // A missing position breaks the known contiguous chain. Never reuse its
    // old scope/counter and infer a distance across an unattributed entry.
    pushState.call(
      history,
      withIndex(
        state,
        predecessorScope ? index()! + 1 : 0,
        predecessorScope ?? crypto.randomUUID()
      ),
      unused,
      url
    );
  };
  const replace: History['replaceState'] = function (state, unused, url) {
    fragmentClick = undefined;
    const predecessorScope = trackedScope();
    replaceState.call(
      history,
      withIndex(
        state,
        predecessorScope ? index()! : 0,
        predecessorScope ?? crypto.randomUUID()
      ),
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
    const position = index();
    if (
      position === undefined ||
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
      index: position,
      scope: scope(),
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
    const metadata: Record<string, unknown> = {};
    metadata[keys.index] = clicked.index + 1;
    metadata[keys.scope] = clicked.scope;
    replaceState.call(history, Object.assign({}, state, metadata), '');
  }

  function hash(event: HashChangeEvent) {
    if (fragmentClick?.from === event.oldURL) stampFragment();
    else fragmentClick = undefined;
  }
  const subscribers: Array<(event: PopStateEvent) => void> = [];
  function subscribe(listener: (event: PopStateEvent) => void) {
    subscribers.push(listener);
    return function unsubscribe() {
      const position = subscribers.indexOf(listener);
      if (position !== -1) subscribers.splice(position, 1);
    };
  }
  function pop(event: PopStateEvent) {
    stampFragment();
    // This listener is installed by the head before Next's Window listeners.
    // Delegate only active invite-list guards; their stopImmediatePropagation
    // protects the draft before Next can traverse or reload an early entry.
    const active = subscribers.slice();
    for (let position = 0; position < active.length; position += 1) {
      active[position](event);
      if (event.cancelBubble) break;
    }
  }
  // Native hash navigation fires popstate before hashchange in supported
  // browsers. Stamp before downstream guards read the newly created entry;
  // hashchange also handles engines which emit only that event.
  document.addEventListener('click', click);
  window.addEventListener('popstate', pop, true);
  window.addEventListener('hashchange', hash);
  let owners = 0;
  function acquire() {
    owners += 1;
    let released = false;
    return function release() {
      if (released) return;
      released = true;
      owners -= 1;
      if (owners !== 0) return;
      document.removeEventListener('click', click);
      window.removeEventListener('popstate', pop, true);
      window.removeEventListener('hashchange', hash);
      if (history.pushState === push) history.pushState = pushState;
      if (history.replaceState === replace) history.replaceState = replaceState;
      if (trackers[keys.tracker] === tracker) delete trackers[keys.tracker];
    };
  }
  const tracker = { acquire, subscribe };
  trackers[keys.tracker] = tracker;
  return acquire();
}

/** The head owns one lease for the document; React callers release theirs. */
export const navigationHistoryBootstrapScript = `(${installNavigationHistory.toString()})(${JSON.stringify(HISTORY_KEYS)});`;

export function trackNavigationHistory() {
  return installNavigationHistory(HISTORY_KEYS);
}

/** Share the early listener rather than registering after Next at Window. */
export function subscribeNavigationHistory(
  listener: (event: PopStateEvent) => void
) {
  const release = installNavigationHistory(HISTORY_KEYS);
  const trackers = window as unknown as Record<
    string,
    NavigationHistoryTracker
  >;
  const unsubscribe = trackers[HISTORY_KEYS.tracker].subscribe(listener);
  return () => {
    unsubscribe();
    release();
  };
}
