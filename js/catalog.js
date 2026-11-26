import { products } from './data.js';
import { addToCart } from './cart.js';

// Состояние интерфейса
const state = {
  query: '',
  category: 'all',
  sort: 'default'
};

// DOM-элементы
const container = document.querySelector('[data-products-container]');
const searchInput = document.querySelector('[data-search]');
const categorySelect = document.querySelector('[data-filter-category]');
const sortSelect = document.querySelector('[data-sort]');
const messageElement = document.getElementById('catalog-message');

// Функция создания одной карточки (возвращает DOM-элемент)
function createProductCard(product) {
  const article = document.createElement('article');
  const cartBtn = document.createElement('button');
  const btn = document.createElement('button');

  if (product.discountPercent > 0) {
    article.classList.add('product-card--discount');
  }

  // Картинка
  const img = document.createElement('img');
  img.src = product.image;
  img.alt = product.title;
  img.width = 200;
  img.loading = 'lazy';
  article.append(img);

  // Бейдж скидки
  if (product.discountPercent > 0) {
    const badge = document.createElement('span');
    badge.classList.add('product-card__badge');
    badge.textContent = 'Скидка';
    article.append(badge);
  }

  // Заголовок
  const title = document.createElement('h3');
  title.classList.add('product-card__title');
  title.textContent = product.title;
  article.append(title);

  // Описание
  const desc = document.createElement('p');
  desc.classList.add('product-card__description');
  desc.textContent = product.description;
  article.append(desc);

  // Цена
  const price = document.createElement('p');
  price.classList.add('product-card__price');
  
  if (product.discountPercent > 0 && product.oldPrice) {
    const s = document.createElement('s');
    s.textContent = `${product.oldPrice} руб. `;
    price.append(s);
  }
  price.append(`${product.price} руб.`);
  article.append(price);

  // Кнопка
  
  btn.classList.add('button', 'button--primary', 'product-card__button');
  btn.type = 'button';
  btn.textContent = 'Заказать';
  btn.dataset.product = product.title;
  btn.dataset.price = product.price;
  btn.dataset.modalOpen = 'callback-modal'; // Для открытия модалки

  cartBtn.classList.add('button', 'button--secondary', 'product-card__button');
  cartBtn.type = 'button';
  cartBtn.textContent = 'В корзину';
  cartBtn.addEventListener('click', () => addToCart(product.id));
  article.classList.add('product-card');

  const actions = document.createElement('div');
  actions.classList.add('product-card__actions');
  actions.append(btn, cartBtn);
  article.append(actions);

  if (!product.isAvailable) {
    btn.disabled = true;
    cartBtn.disabled = true;
    btn.textContent = 'Нет в наличии';
    cartBtn.textContent = 'Нет в наличии';
    // Можно добавить класс для стилизации статуса
    article.classList.add('product-card--out-of-stock');
  }

  return article;
}

// 1. Функция поиска по названию и описанию
function searchProducts(items, query) {
  const normalizedQuery = query.trim().toLowerCase();
  if (normalizedQuery === '') return items;
  
  return items.filter(p => 
    p.title.toLowerCase().includes(normalizedQuery) || 
    p.description.toLowerCase().includes(normalizedQuery)
  );
}

// 2. Функция фильтрации по категории
function filterProducts(items, category) {
  if (category === 'all') return items;
  return items.filter(p => p.category === category);
}

// 3. Функция сортировки
function sortProducts(items, sortType) {
  const copy = [...items]; // Обязательно копируем!
  if (sortType === 'price-asc') {
    return copy.sort((a, b) => a.price - b.price);
  } else if (sortType === 'price-desc') {
    return copy.sort((a, b) => b.price - a.price);
  }
  return copy; // 'default' - возвращаем как есть
}

// Главная функция рендера
function renderCatalog() {
  if (!container) return;

  // ШАГ А: Берем исходный массив
  let filtered = products;

  // ШАГ Б: Применяем поиск
  filtered = searchProducts(filtered, state.query);

  // ШАГ В: Применяем фильтр по категории
  filtered = filterProducts(filtered, state.category);

  // ШАГ Г: Применяем сортировку
  filtered = sortProducts(filtered, state.sort);

  // ШАГ Д: Очистка контейнера и вывод
  container.replaceChildren(); 

  if (filtered.length === 0) {
    container.replaceChildren(); // Очистили
    const emptyDiv = document.createElement('div');
    emptyDiv.className = 'catalog-empty';
    emptyDiv.innerHTML = '<p>Товары не найдены.</p><button class="button button--secondary" id="reset-filters">Сбросить фильтры</button>';
    container.append(emptyDiv);

    document.getElementById('reset-filters').addEventListener('click', () => {
      state.query = ''; state.category = 'all'; state.sort = 'default';
      searchInput.value = ''; categorySelect.value = 'all'; sortSelect.value = 'default';
      renderCatalog();
    });
    return; // Выходим, карточек нет
  } else {
    if (messageElement) messageElement.textContent = `Найдено товаров: ${filtered.length}`;
    
    filtered.forEach(product => {
      const card = createProductCard(product);
      container.append(card);
    });
  }
}

// Инициализация событий
export function initCatalog() {
  if (!container) return; // Если мы не на странице каталога — выходим

  // Событие поиска
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      state.query = e.target.value.trim();
      renderCatalog();
    });
  }

  // Событие фильтра
  if (categorySelect) {
    categorySelect.addEventListener('change', (e) => {
      state.category = e.target.value;
      renderCatalog();
    });
  }

  // Событие сортировки
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      state.sort = e.target.value;
      renderCatalog();
    });
  }

  // Первый рендер при загрузке
  renderCatalog();
}