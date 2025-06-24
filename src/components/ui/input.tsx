import * as React from "react";

/**
 * Reusable Input Component
 *
 * Usage examples:
 *
 * // Basic text input
 * <Input
 *   label="Full Name"
 *   value={name}
 *   onChange={(e) => setName(e.target.value)}
 *   placeholder="Enter your name"
 * />
 *
 * // Email input with validation
 * <Input
 *   type="email"
 *   label="Email Address"
 *   value={email}
 *   onChange={(e) => setEmail(e.target.value)}
 *   error={emailError}
 *   required
 * />
 *
 * // Number input with size variant
 * <Input
 *   type="number"
 *   label="Age"
 *   value={age}
 *   onChange={(e) => setAge(e.target.value)}
 *   size="sm"
 *   min={0}
 *   max={120}
 * />
 *
 * // Input with left icon
 * <Input
 *   label="Search"
 *   value={search}
 *   onChange={(e) => setSearch(e.target.value)}
 *   leftIcon={<Search className="h-4 w-4" />}
 *   placeholder="Search..."
 * />
 *
 * // Currency input
 * <Input
 *   type="number"
 *   label="Price"
 *   value={price}
 *   onChange={(e) => setPrice(e.target.value)}
 *   leftAddon="$"
 *   placeholder="0.00"
 *   step={0.01}
 * />
 */

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  label?: string;
  error?: string;
  size?: "sm" | "md" | "lg";
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  leftAddon?: string;
  rightAddon?: string;
  helperText?: string;
  containerClassName?: string;
}

// Simple utility to combine class names
const cn = (...classes: (string | undefined | null | false)[]): string => {
  return classes.filter(Boolean).join(" ");
};

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type = "text",
      label,
      error,
      size = "md",
      leftIcon,
      rightIcon,
      leftAddon,
      rightAddon,
      helperText,
      containerClassName,
      required,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseClasses = cn(
      "w-full rounded-md border-2 bg-white border-gray-light",
      "focus:outline-none focus:ring-0 focus:ring-heliotrope focus:border-heliotrope",
      "disabled:bg-concrete disabled:text-thunder disabled:cursor-not-allowed",
      "transition-colors placeholder-gray-500"
    );

    const sizeClasses = {
      sm: "px-3 py-1.5 text-sm",
      md: "px-3 py-2 text-base",
      lg: "px-4 py-3 text-lg",
    };

    const borderClasses = error
      ? "border-bittersweet focus:ring-bittersweet focus:border-bittersweet"
      : "border-concrete text-black";

    // Adjust padding when icons or addons are present
    const paddingClasses = cn(
      sizeClasses[size],
      leftIcon ? "pl-10" : false,
      rightIcon ? "pr-10" : false,
      leftAddon ? "pl-12" : false,
      rightAddon ? "pr-12" : false
    );

    const inputElement = (
      <div className="relative">
        {/* Left addon */}
        {leftAddon && (
          <div className="absolute inset-y-0 left-0 flex items-center pl-3">
            <span className="text-thunder text-sm font-medium">
              {leftAddon}
            </span>
          </div>
        )}

        {/* Left icon */}
        {leftIcon && !leftAddon && (
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none group">
            <div className="text-thunder group-focus:text-heliotrope">
              {leftIcon}
            </div>
          </div>
        )}

        {/* Input field */}
        <input
          className={cn(baseClasses, borderClasses, paddingClasses, className)}
          type={type}
          disabled={disabled}
          ref={ref}
          {...props}
        />

        {/* Right icon */}
        {rightIcon && !rightAddon && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <div className="text-concrete">{rightIcon}</div>
          </div>
        )}

        {/* Right addon */}
        {rightAddon && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            <span className="text-thunder text-sm font-medium">
              {rightAddon}
            </span>
          </div>
        )}
      </div>
    );

    // If no label, return just the input
    if (!label) {
      return (
        <div className={containerClassName}>
          {inputElement}
          {/* Helper text or error */}
          {(helperText || error) && (
            <p
              className={cn(
                "mt-1 text-sm",
                error ? "text-bittersweet" : "text-concrete"
              )}
            >
              {error || helperText}
            </p>
          )}
        </div>
      );
    }

    // Return input with label wrapper
    return (
      <div className={cn("space-y-1", containerClassName)}>
        <label className="block text-sm font-medium text-thunder">
          {label}
          {required && <span className="text-bittersweet ml-1">*</span>}
        </label>
        {inputElement}
        {/* Helper text or error */}
        {(helperText || error) && (
          <p
            className={cn(
              "text-sm",
              error ? "text-bittersweet" : "text-concrete"
            )}
          >
            {error || helperText}
          </p>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";

export { Input };
