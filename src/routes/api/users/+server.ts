import { json } from '@sveltejs/kit';
import { GITHUB_TOKEN } from '$env/static/private';

export async function POST({ request }) {
	try {
		const { username } = await request.json();

		if (!username || typeof username !== 'string') {
			return json({ error: 'Username is required' }, { status: 400 });
		}

		const API_URL = `https://api.github.com/users/${encodeURIComponent(username)}`;
		const TOKEN = GITHUB_TOKEN;

		console.log(`Fetching data for username: ${username} from ${API_URL}`);

		const res = await fetch(API_URL, {
			headers: {
				Authorization: `Bearer ${TOKEN}`,
				Accept: 'application/json'
			}
		});

		const retryAfter = res.headers.get('Retry-After');
		const rateLimitReset = res.headers.get('X-RateLimit-Reset');
		const rateLimitRemaining = res.headers.get('X-RateLimit-Remaining');

		const responseHeaders = new Headers();
		if (retryAfter) responseHeaders.set('Retry-After', retryAfter);
		if (rateLimitReset) responseHeaders.set('X-RateLimit-Reset', rateLimitReset);
		if (rateLimitRemaining) responseHeaders.set('X-RateLimit-Remaining', rateLimitRemaining);

		if (!res.ok) {
			let errorData = {};
			try {
				errorData = await res.json();
			} catch {}

			if (res.status === 404 || (errorData as any).message === 'Not Found') {
				return json({ error: 'User not found' }, { status: 404, headers: responseHeaders });
			}

			return json(
				{ error: (errorData as any).message || 'GitHub API error' },
				{ status: res.status, headers: responseHeaders }
			);
		}

		const data = await res.json();

		console.log('Data fetched successfully:', data);
		return json({ data }, { headers: responseHeaders });
	} catch (err) {
		console.error('Server error:', err);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
}
