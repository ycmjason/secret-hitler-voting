// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { HoldToCheck } from './hold-to-check.tsx';

afterEach(cleanup);

const renderBar = () => {
  const { container } = render(
    <HoldToCheck vote="nein">{held => <p>{held ? 'open' : 'sealed'}</p>}</HoldToCheck>,
  );
  return { container, bar: screen.getByRole('button') };
};

describe('hold to check', () => {
  it('keeps the vote out of the page until held', () => {
    const { container } = renderBar();
    expect(container.textContent).not.toMatch(/JA!|NEIN/);
    expect(container.textContent).toContain('sealed');
  });

  it('shows the vote while the pointer is down and hides it again on release', () => {
    const { container, bar } = renderBar();
    fireEvent.pointerDown(bar);
    expect(bar.textContent).toBe('You voted NEIN');
    expect(container.textContent).toContain('open');
    act(() => {
      window.dispatchEvent(new Event('pointerup'));
    });
    expect(container.textContent).not.toMatch(/JA!|NEIN/);
    expect(container.textContent).toContain('sealed');
  });

  it('reseals when the pointer is released on the bar itself', () => {
    const { container, bar } = renderBar();
    fireEvent.pointerDown(bar, { button: 0, pointerId: 1 });
    expect(bar.textContent).toBe('You voted NEIN');
    fireEvent.pointerUp(bar, { button: 0, pointerId: 1 });
    expect(container.textContent).not.toMatch(/NEIN/);
    fireEvent.pointerDown(bar, { button: 0, pointerId: 1 });
    fireEvent.pointerCancel(bar, { pointerId: 1 });
    expect(container.textContent).not.toMatch(/NEIN/);
  });

  it('ignores buttons other than the primary one', () => {
    const { container, bar } = renderBar();
    fireEvent.pointerDown(bar, { button: 2 });
    expect(container.textContent).not.toMatch(/NEIN/);
  });

  it('reseals when the tab is hidden', () => {
    const { container, bar } = renderBar();
    fireEvent.pointerDown(bar, { button: 0 });
    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'hidden' });
    try {
      act(() => {
        document.dispatchEvent(new Event('visibilitychange'));
      });
    } finally {
      delete (document as { visibilityState?: unknown }).visibilityState;
    }
    expect(container.textContent).not.toMatch(/NEIN/);
  });

  it('works from the keyboard: hold Space or Enter', () => {
    const { container, bar } = renderBar();
    for (const key of [' ', 'Enter']) {
      fireEvent.keyDown(bar, { key });
      expect(bar.textContent).toBe('You voted NEIN');
      fireEvent.keyUp(bar, { key });
      expect(container.textContent).not.toMatch(/NEIN/);
    }
  });

  it('reseals when focus or the window is lost', () => {
    const { container, bar } = renderBar();
    fireEvent.keyDown(bar, { key: ' ' });
    fireEvent.blur(bar);
    expect(container.textContent).not.toMatch(/NEIN/);
    fireEvent.pointerDown(bar);
    act(() => {
      window.dispatchEvent(new Event('blur'));
    });
    expect(container.textContent).not.toMatch(/NEIN/);
  });
});
