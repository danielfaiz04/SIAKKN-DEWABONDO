"use client";

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
};

export default function DashboardModal({ isOpen, onClose, title, children }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="neu-card bg-white p-6 max-w-md w-full max-h-[80vh] overflow-y-auto">
        <h3 className="text-xl font-bold uppercase mb-4 border-b-3 border-black pb-2">{title}</h3>
        <div className="mb-4">
          {children}
        </div>
        <button 
          onClick={onClose}
          className="neu-btn w-full bg-[#ff6b6b] px-4 py-2 font-bold uppercase"
        >
          Tutup
        </button>
      </div>
    </div>
  );
}
