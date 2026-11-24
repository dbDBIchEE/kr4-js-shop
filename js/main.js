import { initMenu } from './menu.js';
import { initModals } from './modal.js';
import { initForms } from './forms.js';
import { products } from './data.js';



const toTopButton = document.getElementById('to-top');
if (toTopButton) {
  toTopButton.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

document.addEventListener('click', (event) => {
  const button = event.target.closest('.product-card__button');
  if (button) {
    const productInput = document.getElementById('selected-product');
    if (productInput) {
      productInput.value = button.dataset.product;
    }
  }
});

// ==========================================
// ЛОГИКА МНОГОШАГОВОЙ МОДАЛКИ
// ==========================================

const multiStepForm = document.getElementById('multi-step-form');
const steps = document.querySelectorAll('.wizard-step');
const indicators = document.querySelectorAll('.wizard-progress__step');
const selectedPriceInput = document.getElementById('selected-price');

function goToStep(stepNumber) {
  steps.forEach(step => step.hidden = true);
  document.querySelector(`.wizard-step[data-step="${stepNumber}"]`).hidden = false;

  indicators.forEach(ind => {
    const indNum = parseInt(ind.dataset.stepIndicator);
    ind.classList.remove('is-active', 'is-completed');
    if (indNum === stepNumber) {
      ind.classList.add('is-active');
    } else if (indNum < stepNumber) {
      ind.classList.add('is-completed');
    }
  });
}

function validateCurrentStep(currentStep) {
  const stepElement = document.querySelector(`.wizard-step[data-step="${currentStep}"]`);
  const fields = stepElement.querySelectorAll('[data-rule]');
  let isValid = true;

  fields.forEach(field => {
    const fieldRules = (field.dataset.rule || '').split(' ').filter(Boolean);
    let fieldValid = true;
    let errorMessage = '';

    for (const ruleName of fieldRules) {
      const value = field.value;
      
      if (ruleName === 'required' && value.trim().length === 0) {
        fieldValid = false;
        errorMessage = 'Заполните поле';
      }
      if (ruleName === 'min' && value.trim().length < Number(field.dataset.min || 0)) {
        fieldValid = false;
        errorMessage = `Минимум ${field.dataset.min} символов`;
      }
      if (ruleName === 'email' && value.trim().length > 0 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        fieldValid = false;
        errorMessage = 'Введите корректный email';
      }
      if (ruleName === 'phone' && !/^\+?[\d\s()-]{10,}$/.test(value)) {
        fieldValid = false;
        errorMessage = 'Введите корректный телефон';
      }

      if (!fieldValid) break;
    }

    field.setAttribute('aria-invalid', String(!fieldValid));
    const errorSpan = document.querySelector(`[data-error-for="${field.id}"]`);
    if (errorSpan) errorSpan.textContent = errorMessage;

    if (!fieldValid) isValid = false;
  });

  return isValid;
}

if (multiStepForm) {
  let currentStep = 1;

  // Кнопки Далее
  multiStepForm.querySelectorAll('[data-next-step]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (validateCurrentStep(currentStep)) {
        currentStep++;
        if (currentStep === 3) updateSummary();
        goToStep(currentStep);
      }
    });
  });

  // Кнопки Назад
  multiStepForm.querySelectorAll('[data-prev-step]').forEach(btn => {
    btn.addEventListener('click', () => {
      currentStep--;
      goToStep(currentStep);
    });
  });

  // Сбор данных и подсчет цены на 3-м шаге
  function updateSummary() {
    const productName = document.getElementById('selected-product').value;
    const basePrice = Number(document.getElementById('selected-price').value) || 0;
    
    // 5% доставка
    const deliveryPrice = Math.round(basePrice * 0.05);
    const totalPrice = basePrice + deliveryPrice;

    // Записываем в скрытые инпуты (чтобы отправить на бэкенд, если надо)
    document.getElementById('selected-delivery-price').value = deliveryPrice;
    document.getElementById('selected-total-price').value = totalPrice;

    // Выводим в HTML
    document.getElementById('summary-product').textContent = productName;
    document.getElementById('summary-phone').textContent = document.getElementById('callback-phone').value;
    
    const city = document.getElementById('delivery-city').value;
    const street = document.getElementById('delivery-street').value;
    document.getElementById('summary-address').textContent = `${city}, ${street}`;
    
    const date = document.getElementById('delivery-date').value || 'Не указана';
    const time = document.getElementById('delivery-time').value || 'Не указано';
    document.getElementById('summary-date').textContent = `${date} в ${time}`;

    document.getElementById('summary-base-price').textContent = basePrice;
    document.getElementById('summary-delivery-price').textContent = deliveryPrice;
    document.getElementById('summary-total-price').textContent = totalPrice;
  }

  multiStepForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const formData = new FormData(multiStepForm);
    const data = Object.fromEntries(formData.entries());
    
    console.log('Отправленные данные:', data);
    
    alert('Заказ успешно оформлен!');
    multiStepForm.reset();
    goToStep(1);
    currentStep = 1;
    
    // Закрываем модалку
    const modal = document.getElementById('callback-modal');
    if (modal) {
      modal.hidden = true;
      document.body.classList.remove('no-scroll');
    }
  });
}

document.addEventListener('click', (event) => {
  const button = event.target.closest('.product-card__button');
  if (button) {
    const productInput = document.getElementById('selected-product');
    const priceInput = document.getElementById('selected-price');
    
    if (productInput) {
      productInput.value = button.dataset.product;
    }
    
    if (priceInput) {
      let price = 0;
      if (button.dataset.price) {
        price = Number(button.dataset.price);
      } else {
        const card = button.closest('.product-card');
        const priceEl = card ? card.querySelector('.product-card__price') : null;
        if (priceEl) {
          const match = priceEl.textContent.match(/\d+/);
          if (match) price = Number(match[0]);
        }
      }
      priceInput.value = price;
    }
  }
});

export function searchProducts(query) {
  const normalizedQuery = query.trim().toLowerCase();
  if (normalizedQuery === '') return products;
  
  return products.filter((product) => 
    product.title.toLowerCase().includes(normalizedQuery)
  );
}

export function filterByCategory(category) {
  if (category === 'all') return products;
  return products.filter((product) => product.category === category);
}

export function filterAvailable() {
  return products.filter((product) => product.isAvailable);
}

export function sortByPrice(direction = 'asc') {
  const copy = [...products];
  if (direction === 'desc') {
    return copy.sort((a, b) => b.price - a.price);
  }
  return copy.sort((a, b) => a.price - b.price);
}

export function countProducts(items = products) {
  return items.length;
}

export function calculateAveragePrice(items = products) {
  if (items.length === 0) return 0;
  const total = items.reduce((sum, product) => sum + product.price, 0);
  return Math.round(total / items.length);
}

export function calculateTotalPrice(items) {
  return items.reduce((sum, product) => sum + product.price, 0);
}



const statCount = document.getElementById('stat-count');
const statAverage = document.getElementById('stat-average');
const statTotal = document.getElementById('stat-total');

if (statCount && statAverage && statTotal) {
  statCount.textContent = countProducts();
  statAverage.textContent = calculateAveragePrice();
  statTotal.textContent = calculateTotalPrice(products);
}

initMenu();
initModals();
initForms();