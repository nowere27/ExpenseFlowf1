import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import UserManagement from '../components/admin/UserManagement';
import { Users, Settings, LogOut } from 'lucide-react';

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('users');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-indigo-600">ExpenseFlow</h1>
              <span className="ml-4 text-gray-600">Admin Portal</span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">
                {user?.firstName} {user?.lastName}
              </span>
              <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                Admin
              </span>
              <button
                onClick={handleLogout}
                className="flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Sidebar and Content */}
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-white min-h-screen shadow-md">
          <div className="p-4">
            <button
              onClick={() => setActiveTab('users')}
              className={`flex items-center w-full px-4 py-3 rounded-lg mb-2 ${
                activeTab === 'users'
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Users className="h-5 w-5 mr-3" />
              User Management
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`flex items-center w-full px-4 py-3 rounded-lg ${
                activeTab === 'settings'
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Settings className="h-5 w-5 mr-3" />
              Settings
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {activeTab === 'users' && <UserManagement />}
          {activeTab === 'settings' && (
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4">Settings</h2>
              <p className="text-gray-600">Settings coming soon...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;