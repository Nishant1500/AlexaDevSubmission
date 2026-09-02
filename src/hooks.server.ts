import type { Handle } from '@sveltejs/kit';
import { RetryAfterRateLimiter } from 'sveltekit-rate-limiter/server';
import { RATE_LIMITER_SECRET } from '$env/dynamic/private';

const limiter = new RetryAfterRateLimiter({
  IP: [[2, 's'],[5, 'm'],[20, 'h']],
  IPUA: [[2, 's'],[5, 'm'],[20, 'h']],
//   cookie: {
//     name: 'rate-limit',
//     secret: RATE_LIMITER_SECRET,
//     rate: [2, 's'],
//     preflight: true
//   }

// Im struggling on handling cookies rate limiter ;-;
// I really want to use it but I can't figure out how to set the cookie in the response and then read it in the next request. I will try to figure it out later, but for now I will just use IP and IPUA rate limiting.
// It seems to never clear the cookies on load.
});

export const handle: Handle = async ({ event, resolve }) => {

    if(event.url.pathname.startsWith('/api')) {
        const status = await limiter.check(event);
        if (status.limited) {
          let response = new Response(
            `You are being rate limited. Please try after ${status.retryAfter} seconds.`,
            {
              status: 429,
              headers: { 'Retry-After': status.retryAfter.toString() }
            }
          );
          return response;
        }
    }
    const response = await resolve(event);
    return response;
};