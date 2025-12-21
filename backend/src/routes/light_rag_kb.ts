import { Router } from 'express';
import { z } from 'zod';
import { ingestText } from '../light_rag_kb/ingest';
import { clearStore } from '../light_rag_kb/store';
import { askQuestion } from '../light_rag_kb/ask';

export const lightRagKbRouter = Router();

const IngestBodySchema = z.object({
	text: z.string().min(1, 'Source cannot be empty'),
	source: z.string().min(1, 'Content cannot be empty'),
});

type IngestBodyT = z.infer<typeof IngestBodySchema>;

lightRagKbRouter.post('/ingest', async (req, res) => {
	try {
		const body: IngestBodyT = IngestBodySchema.parse(req.body);

		const result = await ingestText({ text: body.text, source: body.source });

		return res.status(200).json({ message: 'Ingestion successful', ...result });
	} catch (error) {
		res.status(400).json({ error: error instanceof Error ? error.message : 'Some error occured while ingestion' });
	}
});

lightRagKbRouter.post('/reset', async (req, res) => {
	try {
		clearStore();
		return res.status(200).json({ message: 'Reset successful' });
	} catch (error) {
		res.status(400).json({ error: error instanceof Error ? error.message : 'Some error occured while resetting' });
	}
});

const AskBodySchema = z.object({
	query: z.string().min(1, 'Query cannot be empty'),
	k: z.number().int().min(1).max(10).optional(),
});
type AskBodyT = z.infer<typeof AskBodySchema>;

lightRagKbRouter.post('/ask', async (req, res) => {
	try {
		const body: AskBodyT = AskBodySchema.parse(req.body);
		const { query, k } = body;
		const result = await askQuestion(query, k ?? 2);
		return res.status(200).json({ answer: result.answer, sources: result.sources, confidence: result.confidence });
	} catch (error) {
		res.status(400).json({ error: error instanceof Error ? error.message : 'Some error occured while querying' });
	}
});
