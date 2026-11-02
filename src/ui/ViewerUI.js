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
    this.createAnimationList();
  }

  createAnimationList() {
    this.listModal = document.createElement('div');
    this.listModal.className = 'animation-list-modal';
    this.listModal.hidden = true;
    this.listModal.innerHTML = `
      <section class="animation-list-dialog" role="dialog" aria-modal="true" aria-labelledby="animation-list-title">
        <div class="dialog-header">
          <h2 id="animation-list-title">Анимации</h2>
          <button class="icon-button close-button" type="button" aria-label="Закрыть">×</button>
        </div>
        <div class="animation-list-content"></div>
      </section>`;
    document.body.append(this.listModal);
    this.listContent = this.listModal.querySelector('.animation-list-content');
    this.listModal.querySelector('.close-button').addEventListener('click', () => this.closeAnimationList());
    this.listModal.addEventListener('click', (event) => {
      if (event.target === this.listModal) this.closeAnimationList();
    });
    this.listModal.addEventListener('click', async (event) => {
      const item = event.target.closest('[data-animation-index]');
      if (!item) return;
      const index = Number(item.dataset.animationIndex);
      this.closeAnimationList(false);
      this.player.pause();
      if (await this.manager.open(index)) {
        this.player.setDuration(this.manager.current.duration);
      } else if (this.manager.current) {
        this.player.seek(0);
      }
      this.player.play();
    });
    this.listKeyHandler = (event) => {
      if (event.key === 'Escape' && !this.listModal.hidden) this.closeAnimationList();
    };
    window.addEventListener('keydown', this.listKeyHandler);
    this.root.querySelector('[data-animation-list-open]').addEventListener('click', () => this.openAnimationList());
  }

  openAnimationList() {
    this.player.pause();
    this.listContent.replaceChildren();
    this.manager.catalog.forEach((animation, index) => {
      const item = document.createElement('button');
      item.type = 'button';
      item.className = 'animation-list-item';
      item.dataset.animationIndex = String(index);
      if (index === this.manager.index) item.classList.add('is-active');
      const number = document.createElement('span');
      number.className = 'animation-list-number';
      number.textContent = String(index + 1).padStart(2, '0');
      const details = document.createElement('span');
      details.className = 'animation-list-details';
      const title = document.createElement('span');
      title.className = 'animation-list-title';
      title.textContent = animation.title;
      const duration = document.createElement('span');
      duration.className = 'animation-list-duration';
      duration.textContent = this.formatTime(animation.duration);
      details.append(title, duration);
      const arrow = document.createElement('span');
      arrow.className = 'animation-list-arrow';
      arrow.textContent = '↗';
      item.append(number, details, arrow);
      this.listContent.append(item);
    });
    if (!this.manager.catalog.length) {
      const empty = document.createElement('p');
      empty.className = 'animation-list-empty';
      empty.textContent = 'Нет доступных анимаций';
      this.listContent.append(empty);
    }
    this.listModal.hidden = false;
  }

  closeAnimationList(resume = true) {
    this.listModal.hidden = true;
    if (resume) this.player.play();
  }

  formatTime(value) {
    const seconds = Math.floor(value);
    return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
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
    window.removeEventListener('keydown', this.listKeyHandler);
    this.listModal?.remove();
  }
}
