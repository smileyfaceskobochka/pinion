import { forwardRef, type InputHTMLAttributes } from "react";

interface TerminalInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export const TerminalInput = forwardRef<HTMLInputElement, TerminalInputProps>(
  ({ label, error, className = "", ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1 w-full">
        <label className="text-blue text-[10px] font-bold uppercase tracking-wider">
          {label}
        </label>
        <div className="relative group">
          <span className="absolute left-0 top-1/2 -translate-y-1/2 text-surface2 font-bold pl-3 pointer-events-none group-focus-within:text-mauve transition-colors">
            {">"}
          </span>
          <input
            ref={ref}
            className={`
              w-full bg-surface0 border border-surface1 px-8 py-2 
              text-text font-mono focus:outline-none focus:border-mauve 
              transition-colors placeholder:text-surface2 placeholder:italic
              ${error ? "border-red focus:border-red" : ""}
              ${className}
            `}
            {...props}
          />
        </div>
        {error && (
          <span className="text-red text-[10px] italic mt-1 bg-red/10 px-2 border-l border-red">
            {`bash: input error: ${error}`}
          </span>
        )}
      </div>
    );
  }
);

TerminalInput.displayName = "TerminalInput";
