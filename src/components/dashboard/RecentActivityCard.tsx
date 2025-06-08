import React from 'react';
import { ChevronRight, ReceiptIcon, PlaneIcon, BriefcaseIcon, MessageSquare } from 'lucide-react';

interface RecentActivityCardProps {
  title: string;
  description: string;
  type: string;
  date: string;
}

export default function RecentActivityCard({
  title,
  description,
  type,
  date,
}: RecentActivityCardProps) {
  // Determine icon based on type
  const getIcon = () => {
    switch (type) {
      case 'receipt':
        return <ReceiptIcon className="h-5 w-5 text-indigo-600" />;
      case 'travel':
        return <PlaneIcon className="h-5 w-5 text-teal-600" />;
      case 'job_application':
        return <BriefcaseIcon className="h-5 w-5 text-amber-600" />;
      default:
        return <MessageSquare className="h-5 w-5 text-gray-600" />;
    }
  };

  // Determine destination link based on type
  const getLink = () => {
    switch (type) {
      case 'receipt':
        return '/receipts';
      case 'travel':
        return '/travel';
      case 'job_application':
        return '/jobs';
      default:
        return '/dashboard';
    }
  };

  return (
    <li>
      <a href={getLink()} className="block hover:bg-gray-50">
        <div className="px-4 py-4 sm:px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center min-w-0 flex-1">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                  {getIcon()}
                </div>
              </div>
              <div className="min-w-0 flex-1 px-4">
                <div>
                  <p className="text-sm font-medium text-blue-600 truncate">
                    {title}
                  </p>
                  <p className="mt-1 flex items-center text-sm text-gray-500">
                    <span className="truncate">{description}</span>
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center">
              <p className="text-sm text-gray-500 mr-4">{date}</p>
              <ChevronRight className="h-5 w-5 text-gray-400" />
            </div>
          </div>
        </div>
      </a>
    </li>
  );
}