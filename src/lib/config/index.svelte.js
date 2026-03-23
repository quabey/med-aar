import defaultAlertTypes from './alertTypes.json';
import defaultShips from './ships.json';
import defaultTemplates from './templates.json';
import defaultLocations from '$lib/AAR/locations.json';

class ConfigStore {
	alertTypes = $state(defaultAlertTypes);
	ships = $state(defaultShips);
	templates = $state(defaultTemplates);
	locations = $state(defaultLocations);
	loaded = $state(false);

	constructor() {
		if (typeof window !== 'undefined') {
			this.#fetchConfig();
		}
	}

	async #fetchConfig() {
		try {
			const res = await fetch('/api/config');
			if (res.ok) {
				const data = await res.json();
				if (data.alertTypes) this.alertTypes = data.alertTypes;
				if (data.ships) this.ships = data.ships;
				if (data.templates) this.templates = data.templates;
				if (data.locations) this.locations = data.locations;
			}
		} catch {
			/* use defaults on fetch failure */
		}
		this.loaded = true;
	}

	updateAlertTypes(data) {
		this.alertTypes = data;
	}

	updateShips(data) {
		this.ships = data;
	}

	updateTemplates(data) {
		this.templates = data;
	}

	updateLocations(data) {
		this.locations = data;
	}

	resetToDefaults(key) {
		switch (key) {
			case 'alertTypes':
				this.alertTypes = defaultAlertTypes;
				break;
			case 'ships':
				this.ships = defaultShips;
				break;
			case 'templates':
				this.templates = defaultTemplates;
				break;
			case 'locations':
				this.locations = defaultLocations;
				break;
		}
	}

	/** Save all config to the server. Requires admin password. */
	async save(password) {
		const res = await fetch('/api/config', {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json',
				'X-Admin-Password': password
			},
			body: JSON.stringify({
				alertTypes: $state.snapshot(this.alertTypes),
				ships: $state.snapshot(this.ships),
				templates: $state.snapshot(this.templates),
				locations: $state.snapshot(this.locations)
			})
		});
		return res.ok;
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
		if (data.ships) this.updateShips(data.ships);
		if (data.templates) this.updateTemplates(data.templates);
		if (data.locations) this.updateLocations(data.locations);
	}
}

export const config = new ConfigStore();
