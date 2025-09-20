import React, { useState } from 'react';
import { HashRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import Dashboard from './pages/Dashboard';
import NewContract from './pages/NewContract';
import ContractDetail from './pages/ContractDetail';
import Statistics from './pages/Statistics';
import BackupRestore from './pages/BackupRestore';
import Login from './pages/Login';
import { Role } from './types';
import { BarChartIcon, DatabaseIcon, FilePlusIcon, HomeIcon, LogOutIcon, UserIcon, XIcon } from './components/Icons';
import EditContract from './pages/EditContract';

const ProtectedRoute: React.FC<{ children: React.ReactNode, roles?: Role[] }> = ({ children, roles }) => {
    const { isAuthenticated, currentUser } = useAuth();
    if (!isAuthenticated) {
        return <Navigate to="/" replace />;
    }
    if (roles && !roles.includes(currentUser!.role)) {
        return <Navigate to="/dashboard" replace />;
    }
    return <>{children}</>;
};

const Sidebar: React.FC<{onLinkClick: () => void}> = ({onLinkClick}) => {
    const { isAdmin, logout, currentUser } = useAuth();
    
    const navLinkClasses = "flex items-center p-3 my-1 rounded-lg text-gray-200 hover:bg-blue-500 transition-colors";
    const activeLinkClasses = "bg-blue-600 font-semibold";

    return (
        <aside className="w-64 bg-gray-800 text-white flex flex-col">
            <div className="p-4 border-b border-gray-700">
                <h2 className="text-xl font-bold">QLHĐ Đo đạc</h2>
            </div>
            <nav className="flex-grow p-4">
                <NavLink to="/dashboard" onClick={onLinkClick} className={({ isActive }) => `${navLinkClasses} ${isActive ? activeLinkClasses : ''}`}><HomeIcon className="w-5 h-5 mr-3"/>Bảng điều khiển</NavLink>
                <NavLink to="/contract/new" onClick={onLinkClick} className={({ isActive }) => `${navLinkClasses} ${isActive ? activeLinkClasses : ''}`}><FilePlusIcon className="w-5 h-5 mr-3"/>Tạo Hợp đồng</NavLink>
                {isAdmin && (
                    <>
                        <NavLink to="/statistics" onClick={onLinkClick} className={({ isActive }) => `${navLinkClasses} ${isActive ? activeLinkClasses : ''}`}><BarChartIcon className="w-5 h-5 mr-3"/>Thống kê</NavLink>
                        <NavLink to="/backup" onClick={onLinkClick} className={({ isActive }) => `${navLinkClasses} ${isActive ? activeLinkClasses : ''}`}><DatabaseIcon className="w-5 h-5 mr-3"/>Sao lưu & Phục hồi</NavLink>
                    </>
                )}
            </nav>
            <div className="p-4 border-t border-gray-700">
                <div className="flex items-center mb-4">
                    <UserIcon className="w-8 h-8 mr-3 p-1 bg-gray-600 rounded-full"/>
                    <div>
                        <p className="font-semibold">{currentUser?.fullName}</p>
                        <p className="text-sm text-gray-400">{currentUser?.role}</p>
                    </div>
                </div>
                <button onClick={logout} className="w-full flex items-center justify-center p-2 rounded-lg text-gray-200 bg-red-600 hover:bg-red-700 transition-colors">
                    <LogOutIcon className="w-5 h-5 mr-2" />
                    Đăng xuất
                </button>
            </div>
        </aside>
    );
};

const MainLayout: React.FC = () => {
    const { isAuthenticated, loading } = useAuth();
    const [isSidebarOpen, setSidebarOpen] = useState(false);

    if (loading) {
      return <div className="flex items-center justify-center h-screen">Loading...</div>; // Or a proper spinner
    }

    if (!isAuthenticated) {
        return <Login />;
    }
    
    return (
        <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
            <div className={`fixed inset-0 z-30 bg-black bg-opacity-50 lg:hidden ${isSidebarOpen ? 'block' : 'hidden'}`} onClick={() => setSidebarOpen(false)}></div>
            <div className={`fixed top-0 left-0 h-full z-40 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0`}>
                <Sidebar onLinkClick={() => setSidebarOpen(false)} />
            </div>
            <main className="flex-1 flex flex-col overflow-hidden">
                <header className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 border-b dark:border-gray-700 lg:hidden">
                    <h1 className="text-xl font-bold text-gray-800 dark:text-white">QLHĐ Đo đạc</h1>
                    <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="text-gray-600 dark:text-gray-300">
                        {isSidebarOpen ? <XIcon className="w-6 h-6"/> : <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" /></svg>}
                    </button>
                </header>
                <div className="flex-1 overflow-x-hidden overflow-y-auto">
                    <Routes>
                        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                        <Route path="/contract/new" element={<ProtectedRoute><NewContract /></ProtectedRoute>} />
                        <Route path="/contract/edit/:id" element={<ProtectedRoute roles={[Role.Admin]}><EditContract /></ProtectedRoute>} />
                        <Route path="/contract/:id" element={<ProtectedRoute><ContractDetail /></ProtectedRoute>} />
                        <Route path="/statistics" element={<ProtectedRoute roles={[Role.Admin]}><Statistics /></ProtectedRoute>} />
                        <Route path="/backup" element={<ProtectedRoute roles={[Role.Admin]}><BackupRestore /></ProtectedRoute>} />
                        <Route path="/*" element={<Navigate to="/dashboard" />} />
                    </Routes>
                </div>
            </main>
        </div>
    );
};

const App: React.FC = () => {
  return (
    <DataProvider>
      <AuthProvider>
          <HashRouter>
            <Routes>
                <Route path="/" element={<Login />} />
                <Route path="/*" element={<MainLayout />} />
            </Routes>
          </HashRouter>
      </AuthProvider>
    </DataProvider>
  );
};

export default App;