interface CheckboxProps {
  id?: string;
  label?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "primary";
}

export function Checkbox({
  id,
  label,
  checked,
  onChange,
  disabled = false,
  required = false,
  error,
  className = "",
  size = "md",
  variant = "default",
}: CheckboxProps) {
  const sizeClasses = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  const checkboxClasses = `
    ${sizeClasses[size]}
    appearance-none
    border-2 rounded-md
    cursor-pointer
    transition-all duration-200 ease-in-out
    focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-heliotrope
    relative
    ${
      checked
        ? "bg-heliotrope border-heliotrope"
        : "border-concrete bg-white hover:border-heliotrope/60"
    }
    ${disabled ? "opacity-50 cursor-not-allowed" : ""}
    ${error ? "border-bittersweet" : ""}
    ${className}
  `
    .trim()
    .replace(/\s+/g, " ");

  const labelClasses = `
    text-sm text-thunder
    ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
  `
    .trim()
    .replace(/\s+/g, " ");

  return (
    <div className="space-y-1">
      <div className="flex items-center space-x-2">
        <div className="relative">
          <input
            type="checkbox"
            id={id}
            checked={checked}
            onChange={(e) => onChange(e.target.checked)}
            disabled={disabled}
            required={required}
            className={checkboxClasses}
            aria-describedby={error ? `${id}-error` : undefined}
          />
          {/* Custom checkmark */}
          {checked && (
            <div className="absolute inset-0 -top-1 flex items-center justify-center pointer-events-none">
              <svg
                className="w-3 h-3 text-white"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          )}
        </div>
        {label && (
          <label htmlFor={id} className={labelClasses}>
            {label}
            {required && <span className="text-bittersweet ml-1">*</span>}
          </label>
        )}
      </div>
      {error && (
        <p id={`${id}-error`} className="text-sm text-bittersweet">
          {error}
        </p>
      )}
    </div>
  );
}
