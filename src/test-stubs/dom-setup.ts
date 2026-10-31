// Setup del proyecto `dom` de vitest. happy-dom no trae la Web Animations API
// que usan las transiciones de Svelte: se simula una animación que termina al
// instante (los tests miden comportamiento, no el movimiento).
if (typeof Element !== 'undefined' && !Element.prototype.animate) {
    Element.prototype.animate = function animate() {
        const animation = {
            onfinish: null as null | (() => void),
            oncancel: null as null | (() => void),
            currentTime: 0,
            playState: 'finished',
            finished: Promise.resolve(),
            cancel() {
                animation.oncancel?.()
            },
            finish() {
                animation.onfinish?.()
            },
            play() {},
            pause() {},
            reverse() {}
        }
        queueMicrotask(() => animation.onfinish?.())
        return animation as unknown as Animation
    }
}

if (typeof window !== 'undefined' && !window.matchMedia) {
    window.matchMedia = (query: string) =>
        ({ matches: false, media: query, addEventListener() {}, removeEventListener() {} }) as unknown as MediaQueryList
}
