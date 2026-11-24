import { ACCEPTED_SUBMISSION_MESSAGE, observeSubmissions } from '@/content/submission-observer';

export default defineContentScript({
  matches: ['*://neetcode.io/*'],
  runAt: 'document_start',
  world: 'MAIN',
  main() {
    observeSubmissions((submission) => {
      window.postMessage({ type: ACCEPTED_SUBMISSION_MESSAGE, ...submission }, window.location.origin);
    });
  },
});
