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
 * Uses Groq API with GPT-OSS 20B for reliable structured output.
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
  handler: async (_ctx, { input, referenceDate, timezone }) => {
    const groqApiKey = process.env.GROQ_API_KEY;

    if (!groqApiKey) {
      throw new Error(
        'GROQ_API_KEY is not set. Please add it to your Convex environment variables.'
      );
    }

    const refDate = new Date(referenceDate);
    const dayOfWeek = refDate.toLocaleDateString('en-US', {
      weekday: 'long',
      timeZone: timezone,
    });
    const formattedDate = refDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: timezone,
    });

    const systemPrompt = `You are a date expression decomposer for an event planning app. You break compound date/time expressions into simple, individual expressions that a date parser can understand. Always respond with valid JSON containing an "expressions" array.`;

    const userPrompt = `Break this date/time expression into individual simple expressions.

Today is ${formattedDate} (${dayOfWeek}). Timezone: ${timezone}.

Input: "${input}"

## Output format rules
- Each expression = exactly ONE date with its time or time range
- Use "to" for time ranges: "6 pm to 8 pm" (not hyphens)
- Always include am/pm on times
- Keep relative terms like "next Friday", "tomorrow" — do NOT convert them to absolute dates
- For sequences ("the next N [weekday]s"), use: "next [weekday]", "[weekday] in 2 weeks", "[weekday] in 3 weeks", etc.

## Splitting rules
- Split on "and", "or", commas, semicolons
- Distribute shared time ranges to each date: "Tue and Thu 6-8pm" → two expressions, each with "6 pm to 8 pm"
- Distribute shared qualifiers: "Monday and Wednesday next week 3pm" → both get "next week" and "3pm"
- Day ranges with "through"/"to"/hyphens between dates mean enumerate each day: "Monday through Wednesday 2pm" → Mon, Tue, Wed each at 2pm
- "Dec 20-22 at 7pm" means three separate days (20th, 21st, 22nd), NOT a time range

## Special terms
- "weekend" = Saturday and Sunday (2 expressions)
- "weekdays" / "weeknights" = Monday through Friday
- Holiday names: ALWAYS convert to explicit dates (Halloween → October 31, Christmas Eve → December 24, Christmas → December 25, New Year's Eve → December 31, New Year's Day → January 1, Valentine's Day → February 14, Independence Day / 4th of July → July 4, St. Patrick's Day → March 17, Easter → look up the date for the current/next year, Thanksgiving → 4th Thursday of November). For any other holiday, convert to the correct date.
- "morning" → keep as "morning", "afternoon" → keep as "afternoon", "evening" → keep as "evening"

## Ignore non-date words
- Strip conversational filler: "let's do", "maybe", "how about", "I'm thinking", "around" → just output the date/time
- "brunch next Sunday at 11" → "next Sunday at 11 am"

## Examples
- "fri or sat 4-8pm" → {"expressions": ["Friday 4 pm to 8 pm", "Saturday 4 pm to 8 pm"]}
- "Tuesday and Thursday next week 6-8pm" → {"expressions": ["Tuesday next week 6 pm to 8 pm", "Thursday next week 6 pm to 8 pm"]}
- "the next 3 Tuesdays at 2pm" → {"expressions": ["next Tuesday at 2pm", "Tuesday in 2 weeks at 2pm", "Tuesday in 3 weeks at 2pm"]}
- "tomorrow or Sunday 5pm" → {"expressions": ["tomorrow at 5pm", "Sunday at 5pm"]}
- "Jan 15 and 20 from 4-6pm" → {"expressions": ["January 15 4 pm to 6 pm", "January 20 4 pm to 6 pm"]}
- "this weekend 2-5pm" → {"expressions": ["Saturday 2 pm to 5 pm", "Sunday 2 pm to 5 pm"]}
- "next week Monday through Wednesday 9am-12pm" → {"expressions": ["Monday next week 9 am to 12 pm", "Tuesday next week 9 am to 12 pm", "Wednesday next week 9 am to 12 pm"]}
- "Christmas Eve at 7pm" → {"expressions": ["December 24 at 7pm"]}
- "halloween at 8pm" → {"expressions": ["October 31 at 8pm"]}
- "thanksgiving or the day after at 2pm" → {"expressions": ["Thanksgiving at 2pm", "the day after Thanksgiving at 2pm"]}
- "let's do brunch next Sunday at 11" → {"expressions": ["next Sunday at 11 am"]}
- "next Monday and Wednesday 9am-12pm, or Thursday 2-5pm" → {"expressions": ["next Monday 9 am to 12 pm", "next Wednesday 9 am to 12 pm", "next Thursday 2 pm to 5 pm"]}
- "6-8pm next Friday" → {"expressions": ["next Friday 6 pm to 8 pm"]}
- "March 5, 12, and 19 at 3pm" → {"expressions": ["March 5 at 3pm", "March 12 at 3pm", "March 19 at 3pm"]}

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
            model: 'openai/gpt-oss-20b',
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
