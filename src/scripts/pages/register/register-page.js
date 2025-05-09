import RegisterPresenter from './register-presenter';
import authModel from '../../data/auth-model';

export default class RegisterPage {
  #presenter;

  constructor() {
    this.#presenter = new RegisterPresenter({
      model: authModel,
      view: this
    });
  }

  async render() {
    return `
      <div class="register-page" id="register-page">
        <div class="register-container">
          <h1>Register</h1>
          <form id="register-form" class="register-form" aria-labelledby="register-heading">
            <div class="form-group">
              <label for="name" id="name-label">Name</label>
              <input
                type="text"
                id="name"
                name="name"
                required
                placeholder="Enter your name"
                aria-required="true"
                aria-labelledby="name-label"
              >
            </div>
            <div class="form-group">
              <label for="email" id="email-label">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                required
                placeholder="Enter your email"
                aria-required="true"
                aria-labelledby="email-label"
              >
            </div>
            <div class="form-group">
              <label for="password" id="password-label">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                required
                minlength="8"
                placeholder="Enter your password"
                aria-required="true"
                aria-labelledby="password-label"
                aria-describedby="password-hint"
              >
              <small id="password-hint" class="password-hint">Password must be at least 8 characters long</small>
            </div>
            <div class="form-group">
              <label for="confirmPassword">Confirm Password</label>
              <input type="password" id="confirmPassword" name="confirmPassword" required>
            </div>
            <button type="submit" class="register-button" id="register-button" aria-label="Create a new account">
              <i class="fas fa-user-plus" aria-hidden="true"></i>
              <span class="button-text">Register</span>
              <div class="loading-spinner" style="display: none;" aria-hidden="true">
                <i class="fas fa-spinner fa-spin" aria-hidden="true"></i>
              </div>
            </button>
          </form>
          <p class="login-link">
            Already have an account? <a href="#/login" id="login-link">Login</a>
          </p>
        </div>
      </div>
    `;
  }

  async afterRender() {
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
      registerForm.addEventListener('submit', (event) => {
        event.preventDefault();

        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;


        this.setLoading(true);
        this.#presenter.register(name, email, password, confirmPassword)
          .then(() => {
            if (document.getElementById('register-form')) {
              this.setLoading(false);
            }
          })
          .catch(() => {
            if (document.getElementById('register-form')) {
              this.setLoading(false);
            }
          });
      });
    }

    const loginLink = document.getElementById('login-link');
    if (loginLink) {
      loginLink.addEventListener('click', (event) => {
        event.preventDefault();
        window.location.hash = '/login';
      });
    }
  }

  setLoading(isLoading) {
    const button = document.getElementById('register-button');
    if (!button) return;

    const buttonText = button.querySelector('.button-text');
    const spinner = button.querySelector('.loading-spinner');
    const icon = button.querySelector('.fa-user-plus');

    if (isLoading) {
      button.disabled = true;
      button.setAttribute('aria-disabled', 'true');
      button.classList.add('disabled');
      buttonText.textContent = 'Registering...';
      icon.style.display = 'none';
      spinner.style.display = 'inline-block';
      spinner.setAttribute('aria-hidden', 'false');
    } else {
      button.disabled = false;
      button.setAttribute('aria-disabled', 'false');
      button.classList.remove('disabled');
      buttonText.textContent = 'Register';
      icon.style.display = 'inline-block';
      spinner.style.display = 'none';
      spinner.setAttribute('aria-hidden', 'true');
    }
  }

  showError(message) {
    const registerContainer = document.querySelector('.register-container');
    const errorElement = document.createElement('div');
    errorElement.className = 'error-message fade-in';
    errorElement.setAttribute('role', 'alert');
    errorElement.setAttribute('aria-live', 'polite');
    errorElement.innerHTML = `
      <i class="fas fa-exclamation-circle" aria-hidden="true"></i>
      <p>${message}</p>
    `;

    const existingError = registerContainer.querySelector('.error-message');
    if (existingError) {
      existingError.remove();
    }

    registerContainer.insertBefore(errorElement, registerContainer.firstChild);

    setTimeout(() => {
      errorElement.remove();
    }, 3000);
  }

  showSuccess(message) {
    const registerContainer = document.querySelector('.register-container');
    const successElement = document.createElement('div');
    successElement.className = 'success-message fade-in';
    successElement.setAttribute('role', 'status');
    successElement.setAttribute('aria-live', 'polite');
    successElement.innerHTML = `
      <i class="fas fa-check-circle" aria-hidden="true"></i>
      <p>${message}</p>
    `;

    const existingSuccess = registerContainer.querySelector('.success-message');
    if (existingSuccess) {
      existingSuccess.remove();
    }

    registerContainer.insertBefore(successElement, registerContainer.firstChild);

    setTimeout(() => {
      successElement.remove();
    }, 3000);
  }
}
