import { Router } from 'express';
import { SearchInputSchema } from '../utils/schema';
import { runSearch } from '../search_tool/searchChain';

export const searchRouter = Router();

searchRouter.post('/', async (req, res) => {
	try {
		const input = SearchInputSchema.parse(req.body);

		const result = await runSearch(input);

		res.status(200).json(result);
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error occurred.';
		res.status(500).json({ error: message });
	}
});
