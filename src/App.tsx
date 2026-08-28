import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Header } from './components/Header';
import { SearchBar } from './components/SearchBar';
import { RunnerCard } from './components/RunnerCard';
import { PasswordGate } from './components/PasswordGate';
import { Runner, SyncStatus, SearchFieldType } from './types';
import {
  TSV_DATA_URLS,
  parseTSV,
  searchRunners,
  loadCachedRunners,
  saveCachedRunners,
  SAMPLE_RUNNERS,
  clearContactIndex,
} from './utils/dataService';
import { AlertCircle, SearchX, Trophy, ArrowRight, ShieldCheck, Hash, User, CreditCard, Phone, ArrowUp, ChevronUp } from 'lucide-react';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    const sessionToken = sessionStorage.getItem('med_auth_token');
    const localToken = localStorage.getItem('med_auth_token');
    return sessionToken === 'authenticated_898989' || localToken === 'authenticated_898989';
  });

  const [runners, setRunners] = useState<Runner[]>(SAMPLE_RUNNERS);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedRace, setSelectedRace] = useState<string>(''); // No default "ALL"
  const [searchMode, setSearchMode] = useState<SearchFieldType>('SO_BIB'); // Mặc định chỉ tìm theo BIB
  const [loadPercent, setLoadPercent] = useState<number>(0);
  const [isDataLoading, setIsDataLoading] = useState<boolean>(true);
  const [showPinnedBar, setShowPinnedBar] = useState<boolean>(false);

  // Monitor scroll position to show pinned mini search status bar
  useEffect(() => {
    const handleScroll = () => {
      // If user scrolls past 240px and a race is selected, show pinned bar
      if (window.scrollY > 220) {
        setShowPinnedBar(true);
      } else {
        setShowPinnedBar(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTopAndSearch = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    const input = document.getElementById('main-search-input') as HTMLInputElement | null;
    if (input) {
      setTimeout(() => {
        input.focus();
        input.select();
      }, 300);
    }
  };

  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    lastSyncedAt: null,
    totalRunners: SAMPLE_RUNNERS.length,
    isLoading: true,
    error: null,
    sourceUrl: `${TSV_DATA_URLS.length} nguồn dữ liệu`,
    isOfflineCached: false,
  });

  // Fetch all TSV datasets in background with thin top progress bar
  const fetchData = useCallback(async (isManual: boolean = false) => {
    setIsDataLoading(true);
    setLoadPercent(10);
    setSyncStatus((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      clearContactIndex();
      const allLoadedRunners: Runner[] = [];
      let completed = 0;
      const total = TSV_DATA_URLS.length;

      for (let i = 0; i < total; i++) {
        const rawUrl = TSV_DATA_URLS[i];
        setLoadPercent(15 + Math.round((i / total) * 70));

        try {
          const url = isManual ? `${rawUrl}&_t=${Date.now()}_${i}` : rawUrl;
          const res = await fetch(url, {
            method: 'GET',
            headers: {
              'Accept': 'text/tab-separated-values, text/plain, */*',
            },
          });

          if (!res.ok) {
            throw new Error(`HTTP ${res.status}`);
          }

          const text = await res.text();
          const parsed = parseTSV(text, `src${i}`);

          for (let j = 0; j < parsed.length; j++) {
            allLoadedRunners.push(parsed[j]);
          }

          completed++;
          setLoadPercent(15 + Math.round((completed / total) * 75));
        } catch (sourceErr) {
          console.warn(`Lỗi tải nguồn TSV #${i + 1}:`, sourceErr);
        }
      }

      if (allLoadedRunners.length > 0) {
        setLoadPercent(95);
        setRunners(allLoadedRunners);
        saveCachedRunners(allLoadedRunners);

        setSyncStatus({
          lastSyncedAt: new Date(),
          totalRunners: allLoadedRunners.length,
          isLoading: false,
          error: null,
          sourceUrl: 'Hệ thống',
          isOfflineCached: false,
        });

        setLoadPercent(100);
        setTimeout(() => {
          setIsDataLoading(false);
        }, 300);
      } else {
        throw new Error('Chưa thể kết nối tới dịch vụ.');
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Lỗi kết nối';
      console.warn('Load error:', errorMsg);

      // Check if we have offline cache
      const cached = loadCachedRunners();
      if (cached && cached.runners.length > 0) {
        setRunners(cached.runners);
        setSyncStatus({
          lastSyncedAt: cached.lastSyncedAt,
          totalRunners: cached.runners.length,
          isLoading: false,
          error: 'Đang hoạt động ở chế độ ngoại tuyến',
          sourceUrl: 'Hệ thống',
          isOfflineCached: true,
        });
      } else {
        // Fallback to sample dataset
        setRunners(SAMPLE_RUNNERS);
        setSyncStatus({
          lastSyncedAt: null,
          totalRunners: SAMPLE_RUNNERS.length,
          isLoading: false,
          error: 'Chưa tải được dữ liệu trực tuyến. Đang mở bản lưu tạm.',
          sourceUrl: 'Hệ thống',
          isOfflineCached: false,
        });
      }
      setIsDataLoading(false);
    }
  }, []);

  // Initialize cached data immediately then sync
  useEffect(() => {
    const cached = loadCachedRunners();
    if (cached && cached.runners.length > 0) {
      setRunners(cached.runners);
      setSyncStatus((prev) => ({
        ...prev,
        lastSyncedAt: cached.lastSyncedAt,
        totalRunners: cached.runners.length,
        isOfflineCached: true,
      }));
    }
    fetchData(false);
  }, [fetchData]);

  // Compute list of unique race names (without exposing counts)
  const availableRaces = useMemo(() => {
    const raceSet = new Set<string>();
    for (let i = 0; i < runners.length; i++) {
      const raceName = (runners[i].race || '').trim();
      if (raceName) {
        raceSet.add(raceName);
      }
    }
    return Array.from(raceSet).map((name) => ({ name }));
  }, [runners]);

  // Filter runners strictly by search query and mode within the selected race
  const filteredResults = useMemo(() => {
    if (!selectedRace) return [];
    return searchRunners(runners, searchQuery, selectedRace, searchMode);
  }, [runners, searchQuery, selectedRace, searchMode]);

  const handleSelectRace = (raceName: string) => {
    setSelectedRace(raceName);
  };

  if (!isAuthenticated) {
    return <PasswordGate onAuthenticated={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="min-h-screen bg-[#EAE6DD] flex justify-center selection:bg-[#1A1A1A] selection:text-[#F4F1EA]">
      {/* Mobile-Only Layout Frame */}
      <main className="w-full max-w-md bg-[#F4F1EA] min-h-screen border-x border-[#1A1A1A] flex flex-col shadow-xl">
        {/* Compact Editorial Top Header with Integrated Progress Line */}
        <Header
          syncStatus={syncStatus}
          loadingProgress={{
            isLoading: isDataLoading,
            percent: loadPercent,
          }}
        />

        {/* Sync Alert Banner if error or offline */}
        {syncStatus.error && (
          <div className="bg-[#8B0000]/10 border-b border-[#8B0000] px-3 py-1.5 flex items-start gap-1.5 text-[10px] font-mono-tech text-[#8B0000]">
            <AlertCircle className="w-3 h-3 shrink-0 mt-0.5" />
            <div className="flex-1 leading-tight">
              <span>{syncStatus.error}</span>
            </div>
          </div>
        )}

        {/* Search Bar: Step 1 (Select Race) -> Step 2 (Search BIB / Mode) */}
        <SearchBar
          query={searchQuery}
          onQueryChange={setSearchQuery}
          selectedRace={selectedRace}
          onRaceChange={setSelectedRace}
          searchMode={searchMode}
          onSearchModeChange={setSearchMode}
          availableRaces={availableRaces}
          resultCount={filteredResults.length}
          isLoading={isDataLoading}
          loadPercent={loadPercent}
        />

        {/* Pinned Mini Status Bar (Shows only when scrolled past search, click to scroll top) */}
        {showPinnedBar && selectedRace && (
          <div
            id="pinned-search-indicator"
            onClick={scrollToTopAndSearch}
            className="sticky top-0 z-30 bg-[#1A1A1A] text-[#F4F1EA] px-3.5 py-2.5 border-b border-[#F4F1EA]/20 shadow-lg cursor-pointer flex items-center justify-between gap-2 select-none hover:bg-[#252525] transition-colors"
          >
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <div className="w-6 h-6 rounded-full bg-[#8B0000] text-[#F4F1EA] flex items-center justify-center shrink-0 text-[10px] font-bold font-mono-tech">
                <Trophy className="w-3 h-3" />
              </div>
              <div className="min-w-0 flex-1 leading-tight font-mono-tech">
                <div className="text-[9px] uppercase tracking-wider text-[#F4F1EA]/60 truncate">
                  GIẢI: <span className="font-bold text-[#F4F1EA]">{selectedRace === 'ALL' ? 'TOÀN BỘ DỮ LIỆU' : selectedRace}</span>
                </div>
                <div className="text-[11px] font-bold text-[#F4F1EA] truncate flex items-center gap-1">
                  <span>
                    {searchMode === 'SO_BIB' && 'BIB: '}
                    {searchMode === 'HO_TEN' && 'HỌ TÊN: '}
                    {searchMode === 'CCCD' && 'CCCD: '}
                    {searchMode === 'SDT' && 'SĐT: '}
                  </span>
                  <span className="text-amber-300 font-mono-tech underline underline-offset-2">
                    {searchQuery.trim() ? searchQuery : '(Chưa nhập)'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 bg-[#F4F1EA] text-[#1A1A1A] px-2 py-1 text-[9.5px] font-mono-tech font-bold uppercase tracking-wider shrink-0 shadow-xs">
              <span>ĐỔI / TÌM LẠI</span>
              <ChevronUp className="w-3.5 h-3.5" />
            </div>
          </div>
        )}

        {/* Content Area */}
        <section className="flex-1 p-3 sm:p-4">
          {/* Loading Lock State */}
          {isDataLoading ? (
            <div className="border-2 border-[#1A1A1A] bg-[#F4F1EA] p-5 text-center my-3 space-y-3">
              <div className="w-9 h-9 border border-[#1A1A1A] bg-[#8B0000] text-[#F4F1EA] flex items-center justify-center mx-auto shadow-xs">
                <span className="font-mono-tech text-xs font-bold animate-spin">⟳</span>
              </div>
              <div>
                <span className="text-[10px] font-mono-tech uppercase font-bold text-[#8B0000] tracking-widest block">
                  HỆ THỐNG ĐANG TẢI TRANG
                </span>
                <h2 className="font-editorial text-base font-bold text-[#1A1A1A] uppercase">
                  VUI LÒNG ĐỢI TRONG GIÂY LÁT
                </h2>
              </div>
              <p className="font-mono-tech text-xs text-[#1A1A1A]/70 leading-relaxed">
                Đang khởi tạo giao diện và kết nối dịch vụ...
              </p>
              <div className="w-full h-2 bg-[#1A1A1A]/10 border border-[#1A1A1A] p-0.5 overflow-hidden">
                <div
                  className="h-full bg-[#8B0000] transition-all duration-300 ease-out"
                  style={{ width: `${Math.max(8, loadPercent)}%` }}
                />
              </div>
            </div>
          ) : /* Case 1: Has not selected a race yet (Step 1 handled at top) */
          !selectedRace ? null : /* Case 2: Race selected, but no search query yet (Ready state) */
          searchQuery.trim() === '' ? (
            <div className="border border-[#1A1A1A]/30 bg-[#1A1A1A]/5 p-3.5 text-center my-2 space-y-2">
              <div className="text-[10px] font-mono-tech uppercase font-bold text-emerald-700 bg-emerald-100 border border-emerald-300 py-1 px-2 inline-block">
                {selectedRace === 'ALL' ? '✓ ĐÃ CHỌN: TÌM TOÀN BỘ DỮ LIỆU' : `✓ ĐÃ CHỌN GIẢI: ${selectedRace}`}
              </div>
              <h3 className="font-editorial text-base font-bold text-[#1A1A1A] uppercase">
                SẴN SÀNG TRA CỨU
              </h3>
              <p className="font-mono-tech text-[11px] text-[#1A1A1A]/70 leading-relaxed">
                {searchMode === 'SO_BIB' && 'Nhập đúng đủ 5 chữ số BIB vào ô tìm kiếm phía trên để tra cứu chính xác 100%.'}
                {searchMode === 'HO_TEN' && 'Nhập Họ tên hoặc Tên trên BIB của VĐV để tìm kiếm.'}
                {searchMode === 'CCCD' && 'Nhập số CCCD / CMND / Hộ chiếu để tìm kiếm.'}
                {searchMode === 'SDT' && 'Nhập số điện thoại của VĐV để tìm kiếm.'}
              </p>
            </div>
          ) : /* Case 2B: Mode is SO_BIB and query length < 5 */
          searchMode === 'SO_BIB' && searchQuery.trim().length < 5 ? (
            <div className="border border-[#8B0000]/40 bg-[#8B0000]/5 p-3.5 text-center my-2 space-y-2">
              <div className="w-8 h-8 border border-[#8B0000] bg-[#8B0000] text-[#F4F1EA] flex items-center justify-center mx-auto shadow-xs">
                <Hash className="w-4 h-4" />
              </div>
              <div className="text-[10px] font-mono-tech uppercase font-bold text-[#8B0000] tracking-wider">
                CHẾ ĐỘ TÌM BIB (KHỚP 100%)
              </div>
              <h3 className="font-editorial text-base font-bold text-[#1A1A1A] uppercase">
                CẦN NHẬP ĐỦ 5 CHỮ SỐ BIB
              </h3>
              <p className="font-mono-tech text-[11px] text-[#1A1A1A]/80 leading-relaxed">
                Bạn đã nhập: <strong className="font-mono-tech text-[#8B0000]">{searchQuery.trim()}</strong> ({searchQuery.trim().length}/5 số).
                <br />
                Vui lòng nhập đủ 5 chữ số để hệ thống đối soát chính xác 100%.
              </p>
            </div>
          ) : /* Case 3: Race selected and has search results */
          filteredResults.length > 0 ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between font-mono-tech text-[9px] uppercase font-bold text-[#1A1A1A]/70 pb-0.5 border-b border-[#1A1A1A]/20">
                <span>{selectedRace === 'ALL' ? 'TOÀN BỘ DỮ LIỆU' : `GIẢI: ${selectedRace}`}</span>
                <span>{filteredResults.length} VĐV KHỚP</span>
              </div>

              {filteredResults.map((runner, index) => (
                <RunnerCard
                  key={runner.matchId ? `${runner.matchId}_${index}` : `runner_${runner.race}_${runner.soBib}_${runner.cccd}_${index}`}
                  runner={runner}
                  isSingleResult={filteredResults.length === 1}
                />
              ))}
            </div>
          ) : (
            /* Case 4: No results found in the selected race */
            <div className="border border-[#1A1A1A] bg-[#F4F1EA] p-3.5 text-center my-2 space-y-2">
              <div className="w-8 h-8 border border-[#1A1A1A] bg-[#1A1A1A] text-[#F4F1EA] flex items-center justify-center mx-auto">
                <SearchX className="w-4 h-4" />
              </div>
              <h2 className="font-editorial text-base font-black text-[#1A1A1A] uppercase">
                KHÔNG TÌM THẤY VẬN ĐỘNG VIÊN
              </h2>
              <p className="font-mono-tech text-[11px] text-[#1A1A1A]/70">
                Không tìm thấy VĐV với {searchMode === 'SO_BIB' ? 'số BIB' : searchMode === 'HO_TEN' ? 'họ tên' : searchMode === 'CCCD' ? 'CCCD' : 'SĐT'}: <strong>"{searchQuery}"</strong> trong {selectedRace === 'ALL' ? 'toàn bộ dữ liệu' : `giải "${selectedRace}"`}.
              </p>
              <div className="bg-[#1A1A1A]/5 border border-[#1A1A1A]/20 p-2 text-[10px] font-mono-tech text-left space-y-0.5 text-[#1A1A1A]/80">
                <div className="font-bold text-[#1A1A1A] uppercase">LƯU Ý TRA CỨU:</div>
                <div>• <strong>Chế độ hiện tại:</strong> {searchMode === 'SO_BIB' ? 'BIB (Yêu cầu 5 số, khớp 100%)' : searchMode === 'HO_TEN' ? 'Họ tên' : searchMode === 'CCCD' ? 'CCCD / CMND / Hộ chiếu' : 'Số điện thoại'}</div>
                <div>• <strong>Phạm vi tra cứu:</strong> {selectedRace === 'ALL' ? 'Đang tra trong TOÀN BỘ DỮ LIỆU' : `Đang tra trong giải ${selectedRace}`}</div>
                <div>• Nếu muốn tìm theo thông tin khác, hãy bấm chọn các nút <strong>BIB</strong>, <strong>HỌ TÊN</strong>, <strong>CCCD</strong> hoặc <strong>SĐT</strong> ở Bước 2.</div>
              </div>

              <div className="pt-1">
                <button
                  onClick={() => setSearchQuery('')}
                  className="w-full py-1.5 bg-[#1A1A1A] text-[#F4F1EA] font-mono-tech text-[10px] font-bold uppercase tracking-wider active:bg-[#333333]"
                >
                  XÓA TÌM KIẾM
                </button>
              </div>
            </div>
          )}
        </section>

        {/* Minimal Compact Footer */}
        <footer className="mt-auto border-t border-[#1A1A1A] px-3 py-2 flex justify-between items-center bg-[#F4F1EA]">
          <div className="font-mono-tech text-[8px] uppercase leading-tight opacity-70 text-[#1A1A1A]">
            Medical Information System • Race Dispatch
          </div>
          <div className="h-6 w-6 bg-[#1A1A1A] text-[#F4F1EA] flex items-center justify-center font-mono-tech text-[9px] font-bold tracking-tighter">
            MED
          </div>
        </footer>
      </main>
    </div>
  );
}
