import type { ContentScriptContext } from 'wxt/utils/content-script-context';
import { createShadowRootUi } from 'wxt/utils/content-script-ui/shadow-root';
import { z } from 'zod';
import type { Translations } from '@/shared/i18n/index';
import { readLearningDocument } from '@/shared/learning-document';
import { resolveLearningDocumentSettings } from '@/shared/settings';
import { setupEditorReset } from './editor-reset';
import { getCurrentProblemSlug } from './page-context';
import { ACCEPTED_SUBMISSION_MESSAGE } from './submission-observer';
import { NeetSrsControl } from './ui/NeetSrsControl';
import { createContentRoot } from './ui/shadow-root';
import { LocalizedToast } from './ui/Toast';
import './ui/shadow.css';

// The icon row above NeetCode's code editor.
const TOOLBAR_SELECTOR = '.editor-toolbar';

export async function bootstrapContent(ctx: ContentScriptContext) {
  let disposeReset = () => {};
  ctx.onInvalidated(() => disposeReset());
  await setupNeetSrsControl(ctx, () => {
    disposeReset();
    disposeReset = setupEditorReset(() => {
      void showToast(ctx, (t) => t.contentScript.codeReset);
    });
  });
}

// Calls onProblemChange at startup and whenever navigation changes the problem.
async function setupNeetSrsControl(ctx: ContentScriptContext, onProblemChange: () => void) {
  let root: ReturnType<typeof createContentRoot> | undefined;
  let slug: string | null | undefined;
  let request = 0;
  let pendingOpen = false;
  let navigation = 0;
  const seen = new Set<string>();
  const acceptedSchema = z.object({
    type: z.literal(ACCEPTED_SUBMISSION_MESSAGE),
    slug: z.string(),
    submissionId: z.string().regex(/^\d+$/),
  });
  function renderControl(openRequest = 0) {
    root?.render(<NeetSrsControl key={slug} openRequest={openRequest} />);
  }
  const ui = await createShadowRootUi(ctx, {
    name: 'neetsrs-control',
    position: 'inline',
    anchor: TOOLBAR_SELECTOR,
    append: (toolbar, host) => toolbar.prepend(host),
    onMount(container) {
      root = createContentRoot(container);
      renderControl(pendingOpen ? ++request : 0);
      pendingOpen = false;
      return root;
    },
    onRemove: (mountedRoot) => {
      mountedRoot?.unmount();
      root = undefined;
    },
  });
  ui.shadowHost.id = 'neetsrs-control';
  if (ctx.isInvalid) return;

  function mountControl() {
    const nextSlug = getCurrentProblemSlug();
    if (nextSlug !== slug) {
      slug = nextSlug;
      navigation++;
      pendingOpen = false;
      renderControl();
      onProblemChange();
    }
    const toolbar = document.querySelector(TOOLBAR_SELECTOR);
    if (toolbar && ui.mounted && ui.shadowHost.parentElement === toolbar) return;
    if (ui.mounted) ui.remove();
    // NeetCode keeps the editor inert until Angular has rendered it; a node added earlier breaks that render.
    if (toolbar && !toolbar.closest('[inert]')) ui.mount();
  }

  ctx.addEventListener(window, 'message', (event) => {
    if (event.source !== window || event.origin !== window.location.origin) return;
    const submission = acceptedSchema.safeParse(event.data);
    if (
      !submission.success ||
      submission.data.slug !== getCurrentProblemSlug() ||
      seen.has(submission.data.submissionId)
    )
      return;
    seen.add(submission.data.submissionId);
    mountControl();
    const startedNavigation = navigation;
    void readLearningDocument()
      .then((document) => {
        if (ctx.isInvalid || startedNavigation !== navigation || submission.data.slug !== getCurrentProblemSlug())
          return;
        if (!resolveLearningDocumentSettings(document).openRatingAfterSolving) return;
        if (root) renderControl(++request);
        else pendingOpen = true;
      })
      .catch((error: unknown) => console.error('Could not open rating panel:', error));
  });
  ctx.addEventListener(window, 'wxt:locationchange', mountControl);
  mountControl();
  const observer = new MutationObserver(mountControl);
  observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['inert'] });
  ctx.onInvalidated(() => observer.disconnect());
}

async function showToast(ctx: ContentScriptContext, message: (t: Translations) => string) {
  if (ctx.isInvalid) return;
  const ui = await createShadowRootUi(ctx, {
    name: 'neetsrs-toast',
    position: 'inline',
    anchor: 'body',
    onMount(container) {
      const root = createContentRoot(container);
      root.render(<LocalizedToast message={message} onDismiss={() => ui.remove()} />);
      return root;
    },
    onRemove: (root) => root?.unmount(),
  });
  if (ctx.isValid) ui.mount();
}
