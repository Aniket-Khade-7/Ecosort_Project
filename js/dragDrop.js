import { animateNumber } from './utils.js';
export class SortingGame {
  constructor({ data, state, tray, binsHost, scoreOutput, maxOutput, countOutput, progress, feedback, continueButton, instruction }) {
    Object.assign(this, { data, state, tray, binsHost, scoreOutput, maxOutput, countOutput, progress, feedback, continueButton, instruction });
    this.activeDrag = null;
    this.selectedItemId = null;
    this.render();
  }

  render() {
    this.tray.replaceChildren();
    this.binsHost.replaceChildren();
    this.maxOutput.textContent = String(this.data.items.length * 10);
    this.progress.max = this.data.items.length;
    this.data.items.forEach((item) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'waste-item';
      button.dataset.itemId = item.id;
      button.setAttribute('aria-label', `${item.label}. Press Enter to select, then 1, 2 or 3 to choose a bin.`);
      button.innerHTML = `<span class="waste-item__icon" aria-hidden="true"><img class="asset-icon" src="${item.icon}" alt=""></span><span class="waste-item__label"></span><span class="waste-item__status" aria-hidden="true"></span>`;
      button.querySelector('.waste-item__label').textContent = item.label;
      button.addEventListener('pointerdown', (event) => this.startDrag(event, item, button));
      button.addEventListener('keydown', (event) => this.onItemKeydown(event, item, button));
      this.tray.append(button);
    });
    this.data.bins.forEach((bin, index) => {
      const card = document.createElement('article');
      card.className = 'drop-bin';
      card.dataset.binId = bin.id;
      card.dataset.binNumber = String(index + 1);
      card.style.setProperty('--bin-color', bin.color);
      card.innerHTML = `<div class="drop-bin__top"><span class="drop-bin__icon" aria-hidden="true"></span><span class="drop-bin__number">${index + 1}</span></div><h2 class="drop-bin__label"></h2><p class="drop-bin__description"></p><div class="drop-bin__feedback" aria-live="polite"></div>`;
      card.querySelector('.drop-bin__icon').innerHTML = `<img class="asset-icon" src="${bin.icon}" alt="">`;
      card.querySelector('.drop-bin__label').textContent = bin.label;
      card.querySelector('.drop-bin__description').textContent = bin.description;
      this.binsHost.append(card);
    });
    this.updateScore();
    this.updateProgress();
  }

  onItemKeydown(event, item, button) {
    if (this.state.sortedItems.has(item.id)) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.selectedItemId = item.id;
      this.tray.querySelectorAll('.waste-item').forEach((node) => node.classList.toggle('is-selected', node === button));
      this.feedback.textContent = `${item.label} selected. Press 1 for ${this.data.bins[0].label}, 2 for ${this.data.bins[1].label}, or 3 for ${this.data.bins[2].label}.`;
    }
  }

  startDrag(event, item, button) {
    if (event.button !== 0 || this.state.sortedItems.has(item.id)) return;
    event.preventDefault();

    const rect = button.getBoundingClientRect();
    const placeholder = document.createElement('div');
    placeholder.className = 'tray-placeholder';
    placeholder.style.width = `${rect.width}px`;
    placeholder.style.height = `${rect.height}px`;
    button.after(placeholder);

    this.activeDrag = {
      item, button, placeholder,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
      target: null,
      pointerId: event.pointerId
    };

    // Move the real card with the pointer; the placeholder keeps the tray layout steady.
    Object.assign(button.style, {
      position: 'fixed',
      left: `${rect.left}px`,
      top: `${rect.top}px`,
      width: `${rect.width}px`,
      height: `${rect.height}px`,
      margin: '0',
      zIndex: '1000',
      pointerEvents: 'none',
      transform: 'none'
    });
    button.classList.add('is-dragging');
    button.setAttribute('aria-grabbed', 'true');
    document.body.append(button);

    this.onMove = (moveEvent) => this.moveDrag(moveEvent);
    this.onUp = (upEvent) => this.endDrag(upEvent);
    this.onCancel = () => this.cancelDrag();
    document.addEventListener('pointermove', this.onMove);
    document.addEventListener('pointerup', this.onUp);
    document.addEventListener('pointercancel', this.onCancel);
    this.moveDrag(event);
  }

  moveDrag(event) {
    if (!this.activeDrag) return;
    const { button, offsetX, offsetY } = this.activeDrag;
    button.style.left = `${event.clientX - offsetX}px`;
    button.style.top = `${event.clientY - offsetY}px`;

    // elementFromPoint works even when the dragged card overlaps a bin.
    const underPointer = document.elementFromPoint(event.clientX, event.clientY);
    const target = underPointer?.closest('.drop-bin');
    const validTarget = target && this.binsHost.contains(target) ? target : null;

    this.binsHost.querySelectorAll('.drop-bin').forEach((bin) => {
      bin.classList.toggle('is-target', bin === validTarget);
    });
    this.activeDrag.target = validTarget;
  }

  endDrag(event) {
    if (!this.activeDrag) return;
    // Re-check the final pointer position so a quick drop cannot use a stale target.
    this.moveDrag(event);
    const active = this.activeDrag;
    const target = active.target;
    const bin = target ? this.data.bins.find((candidate) => candidate.id === target.dataset.binId) : null;
    this.cleanupListeners();

    if (bin) {
      this.attemptSort(active.item, bin, active.button);
    } else {
      this.returnToTray();
    }
  }

  cleanupListeners() {
    document.removeEventListener('pointermove', this.onMove);
    document.removeEventListener('pointerup', this.onUp);
    document.removeEventListener('pointercancel', this.onCancel);
    this.binsHost.querySelectorAll('.drop-bin').forEach((bin) => bin.classList.remove('is-target'));
  }

  cancelDrag() {
    if (!this.activeDrag) return;
    this.cleanupListeners();
    this.returnToTray();
  }

  returnToTray() {
    if (!this.activeDrag) return;
    const { button, placeholder } = this.activeDrag;
    button.classList.remove('is-dragging');
    button.style.cssText = '';
    button.removeAttribute('aria-grabbed');
    placeholder.replaceWith(button);
    this.activeDrag = null;
  }

  attemptSort(item, bin, button) {
    const tries = (this.state.tries[item.id] || 0) + 1;
    this.state.tries[item.id] = tries;
    const binElement = this.binsHost.querySelector(`[data-bin-id="${bin.id}"]`);
    const feedbackElement = binElement.querySelector('.drop-bin__feedback');
    if (item.bin === bin.id) {
      this.state.sortedItems.add(item.id);
      this.state.gameScore += tries === 1 ? 10 : 5;
      button.classList.remove('is-dragging', 'is-selected');
      button.style.cssText = '';
      button.removeAttribute('aria-grabbed');
      const placeholder = this.activeDrag?.placeholder;
      if (placeholder?.isConnected) placeholder.replaceWith(button);
      if (button.parentElement !== this.tray) this.tray.append(button);
      this.activeDrag = null;
      button.classList.add('is-sorted');
      button.disabled = true;
      button.querySelector('.waste-item__status').textContent = '✓';
      binElement.classList.remove('is-wrong');
      binElement.classList.add('is-correct');
      feedbackElement.textContent = 'Correct! +' + (tries === 1 ? 10 : 5);
      this.feedback.textContent = `Correct! ${item.label}. +${tries === 1 ? 10 : 5}`;
      window.setTimeout(() => { binElement.classList.remove('is-correct'); feedbackElement.textContent = ''; }, 850);
      this.updateScore();
      this.updateProgress();
      if (this.state.sortedItems.size === this.data.items.length) {
        this.continueButton.hidden = false;
        this.instruction.textContent = 'All 8 sorted! Great job.';
        this.feedback.textContent = 'All 8 sorted! Great job.';
      }
    } else {
      binElement.classList.remove('is-wrong');
      void binElement.offsetWidth;
      binElement.classList.add('is-wrong');
      feedbackElement.textContent = 'Not this bin';
      this.feedback.textContent = `Not this bin. Hint: ${item.hint}`;
      window.setTimeout(() => { binElement.classList.remove('is-wrong'); feedbackElement.textContent = ''; }, 700);
      const active = this.activeDrag;
      if (active) {
        active.button.classList.remove('is-dragging');
        active.button.style.cssText = '';
        active.button.removeAttribute('aria-grabbed');
        if (active.placeholder?.isConnected) active.placeholder.replaceWith(active.button);
        this.activeDrag = null;
      }
      window.setTimeout(() => { if (this.feedback.textContent.includes(item.hint)) this.feedback.textContent = ''; }, 2000);
    }
    this.selectedItemId = null;
    this.tray.querySelectorAll('.waste-item').forEach((node) => node.classList.remove('is-selected'));
  }

  sortSelected(binIndex) {
    if (!this.selectedItemId) { this.feedback.textContent = 'Select a waste item first using Tab and Enter.'; return; }
    const item = this.data.items.find((candidate) => candidate.id === this.selectedItemId);
    if (!item || this.state.sortedItems.has(item.id)) return;
    const button = this.tray.querySelector(`[data-item-id="${item.id}"]`);
    this.attemptSort(item, this.data.bins[binIndex], button);
  }

  updateScore() {
    const previous = Number(this.scoreOutput.textContent) || 0;
    animateNumber(this.scoreOutput, previous, this.state.gameScore, 320);
  }
  updateProgress() {
    const count = this.state.sortedItems.size;
    this.progress.value = count;
    this.countOutput.textContent = `${count} of ${this.data.items.length} sorted`;
  }
}
