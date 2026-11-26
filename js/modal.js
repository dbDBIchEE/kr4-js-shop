let lastFocusedElement = null;

function getFocusable(modal) {
  return [...modal.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])')]
    .filter(el => el.offsetParent !== null);
}

function openModal(modal) {
  lastFocusedElement = document.activeElement;
  modal.hidden = false;
  document.body.classList.add('no-scroll');

  const firstFocusable = getFocusable(modal)[0];
  firstFocusable?.focus();

  const form = modal.querySelector('form');
  if (form) form.reset();

  const steps = modal.querySelectorAll('.wizard-step');
  if (steps.length > 0) {
    steps.forEach((s, i) => s.hidden = i !== 0);
    modal.querySelectorAll('.wizard-progress__step').forEach((s, i) => {
      s.classList.toggle('is-active', i === 0);
      s.classList.remove('is-completed');
    });
  }
}

function closeModal(modal) {
  modal.hidden = true;
  document.body.classList.remove('no-scroll');
  lastFocusedElement?.focus();
}

export function initModals() {
  const modals = document.querySelectorAll('[data-modal]');

  document.addEventListener('click', (event) => {
    const openButton = event.target.closest('[data-modal-open]');
    if (openButton) {
      const modal = document.getElementById(openButton.dataset.modalOpen);
      if (modal) openModal(modal);
    }

    const closeButton = event.target.closest('[data-modal-close]');
    if (closeButton) {
      closeModal(closeButton.closest('[data-modal]'));
    }

    if (event.target.matches('[data-modal]')) {
      closeModal(event.target);
    }
  });

  document.addEventListener('keydown', (event) => {
    const modal = document.querySelector('[data-modal]:not([hidden])');
    if (!modal) return;

    if (event.key === 'Escape') {
      closeModal(modal);
      return;
    }

    if (event.key === 'Tab') {
      const focusable = [...getFocusable(modal)];
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  });
}