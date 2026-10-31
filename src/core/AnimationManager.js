import * as THREE from 'three';
import { getAnimationCatalog } from './AnimationLoader.js';

export class AnimationManager {
  constructor(container, onChange = () => {}) {
    this.container = container;
    this.onChange = onChange;
    this.catalog = getAnimationCatalog();
    this.index = -1;
    this.instance = null;
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(container);
  }

  get current() {
    return this.catalog[this.index] ?? null;
  }

  get hasPrevious() {
    return this.index > 0;
  }

  get hasNext() {
    return this.index >= 0 && this.index < this.catalog.length - 1;
  }

  async open(index) {
    if (index < 0 || index >= this.catalog.length || index === this.index) return false;
    this.disposeCurrent();
    this.index = index;
    const definition = this.current;
    this.container.replaceChildren();
    this.instance = await definition.create({ THREE, container: this.container });
    this.resize();
    this.onChange({ animation: definition, index, count: this.catalog.length, hasPrevious: this.hasPrevious, hasNext: this.hasNext });
    return true;
  }

  async next() {
    return this.hasNext ? this.open(this.index + 1) : false;
  }

  async previous() {
    return this.hasPrevious ? this.open(this.index - 1) : false;
  }

  update(time, delta) {
    this.instance?.update?.(time, delta);
  }

  resize() {
    if (!this.instance) return;
    const { width, height } = this.container.getBoundingClientRect();
    if (width > 0 && height > 0) this.instance.resize?.(width, height);
  }

  disposeCurrent() {
    if (this.instance) {
      this.instance.destroy?.();
      this.instance = null;
    }
    this.container.replaceChildren();
  }

  destroy() {
    this.disposeCurrent();
    this.resizeObserver.disconnect();
  }
}
