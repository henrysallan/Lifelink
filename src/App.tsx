import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Login } from './components/Login';
import { ProtectedRoute } from './components/ProtectedRoute';

function ChatInterface() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold">Cross-Device Chat</h1>
            <div className="flex items-center gap-4">
              <img 
                src={user?.photoURL || ''} 
                alt={user?.displayName || ''} 
                className="w-8 h-8 rounded-full"
              />
              <button
                onClick={logout}
                className="text-sm text-gray-600 hover:text-gray-800"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <p className="text-gray-600">Welcome, {user?.displayName}! Chat interface coming next...</p>
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router basename="/cross-device-chat">
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