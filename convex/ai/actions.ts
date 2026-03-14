'use node';

import { action } from '../_generated/server';
import { v } from 'convex/values';

/**
 * Decomposes compound natural language date expressions into individual simple expressions
 * that can be parsed by chrono-node.
 *
 * The LLM handles language decomposition only - it does NOT calculate dates.
 * Chrono-node handles the actual date parsing from the cleaned-up expressions.
 *
 * Uses Groq API with Llama 3.3 70B for reliable structured output.
 *
 * For example: "fri or sat 4-8pm"
 * Returns: ["Friday 4pm to 8pm", "Saturday 4pm to 8pm"]
 */
export const decomposeDateExpression = action({
  args: {
    input: v.string(),
    referenceDate: v.number(),
    timezone: v.string(),
  },
  handler: async (_ctx, { input }) => {
    const groqApiKey = process.env.GROQ_API_KEY;

    if (!groqApiKey) {
      throw new Error(
        'GROQ_API_KEY is not set. Please add it to your Convex environment variables.'
      );
    }

    const systemPrompt = `You are a date expression decomposer. You break apart compound date/time expressions into simple, individual expressions. Do NOT calculate actual dates - just separate and clean up the language. Always respond with valid JSON containing an "expressions" array.`;

    const userPrompt = `Break this compound date/time expression into individual simple expressions.

Input: "${input}"

Rules:
- Split compound expressions into separate simple expressions
- Keep relative terms as-is (e.g., "next Friday", "tomorrow", "in 2 weeks")
- Each expression should be ONE date/day with its time or time range
- For time ranges, use format "X pm to Y pm" with the word "to" (not hyphens)
- Preserve the original time for each split expression
- Do NOT calculate or convert to absolute dates - keep the natural language

Examples:
- "fri or sat 4-8pm" → {"expressions": ["Friday 4 pm to 8 pm", "Saturday 4 pm to 8 pm"]}
- "Tuesday and Thursday next week 6-8pm" → {"expressions": ["Tuesday next week 6 pm to 8 pm", "Thursday next week 6 pm to 8 pm"]}
- "the next 3 Tuesdays at 2pm" → {"expressions": ["next Tuesday at 2pm", "Tuesday in 2 weeks at 2pm", "Tuesday in 3 weeks at 2pm"]}
- "tomorrow or Sunday 5pm" → {"expressions": ["tomorrow at 5pm", "Sunday at 5pm"]}
- "Jan 15 and 20 from 4-6pm" → {"expressions": ["January 15 4 pm to 6 pm", "January 20 4 pm to 6 pm"]}

Return JSON with an "expressions" array:`;

    try {
      const response = await fetch(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${groqApiKey}`,
          },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt },
            ],
            max_tokens: 1024,
            temperature: 0.1,
            response_format: { type: 'json_object' },
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Groq API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;

      if (!content) {
        throw new Error('No response from AI');
      }

      // Parse the JSON response
      let expressions: string[];
      try {
        const parsed = JSON.parse(content);
        expressions = parsed.expressions;

        if (!expressions) {
          // Fallback: check if it's a direct array
          if (Array.isArray(parsed)) {
            expressions = parsed;
          } else {
            throw new Error("Missing 'expressions' field in response");
          }
        }
      } catch (_parseError) {
        console.error('Failed to parse AI response:', content);
        throw new Error(
          'Failed to parse AI response. Please try rephrasing your input.'
        );
      }

      if (!Array.isArray(expressions) || expressions.length === 0) {
        throw new Error('No date expressions found. Please try rephrasing.');
      }

      return {
        success: true,
        expressions,
      };
    } catch (error) {
      console.error('Error in decomposeDateExpression:', error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
        expressions: [],
      };
    }
  },
});
