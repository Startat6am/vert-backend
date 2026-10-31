export class ScriptModal {
  constructor(root) {
    this.root = root;
    this.title = root.querySelector('[data-script-title]');
    this.content = root.querySelector('[data-script-content]');
    root.querySelector('[data-script-close]').addEventListener('click', () => this.close());
    root.addEventListener('click', (event) => {
      if (event.target === root) this.close();
    });
    this.onClose = () => {};
    this.keyHandler = (event) => {
      if (event.key === 'Escape' && !this.root.hidden) this.close();
    };
    window.addEventListener('keydown', this.keyHandler);
  }

  open(animation) {
    this.title.textContent = `Сценарий · ${this.format(animation.duration)}`;
    this.content.replaceChildren();
    const heading = document.createElement('p');
    heading.className = 'script-lead';
    heading.textContent = animation.scriptTitle || animation.title;
    this.content.append(heading);
    for (const item of animation.script ?? []) {
      const section = document.createElement('section');
      const time = document.createElement('h3');
      time.textContent = item.label || `${this.format(item.time)}`;
      const text = document.createElement('p');
      text.textContent = item.text;
      section.append(time, text);
      this.content.append(section);
    }
    if (animation.scriptNote) {
      const note = document.createElement('p');
      note.className = 'script-note';
      note.textContent = animation.scriptNote;
      this.content.append(note);
    }
    this.root.hidden = false;
  }

  close() {
    this.root.hidden = true;
    this.onClose();
  }

  format(seconds) {
    const value = Math.floor(seconds);
    return `${String(Math.floor(value / 60)).padStart(2, '0')}:${String(value % 60).padStart(2, '0')}`;
  }

  destroy() {
    window.removeEventListener('keydown', this.keyHandler);
  }
}
