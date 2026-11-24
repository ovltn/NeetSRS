import { ViewLayout } from '../../components/ViewLayout';
import { useI18n } from '../../contexts/I18nContext';
import { AboutSection } from './AboutSection';
import { DataSection } from './DataSection';
import { GeneralSettingsSection } from './GeneralSettingsSection';
import { GistSyncSection } from './GistSyncSection';
import { ReviewSettingsSection } from './ReviewSettingsSection';

// Sign-in needs an OAuth app, which NeetSRS does not have yet; sync stays hidden in builds without one.
const SYNC_CONFIGURED = Boolean(import.meta.env.WXT_GITHUB_CLIENT_ID);

export function SettingsView({ highlightGistSetup = false }: { highlightGistSetup?: boolean }) {
  const t = useI18n();
  return (
    <ViewLayout title={t.settings.title}>
      {SYNC_CONFIGURED && <GistSyncSection highlightSetup={highlightGistSetup} />}
      <ReviewSettingsSection />
      <GeneralSettingsSection />
      <DataSection />
      <AboutSection />
    </ViewLayout>
  );
}
