import type { ReactNode } from "react";
import { AsciiBox } from "./AsciiBox";

interface AsciiModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export function AsciiModal({ isOpen, onClose, title, children }: AsciiModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-base/80 backdrop-blur-sm">
      <div className="w-full max-w-2xl animate-in fade-in zoom-in duration-150">
        <AsciiBox title={` ${title} `} borderColor="border-mauve" className="shadow-2xl shadow-mauve/10">
          <div className="flex flex-col gap-6">
            <div className="flex justify-between items-center -mt-2 mb-4 border-b border-surface1 border-dashed pb-2">
              <span className="text-subtext0 text-xs italic">System Prompt: Input Required</span>
              <button 
                onClick={onClose}
                className="text-red hover:bg-red/10 px-2 font-bold transition-colors"
                title="Abort [ESC]"
              >
                [ X ]
              </button>
            </div>
            
            {children}
          </div>
        </AsciiBox>
      </div>
    </div>
  );
}
