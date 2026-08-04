"use client";

import { useRef, useEffect } from "react";

type CameraPreviewProps = {
  videoId: string;
  isOpen: boolean;
  onCapture?: () => void;
  showCaptureButton?: boolean;
  photoBase64?: string;
  showPhoto?: boolean;
  photoLabel?: string;
};

export default function CameraPreview({
  videoId,
  isOpen,
  onCapture,
  showCaptureButton = true,
  photoBase64,
  showPhoto = true,
  photoLabel = "Foto yang Diambil"
}: CameraPreviewProps) {
  return (
    <>
      {isOpen && (
        <div className="neu-card bg-black p-4">
          <div className="overflow-hidden rounded border-3 border-black shadow-[2px_2px_0px_0px_#1a1a1a]">
            <video
              id={videoId}
              autoPlay
              playsInline
              muted
              className="w-full object-contain bg-black"
              style={{ maxHeight: '300px' }}
            />
          </div>
          {showCaptureButton && onCapture && (
            <button
              type="button"
              onClick={onCapture}
              className="neu-btn mt-3 w-full bg-[#4ecdc4] px-4 py-2 text-sm font-bold uppercase"
            >
              Ambil Foto
            </button>
          )}
        </div>
      )}
      {showPhoto && photoBase64 && (
        <div className="neu-card bg-white p-4">
          <p className="text-sm font-bold uppercase mb-2">{photoLabel}</p>
          <div className="overflow-hidden rounded border-3 border-black shadow-[2px_2px_0px_0px_#1a1a1a]">
            <img
              src={photoBase64}
              alt="Captured"
              className="w-full object-contain"
              style={{ maxHeight: '300px' }}
            />
          </div>
        </div>
      )}
    </>
  );
}
