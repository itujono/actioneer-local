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

  const variantClasses = {
    default: "text-heliotrope focus:ring-heliotrope",
    primary: "text-jade focus:ring-jade",
  };

  const checkboxClasses = `
    ${sizeClasses[size]}
    ${variantClasses[variant]}
    border-concrete rounded
    disabled:opacity-50 disabled:cursor-not-allowed
    focus:ring-2 focus:ring-offset-0
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
