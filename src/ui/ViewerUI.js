import { ScriptModal } from './ScriptModal.js';

export class ViewerUI {
  constructor({ root, manager, player }) {
    this.root = root;
    this.manager = manager;
    this.player = player;
    this.title = root.querySelector('[data-title]');
    this.counter = root.querySelector('[data-counter]');
    this.progress = root.querySelector('[data-progress]');
    this.playButton = root.querySelector('[data-play]');
    this.playIcon = root.querySelector('[data-play-icon]');
    this.previousButton = root.querySelector('[data-previous]');
    this.nextButton = root.querySelector('[data-next]');
    this.seekBar = root.querySelector('[data-seek]');
    this.modal = new ScriptModal(root.querySelector('[data-script-modal]'));
    this.modal.onClose = () => this.player.play();
    this.playButton.addEventListener('click', () => this.player.toggle());
    this.previousButton.addEventListener('click', () => this.navigate(() => this.manager.previous()));
    this.nextButton.addEventListener('click', () => this.navigate(() => this.manager.next()));
    root.querySelector('[data-script-open]').addEventListener('click', () => {
      this.player.pause();
      if (this.manager.current) this.modal.open(this.manager.current);
    });
    this.seekBar.addEventListener('input', () => this.player.seek(Number(this.seekBar.value) / 1000 * this.player.duration));
  }

  async navigate(action) {
    this.player.pause();
    if (await action()) {
      this.player.setDuration(this.manager.current.duration);
      this.player.play();
    }
  }

  setAnimation({ animation, index, count, hasPrevious, hasNext }) {
    this.title.textContent = animation.title;
    this.counter.textContent = `${String(index + 1).padStart(2, '0')} / ${String(count).padStart(2, '0')}`;
    this.previousButton.disabled = !hasPrevious;
    this.nextButton.disabled = !hasNext;
    this.seekBar.value = '0';
    this.renderTime(0, animation.duration, false);
  }

  renderTime(time, duration, playing) {
    const format = (value) => {
      const seconds = Math.floor(value);
      return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
    };
    this.counterTime = `${format(time)} / ${format(duration)}`;
    this.root.querySelector('[data-time]').textContent = this.counterTime;
    this.progress.style.width = `${duration ? time / duration * 100 : 0}%`;
    this.seekBar.value = String(duration ? time / duration * 1000 : 0);
    this.playButton.setAttribute('aria-label', playing ? 'Пауза' : 'Воспроизвести');
    this.playIcon.textContent = playing ? 'Ⅱ' : '▶';
  }

  destroy() {
    this.modal.destroy();
  }
}
