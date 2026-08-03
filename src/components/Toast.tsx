"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

type ToastProps = {
  message: string;
  type: "success" | "error";
  onClose: () => void;
};

export default function Toast({ message, type, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = type === "success" ? "bg-[#95e1d3]" : "bg-[#ff6b6b]";

  return (
    <div className={`fixed top-4 right-4 z-50 neu-card px-6 py-4 ${bgColor}`}>
      <div className="flex items-center gap-3">
        <p className="font-bold uppercase">{message}</p>
        <button onClick={onClose} className="hover:opacity-70">
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
