import { register, login } from './api';

export class AuthModel {
    constructor() {
        this.token = localStorage.getItem('token') || null;
    }

    async register(name, email, password) {
        try {
            return await register(name, email, password);
        } catch (error) {
            throw error;
        }
    }

    async login(email, password) {
        try {
            const loginResult = await login(email, password);
            this.token = loginResult.token;
            localStorage.setItem('token', this.token);
            return loginResult;
        } catch (error) {
            throw error;
        }
    }

    logout() {
        this.token = null;
        localStorage.removeItem('token');
    }

    isAuthenticated() {
        return !!this.token;
    }

    getToken() {
        return this.token;
    }
}

const authModel = new AuthModel();
export default authModel;
