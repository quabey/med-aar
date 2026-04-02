export async function load({ locals }) {
	return {
		session: locals.session,
		user: locals.user,
		profile: locals.profile
	};
}
