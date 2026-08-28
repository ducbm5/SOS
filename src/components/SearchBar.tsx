import React, { useRef } from 'react';
import { Search, X, Trophy, ChevronDown, CheckCircle2, Hash, User, CreditCard, Phone } from 'lucide-react';
import { SearchFieldType } from '../types';

export interface RaceOption {
  name: string;
}

interface SearchBarProps {
  query: string;
  onQueryChange: (val: string) => void;
  selectedRace: string;
  onRaceChange: (race: string) => void;
  searchMode: SearchFieldType;
  onSearchModeChange: (mode: SearchFieldType) => void;
  availableRaces: { name: string }[];
  resultCount: number;
  isLoading: boolean;
  loadPercent?: number;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  query,
  onQueryChange,
  selectedRace,
  onRaceChange,
  searchMode,
  onSearchModeChange,
  availableRaces,
  resultCount,
  isLoading,
  loadPercent = 0,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClear = () => {
    if (isLoading) return;
    onQueryChange('');
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const isRaceChosen = Boolean(selectedRace && selectedRace.trim() !== '');

  const handleRaceChange = (newRace: string) => {
    if (isLoading) return;
    onRaceChange(newRace);
    if (newRace && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  };

  const handleModeSelect = (mode: SearchFieldType) => {
    if (isLoading) return;
    onSearchModeChange(mode);
    onQueryChange('');
    if (inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  };

  const getPlaceholder = () => {
    if (isLoading) return 'Đang tải trang... Vui lòng đợi trong giây lát.';
    if (!isRaceChosen) return 'Vui lòng chọn giải thi đấu ở Bước 1 trước...';
    switch (searchMode) {
      case 'SO_BIB':
        return 'Nhập đúng 5 chữ số BIB (VD: 80001)...';
      case 'HO_TEN':
        return 'Nhập họ tên VĐV (VD: NGUYỄN VĂN AN)...';
      case 'CCCD':
        return 'Nhập số CCCD / CMND / Hộ chiếu...';
      case 'SDT':
        return 'Nhập số điện thoại VĐV (VD: 0912345678)...';
      default:
        return 'Nhập từ khóa tìm kiếm...';
    }
  };

  const getStep2Title = () => {
    switch (searchMode) {
      case 'SO_BIB':
        return 'BƯỚC 2: TÌM SỐ BIB';
      case 'HO_TEN':
        return 'BƯỚC 2: TÌM THEO HỌ TÊN VĐV';
      case 'CCCD':
        return 'BƯỚC 2: TÌM THEO CCCD / HỘ CHIẾU';
      case 'SDT':
        return 'BƯỚC 2: TÌM THEO SĐT VĐV';
    }
  };

  return (
    <div id="search-section" className="p-3.5 sm:p-4 border-b border-[#1A1A1A] bg-[#1A1A1A] text-[#F4F1EA] shadow-md space-y-3">
      {/* 1. BƯỚC 1: Chọn Giải Thi Đấu */}
      <div>
        <div className="flex items-center justify-between text-[11px] font-mono-tech uppercase font-bold mb-1 tracking-wider">
          <label htmlFor="race-select-dropdown" className="flex items-center gap-1.5 text-[#F4F1EA]">
            <span className="w-4 h-4 rounded-full bg-[#8B0000] text-[#F4F1EA] text-[9px] flex items-center justify-center font-black">
              1
            </span>
            <Trophy className="w-3.5 h-3.5 text-[#F4F1EA]" />
            <span>BƯỚC 1: CHỌN GIẢI THI ĐẤU</span>
          </label>
          {isLoading ? (
            <span className="text-[10px] text-[#F4F1EA]/70 font-mono-tech animate-pulse">
              ĐANG TẢI TRANG...
            </span>
          ) : isRaceChosen ? (
            <span className="text-[10px] text-emerald-400 font-mono-tech flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>ĐÃ CHỌN</span>
            </span>
          ) : null}
        </div>

        <div className="relative">
          <select
            id="race-select-dropdown"
            disabled={isLoading}
            value={selectedRace}
            onChange={(e) => handleRaceChange(e.target.value)}
            className={`w-full bg-[#1A1A1A] border py-2.5 px-3 pr-8 font-mono-tech text-xs uppercase font-bold focus:outline-none transition-colors appearance-none cursor-pointer ${
              isLoading
                ? 'border-[#F4F1EA]/20 text-[#F4F1EA]/40 cursor-not-allowed bg-[#1A1A1A]/60'
                : !isRaceChosen
                ? 'border-[#8B0000] ring-1 ring-[#8B0000] text-[#F4F1EA]'
                : 'border-[#F4F1EA] text-[#F4F1EA] focus:border-white'
            }`}
          >
            <option value="" className="bg-[#1A1A1A] text-[#F4F1EA]/60">
              {isLoading
                ? '-- ĐANG TẢI TRANG... VUI LÒNG ĐỢI --'
                : '-- VUI LÒNG CHỌN GIẢI THI ĐẤU --'}
            </option>
            {availableRaces.map((race) => (
              <option key={race.name} value={race.name} className="bg-[#1A1A1A] text-[#F4F1EA]">
                {race.name}
              </option>
            ))}
          </select>
          <ChevronDown className="w-4 h-4 text-[#F4F1EA] absolute right-3 top-3 pointer-events-none opacity-80" />
        </div>
      </div>

      {/* 2. BƯỚC 2: Chọn Phương thức & Tra cứu */}
      <div>
        <div className="flex items-center justify-between text-[11px] font-mono-tech uppercase font-bold mb-1.5 tracking-wider">
          <label htmlFor="main-search-input" className={`block ${
            !isLoading && isRaceChosen ? 'text-[#F4F1EA]/90' : 'text-[#F4F1EA]/40'
          }`}>
            <span className="flex items-center gap-1.5">
              <span className={`w-4 h-4 rounded-full text-[9px] flex items-center justify-center font-black ${
                !isLoading && isRaceChosen ? 'bg-[#8B0000] text-[#F4F1EA]' : 'bg-[#F4F1EA]/20 text-[#F4F1EA]/50'
              }`}>
                2
              </span>
              <span>{getStep2Title()}</span>
            </span>
          </label>
        </div>

        {/* 4 Chế độ tìm kiếm (Mặc định: BIB 5 SỐ) */}
        <div className="grid grid-cols-4 gap-1 mb-2">
          <button
            type="button"
            id="btn-mode-bib"
            disabled={isLoading || !isRaceChosen}
            onClick={() => handleModeSelect('SO_BIB')}
            className={`flex items-center justify-center gap-1 py-1.5 px-1 text-[10px] font-mono-tech font-bold uppercase transition-all border ${
              searchMode === 'SO_BIB'
                ? 'bg-[#F4F1EA] text-[#1A1A1A] border-[#F4F1EA] shadow-xs'
                : isRaceChosen
                ? 'bg-[#1A1A1A] text-[#F4F1EA]/80 border-[#F4F1EA]/30 hover:border-[#F4F1EA]/70 hover:text-[#F4F1EA]'
                : 'bg-[#1A1A1A]/40 text-[#F4F1EA]/30 border-[#F4F1EA]/10 cursor-not-allowed'
            }`}
          >
            <Hash className="w-3 h-3 shrink-0" />
            <span>BIB</span>
          </button>

          <button
            type="button"
            id="btn-mode-hoten"
            disabled={isLoading || !isRaceChosen}
            onClick={() => handleModeSelect('HO_TEN')}
            className={`flex items-center justify-center gap-1 py-1.5 px-1 text-[10px] font-mono-tech font-bold uppercase transition-all border ${
              searchMode === 'HO_TEN'
                ? 'bg-[#F4F1EA] text-[#1A1A1A] border-[#F4F1EA] shadow-xs'
                : isRaceChosen
                ? 'bg-[#1A1A1A] text-[#F4F1EA]/80 border-[#F4F1EA]/30 hover:border-[#F4F1EA]/70 hover:text-[#F4F1EA]'
                : 'bg-[#1A1A1A]/40 text-[#F4F1EA]/30 border-[#F4F1EA]/10 cursor-not-allowed'
            }`}
          >
            <User className="w-3 h-3 shrink-0" />
            <span>HỌ TÊN</span>
          </button>

          <button
            type="button"
            id="btn-mode-cccd"
            disabled={isLoading || !isRaceChosen}
            onClick={() => handleModeSelect('CCCD')}
            className={`flex items-center justify-center gap-1 py-1.5 px-1 text-[10px] font-mono-tech font-bold uppercase transition-all border ${
              searchMode === 'CCCD'
                ? 'bg-[#F4F1EA] text-[#1A1A1A] border-[#F4F1EA] shadow-xs'
                : isRaceChosen
                ? 'bg-[#1A1A1A] text-[#F4F1EA]/80 border-[#F4F1EA]/30 hover:border-[#F4F1EA]/70 hover:text-[#F4F1EA]'
                : 'bg-[#1A1A1A]/40 text-[#F4F1EA]/30 border-[#F4F1EA]/10 cursor-not-allowed'
            }`}
          >
            <CreditCard className="w-3 h-3 shrink-0" />
            <span>CCCD</span>
          </button>

          <button
            type="button"
            id="btn-mode-sdt"
            disabled={isLoading || !isRaceChosen}
            onClick={() => handleModeSelect('SDT')}
            className={`flex items-center justify-center gap-1 py-1.5 px-1 text-[10px] font-mono-tech font-bold uppercase transition-all border ${
              searchMode === 'SDT'
                ? 'bg-[#F4F1EA] text-[#1A1A1A] border-[#F4F1EA] shadow-xs'
                : isRaceChosen
                ? 'bg-[#1A1A1A] text-[#F4F1EA]/80 border-[#F4F1EA]/30 hover:border-[#F4F1EA]/70 hover:text-[#F4F1EA]'
                : 'bg-[#1A1A1A]/40 text-[#F4F1EA]/30 border-[#F4F1EA]/10 cursor-not-allowed'
            }`}
          >
            <Phone className="w-3 h-3 shrink-0" />
            <span>SĐT</span>
          </button>
        </div>

        {/* Input Field */}
        <div className="relative">
          <input
            ref={inputRef}
            id="main-search-input"
            type="text"
            maxLength={searchMode === 'SO_BIB' ? 5 : 50}
            disabled={isLoading || !isRaceChosen}
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder={getPlaceholder()}
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            className={`w-full bg-[#1A1A1A] border py-2.5 px-3 pr-10 font-mono-tech text-sm transition-colors ${
              !isLoading && isRaceChosen
                ? 'border-[#F4F1EA] text-[#F4F1EA] placeholder:text-[#F4F1EA]/40 focus:outline-none focus:border-white'
                : 'border-[#F4F1EA]/20 text-[#F4F1EA]/30 placeholder:text-[#F4F1EA]/30 cursor-not-allowed bg-[#1A1A1A]/50'
            }`}
          />

          <div className="absolute right-3 top-3 flex items-center text-[#F4F1EA]">
            {query && !isLoading ? (
              <button
                id="btn-clear-search"
                onClick={handleClear}
                type="button"
                className="text-[#F4F1EA]/80 hover:text-[#F4F1EA] p-0.5"
                title="Xóa tìm kiếm"
              >
                <X className="w-4 h-4" />
              </button>
            ) : (
              <Search className={`w-4 h-4 ${!isLoading && isRaceChosen ? 'opacity-50' : 'opacity-20'}`} />
            )}
          </div>
        </div>

        {/* Helper status text for BIB mode & Results Count */}
        <div className="flex items-center justify-between gap-1 text-[10px] font-mono-tech pt-1.5">
          {searchMode === 'SO_BIB' && isRaceChosen ? (
            query.length === 0 ? (
              <span className="text-[#F4F1EA]/60 text-[9.5px]">
                * Nhập đủ 5 số BIB • Khớp chính xác 100% (không tìm tương đồng)
              </span>
            ) : query.length < 5 ? (
              <span className="text-amber-300 text-[9.5px] font-bold">
                ⚠️ Đã nhập {query.length}/5 số (Cần đủ 5 số để tìm)
              </span>
            ) : (
              <span className="text-emerald-400 text-[9.5px] font-bold">
                ✓ Đã nhập đủ 5 số (Khớp tuyệt đối 100%)
              </span>
            )
          ) : (
            <span className="text-[#F4F1EA]/60 text-[9.5px]">
              {searchMode === 'HO_TEN' && '* Đang tìm theo Họ tên / Tên trên BIB'}
              {searchMode === 'CCCD' && '* Đang tìm theo số CCCD / CMND / Hộ chiếu'}
              {searchMode === 'SDT' && '* Đang tìm theo số điện thoại VĐV'}
            </span>
          )}

          {isRaceChosen && query.trim() && (
            <div className="shrink-0 font-bold uppercase text-[#F4F1EA]">
              <span className="bg-[#F4F1EA] text-[#1A1A1A] px-2 py-0.5 text-[10px] font-bold">
                {resultCount} KẾT QUẢ
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

