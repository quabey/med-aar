const TABS_KEY = 'medtools:tabs';
const HISTORY_KEY = 'medtools:history';
const ACTIVE_KEY = 'medtools:activeTab';

function generateId() {
	return Math.random().toString(36).substring(2, 11);
}

export function createDefaultData() {
	return {
		sections: [],
		times: {
			received: null,
			start: null,
			departed: null,
			reached: null,
			completed: null,
			offsetMode: typeof window !== 'undefined' && localStorage.getItem('medtools:timingOffsetMode') === 'true',
			offsetAlert: 0,
			offsetDepart: null,
			offsetClient: null,
			offsetRTB: null
		},
		ships: { gunship: '', medship: '', cap: [], reason: '' },
		otherShips: { gunship: '', medship: '' },
		alertType: '',
		alertTypeOther: '',
		injuries: {
			head: 'None',
			chest: 'None',
			leftArm: 'None',
			rightArm: 'None',
			leftLeg: 'None',
			rightLeg: 'None'
		},
		injuriesTreatment: 'None',
		extraction: '',
		location: '',
		locationDistance: '',
		planetaryBody: '',
		locationType: '',
		isManualLocation: false,
		texts: [
			{ title: '', content: '' },
			{ title: '', content: '' },
			{ title: '', content: '' }
		],
		alertBreakdown: '',
		incidentReport: '',
		vod: { url: '', timestamps: false, commsAllowed: false },
		encounters: { pve: '', pvp: '', actionsTaken: '' },
		issues: { problems: '', briefFix: '', types: [] },
		result: { extractedTo: '', challenges: '', failureReason: '' },
		summary: '',
		intersystemResponse: { required: false, details: '' }
	};
}

function load(key, fallback) {
	if (typeof window === 'undefined') return fallback;
	try {
		const raw = localStorage.getItem(key);
		return raw ? JSON.parse(raw) : fallback;
	} catch {
		return fallback;
	}
}

function save(key, value) {
	if (typeof window === 'undefined') return;
	try {
		localStorage.setItem(key, JSON.stringify(value));
	} catch {
		/* ignore storage errors */
	}
}

class TabStore {
	tabs = $state(load(TABS_KEY, []));
	activeTabId = $state(load(ACTIVE_KEY, null));
	closedTabs = $state(load(HISTORY_KEY, []));
	#saveTimer;

	constructor() {
		if (typeof window !== 'undefined') {
			// Validate that activeTabId points to a real tab
			if (this.activeTabId && !this.tabs.find((t) => t.id === this.activeTabId)) {
				this.activeTabId = this.tabs.length > 0 ? this.tabs[this.tabs.length - 1].id : null;
			}

			$effect.root(() => {
				$effect(() => {
					const snapshot = $state.snapshot(this.tabs);
					const active = this.activeTabId;
					const history = $state.snapshot(this.closedTabs);
					clearTimeout(this.#saveTimer);
					this.#saveTimer = setTimeout(() => {
						save(TABS_KEY, snapshot);
						save(ACTIVE_KEY, active);
						save(HISTORY_KEY, history);
					}, 300);
				});
			});
		}
	}

	get activeTab() {
		return this.tabs.find((t) => t.id === this.activeTabId) ?? null;
	}

	get activeData() {
		return this.activeTab?.data ?? null;
	}

	get hasActiveTab() {
		return this.activeTab !== null;
	}

	createTab(templateId, sections, tabName) {
		const id = generateId();
		const tab = {
			id,
			name: tabName || `AAR #${this.tabs.length + this.closedTabs.length + 1}`,
			template: templateId,
			data: {
				...createDefaultData(),
				sections: sections.map((s, i) => ({ ...s, id: i }))
			},
			createdAt: Date.now(),
			updatedAt: Date.now()
		};
		this.tabs.push(tab);
		this.activeTabId = id;
		return tab;
	}

	closeTab(id) {
		const idx = this.tabs.findIndex((t) => t.id === id);
		if (idx === -1) return;
		const tab = { ...$state.snapshot(this.tabs[idx]), closedAt: Date.now() };
		this.tabs.splice(idx, 1);
		this.closedTabs.unshift(tab);
		if (this.closedTabs.length > 50) this.closedTabs.length = 50;
		if (this.activeTabId === id) {
			this.activeTabId =
				this.tabs[Math.min(idx, this.tabs.length - 1)]?.id ?? null;
		}
	}

	switchTab(id) {
		if (this.tabs.some((t) => t.id === id)) {
			this.activeTabId = id;
		}
	}

	reopenTab(id) {
		const idx = this.closedTabs.findIndex((t) => t.id === id);
		if (idx === -1) return;
		const tab = $state.snapshot(this.closedTabs[idx]);
		this.closedTabs.splice(idx, 1);
		delete tab.closedAt;
		tab.updatedAt = Date.now();
		this.tabs.push(tab);
		this.activeTabId = tab.id;
	}

	renameTab(id, name) {
		const tab = this.tabs.find((t) => t.id === id);
		if (tab) {
			tab.name = name;
			tab.updatedAt = Date.now();
		}
	}

	clearHistory() {
		this.closedTabs = [];
	}

	resetTabData(id) {
		const tab = this.tabs.find((t) => t.id === id);
		if (!tab) return;
		const fresh = createDefaultData();
		fresh.sections = tab.data.sections.map((s) => ({ ...s }));
		tab.data = fresh;
		tab.updatedAt = Date.now();
	}

	clearTabSections(id) {
		const tab = this.tabs.find((t) => t.id === id);
		if (!tab) return;
		tab.data.sections = [];
		tab.updatedAt = Date.now();
	}
}

export const tabStore = new TabStore();
