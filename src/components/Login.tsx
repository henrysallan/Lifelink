import { useAuth } from '../hooks/useAuth';

export const Login = () => {
  const { signInWithGoogle } = useAuth();

  const handleGoogleLogin = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="relative">
        {/* Animated background grid */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-green-900/20 to-cyan-900/20"></div>
          <div className="absolute inset-0" style={{
            backgroundImage: `linear-gradient(rgba(34, 197, 94, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(34, 197, 94, 0.1) 1px, transparent 1px)`,
            backgroundSize: '50px 50px'
          }}></div>
        </div>
        
        <div className="  bg-black/80 backdrop-blur-sm p-8 max-w-sm w-full">
          <div className="text-center mb-4">
            <div className="text-4xl mb-4">[ ⚡ ]</div>
            <h1 className="text-5xl text-green-400 glow mb-2">
              LIFELINK
            </h1>
            <p className="text-green-600 text-lg">
              &gt; SECURE FILE TRANSFER PROTOCOL
            </p>
          </div>
          
          <button
            onClick={handleGoogleLogin}
            className="w-full border border-green-400 bg-transparent text-green-400 py-3 px-4 hover:bg-green-400 hover:text-black transition-all duration-200 text-lg group relative overflow-hidden"
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              <span>[ G ]</span>
              <span>AUTHENTICATE</span>
            </span>
            <div className="absolute inset-0 bg-green-400 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-200"></div>
          </button>
          
          <div className="mt-6 text-center">
            <p className="text-green-600 text-sm">
              &gt; ENCRYPTED CONNECTION<br/>
              &gt; ZERO KNOWLEDGE ARCHITECTURE
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};