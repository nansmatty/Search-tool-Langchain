'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { API_URL } from '@/lib/config';
import { Separator } from '@radix-ui/react-separator';
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

	const [question, setQuestion] = useState('');
	const [topK, setTopK] = useState(2);
	const [askLoading, setAskLoading] = useState(false);
	const [resTime, setResTime] = useState<number | null>(null);

	const [answerData, setAnswerData] = useState<Response | null>(null);
	const [showSources, _] = useState(true);

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

	async function handleAskSubmit(e: React.FormEvent) {
		e.preventDefault();
		setAskLoading(true);
		setAnswerData(null);
		setResTime(null);
		const startTime = performance.now();

		try {
			const response = await fetch(`${API_URL}/kb/ask`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					query: question,
					k: topK,
				}),
			});

			const data: Response | { error: string } = await response.json();
			if (!response.ok) {
				throw new Error('Ask failed');
			}
			const result = data as Response;
			setAnswerData(result);
		} catch (error) {
			console.error('Ask error:', error);
		} finally {
			const endTime = performance.now();
			setResTime(Math.round(endTime - startTime));
			setAskLoading(false);
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
								<Button type='button' className='cursor-pointer' variant='destructive'>
									Reset
								</Button>
								<Button type='submit' disabled={ingestLoading} className='cursor-pointer'>
									{ingestLoading ? 'Ingesting...' : 'Ingest to KB'}
								</Button>
							</div>
						</form>
						<div className='text-xs mt-5'>{ingestMessage ? <div className='text-green-500'>{ingestMessage}</div> : null}</div>
					</CardContent>
				</Card>
				<Card className='flex flex-col'>
					<CardHeader className='pb-3'>
						<CardTitle className='text-base font-semibold'>Ask your Question</CardTitle>
					</CardHeader>
					<CardContent>
						<form onSubmit={handleAskSubmit} className='flex flex-col gap-4'>
							<div className='flex flex-col gap-2'>
								<label className='text-xs  font-medium text-muted-foreground'>Your Query</label>
								<Input
									type='text'
									className='text-sm'
									value={question}
									onChange={(e) => setQuestion(e.target.value)}
									placeholder='Ask your question here...'
								/>
							</div>
							<div className='flex flex-col gap-2'>
								<label className='text-xs  font-medium text-muted-foreground'>Top K Answers</label>
								<Input type='number' min={1} max={5} className='text-sm' value={topK} onChange={(e) => setTopK(parseInt(e.target.value || '2', 5))} />
							</div>
							<div className='flex items-center gap-2'>
								<Button type='submit' disabled={askLoading} className='cursor-pointer'>
									{askLoading ? 'Asking...' : 'Ask KB'}
								</Button>
							</div>
						</form>
						{answerData && (
							<div className='flex flex-col gap-4 pt-5'>
								<div className='rounded-md border bg-muted/30 p-3 text-sm leading-relaxed whitespace-pre-wrap'>{answerData.answer}</div>
								<div className='text-xs text-green-600'>Time: {resTime}ms</div>
								{showSources && (
									<div className='flex flex-col gap-2'>
										<span>Sources ({answerData.sources.length})</span>
										<Separator />
										<ul className='space-y-3'>
											{answerData.sources.map((src, idx) => (
												<li key={idx} className='text-xs'>
													<div className='font-medium text-foreground'>
														{src.source}
														<span>#{src.chunkId}</span>
													</div>
												</li>
											))}
										</ul>
									</div>
								)}
							</div>
						)}
					</CardContent>
				</Card>
			</section>
		</div>
	);
};

export default LightRagKB;
