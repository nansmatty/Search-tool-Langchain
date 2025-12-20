// Why we actually chunk text:
// 1. To create manageable pieces of information that can be easily processed and retrieved.
// 2. To improve the efficiency of retrieval operations by reducing the amount of data to be scanned.
// 3. To enhance the performance of machine learning models by providing them with smaller, contextually relevant segments of text.
// 4. To facilitate better indexing and organization of large documents or datasets.
// 5. To enable more effective summarization and analysis by breaking down complex information into simpler parts.

import { Document } from 'langchain';

export const CHUNK_SIZE = 1000; // Number of characters per chunk
export const CHUNK_OVERLAP = 150; // Number of overlapping characters between chunks

export function chunkText(text: string, source: string): Document[] {
	const clean = (text ?? '').replace(/\r\n+/g, '\n');

	const docs: Document[] = [];

	if (!clean.trim()) return docs;

	const step = Math.max(1, CHUNK_SIZE - CHUNK_OVERLAP);

	let start = 0;
	let chunkId = 0;
	while (start < clean.length) {
		const end = Math.min(clean.length, start + CHUNK_SIZE);
		// remove leading/trailing blank lines
		const slice = clean.slice(start, end).trim();
		if (slice.length > 0) {
			docs.push(
				new Document({
					pageContent: slice,
					metadata: { source, chunkId },
				})
			);
			// Next chunk will get the next id
			chunkId += 1;
		}
		start += step;
	}

	return docs;
}
