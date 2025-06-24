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
          description="Manage your account and preferences"
        />
        <div className="mt-8">
          <h2 className="text-2xl font-bold text-gray-800">
            Account Information
          </h2>
        </div>
      </div>
    </div>
  );
}
