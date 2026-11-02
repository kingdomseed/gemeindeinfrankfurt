// Ref callback: focus an element as soon as React mounts it.
export function focusOnMount(el: HTMLElement | null) {
  el?.focus();
}
