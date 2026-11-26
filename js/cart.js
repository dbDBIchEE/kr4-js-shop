import { products } from './data.js';

function getCartItems() {
  try {
    const data = JSON.parse(localStorage.getItem('cart'));
    return Array.isArray(data) ? data : [];
  } catch (e) {
    return [];
  }
}
let cart = getCartItems();
let discount = 0;

// DOM элементы
const drawer    = document.getElementById('cart-drawer');
const overlay   = document.getElementById('cart-overlay');
const closeBtn  = document.getElementById('cart-close');
const toggleBtn = document.getElementById('cart-toggle');
const container = document.getElementById('cart-items');
const summary   = document.getElementById('cart-summary');
const emptyMsg  = document.getElementById('cart-empty-message');
const totalEl   = document.getElementById('cart-total');


export function addToCart(productId) {
  const existing = cart.find(item => item.id === productId);
  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({ id: productId, quantity: 1 });
  }
  saveCart();
  updateCartUI();
  
  // Автоматически открываем корзину при добавлении
  if (drawer) drawer.hidden = false;
}

function saveCart() {
  localStorage.setItem('cart', JSON.stringify(cart));
}

export const calculateCartTotal = (cart) => cart.reduce((sum, item) => {
  const p = products.find(x => x.id === item.id);
  return p ? sum + p.price * item.quantity : sum;
}, 0);

export function clearCart() {
  cart = [];
  saveCart();
  updateCartUI();
}

// Обновление цифры в хедере
export function updateCartCount() {
  const countElements = document.querySelectorAll('#cart-count');
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  countElements.forEach(el => el.textContent = totalItems);
}

// Отрисовка содержимого корзины
function renderCart() {
  if (!container) return;

  container.replaceChildren();

  if (cart.length === 0) {
    if (emptyMsg) emptyMsg.hidden = false;
    if (summary) summary.hidden = true;
    return;
  }

  if (emptyMsg) emptyMsg.hidden = true;
  if (summary) summary.hidden = false;

  cart.forEach(cartItem => {
    const product = products.find(p => p.id === cartItem.id);
    if (!product) return;

    const totalPrice = calculateCartTotal(cart);

    const itemDiv = document.createElement('div');
    itemDiv.className = 'cart-item';
    
    const info = document.createElement('div');
    info.className = 'cart-item__info';
    
    const title = document.createElement('h4');
    title.textContent = product.title;
    
    const price = document.createElement('p');
    price.textContent = `${product.price} руб. x ${cartItem.quantity} шт.`;

    const removeBtn = document.createElement('button');
    removeBtn.className = 'cart-item__remove';
    removeBtn.textContent = '×';
    removeBtn.title = 'Удалить';
    removeBtn.addEventListener('click', () => {
      cart = cart.filter(item => item.id !== product.id);
      saveCart();
      updateCartUI();
    });

    info.append(title, price);
    itemDiv.append(info, removeBtn);
    container.append(itemDiv);
  });

  // Считаем итоговую сумму с учетом скидки
  const finalPrice = totalPrice - (totalPrice * discount);

  if (totalEl) {
    totalEl.textContent = finalPrice;
  }
}

// Общая функция обновления
function updateCartUI() {
  updateCartCount();
  renderCart();
}

// Инициализация (вызывается 1 раз в main.js)
export function initCartPage() {
  if (!toggleBtn || !drawer) return; // Защита, если корзины нет на странице

  // Открытие
  toggleBtn.addEventListener('click', () => {
    drawer.hidden = false;
    renderCart(); 
    // Переводим фокус на кнопку закрытия для доступности
    const closeBtn = document.getElementById('cart-close');
    if (closeBtn) closeBtn.focus();
  });

  // Закрытие
  const closeCart = () => drawer.hidden = true;
  closeBtn?.addEventListener('click', closeCart);
  overlay?.addEventListener('click', closeCart);
  
  // Закрытие на Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !drawer.hidden) closeCart();
  });

    // Кнопка "Оформить заказ" внутри корзины
    document.getElementById('checkout-btn')?.addEventListener('click', () => {
        drawer.hidden = true;

        const productInput = document.getElementById('selected-product');
        if (productInput) productInput.value = ''; 
    });

      // --- ЛОГИКА ПРОМОКОДА ---
  const applyPromoBtn = document.getElementById('apply-promo-btn');
  const promoInput = document.getElementById('promo-input');
  const promoMsg = document.getElementById('promo-message');

  if (applyPromoBtn) {
    applyPromoBtn.addEventListener('click', () => {
      const val = promoInput.value.trim().toUpperCase();
      
      if (val === 'SPORT10') {
        discount = 0.1; // 10% скидка
        promoMsg.textContent = 'Промокод применён! Скидка 10%';
        promoMsg.style.color = 'var(--color-success)';
        promoMsg.hidden = false;
      } else {
        discount = 0; // Сбрасываем скидку
        promoMsg.textContent = 'Неверный промокод';
        promoMsg.style.color = 'var(--color-danger)';
        promoMsg.hidden = false;
      }
      
      // Перерисовываем корзину с новой ценой
      renderCart();
    });
  }

  updateCartUI();
}



document.getElementById('apply-promo-btn')?.addEventListener('click', () => {
  const val = document.getElementById('promo-input').value.trim().toUpperCase();
  const msg = document.getElementById('promo-message');
  if (val === 'SPORT10') {
    discount = 0.1;
    msg.textContent = 'Промокод применён! Скидка 10%';
    msg.style.color = 'var(--color-success)';
    msg.hidden = false;
  } else {
    discount = 0;
    msg.textContent = 'Неверный промокод';
    msg.style.color = 'var(--color-danger)';
    msg.hidden = false;
  }
  renderCart();
});