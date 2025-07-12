import React from 'react';
import { FiUpload, FiPieChart, FiZap, FiUsers, FiClock, FiFileText } from 'react-icons/fi';
import { useAuth } from '../store/auth';

const StatCard = ({ icon, title, value, change, changeType }) => (
  <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
    <div className="flex items-center justify-between">
      <div className="p-3 rounded-lg bg-blue-50 text-blue-600">
        {icon}
      </div>
      <span className={`text-sm font-medium ${changeType === 'increase' ? 'text-green-600' : 'text-red-600'}`}>
        {change}
      </span>
    </div>
    <h3 className="mt-4 text-sm font-medium text-gray-500">{title}</h3>
    <p className="mt-1 text-2xl font-semibold text-gray-900">{value}</p>
  </div>
);

const QuickAction = ({ icon, title, description, actionText, onClick }) => (
  <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
    <div className="flex items-center">
      <div className="p-2 rounded-md bg-blue-100 text-blue-600">
        {icon}
      </div>
      <div className="ml-4">
        <h3 className="text-lg font-medium text-gray-900">{title}</h3>
        <p className="mt-1 text-sm text-gray-500">{description}</p>
      </div>
    </div>
    <button 
      onClick={onClick}
      className="mt-4 inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-500"
    >
      {actionText}
      <svg className="ml-1 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
      </svg>
    </button>
  </div>
);

const RecentActivityItem = ({ icon, title, time, description }) => (
  <div className="flex items-start pb-4 last:pb-0">
    <div className="flex-shrink-0 mt-1 p-2 rounded-md bg-gray-100 text-gray-600">
      {icon}
    </div>
    <div className="ml-4 flex-1">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-gray-900">{title}</h4>
        <span className="text-xs text-gray-500">{time}</span>
      </div>
      <p className="mt-1 text-sm text-gray-500">{description}</p>
    </div>
  </div>
);

const Home = () => {
  console.log('Home component rendered');
  
  // Test authentication
  const { setTestAuth, isLoggedIn, userEmail } = useAuth();
  
  const handleTestAuth = () => {
    setTestAuth('test@example.com');
    console.log('Test auth set');
  };
  
  const quickActions = [
    {
      icon: <FiUpload className="h-5 w-5" />,
      title: 'Import Data',
      description: 'Bring in data from various sources',
      actionText: 'Start Import',
      path: '/dashboard/import'
    },
    {
      icon: <FiPieChart className="h-5 w-5" />,
      title: 'Create Report',
      description: 'Build a new visualization',
      actionText: 'Create Now',
      path: '/dashboard/visualization'
    },
    {
      icon: <FiZap className="h-5 w-5" />,
      title: 'Automate Workflow',
      description: 'Set up automated tasks',
      actionText: 'Set Up',
      path: '/dashboard/automation'
    }
  ];

  const recentActivities = [
    {
      icon: <FiFileText className="h-4 w-4" />,
      title: 'Sales Report Q2',
      time: '2 min ago',
      description: 'You created a new report'
    },
    {
      icon: <FiUsers className="h-4 w-4" />,
      title: 'Team Update',
      time: '1 hour ago',
      description: 'John shared a dashboard with you'
    },
    {
      icon: <FiClock className="h-4 w-4" />,
      title: 'Scheduled Refresh',
      time: '3 hours ago',
      description: 'Your data has been refreshed'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-6 text-white">
        <h1 className="text-2xl font-bold">Welcome back, User!</h1>
        <p className="mt-2 max-w-2xl text-blue-100">
          Here's what's happening with your Excel Analytics Platform today.
        </p>
        <button 
          onClick={handleTestAuth}
          className="mt-4 px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-gray-100"
        >
          Test Auth (Debug)
        </button>
        <div className="mt-2 text-sm">
          Auth Status: {isLoggedIn ? 'Logged In' : 'Not Logged In'} | User: {userEmail || 'None'}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          icon={<FiFileText className="h-6 w-6" />} 
          title="Total Reports" 
          value="24" 
          change="+12%"
          changeType="increase"
        />
        <StatCard 
          icon={<FiUsers className="h-6 w-6" />} 
          title="Team Members" 
          value="8" 
          change="+2"
          changeType="increase"
        />
        <StatCard 
          icon={<FiPieChart className="h-6 w-6" />} 
          title="Datasets" 
          value="42" 
          change="+5"
          changeType="increase"
        />
        <StatCard 
          icon={<FiClock className="h-6 w-6" />} 
          title="Active Sessions" 
          value="3" 
          change="-1"
          changeType="decrease"
        />
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {quickActions.map((action, index) => (
            <QuickAction
              key={index}
              icon={action.icon}
              title={action.title}
              description={action.description}
              actionText={action.actionText}
              onClick={() => console.log(`Navigating to ${action.path}`)}
            />
          ))}
        </div>
      </div>

      {/* Recent Activity and Quick Start */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <div className="bg-white shadow-sm rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h2>
            <div className="divide-y divide-gray-200">
              {recentActivities.map((activity, index) => (
                <RecentActivityItem
                  key={index}
                  icon={activity.icon}
                  title={activity.title}
                  time={activity.time}
                  description={activity.description}
                />
              ))}
            </div>
            <button className="mt-4 text-sm font-medium text-blue-600 hover:text-blue-500">
              View all activity
            </button>
          </div>
        </div>

        {/* Quick Start */}
        <div>
          <div className="bg-white shadow-sm rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Start</h2>
            <ul className="space-y-4">
              <li>
                <a href="#" className="group flex items-center space-x-3">
                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 group-hover:bg-blue-200">
                    1
                  </div>
                  <span className="text-sm font-medium text-gray-700 group-hover:text-blue-600">
                    Connect your data source
                  </span>
                </a>
              </li>
              <li>
                <a href="#" className="group flex items-center space-x-3">
                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 group-hover:bg-gray-200">
                    2
                  </div>
                  <span className="text-sm font-medium text-gray-700 group-hover:text-blue-600">
                    Create your first visualization
                  </span>
                </a>
              </li>
              <li>
                <a href="#" className="group flex items-center space-x-3">
                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 group-hover:bg-gray-200">
                    3
                  </div>
                  <span className="text-sm font-medium text-gray-700 group-hover:text-blue-600">
                    Share with your team
                  </span>
                </a>
              </li>
              <li>
                <a href="#" className="group flex items-center space-x-3">
                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 group-hover:bg-gray-200">
                    4
                  </div>
                  <span className="text-sm font-medium text-gray-700 group-hover:text-blue-600">
                    Set up automated refreshes
                  </span>
                </a>
              </li>
            </ul>
          </div>

          {/* Tips & Tricks */}
          <div className="mt-5 bg-blue-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-blue-800">Pro Tip</h3>
            <p className="mt-1 text-sm text-blue-700">
              Use the <span className="font-mono bg-blue-100 px-1.5 py-0.5 rounded">/</span> command to quickly access any feature.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;