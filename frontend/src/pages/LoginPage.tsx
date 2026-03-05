import { useNavigate } from 'react-router-dom';
import { AuthFormSplitScreen } from '@/components/ui/login';

function LoginPage() {
    const navigate = useNavigate();

    const handleGoogleLogin = () => {
        window.location.href = `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/auth/google`;
    };

    const handleBack = () => {
        navigate('/');
    };

    return (
        <AuthFormSplitScreen
            onGoogleLogin={handleGoogleLogin}
            onBack={handleBack}
            imageSrc="/login-bg.png"
            imageAlt="Abstract dark background with glowing geometric shapes"
        />
    );
}

export default LoginPage;
