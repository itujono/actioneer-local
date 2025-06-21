import * as React from "react";

/**
 * Reusable Select Component
 *
 * Usage examples:
 *
 * // Basic usage
 * <Select
 *   value={selectedValue}
 *   onChange={(e) => setSelectedValue(e.target.value)}
 *   options={[
 *     { value: "option1", label: "Option 1" },
 *     { value: "option2", label: "Option 2" },
 *   ]}
 * />
 *
 * // With placeholder and small size
 * <Select
 *   value={selectedValue}
 *   onChange={(e) => setSelectedValue(e.target.value)}
 *   placeholder="Choose an option..."
 *   size="sm"
 *   options={options}
 * />
 *
 * // With error state
 * <Select
 *   value={selectedValue}
 *   onChange={(e) => setSelectedValue(e.target.value)}
 *   error={!!validationError}
 *   options={options}
 * />
 */

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "size"> {
  options: SelectOption[];
  placeholder?: string;
  size?: "sm" | "md";
  error?: boolean;
}

// Simple utility to combine class names
const cn = (...classes: (string | undefined | null | false)[]): string => {
  return classes.filter(Boolean).join(" ");
};

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, options, placeholder, size = "md", error, ...props }, ref) => {
    const sizeClasses = {
      sm: "px-3 py-1.5 text-sm",
      md: "px-3 py-2 text-base",
    };

    return (
      <select
        className={cn(
          // Base styles
          "w-full rounded-md border bg-white focus:outline-none focus:ring-2 focus:ring-heliotrope focus:border-heliotrope disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors",
          // Size variants
          sizeClasses[size],
          // Border colors
          error
            ? "border-bittersweet focus:ring-bittersweet focus:border-bittersweet"
            : "border-gray-200 text-black",
          className
        )}
        ref={ref}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
            disabled={option.disabled}
          >
            {option.label}
          </option>
        ))}
      </select>
    );
  }
);
Select.displayName = "Select";

export { Select };
