import React from 'react';
import { Link } from '@tanstack/react-router';
import { ChevronRight } from 'lucide-react';

interface DashboardCardProps {
  title: string;
  value: string;
  description: string;
  icon: React.ReactNode;
  iconBackground: string;
  link: string;
}

export default function DashboardCard({
  title,
  value,
  description,
  icon,
  iconBackground,
  link,
}: DashboardCardProps) {
  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="p-5">
        <div className="flex items-center">
          <div className={`flex-shrink-0 rounded-md p-3 ${iconBackground}`}>
            {React.cloneElement(icon as React.ReactElement, {
              className: 'h-6 w-6 text-white',
            })}
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
              <dd>
                <div className="text-lg font-medium text-gray-900">{value}</div>
              </dd>
            </dl>
          </div>
        </div>
      </div>
      <div className="bg-gray-50 px-5 py-3">
        <div className="text-sm">
          <Link
            to={link}
            className="font-medium text-blue-700 hover:text-blue-900 flex items-center"
          >
            <span className="flex-1">{description}</span>
            <ChevronRight className="h-5 w-5" />
          </Link>
        </div>
      </div>
    </div>
  );
}