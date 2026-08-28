import { Runner, RelatedContact, SearchFieldType } from '../types';

export const TSV_DATA_URLS = [
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vSC3h6d762NFVITvT91z3yIybbkKMxrseR6zVdQmfYR1aDAd0AWGtcPIF4ahq_BZtX1FGd-NJuV2dMK/pub?gid=0&single=true&output=tsv',
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vRYjKkWgZFk-Xv47wD4zYmoxdOHbaiQrhCk5jdDjOioaJi06TtwGEcI9yQVWNhTReI1kYp4htztnWiO/pub?gid=1498162491&single=true&output=tsv',
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vQTsOmxCOBZRIVgUEyQZ8bdS8a0Oiee7OrgxbRmInaDzt0_SflOmIY9SBRvJR9EfeeiG_PpZp66B-to/pub?gid=149348671&single=true&output=tsv',
];

export const TSV_DATA_URL = TSV_DATA_URLS[0];

const STORAGE_KEY_DATA = 'MED_RUNNERS_DATA_V2';
const STORAGE_KEY_SYNC = 'MED_RUNNERS_LAST_SYNC_V2';

/**
 * Remove Vietnamese accents and special characters for fast search matching
 */
export function removeVietnameseTones(str: string): string {
  if (!str) return '';
  str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, 'a');
  str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, 'e');
  str = str.replace(/ì|í|ị|ỉ|ĩ/g, 'i');
  str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, 'o');
  str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, 'u');
  str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, 'y');
  str = str.replace(/đ/g, 'd');
  str = str.replace(/À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ/g, 'A');
  str = str.replace(/È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ/g, 'E');
  str = str.replace(/Ì|Í|Ị|Ỉ|Ĩ/g, 'I');
  str = str.replace(/Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ/g, 'O');
  str = str.replace(/Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ/g, 'U');
  str = str.replace(/Ỳ|Ý|Ỵ|Ỷ|Ỹ/g, 'Y');
  str = str.replace(/Đ/g, 'D');
  str = str.replace(/\u0300|\u0301|\u0303|\u0309|\u0323/g, '');
  str = str.replace(/\u02C6|\u0306|\u031B/g, '');
  return str.toLowerCase().trim();
}

/**
 * Standardize phone number to digits only
 */
export function normalizePhone(phone: string): string {
  if (!phone) return '';
  let cleaned = phone.replace(/[^0-9]/g, '');
  if (cleaned.startsWith('84') && cleaned.length >= 10) {
    cleaned = '0' + cleaned.substring(2);
  }
  return cleaned;
}

/**
 * Normalize header text for flexible key mapping
 */
function normalizeHeaderKey(key: string): string {
  return removeVietnameseTones(key)
    .replace(/[^a-z0-9]/g, '')
    .toUpperCase();
}

/**
 * Fast in-memory index for O(1) emergency and authorized contact lookup
 */
export const contactPhoneIndex = new Map<string, RelatedContact[]>();
export const contactCccdIndex = new Map<string, RelatedContact[]>();

export function clearContactIndex(): void {
  contactPhoneIndex.clear();
  contactCccdIndex.clear();
}

/**
 * Register contact info and multi-race profiles for a runner into the fast index
 */
export function registerContactsForRunner(runner: Runner): void {
  const runnerPhone = normalizePhone(runner.sdt);
  const runnerCccd = (runner.cccd || '').replace(/[^0-9a-zA-Z]/g, '').toLowerCase();
  const raceTag = (runner.race || '').trim();

  const lhkcName = (runner.tenLienHeKhanCap || '').trim();
  const lhkcPhone = (runner.sdtLienHeKhanCap || '').trim();
  const uqName = (runner.tenUyQuyen || '').trim();
  const uqPhone = (runner.sdtUyQuyen || '').trim();

  const saveToMap = (key: string, map: Map<string, RelatedContact[]>, contact: RelatedContact) => {
    if (!key) return;
    let list = map.get(key);
    if (!list) {
      list = [];
      map.set(key, list);
    }
    // Prevent exact duplicate entries
    const keyStr = `${contact.name.toLowerCase()}_${normalizePhone(contact.phone)}_${contact.typeLabel}_${contact.sourceRace || ''}`;
    if (!list.some(c => `${c.name.toLowerCase()}_${normalizePhone(c.phone)}_${c.typeLabel}_${c.sourceRace || ''}` === keyStr)) {
      list.push(contact);
    }
  };

  // 1. Emergency Contact (LHKC)
  if (lhkcName || normalizePhone(lhkcPhone)) {
    const contactLhkc: RelatedContact = {
      sourceRace: raceTag,
      typeLabel: 'LHKC',
      name: lhkcName || 'Chưa rõ tên',
      phone: lhkcPhone,
      matchedBy: 'SDT',
    };
    if (runnerPhone && runnerPhone.length >= 8) {
      saveToMap(runnerPhone, contactPhoneIndex, { ...contactLhkc, matchedBy: 'SDT' });
    }
    if (runnerCccd && runnerCccd.length >= 6) {
      saveToMap(runnerCccd, contactCccdIndex, { ...contactLhkc, matchedBy: 'CCCD' });
    }
  }

  // 2. Authorized Contact (ỦY QUYỀN)
  if (uqName || normalizePhone(uqPhone)) {
    const contactUq: RelatedContact = {
      sourceRace: raceTag,
      typeLabel: 'ỦY QUYỀN',
      name: uqName || 'Chưa rõ tên',
      phone: uqPhone,
      matchedBy: 'SDT',
    };
    if (runnerPhone && runnerPhone.length >= 8) {
      saveToMap(runnerPhone, contactPhoneIndex, { ...contactUq, matchedBy: 'SDT' });
    }
    if (runnerCccd && runnerCccd.length >= 6) {
      saveToMap(runnerCccd, contactCccdIndex, { ...contactUq, matchedBy: 'CCCD' });
    }
  }

  // 3. Multi-race Runner Profile match via CCCD or SĐT (for cross-race lookup)
  if (runner.hoTen && runner.hoTen !== 'CHƯA CẬP NHẬT') {
    const runnerProfile: RelatedContact = {
      sourceRace: raceTag,
      typeLabel: 'HỒ SƠ KHÁC',
      name: `${runner.hoTen}${runner.soBib ? ` (BIB: ${runner.soBib})` : ''}`,
      phone: runner.sdt,
      extraInfo: runner.cuLy ? `Cự ly: ${runner.cuLy}` : undefined,
    };
    if (runnerCccd && runnerCccd.length >= 6) {
      saveToMap(runnerCccd, contactCccdIndex, { ...runnerProfile, matchedBy: 'CCCD' });
    }
    if (runnerPhone && runnerPhone.length >= 8) {
      saveToMap(runnerPhone, contactPhoneIndex, { ...runnerProfile, matchedBy: 'SDT' });
    }
  }
}

/**
 * Parse TSV string into Runner objects safely without recursion or spread operators
 */
export function parseTSV(tsvText: string, filePrefix: string = 'f0'): Runner[] {
  if (!tsvText || typeof tsvText !== 'string') return [];

  const lines = tsvText.split(/\r?\n/);
  if (lines.length < 2) return [];

  const headerLine = lines[0];
  const headers = headerLine.split('\t').map(h => h.trim());
  const headerKeys = headers.map(h => normalizeHeaderKey(h));

  // Find column index mappings
  const getIndex = (possibleKeys: string[]): number => {
    return headerKeys.findIndex(hk => possibleKeys.includes(hk));
  };

  const idxMatchId = getIndex(['MATCHID', 'IDMATCH', 'MATCH_ID']);
  const idxRace = getIndex(['RACE', 'GIAICHAY', 'EVENT', 'TOURNAMENT', 'GIAI']);
  const idxUserId = getIndex(['USERID', 'IDUSER', 'USER_ID', 'MAVDV']);
  const idxHoTen = getIndex(['HOTEN', 'TEN', 'FULLNAME', 'NAME']);
  const idxTenTrenBib = getIndex(['TENTRENBIB', 'BIBNAME', 'NAMEONBIB', 'TENBIB']);
  const idxCccd = getIndex(['CCCD', 'CMND', 'PASSPORT', 'SOCANCUOC', 'IDNUMBER']);
  const idxSdt = getIndex(['SDT', 'SODIENTHOAI', 'PHONE', 'TEL', 'MOBILE']);
  const idxSoBib = getIndex(['SOBIB', 'BIB', 'BIBNUMBER', 'SOCHAY']);
  const idxSizeAoDau = getIndex(['SIZEAODAU', 'SIZEAO', 'SHIRTSIZE', 'SHIRT']);
  const idxSizeAoFinisher = getIndex(['SIZEAOFINISHER', 'FINISHERSIZE', 'SIZEFINISHER', 'AOFINISHER']);
  const idxPen = getIndex(['PEN', 'STARTPEN', 'KHUVUCXUATPHAT', 'WAVE']);
  const idxCuLy = getIndex(['CULY', 'DISTANCE', 'KM', 'CUDON']);
  const idxGioiTinh = getIndex(['GIOITINH', 'GENDER', 'SEX']);
  const idxNamSinh = getIndex(['NAMSINH', 'YEAROFBIRTH', 'DOB', 'NGAYSINH', 'YOB']);
  const idxQuocTich = getIndex(['QUOCTICH', 'NATIONALITY', 'COUNTRY', 'QUOCGIA']);
  const idxTinhThanh = getIndex(['TINHTHANH', 'CITY', 'PROVINCE', 'QUEQUAN']);
  const idxTenLhkc = getIndex(['TENLIENHEKHANCAP', 'NGUOILIENHEKHANCAP', 'EMERGENCYNAME', 'LHKC', 'TENLHKC']);
  const idxSdtLhkc = getIndex(['SDTLIENHEKHANCAP', 'SODIENTHOAIKHANCAP', 'EMERGENCYPHONE', 'SDTLHKC', 'PHONEKHANCAP']);
  const idxTenUq = getIndex(['TENUYQUYEN', 'NGUOIUYQUYEN', 'AUTHNAME', 'UYQUYEN']);
  const idxSdtUq = getIndex(['SDTUYQUYEN', 'SODIENTHOAIUYQUYEN', 'AUTHPHONE', 'SDTUQ']);

  const runners: Runner[] = [];

  for (let i = 1; i < lines.length; i++) {
    const rawLine = lines[i];
    if (!rawLine || !rawLine.trim()) continue;

    const row = rawLine.split('\t');

    const getValue = (idx: number): string => {
      if (idx >= 0 && idx < row.length) {
        return (row[idx] || '').trim();
      }
      return '';
    };

    const hoTen = idxHoTen >= 0 ? getValue(idxHoTen) : getValue(3);
    const soBib = idxSoBib >= 0 ? getValue(idxSoBib) : getValue(7);
    const cccd = idxCccd >= 0 ? getValue(idxCccd) : getValue(5);
    const sdt = idxSdt >= 0 ? getValue(idxSdt) : getValue(6);

    // Skip empty placeholder rows
    if (!hoTen && !soBib && !cccd && !sdt) continue;

    const rawMatchId = idxMatchId >= 0 ? getValue(idxMatchId) : getValue(0);
    const uniqueMatchId = rawMatchId
      ? `${filePrefix}_${rawMatchId}_row_${i}`
      : `${filePrefix}_runner_${i}_${soBib || cccd || sdt || i}`;

    const runner: Runner = {
      matchId: uniqueMatchId,
      race: idxRace >= 0 ? getValue(idxRace) : getValue(1),
      userId: idxUserId >= 0 ? getValue(idxUserId) : getValue(2),
      hoTen: hoTen || 'CHƯA CẬP NHẬT',
      tenTrenBib: idxTenTrenBib >= 0 ? getValue(idxTenTrenBib) : getValue(4),
      cccd: cccd,
      sdt: sdt,
      soBib: soBib,
      sizeAoDau: idxSizeAoDau >= 0 ? getValue(idxSizeAoDau) : getValue(8),
      sizeAoFinisher: idxSizeAoFinisher >= 0 ? getValue(idxSizeAoFinisher) : getValue(9),
      pen: idxPen >= 0 ? getValue(idxPen) : getValue(10),
      cuLy: idxCuLy >= 0 ? getValue(idxCuLy) : getValue(11),
      gioiTinh: idxGioiTinh >= 0 ? getValue(idxGioiTinh) : getValue(12),
      namSinh: idxNamSinh >= 0 ? getValue(idxNamSinh) : getValue(13),
      quocTich: idxQuocTich >= 0 ? getValue(idxQuocTich) : getValue(14),
      tinhThanh: idxTinhThanh >= 0 ? getValue(idxTinhThanh) : getValue(15),
      tenLienHeKhanCap: idxTenLhkc >= 0 ? getValue(idxTenLhkc) : getValue(16),
      sdtLienHeKhanCap: idxSdtLhkc >= 0 ? getValue(idxSdtLhkc) : getValue(17),
      tenUyQuyen: idxTenUq >= 0 ? getValue(idxTenUq) : getValue(18),
      sdtUyQuyen: idxSdtUq >= 0 ? getValue(idxSdtUq) : getValue(19),
    };

    runners.push(runner);
    // Index contacts immediately
    registerContactsForRunner(runner);
  }

  return runners;
}

/**
 * Find related emergency and authorized contacts or other race profiles
 * matched strictly by the runner's phone number (SDT) in O(1) time.
 */
export function findPhoneRelatedContacts(currentRunner: Runner): RelatedContact[] {
  const phone = normalizePhone(currentRunner.sdt);
  if (!phone || phone.length < 8) return [];

  const currentLhkcPhone = normalizePhone(currentRunner.sdtLienHeKhanCap);
  const currentLhkcName = (currentRunner.tenLienHeKhanCap || '').trim().toLowerCase();
  const currentUqPhone = normalizePhone(currentRunner.sdtUyQuyen);
  const currentUqName = (currentRunner.tenUyQuyen || '').trim().toLowerCase();
  const currentRunnerName = (currentRunner.hoTen || '').trim().toLowerCase();
  const currentRace = (currentRunner.race || '').trim().toLowerCase();

  const results: RelatedContact[] = [];
  const seen = new Set<string>();

  // Exclude primary contacts from current card
  if (currentLhkcPhone || currentLhkcName) {
    seen.add(`${currentLhkcName}_${currentLhkcPhone}`);
  }
  if (currentUqPhone || currentUqName) {
    seen.add(`${currentUqName}_${currentUqPhone}`);
  }
  // Exclude current card's own runner profile in the same race
  if (currentRunnerName) {
    seen.add(`${currentRunnerName}_${phone}_${currentRace}`);
  }

  const phoneList = contactPhoneIndex.get(phone);
  if (phoneList) {
    for (let i = 0; i < phoneList.length; i++) {
      const c = phoneList[i];
      const key = `${c.name.toLowerCase()}_${normalizePhone(c.phone)}_${c.typeLabel}_${c.sourceRace?.toLowerCase() || ''}`;
      if (seen.has(key)) continue;
      seen.add(key);

      results.push({
        ...c,
        matchedBy: 'SDT',
      });
    }
  }

  return results;
}

/**
 * Find related emergency and authorized contacts or other race profiles
 * matched strictly by the runner's CCCD / Passport in O(1) time.
 */
export function findCccdRelatedContacts(currentRunner: Runner): RelatedContact[] {
  const cccd = (currentRunner.cccd || '').replace(/[^0-9a-zA-Z]/g, '').toLowerCase();
  if (!cccd || cccd.length < 6) return [];

  const currentLhkcPhone = normalizePhone(currentRunner.sdtLienHeKhanCap);
  const currentLhkcName = (currentRunner.tenLienHeKhanCap || '').trim().toLowerCase();
  const currentUqPhone = normalizePhone(currentRunner.sdtUyQuyen);
  const currentUqName = (currentRunner.tenUyQuyen || '').trim().toLowerCase();
  const currentRunnerName = (currentRunner.hoTen || '').trim().toLowerCase();
  const currentRace = (currentRunner.race || '').trim().toLowerCase();

  const results: RelatedContact[] = [];
  const seen = new Set<string>();

  // Exclude primary contacts from current card
  if (currentLhkcPhone || currentLhkcName) {
    seen.add(`${currentLhkcName}_${currentLhkcPhone}`);
  }
  if (currentUqPhone || currentUqName) {
    seen.add(`${currentUqName}_${currentUqPhone}`);
  }
  // Exclude current card's own runner profile in the same race
  if (currentRunnerName) {
    seen.add(`${currentRunnerName}_${cccd}_${currentRace}`);
  }

  const cccdList = contactCccdIndex.get(cccd);
  if (cccdList) {
    for (let i = 0; i < cccdList.length; i++) {
      const c = cccdList[i];
      const key = `${c.name.toLowerCase()}_${normalizePhone(c.phone)}_${c.typeLabel}_${c.sourceRace?.toLowerCase() || ''}`;
      if (seen.has(key)) continue;
      seen.add(key);

      results.push({
        ...c,
        matchedBy: 'CCCD',
      });
    }
  }

  return results;
}

/**
 * Combined related contacts lookup (retained for compatibility)
 */
export function findRelatedContacts(currentRunner: Runner): RelatedContact[] {
  const phoneMatches = findPhoneRelatedContacts(currentRunner);
  const cccdMatches = findCccdRelatedContacts(currentRunner);
  const combined: RelatedContact[] = [...phoneMatches];
  const seen = new Set(phoneMatches.map(c => `${c.name.toLowerCase()}_${normalizePhone(c.phone)}_${c.sourceRace || ''}`));

  for (let i = 0; i < cccdMatches.length; i++) {
    const c = cccdMatches[i];
    const key = `${c.name.toLowerCase()}_${normalizePhone(c.phone)}_${c.sourceRace || ''}`;
    if (!seen.has(key)) {
      seen.add(key);
      combined.push(c);
    }
  }
  return combined;
}

/**
 * Filter runners strictly based on selected Race and search mode
 * Mode 'SO_BIB' (Mặc định): Bắt buộc nhập đủ 5 ký tự/số, chỉ tìm chính xác 100% (không tìm tương đồng, không tìm sang tên/cccd/sđt)
 * Mode 'HO_TEN': Chỉ tìm theo họ tên hoặc tên trên BIB
 * Mode 'CCCD': Chỉ tìm theo số CCCD / CMND / Hộ chiếu
 * Mode 'SDT': Chỉ tìm theo số điện thoại
 */
export function searchRunners(
  runners: Runner[],
  searchQuery: string,
  selectedRace: string = 'ALL',
  searchMode: SearchFieldType = 'SO_BIB'
): Runner[] {
  const query = searchQuery.trim();
  if (!query) return [];

  const rawQuery = query.toLowerCase();
  const normalizedQuery = removeVietnameseTones(query).toLowerCase();
  const numericQuery = normalizePhone(query);
  const isPureNumber = /^\d+$/.test(query);

  const isAllRaces = !selectedRace || selectedRace === 'ALL';
  const selectedRaceClean = selectedRace ? selectedRace.trim().toLowerCase() : '';

  const results: Runner[] = [];

  for (let i = 0; i < runners.length; i++) {
    const r = runners[i];

    // Filter by race first if specific race is selected
    if (!isAllRaces) {
      if ((r.race || '').trim().toLowerCase() !== selectedRaceClean) {
        continue;
      }
    }

    // 1. MODE: SO_BIB (Mặc định - Phải đủ 5 số, đúng 100%, không tìm tương đồng)
    if (searchMode === 'SO_BIB') {
      // Phải đủ 5 số/ký tự
      if (query.length !== 5) {
        return [];
      }

      const bibClean = (r.soBib || '').trim().toLowerCase();
      if (bibClean) {
        if (bibClean === rawQuery) {
          results.push(r);
          continue;
        }
        if (isPureNumber && /^\d+$/.test(bibClean)) {
          if (parseInt(bibClean, 10) === parseInt(rawQuery, 10)) {
            results.push(r);
            continue;
          }
        }
      }
      continue;
    }

    // 2. MODE: HO_TEN (Chỉ tìm họ tên hoặc tên trên BIB)
    if (searchMode === 'HO_TEN') {
      const normHoTen = removeVietnameseTones(r.hoTen || '').toLowerCase();
      const normTenBib = removeVietnameseTones(r.tenTrenBib || '').toLowerCase();
      if (normHoTen && normHoTen.includes(normalizedQuery)) {
        results.push(r);
        continue;
      }
      if (normTenBib && normTenBib.includes(normalizedQuery)) {
        results.push(r);
        continue;
      }
      continue;
    }

    // 3. MODE: CCCD (Chỉ tìm theo CCCD / CMND / Hộ chiếu)
    if (searchMode === 'CCCD') {
      const cccd = (r.cccd || '').replace(/[^0-9a-zA-Z]/g, '').toLowerCase();
      if (cccd) {
        if (cccd === rawQuery) {
          results.push(r);
          continue;
        }
        if (query.length >= 4 && (cccd.includes(rawQuery) || (numericQuery && cccd.includes(numericQuery)))) {
          results.push(r);
          continue;
        }
      }
      continue;
    }

    // 4. MODE: SDT (Chỉ tìm theo số điện thoại VĐV)
    if (searchMode === 'SDT') {
      const sdt = normalizePhone(r.sdt || '');
      if (sdt && numericQuery) {
        if (sdt === numericQuery) {
          results.push(r);
          continue;
        }
        if (numericQuery.length >= 4 && sdt.includes(numericQuery)) {
          results.push(r);
          continue;
        }
      }
      continue;
    }
  }

  return results;
}

/**
 * Cache runners in localStorage safely without crashing storage limits
 */
export function saveCachedRunners(runners: Runner[]): void {
  try {
    const cacheSlice = runners.slice(0, 10000);
    localStorage.setItem(STORAGE_KEY_DATA, JSON.stringify(cacheSlice));
    localStorage.setItem(STORAGE_KEY_SYNC, new Date().toISOString());
  } catch (e) {
    console.warn('LocalStorage quota or write error handled safely', e);
  }
}

export function loadCachedRunners(): { runners: Runner[]; lastSyncedAt: Date | null } | null {
  try {
    const rawData = localStorage.getItem(STORAGE_KEY_DATA);
    const rawSync = localStorage.getItem(STORAGE_KEY_SYNC);
    if (rawData) {
      const parsed = JSON.parse(rawData);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Re-index cached items into contact index
        parsed.forEach(r => registerContactsForRunner(r));
        return {
          runners: parsed,
          lastSyncedAt: rawSync ? new Date(rawSync) : null,
        };
      }
    }
  } catch (e) {
    console.warn('Error reading cached runners', e);
  }
  return null;
}

/**
 * Realistic medical demo dataset for instant fallback
 */
export const SAMPLE_RUNNERS: Runner[] = [
  {
    matchId: 'M-2026-001',
    race: 'VT26',
    userId: 'US-88291',
    hoTen: 'NGUYỄN VĂN AN',
    tenTrenBib: 'AN NGUYEN',
    cccd: '001090012345',
    sdt: '0912345678',
    soBib: '42195',
    sizeAoDau: 'L',
    sizeAoFinisher: 'L',
    pen: 'PEN A',
    cuLy: '42KM',
    gioiTinh: 'NAM',
    namSinh: '1990',
    quocTich: 'VIỆT NAM',
    tinhThanh: 'HÀ NỘI',
    tenLienHeKhanCap: 'TRẦN THỊ MAI (VỢ)',
    sdtLienHeKhanCap: '0987654321',
    tenUyQuyen: 'NGUYỄN VĂN BÌNH',
    sdtUyQuyen: '0909112233',
  },
  {
    matchId: 'M-2026-002',
    race: 'AS26',
    userId: 'US-88292',
    hoTen: 'TRẦN MINH ĐỨC',
    tenTrenBib: 'DUC TRAN',
    cccd: '079092004812',
    sdt: '0908765432',
    soBib: '21088',
    sizeAoDau: 'M',
    sizeAoFinisher: 'M',
    pen: 'PEN B',
    cuLy: '21KM',
    gioiTinh: 'NAM',
    namSinh: '1992',
    quocTich: 'VIỆT NAM',
    tinhThanh: 'TP. HỒ CHÍ MINH',
    tenLienHeKhanCap: 'LÊ HOÀNG YẾN (MẸ)',
    sdtLienHeKhanCap: '0918273645',
    tenUyQuyen: '',
    sdtUyQuyen: '',
  },
  {
    matchId: 'M-2026-003',
    race: 'VT26',
    userId: 'US-88293',
    hoTen: 'PHẠM THU HÀ',
    tenTrenBib: 'HA PHAM',
    cccd: '031195006789',
    sdt: '0977112233',
    soBib: '10520',
    sizeAoDau: 'S',
    sizeAoFinisher: 'S',
    pen: 'PEN C',
    cuLy: '10KM',
    gioiTinh: 'NỮ',
    namSinh: '1995',
    quocTich: 'VIỆT NAM',
    tinhThanh: 'ĐÀ NẴNG',
    tenLienHeKhanCap: 'PHẠM VĂN ĐỒNG (BỐ)',
    sdtLienHeKhanCap: '0966334455',
    tenUyQuyen: 'PHẠM QUANG HUY',
    sdtUyQuyen: '0933445566',
  },
  {
    matchId: 'M-2026-004',
    race: 'AS26',
    userId: 'US-88294',
    hoTen: 'LÊ QUANG VINH',
    tenTrenBib: 'VINH LE',
    cccd: '048088009123',
    sdt: '0934567890',
    soBib: '42890',
    sizeAoDau: 'XL',
    sizeAoFinisher: 'XL',
    pen: 'PEN A',
    cuLy: '42KM',
    gioiTinh: 'NAM',
    namSinh: '1988',
    quocTich: 'VIỆT NAM',
    tinhThanh: 'HẢI PHÒNG',
    tenLienHeKhanCap: 'VŨ THỊ HƯƠNG (VỢ)',
    sdtLienHeKhanCap: '0945678901',
    tenUyQuyen: '',
    sdtUyQuyen: '',
  },
  {
    matchId: 'M-2026-005',
    race: 'VT26',
    userId: 'US-88295',
    hoTen: 'HOÀNG THỊ THẢO',
    tenTrenBib: 'THAO HOANG',
    cccd: '025198007744',
    sdt: '0988223344',
    soBib: '05122',
    sizeAoDau: 'XS',
    sizeAoFinisher: 'XS',
    pen: 'PEN D',
    cuLy: '5KM',
    gioiTinh: 'NỮ',
    namSinh: '1998',
    quocTich: 'VIỆT NAM',
    tinhThanh: 'CẦN THƠ',
    tenLienHeKhanCap: 'HOÀNG ĐỨC THẮNG (ANH TRAI)',
    sdtLienHeKhanCap: '0919887766',
    tenUyQuyen: '',
    sdtUyQuyen: '',
  },
  {
    matchId: 'M-2026-006',
    race: 'AS26',
    userId: 'US-88291',
    hoTen: 'NGUYỄN VĂN AN',
    tenTrenBib: 'AN NGUYEN',
    cccd: '001090012345',
    sdt: '0912345678',
    soBib: '21999',
    sizeAoDau: 'L',
    sizeAoFinisher: 'L',
    pen: 'PEN A',
    cuLy: '21KM',
    gioiTinh: 'NAM',
    namSinh: '1990',
    quocTich: 'VIỆT NAM',
    tinhThanh: 'HÀ NỘI',
    tenLienHeKhanCap: 'NGUYỄN VĂN BÌNH (EM TRAI)',
    sdtLienHeKhanCap: '0909112233',
    tenUyQuyen: 'TRẦN THỊ MAI (VỢ)',
    sdtUyQuyen: '0987654321',
  },
  {
    matchId: 'M-2026-007',
    race: 'VT26',
    userId: 'US-88292',
    hoTen: 'TRẦN MINH ĐỨC',
    tenTrenBib: 'DUC TRAN',
    cccd: '079092004812',
    sdt: '0908765432',
    soBib: '42999',
    sizeAoDau: 'M',
    sizeAoFinisher: 'M',
    pen: 'PEN B',
    cuLy: '42KM',
    gioiTinh: 'NAM',
    namSinh: '1992',
    quocTich: 'VIỆT NAM',
    tinhThanh: 'TP. HỒ CHÍ MINH',
    tenLienHeKhanCap: 'LÊ HOÀNG NAM (ANH TRAI)',
    sdtLienHeKhanCap: '0918999888',
    tenUyQuyen: '',
    sdtUyQuyen: '',
  }
];
