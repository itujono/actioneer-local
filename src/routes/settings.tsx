import { createRoute } from "@tanstack/react-router";
import { rootRoute } from "./root";
import { PageTitle } from "../components/ui";

export const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/settings",
  component: SettingsDashboard,
});

function SettingsDashboard() {
  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <PageTitle
          title="Settings"
          description="Manage your account settings and preferences"
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 mt-8">
        <div className="bg-white rounded-lg shadow px-5 py-6 sm:px-6">
          <div className="border-4 border-dashed border-concrete rounded-lg h-96 flex items-center justify-center">
            <p className="text-thunder">Settings dashboard coming soon</p>
          </div>
        </div>
      </div>
    </div>
  );
}
