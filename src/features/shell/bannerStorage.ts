// Shared by the banner's pre-paint script and its dismiss button.
export const hiddenAttribute = "data-registration-bar-hidden";

export function dismissKey(trainingId: string) {
  return `registration-bar-${trainingId}`;
}
