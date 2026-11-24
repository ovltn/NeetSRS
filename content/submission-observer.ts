import { getCurrentProblemSlug } from './page-context';

export const ACCEPTED_SUBMISSION_MESSAGE = 'neetsrs:accepted-submission';
// NeetCode judges a submission in one request: POST /api/executeCodeFunctionHttp with
// {data: {problemId, rawCode, lang}}, answered by {data: {status: {description}}}.
const SUBMISSION_URL = /\/executeCodeFunctionHttp\/?(?:\?|$)/;
const ACCEPTED = 'Accepted';
interface AcceptedSubmission {
  slug: string;
  submissionId: string;
}

// Runs in the page world so both fetch and XHR responses are observable. Only an
// Accepted result for the problem on screen can open the isolated content UI.
export function observeSubmissions(onAccepted: (submission: AcceptedSubmission) => void): () => void {
  let active = true;
  let navigation = 0;
  let submissions = 0;
  let currentSlug = getCurrentProblemSlug();
  const onNavigate = () => {
    const slug = getCurrentProblemSlug();
    if (slug !== currentSlug) {
      currentSlug = slug;
      navigation++;
    }
  };
  const restoreHistory = (['pushState', 'replaceState'] as const).map((method) => {
    const original = window.history[method];
    const wrapped: typeof original = (data, unused, url) => {
      original.call(window.history, data, unused, url);
      onNavigate();
    };
    window.history[method] = wrapped;
    return () => {
      if (window.history[method] === wrapped) window.history[method] = original;
    };
  });
  window.addEventListener('popstate', onNavigate);
  const originalFetch = window.fetch;
  const originalOpen = XMLHttpRequest.prototype.open;
  const originalSend = XMLHttpRequest.prototype.send;
  const requests = new WeakMap<
    XMLHttpRequest,
    { url: string; method: string; slug: string | null; navigation: number }
  >();

  function inspect(
    rawUrl: string,
    method: string,
    slug: string | null,
    startedNavigation: number,
    requestBody: unknown,
    data: unknown
  ) {
    if (startedNavigation !== navigation || !active || !slug || slug !== getCurrentProblemSlug()) return;
    const url = new URL(rawUrl, window.location.href);
    if (url.origin !== window.location.origin || method.toUpperCase() !== 'POST') return;
    if (submittedProblemId(requestBody) !== slug || statusDescription(data) !== ACCEPTED) return;
    // NeetCode returns no submission ID, so number them per page.
    onAccepted({ slug, submissionId: String(++submissions) });
  }

  const fetch: typeof window.fetch = async (input, init) => {
    const url = input instanceof Request ? input.url : String(input);
    const method = init?.method ?? (input instanceof Request ? input.method : 'GET');
    const slug = getCurrentProblemSlug();
    const startedNavigation = navigation;
    const observed = SUBMISSION_URL.test(url);
    const requestBody =
      observed && init?.body === undefined && input instanceof Request
        ? await input
            .clone()
            .text()
            .catch(() => undefined)
        : init?.body;
    const response = await originalFetch.call(window, input, init);
    if (observed) {
      void response
        .clone()
        .json()
        .then((data: unknown) => inspect(url, method, slug, startedNavigation, requestBody, data))
        .catch(() => {});
    }
    return response;
  };
  const open: typeof originalOpen = function (
    this: XMLHttpRequest,
    method: string,
    url: string | URL,
    async: boolean = true,
    username?: string | null,
    password?: string | null
  ) {
    requests.set(this, { url: String(url), method, slug: getCurrentProblemSlug(), navigation });
    originalOpen.call(this, method, url, async, username, password);
  };
  const send: typeof originalSend = function (this: XMLHttpRequest, body) {
    const request = requests.get(this);
    if (request && SUBMISSION_URL.test(request.url)) {
      this.addEventListener(
        'load',
        () => {
          try {
            const data: unknown = this.responseType === 'json' ? this.response : JSON.parse(this.responseText);
            inspect(request.url, request.method, request.slug, request.navigation, body, data);
          } catch {
            /* Non-JSON responses leave the host page unaffected. */
          }
        },
        { once: true }
      );
    }
    originalSend.call(this, body);
  };
  window.fetch = fetch;
  XMLHttpRequest.prototype.open = open;
  XMLHttpRequest.prototype.send = send;
  return () => {
    active = false;
    window.removeEventListener('popstate', onNavigate);
    for (const restore of restoreHistory) restore();
    if (window.fetch === fetch) window.fetch = originalFetch;
    if (XMLHttpRequest.prototype.open === open) XMLHttpRequest.prototype.open = originalOpen;
    if (XMLHttpRequest.prototype.send === send) XMLHttpRequest.prototype.send = originalSend;
  };
}

function field(value: unknown, key: string): unknown {
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>)[key] : undefined;
}

function submittedProblemId(body: unknown): unknown {
  if (typeof body !== 'string') return undefined;
  try {
    return field(field(JSON.parse(body), 'data'), 'problemId');
  } catch {
    return undefined;
  }
}

function statusDescription(response: unknown): unknown {
  return field(field(field(response, 'data'), 'status'), 'description');
}
