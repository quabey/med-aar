declare global {
	namespace App {
		interface Platform {
			env: {
				CONFIG_KV: KVNamespace;
				ADMIN_PASSWORD: string;
				MEDRUNNER_TOKEN: string;
			};
		}
	}
}

export {};
