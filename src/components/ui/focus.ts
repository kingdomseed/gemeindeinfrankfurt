// Ref callback that moves focus to an element when it mounts, so screen
// reader and keyboard users land on a message that just appeared.
export function focusOnMount(el: HTMLElement | null) {
  el?.focus();
}
