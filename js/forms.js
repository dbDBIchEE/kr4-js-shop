import { products } from './data.js';

const rules = {
  required: (value) => value.trim().length > 0,
  email: (value) => value.trim() === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()),
  phone: (value) => {
    const digits = value.replace(/\D/g, '');
    return digits.length === 10;
  },
  min: (value, field) => value.trim().length >= Number(field.dataset.min || 0),
};

function getErrorElement(field) {
  return document.querySelector(`[data-error-for="${field.id}"]`);
}

function validateField(field) {
  let value = field.value;

  if (field.id === 'order-email' || field.id === 'callback-email') {
    // Если это поле email в модалке или на странице
    const domainInput = document.getElementById('order-email-domain');
    if (domainInput) {
       value = `${field.value}@${domainInput.value}`;
    }
  }

  const fieldRules = (field.dataset.rule || '').split(' ').filter(Boolean);
  const errorElement = getErrorElement(field);

  let errorMessage = '';

  for (const ruleName of fieldRules) {
    const rule = rules[ruleName];
    if (!rule) continue;

    if (!rule(value, field)) {
      if (ruleName === 'required') errorMessage = 'Заполните поле';
      if (ruleName === 'email') errorMessage = 'Введите корректный email';
      if (ruleName === 'phone') errorMessage = 'Введите корректный телефон';
      if (ruleName === 'min') errorMessage = `Минимум ${field.dataset.min} символов`;
      break;
    }
  }

  field.setAttribute('aria-invalid', String(Boolean(errorMessage)));

  const wrapper = field.closest('.input-prefix-wrapper');
  if (wrapper) {
    wrapper.classList.toggle('has-error', Boolean(errorMessage));
  }

  if (errorElement) {
    errorElement.textContent = errorMessage;
    if (errorMessage) {
      field.setAttribute('aria-describedby', errorElement.id || `err-${field.id}`);
    } else {
      field.removeAttribute('aria-describedby');
    }
  }

  return !errorMessage;
}

function formatPhone(value) {
  let digits = value.replace(/\D/g, '');
  digits = digits.slice(0, 10);

  let result = '';
  if (digits.length > 0) result += '(' + digits.slice(0, 3);
  if (digits.length >= 3) result += ') ' + digits.slice(3, 6);
  if (digits.length >= 6) result += '-' + digits.slice(6, 8);
  if (digits.length >= 8) result += '-' + digits.slice(8, 10);

  return result;
}

export function initForms() {
  const forms = document.querySelectorAll('[data-validate-form]');

  forms.forEach((form) => {
    const fields = form.querySelectorAll('[data-rule]');

    // Базовая валидация при вводе и потере фокуса
    fields.forEach((field) => {
      field.addEventListener('blur', () => validateField(field));
      field.addEventListener('input', () => {
        if (field.getAttribute('aria-invalid') === 'true') {
          validateField(field);
        }
      });
    });

    // --- МАСКИ ДЛЯ ТЕЛЕФОНА И EMAIL ---
    fields.forEach((field) => {
      if (field.type === 'tel') {
        field.addEventListener('input', (e) => {
          e.target.value = formatPhone(e.target.value);
        });
      }
    });

    // --- ЛОГИКА МНОГОШАГОВОЙ МОДАЛКИ ---
    if (form.id === 'multi-step-form') {
      let currentStep = 1;

      const goToStep = (stepNumber) => {
        document.querySelectorAll('.wizard-step').forEach(step => {
          step.hidden = Number(step.dataset.step) !== stepNumber;
        });
        document.querySelectorAll('.wizard-progress__step').forEach(ind => {
          const indNum = parseInt(ind.dataset.stepIndicator);
          ind.classList.toggle('is-active', indNum === stepNumber);
          ind.classList.toggle('is-completed', indNum < stepNumber);
        });
      };

      const validateStep = (step) => {
        const stepEl = document.querySelector(`.wizard-step[data-step="${step}"]`);
        if (!stepEl) return false;
        
        const stepFields = stepEl.querySelectorAll('[data-rule]');
        let valid = true;
        stepFields.forEach(field => {
          if (!validateField(field)) valid = false;
        });
        return valid;
      };

      // Обработка кнопок Далее/Назад
      form.addEventListener('click', (e) => {
        if (e.target.closest('[data-next-step]')) {
          if (validateStep(currentStep)) {
            currentStep++;
            
            // ВОТ ЗДЕСЬ МЫ ДОЛЖНЫ СОБРАТЬ ДАННЫЕ ДЛЯ 3-ГО ШАГА
            if (currentStep === 3) {
              updateSummary();
            }
            
            goToStep(currentStep);
          }
        }
        if (e.target.closest('[data-prev-step]')) {
          currentStep--;
          goToStep(currentStep);
        }
      });

      // Функция сбора данных для итога
      function updateSummary() {
        const productInput = document.getElementById('selected-product');
        const priceInput = document.getElementById('selected-price');
        
        let productNameText = '';
        let basePrice = 0;

        // Проверяем: заказываем один товар или всю корзину?
        if (productInput && productInput.value.trim() !== '') {
          // Заказ одного товара
          productNameText = productInput.value;
          basePrice = Number(priceInput.value) || 0;
        } else {
          // Заказ из корзины
          const cart = JSON.parse(localStorage.getItem('cart')) || [];
          if (cart.length === 0) {
            productNameText = 'Корзина пуста';
          } else {
            // Формируем список названий и считаем сумму
            const names = [];
            cart.forEach(item => {
              // Ищем товар в массиве products (нужно импортировать products в forms.js)
              // Но проще взять цену из самого localStorage, если мы ее там сохраняем.
              // В твоем cart.js сохраняется только {id, quantity}. Значит, нам нужен массив products.
              // Для этого в начале forms.js добавь: import { products } from './data.js';
              const productObj = products.find(p => p.id === item.id);
              if (productObj) {
                names.push(`${productObj.title} (${item.quantity} шт.)`);
                basePrice += productObj.price * item.quantity;
              }
            });
            productNameText = names.join(', ');
          }
        }

        // Считаем доставку 5%
        const deliveryPrice = Math.round(basePrice * 0.05);
        const totalPrice = basePrice + deliveryPrice;

        // Записываем в скрытые инпуты (для отправки на бэк)
        document.getElementById('selected-delivery-price').value = deliveryPrice;
        document.getElementById('selected-total-price').value = totalPrice;

        // Выводим в HTML
        document.getElementById('summary-product').textContent = productNameText;
        
        const phoneInput = document.getElementById('callback-phone');
        document.getElementById('summary-phone').textContent = phoneInput ? phoneInput.value : '';
        
        const city = document.getElementById('delivery-city')?.value || '';
        const street = document.getElementById('delivery-street')?.value || '';
        document.getElementById('summary-address').textContent = `${city}, ${street}`;
        
        const date = document.getElementById('delivery-date')?.value;
        const time = document.getElementById('delivery-time')?.value;
        if (date && time) document.getElementById('summary-date').textContent = `${date} в ${time}`;
        else if (date) document.getElementById('summary-date').textContent = date;
        else document.getElementById('summary-date').textContent = 'Не указана';

        document.getElementById('summary-base-price').textContent = basePrice;
        document.getElementById('summary-delivery-price').textContent = deliveryPrice;
        document.getElementById('summary-total-price').textContent = totalPrice;
      }

      form.addEventListener('reset', () => {
        currentStep = 1;
        goToStep(1);
        form.querySelectorAll('.form-error').forEach(e => e.textContent = '');
        form.querySelectorAll('[aria-invalid]').forEach(e => e.removeAttribute('aria-invalid'));
      });

      // Обработка отправки формы
      form.addEventListener('submit', (e) => {
        e.preventDefault();

        if (currentStep < 3) {
          if (validateStep(currentStep)) {
            currentStep++;
            if (currentStep === 3) updateSummary();
            goToStep(currentStep);
          }
          return; // Прерываем отправку
        }

        const successMsg = document.getElementById('order-success-message');
        if (successMsg) {
          successMsg.hidden = false;
          setTimeout(() => { successMsg.hidden = true; }, 3000);
        }

        // Если заказывали корзину (поле товара было пустым), очищаем её
        const productInput = document.getElementById('selected-product');
        if (productInput && productInput.value === '') {
          import('./cart.js').then(m => m.clearCart());
          import('./cart.js').then(module => module.updateCartCount());
        }

        form.reset();
        currentStep = 1;
        goToStep(1);

        const modal = document.getElementById('callback-modal');
        if (modal) {
          modal.querySelectorAll('.wizard-step').forEach(s => s.hidden = true);
          // successMsg теперь вне формы
          const successMsg = modal.querySelector('#order-success-message');
          if(successMsg) successMsg.hidden = false;
          
          setTimeout(() => {
            modal.hidden = true;
            document.body.classList.remove('no-scroll');
            if(successMsg) successMsg.hidden = true;
            goToStep(1); // Сброс для следующего раза
          }, 3000);
        }
      });
    } else {
      // Стандартная отправка для обычных форм (если есть)
      form.addEventListener('submit', (event) => {
        event.preventDefault();
        let isValid = true;
        fields.forEach(field => {
          if (!validateField(field)) isValid = false;
        });
        if (!isValid) return;
        
        form.reset();
        
      });
    }
  });
}