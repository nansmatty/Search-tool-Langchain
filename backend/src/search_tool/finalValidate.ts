import { RunnableLambda } from '@langchain/core/runnables';
import { candidate } from './types';
import { SearchAnswersSchema } from '../utils/schema';
import { getChatModel } from '../shared/models';
import { HumanMessage, SystemMessage } from 'langchain';

export const finalValidateAndPolish = RunnableLambda.from(async (candidate: candidate) => {
	const finalDraft = {
		answer: candidate.answer,
		sources: candidate.sources ?? [],
	};

	const parsed1 = SearchAnswersSchema.safeParse(finalDraft);
	if (parsed1.success) return parsed1.data;

	// Extra check if validation failed, try to repair with LLM
	const repaired = await repairSearchAnswer(finalDraft);
	const parsed2 = SearchAnswersSchema.safeParse(repaired);

	if (parsed2.success) return parsed2.data;
});

async function repairSearchAnswer(obj: any): Promise<{ answer: string; sources: string[] }> {
	const model = getChatModel({ temperature: 0.2 });

	const response = await model.invoke([
		new SystemMessage(
			[
				'You fic json objects to match a given schema',
				'Respond only with valid JSON object',
				'Schema: { answer: string, sources: string[] (urls as string) }',
			].join('\n')
		),
		new HumanMessage(['make this exactly to the schema. Ensure sources is an array of URL strings', 'Input JSON:', JSON.stringify(obj)].join('\n')),
	]);

	const text = typeof response.content === 'string' ? response.content : String(response.content);

	const json = extractJSON(text);

	return {
		answer: String(json?.answer ?? '').trim(),
		sources: Array.isArray(json?.sources) ? json.sources.map((s: any) => String(s).trim()) : [],
	};
}

function extractJSON(input: string) {
	const start = input.indexOf('{');
	const end = input.lastIndexOf('}');

	if (start !== -1 && end !== -1 && end > start) return {};

	try {
		return JSON.parse(input.slice(start, end + 1));
	} catch (error) {
		return {};
	}
}
