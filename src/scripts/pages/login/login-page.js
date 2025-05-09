import LoginPresenter from './login-presenter';
import authModel from '../../data/auth-model';
import Swal from 'sweetalert2';

export default class LoginPage {
  #presenter;

  constructor() {
    this.#presenter = new LoginPresenter({
      model: authModel,
      view: this
    });
  }

  async render() {
    if (authModel.isAuthenticated()) {
      window.location.hash = '#/';
      return '';
    }
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
          if (document.getElementById('login-form')) {
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
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'error',
      title: message,
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
      didOpen: (toast) => {
        toast.addEventListener('mouseenter', Swal.stopTimer);
        toast.addEventListener('mouseleave', Swal.resumeTimer);
      }
    });
  }

  showSuccess(message) {
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'success',
      title: message,
      showConfirmButton: false,
      timer: 2000,
      timerProgressBar: true,
      didOpen: (toast) => {
        toast.addEventListener('mouseenter', Swal.stopTimer);
        toast.addEventListener('mouseleave', Swal.resumeTimer);
      }
    });
  }

  clearError() {
    const errorDiv = document.querySelector('.error-message');
    if (errorDiv) {
      errorDiv.remove();
    }
  }
}
