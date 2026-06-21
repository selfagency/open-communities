export interface PageFixture {
  body: string;
  collectionId: string;
  collectionName: string;
  created: string;
  id: string;
  slug: string;
  title: string;
  updated: string;
}

export const pageHome: PageFixture = {
  body: '# Welcome\n\nThis is the home page content for testing.',
  collectionId: 'pbc_pages',
  collectionName: 'pages',
  created: '2025-01-01T00:00:00Z',
  id: 'page_home_001',
  slug: 'home',
  title: 'Home',
  updated: '2025-01-01T00:00:00Z'
};

export const pageAdd: PageFixture = {
  body: '# Add a Congregation\n\nUse this form to submit a new congregation.',
  collectionId: 'pbc_pages',
  collectionName: 'pages',
  created: '2025-01-01T00:00:00Z',
  id: 'page_add_001',
  slug: 'add',
  title: 'Add Congregation',
  updated: '2025-01-01T00:00:00Z'
};

export const allPages: PageFixture[] = [pageHome, pageAdd];

export function findPageBySlug(slug: string): PageFixture | undefined {
  return allPages.find((p) => p.slug === slug);
}
