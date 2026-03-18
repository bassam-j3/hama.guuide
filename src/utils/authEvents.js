
class AuthEvents {
    constructor() {
        this.listeners = [];
    }

    on(event, callback) {
        if (event === 'logout') {
            this.listeners.push(callback);
        }
        // Return an unsubscribe function
        return () => {
            this.listeners = this.listeners.filter(cb => cb !== callback);
        };
    }

    emit(event) {
        if (event === 'logout') {
            this.listeners.forEach(callback => callback());
        }
    }
}

export const authEvents = new AuthEvents();