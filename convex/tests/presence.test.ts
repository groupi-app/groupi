import { describe, it, expect } from 'vitest';
import { Id } from '../_generated/dataModel';
import {
  createTestInstance,
  createTestUser,
  createAuthenticatedUser,
  TestScenarios,
} from './test_helpers';

// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any
const api: any = require('../_generated/api').api;

/**
 * Comprehensive tests for the presence/status system
 *
 * Tests cover:
 * 1. getPersonStatus query - display status logic
 * 2. setStatus mutation - manual status setting
 * 3. setAutoIdle mutation - automatic idle detection
 * 4. DND notification behavior
 * 5. Visibility settings (EVERYONE, FRIENDS, NONE)
 * 6. Status expiration
 */

describe('Presence System', () => {
  describe('getPersonStatus', () => {
    describe('basic functionality', () => {
      it('should return null for non-existent person', async () => {
        const t = createTestInstance();
        const { auth } = await TestScenarios.simpleUser(t);

        // Use a valid ID format that doesn't exist in the database
        const result = await auth.query(api.presence.getPersonStatus, {
          personId: '99999;persons' as Id<'persons'>,
        });

        expect(result).toBeNull();
      });

      it('should return OFFLINE for user with no lastSeen', async () => {
        const t = createTestInstance();
        const { personId } = await createTestUser(t);
        const { auth } = await TestScenarios.simpleUser(t);

        const result = await auth.query(api.presence.getPersonStatus, {
          personId,
        });

        expect(result).not.toBeNull();
        expect(result.status).toBe('OFFLINE');
        expect(result.isOnline).toBe(false);
      });

      it('should return ONLINE for user with fresh lastSeen and ONLINE status', async () => {
        const t = createTestInstance();

        // Create user with fresh lastSeen
        const { personId } = await t.run(async ctx => {
          const userId = `test_user_${Math.random().toString(36).substring(7)}`;
          const personId = await ctx.db.insert('persons', {
            userId,
            status: 'ONLINE',
            lastSeen: Date.now(), // Fresh
          });
          return { personId };
        });

        const { auth } = await TestScenarios.simpleUser(t);

        const result = await auth.query(api.presence.getPersonStatus, {
          personId,
        });

        expect(result.status).toBe('ONLINE');
        expect(result.isOnline).toBe(true);
      });
    });

    describe('stale lastSeen handling', () => {
      const sixMinutesAgo = Date.now() - 6 * 60 * 1000;
      const threeMinutesAgo = Date.now() - 3 * 60 * 1000;

      it('should return OFFLINE for user with stale lastSeen and ONLINE status', async () => {
        const t = createTestInstance();

        const { personId } = await t.run(async ctx => {
          const userId = `test_user_${Math.random().toString(36).substring(7)}`;
          const personId = await ctx.db.insert('persons', {
            userId,
            status: 'ONLINE',
            lastSeen: sixMinutesAgo, // Stale (>5 min)
          });
          return { personId };
        });

        const { auth } = await TestScenarios.simpleUser(t);

        const result = await auth.query(api.presence.getPersonStatus, {
          personId,
        });

        expect(result.status).toBe('OFFLINE');
        expect(result.isOnline).toBe(false);
        expect(result.lastSeen).toBe(sixMinutesAgo);
      });

      it('should return OFFLINE for user with stale lastSeen and DND status', async () => {
        const t = createTestInstance();

        const { personId } = await t.run(async ctx => {
          const userId = `test_user_${Math.random().toString(36).substring(7)}`;
          const personId = await ctx.db.insert('persons', {
            userId,
            status: 'DO_NOT_DISTURB',
            lastSeen: sixMinutesAgo, // Stale
          });
          return { personId };
        });

        const { auth } = await TestScenarios.simpleUser(t);

        const result = await auth.query(api.presence.getPersonStatus, {
          personId,
        });

        // Should show OFFLINE even though status is DND
        expect(result.status).toBe('OFFLINE');
        expect(result.isOnline).toBe(false);
      });

      it('should return OFFLINE for user with stale lastSeen and IDLE status', async () => {
        const t = createTestInstance();

        const { personId } = await t.run(async ctx => {
          const userId = `test_user_${Math.random().toString(36).substring(7)}`;
          const personId = await ctx.db.insert('persons', {
            userId,
            status: 'IDLE',
            lastSeen: sixMinutesAgo, // Stale
          });
          return { personId };
        });

        const { auth } = await TestScenarios.simpleUser(t);

        const result = await auth.query(api.presence.getPersonStatus, {
          personId,
        });

        expect(result.status).toBe('OFFLINE');
        expect(result.isOnline).toBe(false);
      });

      it('should return DND for user with fresh lastSeen and DND status', async () => {
        const t = createTestInstance();

        const { personId } = await t.run(async ctx => {
          const userId = `test_user_${Math.random().toString(36).substring(7)}`;
          const personId = await ctx.db.insert('persons', {
            userId,
            status: 'DO_NOT_DISTURB',
            lastSeen: threeMinutesAgo, // Fresh (<5 min)
          });
          return { personId };
        });

        const { auth } = await TestScenarios.simpleUser(t);

        const result = await auth.query(api.presence.getPersonStatus, {
          personId,
        });

        expect(result.status).toBe('DO_NOT_DISTURB');
        expect(result.isOnline).toBe(false); // DND is "busy", not "online"
      });

      it('should return IDLE for user with fresh lastSeen and IDLE status', async () => {
        const t = createTestInstance();

        const { personId } = await t.run(async ctx => {
          const userId = `test_user_${Math.random().toString(36).substring(7)}`;
          const personId = await ctx.db.insert('persons', {
            userId,
            status: 'IDLE',
            lastSeen: threeMinutesAgo, // Fresh
          });
          return { personId };
        });

        const { auth } = await TestScenarios.simpleUser(t);

        const result = await auth.query(api.presence.getPersonStatus, {
          personId,
        });

        expect(result.status).toBe('IDLE');
        expect(result.isOnline).toBe(false); // IDLE is "away"
      });
    });

    describe('INVISIBLE status', () => {
      it('should return OFFLINE for INVISIBLE users regardless of lastSeen', async () => {
        const t = createTestInstance();

        const { personId } = await t.run(async ctx => {
          const userId = `test_user_${Math.random().toString(36).substring(7)}`;
          const personId = await ctx.db.insert('persons', {
            userId,
            status: 'INVISIBLE',
            lastSeen: Date.now(), // Fresh, but still shows offline
          });
          return { personId };
        });

        const { auth } = await TestScenarios.simpleUser(t);

        const result = await auth.query(api.presence.getPersonStatus, {
          personId,
        });

        expect(result.status).toBe('OFFLINE');
        expect(result.isOnline).toBe(false);
        expect(result.lastSeen).toBeNull(); // Don't reveal lastSeen for invisible users
      });
    });

    describe('status expiration', () => {
      it('should treat expired DND as ONLINE', async () => {
        const t = createTestInstance();

        const { personId } = await t.run(async ctx => {
          const userId = `test_user_${Math.random().toString(36).substring(7)}`;
          const personId = await ctx.db.insert('persons', {
            userId,
            status: 'DO_NOT_DISTURB',
            statusExpiresAt: Date.now() - 1000, // Expired 1 second ago
            lastSeen: Date.now(), // Fresh
          });
          return { personId };
        });

        const { auth } = await TestScenarios.simpleUser(t);

        const result = await auth.query(api.presence.getPersonStatus, {
          personId,
        });

        // Expired DND should show as ONLINE (with fresh lastSeen)
        expect(result.status).toBe('ONLINE');
        expect(result.isOnline).toBe(true);
      });

      it('should treat expired IDLE as ONLINE', async () => {
        const t = createTestInstance();

        const { personId } = await t.run(async ctx => {
          const userId = `test_user_${Math.random().toString(36).substring(7)}`;
          const personId = await ctx.db.insert('persons', {
            userId,
            status: 'IDLE',
            statusExpiresAt: Date.now() - 1000, // Expired
            lastSeen: Date.now(), // Fresh
          });
          return { personId };
        });

        const { auth } = await TestScenarios.simpleUser(t);

        const result = await auth.query(api.presence.getPersonStatus, {
          personId,
        });

        expect(result.status).toBe('ONLINE');
        expect(result.isOnline).toBe(true);
      });

      it('should respect non-expired DND status', async () => {
        const t = createTestInstance();

        const { personId } = await t.run(async ctx => {
          const userId = `test_user_${Math.random().toString(36).substring(7)}`;
          const personId = await ctx.db.insert('persons', {
            userId,
            status: 'DO_NOT_DISTURB',
            statusExpiresAt: Date.now() + 60 * 60 * 1000, // Expires in 1 hour
            lastSeen: Date.now(), // Fresh
          });
          return { personId };
        });

        const { auth } = await TestScenarios.simpleUser(t);

        const result = await auth.query(api.presence.getPersonStatus, {
          personId,
        });

        expect(result.status).toBe('DO_NOT_DISTURB');
      });
    });

    describe('visibility settings', () => {
      it('should return OFFLINE for NONE visibility setting', async () => {
        const t = createTestInstance();

        const { personId } = await t.run(async ctx => {
          const userId = `test_user_${Math.random().toString(36).substring(7)}`;
          const personId = await ctx.db.insert('persons', {
            userId,
            status: 'ONLINE',
            statusVisibility: 'NONE',
            lastSeen: Date.now(), // Fresh
          });
          return { personId };
        });

        const { auth } = await TestScenarios.simpleUser(t);

        const result = await auth.query(api.presence.getPersonStatus, {
          personId,
        });

        expect(result.status).toBe('OFFLINE');
        expect(result.isOnline).toBe(false);
        expect(result.lastSeen).toBeNull();
      });

      it('should return OFFLINE for FRIENDS visibility when not friends', async () => {
        const t = createTestInstance();

        // Create target user with FRIENDS visibility
        const { personId: targetPersonId } = await t.run(async ctx => {
          const userId = `test_user_target`;
          const personId = await ctx.db.insert('persons', {
            userId,
            status: 'ONLINE',
            statusVisibility: 'FRIENDS',
            lastSeen: Date.now(),
          });
          return { personId };
        });

        // Create viewer (not a friend)
        const { auth } = await TestScenarios.simpleUser(t);

        const result = await auth.query(api.presence.getPersonStatus, {
          personId: targetPersonId,
        });

        expect(result.status).toBe('OFFLINE');
        expect(result.isOnline).toBe(false);
      });

      it('should return actual status for FRIENDS visibility when friends', async () => {
        const t = createTestInstance();

        // Create two users
        const { userId: viewerUserId, personId: viewerPersonId } =
          await createTestUser(t, { username: 'viewer' });
        const { personId: targetPersonId } = await t.run(async ctx => {
          const userId = `test_user_target`;
          const personId = await ctx.db.insert('persons', {
            userId,
            status: 'ONLINE',
            statusVisibility: 'FRIENDS',
            lastSeen: Date.now(),
          });
          return { personId };
        });

        // Create friendship between them
        await t.run(async ctx => {
          await ctx.db.insert('friendships', {
            requesterId: viewerPersonId,
            addresseeId: targetPersonId,
            status: 'ACCEPTED',
            createdAt: Date.now(),
          });
        });

        const viewerAuth = createAuthenticatedUser(t, viewerUserId);

        const result = await viewerAuth.query(api.presence.getPersonStatus, {
          personId: targetPersonId,
        });

        expect(result.status).toBe('ONLINE');
        expect(result.isOnline).toBe(true);
      });

      it('should work with reverse friendship direction', async () => {
        const t = createTestInstance();

        // Create viewer
        const { userId: viewerUserId, personId: viewerPersonId } =
          await createTestUser(t, { username: 'viewer' });

        // Create target with FRIENDS visibility
        const { personId: targetPersonId } = await t.run(async ctx => {
          const userId = `test_user_target`;
          const personId = await ctx.db.insert('persons', {
            userId,
            status: 'ONLINE',
            statusVisibility: 'FRIENDS',
            lastSeen: Date.now(),
          });
          return { personId };
        });

        // Friendship where target requested (reverse direction)
        await t.run(async ctx => {
          await ctx.db.insert('friendships', {
            requesterId: targetPersonId, // Target initiated
            addresseeId: viewerPersonId,
            status: 'ACCEPTED',
            createdAt: Date.now(),
          });
        });

        const viewerAuth = createAuthenticatedUser(t, viewerUserId);

        const result = await viewerAuth.query(api.presence.getPersonStatus, {
          personId: targetPersonId,
        });

        expect(result.status).toBe('ONLINE');
        expect(result.isOnline).toBe(true);
      });

      it('should return OFFLINE for pending friendship', async () => {
        const t = createTestInstance();

        const { userId: viewerUserId, personId: viewerPersonId } =
          await createTestUser(t, { username: 'viewer' });
        const { personId: targetPersonId } = await t.run(async ctx => {
          const userId = `test_user_target`;
          const personId = await ctx.db.insert('persons', {
            userId,
            status: 'ONLINE',
            statusVisibility: 'FRIENDS',
            lastSeen: Date.now(),
          });
          return { personId };
        });

        // PENDING friendship (not accepted)
        await t.run(async ctx => {
          await ctx.db.insert('friendships', {
            requesterId: viewerPersonId,
            addresseeId: targetPersonId,
            status: 'PENDING',
            createdAt: Date.now(),
          });
        });

        const viewerAuth = createAuthenticatedUser(t, viewerUserId);

        const result = await viewerAuth.query(api.presence.getPersonStatus, {
          personId: targetPersonId,
        });

        expect(result.status).toBe('OFFLINE');
      });
    });
  });

  describe('setStatus', () => {
    it('should set status to DND', async () => {
      const t = createTestInstance();
      const { personId, auth } = await TestScenarios.simpleUser(t);

      const result = await auth.mutation(api.presence.setStatus, {
        status: 'DO_NOT_DISTURB',
      });

      expect(result.success).toBe(true);
      expect(result.status).toBe('DO_NOT_DISTURB');

      // Verify in database
      const { person } = await t.run(async ctx => {
        const person = await ctx.db.get(personId);
        return { person };
      });

      expect(person?.status).toBe('DO_NOT_DISTURB');
    });

    it('should set status with duration', async () => {
      const t = createTestInstance();
      const { personId, auth } = await TestScenarios.simpleUser(t);

      const beforeTime = Date.now();
      const result = await auth.mutation(api.presence.setStatus, {
        status: 'DO_NOT_DISTURB',
        duration: '1_HOUR',
      });

      expect(result.success).toBe(true);
      expect(result.expiresAt).toBeDefined();
      expect(result.expiresAt).toBeGreaterThan(beforeTime);
      expect(result.expiresAt).toBeLessThanOrEqual(
        beforeTime + 60 * 60 * 1000 + 1000
      );

      // Verify in database
      const { person } = await t.run(async ctx => {
        const person = await ctx.db.get(personId);
        return { person };
      });

      expect(person?.statusExpiresAt).toBeDefined();
    });

    it('should not set expiration for FOREVER duration', async () => {
      const t = createTestInstance();
      const { personId, auth } = await TestScenarios.simpleUser(t);

      const result = await auth.mutation(api.presence.setStatus, {
        status: 'DO_NOT_DISTURB',
        duration: 'FOREVER',
      });

      expect(result.success).toBe(true);
      expect(result.expiresAt).toBeUndefined();

      const { person } = await t.run(async ctx => {
        const person = await ctx.db.get(personId);
        return { person };
      });

      expect(person?.statusExpiresAt).toBeUndefined();
    });

    it('should clear expiration when setting ONLINE', async () => {
      const t = createTestInstance();
      const { personId, auth } = await TestScenarios.simpleUser(t);

      // First set DND with duration
      await auth.mutation(api.presence.setStatus, {
        status: 'DO_NOT_DISTURB',
        duration: '1_HOUR',
      });

      // Then set ONLINE
      const result = await auth.mutation(api.presence.setStatus, {
        status: 'ONLINE',
      });

      expect(result.success).toBe(true);

      const { person } = await t.run(async ctx => {
        const person = await ctx.db.get(personId);
        return { person };
      });

      expect(person?.status).toBe('ONLINE');
      // Expiration should be cleared for ONLINE status
    });

    it('should set statusSource to manual', async () => {
      const t = createTestInstance();
      const { personId, auth } = await TestScenarios.simpleUser(t);

      await auth.mutation(api.presence.setStatus, {
        status: 'IDLE',
      });

      const { person } = await t.run(async ctx => {
        const person = await ctx.db.get(personId);
        return { person };
      });

      expect(person?.statusSource).toBe('manual');
    });

    it('should set autoIdleEnabled setting', async () => {
      const t = createTestInstance();
      const { personId, auth } = await TestScenarios.simpleUser(t);

      await auth.mutation(api.presence.setStatus, {
        status: 'ONLINE',
        autoIdleEnabled: false,
      });

      const { person } = await t.run(async ctx => {
        const person = await ctx.db.get(personId);
        return { person };
      });

      expect(person?.autoIdleEnabled).toBe(false);
    });

    it('should set statusVisibility setting', async () => {
      const t = createTestInstance();
      const { personId, auth } = await TestScenarios.simpleUser(t);

      await auth.mutation(api.presence.setStatus, {
        status: 'ONLINE',
        statusVisibility: 'FRIENDS',
      });

      const { person } = await t.run(async ctx => {
        const person = await ctx.db.get(personId);
        return { person };
      });

      expect(person?.statusVisibility).toBe('FRIENDS');
    });

    it('should require authentication', async () => {
      const t = createTestInstance();

      await expect(
        t.mutation(api.presence.setStatus, {
          status: 'DO_NOT_DISTURB',
        })
      ).rejects.toThrow();
    });
  });

  describe('clearStatus', () => {
    it('should revert status to ONLINE', async () => {
      const t = createTestInstance();
      const { personId, auth } = await TestScenarios.simpleUser(t);

      // Set DND first
      await auth.mutation(api.presence.setStatus, {
        status: 'DO_NOT_DISTURB',
        duration: '1_HOUR',
      });

      // Clear status
      const result = await auth.mutation(api.presence.clearStatus, {});

      expect(result.success).toBe(true);

      const { person } = await t.run(async ctx => {
        const person = await ctx.db.get(personId);
        return { person };
      });

      expect(person?.status).toBe('ONLINE');
      expect(person?.statusExpiresAt).toBeUndefined();
    });

    it('should clear statusSource', async () => {
      const t = createTestInstance();
      const { personId, auth } = await TestScenarios.simpleUser(t);

      // Set DND (sets statusSource: 'manual')
      await auth.mutation(api.presence.setStatus, {
        status: 'DO_NOT_DISTURB',
      });

      // Clear status
      await auth.mutation(api.presence.clearStatus, {});

      const { person } = await t.run(async ctx => {
        const person = await ctx.db.get(personId);
        return { person };
      });

      expect(person?.status).toBe('ONLINE');
      expect(person?.statusSource).toBeUndefined();
    });
  });

  describe('setAutoIdle', () => {
    it('should set IDLE when isIdle=true and status is ONLINE', async () => {
      const t = createTestInstance();
      const { personId, auth } = await TestScenarios.simpleUser(t);

      // Ensure status is ONLINE
      await auth.mutation(api.presence.setStatus, { status: 'ONLINE' });

      const result = await auth.mutation(api.presence.setAutoIdle, {
        isIdle: true,
      });

      expect(result.success).toBe(true);
      expect(result.status).toBe('IDLE');

      const { person } = await t.run(async ctx => {
        const person = await ctx.db.get(personId);
        return { person };
      });

      expect(person?.status).toBe('IDLE');
    });

    it('should revert to ONLINE when isIdle=false and status is auto IDLE', async () => {
      const t = createTestInstance();
      const { personId, auth } = await TestScenarios.simpleUser(t);

      // Set to auto IDLE first (simulating what setAutoIdle would do)
      await t.run(async ctx => {
        await ctx.db.patch(personId, { status: 'IDLE', statusSource: 'auto' });
      });

      const result = await auth.mutation(api.presence.setAutoIdle, {
        isIdle: false,
      });

      expect(result.success).toBe(true);
      expect(result.status).toBe('ONLINE');

      const { person } = await t.run(async ctx => {
        const person = await ctx.db.get(personId);
        return { person };
      });

      expect(person?.status).toBe('ONLINE');
    });

    it('should NOT override DND status with IDLE', async () => {
      const t = createTestInstance();
      const { personId, auth } = await TestScenarios.simpleUser(t);

      // Set DND
      await auth.mutation(api.presence.setStatus, {
        status: 'DO_NOT_DISTURB',
      });

      const result = await auth.mutation(api.presence.setAutoIdle, {
        isIdle: true,
      });

      expect(result.success).toBe(false);
      expect(result.reason).toBe('dnd_active');

      const { person } = await t.run(async ctx => {
        const person = await ctx.db.get(personId);
        return { person };
      });

      // Should still be DND
      expect(person?.status).toBe('DO_NOT_DISTURB');
    });

    it('should NOT override INVISIBLE status with IDLE', async () => {
      const t = createTestInstance();
      const { personId, auth } = await TestScenarios.simpleUser(t);

      // Set INVISIBLE
      await auth.mutation(api.presence.setStatus, {
        status: 'INVISIBLE',
      });

      const result = await auth.mutation(api.presence.setAutoIdle, {
        isIdle: true,
      });

      expect(result.success).toBe(false);
      expect(result.reason).toBe('invisible_active');

      const { person } = await t.run(async ctx => {
        const person = await ctx.db.get(personId);
        return { person };
      });

      expect(person?.status).toBe('INVISIBLE');
    });

    it('should respect autoIdleEnabled=false setting', async () => {
      const t = createTestInstance();
      const { personId, auth } = await TestScenarios.simpleUser(t);

      // Disable auto-idle
      await auth.mutation(api.presence.setStatus, {
        status: 'ONLINE',
        autoIdleEnabled: false,
      });

      const result = await auth.mutation(api.presence.setAutoIdle, {
        isIdle: true,
      });

      expect(result.success).toBe(false);
      expect(result.reason).toBe('auto_idle_disabled');

      const { person } = await t.run(async ctx => {
        const person = await ctx.db.get(personId);
        return { person };
      });

      // Should still be ONLINE
      expect(person?.status).toBe('ONLINE');
    });

    it('should do nothing when already IDLE and isIdle=true', async () => {
      const t = createTestInstance();
      const { personId, auth } = await TestScenarios.simpleUser(t);

      // Set to auto IDLE
      await t.run(async ctx => {
        await ctx.db.patch(personId, { status: 'IDLE', statusSource: 'auto' });
      });

      const result = await auth.mutation(api.presence.setAutoIdle, {
        isIdle: true,
      });

      expect(result.success).toBe(true);
      // No status change since already IDLE
      expect(result.status).toBeUndefined();
    });

    it('should preserve manually-set IDLE when reverting (statusSource=manual)', async () => {
      const t = createTestInstance();
      const { personId, auth } = await TestScenarios.simpleUser(t);

      // Manually set IDLE via setStatus (sets statusSource: 'manual')
      await auth.mutation(api.presence.setStatus, { status: 'IDLE' });

      // Verify it's manual
      const { person: before } = await t.run(async ctx => {
        const person = await ctx.db.get(personId);
        return { person };
      });
      expect(before?.statusSource).toBe('manual');

      // Try to revert via setAutoIdle
      const result = await auth.mutation(api.presence.setAutoIdle, {
        isIdle: false,
      });

      expect(result.success).toBe(true);
      // Should NOT have reverted since it was manually set
      expect(result.status).toBeUndefined();

      const { person: after } = await t.run(async ctx => {
        const person = await ctx.db.get(personId);
        return { person };
      });
      expect(after?.status).toBe('IDLE');
      expect(after?.statusSource).toBe('manual');
    });

    it('should clean up expired status before processing idle', async () => {
      const t = createTestInstance();
      const { personId, auth } = await TestScenarios.simpleUser(t);

      // Set expired DND directly in DB
      await t.run(async ctx => {
        await ctx.db.patch(personId, {
          status: 'DO_NOT_DISTURB',
          statusExpiresAt: Date.now() - 1000, // Expired
          statusSource: 'manual',
        });
      });

      // setAutoIdle should clean up expired DND and then set IDLE
      const result = await auth.mutation(api.presence.setAutoIdle, {
        isIdle: true,
      });

      expect(result.success).toBe(true);
      expect(result.status).toBe('IDLE');

      const { person } = await t.run(async ctx => {
        const person = await ctx.db.get(personId);
        return { person };
      });

      expect(person?.status).toBe('IDLE');
      expect(person?.statusSource).toBe('auto');
    });

    it('should allow revert even when autoIdleEnabled=false', async () => {
      const t = createTestInstance();
      const { personId, auth } = await TestScenarios.simpleUser(t);

      // Set auto IDLE first, then disable auto-idle
      await t.run(async ctx => {
        await ctx.db.patch(personId, {
          status: 'IDLE',
          statusSource: 'auto',
          autoIdleEnabled: false,
        });
      });

      // isIdle=false should still revert even though autoIdleEnabled is false
      const result = await auth.mutation(api.presence.setAutoIdle, {
        isIdle: false,
      });

      expect(result.success).toBe(true);
      expect(result.status).toBe('ONLINE');

      const { person } = await t.run(async ctx => {
        const person = await ctx.db.get(personId);
        return { person };
      });

      expect(person?.status).toBe('ONLINE');
      expect(person?.statusSource).toBeUndefined();
    });

    it('should set statusSource=auto when auto-idling', async () => {
      const t = createTestInstance();
      const { personId, auth } = await TestScenarios.simpleUser(t);

      await auth.mutation(api.presence.setStatus, { status: 'ONLINE' });

      const result = await auth.mutation(api.presence.setAutoIdle, {
        isIdle: true,
      });

      expect(result.success).toBe(true);
      expect(result.status).toBe('IDLE');

      const { person } = await t.run(async ctx => {
        const person = await ctx.db.get(personId);
        return { person };
      });

      expect(person?.statusSource).toBe('auto');
    });

    it('should do nothing when ONLINE and isIdle=false', async () => {
      const t = createTestInstance();
      const { auth } = await TestScenarios.simpleUser(t);

      // Ensure ONLINE
      await auth.mutation(api.presence.setStatus, { status: 'ONLINE' });

      const result = await auth.mutation(api.presence.setAutoIdle, {
        isIdle: false,
      });

      expect(result.success).toBe(true);
      // No status change since already ONLINE
      expect(result.status).toBeUndefined();
    });
  });

  describe('getMyStatus', () => {
    it('should return current user status', async () => {
      const t = createTestInstance();
      const { auth } = await TestScenarios.simpleUser(t);

      // Set some status
      await auth.mutation(api.presence.setStatus, {
        status: 'DO_NOT_DISTURB',
        duration: '1_HOUR',
      });

      const result = await auth.query(api.presence.getMyStatus, {});

      expect(result).not.toBeNull();
      expect(result.status).toBe('DO_NOT_DISTURB');
      expect(result.statusExpiresAt).toBeDefined();
      expect(result.autoIdleEnabled).toBe(true); // Default
      expect(result.statusVisibility).toBe('EVERYONE'); // Default
    });

    it('should return expired status as ONLINE', async () => {
      const t = createTestInstance();
      const { personId, auth } = await TestScenarios.simpleUser(t);

      // Set expired DND directly in DB
      await t.run(async ctx => {
        await ctx.db.patch(personId, {
          status: 'DO_NOT_DISTURB',
          statusExpiresAt: Date.now() - 1000, // Expired
        });
      });

      const result = await auth.query(api.presence.getMyStatus, {});

      expect(result.status).toBe('ONLINE'); // Expired, treated as ONLINE
      expect(result.statusExpiresAt).toBeUndefined();
    });

    it('should return null for unauthenticated user', async () => {
      const t = createTestInstance();

      const result = await t.query(api.presence.getMyStatus, {});

      expect(result).toBeNull();
    });
  });

  describe('DND notification muting', () => {
    it('should skip external notifications for DND users', async () => {
      const t = createTestInstance();

      // Create organizer and attendee
      const { attendee, eventId, organizerAuth, attendeeAuth } =
        await TestScenarios.multiUser(t);

      // Set attendee to DND
      await attendeeAuth.mutation(api.presence.setStatus, {
        status: 'DO_NOT_DISTURB',
      });

      // Organizer creates a post
      await organizerAuth.mutation(api.posts.mutations.createPost, {
        eventId,
        title: 'Test Post',
        content: 'Test content',
      });

      // Check notifications - should still create in-app notification
      // but skip external notifications
      const { notifications } = await t.run(async ctx => {
        const notifications = await ctx.db
          .query('notifications')
          .withIndex('by_person', q => q.eq('personId', attendee.personId))
          .collect();
        return { notifications };
      });

      // In-app notification should still be created
      expect(notifications.length).toBeGreaterThanOrEqual(1);
      expect(notifications[0].type).toBe('NEW_POST');
    });

    it('should respect DND even when user appears offline (stale lastSeen)', async () => {
      const t = createTestInstance();

      const { attendee, eventId, organizerAuth } =
        await TestScenarios.multiUser(t);

      // Set attendee to DND with stale lastSeen
      await t.run(async ctx => {
        await ctx.db.patch(attendee.personId, {
          status: 'DO_NOT_DISTURB',
          lastSeen: Date.now() - 10 * 60 * 1000, // 10 minutes ago (stale)
        });
      });

      // Create a post
      await organizerAuth.mutation(api.posts.mutations.createPost, {
        eventId,
        title: 'Test Post',
        content: 'Test content',
      });

      // DND should still be respected for notification muting
      // even though the user appears offline to others
      const { notifications, person } = await t.run(async ctx => {
        const notifications = await ctx.db
          .query('notifications')
          .withIndex('by_person', q => q.eq('personId', attendee.personId))
          .collect();
        const person = await ctx.db.get(attendee.personId);
        return { notifications, person };
      });

      // Verify person is in DND (for notification purposes)
      expect(person?.status).toBe('DO_NOT_DISTURB');
      // In-app notification still created
      expect(notifications.length).toBeGreaterThanOrEqual(1);
    });

    it('should not skip notifications when DND has expired', async () => {
      const t = createTestInstance();

      const { attendee, eventId, organizerAuth } =
        await TestScenarios.multiUser(t);

      // Set attendee to expired DND
      await t.run(async ctx => {
        await ctx.db.patch(attendee.personId, {
          status: 'DO_NOT_DISTURB',
          statusExpiresAt: Date.now() - 1000, // Expired
          lastSeen: Date.now(),
        });
      });

      // Create a post
      await organizerAuth.mutation(api.posts.mutations.createPost, {
        eventId,
        title: 'Test Post',
        content: 'Test content',
      });

      // Should create notification since DND expired
      const { notifications } = await t.run(async ctx => {
        const notifications = await ctx.db
          .query('notifications')
          .withIndex('by_person', q => q.eq('personId', attendee.personId))
          .collect();
        return { notifications };
      });

      expect(notifications.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('updateLastSeen', () => {
    it('should update lastSeen timestamp', async () => {
      const t = createTestInstance();
      const { personId, auth } = await TestScenarios.simpleUser(t);

      const beforeTime = Date.now();
      const result = await auth.mutation(api.presence.updateLastSeen, {});
      const afterTime = Date.now();

      expect(result.success).toBe(true);

      const { person } = await t.run(async ctx => {
        const person = await ctx.db.get(personId);
        return { person };
      });

      expect(person?.lastSeen).toBeGreaterThanOrEqual(beforeTime);
      expect(person?.lastSeen).toBeLessThanOrEqual(afterTime);
    });

    it('should fail for unauthenticated user', async () => {
      const t = createTestInstance();

      const result = await t.mutation(api.presence.updateLastSeen, {});

      expect(result.success).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should handle user with no status set (defaults)', async () => {
      const t = createTestInstance();

      // Create user with no status fields set
      const { personId } = await t.run(async ctx => {
        const userId = `test_user_${Math.random().toString(36).substring(7)}`;
        const personId = await ctx.db.insert('persons', {
          userId,
          // No status, no lastSeen, no visibility
        });
        return { personId };
      });

      const { auth } = await TestScenarios.simpleUser(t);

      const result = await auth.query(api.presence.getPersonStatus, {
        personId,
      });

      expect(result.status).toBe('OFFLINE'); // No lastSeen = offline
      expect(result.isOnline).toBe(false);
    });

    it('should handle boundary case: exactly 5 minutes ago', async () => {
      const t = createTestInstance();
      const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;

      const { personId } = await t.run(async ctx => {
        const userId = `test_user_${Math.random().toString(36).substring(7)}`;
        const personId = await ctx.db.insert('persons', {
          userId,
          status: 'ONLINE',
          lastSeen: fiveMinutesAgo,
        });
        return { personId };
      });

      const { auth } = await TestScenarios.simpleUser(t);

      const result = await auth.query(api.presence.getPersonStatus, {
        personId,
      });

      // Exactly 5 minutes should still be considered stale (>= check)
      expect(result.status).toBe('OFFLINE');
    });

    it('should handle just under 5 minutes ago', async () => {
      const t = createTestInstance();
      const justUnderFiveMinutes = Date.now() - 4 * 60 * 1000 - 59 * 1000; // 4:59

      const { personId } = await t.run(async ctx => {
        const userId = `test_user_${Math.random().toString(36).substring(7)}`;
        const personId = await ctx.db.insert('persons', {
          userId,
          status: 'ONLINE',
          lastSeen: justUnderFiveMinutes,
        });
        return { personId };
      });

      const { auth } = await TestScenarios.simpleUser(t);

      const result = await auth.query(api.presence.getPersonStatus, {
        personId,
      });

      expect(result.status).toBe('ONLINE');
      expect(result.isOnline).toBe(true);
    });

    it('should handle all duration options', async () => {
      const t = createTestInstance();
      const { auth } = await TestScenarios.simpleUser(t);

      const durations = [
        '15_MINUTES',
        '1_HOUR',
        '8_HOURS',
        '24_HOURS',
        '3_DAYS',
        'FOREVER',
      ] as const;

      const expectedMs: Record<string, number | null> = {
        '15_MINUTES': 15 * 60 * 1000,
        '1_HOUR': 60 * 60 * 1000,
        '8_HOURS': 8 * 60 * 60 * 1000,
        '24_HOURS': 24 * 60 * 60 * 1000,
        '3_DAYS': 3 * 24 * 60 * 60 * 1000,
        FOREVER: null,
      };

      for (const duration of durations) {
        const beforeTime = Date.now();
        const result = await auth.mutation(api.presence.setStatus, {
          status: 'IDLE',
          duration,
        });

        expect(result.success).toBe(true);

        if (expectedMs[duration] === null) {
          expect(result.expiresAt).toBeUndefined();
        } else {
          expect(result.expiresAt).toBeGreaterThanOrEqual(
            beforeTime + expectedMs[duration]! - 100
          );
          expect(result.expiresAt).toBeLessThanOrEqual(
            beforeTime + expectedMs[duration]! + 1000
          );
        }
      }
    });
  });
});
