import { createRoute } from '@tanstack/react-router';
import { rootRoute } from './root';

export const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/settings',
  component: SettingsDashboard,
});

function SettingsDashboard() {
  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage your account settings and preferences
        </p>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 mt-8">
        <div className="bg-white rounded-lg shadow px-5 py-6 sm:px-6">
          <div className="border-4 border-dashed border-gray-200 rounded-lg h-96 flex items-center justify-center">
            <p className="text-gray-500">Settings dashboard coming soon</p>
          </div>
        </div>
      </div>
    </div>
  );
}