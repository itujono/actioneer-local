import React from "react";

interface PageTitleProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
}

export function PageTitle({ title, description, children }: PageTitleProps) {
  return (
    <div className="md:flex md:items-center md:justify-between">
      <div className="flex-1 min-w-0">
        <h1 className="text-2xl font-bold leading-7 text-thunder sm:text-2xl sm:truncate">
          {title}
        </h1>
        {description && (
          <p className="mt-1 text-sm text-thunder">{description}</p>
        )}
      </div>
      {children && (
        <div className="mt-4 flex md:mt-0 md:ml-4 space-x-3">{children}</div>
      )}
    </div>
  );
}
