const rules = {
  required: (value) => value.trim().length > 0,
  email: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()),
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

  if (field.id === 'order-email') {
    const domain = document.getElementById('order-email-domain').value;
    value = `${field.value}@${domain}`;
    field.dataset.fullEmail = value;
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

    const emailInput = form.querySelector('#order-email');
    const emailDomain = form.querySelector('#order-email-domain');
    const phoneInput = form.querySelector('#order-phone');

    if (emailInput && emailDomain) {
      [emailInput, emailDomain].forEach(input => {
        input.addEventListener('input', () => validateField(emailInput));
      });
      [emailInput, emailDomain].forEach(input => {
        input.addEventListener('keypress', (e) => {
          if (e.key === '@') e.preventDefault();
        });
      });
    }

    if (phoneInput) {
      phoneInput.addEventListener('input', (e) => {
        e.target.value = formatPhone(e.target.value);
        validateField(phoneInput);
      });
    }

    fields.forEach((field) => {
      field.addEventListener('blur', () => validateField(field));
      field.addEventListener('input', () => {
        if (field.getAttribute('aria-invalid') === 'true') {
          validateField(field);
        }
      });
    });

    form.addEventListener('submit', (event) => {
      event.preventDefault();

      let isValid = true;
      let firstInvalid = null;

      fields.forEach((field) => {
        const fieldValid = validateField(field);
        if (!fieldValid && !firstInvalid) firstInvalid = field;
        if (!fieldValid) isValid = false;
      });

      if (emailInput && emailDomain) {
        if (emailInput.value && !emailDomain.value) {
          isValid = false;
          document.querySelector('[data-error-for="order-email"]').textContent = 'Введите домен после @';
        }
      }

      if (!isValid) {
        firstInvalid?.focus();
        return;
      }

      const formData = new FormData(form);
      
      if (emailInput) {
        formData.set('email', emailInput.dataset.fullEmail || `${emailInput.value}@${emailDomain.value}`);
      }
      if (phoneInput) {
        formData.set('phone', '+7 ' + phoneInput.value);
      }

      console.log('Данные формы:', Object.fromEntries(formData.entries()));

      form.reset();
      fields.forEach((field) => {
        field.setAttribute('aria-invalid', 'false');
        const errorElement = getErrorElement(field);
        if (errorElement) errorElement.textContent = '';
        
        const wrapper = field.closest('.input-prefix-wrapper');
        if (wrapper) wrapper.classList.remove('has-error');
      });

      alert('Форма отправлена');
    });
  });
}

const emailInput = document.getElementById('order-email');
const emailDomainInput = document.getElementById('order-email-domain');

if (emailInput && emailDomainInput) {
  emailInput.addEventListener('keydown', (event) => {
    // Если нажали @
    if (event.key === '@' || event.code === 'Digit2' && event.shiftKey) {
      event.preventDefault(); // Отменяем ввод @ в первое поле
      
      // Если во втором поле уже что-то есть, ставим курсор в начало
      emailDomainInput.focus();
      
      // Если второе поле пустое, можно поставить курсор в начало
      if (emailDomainInput.value === '') {
        emailDomainInput.setSelectionRange(0, 0);
      }
    }
  });
}
