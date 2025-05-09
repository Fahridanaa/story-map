import { updateNavigation } from '../../utils/navigation';
import authModel from '../../data/auth-model';

export default class RegisterPresenter {
    #model;
    #view;

    constructor({ model, view }) {
        this.#model = model || authModel;
        this.#view = view;
    }

    async register(name, email, password, confirmPassword) {
        try {
            await this.#model.register(name, email, password, confirmPassword);

            await this.#model.login(email, password);

            this.#view.showSuccess('Registration successful!');
            updateNavigation();

            setTimeout(() => {
                window.location.hash = '/';
            }, 1000);

            return true;
        } catch (error) {
            this.#view.showError(error.message || 'Registration failed. Please try again.');
            return false;
        }
    }
}
