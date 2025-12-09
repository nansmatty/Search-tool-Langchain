import { z } from 'zod';

const EnvSchema = z.object({
	PORT: z.string().default('6001'),
	ALLOWED_ORIGIN: z.url().default('http://localhost:3000'),
	MODEL_PROVIDER: z.enum(['openai', 'gemini', 'groq']).default('groq'),
	OPENAI_MODEL: z.string().default('gpt-4o-mini'),
	GOOGLE_MODEL: z.enum(['gemini-2.5-flash-lite', 'gemini-2.0-flash-lite']).default('gemini-2.5-flash-lite'),
	GROQ_MODEL: z.string().default('llama-3.1-8b-instant'),
	SEARCH_PROVIDER: z.string().default('tavily'),
	OPENAI_API_KEY: z.string().optional(),
	GOOGLE_API_KEY: z.string().optional(),
	GROQ_API_KEY: z.string().optional(),
	TAVILY_API_KEY: z.string().optional(),
});

export const env = EnvSchema.parse(process.env);
