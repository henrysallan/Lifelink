import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './hooks/useAuth'; // 
import { Login } from './components/Login';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Chat } from './components/Chat';

function ChatInterface() {
  const { user, logout } = useAuth();

  return (
    <div className="h-screen bg-black flex flex-col">
      <header className="border-b border-green-400">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <h1 className="text-lg text-green-400 glow">LIFELINK</h1>
            <div className="flex items-center gap-3 text-sm">
              <span className="text-green-600">{user?.email}</span>
              <button
                onClick={logout}
                className="text-green-400 hover:text-green-300 transition-colors"
              >
                [LOGOUT]
              </button>
            </div>
          </div>
        </div>
      </header>
      
      <Chat />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router basename="/Lifelink">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <ChatInterface />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;