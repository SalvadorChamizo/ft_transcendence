export function getElement<T extends HTMLElement>(selector: string): T {
    const el = document.querySelector<T>(selector);
    if (!el)
        throw new Error(`Element not found: ${selector}`);
    return el;
}

export function showElement(el: HTMLElement) {
    el.style.display = "block";
}

export function hideElement(el: HTMLElement) {
    el.style.display = "none";
}

export function setText(el: HTMLElement, text: string) {
    el.textContent = text;
}