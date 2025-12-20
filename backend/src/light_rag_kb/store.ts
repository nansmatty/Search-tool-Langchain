import { OpenAIEmbeddings } from '@langchain/openai';
import { env } from '../shared/env';
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import { TaskType } from '@google/generative-ai';
import { MemoryVectorStore } from '@langchain/classic/vectorstores/memory';
import { Document } from 'langchain';

// embeddings and vector stores
type Provider = 'openai' | 'google';

function getProviderConfig(): Provider {
	const getCurrentProvider = (env.RAG_MODEL_PROVIDER || 'gemini').toLowerCase();
	return getCurrentProvider === 'openai' ? 'openai' : 'google';
}

// Embeddings Clients

function makeOpenAIEmbeddings() {
	const key = env.OPENAI_API_KEY || '';
	if (!key) {
		throw new Error('OPENAI_API_KEY is not set in environment variables');
	}

	return new OpenAIEmbeddings({
		apiKey: key,
		modelName: 'text-embedding-3-large',
	});
}

function makeGoogleEmbeddings() {
	const key = env.GOOGLE_API_KEY || '';
	if (!key) {
		throw new Error('GOOGLE_API_KEY is not set in environment variables');
	}

	return new GoogleGenerativeAIEmbeddings({
		apiKey: key,
		model: 'gemini-embedding-002',
		taskType: TaskType.RETRIEVAL_DOCUMENT,
	});
}

function makeEmbeddingsClient() {
	const provider = getProviderConfig();
	return provider === 'openai' ? makeOpenAIEmbeddings() : makeGoogleEmbeddings();
}

let store: MemoryVectorStore | null = null;
let currentSetProvider: Provider | null = null;

export function getVectorStoreInstance(): MemoryVectorStore {
	const provider = getProviderConfig();

	if (store && currentSetProvider === provider) {
		return store;
	}

	// Provider has changed or store is not initialized

	const embeddings = makeEmbeddingsClient();
	store = new MemoryVectorStore(embeddings);
	currentSetProvider = provider;

	return store;
}

export async function addChunks(docs: Document[]): Promise<number> {
	if (!Array.isArray(docs) || docs.length === 0) return 0;

	const vectorStore = getVectorStoreInstance();
	await vectorStore.addDocuments(docs);
	return docs.length;
}

export function clearStore() {
	store = null;
	currentSetProvider = null;
}
