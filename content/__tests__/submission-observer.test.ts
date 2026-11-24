// @vitest-environment happy-dom
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { observeSubmissions } from '../submission-observer';

const SUBMIT = '/api/executeCodeFunctionHttp';
const RUN = '/api/runCodeFunctionHttp';
const result = (description: string) => ({ data: { status: { description } } });
const submission = (problemId: string) => JSON.stringify({ data: { problemId, rawCode: 'pass', lang: 'python' } });

let dispose: () => void;
const network = vi.fn<typeof fetch>();
const accepted = vi.fn();
beforeEach(() => {
  window.history.replaceState({}, '', '/problems/two-integer-sum/question');
  vi.stubGlobal('fetch', network);
  dispose = observeSubmissions(accepted);
});
afterEach(() => dispose());
async function post(path: string, problemId: string, body: unknown) {
  network.mockResolvedValueOnce(Response.json(body));
  const response = await window.fetch(path, { method: 'POST', body: submission(problemId) });
  await new Promise((resolve) => setTimeout(resolve, 0));
  return response;
}

it('opens once per Accepted submission of the problem on screen, leaving the response readable', async () => {
  const response = await post(SUBMIT, 'two-integer-sum', result('Accepted'));
  expect(await response.json()).toEqual(result('Accepted'));
  expect(accepted).toHaveBeenCalledExactlyOnceWith({ slug: 'two-integer-sum', submissionId: '1' });
  await post(SUBMIT, 'two-integer-sum', result('Accepted'));
  expect(accepted).toHaveBeenLastCalledWith({ slug: 'two-integer-sum', submissionId: '2' });
});

it('ignores rejected submissions, test runs, other problems, navigation, and results after disposal', async () => {
  await post(SUBMIT, 'two-integer-sum', result('Wrong Answer'));
  await post(RUN, 'two-integer-sum', result('Accepted'));
  await post(SUBMIT, 'duplicate-integer', result('Accepted'));
  network.mockImplementationOnce(async () => {
    window.history.pushState({}, '', '/problems/duplicate-integer/question');
    return Response.json(result('Accepted'));
  });
  await window.fetch(SUBMIT, { method: 'POST', body: submission('two-integer-sum') });
  await new Promise((resolve) => setTimeout(resolve, 0));
  dispose();
  await post(SUBMIT, 'duplicate-integer', result('Accepted'));
  expect(accepted).not.toHaveBeenCalled();
});

it('observes XHR submissions, which NeetCode uses, without changing the page response', () => {
  dispose();
  const open = vi.spyOn(XMLHttpRequest.prototype, 'open').mockImplementation(() => {});
  const send = vi.spyOn(XMLHttpRequest.prototype, 'send').mockImplementation(() => {});
  dispose = observeSubmissions(accepted);
  const submit = new XMLHttpRequest();
  submit.open('POST', SUBMIT);
  submit.responseType = 'json';
  const response = result('Accepted');
  Object.defineProperty(submit, 'response', { value: response });
  const body = submission('two-integer-sum');
  submit.send(body);
  submit.dispatchEvent(new Event('load'));
  expect(open.mock.calls.map(([method, url]) => [method, url])).toEqual([['POST', SUBMIT]]);
  expect(open.mock.contexts).toEqual([submit]);
  expect(send).toHaveBeenCalledExactlyOnceWith(body);
  expect(submit.response).toBe(response);
  expect(accepted).toHaveBeenCalledExactlyOnceWith({ slug: 'two-integer-sum', submissionId: '1' });
});
