import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-indigo-600">ExpenseFlow</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">
                {user?.firstName} {user?.lastName}
              </span>
              <span className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm">
                {user?.role}
              </span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Welcome, {user?.firstName}!
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <div className="bg-blue-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-blue-900">Company Information</h3>
                <div className="mt-4 space-y-2">
                  <p><span className="font-medium">Company:</span> {user?.company?.name}</p>
                  <p><span className="font-medium">Country:</span> {user?.company?.country}</p>
                  <p><span className="font-medium">Currency:</span> {user?.company?.currencyCode}</p>
                </div>
              </div>

              <div className="bg-green-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-green-900">User Information</h3>
                <div className="mt-4 space-y-2">
                  <p><span className="font-medium">Email:</span> {user?.email}</p>
                  <p><span className="font-medium">Role:</span> {user?.role}</p>
                  <p><span className="font-medium">Status:</span> Active</p>
                </div>
              </div>
            </div>

            <div className="mt-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {user?.role === 'employee' && (
                  <button className="p-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                    Submit Expense
                  </button>
                )}
                {(user?.role === 'manager' || user?.role === 'admin') && (
                  <button className="p-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                    Review Approvals
                  </button>
                )}
                {user?.role === 'admin' && (
                  <button className="p-4 bg-green-600 text-white rounded-lg hover:bg-green-700">
                    Manage Users
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;