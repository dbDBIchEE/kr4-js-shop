// Импорты
import { initMenu } from './menu.js';
import { initModals } from './modal.js';
import { initForms } from './forms.js';
import { initCatalog } from './catalog.js';
import { products } from './data.js';
import { updateCartCount, initCartPage } from './cart.js';

initMenu();
initModals();
initForms();
initCatalog();
updateCartCount();
initCartPage();

const toTopButton = document.getElementById('to-top');
if (toTopButton) {
  toTopButton.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

document.addEventListener('click', (event) => {
  // Ищем ТОЛЬКО кнопки, которые открывают модалку
  const button = event.target.closest('[data-modal-open].product-card__button');
  if (!button) return;

  const productInput = document.getElementById('selected-product');
  const priceInput = document.getElementById('selected-price');

  if (productInput) productInput.value = button.dataset.product;
  if (priceInput) priceInput.value = button.dataset.price;
});

const statCount = document.getElementById('stat-count');
const statAverage = document.getElementById('stat-average');
const statTotal = document.getElementById('stat-total');

if (statCount && statAverage && statTotal) {
  statCount.textContent = products.length;

  const total = products.reduce((sum, p) => sum + p.price, 0);
  statAverage.textContent = Math.round(total / products.length);
  statTotal.textContent = total;
}



