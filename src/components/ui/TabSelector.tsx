import React from "react";

export interface TabOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface TabSelectorProps {
  options: TabOption[];
  value: string;
  onChange: (value: string) => void;
  label?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
  disabled?: boolean;
}

export function TabSelector({
  options,
  value,
  onChange,
  label,
  size = "md",
  className = "",
  disabled = false,
}: TabSelectorProps) {
  const sizeClasses = {
    sm: "px-2 py-1 text-xs",
    md: "px-3 py-1.5 text-sm",
    lg: "px-4 py-2 text-base",
  };

  const containerSizeClasses = {
    sm: "p-0.5",
    md: "p-1",
    lg: "p-1.5",
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {label && <span className="text-sm font-medium text-black">{label}</span>}
      <div
        className={`flex bg-concrete/80 rounded-lg ${containerSizeClasses[size]}`}
      >
        {options.map((option) => (
          <button
            key={option.value}
            onClick={() =>
              !disabled && !option.disabled && onChange(option.value)
            }
            disabled={disabled || option.disabled}
            className={`${
              sizeClasses[size]
            } font-medium rounded-md transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
              value === option.value
                ? "bg-white text-heliotrope shadow-sm"
                : "text-thunder/50 hover:text-black disabled:hover:text-thunder/50"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
