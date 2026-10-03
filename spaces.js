(() => {
  const SUPABASE_URL = 'https://lpnfergzkrsjiskxdnpy.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_P_BB4_B7-RBmKed_7qrRpg_ghqNH5bR';
  const carousel = document.querySelector('#spaces-carousel');
  const count = document.querySelector('#registered-count');
  const previous = document.querySelector('#spaces-prev');
  const next = document.querySelector('#spaces-next');
  if (!carousel || !count || !previous || !next) return;

  const headers = { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` };
  const escapeHtml = (value = '') => String(value).replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character]);
  const normalize = (value = '') => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
  const area = (space) => space.neighborhood && normalize(space.neighborhood) !== normalize(space.city) ? `${space.neighborhood}, ${space.city}` : space.city;
  const money = (cents) => `$${(cents / 100).toLocaleString('es-MX', { maximumFractionDigits: 2 })}`;
  const price = (space) => {
    const values = space.pricing_mode === 'capacity' ? (space.pricing_tiers || []).map((tier) => tier.price_cents) : [space.base_price_cents];
    const valid = values.filter((value) => Number.isFinite(value) && value >= 0);
    if (!valid.length) return 'Precio por confirmar';
    const minimum = Math.min(...valid);
    const maximum = Math.max(...valid);
    return minimum === maximum ? `${money(minimum)} MXN` : `${money(minimum)} a ${money(maximum)} MXN`;
  };
  const signedPhoto = async (path) => {
    if (!path) return '';
    const safePath = path.split('/').map(encodeURIComponent).join('/');
    const response = await fetch(`${SUPABASE_URL}/storage/v1/object/sign/zede-space-photos/${safePath}`, {
      method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify({ expiresIn: 3600 })
    });
    if (!response.ok) return '';
    const data = await response.json();
    const signed = data.signedURL || data.signedUrl || '';
    return signed.startsWith('http') ? signed : `${SUPABASE_URL}/storage/v1${signed}`;
  };
  const card = (space, photo) => `<article class="space-card">
    <div class="space-card-image"${photo ? ` style="background-image:url('${escapeHtml(photo)}')"` : ''}>
      <span class="space-badge">REGISTRADO EN ZEDE</span><span class="space-type">${escapeHtml(space.space_type)}</span>
    </div>
    <div class="space-card-body">
      <h3>${escapeHtml(space.name)}</h3>
      <p class="space-location">${escapeHtml(area(space))}, ${escapeHtml(space.state)}</p>
      <div class="space-facts"><span class="space-fact">Hasta ${escapeHtml(space.capacity)} personas</span>${space.event_hours ? `<span class="space-fact">${escapeHtml(space.event_hours)} h por evento</span>` : ''}</div>
      <p class="space-price">${escapeHtml(price(space))}</p>
    </div>
  </article>`;

  async function loadSpaces() {
    try {
      const fields = 'id,name,space_type,neighborhood,city,state,capacity,event_hours,pricing_mode,pricing_tiers,base_price_cents,photo_paths';
      const response = await fetch(`${SUPABASE_URL}/rest/v1/public_spaces?select=${fields}&order=name.asc`, { headers });
      if (!response.ok) throw new Error(`spaces:${response.status}`);
      const spaces = await response.json();
      if (!spaces.length) throw new Error('empty');
      const photos = await Promise.all(spaces.map((space) => signedPhoto(space.photo_paths?.[0])));
      carousel.innerHTML = spaces.map((space, index) => card(space, photos[index])).join('');
      count.textContent = `${spaces.length} ${spaces.length === 1 ? 'espacio registrado' : 'espacios registrados'} y preparando su lanzamiento`;
    } catch (error) {
      console.error('ZEDE spaces gallery could not load', error);
      carousel.innerHTML = '<div class="card"><h3>Muy pronto conocerás nuestros espacios</h3><p>Estamos preparando la galería de palapas y salones registrados en ZEDE.</p></div>';
      count.textContent = 'Galería en preparación';
    }
  }

  const move = (direction) => carousel.scrollBy({ left: direction * Math.min(carousel.clientWidth * .88, 370), behavior: 'smooth' });
  previous.addEventListener('click', () => move(-1));
  next.addEventListener('click', () => move(1));
  carousel.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') move(-1);
    if (event.key === 'ArrowRight') move(1);
  });
  loadSpaces();
})();
