import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from '../components/Login';
import UsersPage from '../pages/UsersPage';
import Layout from '../components/Layout';

// Protected Route wrapper
const ProtectedRoute = ({ children, requireAdmin }) => {
    const isAuthenticated = !!localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const isAdmin = user.role === 'admin';
    
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (requireAdmin && !isAdmin) {
        return <Navigate to="/dashboard" replace />;
    }

    return children;
};

// Temporary Dashboard component
const Dashboard = () => (
    <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Welcome to Stocker Dashboard</h1>
        <p>Your inventory management system</p>
    </div>
);

const AppRoutes = () => {
    return (
        <Routes>
            <Route path="/login" element={<Login />} />
            <Route
                path="/"
                element={
                    <ProtectedRoute>
                        <Layout />
                    </ProtectedRoute>
                }
            >
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route
                    path="users"
                    element={
                        <ProtectedRoute requireAdmin={true}>
                            <UsersPage />
                        </ProtectedRoute>
                    }
                />
            </Route>
        </Routes>
    );
};

export default AppRoutes; 