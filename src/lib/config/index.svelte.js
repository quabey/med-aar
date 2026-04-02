import defaultAlertTypes from './alertTypes.json';
import defaultShips from './ships.json';
import defaultTemplates from './templates.json';
import defaultLocations from '$lib/AAR/locations.json';
import { supabase } from '$lib/supabaseClient.js';

class ConfigStore {
	alertTypes = $state(defaultAlertTypes);
	ships = $state(defaultShips);
	templates = $state(defaultTemplates);
	locations = $state(defaultLocations);
	loaded = $state(false);

	#initialized = false;

	constructor() {
		// Don't auto-fetch; wait for initialize() after auth
	}

	async initialize() {
		if (this.#initialized || typeof window === 'undefined') return;
		this.#initialized = true;
		await this.#fetchConfig();
	}

	async #fetchConfig() {
		try {
			// Alert types from site_config
			const { data: atData } = await supabase
				.from('site_config')
				.select('value')
				.eq('key', 'alertTypes')
				.single();
			if (atData?.value) this.alertTypes = atData.value;

			// Ships from ships table
			const { data: shipsData } = await supabase
				.from('ships')
				.select('name, value, category')
				.order('sort_order');
			if (shipsData?.length) {
				const grouped = {};
				for (const s of shipsData) {
					if (!grouped[s.category]) grouped[s.category] = [];
					grouped[s.category].push({ name: s.name, value: s.value });
				}
				this.ships = grouped;
			}

			// Templates from templates table
			const { data: tmplData } = await supabase
				.from('templates')
				.select('*')
				.order('sort_order');
			if (tmplData?.length) {
				const obj = {};
				for (const t of tmplData) {
					obj[t.key || t.id] = {
						name: t.name,
						description: t.description || '',
						icon: t.icon || '📋',
						recommended: t.recommended || false,
						sections: t.sections || []
					};
				}
				this.templates = obj;
			}

			// Locations from locations table
			const { data: locData } = await supabase
				.from('locations')
				.select('id, name, type, planetary_body')
				.order('name');
			if (locData?.length) {
				this.locations = locData.map((l) => ({
					id: l.id,
					name: l.name,
					type: l.type || '',
					planetaryBody: l.planetary_body || ''
				}));
			}
		} catch {
			/* use defaults on fetch failure */
		}
		this.loaded = true;
	}

	updateAlertTypes(data) {
		this.alertTypes = data;
	}

	resetAlertTypesToDefaults() {
		this.alertTypes = defaultAlertTypes;
	}

	/** Save alert types to site_config. */
	async saveAlertTypes() {
		const { error } = await supabase
			.from('site_config')
			.upsert(
				{ key: 'alertTypes', value: $state.snapshot(this.alertTypes), updated_at: new Date().toISOString() },
				{ onConflict: 'key' }
			);
		if (error) {
			console.error('Failed to save alert types:', error);
			return false;
		}
		return true;
	}

	/** Backward-compatible save — now only saves alert types. */
	async save() {
		return this.saveAlertTypes();
	}

	/** Re-fetch all config from the database. */
	async reload() {
		this.loaded = false;
		await this.#fetchConfig();
	}

	exportAll() {
		return JSON.stringify(
			{
				alertTypes: $state.snapshot(this.alertTypes),
				ships: $state.snapshot(this.ships),
				templates: $state.snapshot(this.templates),
				locations: $state.snapshot(this.locations)
			},
			null,
			2
		);
	}

	importAll(json) {
		const data = JSON.parse(json);
		if (data.alertTypes) this.updateAlertTypes(data.alertTypes);
	}
}

export const config = new ConfigStore();
