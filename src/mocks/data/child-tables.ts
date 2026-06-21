/**
 * Minimal fixtures for child-table collections (accessibility, fit, health,
 * registration, security, services). Each table has a few standard options
 * used by the congregation fixtures.
 */

export interface ChildRecord {
  collectionId: string;
  collectionName: string;
  created: string;
  id: string;
  name: string;
  updated: string;
}

// Accessibility options
export const accessibilityRecords: ChildRecord[] = [
  {
    collectionId: 'pbc_accessibility',
    collectionName: 'accessibility',
    created: '2025-01-01T00:00:00Z',
    id: 'acc_001',
    name: 'ADA Accessible',
    updated: '2025-01-01T00:00:00Z'
  },
  {
    collectionId: 'pbc_accessibility',
    collectionName: 'accessibility',
    created: '2025-01-01T00:00:00Z',
    id: 'acc_002',
    name: 'ASL Interpretation',
    updated: '2025-01-01T00:00:00Z'
  }
];

// Fit options
export const fitRecords: ChildRecord[] = [
  {
    collectionId: 'pbc_fit',
    collectionName: 'fit',
    created: '2025-01-01T00:00:00Z',
    id: 'fit_001',
    name: 'Public Statement',
    updated: '2025-01-01T00:00:00Z'
  },
  {
    collectionId: 'pbc_fit',
    collectionName: 'fit',
    created: '2025-01-01T00:00:00Z',
    id: 'fit_002',
    name: 'Clergy Member',
    updated: '2025-01-01T00:00:00Z'
  }
];

// Health protocol options
export const healthRecords: ChildRecord[] = [
  {
    collectionId: 'pbc_health',
    collectionName: 'health',
    created: '2025-01-01T00:00:00Z',
    id: 'health_001',
    name: 'Masks Required',
    updated: '2025-01-01T00:00:00Z'
  },
  {
    collectionId: 'pbc_health',
    collectionName: 'health',
    created: '2025-01-01T00:00:00Z',
    id: 'health_002',
    name: 'Vaccination Required',
    updated: '2025-01-01T00:00:00Z'
  }
];

// Registration options
export const registrationRecords: ChildRecord[] = [
  {
    collectionId: 'pbc_registration',
    collectionName: 'registration',
    created: '2025-01-01T00:00:00Z',
    id: 'reg_001',
    name: 'Email Required',
    updated: '2025-01-01T00:00:00Z'
  }
];

// Security options
export const securityRecords: ChildRecord[] = [
  {
    collectionId: 'pbc_security',
    collectionName: 'security',
    created: '2025-01-01T00:00:00Z',
    id: 'sec_001',
    name: 'Local Police Present',
    updated: '2025-01-01T00:00:00Z'
  }
];

// Service type options
export const servicesRecords: ChildRecord[] = [
  {
    collectionId: 'pbc_services',
    collectionName: 'services',
    created: '2025-01-01T00:00:00Z',
    id: 'svc_001',
    name: 'In-Person',
    updated: '2025-01-01T00:00:00Z'
  },
  {
    collectionId: 'pbc_services',
    collectionName: 'services',
    created: '2025-01-01T00:00:00Z',
    id: 'svc_002',
    name: 'Online',
    updated: '2025-01-01T00:00:00Z'
  }
];

/** Map collection name → all records for generic listing. */
export const childTableMap: Record<string, ChildRecord[]> = {
  accessibility: accessibilityRecords,
  fit: fitRecords,
  health: healthRecords,
  registration: registrationRecords,
  security: securityRecords,
  services: servicesRecords
};
