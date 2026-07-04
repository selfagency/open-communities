import { browser } from '$app/environment';

export function createPortalPosition(hostEl: HTMLElement | null) {
  let hostRect = { top: 0, left: 0, width: 0, height: 0 };
  let scrollX = 0;
  let scrollY = 0;

  function update() {
    if (!hostEl) {
      return { hostRect, scrollX, scrollY };
    }
    hostRect = hostEl.getBoundingClientRect() as unknown as typeof hostRect;
    if (browser) {
      scrollX = window.scrollX;
      scrollY = window.scrollY;
    } else {
      scrollX = 0;
      scrollY = 0;
    }
    return { hostRect, scrollX, scrollY };
  }

  return { update };
}
