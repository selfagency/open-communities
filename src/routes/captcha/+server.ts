/* region imports */
import { json } from '@sveltejs/kit';
import { createChallenge } from 'altcha-lib';

import { CHALLENGE_KEY } from '$env/static/private';
/* endregion imports */

export async function GET() {
	return json(
		await createChallenge({
			hmacKey: CHALLENGE_KEY,
			maxNumber: 100000
		})
	);
}
