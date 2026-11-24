import { createHash } from 'node:crypto';
import { beforeEach, expect, it, vi } from 'vitest';
import { browser } from 'wxt/browser';
import { fakeBrowser } from 'wxt/testing/fake-browser';
import type { CatalogProblem } from '@/shared/catalog';

const twoSum: CatalogProblem = {
  frontendId: '1',
  title: 'Two Sum',
  translatedTitle: '两数之和',
  slug: 'two-sum',
  difficulty: 'easy',
  isPaidOnly: false,
  topics: ['array', 'hash-table'],
  sources: ['neetcode.io'],
};
const oldProblem: CatalogProblem = { ...twoSum, frontendId: '2', slug: 'old-problem' };
const newProblem: CatalogProblem = { ...twoSum, frontendId: '3', slug: 'new-problem' };
const REMOTE = 'https://raw.githubusercontent.com/ovltn/NeetSRS/main/public/data/neetcode-catalog-v1';

async function fetchBundled(url: unknown) {
  if (url === browser.runtime.getURL('/data/neetcode-catalog-v1.json')) {
    return Response.json(Object.fromEntries([twoSum, oldProblem].map((problem) => [problem.frontendId, problem])));
  }
  throw new Error(`Unexpected fetch: ${url}`);
}

function publish(json: string, sha256 = createHash('sha256').update(json).digest('hex')) {
  vi.mocked(fetch).mockImplementation(async (url) => {
    if (url === `${REMOTE}.sha256`) return new Response(`${sha256}\n`);
    if (url === `${REMOTE}.json`) return new Response(json);
    return fetchBundled(url);
  });
}

beforeEach(() => {
  vi.resetModules();
  fakeBrowser.reset();
  vi.mocked(fetch).mockImplementation(fetchBundled);
});

it('returns known and missing IDs in input order', async () => {
  const { getProblemsByFrontendIds } = await import('@/shared/catalog');
  expect(
    await getProblemsByFrontendIds([
      { frontendId: '2', domain: 'neetcode.io' },
      { frontendId: 'missing', domain: 'neetcode.io' },
      { frontendId: '1', domain: 'neetcode.io' },
      { frontendId: 'constructor', domain: 'neetcode.io' },
    ])
  ).toEqual([oldProblem, undefined, twoSum, undefined]);
});

it('returns a problem by its slug', async () => {
  const { getProblemBySlug } = await import('@/shared/catalog');
  expect(await getProblemBySlug('two-sum', 'neetcode.io')).toEqual(twoSum);
  expect(await getProblemBySlug('missing', 'neetcode.io')).toBeUndefined();
  expect(await getProblemBySlug('constructor', 'neetcode.io')).toBeUndefined();
});

it.each(['id', 'slug'] as const)('surfaces %s catalog loading failures', async (field) => {
  vi.mocked(fetch).mockResolvedValue(new Response(null, { status: 404 }));
  const { getProblemBySlug, getProblemsByFrontendIds } = await import('@/shared/catalog');
  const result =
    field === 'slug'
      ? getProblemBySlug('two-sum', 'neetcode.io')
      : getProblemsByFrontendIds([{ frontendId: '1', domain: 'neetcode.io' }]);
  await expect(result).rejects.toThrow('Failed to load catalog JSON: 404');
});

it('switches to the published catalog for good once downloaded', async () => {
  const catalog = await import('@/shared/catalog');
  expect(await catalog.getProblemBySlug('new-problem', 'neetcode.io')).toBeUndefined();
  publish(JSON.stringify({ 1: twoSum, 3: newProblem }));

  await catalog.refreshCatalog();

  expect(await catalog.getProblemsByFrontendIds([{ frontendId: '3', domain: 'neetcode.io' }])).toEqual([newProblem]);
  expect(await catalog.getProblemBySlug('old-problem', 'neetcode.io')).toBeUndefined();
  vi.resetModules();
  vi.mocked(fetch).mockRejectedValue(new Error('Offline'));
  const restarted = await import('@/shared/catalog');
  expect(await restarted.getProblemBySlug('new-problem', 'neetcode.io')).toEqual(newProblem);
});

it('downloads the catalog only when its published checksum changes', async () => {
  const { refreshCatalog } = await import('@/shared/catalog');
  publish(JSON.stringify({ 1: twoSum }));
  await refreshCatalog();

  await refreshCatalog();

  const downloads = vi.mocked(fetch).mock.calls.filter(([url]) => url === `${REMOTE}.json`);
  expect(downloads).toHaveLength(1);
});

it('retries a download that does not match its published checksum', async () => {
  const { getProblemBySlug, refreshCatalog } = await import('@/shared/catalog');
  publish(JSON.stringify({ 1: twoSum }), 'checksum-of-a-newer-catalog');
  await refreshCatalog();
  publish(JSON.stringify({ 1: twoSum, 3: newProblem }), 'checksum-of-a-newer-catalog');

  await refreshCatalog();

  expect(await getProblemBySlug('new-problem', 'neetcode.io')).toEqual(newProblem);
});

it('keeps the current catalog when the published catalog is invalid', async () => {
  const { getProblemBySlug, refreshCatalog } = await import('@/shared/catalog');
  publish(JSON.stringify({ 1: { ...twoSum, difficulty: 'impossible' } }));

  await expect(refreshCatalog()).rejects.toThrow();

  expect(await getProblemBySlug('two-sum', 'neetcode.io')).toEqual(twoSum);
});
