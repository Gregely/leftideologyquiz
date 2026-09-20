/**
 * Move focus to a screen's heading when the screen changes, so keyboard and
 * screen-reader users start each question at the question rather than at
 * wherever the last button was. Skipped on first load, where taking focus
 * would only fight the browser.
 */

let firstScreen = true;

export function focusOnArrival(node: HTMLElement): void {
  if (firstScreen) {
    firstScreen = false;
    return;
  }
  node.focus({ preventScroll: false });
  window.scrollTo({ top: 0 });
}
