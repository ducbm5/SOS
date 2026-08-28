export interface RelatedContact {
  sourceRace?: string;
  typeLabel: string;
  name: string;
  phone: string;
  matchedBy?: 'SDT' | 'CCCD' | 'SDT_CCCD';
  extraInfo?: string;
}

export interface Runner {
  matchId: string;
  race: string;
  userId: string;
  hoTen: string;
  tenTrenBib: string;
  cccd: string;
  sdt: string;
  soBib: string;
  sizeAoDau: string;
  sizeAoFinisher: string;
  pen: string;
  cuLy: string;
  gioiTinh: string;
  namSinh: string;
  quocTich: string;
  tinhThanh: string;
  tenLienHeKhanCap: string;
  sdtLienHeKhanCap: string;
  tenUyQuyen: string;
  sdtUyQuyen: string;
  raw?: Record<string, string>;
}

export type SearchFieldType = 'SO_BIB' | 'HO_TEN' | 'CCCD' | 'SDT';

export interface SearchFilter {
  query: string;
  field: SearchFieldType;
}

export interface SyncStatus {
  lastSyncedAt: Date | null;
  totalRunners: number;
  isLoading: boolean;
  error: string | null;
  sourceUrl: string;
  isOfflineCached: boolean;
}
