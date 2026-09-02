<script lang="ts">
    import LoadingContainer from '../components/loading.svelte';
    import Footer from '../components/footer.svelte';

    import { flip } from 'svelte/animate';
    import { fly, scale } from 'svelte/transition';
    
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

    function formatWaitTime(seconds: number): string {
        if (seconds <= 0) return "1 minute";
        
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
                    errorMessage = "Timeout, took too long.";
                } else {
                    errorMessage = "Please try again later";
                }
                isFlipped = false;
                isLoading = false;
                return;
            } finally {
                clearTimeout(timeoutId);
            }

            if (!res1 || !res1.ok) {
                if (res1 && res1.status === 404) {
                    errorMessage = "User not found";
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
                    errorMessage = "Please try again later";
                }
                isFlipped = false;
                isLoading = false;
                return;
            }

            let data1;
            try {
                data1 = await res1.json();
            } catch {
                errorMessage = "Please try again later";
                isLoading = false;
                isFlipped = false;
                return;
            }

            if (!data1 || !data1.data) {
                errorMessage = "User not found";
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
                } catch {
                }
            }
            
            repos = [];
            repos = [...repos, ...(data2.data || [])];
            user = data1.data;
            if(repos.length > 0) {
                repos.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
                isFlipped = true;
            } else isFlipped = false;
            
        } catch (error) {
            console.error('Error fetching:', error);
            errorMessage = "Please try again later";
            isFlipped = false;
        } finally {
            isLoading = false;
        }
    }
</script>

<div 
class="flex flex-col {repos.length > 0 ? 'h-full': 'h-screen'} md:h-screen overflow-hidden bg-gradient-to-br from-blue-500 via-30% via-gray-100 dark:via-black to-gray-100 dark:to-black">
  <div class="max-w-4xl mx-auto text-center flex-1 flex flex-col justify-center px-4 overflow-hidden w-full">
    <h1 class="pt-4 text-4xl text-slate-900 font-bold !leading-tight mb-4 md:text-5xl lg:text-6xl dark:text-slate-50">
        GitHub User Fetcher
    </h1>
    <p class="text-slate-600 text-sm md:text-base leading-relaxed dark:text-slate-400 mb-6 mx-auto max-w-2xl">
        Enter a GitHub username to fetch the user's details using the GitHub API. This app is part of Educational Project Submission. 
        You can view the source code on <a href="https://github.com/Nishant1500/AlexaDevSubmission" class="text-blue-500 hover:underline" target="_blank">GitHub</a>.
    </p>

    <div class="w-full flex transition-all duration-700 ease-in-out gap-6 {repos.length > 0 ? 'flex-col md:flex-row items-start' : 'flex-col items-center justify-center'}">

      <div class="transition-all duration-700 ease-in-out [perspective:1000px] {repos.length > 0 ? 'w-full md:w-1/3' : 'w-full max-w-md mx-auto'}">
        <div 
          class="relative w-full transition-transform duration-500 [transform-style:preserve-3d]"
          class:[transform:rotateY(180deg)]={isFlipped}
        >

          <div class="w-full bg-white/80 dark:bg-black/40 backdrop-blur-md p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 text-left [backface-visibility:hidden]">
            <form onsubmit={getUsername} role="search">
            {#if user.login}
                <p class="text-sm text-slate-500 dark:text-slate-400 mb-2">
                    Showing results for <span class="font-semibold text-slate-900 dark:text-white">@{user.login}</span>
                </p>
            <button 
              type="button" 
              onclick={() => isFlipped = !isFlipped}
              class="absolute top-4 right-4 text-gray-400 hover:text-gray-700 dark:hover:text-white p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
              aria-label="Flip back"
            >
            
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <line x1="19" y1="12" x2="5" y2="12"></line>
  <polyline points="12 19 5 12 12 5"></polyline>
</svg>
            </button>
            {/if}
              <label for="username" class="block text-sm/6 font-medium text-gray-900 dark:text-white">Username</label>
              <div class="flex items-center rounded-md mt-1">
                  <input 
                    id="username" 
                    type="text" 
                    name="username" 
                    placeholder="Enter username"
                    bind:value={username}
                    required
                    class="block w-full py-2 px-3 text-base text-gray-900 dark:bg-black/50 dark:text-white dark:placeholder:text-gray-400 border border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-md sm:text-sm" 
                  />
              </div>

              <button 
                type="submit" 
                class="mt-4 w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors cursor-pointer font-medium"
              >
                {isLoading ? 'Fetching...' : 'Fetch User'}
              </button>

              {#if errorMessage}
                <p class="mt-3 text-xs text-red-500 font-medium text-center">{errorMessage}</p>
              {/if}
            
            </form>
          </div>

          <div class="absolute inset-0 w-full h-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-2xl p-6 shadow-xl [backface-visibility:hidden] [transform:rotateY(180deg)] flex flex-col justify-between text-left">

            <button 
              type="button" 
              onclick={() => isFlipped = !isFlipped}
              class="absolute top-4 right-4 text-gray-400 hover:text-gray-700 dark:hover:text-white p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
              aria-label="Flip back"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>

            <div>
              {#if user.avatar_url}
                <img src={user.avatar_url} alt={user.login} class="w-16 h-16 rounded-full mb-3 border border-indigo-500 shadow-sm" />
              {/if}
              <h3 class="font-bold text-lg text-slate-900 dark:text-white pr-8">@{user.login || 'username'}</h3>
            </div>
            
            <div class="space-y-2 text-sm text-slate-700 dark:text-slate-300 my-auto">
                {#if user.bio}
                    <p class="text-xs text-slate-600 dark:text-slate-400 line-clamp-3">{user.bio}</p>
                {/if}

                {#if user.company}
                    <p class="text-xs flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                        🏢 {user.company}
                    </p>
                {/if}

                <p class="text-xs flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                    👥 {user.followers ?? 0} followers
                </p>

                <p class="text-xs pt-1"><span class="font-semibold text-gray-500 dark:text-gray-400">Email:</span> {user.email || 'N/A'}</p>
            </div>

            <div></div>
          </div>
        </div>
      </div>

      {#if repos.length > 0}
        <div 
          transition:fly={{ x: 30, duration: 600, opacity: 0 }}
          class="w-full md:w-2/3 flex flex-col gap-3 max-h-[350px] overflow-y-auto pr-1"
        >
          <h2 class="text-md font-bold text-slate-800 dark:text-slate-200 text-left">Repositories</h2>
          
          {#each repos as repo (repo.id)}
                <div 
                   animate:flip={{ duration: 400 }}
                   transition:scale={{ duration: 350, start: 0.95 }}
                   class="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl shadow-md flex flex-col gap-3 text-left"
                >
                   <div class="flex justify-between items-start gap-4">
                      <h3 class="font-semibold text-base truncate text-blue-600 dark:text-blue-400 hover:underline">
                         <a href={repo.html_url} target="_blank" rel="noopener noreferrer">{repo.name}</a>
                      </h3>
                   </div>
                
                   {#if repo.description}
                      <p class="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                         {repo.description}
                      </p>
                   {/if}

                   <div class="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                      {#if repo.language}
                         <span class="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
                            <span class="w-2 h-2 rounded-full bg-indigo-500 inline-block"></span>
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