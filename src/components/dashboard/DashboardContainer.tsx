import React from "react";
import { Button } from "../ui/button";
import { ArrowLeft } from "lucide-react";

interface DashboardContainerProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  headerActions?: React.ReactNode;
  maxWidth?: "4xl" | "5xl" | "6xl" | "7xl";
  className?: string;
  backButtonText?: string;
}

export function DashboardContainer({
  title,
  description,
  children,
  headerActions,
  maxWidth = "7xl",
  className = "",
  backButtonText,
}: DashboardContainerProps) {
  const maxWidthClass = {
    "4xl": "max-w-4xl",
    "5xl": "max-w-5xl",
    "6xl": "max-w-6xl",
    "7xl": "max-w-7xl",
  }[maxWidth];

  return (
    <div className={`py-6 ${className}`}>
      <div className={`${maxWidthClass} mx-auto px-4 sm:px-6 md:px-8`}>
        {/* Back Button */}
        {backButtonText && (
          <div className="mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.history.back()}
              className="text-thunder hover:text-thunder/80 p-0 h-auto font-normal"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {backButtonText}
            </Button>
          </div>
        )}

        {/* Page Header */}
        <div className="md:flex md:items-center md:justify-between mb-6">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold leading-7 text-thunder sm:text-2xl sm:truncate">
              {title}
            </h1>
            {description && (
              <p className="mt-1 text-sm text-thunder">{description}</p>
            )}
          </div>
          {headerActions && (
            <div className="mt-4 flex md:mt-0 md:ml-4 space-x-3">
              {headerActions}
            </div>
          )}
        </div>

        {/* Page Content */}
        {children}
      </div>
    </div>
  );
}
