import { tavily } from '@tavily/core';
import { env } from '../shared/env';
import { WebSearchResultSchema, WebSearchResultsSchema } from './schema';

if (!env.TAVILY_API_KEY) {
	throw new Error('TAVILY_API_KEY is missing!');
}

const tvly = tavily({ apiKey: env.TAVILY_API_KEY });

export async function webSearch(q: string) {
	const query = (q ?? '').trim();

	if (!query) return [];

	try {
		return await searchTavilyUtil(query);
	} catch (e) {
		console.error('Search failed', e);
		return [];
	}
}

async function searchTavilyUtil(query: string) {
	const response = await tvly.search(query, { searchDepth: 'basic', maxResults: 5, includeAnswer: false, includeImages: false });

	if (!response || !Array.isArray(response.results)) {
		// const text = await safeText(response);
		throw new Error(`Tavily search `);
	}

	const results = Array.isArray(response?.results) ? response.results : [];

	const normalized = results.slice(0, 5).map((r: any) =>
		WebSearchResultSchema.parse({
			title: String(r?.title ?? '').trim() || 'Untitled',
			url: String(r?.url ?? '').trim(),
			snippet: (() => {
				const text = String(r?.content ?? '').trim();
				return text.length > 220 ? text.slice(0, 220) + '...' : text;
			})(),
		})
	);

	return WebSearchResultsSchema.parse(normalized);
}

// async function safeText(res: Response) {
// 	try {
// 		return await res.json();
// 	} catch (error) {
// 		return '<no body>';
// 	}
// }
