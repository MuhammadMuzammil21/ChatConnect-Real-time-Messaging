import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import LoadingScreen from '../components/LoadingScreen';
import { useAuth } from '../contexts/AuthContext';
import type { User } from '../types/auth';

function AuthCallback() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { login } = useAuth();

    useEffect(() => {
        const handleCallback = () => {
            try {
                // Extract tokens from URL parameters
                const accessToken = searchParams.get('accessToken');
                const refreshToken = searchParams.get('refreshToken');
                const userStr = searchParams.get('user');

                if (accessToken && refreshToken && userStr) {
                    const user: User = JSON.parse(userStr);

                    // Use auth context to login
                    login({
                        accessToken,
                        refreshToken,
                        user,
                    });

                    // Redirect to dashboard
                    navigate('/dashboard');
                } else {
                    console.error('No tokens received');
                    navigate('/');
                }
            } catch (error) {
                console.error('Auth callback error:', error);
                navigate('/');
            }
        };

        handleCallback();
    }, [navigate, searchParams, login]);

    return <LoadingScreen message="Completing sign in..." />;
}

export default AuthCallback;
