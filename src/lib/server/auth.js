/**
 * Constant-time password verification using SHA-256 comparison.
 * @param {string} input - The password to check
 * @param {string} expected - The correct password from env
 * @returns {Promise<boolean>}
 */
export async function verifyPassword(input, expected) {
	const enc = new TextEncoder();
	const [hashA, hashB] = await Promise.all([
		crypto.subtle.digest('SHA-256', enc.encode(input)),
		crypto.subtle.digest('SHA-256', enc.encode(expected))
	]);
	const a = new Uint8Array(hashA);
	const b = new Uint8Array(hashB);
	let result = 0;
	for (let i = 0; i < a.length; i++) result |= a[i] ^ b[i];
	return result === 0;
}
