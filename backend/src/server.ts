import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { searchRouter } from './routes/search_lcel';
import { env } from './shared/env';
import morgan from 'morgan';

const app = express();
const PORT = env.PORT || 6001;

app.use(
	cors({
		origin: env.ALLOWED_ORIGIN,
	})
);
app.use(express.json());

app.use(morgan('dev'));

app.use('/search', searchRouter);

app.listen(PORT, () => console.log(`Server is running on http://localhost:${PORT}`));
