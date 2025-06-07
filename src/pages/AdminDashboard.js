import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import SalesSummary from '../components/SalesSummary';
import ProfilePicture from '../components/ProfilePicture';
import { ComponentLoader } from '../components/LoadingState';
import { useNotification } from '../components/NotificationSystem';
import { salesService, productService, authService } from '../services/api';

const AdminDashboard = ({ onNavigate, onLogout, profileImage, onProfileUpdate }) => {
    // State for dashboard data
    const [dashboardData, setDashboardData] = useState({
        totalRevenue: 0,
        totalProducts: 0,
        lowStockItems: [],
        activeUsers: 0,
        salesByCategory: [],
        recentOrders: []
    });
    
    const [isLoading, setIsLoading] = useState(true);
    const { error: showError } = useNotification();
    
    // Fetch dashboard data
    useEffect(() => {
        fetchDashboardData();
        
        // Set up auto-refresh every 5 minutes
        const refreshInterval = setInterval(fetchDashboardData, 300000);
        
        return () => clearInterval(refreshInterval);
    }, []);
    
    const fetchDashboardData = async () => {
        try {
            // Fetch sales statistics
            const salesStats = await salesService.getSalesStats('monthly');
            
            // Fetch products data
            const products = await productService.getAllProducts();
            const lowStock = products.filter(p => p.quantity <= p.reorder_point);
            
            // Fetch categories with stats
            const categoriesResponse = await fetch('/api/categories?period=monthly');
            const categories = await categoriesResponse.json();
            
            // Fetch recent sales
            const recentSales = await salesService.getSales({
                limit: 5,
                sort: 'created_at',
                order: 'desc'
            });
            
            // Update dashboard data
            setDashboardData({
                totalRevenue: salesStats.totalSales,
                totalProducts: products.length,
                lowStockItems: lowStock,
                activeUsers: 0, // This will be implemented with user tracking
                salesByCategory: categories.map(cat => ({
                    name: cat.name,
                    value: parseFloat(cat.revenue) || 0
                })),
                recentOrders: recentSales.map(sale => ({
                    id: sale.id,
                    date: new Date(sale.created_at).toISOString().split('T')[0],
                    customer: sale.customer_name || 'Guest',
                    items: sale.items.length,
                    total: sale.total,
                    status: sale.status
                }))
            });
        } catch (err) {
            console.error('Error fetching dashboard data:', err);
            showError('Failed to fetch dashboard data');
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex flex-col lg:flex-row">
                <Sidebar 
                    isAdmin={true} 
                    activePage="adminDashboard" 
                    onNavigate={onNavigate} 
                    onLogout={onLogout}
                    profileImage={profileImage}
                />
                <div className="flex-1 p-4 pt-16 lg:pt-4 lg:p-6">
                    <ComponentLoader />
                </div>
            </div>
        );
    }
    
    return (
        <div className="min-h-screen flex flex-col lg:flex-row">
            <Sidebar 
                isAdmin={true} 
                activePage="adminDashboard" 
                onNavigate={onNavigate} 
                onLogout={onLogout}
                profileImage={profileImage}
            />
            
            <div className="flex-1 p-4 pt-16 lg:pt-4 lg:p-6">
                <h2 className="text-xl sm:text-2xl font-bold mb-4">Admin Dashboard</h2>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white p-4 rounded shadow">
                        <h3 className="text-gray-500">Total Revenue</h3>
                        <p className="text-xl sm:text-2xl font-bold">
                            ${dashboardData.totalRevenue.toLocaleString()}
                        </p>
                    </div>
                    <div className="bg-white p-4 rounded shadow">
                        <h3 className="text-gray-500">Total Products</h3>
                        <p className="text-xl sm:text-2xl font-bold">
                            {dashboardData.totalProducts}
                        </p>
                    </div>
                    <div className="bg-white p-4 rounded shadow">
                        <h3 className="text-gray-500">Low Stock Items</h3>
                        <p className="text-xl sm:text-2xl font-bold">
                            {dashboardData.lowStockItems.length}
                        </p>
                        <button 
                            className="text-blue-500 text-sm hover:underline"
                            onClick={() => onNavigate('inventory')}
                        >
                            View details
                        </button>
                    </div>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="bg-white p-4 rounded shadow">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold">Sales by Category</h3>
                            <button 
                                className="text-blue-500 text-sm hover:underline"
                                onClick={() => onNavigate('reports')}
                            >
                                View detailed reports
                            </button>
                        </div>
                        
                        <div className="space-y-4">
                            {dashboardData.salesByCategory.map(category => (
                                <div key={category.name}>
                                    <div className="flex justify-between">
                                        <span>{category.name}</span>
                                        <span>${category.value.toLocaleString()}</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                                        <div 
                                            className="bg-blue-600 h-2.5 rounded-full" 
                                            style={{ 
                                                width: `${(category.value / Math.max(...dashboardData.salesByCategory.map(c => c.value))) * 100}%` 
                                            }}
                                        ></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    <div className="bg-white p-4 rounded shadow">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold">Recent Orders</h3>
                            <button 
                                className="text-blue-500 text-sm hover:underline"
                                onClick={() => onNavigate('sales')}
                            >
                                View all orders
                            </button>
                        </div>
                        
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="text-left border-b">
                                        <th className="pb-2">Order ID</th>
                                        <th className="pb-2">Date</th>
                                        <th className="pb-2">Customer</th>
                                        <th className="pb-2">Items</th>
                                        <th className="pb-2">Total</th>
                                        <th className="pb-2">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {dashboardData.recentOrders.map(order => (
                                        <tr key={order.id} className="border-b">
                                            <td className="py-2">{order.id}</td>
                                            <td className="py-2">{order.date}</td>
                                            <td className="py-2">{order.customer}</td>
                                            <td className="py-2">{order.items}</td>
                                            <td className="py-2">${order.total.toFixed(2)}</td>
                                            <td className="py-2">
                                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                                    {order.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;