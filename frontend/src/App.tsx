import { Button, Card } from 'antd';
import { GoogleOutlined, MessageOutlined, SafetyOutlined, ThunderboltOutlined } from '@ant-design/icons';
import './App.css';

function App() {
  const handleGoogleLogin = () => {
    // Redirect to backend Google OAuth endpoint
    window.location.href = 'http://localhost:3000/auth/google';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-4">
      <div className="w-full max-w-5xl grid md:grid-cols-2 gap-8 items-center">
        {/* Left Side - Branding */}
        <div className="text-center md:text-left space-y-6">
          <div className="flex items-center justify-center md:justify-start gap-3">
            <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
              <MessageOutlined style={{ fontSize: '32px', color: 'white' }} />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              ChatConnect
            </h1>
          </div>

          <p className="text-xl text-gray-600 leading-relaxed">
            Experience real-time messaging with modern technology. Connect, collaborate, and communicate seamlessly.
          </p>

          {/* Features */}
          <div className="space-y-4 pt-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <ThunderboltOutlined style={{ fontSize: '20px', color: '#6366f1' }} />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">Real-time Messaging</h3>
                <p className="text-sm text-gray-600">Instant message delivery with WebSocket technology</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <SafetyOutlined style={{ fontSize: '20px', color: '#8b5cf6' }} />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">Secure & Private</h3>
                <p className="text-sm text-gray-600">End-to-end encryption and Google OAuth 2.0</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Login Card */}
        <Card
          className="shadow-2xl border-0"
          style={{
            borderRadius: '24px',
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <div className="text-center space-y-6 p-6">
            {/* Title */}
            <div>
              <h2 className="text-3xl font-bold text-gray-800 mb-2">
                Welcome Back
              </h2>
              <p className="text-gray-600">
                Sign in to continue to your conversations
              </p>
            </div>

            {/* Decorative Divider */}
            <div className="flex items-center gap-4 py-4">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
              <span className="text-sm text-gray-500 font-medium">SIGN IN WITH</span>
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
            </div>

            {/* Google Login Button */}
            <div>
              <Button
                type="primary"
                size="large"
                icon={<GoogleOutlined />}
                onClick={handleGoogleLogin}
                className="w-full h-14 text-lg font-semibold"
                style={{
                  background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                  border: 'none',
                  borderRadius: '12px',
                  boxShadow: '0 4px 14px 0 rgba(99, 102, 241, 0.4)',
                }}
              >
                Continue with Google
              </Button>
            </div>

            {/* Footer */}
            <div className="pt-4">
              <p className="text-xs text-gray-500 leading-relaxed">
                By signing in, you agree to our Terms of Service and Privacy Policy.
                <br />
                Secure authentication powered by Google OAuth 2.0
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default App;
