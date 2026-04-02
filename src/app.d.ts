import type { SupabaseClient, Session } from '@supabase/supabase-js';

declare global {
	namespace App {
		interface Locals {
			supabase: SupabaseClient;
			safeGetSession: () => Promise<{
				session: Session | null;
				user: import('@supabase/supabase-js').User | null;
			}>;
			session: Session | null;
			user: import('@supabase/supabase-js').User | null;
			profile: {
				id: string;
				discord_id: string;
				discord_username: string;
				discord_avatar: string | null;
				is_approved: boolean;
				is_admin: boolean;
				approval_status: string;
			} | null;
		}
		interface Platform {
			env: {
				MEDRUNNER_TOKEN: string;
			};
		}
	}
}

export {};
