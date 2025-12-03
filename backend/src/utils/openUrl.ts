import { convert } from 'html-to-text';
import { OpenURLOutputSchema } from './schema';

export async function openUrl(url: string) {
	const normalized = validateUrl(url);

	const res = await fetch(normalized, {
		headers: {
			'User-Agent': 'agent-core/1.0 (+course-demo)',
		},
	});

	if (!res.ok) {
		const body = await safeText(res);
		throw new Error(`OpenURL failed ${res.status} - ${body.slice(0, 200)}`);
	}

	const contentType = res.headers.get('content-type') ?? '';
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
		return await res.json();
	} catch (error) {
		return '<no body>';
	}
}

function collapseWhiteSpace(s: string) {
	return s.replace(/\s+/g, ' ').trim();
}
