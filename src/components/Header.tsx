import React from 'react';
import { Wifi, WifiOff, Loader2 } from 'lucide-react';
import { SyncStatus } from '../types';

interface HeaderProps {
  syncStatus: SyncStatus;
  loadingProgress?: {
    isLoading: boolean;
    percent: number;
  };
}

export const Header: React.FC<HeaderProps> = ({ syncStatus, loadingProgress }) => {
  const isLoading = loadingProgress?.isLoading || syncStatus.isLoading;
  const percent = loadingProgress?.percent ?? 0;

  return (
    <header id="medical-header" className="border-b border-[#1A1A1A] bg-[#F4F1EA] relative">
      <div className="px-3.5 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 bg-[#1A1A1A] text-[#F4F1EA] flex items-center justify-center font-mono-tech text-[9px] font-bold tracking-tighter shrink-0">
            MED
          </div>
          <h1 className="text-lg font-bold uppercase leading-none tracking-tight text-[#1A1A1A] font-editorial">
            TRA CỨU Y TẾ
          </h1>
        </div>

        <div className="flex items-center gap-1.5 font-mono-tech text-[10px] uppercase font-bold">
          {isLoading ? (
            <span className="flex items-center gap-1 text-[#8B0000] bg-[#8B0000]/10 px-2 py-0.5 border border-[#8B0000]/30 animate-pulse">
              <Loader2 className="w-2.5 h-2.5 animate-spin" />
              <span>ĐANG TẢI...</span>
            </span>
          ) : syncStatus.isOfflineCached ? (
            <span className="flex items-center gap-1 text-[#8B0000] bg-[#8B0000]/10 px-1.5 py-0.5 border border-[#8B0000]/30">
              <WifiOff className="w-2.5 h-2.5" />
              <span>OFFLINE</span>
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[#1A1A1A] bg-[#1A1A1A]/5 px-1.5 py-0.5 border border-[#1A1A1A]/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
              <span>LIVE</span>
            </span>
          )}
        </div>
      </div>

      {/* Discrete Thin Progress Line directly under Header */}
      {isLoading && (
        <div className="w-full h-1 bg-[#1A1A1A]/10 overflow-hidden absolute bottom-0 left-0">
          <div
            className="h-full bg-[#8B0000] transition-all duration-300 ease-out"
            style={{ width: `${Math.max(5, Math.min(100, percent))}%` }}
          />
        </div>
      )}
    </header>
  );
};
