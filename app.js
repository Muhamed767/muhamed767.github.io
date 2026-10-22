/*
 * CustomCars B: catalog, accessible model dialog, messenger drafts.
 * For GitHub Pages, API_BASE is set by scripts/build-github.mjs.
 * The bundled catalog is also usable without a server.
 */
const API_BASE = 'https://customcars-b.bziksievmuhamed.chatgpt.site';
let models = [];
let settings = {};
let brand = 'all';
let activeCar = null;
let imageIndex = 0;
let lastTrigger = null;
const grid = document.querySelector('#grid');
const dialog = document.querySelector('#detail');
const content = document.querySelector('#detail-body');
const search = document.querySelector('#search');
const money = value => new Intl.NumberFormat('ru-RU').format(value) + ' ₽';
const escapeText = value => String(value ?? '').replace(/[&<>"']/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
})[char]);

function priceText(item) {
  if (item.priceMode === 'negotiable') return 'По договорённости';
  return (item.priceMode === 'from' ? 'от ' : '') + money(item.price);
}

function contactLinks(message) {
  return {
    wa: 'https://wa.me/' + settings.whatsapp + '?text=' + encodeURIComponent(message),
    tg: 'https://t.me/' + settings.telegram + '?text=' + encodeURIComponent(message)
  };
}

function genericMessage() {
  return `Здравствуйте, ${settings.name}! Интересует русификация автомобиля.\nМодель: уточню\nГод: уточню\nКогда: обсудим\nПодскажите, какие данные нужны для проверки совместимости.`;
}

function normalized(value) {
  return String(value).toLowerCase().replace(/ё/g, 'е').replace(/[‑–—]/g, '-').replace(/[^а-яa-z0-9]/g, '');
}

function imageURL(path, remote = false) {
  if (!path) return './assets/cs75-4.webp';
  const base = remote ? (API_BASE || location.origin) + '/' : document.baseURI;
  return new URL(remote ? path : path.replace(/^\//, ''), base).href;
}

function applyCatalog(data, remote = false) {
  if (!data?.settings || !Array.isArray(data.cars)) throw Error('Некорректный каталог');
  settings = data.settings;
  models = data.cars.filter(car => car.visible !== false && car.images?.length).map(car => ({
    ...car,
    images: car.images.map(path => imageURL(path, remote))
  }));
  const brands = [...new Set(models.map(car => car.brand))];
  if (brand !== 'all' && !brands.includes(brand)) brand = 'all';
  document.querySelector('.filters').innerHTML = ['all', ...brands].map(item => `
    <button type="button" class="filter" data-brand="${escapeText(item)}" aria-pressed="${item === brand}">
      ${item === 'all' ? 'Все модели' : escapeText(item)}
    </button>
  `).join('');
  document.querySelectorAll('[data-region]').forEach(el => el.textContent = settings.region || 'Работаем по КБР');
  document.querySelectorAll('[data-service-format]').forEach(el => el.textContent = settings.serviceFormat || 'Место и время — по договорённости.');
  if (settings.serviceDescription) document.querySelector('[data-service-description]').textContent = settings.serviceDescription;
  // Preserve the editorial layout unless the owner intentionally changes the headline.
  if (settings.headline && settings.headline !== 'Ваш автомобиль. Теперь на русском.' && settings.headline !== 'ВАШ АВТО. ВАШ ЯЗЫК. ВАШ КОМФОРТ.' && settings.headline !== 'Русификация автомобилей в КБР.') {
    document.querySelector('#hero-title').textContent = settings.headline;
  }
  const links = contactLinks(genericMessage());
  document.querySelectorAll('[data-contact]').forEach(link => {
    link.href = links[link.dataset.contact];
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
  });
  document.querySelector('#contact-telegram').textContent = '@' + settings.telegram;
  document.querySelector('#contact-whatsapp').textContent = '+' + settings.whatsapp;
  document.querySelector('#phone-link').href = 'tel:+' + settings.whatsapp;
  document.querySelector('#phone-link strong').textContent = 'Позвонить: ' + settings.name;
  const featured = models.find(car => car.id === 'cs75-pro');
  const offer = document.querySelector('.hero-offer');
  if (offer) {
    offer.hidden = !featured;
    if (featured) document.querySelector('.hero-offer strong').textContent = priceText(featured).toUpperCase();
  }
  render();
}

function render() {
  const query = normalized(search.value);
  const cars = models.filter(car => (brand === 'all' || car.brand === brand) &&
    normalized(`${car.brand} ${car.name} ${car.year} ${car.version}`).includes(query));
  grid.innerHTML = cars.map(car => `
    <button type="button" class="car" data-id="${escapeText(car.id)}" aria-label="${escapeText(car.brand + ' ' + car.name + ' ' + car.year)} — цена и подробности">
      <div class="car-photo ${car.contain ? 'contain' : ''}">
        <img src="${escapeText(car.images[0])}" alt="${escapeText(car.brand + ' ' + car.name + ', ' + car.version)}" width="600" height="390" loading="lazy">
        <span class="brand-tag">${escapeText(car.brand.toUpperCase())}</span>
        ${car.images.length > 1 ? `<span class="photo-count">${car.images.length} фото</span>` : ''}
      </div>
      <div class="car-body">
        <div class="car-top"><h3>${escapeText(car.name)}</h3><span class="year">${escapeText(car.year)}</span></div>
        <p class="car-desc">${escapeText(car.description || car.version)}</p>
        <div class="car-bottom"><strong>${escapeText(priceText(car))}</strong><span>Подробнее ↗</span></div>
      </div>
    </button>
  `).join('');
  document.querySelector('#empty').hidden = cars.length > 0;
  document.querySelector('#count').textContent = `Показано ${cars.length} из ${models.length} моделей`;
}

function openCar(id, trigger) {
  const car = models.find(item => item.id === id);
  if (!car) return;
  activeCar = car;
  imageIndex = 0;
  lastTrigger = trigger || document.activeElement;
  const fields = [
    ['Год / модельный год', car.year], ['Версия', car.version], ['Рестайлинг', car.rest],
    ['Кузов', car.body], ['Силовая установка', car.engine], ['Трансмиссия', car.gear], ['Привод', car.drive]
  ].filter(([, value]) => value);
  content.innerHTML = `
    <div class="modal-photo">
      <img id="gallery-image" src="${escapeText(car.images[0])}" alt="${escapeText(car.brand + ' ' + car.name)}">
      <span class="brand-tag">${escapeText(car.brand.toUpperCase())}</span>
      ${car.images.length > 1 ? `
        <button class="gallery-nav prev" type="button" data-gallery="prev" aria-label="Предыдущее фото">‹</button>
        <button class="gallery-nav next" type="button" data-gallery="next" aria-label="Следующее фото">›</button>
      ` : ''}
    </div>
    ${car.images.length > 1 ? `<div class="gallery-thumbs" aria-label="Фотографии модели">
      ${car.images.map((image, index) => `
        <button type="button" data-image="${index}" aria-label="Показать фото ${index + 1}" aria-pressed="${index === 0}">
          <img src="${escapeText(image)}" alt="">
        </button>
      `).join('')}
    </div>` : ''}
    <div class="modal-content">
      <div>
        <h2 id="model-title">${escapeText(car.brand + ' ' + car.name)}</h2>
        <p class="modal-meta">${escapeText(car.version)}</p>
        <p class="model-description">${escapeText(car.description || 'Возможность и стоимость русификации уточняем по версии системы.')}</p>
        <dl class="specs">${fields.map(([label, value]) => `<div><dt>${label}</dt><dd>${escapeText(value)}</dd></div>`).join('')}</dl>
        <p class="model-note">${escapeText(car.note || 'Характеристики зависят от рынка и комплектации.')} Перед работой проверяем версию мультимедиа.</p>
        ${car.id === 'q05-old' ? '<p class="model-note">Фон фотографии обработан с помощью ИИ.</p>' : ''}
        <div class="source-links">
          ${car.source ? `<a href="${escapeText(car.source)}" target="_blank" rel="noopener noreferrer">Данные модели</a>` : ''}
          ${car.photoSource ? `<a href="${escapeText(car.photoSource)}" target="_blank" rel="noopener noreferrer">Источник фотографии</a>` : ''}
        </div>
      </div>
      <aside class="price-panel">
        <small>Стоимость русификации</small>
        <strong>${escapeText(priceText(car))}</strong>
        <p>Окончательную цену и доступные функции согласуем перед работой.</p>
        <form id="request-form">
          <label class="request-field">Что нужно сделать
            <select name="scope"><option>Мультимедиа</option><option>Мультимедиа и приборная панель</option><option>Нужна консультация</option></select>
          </label>
          <label class="request-field">Населённый пункт<input name="city" maxlength="100" placeholder="Город или село в КБР" autocomplete="address-level2"></label>
          <label class="request-field">Год вашей машины<input name="year" inputmode="numeric" maxlength="30" value="${/^\d{4}$/.test(car.year) ? car.year : ''}" placeholder="Например, 2025"></label>
          <label class="request-field">Когда удобно<input name="date" type="date"></label>
          <label class="request-field">Удобное время<input name="time" type="time"></label>
          <label class="request-field">Комплектация / версия системы<input name="trim" maxlength="200" placeholder="Если знаете"></label>
          <label class="request-field">Комментарий<textarea name="comment" rows="2" maxlength="700" placeholder="Что хотите уточнить"></textarea></label>
        </form>
        <a id="request-wa" class="btn primary" target="_blank" rel="noopener noreferrer">Написать в WhatsApp ↗</a>
        <a id="request-tg" class="btn" target="_blank" rel="noopener noreferrer">Написать в Telegram ↗</a>
        <button id="copy-message" class="copy-message" type="button">Скопировать текст заявки</button>
        <p class="request-hint" id="request-status" role="status">Откроется черновик сообщения. Если приложение не вставило текст, скопируйте его кнопкой выше. Дата подтверждается в переписке.</p>
      </aside>
    </div>
  `;
  const form = document.querySelector('#request-form');
  const now = new Date();
  form.elements.date.min = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  form.addEventListener('input', updateRequest);
  form.addEventListener('submit', event => event.preventDefault());
  document.querySelector('#copy-message').addEventListener('click', copyMessage);
  for (const id of ['request-wa', 'request-tg']) {
    document.querySelector('#' + id).addEventListener('click', event => {
      if (!form.reportValidity()) event.preventDefault();
    });
  }
  updateRequest();
  if (!dialog.open) dialog.showModal();
  dialog.scrollTop = 0;
  setHash('#model=' + car.id);
  document.querySelector('.modal-close').focus();
}

function requestMessage() {
  const f = document.querySelector('#request-form');
  const v = name => f.elements[name].value.trim();
  const date = v('date') ? v('date').split('-').reverse().join('.') : 'Обсудим';
  return `Здравствуйте, ${settings.name}!\nИнтересует русификация автомобиля.\n\nМодель: ${activeCar.brand} ${activeCar.name}\nГод: ${v('year') || 'Уточню'}\nВерсия: ${activeCar.version || 'Уточню'}\nОбъём работ: ${v('scope')}\nНаселённый пункт: ${v('city') || 'Обсудим'}\nЦена русификации: ${priceText(activeCar)}\nКогда удобно: ${date}${v('time') ? ' в ' + v('time') : ''}${v('trim') ? '\nКомплектация / мультимедиа: ' + v('trim') : ''}${v('comment') ? '\nКомментарий: ' + v('comment') : ''}\n\n${settings.region || 'Работаем по КБР'}. Прошу подтвердить совместимость, итоговую цену, место и дату.`;
}

function updateRequest() {
  const links = contactLinks(requestMessage());
  document.querySelector('#request-wa').href = links.wa;
  document.querySelector('#request-tg').href = links.tg;
}

async function copyMessage() {
  const status = document.querySelector('#request-status');
  try {
    await navigator.clipboard.writeText(requestMessage());
    status.textContent = 'Текст скопирован. Вставьте его в переписку с Бесланом.';
  } catch {
    let textarea = content.querySelector('.copy-fallback');
    if (!textarea) {
      textarea = document.createElement('textarea');
      textarea.className = 'copy-fallback';
      textarea.setAttribute('aria-label', 'Текст заявки для копирования');
      content.querySelector('.price-panel').append(textarea);
    }
    textarea.value = requestMessage();
    textarea.focus();
    textarea.select();
    status.textContent = 'Скопируйте выделенный текст вручную.';
  }
}

function gallery(index) {
  imageIndex = (index + activeCar.images.length) % activeCar.images.length;
  const photo = document.querySelector('#gallery-image');
  photo.style.visibility = '';
  photo.parentElement.querySelector('.image-error')?.remove();
  photo.src = activeCar.images[imageIndex];
  document.querySelectorAll('[data-image]').forEach(button => button.setAttribute('aria-pressed', String(Number(button.dataset.image) === imageIndex)));
}

function setHash(hash) {
  try { history.replaceState(null, '', hash); } catch { /* Local file restrictions do not block the dialog. */ }
}

function checkHash() {
  if (location.hash.startsWith('#model=')) openCar(location.hash.slice(7));
}

grid.addEventListener('click', event => {
  const button = event.target.closest('[data-id]');
  if (button) openCar(button.dataset.id, button);
});
document.querySelector('[data-open]').addEventListener('click', event => {
  const id = event.currentTarget.dataset.open;
  if (models.some(car => car.id === id)) openCar(id, event.currentTarget);
  else document.querySelector('#catalog').scrollIntoView({ behavior: 'smooth' });
});
document.querySelector('.filters').addEventListener('click', event => {
  const button = event.target.closest('[data-brand]');
  if (!button) return;
  brand = button.dataset.brand;
  document.querySelectorAll('.filter').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
  render();
});
search.addEventListener('input', render);
document.querySelector('#reset-search').addEventListener('click', () => {
  search.value = '';
  brand = 'all';
  document.querySelectorAll('.filter').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.brand === 'all')));
  render();
  search.focus();
});
content.addEventListener('click', event => {
  const thumbnail = event.target.closest('[data-image]');
  const arrow = event.target.closest('[data-gallery]');
  if (thumbnail) gallery(Number(thumbnail.dataset.image));
  if (arrow) gallery(imageIndex + (arrow.dataset.gallery === 'next' ? 1 : -1));
});
document.querySelector('.modal-close').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => {
  if (event.target !== dialog) return;
  const bounds = dialog.getBoundingClientRect();
  if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
});
dialog.addEventListener('close', () => {
  if (location.hash.startsWith('#model=')) setHash('#catalog');
  if (lastTrigger?.isConnected) lastTrigger.focus();
});
window.addEventListener('hashchange', checkHash);
document.querySelector('#copyright-year').textContent = new Date().getFullYear();
// Never show a broken-image icon. Preserve a readable model name instead.
document.addEventListener('error', event => {
  if (event.target.tagName !== 'IMG') return;
  event.target.style.visibility = 'hidden';
  const parent = event.target.parentElement;
  if (!parent.querySelector('.image-error')) {
    const note = document.createElement('span');
    note.className = 'image-error';
    note.textContent = 'Фотография временно недоступна';
    parent.append(note);
  }
}, true);

async function load() {
  applyCatalog(window.CATALOG);
  if (location.protocol === 'file:') { checkHash(); return; }
  document.querySelector('#sync-status').textContent = 'Проверяем актуальные данные…';
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(API_BASE + '/api/catalog', {
      cache: 'no-store', credentials: 'omit', signal: controller.signal
    });
    if (!response.ok) throw Error('Каталог недоступен');
    const data = await response.json();
    applyCatalog(data, true);
    document.querySelector('#sync-status').textContent = '';
    // Open a deep link only after the freshest catalog has arrived.
    if (!dialog.open) checkHash();
  } catch {
    document.querySelector('#sync-status').textContent = 'Показана резервная версия каталога. Наличие услуги и цену уточните в переписке.';
    if (!dialog.open) checkHash();
  } finally {
    clearTimeout(timer);
  }
}
load();
