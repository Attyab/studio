'use server';

/**
 * @fileOverview An AI agent for suggesting task priorities.
 *
 * - suggestTaskPriority - A function that suggests a task priority.
 * - SuggestTaskPriorityInput - The input type for the suggestTaskPriority function.
 * - SuggestTaskPriorityOutput - The return type for the suggestTaskPriority function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestTaskPriorityInputSchema = z.object({
  taskDescription: z
    .string()
    .describe('A detailed description of the task.'),
  recentActivity: z
    .string()
    .describe(
      'A summary of recent activity related to the task, including any updates, comments, or changes.'
    ),
});
export type SuggestTaskPriorityInput = z.infer<typeof SuggestTaskPriorityInputSchema>;

const SuggestTaskPriorityOutputSchema = z.object({
  prioritySuggestion: z
    .string()
    .describe(
      'The suggested priority level for the task (e.g., High, Medium, Low), based on the description and recent activity.'
    ),
  reasoning: z
    .string()
    .describe(
      'A brief explanation of why the AI suggested the given priority level.'
    ),
});
export type SuggestTaskPriorityOutput = z.infer<typeof SuggestTaskPriorityOutputSchema>;

export async function suggestTaskPriority(
  input: SuggestTaskPriorityInput
): Promise<SuggestTaskPriorityOutput> {
  return suggestTaskPriorityFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestTaskPriorityPrompt',
  input: {schema: SuggestTaskPriorityInputSchema},
  output: {schema: SuggestTaskPriorityOutputSchema},
  prompt: `You are an AI assistant that helps users prioritize their tasks. Based on the task description and recent activity, suggest a priority level for the task.

Task Description: {{{taskDescription}}}
Recent Activity: {{{recentActivity}}}

Consider the following factors when determining the priority:
- Urgency: How quickly does the task need to be completed?
- Importance: How critical is the task to the overall project or goals?
- Impact: What is the potential impact of not completing the task?

Respond with the priority suggestion and reasoning. The priority suggestion should be one of: High, Medium, or Low.
`,
});

const suggestTaskPriorityFlow = ai.defineFlow(
  {
    name: 'suggestTaskPriorityFlow',
    inputSchema: SuggestTaskPriorityInputSchema,
    outputSchema: SuggestTaskPriorityOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
