import type { CatalogProblem } from '@/shared/catalog';

export const testCatalog: CatalogProblem[] = [
  {
    frontendId: '1',
    slug: 'two-sum',
    title: 'Two Sum',
    translatedTitle: '两数之和',
    difficulty: 'easy',
    isPaidOnly: false,
    topics: ['array'],
    sources: ['neetcode.io'],
  },
  {
    frontendId: '2',
    slug: 'add-two-numbers',
    title: 'Add Two Numbers',
    translatedTitle: null,
    difficulty: 'medium',
    isPaidOnly: false,
    topics: [],
    sources: ['neetcode.io'],
  },
  {
    frontendId: '3',
    slug: 'longest-substring',
    title: 'Longest Substring',
    translatedTitle: null,
    difficulty: 'medium',
    isPaidOnly: false,
    topics: [],
    sources: ['neetcode.io'],
  },
];
