export interface CongregationFixture {
	id: string;
	collectionId: string;
	collectionName: string;
	created: string;
	updated: string;
	accessibility: string[];
	clergy: string;
	contactEmail: string;
	contactName: string;
	contactUrl: string;
	denomination: string;
	fit: string[];
	flavor: string;
	health: string[];
	location: string;
	name: string;
	notes: string;
	owner: string;
	registration: string[];
	security: string[];
	services: string[];
	slug: string;
	visible: boolean;
	expand?: Record<string, unknown>;
}

// Visible congregation owned by regularUser
export const congregationVisible: CongregationFixture = {
	accessibility: ["acc_001"],
	clergy: "rabbi",
	collectionId: "pbc_congregations",
	collectionName: "congregations",
	contactEmail: "info@shalom.org",
	contactName: "Rabbi Cohen",
	contactUrl: "https://shalom.org",
	created: "2025-01-10T00:00:00Z",
	denomination: "reform",
	fit: ["fit_001"],
	flavor: "egalitarian",
	health: ["health_001"],
	id: "cong_001",
	location: "loc_001",
	name: "Shalom Congregation",
	notes: "A welcoming community",
	owner: "user_regular_001",
	registration: ["reg_001"],
	security: ["sec_001"],
	services: ["svc_001"],
	slug: "shalom-congregation",
	updated: "2025-01-15T00:00:00Z",
	visible: true,
};

// Hidden congregation owned by regularUser
export const congregationHidden: CongregationFixture = {
	accessibility: [],
	clergy: "cantor",
	collectionId: "pbc_congregations",
	collectionName: "congregations",
	contactEmail: "private@example.test",
	contactName: "Private Member",
	contactUrl: "",
	created: "2025-02-01T00:00:00Z",
	denomination: "conservative",
	fit: [],
	flavor: "traditional",
	health: [],
	id: "cong_002",
	location: "loc_002",
	name: "Private Minyan",
	notes: "",
	owner: "user_regular_001",
	registration: [],
	security: [],
	services: [],
	slug: "private-minyan",
	updated: "2025-02-01T00:00:00Z",
	visible: false,
};

// Visible congregation owned by OTHER user (for ownership tests)
export const congregationOtherOwner: CongregationFixture = {
	accessibility: [],
	clergy: "rabbi",
	collectionId: "pbc_congregations",
	collectionName: "congregations",
	contactEmail: "other@example.test",
	contactName: "Other Rabbi",
	contactUrl: "",
	created: "2025-03-01T00:00:00Z",
	denomination: "orthodox",
	fit: [],
	flavor: "modern",
	health: [],
	id: "cong_003",
	location: "loc_003",
	name: "Other Community",
	notes: "",
	owner: "other_user_001",
	registration: [],
	security: [],
	services: [],
	slug: "other-community",
	updated: "2025-03-01T00:00:00Z",
	visible: true,
};

// Online-only congregation
export const congregationOnline: CongregationFixture = {
	accessibility: [],
	clergy: "",
	collectionId: "pbc_congregations",
	collectionName: "congregations",
	contactEmail: "online@example.test",
	contactName: "Online Group",
	contactUrl: "https://online.example.test",
	created: "2025-04-01T00:00:00Z",
	denomination: "reconstructionist",
	fit: [],
	flavor: "online",
	health: [],
	id: "cong_004",
	location: "loc_004",
	name: "Online Gathering",
	notes: "Zoom-based community",
	owner: "user_regular_001",
	registration: [],
	security: [],
	services: [],
	slug: "online-gathering",
	updated: "2025-04-01T00:00:00Z",
	visible: true,
};

export const allCongregations: CongregationFixture[] = [
	congregationVisible,
	congregationHidden,
	congregationOtherOwner,
	congregationOnline,
];

export function findCongregationById(
	id: string,
): CongregationFixture | undefined {
	return allCongregations.find((c) => c.id === id);
}

// The view collection (congregationMeta) returns flattened records
export const congregationMetaViews = allCongregations.map((c) => ({
	...c,
	// flatten child-table refs into strings for the view
	denominationName: c.denomination,
	flavorName: c.flavor,
}));
