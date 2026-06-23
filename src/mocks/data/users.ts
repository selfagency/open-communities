import { UsersLangOptions } from '$lib/pocketbase.d';

export interface UserFixture {
  avatar: string;
  collectionId: string;
  collectionName: string;
  congregation?: string;
  created: string;
  email: string;
  emailVisibility: boolean;
  id: string;
  lang: UsersLangOptions;
  name: string;
  token: string;
  updated: string;
  verified: boolean;
}

export const adminUser: UserFixture = {
  avatar: '',
  collectionId: 'pbc_users',
  collectionName: 'users',
  created: '2025-01-01T00:00:00Z',
  email: 'admin@example.test',
  emailVisibility: false,
  id: 'user_admin_001',
  lang: UsersLangOptions.en,
  name: 'Admin User',
  token: 'mock_admin_token',
  updated: '2025-01-01T00:00:00Z',
  verified: true
};

export const regularUser: UserFixture = {
  avatar: '',
  collectionId: 'pbc_users',
  collectionName: 'users',
  congregation: 'cong_001',
  created: '2025-01-02T00:00:00Z',
  email: 'user@example.test',
  emailVisibility: true,
  id: 'user_regular_001',
  lang: UsersLangOptions.en,
  name: 'Regular User',
  token: 'mock_user_token',
  updated: '2025-01-02T00:00:00Z',
  verified: true
};

export const unverifiedUser: UserFixture = {
  avatar: '',
  collectionId: 'pbc_users',
  collectionName: 'users',
  created: '2025-01-03T00:00:00Z',
  email: 'unverified@example.test',
  emailVisibility: false,
  id: 'user_unverified_001',
  lang: UsersLangOptions.en,
  name: 'Unverified User',
  token: 'mock_unverified_token',
  updated: '2025-01-03T00:00:00Z',
  verified: false
};

export const allUsers: UserFixture[] = [adminUser, regularUser, unverifiedUser];

export function findUserByEmail(email: string): undefined | UserFixture {
  return allUsers.find((u) => u.email === email);
}

export function findUserById(id: string): undefined | UserFixture {
  return allUsers.find((u) => u.id === id);
}
