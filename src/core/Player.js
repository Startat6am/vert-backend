export class Player {
  constructor(manager, onTick = () => {}) {
    this.manager = manager;
    this.onTick = onTick;
    this.duration = 0;
    this.time = 0;
    this.playing = false;
    this.frameId = 0;
    this.lastFrame = 0;
    this.boundFrame = this.frame.bind(this);
  }

  setDuration(duration) {
    this.pause();
    this.duration = duration;
    this.seek(0);
  }

  play() {
    if (this.playing || !this.duration) return;
    if (this.time >= this.duration) this.seek(0);
    this.playing = true;
    this.lastFrame = 0;
    this.onTick(this.time, this.duration, this.playing);
    this.frameId = requestAnimationFrame(this.boundFrame);
  }

  pause() {
    this.playing = false;
    this.lastFrame = 0;
    cancelAnimationFrame(this.frameId);
    this.frameId = 0;
    this.onTick(this.time, this.duration, this.playing);
  }

  toggle() {
    this.playing ? this.pause() : this.play();
  }

  seek(time) {
    this.time = Math.max(0, Math.min(this.duration, Number(time) || 0));
    this.manager.update(this.time, 0);
    this.onTick(this.time, this.duration, this.playing);
  }

  frame(timestamp) {
    if (!this.playing) return;
    if (!this.lastFrame) this.lastFrame = timestamp;
    const delta = Math.min((timestamp - this.lastFrame) / 1000, 0.05);
    this.lastFrame = timestamp;
    this.time += delta;
    if (this.time >= this.duration) this.time = 0;
    this.manager.update(this.time, delta);
    this.onTick(this.time, this.duration, this.playing);
    this.frameId = requestAnimationFrame(this.boundFrame);
  }

  destroy() {
    this.pause();
  }
}
