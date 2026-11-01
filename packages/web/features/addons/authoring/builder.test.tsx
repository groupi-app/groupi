import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, it, vi } from 'vitest';
import { BuilderPage } from './builder-page';
import { BuilderProvider, useBuilder } from './builder-context';
import { EditorPanel } from './editor-panel';
import {
  createEmptyField,
  type CustomAddonTemplate,
} from '../model/custom-addon-schema';
import type { Id } from '@/convex/_generated/dataModel';

const operations = vi.hoisted(() => ({
  create: vi.fn(),
  update: vi.fn(),
  publish: vi.fn(),
  unpublish: vi.fn(),
  push: vi.fn(),
  replace: vi.fn(),
}));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: operations.push, replace: operations.replace }),
  usePathname: () => '/addon-builder/template-one',
}));
vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: React.ComponentProps<'a'>) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));
vi.mock('next-themes', () => ({
  useTheme: () => ({ resolvedTheme: 'light' }),
}));
vi.mock('next/dynamic', () => ({
  default: () =>
    function MonacoBoundary({
      value,
      onChange,
    }: {
      value: string;
      onChange: (value: string) => void;
    }) {
      return (
        <textarea
          aria-label='YAML document'
          value={value}
          onChange={event => onChange(event.target.value)}
        />
      );
    },
}));
vi.mock('../hooks/use-addon-templates', () => ({
  useCreateTemplate: () => ({
    createTemplate: operations.create,
    isPending: false,
  }),
  useUpdateTemplate: () => ({
    updateTemplate: operations.update,
    isPending: false,
  }),
  usePublishTemplate: () => operations.publish,
  useUnpublishTemplate: () => operations.unpublish,
}));
afterEach(() => {
  vi.clearAllMocks();
});
const templateId = 'template-one' as Id<'addonTemplates'>;
const initial: CustomAddonTemplate = {
  name: 'Community supper',
  description: 'Bring people together.',
  iconName: 'listChecks',
  sections: [
    {
      id: 'menu',
      title: 'Food & drinks',
      fields: [
        {
          ...createEmptyField('text'),
          id: 'dish',
          label: 'What are you bringing?',
        },
      ],
    },
    {
      id: 'notes',
      title: 'Dietary notes',
      fields: [
        {
          ...createEmptyField('text'),
          id: 'notes-field',
          label: 'Anything we should know?',
        },
      ],
    },
  ],
};
function Snapshot() {
  const state = useBuilder();
  return (
    <>
      <output aria-label='Draft state'>
        {JSON.stringify({
          name: state.template.name,
          dirty: state.isDirty,
          pending: state.yamlPending,
          invalid: state.yamlInvalid,
          yaml: state.yamlValue,
        })}
      </output>
      <button
        type='button'
        onClick={() => state.markSaved(state.template, state.yamlValue)}
      >
        Checkpoint
      </button>
      <button type='button' onClick={state.revert}>
        Revert fixture
      </button>
    </>
  );
}
function mountEditor() {
  return render(
    <BuilderProvider initialTemplate={initial}>
      <EditorPanel />
      <Snapshot />
    </BuilderProvider>
  );
}
function state() {
  return JSON.parse(screen.getByLabelText('Draft state').textContent ?? '{}');
}

it('opens named counted sections one at a time and preserves fields while settings are separate', async () => {
  mountEditor();
  const user = userEvent.setup();
  const first = screen.getByRole('button', { name: /Food & drinks.*1 field/ });
  const second = screen.getByRole('button', { name: /Dietary notes.*1 field/ });
  expect(first).toHaveAttribute('aria-expanded', 'true');
  expect(second).toHaveAttribute('aria-expanded', 'false');
  second.focus();
  await user.keyboard('{Enter}');
  expect(second).toHaveAttribute('aria-expanded', 'true');
  expect(first).toHaveAttribute('aria-expanded', 'false');
  await user.type(
    screen.getByRole('textbox', { name: 'Section title' }),
    ' for everyone'
  );
  expect(
    screen.getByRole('button', { name: /Dietary notes for everyone.*1 field/ })
  ).toHaveAttribute('aria-expanded', 'true');
  expect(
    screen.getByText('General settings').closest('details')
  ).not.toHaveAttribute('open');
  await user.click(screen.getByRole('button', { name: 'Add Section' }));
  expect(
    screen.getByRole('button', { name: /Untitled section.*0 fields/ })
  ).toHaveAttribute('aria-expanded', 'true');
});

it('retains raw invalid and pending YAML across tab switches and keeps the visual document safe', async () => {
  mountEditor();
  const user = userEvent.setup();
  await user.click(screen.getByRole('tab', { name: 'YAML' }));
  await user.clear(screen.getByRole('textbox', { name: 'YAML document' }));
  fireEvent.change(screen.getByRole('textbox', { name: 'YAML document' }), {
    target: { value: 'name: [' },
  });
  await user.click(screen.getByRole('tab', { name: 'Visual' }));
  expect(state().yaml).toBe('name: [');
  await waitFor(() => expect(state().invalid).toBe(true));
  expect(state().name).toBe(initial.name);
  await user.click(screen.getByRole('tab', { name: 'YAML' }));
  expect(screen.getByRole('textbox', { name: 'YAML document' })).toHaveValue(
    'name: ['
  );
  expect(screen.getByRole('alert')).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Revert fixture' }));
  expect(state().dirty).toBe(false);
  expect(state().invalid).toBe(false);
});

it('applies a pending valid YAML draft even after leaving its mode and checkpoints the exact snapshot', async () => {
  mountEditor();
  const user = userEvent.setup();
  await user.click(screen.getByRole('tab', { name: 'YAML' }));
  const raw = state().yaml.replace('Community supper', 'Evening potluck');
  await user.clear(screen.getByRole('textbox', { name: 'YAML document' }));
  fireEvent.change(screen.getByRole('textbox', { name: 'YAML document' }), {
    target: { value: raw },
  });
  await user.click(screen.getByRole('tab', { name: 'Visual' }));
  await waitFor(() => expect(state().name).toBe('Evening potluck'));
  expect(state().dirty).toBe(true);
  await user.click(screen.getByRole('button', { name: 'Checkpoint' }));
  expect(state().dirty).toBe(false);
});

it('retains the draft after failed save, retries successfully and publishes only the saved valid draft', async () => {
  operations.update
    .mockRejectedValueOnce(Error('Synthetic save failed'))
    .mockResolvedValueOnce({ success: true });
  operations.publish.mockResolvedValue({ success: true });
  render(<BuilderPage templateId={templateId} initialTemplate={initial} />);
  const user = userEvent.setup();
  await user.click(screen.getByText('General settings'));
  await user.type(screen.getByLabelText('Name'), ' revised');
  expect(screen.getByRole('button', { name: 'Publish' })).toBeDisabled();
  await user.click(screen.getByRole('button', { name: 'Save draft' }));
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Synthetic save failed'
  );
  expect(screen.getByLabelText('Name')).toHaveValue('Community supper revised');
  expect(screen.getByText('Unsaved changes')).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Save draft' }));
  expect(await screen.findByText('Changes saved.')).toBeInTheDocument();
  expect(operations.update).toHaveBeenCalledTimes(2);
  expect(operations.update.mock.calls[1][0].template.name).toBe(
    'Community supper revised'
  );
  expect(screen.queryByText('Unsaved changes')).not.toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Publish' }));
  expect(operations.publish).toHaveBeenCalledWith(templateId);
});

it('keeps raw YAML errors from saving a stale visual snapshot and preserves draft on cancelled navigation', async () => {
  render(<BuilderPage templateId={templateId} initialTemplate={initial} />);
  const user = userEvent.setup();
  await user.click(screen.getByRole('tab', { name: 'YAML' }));
  await user.clear(screen.getByRole('textbox', { name: 'YAML document' }));
  fireEvent.change(screen.getByRole('textbox', { name: 'YAML document' }), {
    target: { value: 'name: [' },
  });
  await waitFor(() =>
    expect(screen.getByRole('button', { name: 'Save draft' })).toBeDisabled()
  );
  await user.click(screen.getByRole('link', { name: 'Back to add-ons' }));
  const dialog = await screen.findByRole('dialog', {
    name: 'Leave without saving?',
  });
  await user.click(
    within(dialog).getByRole('button', { name: 'Keep editing' })
  );
  expect(screen.getByRole('textbox', { name: 'YAML document' })).toHaveValue(
    'name: ['
  );
  expect(operations.update).not.toHaveBeenCalled();
  expect(operations.push).not.toHaveBeenCalled();
});

it('saves an incomplete new draft without invoking publication', async () => {
  operations.create.mockResolvedValue(templateId);
  render(<BuilderPage />);
  await userEvent.click(screen.getByRole('button', { name: 'Save draft' }));
  expect(operations.create).toHaveBeenCalledTimes(1);
  expect(
    operations.create.mock.calls[0][0].template.sections[0].fields
  ).toEqual([]);
  expect(operations.publish).not.toHaveBeenCalled();
  expect(operations.replace).toHaveBeenCalledWith(
    `/addon-builder/${templateId}`
  );
});

it('does not mark newer edits clean when an older captured snapshot is acknowledged', async () => {
  let checkpoint: (() => void) | undefined;
  function Controls() {
    const current = useBuilder();
    return (
      <>
        <button
          onClick={() => {
            const snapshot = current.template;
            const raw = current.yamlValue;
            checkpoint = () => current.markSaved(snapshot, raw);
          }}
        >
          Capture save
        </button>
        <button
          onClick={() =>
            current.updateTemplate({ name: current.template.name + '!' })
          }
        >
          Change name
        </button>
        <Snapshot />
      </>
    );
  }
  render(
    <BuilderProvider initialTemplate={initial}>
      <Controls />
    </BuilderProvider>
  );
  const user = userEvent.setup();
  await user.click(screen.getByRole('button', { name: 'Change name' }));
  await user.click(screen.getByRole('button', { name: 'Capture save' }));
  await user.click(screen.getByRole('button', { name: 'Change name' }));
  await act(async () => checkpoint?.());
  expect(state().dirty).toBe(true);
  expect(state().name).toBe('Community supper!!');
  await user.click(screen.getByRole('button', { name: 'Revert fixture' }));
  expect(state().name).toBe('Community supper!');
  expect(state().dirty).toBe(false);
});

it('holds the editable draft and save checkpoint until the server acknowledges a pending save', async () => {
  let finish!: () => void;
  operations.update.mockImplementationOnce(
    () =>
      new Promise<void>(resolve => {
        finish = resolve;
      })
  );
  render(<BuilderPage templateId={templateId} initialTemplate={initial} />);
  const user = userEvent.setup();
  await user.click(screen.getByText('General settings'));
  await user.type(screen.getByLabelText('Name'), ' revised');
  await user.click(screen.getByRole('button', { name: 'Save draft' }));
  expect(screen.getByRole('button', { name: 'Saving…' })).toBeDisabled();
  expect(screen.getByLabelText('Name')).toBeDisabled();
  expect(screen.getByText('Unsaved changes')).toBeInTheDocument();
  expect(screen.queryByText('Changes saved.')).not.toBeInTheDocument();
  expect(operations.update).toHaveBeenCalledTimes(1);
  await act(async () => finish());
  expect(await screen.findByText('Changes saved.')).toBeInTheDocument();
  expect(screen.queryByText('Unsaved changes')).not.toBeInTheDocument();
  await user.type(screen.getByLabelText('Name'), ' again');
  expect(screen.queryByText('Changes saved.')).not.toBeInTheDocument();
  expect(screen.getByText('Unsaved changes')).toBeInTheDocument();
});
