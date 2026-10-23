export interface PressAndHoldOptions {
  durationMs?: number;
  onProgress?: (ratio: number) => void;
  onComplete: () => void;
  onCancel?: () => void;
}

export function bindPressAndHold(
  element: HTMLElement,
  options: PressAndHoldOptions
): () => void {
  const duration = options.durationMs || 800;
  let startTime = 0;
  let animFrameId: number | null = null;
  let isPressed = false;

  const startPress = (e: Event) => {
    // allow primary mouse click or touch
    if (e instanceof MouseEvent && e.button !== 0) return;
    isPressed = true;
    startTime = performance.now();

    const loop = (currentTime: number) => {
      if (!isPressed) return;
      const elapsed = currentTime - startTime;
      const ratio = Math.min(1, elapsed / duration);
      options.onProgress?.(ratio);

      if (ratio >= 1) {
        isPressed = false;
        options.onProgress?.(1);
        options.onComplete();
      } else {
        animFrameId = requestAnimationFrame(loop);
      }
    };

    animFrameId = requestAnimationFrame(loop);
  };

  const cancelPress = () => {
    if (!isPressed) return;
    isPressed = false;
    if (animFrameId) {
      cancelAnimationFrame(animFrameId);
      animFrameId = null;
    }
    options.onProgress?.(0);
    options.onCancel?.();
  };

  element.addEventListener('mousedown', startPress);
  element.addEventListener('touchstart', startPress, { passive: true });

  window.addEventListener('mouseup', cancelPress);
  window.addEventListener('touchend', cancelPress);
  window.addEventListener('touchcancel', cancelPress);

  return () => {
    cancelPress();
    element.removeEventListener('mousedown', startPress);
    element.removeEventListener('touchstart', startPress);
    window.removeEventListener('mouseup', cancelPress);
    window.removeEventListener('touchend', cancelPress);
    window.removeEventListener('touchcancel', cancelPress);
  };
}
