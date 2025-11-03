import { defineStore } from 'pinia'


interface User {
    id: number;
    name: string;
    email: string;
}
export const useUserStore = defineStore('user', {
    state: () => ({
        user: null as User | null,
        token: null as string | null,
        isLoading: false,
        error: null as string | null
    }),
    actions: {
        setUserData(payload: { user: User | null; token?: string | null }) {
            this.user = payload.user;
            if (payload.token !== undefined) {
                this.token = payload.token;
            }
            this.error = null;
        },
        setuserToken(token) {
            this.token = token
        },
        clearUserData() {
            this.user = null;
            this.token = null;
        },
    }
})