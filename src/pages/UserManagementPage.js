import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import Modal from '../components/Modal';
import ProfilePicture from '../components/ProfilePicture';

const UserManagementPage = ({ onNavigate, onLogout , profileImage, onProfileUpdate}) => {
  const [users, setUsers] = useState([
    { id: 1, username: 'admin', email: 'admin@example.com', role: 'admin', status: 'active', lastLogin: '2025-04-12 09:15' },
    { id: 2, username: 'john', email: 'john@example.com', role: 'user', status: 'active', lastLogin: '2025-04-11 14:30' },
    { id: 3, username: 'sarah', email: 'sarah@example.com', role: 'user', status: 'active', lastLogin: '2025-04-12 08:45' },
    { id: 4, username: 'mike', email: 'mike@example.com', role: 'user', status: 'inactive', lastLogin: '2025-03-28 11:20' },
  ]);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
    password: '',
    role: 'user',
  });
  
const [updateSuccess, setUpdateSuccess] = useState(false);

    const handleProfileImageChange = (newImage) => {
      // Call the parent handler to update the profile image in App.js
      if (onProfileUpdate) {
        onProfileUpdate(newImage);
        
        // Show success message briefly
        setUpdateSuccess(true);
        setTimeout(() => {
          setUpdateSuccess(false);
        }, 3000);
      }
    };
    

    const handleSaveSettings = () => {
      // In a real application, you would save these settings to a database
      // For now, just show a success message
      setUpdateSuccess(true);
      setTimeout(() => {
        setUpdateSuccess(false);
      }, 3000);
    };



  // Add new user
  const handleAddUser = () => {
    const userToAdd = {
      ...newUser,
      id: users.length + 1,
      status: 'active',
      lastLogin: 'Never'
    };
    
    setUsers([...users, userToAdd]);
    setShowAddModal(false);
    setNewUser({
      username: '',
      email: '',
      password: '',
      role: 'user',
    });
  };
  
  // Toggle user status
  const toggleUserStatus = (userId) => {
    setUsers(users.map(user => 
      user.id === userId 
        ? { ...user, status: user.status === 'active' ? 'inactive' : 'active' } 
        : user
    ));
  };
  
  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
        
    <Sidebar 
      isAdmin={true} 
      activePage="UserManagement" 
      onNavigate={onNavigate} 
      onLogout={onLogout}
      profileImage={profileImage}
    />
      
      <div className="flex-1 p-4 pt-16 lg:pt-4 lg:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
          <h2 className="text-xl sm:text-2xl font-bold">User Management</h2>
          <button 
            className="bg-blue-600 text-white px-4 py-2 rounded flex items-center"
            onClick={() => setShowAddModal(true)}
          >
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
            </svg>
            <span>Add New User</span>
          </button>
        </div>
        
        <div className="bg-white p-4 rounded shadow mb-4">
          <div className="flex flex-col md:flex-row gap-2 md:space-x-4 mb-4">
            <div className="flex-1">
              <input 
                type="text" 
                placeholder="Search users..." 
                className="w-full p-2 border rounded"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <select className="p-2 border rounded">
                <option value="">All Roles</option>
                <option value="admin">Admin</option>
                <option value="user">User</option>
              </select>
              <select className="p-2 border rounded">
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              <button className="bg-gray-200 text-gray-800 px-4 py-2 rounded">
                Filter
              </button>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left border-b">
                  <th className="pb-2 px-2">Username</th>
                  <th className="pb-2 px-2">Email</th>
                  <th className="pb-2 px-2">Role</th>
                  <th className="pb-2 px-2">Status</th>
                  <th className="pb-2 px-2">Last Login</th>
                  <th className="pb-2 px-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id} className="border-b hover:bg-gray-50">
                    <td className="py-2 px-2">{user.username}</td>
                    <td className="py-2 px-2">{user.email}</td>
                    <td className="py-2 px-2">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        user.role === 'admin' 
                          ? 'bg-purple-100 text-purple-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {user.role.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-2 px-2">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        user.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {user.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-2 px-2">{user.lastLogin}</td>
                    <td className="py-2 px-2">
                      <div className="flex flex-col sm:flex-row gap-1 sm:space-x-2">
                        <button className="text-blue-600 hover:underline">Edit</button>
                        <button 
                          className={`${user.status === 'active' ? 'text-red-600' : 'text-green-600'} hover:underline`}
                          onClick={() => toggleUserStatus(user.id)}
                        >
                          {user.status === 'active' ? 'Deactivate' : 'Activate'}
                        </button>
                        <button className="text-blue-600 hover:underline">Permissions</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded shadow">
          <h3 className="font-bold mb-4">User Activity Log</h3>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left border-b">
                  <th className="pb-2">User</th>
                  <th className="pb-2">Action</th>
                  <th className="pb-2">Details</th>
                  <th className="pb-2">Time</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="py-2">admin</td>
                  <td className="py-2">Added Product</td>
                  <td className="py-2">Added new product: "Wireless Keyboard"</td>
                  <td className="py-2">Today, 09:45</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2">sarah</td>
                  <td className="py-2">Completed Sale</td>
                  <td className="py-2">Sale #1089 for $149.99</td>
                  <td className="py-2">Today, 09:30</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2">john</td>
                  <td className="py-2">Updated Inventory</td>
                  <td className="py-2">Added 10 units of "Headphones"</td>
                  <td className="py-2">Today, 08:15</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2">admin</td>
                  <td className="py-2">Price Change</td>
                  <td className="py-2">Updated price of "Laptop" from $999.99 to $899.99</td>
                  <td className="py-2">Yesterday, 17:20</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2">sarah</td>
                  <td className="py-2">Login</td>
                  <td className="py-2">User logged in</td>
                  <td className="py-2">Today, 08:45</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Add User Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md mx-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">Add New User</h3>
                <button className="text-gray-500 text-2xl" onClick={() => setShowAddModal(false)}>
                  &times;
                </button>
              </div>
              
              <div className="space-y-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                  <input 
                    type="text" 
                    className="w-full p-2 border rounded" 
                    value={newUser.username}
                    onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input 
                    type="email" 
                    className="w-full p-2 border rounded" 
                    value={newUser.email}
                    onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <input 
                    type="password" 
                    className="w-full p-2 border rounded" 
                    value={newUser.password}
                    onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <select 
                    className="w-full p-2 border rounded"
                    value={newUser.role}
                    onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row sm:justify-end space-y-2 sm:space-y-0 sm:space-x-2">
                <button 
                  className="bg-gray-300 text-gray-800 px-4 py-2 rounded"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button 
                  className="bg-blue-600 text-white px-4 py-2 rounded"
                  onClick={handleAddUser}
                >
                  Add User
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

  export default UserManagementPage;