import { expect, test, describe } from 'vitest';
import { api } from './_generated/api';
import { createTestInstance, TestScenarios } from './test_helpers';

describe('Posts API - Simple Test', () => {
  test('should create and query posts', async () => {
    const t = createTestInstance();

    // Setup: Create event with user (much simpler!)
    const {
      userId: _userId,
      personId,
      eventId,
      auth,
    } = await TestScenarios.singleEvent(t);

    // Test: Call posts API with authentication

    try {
      const result = await auth.mutation(api.posts.mutations.createPost, {
        eventId,
        title: 'Test Post',
        content: 'This is a test post',
      });

      // Verify the API call worked
      console.log('✅ Post creation API call successful:', result);
      expect(result.post).toBeTruthy();
      expect(result.post.title).toBe('Test Post');
      expect(result.post.content).toBe('This is a test post');
      expect(result.post.authorId).toBe(personId);
    } catch (error) {
      // Log the error for debugging
      console.log('❌ Post creation failed:', error.message);
      console.log('Error details:', error);
      throw error; // Re-throw to fail the test
    }
  });
});
