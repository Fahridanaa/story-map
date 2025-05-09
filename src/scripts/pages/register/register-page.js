import RegisterPresenter from './register-presenter';
import authModel from '../../data/auth-model';
import Swal from 'sweetalert2';

export default class RegisterPage {
  #presenter;

  constructor() {
    this.#presenter = new RegisterPresenter({
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
          .finally(() => {
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
}
