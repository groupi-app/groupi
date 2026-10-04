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
    pushState.call(
      history,
      withIndex(state, (getNavigationHistoryIndex() ?? 0) + 1),
      unused,
      url
    );
  };
  const replace: History['replaceState'] = (state, unused, url) => {
    replaceState.call(
      history,
      withIndex(state, getNavigationHistoryIndex() ?? 0),
      unused,
      url
    );
  };
  history.pushState = push;
  history.replaceState = replace;
  return () => {
    if (history.pushState === push) history.pushState = pushState;
    if (history.replaceState === replace) history.replaceState = replaceState;
  };
}
