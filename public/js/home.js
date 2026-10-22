(() => {
  const tabs = [...document.querySelectorAll('[data-application-tab]')];
  const panels = [...document.querySelectorAll('[data-application-panel]')];
  const modal = document.querySelector('#application-modal');
  const modalFrame = document.querySelector('#application-modal-frame');
  const modalTitle = document.querySelector('#application-modal-title');
  const modalCloseButtons = [...document.querySelectorAll('[data-modal-close]')];
  const applicationLinks = [...document.querySelectorAll('.application-copy > a')];
  let lastFocusedElement = null;
  let modalCloseTimer = null;

  function activateTab(tab, moveFocus = false) {
    const target = tab.dataset.applicationTab;

    tabs.forEach((item) => {
      const active = item === tab;
      item.classList.toggle('is-active', active);
      item.setAttribute('aria-selected', String(active));
      item.tabIndex = active ? 0 : -1;
    });

    panels.forEach((panel) => {
      const active = panel.dataset.applicationPanel === target;
      panel.classList.toggle('is-active', active);
      panel.hidden = !active;
    });

    if (moveFocus) tab.focus();
  }

  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => activateTab(tab));
    tab.addEventListener('keydown', (event) => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();

      let nextIndex = index;
      if (event.key === 'ArrowRight') nextIndex = (index + 1) % tabs.length;
      if (event.key === 'ArrowLeft') nextIndex = (index - 1 + tabs.length) % tabs.length;
      if (event.key === 'Home') nextIndex = 0;
      if (event.key === 'End') nextIndex = tabs.length - 1;
      activateTab(tabs[nextIndex], true);
    });
  });

  function closeApplicationModal() {
    if (!modal || modal.hidden || modal.classList.contains('is-closing')) return;
    modal.classList.remove('is-open');
    modal.classList.add('is-closing');

    modalCloseTimer = window.setTimeout(() => {
      modal.hidden = true;
      modal.classList.remove('is-closing');
      modal.classList.remove('is-frame-ready');
      modalFrame.setAttribute('aria-busy', 'true');
      modalFrame.src = 'about:blank';
      document.body.classList.remove('modal-is-open');
      lastFocusedElement?.focus();
    }, 260);
  }

  function openApplicationModal(link) {
    if (!modal || !modalFrame) return;
    window.clearTimeout(modalCloseTimer);
    lastFocusedElement = document.activeElement;
    modalTitle.textContent = link.closest('.application-panel')?.querySelector('h3')?.textContent || 'Passo a passo';
    modal.classList.remove('is-frame-ready');
    modalFrame.setAttribute('aria-busy', 'true');
    modalFrame.src = link.href;
    modal.hidden = false;
    modal.classList.remove('is-closing');
    document.body.classList.add('modal-is-open');
    window.requestAnimationFrame(() => {
      modal.classList.add('is-open');
      modal.querySelector('.application-modal-close')?.focus();
    });
  }

  applicationLinks.forEach((link) => {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      openApplicationModal(link);
    });
  });

  modalCloseButtons.forEach((button) => button.addEventListener('click', closeApplicationModal));
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeApplicationModal();
  });

  window.addEventListener('message', (event) => {
    if (event.origin !== window.location.origin) return;
    if (event.source !== modalFrame?.contentWindow) return;
    if (event.data?.type === 'close-application-modal') closeApplicationModal();
  });

  modalFrame?.addEventListener('load', () => {
    let applicationLoaded = false;
    try {
      const embeddedDocument = modalFrame.contentDocument;
      if (!embeddedDocument || embeddedDocument.location?.href === 'about:blank') return;

      embeddedDocument.body.classList.add('modal-embedded');

      const backLink = embeddedDocument.querySelector('.voltar-menu');
      backLink?.addEventListener('click', (event) => {
        event.preventDefault();
        closeApplicationModal();
      });

      embeddedDocument.querySelectorAll('.passo').forEach((step) => {
        const image = step.querySelector('.cena-imagem');
        const heading = step.querySelector('.passo-cabecalho');
        if (image && heading) image.insertAdjacentElement('afterend', heading);
      });
      applicationLoaded = true;
    } catch (error) {
      // As páginas são locais; se o navegador limitar o acesso, a aplicação continua funcionando no iframe.
      applicationLoaded = true;
    }

    if (applicationLoaded) {
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          modalFrame.setAttribute('aria-busy', 'false');
          modal.classList.add('is-frame-ready');
        });
      });
    }
  });
})();
