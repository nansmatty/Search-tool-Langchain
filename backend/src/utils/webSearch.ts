import { tavily } from '@tavily/core';
import { env } from '../shared/env';
import { WebSearchResultSchema, WebSearchResultsSchema } from './schema';
import { Response } from 'express';

export async function webSearch(q: string) {
	const query = (q ?? '').trim();

	if (!query) return [];

	return await searchTavilyUtil(query);
}

async function searchTavilyUtil(query: string) {
	if (!env.TAVILY_API_KEY) {
		throw new Error('TAVILY_API_KEY is missing!');
	}

	const tvly = tavily({ apiKey: env.TAVILY_API_KEY });
	const response = await tvly.search(JSON.stringify({ query }), { searchDepth: 'basic', maxResults: 5, includeAnswer: false, includeImages: false });

	if (!response) {
		const text = await safeText(response);
		throw new Error(`Tavily search failed: ${text}`);
	}

	const results = Array.isArray(response?.results) ? response.results : [];

	const normalized = results.slice(0, 5).map((r: any) =>
		WebSearchResultSchema.parse({
			title: String(r?.title ?? '').trim() || 'Untitled',
			url: String(r?.url ?? '').trim(),
			snippet: String(r?.content ?? '')
				.trim()
				.slice(0, 220),
		})
	);

	return WebSearchResultsSchema.parse(normalized);
}

async function safeText(res: Response) {
	try {
		return await res.json();
	} catch (error) {
		return '<no body>';
	}
}
