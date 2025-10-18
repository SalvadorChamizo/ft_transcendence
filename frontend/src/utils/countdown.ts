/**
 * runCountdown(elId, seconds)
 * Shows the element with id elId as a countdown from `seconds` to 1.
 * Adds a tick animation class on each number. Resolves when finished.
 */
export function runCountdown(elId: string, seconds: number = 3): Promise<void> {
  return new Promise((resolve) => {
    const el = document.getElementById(elId);
    if (!el) {
      // nothing to show, just wait the time and resolve
      setTimeout(() => resolve(), seconds * 1000);
      return;
    }

    let counter = seconds;
    el.textContent = String(counter);
    el.classList.remove('hidden');

    const tick = () => {
      // trigger animation reflow
      el.classList.remove('countdown-animate');
      // force reflow to restart animation
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      el.offsetWidth;
      el.classList.add('countdown-animate');
    };

    tick();

    const iv = setInterval(() => {
      counter -= 1;
      if (counter <= 0) {
        clearInterval(iv);
        el.classList.remove('countdown-animate');
        el.classList.add('hidden');
        resolve();
      } else {
        el.textContent = String(counter);
        tick();
      }
    }, 1000);
  });
}
