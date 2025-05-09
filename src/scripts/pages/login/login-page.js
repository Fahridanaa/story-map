import LoginPresenter from './login-presenter';
import authModel from '../../data/auth-model';

export default class LoginPage {
  #presenter;

  constructor() {
    this.#presenter = new LoginPresenter({
      model: authModel,
      view: this
    });
  }

  async render() {
    return `
      <div class="login-page" id="login-page">
        <div class="login-container">
          <h1>Login</h1>
          <form id="login-form" class="login-form" aria-labelledby="login-heading">
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
                placeholder="Enter your password"
                aria-required="true"
                aria-labelledby="password-label"
              >
            </div>
            <button type="submit" class="login-button" id="login-button" aria-label="Login to your account">
              <i class="fas fa-sign-in-alt" aria-hidden="true"></i>
              <span class="button-text">Login</span>
              <div class="loading-spinner" style="display: none;" aria-hidden="true">
                <i class="fas fa-spinner fa-spin" aria-hidden="true"></i>
              </div>
            </button>
          </form>
          <p class="register-link">
            Don't have an account? <a href="#/register" id="register-link">Register</a>
          </p>
        </div>
      </div>
    `;
  }

  async afterRender() {
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
      loginForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        if (!this.#presenter) {
          console.error('Login error: Presenter is not initialized');
          this.showError('An error occurred. Please try again.');
          return;
        }

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        this.setLoading(true);
        try {
          await this.#presenter.login(email, password);
        } catch (error) {
          this.showError(error.message || 'Login failed. Please try again.');
        } finally {
          const form = document.getElementById('login-form');
          if (form) {
            this.setLoading(false);
          }
        }
      });
    }

    const registerLink = document.getElementById('register-link');
    if (registerLink) {
      registerLink.addEventListener('click', (event) => {
        event.preventDefault();
        window.location.hash = '/register';
      });
    }
  }

  setLoading(isLoading) {
    const button = document.getElementById('login-button');
    if (!button) return;

    const buttonText = button.querySelector('.button-text');
    const spinner = button.querySelector('.loading-spinner');
    const icon = button.querySelector('.fa-sign-in-alt');

    if (isLoading) {
      button.disabled = true;
      button.setAttribute('aria-disabled', 'true');
      button.classList.add('disabled');
      buttonText.textContent = 'Logging in...';
      icon.style.display = 'none';
      spinner.style.display = 'inline-block';
      spinner.setAttribute('aria-hidden', 'false');
    } else {
      button.disabled = false;
      button.setAttribute('aria-disabled', 'false');
      button.classList.remove('disabled');
      buttonText.textContent = 'Login';
      icon.style.display = 'inline-block';
      spinner.style.display = 'none';
      spinner.setAttribute('aria-hidden', 'true');
    }
  }

  showError(message) {
    const loginContainer = document.querySelector('.login-container');
    if (!loginContainer) return;

    const errorElement = document.createElement('div');
    errorElement.className = 'error-message fade-in';
    errorElement.setAttribute('role', 'alert');
    errorElement.setAttribute('aria-live', 'polite');
    errorElement.innerHTML = `
      <i class="fas fa-exclamation-circle" aria-hidden="true"></i>
      <p>${message}</p>
    `;

    const existingError = loginContainer.querySelector('.error-message');
    if (existingError) {
      existingError.remove();
    }

    loginContainer.insertBefore(errorElement, loginContainer.firstChild);

    setTimeout(() => {
      if (errorElement.parentNode === loginContainer) {
        errorElement.remove();
      }
    }, 3000);
  }

  showSuccess(message) {
    const loginContainer = document.querySelector('.login-container');
    if (!loginContainer) return;

    const successElement = document.createElement('div');
    successElement.className = 'success-message fade-in';
    successElement.setAttribute('role', 'status');
    successElement.setAttribute('aria-live', 'polite');
    successElement.innerHTML = `
      <i class="fas fa-check-circle" aria-hidden="true"></i>
      <p>${message}</p>
    `;

    const existingSuccess = loginContainer.querySelector('.success-message');
    if (existingSuccess) {
      existingSuccess.remove();
    }

    loginContainer.insertBefore(successElement, loginContainer.firstChild);

    setTimeout(() => {
      if (successElement.parentNode === loginContainer) {
        successElement.remove();
      }
    }, 3000);
  }

  clearError() {
    const errorDiv = document.querySelector('.error-message');
    if (errorDiv) {
      errorDiv.remove();
    }
  }
}
