import { resolve } from 'node:path';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'wxt';
import pkg from './package.json';

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifestVersion: 3,
  // Signed builds land here; Mozilla's source upload should not carry them.
  zip: { excludeSources: ['web-ext-artifacts/**'] },
  webExt: {
    chromiumArgs:
      process.env.npm_lifecycle_event === 'dev:persistent' ? [`--user-data-dir=${resolve('.wxt/chrome-data')}`] : [],
  },
  manifest: ({ browser }) => ({
    ...(browser === 'firefox'
      ? {
          browser_specific_settings: {
            gecko: {
              id: 'neetsrs@ovltn.github.io',
              // Firefox polls this for new signed versions; .github/workflows/release-firefox.yml updates it.
              update_url: 'https://raw.githubusercontent.com/ovltn/NeetSRS/main/updates.json',
              strict_min_version: '140.0',
              data_collection_permissions: {
                required: ['none'],
                optional: ['authenticationInfo', 'websiteActivity', 'websiteContent', 'technicalAndInteraction'],
              },
            },
          },
        }
      : {}),
    action: {
      default_popup: 'popup.html',
    },
    name: '__MSG_extName__',
    description: '__MSG_extDescription__',
    default_locale: 'en',
    permissions: ['storage', 'alarms', 'activeTab', 'identity'],
    host_permissions: ['*://neetcode.io/*'],
    optional_host_permissions: [
      'https://auth.neetsrs.invalid/*',
      'https://api.github.com/*',
      'https://gist.githubusercontent.com/*',
    ],
  }),
  vite: () => ({
    plugins: [tailwindcss()],
    define: {
      __APP_VERSION__: JSON.stringify(pkg.version),
    },
  }),
});
