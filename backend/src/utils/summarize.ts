import { HumanMessage, SystemMessage } from 'langchain'; // in video it was imported from @langchain/core ....
import { getChatModel } from '../shared/models';
import { SummarizeInputSchema, SummarizeOutputSchema } from './schema';

export async function summarize(text: string) {
	const { text: raw } = SummarizeInputSchema.parse({ text });

	const clipped = clip(raw, 4000);

	const model = getChatModel({ temperature: 0.2 });

	const res = await model.invoke([
		new SystemMessage(
			[
				'You are a helpful assistant to write short accurate summaries.',
				'Guidelines: ',
				'- Be factual and neutral, avoid marketing language.',
				'- 5-8 sentences, no lists unless absolutely necessary.',
				'- Do Not invent sources; you only summaries the provided text.',
				'- Keep it readable for beginners.',
			].join('\n')
		),

		new HumanMessage(
			['Summarize the following content for a beginner friendly audience.', 'Focus on key facts and remove fluff', 'TEXT:', clipped].join('\n\n')
		),
	]);

	const rawModelOutput = typeof res.content === 'string' ? res.content : String(res.content);

	const summary = normalizeSummmary(rawModelOutput);

	return SummarizeOutputSchema.parse({ summary });
}

function clip(s: string, max: number) {
	return s.length > max ? s.slice(0, max) : s;
}

function normalizeSummmary(s: string) {
	const t = s
		.replace(/\s+\n/g, '\n')
		.replace(/\n{3,}/g, '\n\n')
		.trim();

	return t.slice(0, 2500);
}
