import { convert } from 'html-to-text';
import { OpenURLOutputSchema } from './schema';

export async function openUrl(url: string) {
	const normalized = validateUrl(url);

	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), 10_000);

	const res = await fetch(normalized, {
		signal: controller.signal,
		headers: {
			'User-Agent': 'agent-core/1.0 (+course-demo)',
		},
	});

	clearTimeout(timeout);

	if (!res.ok) {
		const body = await safeText(res);
		throw new Error(`OpenURL failed ${res.status} - ${body.slice(0, 200)}`);
	}

	const contentType = res.headers.get('content-type') ?? '';

	if (!contentType.includes('text')) {
		throw new Error(`Unsupported content-type: ${contentType}`);
	}

	const raw = await res.text();

	const text = contentType.includes('text/html')
		? convert(raw, {
				wordwrap: false,
				selectors: [
					{ selector: 'nav', format: 'skip' },
					{ selector: 'header', format: 'skip' },
					{ selector: 'footer', format: 'skip' },
					{ selector: 'script', format: 'skip' },
					{ selector: 'style', format: 'skip' },
				],
		  })
		: raw;

	const cleaned = collapseWhiteSpace(text);
	const capped = cleaned.slice(0, 8000);

	return OpenURLOutputSchema.parse({
		url: normalized,
		content: capped,
	});
}

function validateUrl(url: string) {
	try {
		const parsed = new URL(url);

		if (!/^https?:$/.test(parsed.protocol)) {
			throw new Error('only http/https are supported.');
		}

		return parsed.toString();
	} catch (error) {
		throw new Error('Invalid url!');
	}
}

async function safeText(res: Response) {
	try {
		return await res.text();
	} catch (error) {
		return '<no body>';
	}
}

function collapseWhiteSpace(s: string) {
	return s.replace(/\s+/g, ' ').trim();
}
