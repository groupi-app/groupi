import { describe, expect, test } from 'vitest';
import {
  hasManageGuildPermission,
  partitionManageableGuilds,
} from '../discord/permissions';

describe('Discord guild permissions', () => {
  test('handles Discord permission bitfields without number precision loss', () => {
    expect(hasManageGuildPermission('32')).toBe(true);
    expect(hasManageGuildPermission('9007199254741024')).toBe(true);
    expect(hasManageGuildPermission('9007199254740992')).toBe(false);
    expect(hasManageGuildPermission('invalid')).toBe(false);
  });

  test('requires MANAGE_GUILD for both available and invitable guilds', () => {
    const result = partitionManageableGuilds(
      [
        { id: 'available', name: 'Available', icon: null, permissions: '32' },
        { id: 'invitable', name: 'Invitable', icon: null, permissions: '32' },
        {
          id: 'member-only-with-bot',
          name: 'Member only with bot',
          icon: null,
          permissions: '0',
        },
        {
          id: 'member-only-without-bot',
          name: 'Member only without bot',
          icon: null,
          permissions: '0',
        },
      ],
      new Set(['available', 'member-only-with-bot'])
    );

    expect(result.available.map(guild => guild.id)).toEqual(['available']);
    expect(result.invitable.map(guild => guild.id)).toEqual(['invitable']);
  });
});
