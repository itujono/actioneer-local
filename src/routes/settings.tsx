import { createRoute } from "@tanstack/react-router";
import { rootRoute } from "./root";
import { PageTitle, Input, Button } from "../components/ui";
import { useState } from "react";
import { Search, User, Mail } from "lucide-react";

export const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/settings",
  component: SettingsDashboard,
});

function SettingsDashboard() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    company: "",
    salary: "",
    search: "",
    bio: "",
    website: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange =
    (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData((prev) => ({ ...prev, [field]: e.target.value }));
      // Clear error when user starts typing
      if (errors[field]) {
        setErrors((prev) => ({ ...prev, [field]: "" }));
      }
    };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = "First name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      alert("Form submitted successfully! (This is just a demo)");
    }
  };

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <PageTitle
          title="Settings & Input Component Demo"
          description="Showcasing the reusable Input component with various configurations"
        />
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8 mt-8 space-y-8">
        {/* Profile Settings Form */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-concrete">
            <h3 className="text-lg font-medium text-thunder">
              Profile Settings
            </h3>
            <p className="text-sm text-thunder">
              Update your personal information
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Basic Text Inputs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="First Name"
                value={formData.firstName}
                onChange={handleInputChange("firstName")}
                placeholder="Enter your first name"
                error={errors.firstName}
                required
              />

              <Input
                label="Last Name"
                value={formData.lastName}
                onChange={handleInputChange("lastName")}
                placeholder="Enter your last name"
              />
            </div>

            {/* Email and Phone */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                type="email"
                label="Email Address"
                value={formData.email}
                onChange={handleInputChange("email")}
                placeholder="your@email.com"
                error={errors.email}
                leftIcon={<Mail className="h-4 w-4" />}
                required
              />

              <Input
                type="tel"
                label="Phone Number"
                value={formData.phone}
                onChange={handleInputChange("phone")}
                placeholder="+1 (555) 123-4567"
                helperText="Include country code for international numbers"
              />
            </div>

            {/* Company and Salary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Company"
                value={formData.company}
                onChange={handleInputChange("company")}
                placeholder="Your company name"
                leftIcon={<User className="h-4 w-4" />}
              />

              <Input
                type="number"
                label="Annual Salary"
                value={formData.salary}
                onChange={handleInputChange("salary")}
                placeholder="0"
                leftAddon="$"
                step={1000}
                min={0}
                helperText="Optional: Used for financial tracking"
              />
            </div>

            {/* Website with different size */}
            <Input
              type="url"
              label="Website"
              value={formData.website}
              onChange={handleInputChange("website")}
              placeholder="https://yourwebsite.com"
              size="lg"
              helperText="Your personal or company website"
            />

            {/* Search Input Demo */}
            <Input
              label="Search Demo"
              value={formData.search}
              onChange={handleInputChange("search")}
              placeholder="Try searching for something..."
              leftIcon={<Search className="h-4 w-4" />}
              size="sm"
              helperText="This demonstrates the search input variant"
            />

            {/* Submit Button */}
            <div className="flex justify-end pt-4 border-t border-concrete">
              <Button type="submit" variant="primary">
                Save Changes
              </Button>
            </div>
          </form>
        </div>

        {/* Component Examples Documentation */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-concrete">
            <h3 className="text-lg font-medium text-thunder">
              Input Component Features
            </h3>
            <p className="text-sm text-thunder">
              This page demonstrates the versatile Input component capabilities
            </p>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h4 className="font-medium text-thunder mb-3">✨ Features</h4>
                <ul className="space-y-2 text-sm text-thunder">
                  <li>• Automatic label and error handling</li>
                  <li>• Left/right icons and addons</li>
                  <li>• Three sizes: sm, md (default), lg</li>
                  <li>• Type safety with TypeScript</li>
                  <li>• Consistent styling with design system</li>
                  <li>• Required field indicators</li>
                  <li>• Helper text support</li>
                  <li>• Error state styling</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium text-thunder mb-3">
                  🎯 Input Types Supported
                </h4>
                <ul className="space-y-2 text-sm text-thunder">
                  <li>• text (default)</li>
                  <li>• email</li>
                  <li>• password</li>
                  <li>• number</li>
                  <li>• tel</li>
                  <li>• url</li>
                  <li>• search</li>
                  <li>• date, time, datetime-local</li>
                </ul>
              </div>
            </div>

            <div className="mt-6 p-4 bg-concrete rounded-lg">
              <h4 className="font-medium text-thunder mb-2">💡 Usage Tip</h4>
              <p className="text-sm text-thunder">
                The Input component automatically handles focus states, disabled
                states, and integrates seamlessly with our design system. Use it
                consistently across the app for better UX!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
