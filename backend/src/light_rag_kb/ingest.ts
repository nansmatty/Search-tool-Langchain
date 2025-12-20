// Chunk the text using fixed rules and embed our chunks into a vector store

import { chunkText } from './chunk';
import { addChunks } from './store';

export type IngestTextInput = {
	text: string;
	source?: string;
};

export async function ingestText(input: IngestTextInput) {
	const raw = (input.text ?? '').trim();
	if (!raw) {
		throw new Error('No text provided for ingestion');
	}
	const source = input.source || 'pasted-text';
	const docs = chunkText(raw, source);

	// embed and store chunks
	const chunkCount = await addChunks(docs);

	return { docCount: 1, chunkCount, source };
}
