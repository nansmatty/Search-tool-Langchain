import { HumanMessage, SystemMessage } from 'langchain';
import { getChatModel } from '../shared/models';
import { getVectorStoreInstance } from './store';

export type KBSource = {
	source: string;
	chunkId: number;
};

export type AskResponse = {
	answer: string;
	sources: KBSource[];
	confidence: number;
};

function buildContext(chunks: { text: string; meta: any }[]) {
	return chunks
		.map(({ text, meta }, i) =>
			[`[#${i + 1} ${String(meta?.source) ?? 'unknown'} #${String(meta?.chunkId) ?? '?'}]`, text ?? 'Empty text'].join('\n')
		)
		.join('\n\n---\n\n');
}

async function buildFinalAnswerFromLLM(query: string, context: string) {
	const model = getChatModel({ temperature: 0.2 });
	const res = await model.invoke([
		new SystemMessage(
			[
				'You are an AI assistant that helps users by providing answers based on the provided context.',
				'Use the context to answer the question as accurately as possible.',
				'If the context does not contain relevant information, respond with "I do not know."',
				'Keep your answers concise (4 - 5 sentences), neutral, and avoid any marketing info.',
				'Do not fabricate sources or cite anything that is not in the context.',
			].join('\n')
		),
		new HumanMessage([`Question: ${query}\n\n`, `Context:\n${context ?? 'no relevant context'}\n\n`].join(`\n`)),
	]);

	const finalResponse = typeof res.content === 'string' ? res.content : String(res.content);

	return finalResponse.trim().slice(0, 2000); // Limit to first 2000 characters
}

function buildConfidenceScore(scores: number[]): number {
	if (scores.length === 0) return 0;
	const clamped = scores.map((s) => Math.max(0, Math.min(1, s)));
	const avgScore = clamped.reduce((a, b) => a + b, 0) / clamped.length;
	return Math.round(avgScore * 100) / 100; // Round to 2 decimal places
}

export async function askQuestion(query: string, k = 2): Promise<AskResponse> {
	const validateCurrentQuery = (query ?? '').trim();

	if (!validateCurrentQuery) {
		throw new Error('Query is empty! Please try again.');
	}

	const store = getVectorStoreInstance();

	//Embed the query using the same embeddings as the vector store
	const embedQuery = await store.embeddings.embedQuery(validateCurrentQuery);

	// Retrieve relevant documents from the vector store
	const pairs = await store.similaritySearchVectorWithScore(embedQuery, k);

	const chunks = pairs.map(([doc]) => ({
		text: doc.pageContent || '',
		meta: doc.metadata || {},
	}));

	const scores = pairs.map(([_, score]) => Number(score) || 0);

	// Prompt Context Construction
	const context = buildContext(chunks);

	const answer = await buildFinalAnswerFromLLM(validateCurrentQuery, context);

	const sources: KBSource[] = chunks.map(({ meta }) => ({
		source: String(meta?.source ?? 'unknown'),
		chunkId: Number(meta?.chunkId) ?? 0,
	}));

	const confidence = buildConfidenceScore(scores);

	return { answer, sources, confidence };
}
