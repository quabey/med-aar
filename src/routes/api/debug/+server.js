import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

export async function GET({ platform }) {
	return json({
		hasToken: !!env.MEDRUNNER_TOKEN,
		hasPassword: !!env.ADMIN_PASSWORD,
		tokenLength: env.MEDRUNNER_TOKEN?.length ?? 0,
		platformEnvKeys: platform?.env ? Object.keys(platform.env) : null
	});
}
