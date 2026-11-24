import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fakeBrowser } from 'wxt/testing/fake-browser';
import { storage } from 'wxt/utils/storage';
import { initializeLearningDocument } from '@/background/legacy/learning-document-startup';
import { background } from '@/shared/background-service';
import { readGistConnection, writeGistConnection } from '@/shared/gist-sync';
import { learningDocumentItem, readLearningDocument } from '@/shared/learning-document';
import { validLegacyBackup } from '@/test/utils/backup-mocks';
import { buildLearningDocument } from '@/test/utils/learning-document-mocks';

vi.mock('@/shared/background-service');

describe('learning document startup', () => {
  beforeEach(() => {
    fakeBrowser.reset();
    vi.mocked(background.waitForInitialization).mockImplementation(async () => {
      throw new Error('Startup must not request readiness');
    });
  });

  it('migrates an unversioned installation without losing notes or settings', async () => {
    const { backup, converted } = validLegacyBackup();
    const cards = structuredClone(backup.data.cards);
    Reflect.deleteProperty(cards['two-sum'], 'domain');
    const local: Record<string, unknown> = {
      'neetsrs:cards': cards,
      'neetsrs:stats': backup.data.stats,
      'neetsrs:dataUpdatedAt': backup.dataUpdatedAt,
      'neetsrs:lastSyncTime': 'local-status',
      'neetsrs:lastSyncDirection': 'pull',
      unrelated: 'keep',
    };
    for (const [id, note] of Object.entries(backup.data.notes)) {
      local[`neetsrs:notes:${id}`] = note;
    }
    const sync = {
      'neetsrs:theme': 'light',
      'neetsrs:maxNewCardsPerDay': 0,
      'neetsrs:badgeEnabled': false,
      'neetsrs:resetEditorOnDueReview': false,
      'neetsrs:autoClearLeetcode': false,
      'neetsrs:githubPat': ' token ',
      'neetsrs:gistId': 'legacy-gist',
      'neetsrs:gistSyncEnabled': true,
      unrelated: 'keep',
    };
    await fakeBrowser.storage.local.set(local);
    await fakeBrowser.storage.sync.set(sync);

    await initializeLearningDocument();

    const expected = buildLearningDocument({
      ...converted,
      dataUpdatedAt: backup.dataUpdatedAt,
      settings: {
        theme: 'light',
        maxNewCardsPerDay: 0,
        resetEditorOnReviewQueue: false,
      },
    });
    expect(await readLearningDocument()).toEqual(expected);
    expect(await readGistConnection()).toEqual({ accountId: null, gistId: null, enabled: false });
    expect(await fakeBrowser.storage.local.get()).toEqual({
      'neetsrs:learningDocument': expected,
      'neetsrs:lastSyncTime': 'local-status',
      'neetsrs:lastSyncDirection': 'pull',
      unrelated: 'keep',
    });
    expect(await fakeBrowser.storage.sync.get()).toEqual({
      'neetsrs:githubPat': ' token ',
      'neetsrs:gistId': 'legacy-gist',
      'neetsrs:gistSyncEnabled': true,
      unrelated: 'keep',
    });
  });

  it('treats a saved document as authoritative over stale legacy storage', async () => {
    const { backup, converted, legacyConverted } = validLegacyBackup();
    await fakeBrowser.storage.local.set({
      'neetsrs:learningDocument': {
        ...legacyConverted,
        schemaVersion: 7,
        settings: { language: 'de' },
        dataUpdatedAt: backup.dataUpdatedAt,
      },
      'neetsrs:cards': 'invalid stale cards',
      'neetsrs:schemaVersion': 'invalid stale version',
    });
    await fakeBrowser.storage.sync.set({ 'neetsrs:gistConnection': 'do not read or replace' });
    vi.spyOn(storage, 'snapshot').mockRejectedValue(new Error('Must not gather legacy storage'));

    await initializeLearningDocument();

    expect(await readLearningDocument()).toEqual(
      buildLearningDocument({
        ...converted,
        settings: {
          language: 'en',
        },
        dataUpdatedAt: backup.dataUpdatedAt,
      })
    );
    expect(await fakeBrowser.storage.sync.get()).toEqual({ 'neetsrs:gistConnection': 'do not read or replace' });
  });

  it('retries a rejected document write from intact legacy data', async () => {
    const { backup, converted } = validLegacyBackup();
    const local = {
      'neetsrs:schemaVersion': 2,
      'neetsrs:cards': backup.data.cards,
      'neetsrs:stats': backup.data.stats,
      'neetsrs:notes:valid-com': backup.data.notes['valid-com'],
      'neetsrs:dataUpdatedAt': backup.dataUpdatedAt,
    };
    const sync = {
      'neetsrs:theme': 'dark',
      'neetsrs:autoClearLeetcode': false,
      'neetsrs:githubPat': 'legacy-secret',
      'neetsrs:gistId': 'legacy-gist',
      'neetsrs:gistSyncEnabled': true,
    };
    await fakeBrowser.storage.local.set(local);
    await fakeBrowser.storage.sync.set(sync);
    vi.spyOn(fakeBrowser.storage.local, 'set').mockRejectedValueOnce(new Error('Storage unavailable'));

    await expect(initializeLearningDocument()).rejects.toThrow('Storage unavailable');

    expect(await learningDocumentItem.getValue()).toBeNull();
    expect(await fakeBrowser.storage.local.get()).toEqual(local);
    expect(await fakeBrowser.storage.sync.get()).toEqual({
      ...sync,
    });

    // A shared connection edit arriving before retry must win over the retained legacy fields.
    const shared = { accountId: null, gistId: null, enabled: false } as const;
    await writeGistConnection(shared);
    await initializeLearningDocument();

    expect(await readLearningDocument()).toEqual(
      buildLearningDocument({
        ...converted,
        dataUpdatedAt: backup.dataUpdatedAt,
        settings: { theme: 'dark', resetEditorOnReviewQueue: false },
      })
    );
    expect(await readGistConnection()).toEqual(shared);
  });
});
