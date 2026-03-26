import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

export async function GET({ platform }) {
	const token = platform?.env?.MEDRUNNER_TOKEN ?? env.MEDRUNNER_TOKEN;
	const password = platform?.env?.ADMIN_PASSWORD ?? env.ADMIN_PASSWORD;
	return json({
		hasToken: !!token,
		hasPassword: !!password,
		tokenLength: token?.length ?? 0,
		platformEnvKeys: platform?.env ? Object.keys(platform.env) : null,
		source: platform?.env?.MEDRUNNER_TOKEN ? 'platform.env' : (env.MEDRUNNER_TOKEN ? '$env/dynamic/private' : 'none')
	});
}
