import { z } from 'zod';
import { storage } from '#imports';
import { convertLearningDocument } from '@/background/legacy/learning-document-conversions';
import {
  LEARNING_DOCUMENT_VERSION,
  learningDocumentItem,
  learningDocumentVersionSchema,
  replaceLearningDocument,
} from '@/shared/learning-document';

const legacySettingNames = [
  'maxNewCardsPerDay',
  'theme',
  'resetEditorOnEveryProblem',
  'resetEditorOnDueReview',
  'badgeEnabled',
  'language',
  'dayStartHour',
  'autoClearLeetcode',
] as const;

function gatherLegacyDocument(local: Record<string, unknown>, sync: Record<string, unknown>) {
  const version = Object.hasOwn(local, 'neetsrs:schemaVersion') ? local['neetsrs:schemaVersion'] : 0;
  const schemaVersion = z.int().min(0).max(5).parse(version);
  const data: Record<string, unknown> = { schemaVersion };

  for (const name of ['cards', 'stats', 'dataUpdatedAt']) {
    if (Object.hasOwn(local, `neetsrs:${name}`)) {
      data[name] = local[`neetsrs:${name}`];
    }
  }

  data.settings = Object.fromEntries(
    legacySettingNames
      .filter((name) => Object.hasOwn(sync, `neetsrs:${name}`))
      .map((name) => [name, sync[`neetsrs:${name}`]])
  );

  if (schemaVersion < 4) {
    data.notes = Object.fromEntries(
      Object.entries(local)
        .filter(([key]) => key.startsWith('neetsrs:notes:'))
        .map(([key, value]) => [key.slice('neetsrs:notes:'.length), value])
    );
  }

  return convertLearningDocument(data);
}

export async function initializeLearningDocument(): Promise<void> {
  const saved = await learningDocumentItem.getValue();

  if (saved != null) {
    // Stored documents must declare their version; only scattered installs may be unversioned.
    const { schemaVersion } = learningDocumentVersionSchema.parse(saved);
    const document = convertLearningDocument(saved);

    if (schemaVersion !== LEARNING_DOCUMENT_VERSION) {
      await replaceLearningDocument(document);
    }

    return;
  }

  const [local, sync] = await Promise.all([storage.snapshot('local'), storage.snapshot('sync')]);
  const document = gatherLegacyDocument(local, sync);

  await replaceLearningDocument(document);

  try {
    await removeLegacyLearningData();
  } catch (error) {
    // Publication succeeded. Retained legacy values must never become authoritative again.
    console.warn('Failed to clean up legacy learning data:', error);
  }
}

export async function removeLegacyLearningData(): Promise<void> {
  const local = await storage.snapshot('local');
  await storage.removeItems([
    'local:neetsrs:cards',
    'local:neetsrs:stats',
    'local:neetsrs:dataUpdatedAt',
    'local:neetsrs:schemaVersion',
    ...Object.keys(local)
      .filter((key) => key.startsWith('neetsrs:notes:'))
      .map((key): `local:${string}` => `local:${key}`),
    ...legacySettingNames.map((name): `sync:${string}` => `sync:neetsrs:${name}`),
  ]);
}
