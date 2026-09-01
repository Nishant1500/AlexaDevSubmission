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
                'Authorization': `Bearer ${TOKEN}`,
                'Accept': 'application/json'
            }
        });

        if (!res.ok) {
            return json({ error: `API request failed (${res.status})` }, { status: res.status });
        }

        const data = await res.json();

        console.log('Data fetched successfully:', data);
        return json({ data });
    } catch (err) {
        console.error('Server error:', err);
        return json({ error: 'Internal server error' }, { status: 500 });
    }
}
