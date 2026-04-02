export async function load({ locals }) {
	const { session, user } = await locals.safeGetSession();
	return {
		session,
		user,
		profile: locals.profile
	};
}
