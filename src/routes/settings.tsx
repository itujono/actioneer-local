import { createRoute } from "@tanstack/react-router";
import { rootRoute } from "./root";
import { DashboardContainer } from "../components/dashboard";
import { useState } from "react";
import { Checkbox, Button } from "../components/ui";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../components/ui/dialog";
import {
  Settings,
  Mail,
  Users,
  Check,
  Plus,
  Info,
  AlertCircle,
  CreditCard,
  DollarSign,
  Plane,
  Briefcase,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";

export const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/settings",
  component: SettingsDashboard,
});

// Email category configuration
const EMAIL_CATEGORIES = [
  {
    id: "receipt",
    title: "Receipts & Purchases",
    description: "Track purchase receipts, invoices, and subscription payments",
    icon: CreditCard,
    enabled: true,
  },
  {
    id: "revenue",
    title: "Revenue & Income",
    description: "Monitor incoming payments, refunds, and business income",
    icon: DollarSign,
    enabled: true,
  },
  {
    id: "travel",
    title: "Travel & Bookings",
    description:
      "Organize flight confirmations, hotel bookings, and travel itineraries",
    icon: Plane,
    enabled: true,
  },
  {
    id: "job_application",
    title: "Job Applications",
    description: "Track job applications, interviews, and career opportunities",
    icon: Briefcase,
    enabled: true,
  },
] as const;

function SettingsDashboard() {
  const { user } = useAuth();

  // Category toggles state
  const [categorySettings, setCategorySettings] = useState(
    EMAIL_CATEGORIES.reduce((acc, category) => {
      acc[category.id] = category.enabled;
      return acc;
    }, {} as Record<string, boolean>)
  );

  // Multi-account dialog state
  const [showMultiAccountDialog, setShowMultiAccountDialog] = useState(false);
  const [isConnectingAccount, setIsConnectingAccount] = useState(false);

  const handleCategoryToggle = (categoryId: string, enabled: boolean) => {
    setCategorySettings((prev) => ({
      ...prev,
      [categoryId]: enabled,
    }));
    // TODO: Implement backend integration to save settings
    console.log(`Category ${categoryId} ${enabled ? "enabled" : "disabled"}`);
  };

  const handleMultiAccountConnect = async () => {
    setIsConnectingAccount(true);
    // TODO: Implement actual multi-account OAuth flow
    await new Promise((resolve) => setTimeout(resolve, 2000)); // Simulate API call
    setIsConnectingAccount(false);
    setShowMultiAccountDialog(false);
    console.log("Multi-account connection initiated");
  };

  const enabledCategoriesCount =
    Object.values(categorySettings).filter(Boolean).length;
  const totalCategories = EMAIL_CATEGORIES.length;

  return (
    <DashboardContainer
      title="Settings"
      description="Manage your account and email processing preferences"
      maxWidth="6xl"
      className="pb-12"
    >
      {/* 2-1 Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Left Column - 2/3 width */}
        <div className="lg:col-span-2 space-y-8">
          {/* Email Category Settings */}
          <div className="bg-white border-2 border-gray-light rounded-lg p-6">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-start space-x-3">
                <div className="p-2 bg-heliotrope/10 rounded-lg">
                  <Mail className="h-5 w-5 text-heliotrope" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-thunder">
                    Email Categories
                  </h2>
                  <p className="text-sm text-gray mt-1">
                    Choose which types of emails Actioneer should process and
                    analyze
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-thunder">
                  {enabledCategoriesCount}/{totalCategories} enabled
                </div>
                <div className="text-xs text-gray">Categories active</div>
              </div>
            </div>

            <div className="space-y-4">
              {EMAIL_CATEGORIES.map((category) => (
                <div
                  key={category.id}
                  className={`p-4 border rounded-lg transition-all duration-200 cursor-pointer hover:shadow-md ${
                    categorySettings[category.id]
                      ? "border-heliotrope/30 bg-heliotrope/5"
                      : "border-gray-light bg-gray-50 hover:border-heliotrope/40"
                  }`}
                  onClick={() =>
                    handleCategoryToggle(
                      category.id,
                      !categorySettings[category.id]
                    )
                  }
                >
                  <div className="flex items-start space-x-4">
                    <div className="p-2 bg-heliotrope/10 rounded-lg mt-1">
                      <category.icon className="h-5 w-5 text-heliotrope" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <h3 className="text-base font-medium text-thunder">
                            {category.title}
                          </h3>
                          {categorySettings[category.id] && (
                            <div className="flex items-center space-x-1">
                              <Check className="h-3 w-3 text-jade" />
                              <span className="text-xs text-jade font-medium">
                                Processing enabled
                              </span>
                            </div>
                          )}
                        </div>
                        <Checkbox
                          id={`category-${category.id}`}
                          checked={categorySettings[category.id]}
                          onChange={() => {}} // Disabled since card handles the click
                          variant="primary"
                          size="md"
                          className="pointer-events-none" // Prevent double-clicking
                        />
                      </div>
                      <p className="text-sm text-gray mt-1">
                        {category.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {enabledCategoriesCount === 0 && (
              <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  <p className="text-sm text-amber-800">
                    <strong>No categories enabled.</strong> Actioneer won't
                    process any emails until you enable at least one category.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Multi-Account Settings */}
          <div className="bg-white border-2 border-gray-light rounded-lg p-6">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-start space-x-3">
                <div className="p-2 bg-gold/10 rounded-lg">
                  <Users className="h-5 w-5 text-gold" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-thunder">
                    Multi-Account Management
                  </h2>
                  <p className="text-sm text-gray mt-1">
                    Connect multiple Gmail accounts for unified email insights
                  </p>
                </div>
              </div>
              <div className="px-3 py-1 bg-heliotrope/10 text-heliotrope text-xs font-medium rounded-full">
                Coming Soon
              </div>
            </div>

            <div className="space-y-4">
              {/* Current Account */}
              <div className="p-4 border border-jade/30 bg-jade/5 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-jade rounded-full flex items-center justify-center">
                      <Check className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <h3 className="text-base font-medium text-thunder">
                        Primary Gmail Account
                      </h3>
                      <p className="text-sm text-gray">
                        {user?.email || "Loading..."}
                      </p>
                      <p className="text-xs text-gray mt-1">
                        Currently connected and processing emails
                      </p>
                    </div>
                  </div>
                  <div className="text-xs text-jade font-medium bg-jade/10 px-2 py-1 rounded">
                    Active
                  </div>
                </div>
              </div>

              {/* Add Second Account */}
              <div className="p-4 border border-dashed border-gray-light rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gray-lightborder-gray-light rounded-full flex items-center justify-center">
                      <Plus className="h-4 w-4 text-gray-600" />
                    </div>
                    <div>
                      <h3 className="text-base font-medium text-thunder">
                        Add Second Account
                      </h3>
                      <p className="text-sm text-gray">
                        Connect your work or secondary Gmail account
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={() => setShowMultiAccountDialog(true)}
                    variant="outline"
                    size="sm"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Connect
                  </Button>
                </div>
              </div>
            </div>

            <div className="mt-12 p-4 bg-gold border border-gold rounded-lg">
              <div className="flex items-start space-x-4">
                <Info className="h-8 w-8 text-thunder" />
                <div>
                  <p className="text-sm text-thunder">
                    <strong>Multi-account support is coming soon!</strong>{" "}
                    You'll be able to connect up to 2 Gmail accounts and view
                    unified insights across both personal and work emails.
                  </p>
                  <p className="text-xs text-thunder mt-4">
                    This feature will be available in the next update with the
                    same affordable pricing.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - 1/3 width */}
        <div className="lg:col-span-1 space-y-8">
          {/* Account Information */}
          <div className="bg-white border border-gray-light rounded-lg p-6">
            <div className="flex items-start space-x-3 mb-6">
              <div className="p-2 bg-jade/10 rounded-lg">
                <Settings className="h-5 w-5 text-jade" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-thunder">
                  Account Information
                </h2>
                <p className="text-sm text-gray mt-1">
                  Your current subscription and usage details
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="py-4 bg-gray-50 rounded-lg">
                <h3 className="text-sm font-medium text-thunder mb-1">
                  Subscription Plan
                </h3>
                <p className="text-lg font-semibold text-jade">
                  Free Beta Access
                </p>
                <p className="text-xs text-gray">
                  We're completely free to use while in beta • No credit card
                  required
                </p>
              </div>
              <div className="py-4 bg-gray-50 rounded-lg">
                <h3 className="text-sm font-medium text-thunder mb-1">
                  Emails Processed
                </h3>
                <p className="text-lg font-semibold text-jade">1,247</p>
                <p className="text-xs text-gray">
                  This month • Unlimited processing
                </p>
              </div>
            </div>
          </div>

          {/* Quick Stats Card */}
          {/* <div className="bg-white border border-gray-light rounded-lg p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-lime/10 rounded-lg">
                <Mail className="h-5 w-5 text-lime" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-thunder">
                  Quick Stats
                </h3>
                <p className="text-sm text-gray-600">This month's activity</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <CreditCard className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Receipts</span>
                </div>
                <span className="text-sm font-medium text-thunder">342</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Revenue</span>
                </div>
                <span className="text-sm font-medium text-thunder">89</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Plane className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Travel</span>
                </div>
                <span className="text-sm font-medium text-thunder">12</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Briefcase className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Jobs</span>
                </div>
                <span className="text-sm font-medium text-thunder">23</span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-thunder">
                  Total Processed
                </span>
                <span className="text-lg font-semibold text-heliotrope">
                  466
                </span>
              </div>
            </div>
          </div> */}
        </div>
      </div>

      {/* Multi-Account Connection Dialog */}
      <Dialog
        open={showMultiAccountDialog}
        onOpenChange={setShowMultiAccountDialog}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-gold" />
              <span>Connect Second Account</span>
            </DialogTitle>
            <DialogDescription>
              Add your work or secondary Gmail account to get unified insights
              across both accounts.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="text-sm font-medium text-blue-900 mb-2">
                  What you'll get:
                </h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li className="flex items-center space-x-2">
                    <Check className="h-3 w-3 text-blue-600" />
                    <span>Unified dashboard for both accounts</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <Check className="h-3 w-3 text-blue-600" />
                    <span>Separate or combined analytics</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <Check className="h-3 w-3 text-blue-600" />
                    <span>Same affordable pricing</span>
                  </li>
                </ul>
              </div>

              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  <p className="text-sm text-amber-800">
                    This feature is currently in development and will be
                    available soon.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowMultiAccountDialog(false)}
            >
              Close
            </Button>
            <Button
              onClick={handleMultiAccountConnect}
              loading={isConnectingAccount}
              disabled
            >
              <Plus className="h-4 w-4 mr-2" />
              Connect Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardContainer>
  );
}
