import { buttonInteraction } from '@/popup/styles';
import { useI18n } from '../../contexts/I18nContext';

const APP_VERSION = __APP_VERSION__;
const GITHUB_URL = 'https://github.com/ovltn/NeetSRS';

export function AboutSection() {
  const t = useI18n();
  const links = [
    { href: GITHUB_URL, label: t.settings.about.github },
    { href: `${GITHUB_URL}/issues`, label: t.settings.about.feedbackLink },
  ];

  return (
    <section aria-label={t.settings.about.title}>
      <footer className="mb-2 flex flex-col items-center gap-2 text-xs text-tertiary">
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-1">
          {links.map(({ href, label }) => (
            <a
              key={href}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className={`rounded-sm hover:text-primary ${buttonInteraction}`}
            >
              {label}
            </a>
          ))}
        </div>
        <div className="flex items-center gap-1.5 text-caption">
          <span>{t.settings.about.copyright}</span>
          <span aria-hidden="true">·</span>
          <span className="font-jetbrains-mono">{t.format.version(APP_VERSION)}</span>
        </div>
      </footer>
    </section>
  );
}
