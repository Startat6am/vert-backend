const modules = import.meta.glob('/animations/*/index.js', { eager: true });

export function getAnimationCatalog() {
  return Object.values(modules)
    .map((module) => module.default)
    .filter((animation) => animation && animation.id && animation.title && animation.duration > 0 && typeof animation.create === 'function')
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.id.localeCompare(b.id));
}
