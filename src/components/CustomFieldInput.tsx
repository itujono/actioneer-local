import React from "react";
import { CustomFieldDefinition } from "../supabase/types";

interface CustomFieldInputProps {
  field: CustomFieldDefinition;
  value: any;
  onChange: (value: any) => void;
  error?: string;
  disabled?: boolean;
}

export function CustomFieldInput({
  field,
  value,
  onChange,
  error,
  disabled,
}: CustomFieldInputProps) {
  const baseInputClasses = `w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500 ${
    error ? "border-red-300" : "border-gray-300"
  }`;

  const handleChange = (newValue: any) => {
    onChange(newValue);
  };

  const renderInput = () => {
    switch (field.field_type) {
      case "text":
        return (
          <input
            type="text"
            value={value || ""}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={field.field_options.placeholder}
            disabled={disabled}
            className={baseInputClasses}
          />
        );

      case "number":
        return (
          <input
            type="number"
            value={value || ""}
            onChange={(e) =>
              handleChange(e.target.value ? Number(e.target.value) : null)
            }
            min={field.field_options.min}
            max={field.field_options.max}
            disabled={disabled}
            className={baseInputClasses}
          />
        );

      case "currency":
        return (
          <div className="relative">
            <span className="absolute left-3 top-2 text-gray-500 text-sm">
              {field.field_options.currency || "USD"}
            </span>
            <input
              type="number"
              value={value || ""}
              onChange={(e) =>
                handleChange(e.target.value ? Number(e.target.value) : null)
              }
              min={field.field_options.min || 0}
              max={field.field_options.max}
              step="0.01"
              disabled={disabled}
              className={`${baseInputClasses} pl-12`}
              placeholder="0.00"
            />
          </div>
        );

      case "date":
        return (
          <input
            type="date"
            value={value || ""}
            onChange={(e) => handleChange(e.target.value)}
            disabled={disabled}
            className={baseInputClasses}
          />
        );

      case "select":
        return (
          <select
            value={value || ""}
            onChange={(e) => handleChange(e.target.value)}
            disabled={disabled}
            className={baseInputClasses}
          >
            <option value="">Select an option...</option>
            {field.field_options.options?.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        );

      case "boolean":
        return (
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={value === true}
              onChange={(e) => handleChange(e.target.checked)}
              disabled={disabled}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50"
            />
            <span className="text-sm text-gray-700">
              {value === true ? "Yes" : "No"}
            </span>
          </label>
        );

      default:
        return (
          <input
            type="text"
            value={value || ""}
            onChange={(e) => handleChange(e.target.value)}
            disabled={disabled}
            className={baseInputClasses}
          />
        );
    }
  };

  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-gray-700">
        {field.field_label}
        {field.is_required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {renderInput()}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}

// Table cell renderer for custom fields
interface CustomFieldCellProps {
  field: CustomFieldDefinition;
  value: any;
}

export function CustomFieldCell({ field, value }: CustomFieldCellProps) {
  if (value === null || value === undefined || value === "") {
    return <span className="text-gray-400">—</span>;
  }

  const formatValue = () => {
    switch (field.field_type) {
      case "currency":
        const currency = field.field_options.currency || "USD";
        return new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: currency.toUpperCase(),
        }).format(Number(value) || 0);

      case "number":
        return Number(value).toLocaleString();

      case "date":
        return new Date(value).toLocaleDateString();

      case "boolean":
        return value ? "Yes" : "No";

      case "select":
      case "text":
      default:
        return String(value);
    }
  };

  return <span className="text-sm text-gray-900">{formatValue()}</span>;
}
