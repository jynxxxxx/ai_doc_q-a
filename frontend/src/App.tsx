import './App.css'
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import ChatPage from './pages/ChatPage'
import DocPage from './pages/DocPage'
import LoginPage from './pages/LoginPage'
import { Toaster } from 'sonner';
import { useAuth } from './context/AuthContext';
import NavBar from './components/NavBar';

function App() {
  const { user } = useAuth();

  return (
    <>
      <Toaster position="top-center"/>
      <Router>
        <NavBar/>
        <div className='ml-[10vw]'>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/documents" element={user ? <DocPage /> : <Navigate to="/login" />} />
            <Route path="/chat" element={user ? <ChatPage /> : <Navigate to="/login" />} />
            <Route path="*" element={<Navigate to="/login" />} />
          </Routes>
        </div>
      </Router>
    </>
  )
}

export default App
