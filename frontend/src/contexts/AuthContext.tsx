import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import { message } from 'antd';
import axiosInstance from '../lib/axios';
import { TOKEN_KEYS } from '../constants';
import type { AuthContextType, User, TokenResponse, RefreshTokenResponse } from '../types/auth';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Initialize auth state from localStorage
    useEffect(() => {
        const initializeAuth = async () => {
            try {
                const accessToken = localStorage.getItem(TOKEN_KEYS.ACCESS_TOKEN);
                const refreshToken = localStorage.getItem(TOKEN_KEYS.REFRESH_TOKEN);
                const userStr = localStorage.getItem(TOKEN_KEYS.USER);

                if (accessToken && refreshToken && userStr) {
                    const userData = JSON.parse(userStr);
                    setUser(userData);

                    // Verify token is still valid by fetching profile
                    try {
                        const response = await axiosInstance.get('/auth/profile');
                        setUser(response.data);
                    } catch (error) {
                        // Token might be expired, try to refresh
                        const refreshed = await refreshTokens();
                        if (!refreshed) {
                            // Refresh failed, clear auth state
                            localStorage.clear();
                            setUser(null);
                        }
                    }
                }
            } catch (error) {
                console.error('Auth initialization error:', error);
                localStorage.clear();
                setUser(null);
            } finally {
                setIsLoading(false);
            }
        };

        initializeAuth();
    }, []);

    const login = useCallback((tokens: TokenResponse) => {
        localStorage.setItem(TOKEN_KEYS.ACCESS_TOKEN, tokens.accessToken);
        localStorage.setItem(TOKEN_KEYS.REFRESH_TOKEN, tokens.refreshToken);
        localStorage.setItem(TOKEN_KEYS.USER, JSON.stringify(tokens.user));
        setUser(tokens.user);
    }, []);

    const logout = useCallback(async () => {
        try {
            // Call logout endpoint to invalidate refresh token
            await axiosInstance.post('/auth/logout');
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            // Clear local storage and state regardless of API call result
            localStorage.removeItem(TOKEN_KEYS.ACCESS_TOKEN);
            localStorage.removeItem(TOKEN_KEYS.REFRESH_TOKEN);
            localStorage.removeItem(TOKEN_KEYS.USER);
            setUser(null);
            message.success('Logged out successfully');
        }
    }, []);

    const refreshTokens = useCallback(async (): Promise<boolean> => {
        try {
            const refreshToken = localStorage.getItem(TOKEN_KEYS.REFRESH_TOKEN);

            if (!refreshToken) {
                return false;
            }

            const response = await axiosInstance.post<RefreshTokenResponse>(
                '/auth/refresh',
                { refreshToken }
            );

            const { accessToken, refreshToken: newRefreshToken } = response.data;

            localStorage.setItem(TOKEN_KEYS.ACCESS_TOKEN, accessToken);
            localStorage.setItem(TOKEN_KEYS.REFRESH_TOKEN, newRefreshToken);

            return true;
        } catch (error) {
            console.error('Token refresh error:', error);
            return false;
        }
    }, []);

    const value: AuthContextType = useMemo(() => ({
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        refreshTokens,
    }), [user, isLoading, login, logout, refreshTokens]);

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
