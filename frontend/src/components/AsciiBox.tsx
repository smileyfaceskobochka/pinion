import type { ReactNode } from "react";

interface AsciiBoxProps {
  children: ReactNode;
  title?: string;
  className?: string;
  borderColor?: string;
}

export function AsciiBox({ children, title, className = "", borderColor = "border-surface1" }: AsciiBoxProps) {
  const textColor = borderColor.replace('border-', 'text-');

  return (
    <div className={`relative flex flex-col bg-base ${className}`}>
      {/* Top Border */}
      <div className={`flex w-full select-none leading-none ${textColor} mt-[-2px]`}>
        <span>┌</span>
        <div className="flex-1 overflow-hidden whitespace-nowrap">
          {'─'.repeat(500)}
        </div>
        <span>┐</span>
      </div>

      {title && (
        <div className="absolute top-0 left-4 -mt-[4px] bg-base px-2 text-mauve font-bold whitespace-nowrap z-10">
          {title}
        </div>
      )}

      {/* Middle section with side borders */}
      <div className={`relative z-10 border-l border-r ${borderColor} mx-[4px] p-4 md:p-6`}>
        {children}
      </div>

      {/* Bottom Border */}
      <div className={`flex w-full select-none leading-[0.5] ${textColor} mb-[-2px]`}>
        <span>└</span>
        <div className="flex-1 overflow-hidden whitespace-nowrap">
          {'─'.repeat(500)}
        </div>
        <span>┘</span>
      </div>
    </div>
  );
}
