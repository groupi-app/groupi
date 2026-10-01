import { CliError } from '../errors.js';

/** @typedef {{name:string, label:string, initial?:string, choices?:string[]}} Field */
/** @typedef {{id:string, label:string, fields?:Field[], command?:string, run:(values:Record<string,string>)=>Promise<unknown>}} Action */
/** @typedef {{title:string, lines?:string[], entries:Entry[], actions?:Action[], next?:Screen}} View */
/** @typedef {{id:string,label:string,screen:Screen}} Entry */
/** @typedef {{id:string,load:()=>Promise<View>}} Screen */
/** @typedef {{screen:Screen,view:View|null,loading:boolean,busy:boolean,error:string|null,notice:string|null,updatedAt:number|null,failures:number}} State */

/** Strip remote terminal controls before rendering, including bidi overrides.
 * @param {unknown} value */
export function safeText(value) {
  return String(value ?? '').replace(
    // eslint-disable-next-line no-control-regex -- Remote data is never terminal syntax.
    /[\x00-\x1f\x7f-\x9f\u202a-\u202e\u2066-\u2069]/g,
    ' '
  );
}

/** One polling owner per active screen. Stale requests cannot overwrite navigation
 * or a post-write refresh. Mutations never run concurrently or retry themselves. */
export class TerminalSession {
  /** @param {Screen} screen */
  constructor(screen) {
    /** @type {State} */
    this.state = {
      screen,
      view: null,
      loading: false,
      busy: false,
      error: null,
      notice: null,
      updatedAt: null,
      failures: 0,
    };
    /** @type {Set<()=>void>} */ this.listeners = new Set();
    /** @type {Screen[]} */ this.history = [];
    /** @type {ReturnType<typeof setTimeout>|undefined} */ this.timer =
      undefined;
    this.generation = 0;
    this.disposed = false;
  }
  /** @param {()=>void} listener */
  subscribe = listener => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };
  snapshot = () => this.state;
  /** @param {Partial<State>} patch */
  update(patch) {
    this.state = { ...this.state, ...patch };
    for (const listener of this.listeners) listener();
  }
  /** @param {Screen} screen @param {boolean} [remember] */
  open(screen, remember = true) {
    if (this.state.busy || this.disposed) return;
    if (remember) this.history.push(this.state.screen);
    this.update({
      screen,
      view: null,
      updatedAt: null,
      failures: 0,
      error: null,
      notice: null,
    });
    void this.refresh();
  }
  back() {
    const screen = this.history.at(-1);
    if (screen && !this.state.busy) {
      this.history.pop();
      this.open(screen, false);
    }
  }
  async refresh() {
    if (this.disposed || this.state.busy) return;
    clearTimeout(this.timer);
    const generation = ++this.generation;
    this.update({ loading: true });
    try {
      const view = await this.state.screen.load();
      if (this.disposed || generation !== this.generation) return;
      this.update({
        view,
        loading: false,
        error: null,
        updatedAt: Date.now(),
        failures: 0,
      });
    } catch (error) {
      if (this.disposed || generation !== this.generation) return;
      this.update({
        loading: false,
        error: failureMessage(error),
        failures: this.state.failures + 1,
      });
    }
    if (!this.disposed && generation === this.generation) {
      this.timer = setTimeout(
        () => void this.refresh(),
        Math.min(60000, 5000 * 2 ** this.state.failures)
      );
    }
  }
  /** Called only after the UI's target/profile confirmation.
   * @param {Action} action @param {Record<string,string>} values */
  async execute(action, values) {
    if (this.disposed || this.state.busy || this.state.error) return;
    clearTimeout(this.timer);
    ++this.generation;
    this.update({ busy: true, loading: false, error: null, notice: null });
    try {
      const result = await action.run(values);
      const identifiers =
        result && typeof result === 'object'
          ? Object.entries(result)
              .filter(
                ([name, value]) =>
                  [
                    'id',
                    'eventId',
                    'postId',
                    'replyId',
                    'inviteId',
                    'requestId',
                  ].includes(name) && typeof value === 'string'
              )
              .map(([name, value]) => `${name}: ${safeText(value)}`)
              .join(' · ')
          : '';
      if (!this.disposed)
        this.update({
          busy: false,
          notice: `Completed: ${safeText(action.label)}${identifiers ? ` · ${identifiers}` : ''}`,
        });
    } catch (error) {
      if (!this.disposed)
        this.update({ busy: false, notice: failureMessage(error) });
    }
    // A failed write can still have succeeded remotely. Inspect, never replay it.
    await this.refresh();
  }
  dispose() {
    this.disposed = true;
    ++this.generation;
    clearTimeout(this.timer);
    this.listeners.clear();
  }
}

/** @param {unknown} error */
function failureMessage(error) {
  return error instanceof CliError
    ? safeText(`${error.code}: ${error.message}`)
    : 'Connection failed. Refresh to reconnect; no write was retried.';
}
