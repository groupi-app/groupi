import React, { useEffect, useState, useSyncExternalStore } from 'react';
import { Box, Text, useApp, useInput, useStdout, render } from 'ink';
import { Select, TextInput } from '@inkjs/ui';
import { getProfile, credential } from '../profiles.js';
import { CliError } from '../errors.js';
import { TerminalSession, safeText } from './session.js';
import { planningScreens } from './screens.js';

const h = React.createElement;
/** @param {{session:TerminalSession,profile:{name:string,apiUrl:string}}} props */
export function TerminalApp({ session, profile }) {
  const state = useSyncExternalStore(session.subscribe, session.snapshot);
  const { exit } = useApp();
  const { stdout } = useStdout();
  const [scroll, setScroll] = useState({ screen: '', offset: 0 });
  const width = Math.max(20, (stdout.columns || 80) - 4);
  const pageSize = Math.max(3, Math.min(10, (stdout.rows || 24) - 17));
  const lines = (state.view?.lines ?? []).flatMap(line => {
    const chars = Array.from(safeText(line));
    const rows = [];
    for (let start = 0; start < chars.length; start += width)
      rows.push(chars.slice(start, start + width).join(''));
    return rows.length ? rows : [''];
  });
  const offset =
    scroll.screen === state.screen.id
      ? Math.min(scroll.offset, Math.max(0, lines.length - pageSize))
      : 0;
  const [form, setForm] = useState(
    /** @type {{action:import('./session.js').Action,step:number,values:Record<string,string>}|null} */ (
      null
    )
  );
  useEffect(() => {
    void session.refresh();
    return () => session.dispose();
  }, [session]);
  useInput((input, key) => {
    if (state.busy) return;
    if (key.escape) {
      if (form) setForm(null);
      else session.back();
    }
    if (form) return;
    if (key.pageDown)
      setScroll({
        screen: state.screen.id,
        offset: Math.min(
          offset + pageSize,
          Math.max(0, lines.length - pageSize)
        ),
      });
    if (key.pageUp)
      setScroll({
        screen: state.screen.id,
        offset: Math.max(0, offset - pageSize),
      });
    if (input === 'q') exit();
    if (input === 'r') void session.refresh();
    if (input === 'b') session.back();
  });
  const field = form?.action.fields?.[form.step];
  /** @param {string} value */
  function submit(value) {
    if (!form || !field) return;
    setForm({
      ...form,
      step: form.step + 1,
      values: { ...form.values, [field.name]: value },
    });
  }
  const view = state.view;
  const entries = view?.entries ?? [];
  const actions = state.error ? [] : (view?.actions ?? []);
  const options = [
    ...entries.map(entry => ({
      label: safeText(entry.label),
      value: `screen:${entry.id}`,
    })),
    ...actions.map(action => ({
      label: safeText(action.label),
      value: `action:${action.id}`,
    })),
    ...(view?.next ? [{ label: 'Next page →', value: 'next' }] : []),
    ...(session.history.length ? [{ label: '← Back', value: 'back' }] : []),
  ];
  return h(
    Box,
    { flexDirection: 'column', padding: 1 },
    h(Text, { bold: true }, safeText(view?.title ?? 'Groupi')),
    h(
      Text,
      { dimColor: true },
      `Profile: ${safeText(profile.name)} · ${safeText(profile.apiUrl)}`
    ),
    h(
      Text,
      { color: state.error ? 'yellow' : undefined },
      state.busy
        ? 'Saving… please wait'
        : state.error
          ? `Disconnected / stale${state.updatedAt ? ` (last updated ${new Date(state.updatedAt).toLocaleTimeString()})` : ''}. Retrying in up to ${Math.min(60, 5 * 2 ** state.failures)}s. ${state.error}`
          : state.loading
            ? 'Refreshing…'
            : state.updatedAt
              ? `Connected · updated ${new Date(state.updatedAt).toLocaleTimeString()}`
              : 'Loading…'
    ),
    state.notice ? h(Text, { color: 'yellow' }, safeText(state.notice)) : null,
    ...lines
      .slice(offset, offset + pageSize)
      .map((line, index) =>
        h(Text, { key: index, wrap: 'wrap' }, safeText(line))
      ),
    lines.length > pageSize
      ? h(
          Text,
          { dimColor: true },
          `Details ${offset + 1}–${Math.min(offset + pageSize, lines.length)}/${lines.length} · PgUp/PgDn scroll`
        )
      : null,
    form
      ? h(
          Box,
          { flexDirection: 'column', marginTop: 1 },
          h(Text, { bold: true }, safeText(form.action.label)),
          field
            ? h(
                React.Fragment,
                null,
                h(Text, null, safeText(field.label)),
                field.choices
                  ? h(Select, {
                      key: field.name,
                      options: field.choices.map(value => ({
                        label: value,
                        value,
                      })),
                      onChange: submit,
                    })
                  : h(TextInput, {
                      key: field.name,
                      defaultValue: field.initial ?? '',
                      onSubmit: submit,
                    })
              )
            : h(
                React.Fragment,
                null,
                h(
                  Text,
                  null,
                  `Confirm ${safeText(form.action.label)} on ${safeText(profile.name)} (${safeText(profile.apiUrl)})?`
                ),
                ...Object.entries(form.values).map(([name, value]) =>
                  h(
                    Text,
                    { key: name },
                    `${safeText(name)}: ${safeText(value)}`
                  )
                ),
                h(
                  Text,
                  { dimColor: true },
                  `CLI equivalent: groupi --profile ${safeText(profile.name)} ${safeText(form.action.command)} --help`
                ),
                h(Select, {
                  options: [
                    { label: 'Cancel', value: 'cancel' },
                    { label: 'Confirm', value: 'confirm' },
                  ],
                  onChange: value => {
                    const selected = form;
                    setForm(null);
                    if (value === 'confirm')
                      void session.execute(selected.action, selected.values);
                  },
                })
              ),
          h(Text, { dimColor: true }, 'Esc cancels without saving')
        )
      : options.length
        ? h(Select, {
            key: state.screen.id,
            isDisabled: state.busy,
            visibleOptionCount: 8,
            options,
            onChange: value => {
              if (value === 'back') session.back();
              else if (value === 'next' && view?.next) session.open(view.next);
              else if (value.startsWith('screen:')) {
                const entry = entries.find(
                  item => `screen:${item.id}` === value
                );
                if (entry) session.open(entry.screen);
              } else {
                const action = actions.find(
                  item => `action:${item.id}` === value
                );
                if (action) setForm({ action, step: 0, values: {} });
              }
            },
          })
        : h(Text, null, state.loading ? 'Loading…' : 'No items on this page.'),
    h(
      Text,
      { dimColor: true },
      '↑/↓ navigate · Enter select · Esc/b back · r refresh/reconnect · q quit'
    )
  );
}

/** @param {{profile:string,apiKeyStdin?:boolean,format?:string,nonInteractive?:boolean}} options */
export async function launchTerminal(options) {
  if (
    options.format === 'json' ||
    options.nonInteractive ||
    options.apiKeyStdin ||
    !process.stdin.isTTY ||
    !process.stdout.isTTY
  )
    throw new CliError(
      'INTERACTIVE_REQUIRED',
      'The terminal UI requires an interactive terminal and human output. Use a command with --format json for automation.',
      2
    );
  const profile = await getProfile(options.profile);
  const key = await credential(profile, false);
  const session = new TerminalSession(planningScreens(profile, key).home);
  const app = render(h(TerminalApp, { session, profile }));
  try {
    await app.waitUntilExit();
  } finally {
    session.dispose();
    app.unmount();
  }
}
