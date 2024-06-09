import * as SecureStore from 'expo-secure-store'
import { createContext, useContext, useEffect, useState } from 'react';

interface AuthProps {
    authState: { token: string | null; authenticated: boolean | null; user_id: string | null };
    onRegister: ( email: string, password: string  ) => Promise<any>;
    onLogin: ( email: string, password: string ) => Promise<any>;
    onLogout: () => Promise<any>;
    initialized: boolean;
}

const TOKEN = 'my-special-token';
export const API_URL = process.env.EXPO_PUBLIC_SERVER_URL;
const AuthContext = createContext<Partial<AuthProps>>({});

export const useAuth = () => {
    return useContext(AuthContext);
};

export const AuthProvider = ({ children }: any) => {
    const [authState, setAuthState] = useState<{
        token: string | null;
        authenticated: boolean | null;
        user_id: string | null;
    }>({
        token: null,
        authenticated: null,
        user_id: null
    });
    const [initialized, setInitialized] = useState(false);

    useEffect(() => {
        const loadToken = async () => {
            // load on start
            const data = await SecureStore.getItemAsync(TOKEN);

            if (data) {
                const object = JSON.parse(data);
                // set context
                setAuthState({
                    token: object.token,
                    authenticated: true,
                    user_id: object.user.id
                })
            }
            setInitialized(true);
        };
        loadToken();
    }, []);

    const login = async (email: string, password: string) => {
        try {
            const result = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            })
            const json = await result.json();

            // set context state
            setAuthState({
                token: json.token,
                authenticated: true,
                user_id: json.user.id,
            });


            // Write the JWT to secure storage
            await SecureStore.setItemAsync(TOKEN, JSON.stringify(json));
            return result;

        } catch (error) {
            return { error: true, msg: (error as any).response.data.msg };
        }
    }

    const register = async (email: string, password: string) => {
        try {
            const result = await fetch(`${API_URL}/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            })
            const json = await result.json();

            // set context state
            setAuthState({
                token: json.token,
                authenticated: true,
                user_id: json.user.id,
            });


            // Write the JWT to secure storage
            await SecureStore.setItemAsync(TOKEN, JSON.stringify(json));
            return result;

            } catch (error) {
                return { error: true, msg: (error as any).response.data.msg };
            }
    };

    const logout = async () => {
        await SecureStore.deleteItemAsync(TOKEN);

        // reset auth state
        setAuthState({
            token: null,
            authenticated: false,
            user_id: null,
        });
    }



    const value = {
        onRegister: register,
        onLogin: login,
        onLogout: logout,
        authState,
        initialized,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}