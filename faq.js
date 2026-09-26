(() => {
  const tabs = [...document.querySelectorAll('[data-faq-tab]')];
  const panels = [...document.querySelectorAll('[data-faq-panel]')];

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const selected = tab.dataset.faqTab;
      tabs.forEach((item) => {
        const active = item === tab;
        item.classList.toggle('is-active', active);
        item.setAttribute('aria-selected', String(active));
      });
      panels.forEach((panel) => {
        panel.hidden = panel.dataset.faqPanel !== selected;
        panel.querySelectorAll('details[open]').forEach((item) => item.removeAttribute('open'));
      });
    });
  });

  document.querySelectorAll('.faq-list').forEach((list) => {
    list.addEventListener('toggle', (event) => {
      const current = event.target;
      if (!(current instanceof HTMLDetailsElement) || !current.open) return;
      list.querySelectorAll('details[open]').forEach((item) => {
        if (item !== current) item.removeAttribute('open');
      });
    }, true);
  });

  const entities = [...document.querySelectorAll('.faq-item')].map((item) => ({
    '@type': 'Question',
    name: item.querySelector('summary span')?.textContent?.trim() || '',
    acceptedAnswer: {
      '@type': 'Answer',
      text: item.querySelector('.faq-answer')?.textContent?.trim() || ''
    }
  })).filter((item) => item.name && item.acceptedAnswer.text);

  const structuredData = document.createElement('script');
  structuredData.type = 'application/ld+json';
  structuredData.textContent = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: entities
  });
  document.head.appendChild(structuredData);
})();
