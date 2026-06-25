export interface PageFixture {
  collectionId: string;
  collectionName: string;
  content: string;
  created: string;
  description: string;
  id: string;
  slug: string;
  title: string;
  updated: string;
}

export interface PageVariantFixture {
  collectionId: string;
  collectionName: string;
  content: string;
  created: string;
  description: string;
  id: string;
  language: string;
  page: string;
  title: string;
  updated: string;
}

export const pageHome: PageFixture = {
  content: '# Welcome\n\nThis is the home page content for testing.',
  collectionId: 'pbc_pages',
  collectionName: 'pages',
  created: '2025-01-01T00:00:00Z',
  description: 'Welcome to Open Communities',
  id: 'page_home_001',
  slug: 'home',
  title: 'Home',
  updated: '2025-01-01T00:00:00Z'
};

export const pageAdd: PageFixture = {
  content: '# Add a Congregation\n\nUse this form to submit a new congregation.',
  collectionId: 'pbc_pages',
  collectionName: 'pages',
  created: '2025-01-01T00:00:00Z',
  description: 'Submit a new congregation',
  id: 'page_add_001',
  slug: 'add',
  title: 'Add Congregation',
  updated: '2025-01-01T00:00:00Z'
};

export const pageAbout: PageFixture = {
  content: '# About\n\nAbout page content.',
  collectionId: 'pbc_pages',
  collectionName: 'pages',
  created: '2025-01-01T00:00:00Z',
  description: 'About Open Communities',
  id: 'page_about_001',
  slug: 'about',
  title: 'About',
  updated: '2025-01-01T00:00:00Z'
};

export const pageVariants: PageVariantFixture[] = [
  {
    collectionId: 'pbc_2472443737',
    collectionName: 'pageVariants',
    content: '# Willkommen\n\nDies ist der Inhalt der Startseite für Tests.',
    created: '2025-01-01T00:00:00Z',
    description: 'Willkommen bei Open Communities',
    id: 'pv_home_de_001',
    language: 'de',
    page: 'page_home_001',
    title: 'Startseite',
    updated: '2025-01-01T00:00:00Z'
  }
];

export const allPages: PageFixture[] = [pageHome, pageAdd, pageAbout];

export function findPageBySlug(slug: string): PageFixture | undefined {
  return allPages.find((p) => p.slug === slug);
}
