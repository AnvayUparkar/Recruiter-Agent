import React, { useState } from "react";
import { Search, X } from "lucide-react";
import { cn } from "../../../utils/cn";

export interface SearchInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  isLoading?: boolean;
  onSearch?: (value: string) => void;
  onChange?: (value: string) => void;
  onClear?: () => void;
}

export const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  ({ isLoading = false, onSearch, onChange, onClear, className, value: customValue, defaultValue, ...props }, ref) => {
    const [value, setValue] = useState(String(defaultValue || ""));
    const displayValue = customValue !== undefined ? String(customValue) : value;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      if (customValue === undefined) {
        setValue(val);
      }
      if (onChange) onChange(val);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && onSearch) {
        onSearch(displayValue);
      }
    };

    const handleClear = () => {
      if (customValue === undefined) {
        setValue("");
      }
      if (onChange) onChange("");
      if (onClear) onClear();
    };

    return (
      <div className="relative w-full font-sans">
        {/* Search Icon */}
        <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center pointer-events-none text-text-muted">
          <Search className="h-5 w-5" />
        </div>

        {/* Input */}
        <input
          ref={ref}
          type="text"
          value={displayValue}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          className={cn(
            "w-full bg-glass text-text-primary border border-glass-border rounded-lg pl-10 pr-10 py-2.5 text-body-md transition-all duration-300 outline-none focus:outline-none focus:border-accent focus:shadow-glow placeholder:text-text-muted",
            className
          )}
          {...props}
        />

        {/* Action Indicators (Loader / Clear button) */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
          {isLoading && (
            <svg
              className="animate-spin h-4 w-4 text-accent"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          )}
          {!isLoading && displayValue && (
            <button
              type="button"
              onClick={handleClear}
              className="text-text-muted hover:text-text-primary p-0.5 rounded transition-colors"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    );
  }
);

SearchInput.displayName = "SearchInput";
export default SearchInput;
