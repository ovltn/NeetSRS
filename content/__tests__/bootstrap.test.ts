// @vitest-environment happy-dom

import { act } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ContentScriptContext } from 'wxt/utils/content-script-context';
import { setupEditorReset } from '@/content/editor-reset';
import { watchDocumentTranslations } from '@/content/translations';
import { translations } from '@/shared/i18n/index';
import { requireDefined } from '@/test/utils/assertions';
import { bootstrapContent } from '../bootstrap';

vi.mock('@/content/editor-reset', () => ({ setupEditorReset: vi.fn() }));
vi.mock('@/content/translations', () => ({ watchDocumentTranslations: vi.fn() }));

let ctx: ContentScriptContext;
let notifyMutation: () => void;
const observe = vi.fn();
const disconnect = vi.fn();
const disposeReset = vi.fn();
const unwatchTranslations = vi.fn();

beforeEach(() => {
  ctx = new ContentScriptContext('test');
  vi.stubGlobal(
    'MutationObserver',
    class {
      constructor(private readonly callback: () => void) {}
      observe(target: Node, options: MutationObserverInit) {
        if (options.childList) {
          notifyMutation = this.callback;
          observe(target, options);
        }
      }
      disconnect = disconnect;
    }
  );
  document.body.innerHTML = '<div class="editor-toolbar"><div id="last-group"></div></div>';
  vi.mocked(watchDocumentTranslations).mockImplementation((onChange) => {
    onChange(translations.en);
    return unwatchTranslations;
  });
  vi.mocked(setupEditorReset).mockReturnValue(disposeReset);
});

afterEach(() => {
  act(() => {
    ctx.notifyInvalidated();
    document.body.innerHTML = '';
  });
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('content startup', () => {
  it('waits until NeetCode has rendered the editor before adding the control', async () => {
    document.body.innerHTML = '<div class="editor-toolbar-container" inert><div class="editor-toolbar"></div></div>';
    await act(() => bootstrapContent(ctx));
    expect(document.querySelector('#neetsrs-control')).toBeNull();

    document.querySelector('.editor-toolbar-container')?.removeAttribute('inert');
    act(() => notifyMutation());
    expect(document.querySelectorAll('.editor-toolbar #neetsrs-control')).toHaveLength(1);
  });

  it('checks whether to reset once per problem visit', async () => {
    history.replaceState({}, '', '/problemset/');
    await act(() => bootstrapContent(ctx));
    vi.mocked(setupEditorReset).mockClear();
    disposeReset.mockClear();

    history.pushState({}, '', '/problems/two-sum/description/');
    act(() => notifyMutation());
    expect(setupEditorReset).toHaveBeenCalledTimes(1);
    expect(disposeReset).toHaveBeenCalledTimes(1);

    history.replaceState({}, '', '/problems/two-sum/');
    act(() => notifyMutation());
    act(() => notifyMutation());
    expect(setupEditorReset).toHaveBeenCalledTimes(1);
    expect(disposeReset).toHaveBeenCalledTimes(1);

    history.pushState({}, '', '/problems/add-two-numbers/');
    act(() => notifyMutation());
    expect(setupEditorReset).toHaveBeenCalledTimes(2);
    expect(disposeReset).toHaveBeenCalledTimes(2);

    act(() => ctx.notifyInvalidated());
    expect(disposeReset).toHaveBeenCalledTimes(3);
  });

  it('mounts late and replaced toolbars without duplicates and unmounts when they disappear', async () => {
    document.body.innerHTML = '';
    await act(() => bootstrapContent(ctx));
    expect(document.querySelector('#neetsrs-control')).toBeNull();

    document.body.innerHTML = '<div class="editor-toolbar"><div id="last-group"></div></div>';
    act(() => notifyMutation());
    act(() => notifyMutation());

    expect(document.querySelectorAll('#neetsrs-control')).toHaveLength(1);
    document.querySelector('#neetsrs-control')?.remove();
    act(() => notifyMutation());
    expect(document.querySelectorAll('#neetsrs-control')).toHaveLength(1);

    unwatchTranslations.mockClear();
    const oldToolbar = requireDefined(document.querySelector('.editor-toolbar'));
    oldToolbar.removeAttribute('class');
    document.body.insertAdjacentHTML('beforeend', '<div class="editor-toolbar"><div id="last-group"></div></div>');

    act(() => notifyMutation());
    act(() => notifyMutation());

    expect(oldToolbar.isConnected).toBe(true);
    expect(oldToolbar.querySelector('#neetsrs-control')).toBeNull();
    expect(document.querySelectorAll('#neetsrs-control')).toHaveLength(1);
    expect(document.querySelector('.editor-toolbar #neetsrs-control')).not.toBeNull();
    expect(unwatchTranslations).toHaveBeenCalledOnce();

    const toolbar = requireDefined(document.querySelector('.editor-toolbar'));
    toolbar.remove();

    act(() => notifyMutation());

    expect(toolbar.querySelector('#neetsrs-control')).toBeNull();
    expect(unwatchTranslations).toHaveBeenCalledTimes(2);
  });
});
