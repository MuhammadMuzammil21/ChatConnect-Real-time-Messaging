import { MessageOutlined } from '@ant-design/icons';
import { Spin } from 'antd';

interface LoadingScreenProps {
    message?: string;
}

const LoadingScreen = ({ message = 'Loading...' }: LoadingScreenProps) => {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 relative overflow-hidden">
            {/* Background blobs for visual consistency with landing page */}
            <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-500/10 blur-[80px] pointer-events-none" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] rounded-full bg-purple-500/10 blur-[80px] pointer-events-none" />

            <div className="relative z-10 flex flex-col items-center">
                {/* Brand Logo with pulse effect */}
                <div className="mb-8 relative">
                    <div className="absolute inset-0 bg-indigo-500/20 rounded-2xl blur-xl animate-pulse" />
                    <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg relative z-10">
                        <MessageOutlined style={{ fontSize: '40px', color: 'white' }} />
                    </div>
                </div>

                {/* Loading Spinner & Text */}
                <div className="flex flex-col items-center gap-4">
                    <Spin size="large" />
                    <h2 className="text-xl font-semibold text-gray-700 animate-pulse">
                        {message}
                    </h2>
                </div>
            </div>
        </div>
    );
};

export default LoadingScreen;
