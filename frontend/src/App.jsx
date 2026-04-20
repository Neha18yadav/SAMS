import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import StudentDashboard from './pages/StudentDashboard';
import Students from './pages/Students';
import Reports from './pages/Reports';
import Login from './pages/Login';
import Attendance from './pages/Attendance';
import Landing from './pages/Landing';
import AIInsights from './pages/AIInsights';
import Timetable from './pages/Timetable';
import LeaveRequests from './pages/LeaveRequests';
import Settings from './pages/Settings';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { ThemeProvider } from './context/ThemeContext';


const ProtectedRoute = ({ isAuthenticated, allowedRoles, userRole, children }) => {
    if (!isAuthenticated) return <Navigate to="/login" replace />;
    if (allowedRoles && !allowedRoles.includes(userRole)) return <Navigate to="/dashboard" replace />;
    
    return (
        <div className="flex h-screen bg-transparent relative z-10">
            <Sidebar userRole={userRole} />
            <div className="flex-1 overflow-auto custom-scrollbar">
                {children}
            </div>
        </div>
    );
};

const GlobalBackground = () => (
  <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
    {/* Large Central Watermark */}
    <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex items-center justify-center opacity-[0.07] dark:opacity-[0.03]">
      <h1 className="text-[30vw] font-black tracking-tighter leading-none select-none text-center dark:text-white">
        SAMS
      </h1>
    </div>
    {/* Ambient Orbs */}
    <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] rounded-full bg-blue-100/30 dark:bg-blue-900/20 blur-[120px] animate-pulse" />
    <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] rounded-full bg-purple-100/20 dark:bg-purple-900/10 blur-[120px] animate-pulse shadow-[0_0_100px_rgba(168,85,247,0.1)] dark:shadow-none" />
  </div>
);

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null); // 'admin' or 'user'
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // Authenticate natively with JWT on application mount natively
  useEffect(() => {
      const verifyTokenSession = async () => {
          const storedToken = localStorage.getItem('token');
          if (storedToken) {
              try {
                  const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/verify_token`, {
                      headers: { Authorization: `Bearer ${storedToken}` },
                      timeout: 3000 // 3 second timeout to prevent hang
                  });
                  if (res.data.valid) {
                      setIsAuthenticated(true);
                      setUserRole(res.data.role);
                  }
              } catch (e) {
                  console.error("Auth session verification failed or timed out:", e);
                  localStorage.removeItem('token');
              }
          }
          setIsAuthLoading(false);
      };
      
      verifyTokenSession();
  }, []);

  const handleLogin = (role, token) => {
      localStorage.setItem('token', token);
      setIsAuthenticated(true);
      setUserRole(role);
  };

  if (isAuthLoading) {
      return (
          <div className="min-h-screen bg-white dark:bg-[#0a0a0a] flex items-center justify-center transition-colors duration-500">
              <div className="w-12 h-12 border-4 border-gray-100 dark:border-[#1d1d1f] border-t-blue-600 dark:border-t-blue-500 rounded-full animate-spin"></div>
          </div>
      );
  }

  return (
    <ThemeProvider>
        <Router>
            <div className="relative min-h-screen w-full bg-[#f5f5f7] dark:bg-[#0a0a0a] text-[#1d1d1f] dark:text-[#f5f5f7] transition-colors duration-500 selection:bg-blue-500/30">
                <GlobalBackground />
                <div className="relative z-10 w-full min-h-screen">
                    <Routes>
                        <Route path="/" element={<Landing />} />
                        <Route path="/login" element={
                            isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login onLogin={handleLogin} />
                        } />
                        
                        <Route path="/dashboard" element={<ProtectedRoute isAuthenticated={isAuthenticated} userRole={userRole}>{userRole === 'user' ? <StudentDashboard /> : <Dashboard />}</ProtectedRoute>} />
                        <Route path="/timetable" element={<ProtectedRoute isAuthenticated={isAuthenticated} userRole={userRole}><Timetable /></ProtectedRoute>} />
                        <Route path="/leaves" element={<ProtectedRoute isAuthenticated={isAuthenticated} userRole={userRole}><LeaveRequests /></ProtectedRoute>} />
                        
                        <Route path="/students" element={<ProtectedRoute isAuthenticated={isAuthenticated} allowedRoles={['admin']} userRole={userRole}><Students /></ProtectedRoute>} />
                        <Route path="/attendance" element={<ProtectedRoute isAuthenticated={isAuthenticated} allowedRoles={['admin']} userRole={userRole}><Attendance /></ProtectedRoute>} />
                        <Route path="/reports" element={<ProtectedRoute isAuthenticated={isAuthenticated} allowedRoles={['admin']} userRole={userRole}><Reports /></ProtectedRoute>} />
                        <Route path="/ai-insights" element={<ProtectedRoute isAuthenticated={isAuthenticated} allowedRoles={['admin']} userRole={userRole}><AIInsights /></ProtectedRoute>} />
                        
                        <Route path="/settings" element={<ProtectedRoute isAuthenticated={isAuthenticated} userRole={userRole}><Settings /></ProtectedRoute>} />

                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </div>
            </div>
        </Router>
    </ThemeProvider>
  );
}

export default App;
