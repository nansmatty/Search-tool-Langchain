'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { API_URL } from '@/lib/config';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

type SearchResponse = {
	answer: string;
	sources: string[];
};

type CurrentChatTurn =
	| {
			role: 'user';
			content: string;
	  }
	| {
			role: 'assistant';
			content: string;
			sources: string[];
			time: number;
			error?: string;
	  };

export default function Home() {
	const [query, setQuery] = useState('');
	const [loading, setLoading] = useState(false);
	const [chat, setChat] = useState<CurrentChatTurn[]>([]);

	const scrollRef = useRef<HTMLDivElement | null>(null);

	const runSearch = async (prompt: string) => {
		setLoading(true);
		setChat((prev) => [...prev, { role: 'user', content: prompt }]);
		const oldTime = performance.now();
		try {
			const res = await fetch(`${API_URL}/search`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ q: prompt }),
			});

			const json = await res.json();
			const timeDiff = Math.round(performance.now() - oldTime);

			if (!res.ok) {
				const errMsg = 'Request failed';
				setChat((prev) => [
					...prev,
					{
						role: 'assistant',
						content: 'I tried to answer, but something went wrong. Please try again.',
						sources: [],
						time: timeDiff,
						error: errMsg,
					},
				]);
			} else {
				const data = json as SearchResponse;
				setChat((prev) => [
					...prev,
					{
						role: 'assistant',
						content: data.answer,
						sources: data.sources,
						time: timeDiff,
					},
				]);
			}
		} catch (e) {
			const timeDiff = Math.round(performance.now() - oldTime);
			const errMsg = 'Request failed';
			setChat((prev) => [
				...prev,
				{
					role: 'assistant',
					content: 'I tried to answer, but something went wrong. Please try again.',
					sources: [],
					time: timeDiff,
					error: errMsg,
				},
			]);
		} finally {
			setLoading(false);
		}
	};

	const handleChatSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		const prompt = query.trim();
		if (!prompt || loading) return;
		setQuery('');
		await runSearch(prompt);
	};

	useEffect(() => {
		scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
	}, [chat]);

	return (
		<div className='flex h-dvh flex-col bg-[#f9fafb] text-gray-900'>
			<header className='border-b bg-white py-3 px-4 text-sm flex items-center justify-between'>
				<div className='flex flex-col'>
					<span className='font-medium text-gray-800'>Search V1 (LCEL Web Agent)</span>
					<span className='text-[12px] text-gray-500'>Answer with sources. Some queries will browse the web and some don't.</span>
				</div>
			</header>
			<main className='flex-1 overflow-y-auto px-4 py-6 space-y-6'>
				{chat.length === 0 && (
					<div className='mx-auto max-w-2xl text-center text-sm text-gray-500'>
						<div className='text-base font-semibold text-gray-800 mb-1'>Ask anything</div>
						<div className='text-[14px] leading-relaxed'>
							Examples:
							<br />
							<code className='rounded bg-gray-100 px-1 py-2 text-[12px]'>Top 10 engineering colleges in India 2025</code>
							<br />
							<code className='rounded bg-gray-100 px-1 py-2 text-[12px]'>What is Kubernetes?</code>
						</div>
					</div>
				)}
				{chat.map((turn, index) => {
					if (turn.role === 'user') {
						return (
							<div key={index} className='mx-auto flex max-w-2xl justify-end text-right'>
								<div className='inline-block rounded-2xl bg-gray-900 px-4 py-3 text-sm text-white shadow-md max-w-full'>
									<div className='whitespace-pre-wrap wrap-break-word'>{turn.content}</div>
								</div>
							</div>
						);
					}
					return (
						<div key={index} className='mx-auto max-w-2xl flex items-start gap-3 text-left'>
							<div className='flex h-8 w-8 flex-none items-center justify-center rounded-md bg-gray-800 text-[11px] text-white font-semibold'>AI</div>
							<div className='flex-1 space-y-3'>
								<div className='inline-block rounded-2xl bg-white px-4 py-3 text-gray-900 shadow-sm ring-gray-200 whitespace-pre-wrap wrap-break-word'>
									{turn.content}
								</div>
								<div className='text-[11px] text-gray-500 flex flex-wrap items-center gap-x-2'>
									{typeof turn.time === 'number' && <span>answered in {turn.time} time</span>}
									{turn.error && <span className='text-red-500'>Error: {turn.error}</span>}
								</div>
								{turn.sources.length > 0 && (
									<div className='rounded-lg bg-white px-3 py-2 text-[12px] shadow-sm ring-1 ring-gray-200'>
										<div className='text-[11px] font-medium text-gray-600 mb-1'>Sources</div>
										<ul className='space-y-1'>
											{turn.sources.map((source, srcIndex) => (
												<li key={srcIndex} className='truncate'>
													<Link
														href={source}
														target='_blank'
														rel='noreferrer'
														className='text-blue-500 underline underline-offset-4 break-all'></Link>
												</li>
											))}
										</ul>
									</div>
								)}
							</div>
						</div>
					);
				})}

				{loading && (
					<div className='mx-auto max-w-2xl flex items-start gap-3 text-left'>
						<div className='flex h-8 w-8 flex-none items-center justify-center rounded-md bg-gray-700 text-[11px] font-semibold text-white'>...</div>
						<p className='inline-block rounded-2xl bg-white px-4 py-3 text-sm text-gray-900 shadow-sm ring-1 ring-gray-200'></p>
					</div>
				)}
				<footer className='border-t bg-white px-4 py-4'>
					<form onSubmit={handleChatSubmit} className='mx-auto flex w-full max-w-2xl items-end gap-2'>
						<div>
							<Input
								className='w-full resize-none'
								placeholder='Ask your query...'
								value={query}
								onChange={(e) => setQuery(e.target.value)}
								disabled={loading}
							/>
						</div>
						<Button type='submit' className='shrink-0' disabled={loading || query.trim().length < 5}>
							{loading ? '...' : 'Send'}
						</Button>
					</form>
				</footer>
			</main>
		</div>
	);
}
