import { bootstrapContent } from '@/content/bootstrap';

export default defineContentScript({
  matches: ['*://neetcode.io/*'],
  runAt: 'document_idle',
  cssInjectionMode: 'ui',
  main: bootstrapContent,
});
