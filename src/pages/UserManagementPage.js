import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { useNotification } from '../components/NotificationSystem';
import { userService } from '../services/api';
import { ComponentLoader } from '../components/LoadingState';

const UserManagementPage = ({ onNavigate, onLogout, profileImage }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { success, error: showError } = useNotification();

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: 'user',
    status: 'active'
  });

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await userService.getAllUsers();
      setUsers(data);
    } catch (err) {
      console.error('Error fetching users:', err);
      showError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  // Add new user
  const handleAddUser = async () => {
    if (!formData.username || !formData.email || !formData.password) {
      showError('Please fill in required fields');
      return;
    }

    try {
      await userService.createUser(formData);
      success('User created successfully');
      setShowAddModal(false);
      resetForm();
      fetchUsers();
    } catch (err) {
      console.error('Error creating user:', err);
      showError(err.error || err.message || 'Failed to create user');
    }
  };

  // Update user
  const handleUpdateUser = async () => {
    try {
      // Only include password if provided
      const dataToUpdate = { ...formData };
      if (!dataToUpdate.password) delete dataToUpdate.password;

      await userService.updateUser(selectedUser.id, dataToUpdate);
      success('User updated successfully');
      setShowEditModal(false);
      resetForm();
      fetchUsers();
    } catch (err) {
      console.error('Error updating user:', err);
      showError(err.error || err.message || 'Failed to update user');
    }
  };

  // Toggle user status
  const toggleUserStatus = async (user) => {
    if (user.role === 'admin' && user.id === 1) { // Assuming ID 1 is the main admin
      showError('Cannot modify main admin status');
      return;
    }

    try {
      const newStatus = user.status === 'active' ? 'inactive' : 'active';
      await userService.updateUser(user.id, { status: newStatus });
      success(`User ${user.username} is now ${newStatus}`);
      fetchUsers();
    } catch (err) {
      console.error('Error updating status:', err);
      showError('Failed to update user status');
    }
  };

  // Prepare edit
  const handleEditClick = (user) => {
    setSelectedUser(user);
    setFormData({
      username: user.username,
      email: user.email,
      password: '', // Don't populate password
      firstName: user.first_name || '',
      lastName: user.last_name || '',
      role: user.role,
      status: user.status || 'active'
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({
      username: '',
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      role: 'user',
      status: 'active'
    });
    setSelectedUser(null);
  };

  // Filter users
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.first_name && user.first_name.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesRole = roleFilter ? user.role === roleFilter : true;
    const matchesStatus = statusFilter ? (user.status || 'active') === statusFilter : true;

    return matchesSearch && matchesRole && matchesStatus;
  });

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
            className="bg-blue-600 text-white px-4 py-2 rounded flex items-center hover:bg-blue-700 transition"
            onClick={() => { resetForm(); setShowAddModal(true); }}
          >
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <select
                className="p-2 border rounded"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
              >
                <option value="">All Roles</option>
                <option value="admin">Admin</option>
                <option value="user">User</option>
              </select>
              <select
                className="p-2 border rounded"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center p-8">
              <ComponentLoader />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left border-b bg-gray-50">
                    <th className="pb-2 px-2 py-3">User</th>
                    <th className="pb-2 px-2 py-3">Email</th>
                    <th className="pb-2 px-2 py-3">Role</th>
                    <th className="pb-2 px-2 py-3">Status</th>
                    <th className="pb-2 px-2 py-3">Last Login</th>
                    <th className="pb-2 px-2 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map(user => (
                      <tr key={user.id} className="border-b hover:bg-gray-50">
                        <td className="py-2 px-2">
                          <div className="font-medium">{user.username}</div>
                          <div className="text-xs text-gray-500">
                            {user.first_name} {user.last_name}
                          </div>
                        </td>
                        <td className="py-2 px-2">{user.email}</td>
                        <td className="py-2 px-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${user.role === 'admin'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-blue-100 text-blue-800'
                            }`}>
                            {user.role.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-2 px-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${(user.status || 'active') === 'active'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                            }`}>
                            {(user.status || 'active').toUpperCase()}
                          </span>
                        </td>
                        <td className="py-2 px-2 text-sm text-gray-600">
                          {user.last_login ? new Date(user.last_login).toLocaleString() : 'Never'}
                        </td>
                        <td className="py-2 px-2">
                          <div className="flex flex-col sm:flex-row gap-1 sm:space-x-2">
                            <button
                              className="text-blue-600 hover:text-blue-800 hover:underline text-sm"
                              onClick={() => handleEditClick(user)}
                            >
                              Edit
                            </button>
                            {user.id !== 1 && ( // Prevent deactivating main admin
                              <button
                                className={`${(user.status || 'active') === 'active' ? 'text-red-600 hover:text-red-800' : 'text-green-600 hover:text-green-800'} hover:underline text-sm`}
                                onClick={() => toggleUserStatus(user)}
                              >
                                {(user.status || 'active') === 'active' ? 'Deactivate' : 'Activate'}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="text-center py-8 text-gray-500">No users found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Add/Edit Modal */}
        {(showAddModal || showEditModal) && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md mx-auto max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">{showAddModal ? 'Add New User' : 'Edit User'}</h3>
                <button
                  className="text-gray-500 text-2xl hover:text-gray-700"
                  onClick={() => { setShowAddModal(false); setShowEditModal(false); }}
                >
                  &times;
                </button>
              </div>

              <div className="space-y-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Username *</label>
                  <input
                    type="text"
                    className="w-full p-2 border rounded bg-gray-50"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    disabled={showEditModal} // Prevent changing username on edit
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                    <input
                      type="text"
                      className="w-full p-2 border rounded"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                    <input
                      type="text"
                      className="w-full p-2 border rounded"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input
                    type="email"
                    className="w-full p-2 border rounded"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {showEditModal ? 'New Password (leave blank to keep current)' : 'Password *'}
                  </label>
                  <input
                    type="password"
                    className="w-full p-2 border rounded"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder={showEditModal ? "Unchanged" : ""}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                    <select
                      className="w-full p-2 border rounded"
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      className="w-full p-2 border rounded"
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:justify-end space-y-2 sm:space-y-0 sm:space-x-2 pt-2 border-t">
                <button
                  className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400 transition"
                  onClick={() => { setShowAddModal(false); setShowEditModal(false); }}
                >
                  Cancel
                </button>
                <button
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
                  onClick={showAddModal ? handleAddUser : handleUpdateUser}
                >
                  {showAddModal ? 'Creates User' : 'Save Changes'}
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