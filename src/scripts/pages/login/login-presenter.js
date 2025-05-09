import { updateNavigation } from '../../utils/navigation';
import authModel from '../../data/auth-model';

export default class LoginPresenter {
    #model;
    #view;

    constructor({ model, view }) {
        this.#model = model || authModel;
        this.#view = view;
    }

    async login(email, password) {
        try {
            await this.#model.login(email, password);

            this.#view.showSuccess('Login successful!');
            updateNavigation();
            setTimeout(() => {
                window.location.hash = '/';
            }, 1000);
            return true;
        } catch (error) {
            this.#view.showError(error.message || 'Login failed. Please try again.');
            return false;
        }
    }
}
