import { z } from 'zod';
import { storage } from '#imports';
import { GITHUB_AUTH_ORIGIN } from './github-auth-origin';

export const githubAuthorizationItem = storage.defineItem<unknown>('local:neetsrs:githubAuthorization');
export const githubSetupPendingItem = storage.defineItem<boolean>('local:neetsrs:githubSetupPending', {
  fallback: false,
});

export const GITHUB_PERMISSIONS = {
  ...(import.meta.env.BROWSER === 'firefox'
    ? { data_collection: ['authenticationInfo', 'websiteActivity', 'websiteContent', 'technicalAndInteraction'] }
    : {}),
  origins: [`${GITHUB_AUTH_ORIGIN}/*`, 'https://api.github.com/*', 'https://gist.githubusercontent.com/*'],
};

export interface GithubAuthStatus {
  account: { id: number; login: string } | null;
  signingIn: boolean;
  error: 'signInFailed' | null;
  setupPending: boolean;
}

export interface GistDestination {
  id: string;
  description: string;
  updatedAt: string;
}

export const gistSyncConfigSchema = z.union([
  z.object({ accountId: z.null(), gistId: z.null(), enabled: z.literal(false) }),
  z.object({
    accountId: z.number().int().positive(),
    gistId: z.string().refine((id) => id.trim().length > 0),
    enabled: z.boolean(),
  }),
]);
export type GistSyncConfig = z.infer<typeof gistSyncConfigSchema>;

export const gistSetupSchema = z.discriminatedUnion('mode', [
  z.object({ mode: z.literal('existing'), gistId: z.string().trim().min(1) }),
  z.object({ mode: z.literal('create') }),
]);
export type GistSetup = z.infer<typeof gistSetupSchema>;

export type GistSyncErrorCode =
  | 'authentication'
  | 'connectionSaveFailed'
  | 'creationFailed'
  | 'gistNotFound'
  | 'missingBackup'
  | 'missingToken'
  | 'rateLimit'
  | 'unavailable'
  | 'unknown';

export type GistConnectionResult = { saved: true } | { saved: false; error: GistSyncErrorCode };

export interface GistSyncStatus {
  lastSyncTime: string | null;
  syncInProgress: boolean;
  lastError: GistSyncErrorCode | null;
}

export const gistConnectionItem = storage.defineItem<GistSyncConfig>('local:neetsrs:gistConnection');

// Sync status is separate from the learning document and its edit timestamp.
export const lastSyncTimeItem = storage.defineItem<string>('local:neetsrs:lastSyncTime');

export function removeSyncStatus(): Promise<void> {
  // Clear the retired direction key during reset and sign-out.
  return storage.removeItems([lastSyncTimeItem, 'local:neetsrs:lastSyncDirection']);
}

export async function readGistConnection(): Promise<GistSyncConfig> {
  const connection = await gistConnectionItem.getValue();

  return gistSyncConfigSchema.parse(connection ?? { accountId: null, gistId: null, enabled: false });
}

export function writeGistConnection(config: GistSyncConfig): Promise<void> {
  return gistConnectionItem.setValue(gistSyncConfigSchema.parse(config));
}

export function removeGistConnection(): Promise<void> {
  return gistConnectionItem.removeValue();
}
