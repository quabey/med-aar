import { HubConnectionBuilder, HttpTransportType } from '@microsoft/signalr';

const ALERTS_LOCAL_KEY = 'medtools:recentAlerts';
const MAX_LOCAL_ALERTS = 100;

function loadLocal() {
	if (typeof window === 'undefined') return [];
	try {
		const raw = localStorage.getItem(ALERTS_LOCAL_KEY);
		return raw ? JSON.parse(raw) : [];
	} catch {
		return [];
	}
}

function saveLocal(alerts) {
	if (typeof window === 'undefined') return;
	try {
		localStorage.setItem(ALERTS_LOCAL_KEY, JSON.stringify(alerts));
	} catch {
		/* ignore */
	}
}

class AlertStore {
	alerts = $state(loadLocal());
	connected = $state(false);
	connectionError = $state('');
	#connection = null;
	#initialized = false;

	async initialize() {
		if (this.#initialized || typeof window === 'undefined') return;
		this.#initialized = true;

		// Load persisted alerts from server
		try {
			const res = await fetch('/api/medrunner/alerts');
			if (res.ok) {
				const { alerts: serverAlerts } = await res.json();
				if (serverAlerts?.length) {
					this.#mergeAlerts(serverAlerts);
				}
			}
		} catch {
			/* server unavailable, use local only */
		}

		// Connect to WebSocket
		await this.#connect();
	}

	async #connect() {
		try {
			this.#connection = new HubConnectionBuilder()
				.withAutomaticReconnect({
					nextRetryDelayInMilliseconds: (ctx) => {
						if (ctx.previousRetryCount >= 10) return null;
						return Math.min(500 * Math.pow(2, ctx.previousRetryCount), 10000);
					}
				})
				.withUrl('/api/medrunner/hub', {
					transport: HttpTransportType.LongPolling
				})
				.build();

			this.#connection.on('EmergencyCreate', (emergency) => {
				this.#handleEmergency(emergency);
			});

			this.#connection.on('EmergencyUpdate', (emergency) => {
				this.#handleEmergencyUpdate(emergency);
			});

			this.#connection.onreconnected(() => {
				this.connected = true;
				this.connectionError = '';
			});

			this.#connection.onclose((err) => {
				this.connected = false;
				if (err) this.connectionError = err.message || 'Connection closed';
			});

			await this.#connection.start();
			this.connected = true;
			this.connectionError = '';
		} catch (err) {
			console.error('WebSocket connection failed:', err);
			this.connected = false;
			this.connectionError = err.message || 'Connection failed';
		}
	}

	#handleEmergency(emergency) {
		if (!emergency?.id) return;

		const alert = {
			id: emergency.id,
			clientRsiHandle: emergency.clientRsiHandle || '',
			missionName: emergency.missionName || '',
			system: emergency.system || '',
			subsystem: emergency.subsystem || '',
			tertiaryLocation: emergency.tertiaryLocation || '',
			threatLevel: emergency.threatLevel ?? 0,
			status: emergency.status ?? 0,
			creationTimestamp: emergency.creationTimestamp || Date.now(),
			test: emergency.test || false,
			storedAt: Date.now()
		};

		// Add to local store
		if (!this.alerts.some((a) => a.id === alert.id)) {
			this.alerts.unshift(alert);
			if (this.alerts.length > MAX_LOCAL_ALERTS) this.alerts.length = MAX_LOCAL_ALERTS;
			saveLocal(this.alerts);
		}

		// Persist to server
		fetch('/api/medrunner/alerts', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(alert)
		}).catch(() => {});
	}

	#handleEmergencyUpdate(emergency) {
		if (!emergency?.id) return;

		const idx = this.alerts.findIndex((a) => a.id === emergency.id);
		if (idx !== -1) {
			this.alerts[idx] = {
				...this.alerts[idx],
				status: emergency.status ?? this.alerts[idx].status,
				missionName: emergency.missionName || this.alerts[idx].missionName
			};
			saveLocal(this.alerts);
		} else {
			// New to us, treat as create
			this.#handleEmergency(emergency);
		}
	}

	#mergeAlerts(serverAlerts) {
		const existingIds = new Set(this.alerts.map((a) => a.id));
		for (const a of serverAlerts) {
			if (!existingIds.has(a.id)) {
				this.alerts.push(a);
				existingIds.add(a.id);
			}
		}
		// Sort by creation time descending
		this.alerts.sort((a, b) => (b.creationTimestamp || 0) - (a.creationTimestamp || 0));
		if (this.alerts.length > MAX_LOCAL_ALERTS) this.alerts.length = MAX_LOCAL_ALERTS;
		saveLocal(this.alerts);
	}

	/** Recent non-test alerts, sorted newest first */
	get recentAlerts() {
		return this.alerts.filter((a) => !a.test);
	}

	getAlertLabel(alert) {
		const handle = alert.clientRsiHandle || 'Unknown';
		const loc = [alert.system, alert.subsystem].filter(Boolean).join(' / ');
		return loc ? `${handle} — ${loc}` : handle;
	}
}

export const alertStore = new AlertStore();
