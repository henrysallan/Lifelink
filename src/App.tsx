import { useState } from 'react'; // Import useState
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './hooks/useAuth';
import { Login } from './components/Login';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Chat } from './components/Chat';

function ChatInterface() {
  const { user, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState(''); // Add search state

  return (
    <div className="h-full bg-black flex flex-col">
      <header className="border-b border-green-400">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <h1 className="text-lg text-green-400 glow hidden sm:block">LIFELINK</h1>
            
            {/* Desktop Search Bar */}
            <div className="flex-1 hidden md:flex justify-center">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="&gt; SEARCH MESSAGES..."
                className="w-full max-w-md px-3 py-1 bg-black border border-green-600 text-green-400 placeholder-green-700 focus:outline-none focus:border-glow text-sm"
              />
            </div>

            <div className="flex items-center gap-3 text-sm">
              <span className="text-green-600 hidden sm:block">{user?.email}</span>
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
      
      <Chat searchQuery={searchQuery} onSearchChange={setSearchQuery} />
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