<script lang="ts">
	import LoadingContainer from '../components/loading.svelte';
	import Footer from '../components/footer.svelte';

	import { flip } from 'svelte/animate';
	import { fly, scale } from 'svelte/transition';
	import { RepoLanguage, LanguageColors } from '../languagesColors';

	type User = {
		login: string;
		email: string | null;
		avatar_url?: string;
		bio?: string | null;
		company?: string | null;
		followers?: number;
	};

	type Repo = {
		id: number;
		name: string;
		html_url: string;
		description: string | null;
		language: string | null;
		stargazers_count: number;
		updated_at: string;
	};

	let username = $state('');
	let user: User = $state({ login: '', email: null, bio: null, company: null, followers: 0 });
	let isLoading = $state(false);
	let errorMessage = $state('');
	let repos: Repo[] = $state([]);
	let isFlipped = $state(false);
	let language: RepoLanguage;

	function formatWaitTime(seconds: number): string {
		if (seconds <= 0) return '1 minute';

		const hours = Math.floor(seconds / 3600);
		const minutes = Math.floor((seconds % 3600) / 60);
		const secs = seconds % 60;

		let parts = [];
		if (hours > 0) parts.push(`${hours} hr${hours > 1 ? 's' : ''}`);
		if (minutes > 0) parts.push(`${minutes} min${minutes > 1 ? 's' : ''}`);
		if (hours === 0 && minutes === 0 && secs > 0) parts.push(`${secs} sec${secs > 1 ? 's' : ''}`);

		return parts.join(' ') || '1 minute';
	}

	async function getUsername(event: Event) {
		event.preventDefault();
		isLoading = true;
		errorMessage = '';

		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), 10000); // 10-second timeout

		try {
			let res1;
			try {
				res1 = await fetch('/api/users', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({ username }),
					signal: controller.signal
				});
			} catch (err: any) {
				if (err.name === 'AbortError') {
					errorMessage = 'Timeout, took too long.';
				} else {
					errorMessage = 'Please try again later';
				}
				isFlipped = false;
				isLoading = false;
				return;
			} finally {
				clearTimeout(timeoutId);
			}

			if (!res1 || !res1.ok) {
				if (res1 && res1.status === 404) {
					errorMessage = 'User not found';
				} else if (res1 && res1.status === 429) {
					// Check for standard Retry-After (seconds) or X-RateLimit-Reset (epoch time)
					const retryAfter = res1.headers.get('Retry-After');
					const rateLimitReset = res1.headers.get('X-RateLimit-Reset');

					let waitSeconds = 60; // default fallback

					if (retryAfter) {
						waitSeconds = parseInt(retryAfter, 10);
					} else if (rateLimitReset) {
						const resetEpoch = parseInt(rateLimitReset, 10);
						const nowEpoch = Math.floor(Date.now() / 1000);
						waitSeconds = Math.max(0, resetEpoch - nowEpoch);
					}

					errorMessage = `Rate limit reached. Please wait ${formatWaitTime(waitSeconds)} before trying again.`;
				} else {
					errorMessage = 'Please try again later';
				}
				isFlipped = false;
				isLoading = false;
				return;
			}

			let data1;
			try {
				data1 = await res1.json();
			} catch {
				errorMessage = 'Please try again later';
				isLoading = false;
				isFlipped = false;
				return;
			}

			if (!data1 || !data1.data) {
				errorMessage = 'User not found';
				isLoading = false;
				isFlipped = false;
				return;
			}

			let res2 = await fetch('/api/users/repos', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ username })
			});

			let data2 = { data: [] };
			if (res2.ok) {
				try {
					data2 = await res2.json();
				} catch {}
			}

			repos = [];
			repos = [...repos, ...(data2.data || [])];
			user = data1.data;
			if (repos.length > 0) {
				repos.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
				isFlipped = true;
			} else isFlipped = false;
		} catch (error) {
			console.error('Error fetching:', error);
			errorMessage = 'Please try again later';
			isFlipped = false;
		} finally {
			isLoading = false;
		}
	}
</script>

<div
	class="flex flex-col {repos.length > 0
		? 'h-full'
		: 'h-screen'} overflow-hidden bg-gradient-to-br from-blue-500 via-gray-100 via-30% to-gray-100 md:h-screen dark:via-black dark:to-black"
>
	<div
		class="mx-auto flex w-full max-w-4xl flex-1 flex-col justify-center overflow-hidden px-4 text-center"
	>
		<h1
			class="mb-4 pt-4 text-4xl !leading-tight font-bold text-slate-900 md:text-5xl lg:text-6xl dark:text-slate-50"
		>
			GitHub User Fetcher
		</h1>
		<p
			class="mx-auto mb-6 max-w-2xl text-sm leading-relaxed text-slate-600 md:text-base dark:text-slate-400"
		>
			Enter a GitHub username to fetch the user's details using the GitHub API. This app is part of
			Educational Project Submission. You can view the source code on <a
				href="https://github.com/Nishant1500/AlexaDevSubmission"
				class="text-blue-500 hover:underline"
				target="_blank">GitHub</a
			>.
		</p>

		<div
			class="flex w-full gap-6 transition-all duration-700 ease-in-out {repos.length > 0
				? 'flex-col items-start md:flex-row'
				: 'flex-col items-center justify-center'}"
		>
			<div
				class="transition-all duration-700 ease-in-out [perspective:1000px] {repos.length > 0
					? 'w-full md:w-1/3'
					: 'mx-auto w-full max-w-md'}"
			>
				<div
					class="relative w-full transition-transform duration-500 [transform-style:preserve-3d]"
					class:[transform:rotateY(180deg)]={isFlipped}
				>
					<div
						class="w-full rounded-2xl border border-gray-200 bg-white/80 p-6 text-left shadow-lg backdrop-blur-md [backface-visibility:hidden] dark:border-gray-800 dark:bg-black/40"
					>
						<form onsubmit={getUsername} role="search">
							{#if user.login}
								<p class="mb-2 text-sm text-slate-500 dark:text-slate-400">
									Showing results for <span class="font-semibold text-slate-900 dark:text-white"
										>@{user.login}</span
									>
								</p>
								<button
									type="button"
									onclick={() => (isFlipped = !isFlipped)}
									class="absolute top-4 right-4 cursor-pointer rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-white"
									aria-label="Flip back"
								>
									<svg
										xmlns="http://www.w3.org/2000/svg"
										width="24"
										height="24"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										stroke-width="2"
										stroke-linecap="round"
										stroke-linejoin="round"
									>
										<line x1="19" y1="12" x2="5" y2="12"></line>
										<polyline points="12 19 5 12 12 5"></polyline>
									</svg>
								</button>
							{/if}
							<label
								for="username"
								class="block text-sm/6 font-medium text-gray-900 dark:text-white">Username</label
							>
							<div class="mt-1 flex items-center rounded-md">
								<input
									id="username"
									type="text"
									name="username"
									placeholder="Enter username"
									bind:value={username}
									required
									class="block w-full rounded-md border border-gray-300 px-3 py-2 text-base text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none sm:text-sm dark:border-gray-700 dark:bg-black/50 dark:text-white dark:placeholder:text-gray-400"
								/>
							</div>

							<button
								type="submit"
								class="mt-4 w-full cursor-pointer rounded-md bg-indigo-600 px-4 py-2 font-medium text-white transition-colors hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none"
							>
								{isLoading ? 'Fetching...' : 'Fetch User'}
							</button>

							{#if errorMessage}
								<p class="mt-3 text-center text-xs font-medium text-red-500">{errorMessage}</p>
							{/if}
						</form>
					</div>

					<div
						class="absolute inset-0 flex h-full w-full [transform:rotateY(180deg)] flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 text-left text-slate-900 shadow-xl [backface-visibility:hidden] dark:border-slate-800 dark:bg-slate-900 dark:text-white"
					>
						<button
							type="button"
							onclick={() => (isFlipped = !isFlipped)}
							class="absolute top-4 right-4 cursor-pointer rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-white"
							aria-label="Flip back"
						>
							<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M6 18L18 6M6 6l12 12"
								></path>
							</svg>
						</button>

						<div>
							{#if user.avatar_url}
								<img
									src={user.avatar_url}
									alt={user.login}
									class="mb-3 h-16 w-16 rounded-full border border-indigo-500 shadow-sm"
								/>
							{/if}
							<h3 class="pr-8 text-lg font-bold text-slate-900 dark:text-white">
								@{user.login || 'username'}
							</h3>
						</div>

						<div class="my-auto space-y-2 text-sm text-slate-700 dark:text-slate-300">
							{#if user.bio}
								<p class="line-clamp-3 text-xs text-slate-600 dark:text-slate-400">{user.bio}</p>
							{/if}

							{#if user.company}
								<p class="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
									🏢 {user.company}
								</p>
							{/if}

							<p class="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
								👥 {user.followers ?? 0} followers
							</p>

							<p class="pt-1 text-xs">
								<span class="font-semibold text-gray-500 dark:text-gray-400">Email:</span>
								{user.email || 'N/A'}
							</p>
						</div>

						<div></div>
					</div>
				</div>
			</div>

			{#if repos.length > 0}
				<div
					transition:fly={{ x: 30, duration: 600, opacity: 0 }}
					class="flex max-h-[350px] w-full flex-col gap-3 overflow-y-auto pr-1 md:w-2/3"
				>
					<h2 class="text-md text-left font-bold text-slate-800 dark:text-slate-200">
						Repositories
					</h2>

					{#each repos as repo (repo.id)}
						<div
							animate:flip={{ duration: 400 }}
							transition:scale={{ duration: 350, start: 0.95 }}
							class="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-5 text-left text-slate-900 shadow-md dark:border-slate-800 dark:bg-slate-900 dark:text-white"
						>
							<div class="flex items-start justify-between gap-4">
								<h3
									class="truncate text-base font-semibold text-blue-600 hover:underline dark:text-blue-400"
								>
									<a href={repo.html_url} target="_blank" rel="noopener noreferrer">{repo.name}</a>
								</h3>
							</div>

							{#if repo.description}
								<p class="line-clamp-2 text-xs text-slate-600 dark:text-slate-400">
									{repo.description}
								</p>
							{/if}

							<div
								class="flex flex-wrap items-center gap-4 border-t border-slate-100 pt-2 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400"
							>
								{#if repo.language}
									<span
										class="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300"
									>
										<span
											class="inline-block h-2 w-2 rounded-full"
											style="background-color: {LanguageColors[repo.language as RepoLanguage] ||
												'#cbd5e1'};"
										></span>
										{repo.language}
									</span>
								{/if}

								<span class="flex items-center gap-1">
									⭐ {repo.stargazers_count ?? 0}
								</span>

								<span class="ml-auto text-[11px]">
									Updated {new Date(repo.updated_at).toLocaleDateString()}
								</span>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	</div>

	<Footer />
</div>

<LoadingContainer {isLoading} />
