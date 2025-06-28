import React from "react";
import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";

interface DashboardCardProps {
  title: string;
  value: string;
  description: string;
  icon: React.ReactNode;
  iconBackground: string;
  link: string;
  additionalInfo?: React.ReactNode;
}

export default function DashboardCard({
  title,
  value,
  description,
  icon,
  iconBackground,
  link,
  additionalInfo,
}: DashboardCardProps) {
  return (
    <div className="bg-white overflow-hidden rounded-lg border-2 border-gray-light flex flex-col h-full">
      <div className="p-5 flex-1">
        <div className="flex items-center">
          <div className={`flex-shrink-0 rounded-md p-3 ${iconBackground}`}>
            {React.cloneElement(icon as React.ReactElement, {
              className: "h-6 w-6 text-thunder",
            })}
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-thunder truncate">
                {title}
              </dt>
              <dd>
                <div className="text-lg font-medium text-thunder">{value}</div>
              </dd>
            </dl>
          </div>
        </div>
        {additionalInfo}
      </div>
      <div className="bg-concrete px-5 py-3 mt-auto">
        <div className="text-sm">
          <Link
            to={link}
            className="font-medium text-thunder hover:text-thunder flex items-center"
          >
            <span className="flex-1">{description}</span>
            <ChevronRight className="h-5 w-5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
