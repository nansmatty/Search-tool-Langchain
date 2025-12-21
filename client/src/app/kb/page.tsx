'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { API_URL } from '@/lib/config';
import { useState } from 'react';

type Source = {
	source: string;
	chunkId: string;
};

type Response = {
	answer: string;
	sources: Source[];
	confidence: number;
};

type IngestResponse = {
	message: string;
	docCount: number;
	chunkCount: number;
	source: string;
};

const LightRagKB = () => {
	const [ingestText, setIngestText] = useState('');
	const [ingestSource, setIngestSource] = useState('');
	const [ingestLoading, setIngestLoading] = useState(false);
	const [ingestMessage, setIngestMessage] = useState<string | null>(null);

	async function handleIngest(e: React.FormEvent) {
		e.preventDefault();
		setIngestLoading(true);
		setIngestMessage(null);
		try {
			const response = await fetch(`${API_URL}/kb/ingest`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					text: ingestText,
					source: ingestSource || undefined,
				}),
			});

			const data: IngestResponse | { error: string } = await response.json();

			if (!response.ok) {
				throw new Error('Ingestion failed');
			}

			const result = data as IngestResponse;
			setIngestMessage(`Ingestion successful! Chunks added: ${result.chunkCount} from source: ${result.source}`);
		} catch (error) {
			console.error('Ingestion error:', error);
			setIngestMessage('Ingestion failed. Please try again.');
		} finally {
			setIngestLoading(false);
		}
	}

	return (
		<div className='mx-auto max-w-5xl px-4 py-8 flex flex-col gap-8'>
			<header className='flex flex-col gap-1'>
				<h1 className='text-2xl font-bold tracking-tight'>Knowledge Base RAG</h1>
				<p className='text-sm text-muted-foreground'>A lightweight Retrieval-Augmented Generation (RAG) knowledge base system.</p>
			</header>
			<section className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
				<Card className='flex flex-col'>
					<CardHeader className='pb-3'>
						<CardTitle className='text-base font-semibold'>Add to Knowledge Base</CardTitle>
					</CardHeader>
					<CardContent>
						<form className='flex flex-col gap-4' onSubmit={handleIngest}>
							<div className='flex flex-col gap-2'>
								<label className='text-xs  font-medium text-muted-foreground'>Source Label</label>
								<Input
									type='text'
									className='text-sm'
									value={ingestSource}
									onChange={(e) => setIngestSource(e.target.value)}
									placeholder='Add your notes here...'
								/>
							</div>
							<div className='flex flex-col gap-2'>
								<label className='text-xs font-medium text-muted-foreground'>Text / Markdown</label>
								<Textarea
									className='min-h-[200px] text-xs leading-relaxed resize-y'
									value={ingestText}
									onChange={(e) => setIngestText(e.target.value)}
									placeholder='Paste docs, policy text or any onboarding notes...'
								/>
							</div>
							<div className='flex items-center gap-2'>
								<Button type='button' className='cursor-pointer' disabled={ingestLoading} variant='destructive'>
									Reset
								</Button>
								<Button type='submit' className='cursor-pointer'>
									Ingest To KB
								</Button>
							</div>
						</form>
						<div className='text-xs mt-5'>{ingestMessage ? <div className='text-green-500'>{ingestMessage}</div> : null}</div>
					</CardContent>
				</Card>
			</section>
		</div>
	);
};

export default LightRagKB;
