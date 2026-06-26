import React from "react";
import { X, AlertTriangle, HelpCircle } from "lucide-react";

interface CustomModalProps {
  isOpen: boolean;
  type?: "alert" | "confirm";
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel?: () => void;
}

export default function CustomModal({
  isOpen,
  type = "confirm",
  title,
  description,
  confirmText = "確定",
  cancelText = "取消",
  onConfirm,
  onCancel
}: CustomModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-zinc-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
      {/* Neo-brutalist alert box */}
      <div className="bg-white border-4 border-zinc-900 rounded-[2rem] max-w-md w-full p-6 sm:p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative space-y-6">
        
        {/* Header Icon & Title */}
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-2xl border-2 border-zinc-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${
            type === "alert" ? "bg-amber-100 text-amber-600" : "bg-indigo-50 text-indigo-600"
          }`}>
            {type === "alert" ? (
              <AlertTriangle className="w-6 h-6" />
            ) : (
              <HelpCircle className="w-6 h-6" />
            )}
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-black text-zinc-900 uppercase tracking-tight">
              {title}
            </h3>
            <p className="text-sm font-bold text-zinc-500 leading-relaxed">
              {description}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t-2 border-zinc-100">
          {type === "confirm" && onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-5 py-2.5 rounded-xl border-2 border-zinc-900 text-xs font-black bg-white hover:bg-zinc-100 text-zinc-700 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] neo-btn-pressable cursor-pointer"
            >
              {cancelText}
            </button>
          )}
          <button
            type="button"
            onClick={onConfirm}
            className={`px-6 py-2.5 rounded-xl border-2 border-zinc-900 text-xs font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] neo-btn-pressable cursor-pointer ${
              type === "alert" ? "bg-amber-400 text-zinc-900" : "bg-indigo-600 text-white hover:bg-indigo-500"
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
