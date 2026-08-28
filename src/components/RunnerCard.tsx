import React, { useMemo } from 'react';
import { Phone, PhoneCall, Users, CreditCard } from 'lucide-react';
import { Runner, RelatedContact } from '../types';
import { findPhoneRelatedContacts, findCccdRelatedContacts } from '../utils/dataService';

interface RunnerCardProps {
  runner: Runner;
  isSingleResult?: boolean;
}

export const RunnerCard: React.FC<RunnerCardProps> = ({ runner }) => {
  // 1. Cross-reference related contacts by Runner's Phone in O(1) time
  const phoneRelatedContacts: RelatedContact[] = useMemo(() => {
    return findPhoneRelatedContacts(runner);
  }, [runner]);

  // 2. Cross-reference related contacts by Runner's CCCD in O(1) time
  const cccdRelatedContacts: RelatedContact[] = useMemo(() => {
    return findCccdRelatedContacts(runner);
  }, [runner]);

  return (
    <article
      id={`runner-card-${runner.matchId || `${runner.soBib || ''}_${runner.userId || ''}`}`}
      className="border border-[#1A1A1A] bg-[#F4F1EA] p-3 text-[#1A1A1A] transition-all space-y-2.5 shadow-sm"
    >
      {/* 1. Header: Name & BIB Badge */}
      <div className="flex justify-between items-center gap-2 border-b border-[#1A1A1A] pb-2">
        <div className="border-l-3 border-[#1A1A1A] pl-2 flex-1 min-w-0">
          <h2 className="text-lg sm:text-xl font-bold uppercase leading-tight italic font-editorial text-[#1A1A1A] truncate">
            {runner.hoTen}
          </h2>
          {runner.race && (
            <span className="text-[10px] font-mono-tech uppercase font-bold text-[#1A1A1A]/60 block truncate">
              GIẢI: {runner.race}
            </span>
          )}
        </div>

        {/* Compact BIB NO Box */}
        <div className="bg-[#1A1A1A] text-[#F4F1EA] px-2.5 py-1 text-center shrink-0 flex items-center gap-1.5 border border-[#1A1A1A]">
          <span className="font-mono-tech text-[9px] uppercase text-[#F4F1EA]/70 font-semibold tracking-wider">
            BIB
          </span>
          <span className="text-base font-bold leading-none font-mono-tech">
            {runner.soBib ? runner.soBib : 'N/A'}
          </span>
        </div>
      </div>

      {/* 2. Key Metrics Strip: CỰ LY & GIỚI TÍNH */}
      <div className="grid grid-cols-2 gap-px bg-[#1A1A1A] border border-[#1A1A1A] text-center font-mono-tech text-xs">
        <div className="bg-[#F4F1EA] py-1.5 px-2 flex items-center justify-between">
          <span className="text-[9px] uppercase opacity-60 font-bold">CỰ LY</span>
          <span className="font-bold text-sm text-[#1A1A1A]">{runner.cuLy || '---'}</span>
        </div>
        <div className="bg-[#F4F1EA] py-1.5 px-2 flex items-center justify-between">
          <span className="text-[9px] uppercase opacity-60 font-bold">GIỚI TÍNH</span>
          <span className="font-bold text-xs uppercase text-[#1A1A1A]">
            {runner.gioiTinh || '---'} {runner.namSinh ? `(${runner.namSinh})` : ''}
          </span>
        </div>
      </div>

      {/* 3. Primary Emergency Contact (Priority #1) */}
      <div className="bg-[#8B0000]/5 border border-[#8B0000]/30 p-2">
        <div className="text-[9px] font-mono-tech uppercase font-bold text-[#8B0000] mb-1 flex items-center justify-between">
          <span>LIÊN HỆ KHẨN CẤP (EMERGENCY)</span>
        </div>

        <div className="flex justify-between items-center gap-2">
          <span className="text-xs italic font-editorial font-bold text-[#1A1A1A] truncate">
            {runner.tenLienHeKhanCap || 'Chưa khai báo'}
          </span>

          {runner.sdtLienHeKhanCap ? (
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="font-mono-tech text-xs font-bold text-[#8B0000]">
                {runner.sdtLienHeKhanCap}
              </span>
              <a
                href={`tel:${runner.sdtLienHeKhanCap.replace(/[^0-9+]/g, '')}`}
                className="flex items-center gap-1 px-2 py-0.5 bg-[#8B0000] text-[#F4F1EA] font-mono-tech text-[10px] font-bold uppercase active:bg-[#660000] transition-colors"
                title="Gọi khẩn cấp"
              >
                <PhoneCall className="w-2.5 h-2.5" />
                <span>GỌI</span>
              </a>
            </div>
          ) : (
            <span className="font-mono-tech text-[10px] text-[#1A1A1A]/50">Chưa có SĐT</span>
          )}
        </div>
      </div>

      {/* 4. Authorized Person (If Present) */}
      {(runner.tenUyQuyen || runner.sdtUyQuyen) && (
        <div className="bg-[#1A1A1A]/5 border border-[#1A1A1A]/15 p-1.5 flex justify-between items-center text-xs">
          <div className="flex items-center gap-1.5 truncate">
            <span className="font-mono-tech text-[9px] uppercase font-bold text-[#1A1A1A]/60">ỦY QUYỀN:</span>
            <span className="italic font-editorial font-bold truncate">{runner.tenUyQuyen || '---'}</span>
          </div>
          {runner.sdtUyQuyen && (
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="font-mono-tech text-xs font-bold">{runner.sdtUyQuyen}</span>
              <a
                href={`tel:${runner.sdtUyQuyen.replace(/[^0-9+]/g, '')}`}
                className="flex items-center gap-0.5 px-1.5 py-0.5 bg-[#1A1A1A] text-[#F4F1EA] font-mono-tech text-[9px] font-bold"
              >
                <Phone className="w-2.5 h-2.5" />
                <span>GỌI</span>
              </a>
            </div>
          )}
        </div>
      )}

      {/* 5A. Box 1: LIÊN HỆ KHÁC (TRA THEO SĐT VĐV) */}
      {phoneRelatedContacts.length > 0 && (
        <div className="border border-[#1A1A1A]/20 bg-white/70 p-2.5 space-y-2">
          {/* Header */}
          <div className="flex items-center justify-between text-[10px] font-mono-tech uppercase font-bold text-[#1A1A1A]/80 border-b border-[#1A1A1A]/10 pb-1.5 gap-1">
            <span className="flex items-center gap-1.5 flex-wrap min-w-0">
              <PhoneCall className="w-3.5 h-3.5 text-[#8B0000] shrink-0" />
              <span className="truncate">
                LIÊN HỆ KHÁC (TRA THEO SĐT VĐV{runner.sdt ? `: ${runner.sdt}` : ''})
              </span>
            </span>
            <span className="text-[9px] font-mono-tech px-1.5 py-0.5 bg-[#8B0000]/10 text-[#8B0000] font-bold border border-[#8B0000]/20 shrink-0">
              {phoneRelatedContacts.length} LIÊN HỆ
            </span>
          </div>

          {/* Contact List */}
          <div className="space-y-1.5">
            {phoneRelatedContacts.map((contact, idx) => (
              <div
                key={`phone_${idx}`}
                className="flex items-center justify-between gap-2 p-1.5 bg-[#F4F1EA] border border-[#1A1A1A]/10 hover:border-[#1A1A1A]/30 transition-colors"
              >
                {/* Left: Type tag & Name */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1 mb-0.5 flex-wrap">
                    <span className="font-mono-tech text-[8px] uppercase font-bold text-[#1A1A1A]/80 px-1 py-0.2 bg-[#1A1A1A]/5 border border-[#1A1A1A]/15">
                      {contact.typeLabel}
                      {contact.sourceRace ? ` • ${contact.sourceRace}` : ''}
                    </span>
                  </div>

                  <div className="text-xs font-editorial font-bold text-[#1A1A1A] truncate">
                    {contact.name || 'Chưa rõ họ tên'}
                  </div>
                  {contact.extraInfo && (
                    <div className="text-[9px] font-mono-tech text-[#1A1A1A]/60">
                      {contact.extraInfo}
                    </div>
                  )}
                </div>

                {/* Right: Highlight Phone & Call Button */}
                {contact.phone ? (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="font-mono-tech text-xs font-bold text-[#8B0000]">
                      {contact.phone}
                    </span>
                    <a
                      href={`tel:${contact.phone.replace(/[^0-9+]/g, '')}`}
                      className="flex items-center gap-1 px-2 py-1 bg-[#8B0000] text-[#F4F1EA] font-mono-tech text-[9px] font-bold uppercase active:bg-[#660000] transition-colors shadow-xs"
                      title={`Gọi ${contact.name || contact.phone}`}
                    >
                      <PhoneCall className="w-2.5 h-2.5" />
                      <span>GỌI</span>
                    </a>
                  </div>
                ) : (
                  <span className="font-mono-tech text-[10px] text-[#1A1A1A]/40 shrink-0">
                    Chưa có SĐT
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5B. Box 2: LIÊN HỆ KHÁC (TRA THEO CCCD VĐV) */}
      {cccdRelatedContacts.length > 0 && (
        <div className="border border-[#1A1A1A]/20 bg-white/70 p-2.5 space-y-2">
          {/* Header */}
          <div className="flex items-center justify-between text-[10px] font-mono-tech uppercase font-bold text-[#1A1A1A]/80 border-b border-[#1A1A1A]/10 pb-1.5 gap-1">
            <span className="flex items-center gap-1.5 flex-wrap min-w-0">
              <CreditCard className="w-3.5 h-3.5 text-[#8B0000] shrink-0" />
              <span className="truncate">
                LIÊN HỆ KHÁC (TRA THEO CCCD VĐV{runner.cccd ? `: ${runner.cccd}` : ''})
              </span>
            </span>
            <span className="text-[9px] font-mono-tech px-1.5 py-0.5 bg-[#8B0000]/10 text-[#8B0000] font-bold border border-[#8B0000]/20 shrink-0">
              {cccdRelatedContacts.length} LIÊN HỆ
            </span>
          </div>

          {/* Contact List */}
          <div className="space-y-1.5">
            {cccdRelatedContacts.map((contact, idx) => (
              <div
                key={`cccd_${idx}`}
                className="flex items-center justify-between gap-2 p-1.5 bg-[#F4F1EA] border border-[#1A1A1A]/10 hover:border-[#1A1A1A]/30 transition-colors"
              >
                {/* Left: Type tag & Name */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1 mb-0.5 flex-wrap">
                    <span className="font-mono-tech text-[8px] uppercase font-bold text-[#1A1A1A]/80 px-1 py-0.2 bg-[#1A1A1A]/5 border border-[#1A1A1A]/15">
                      {contact.typeLabel}
                      {contact.sourceRace ? ` • ${contact.sourceRace}` : ''}
                    </span>
                  </div>

                  <div className="text-xs font-editorial font-bold text-[#1A1A1A] truncate">
                    {contact.name || 'Chưa rõ họ tên'}
                  </div>
                  {contact.extraInfo && (
                    <div className="text-[9px] font-mono-tech text-[#1A1A1A]/60">
                      {contact.extraInfo}
                    </div>
                  )}
                </div>

                {/* Right: Highlight Phone & Call Button */}
                {contact.phone ? (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="font-mono-tech text-xs font-bold text-[#8B0000]">
                      {contact.phone}
                    </span>
                    <a
                      href={`tel:${contact.phone.replace(/[^0-9+]/g, '')}`}
                      className="flex items-center gap-1 px-2 py-1 bg-[#8B0000] text-[#F4F1EA] font-mono-tech text-[9px] font-bold uppercase active:bg-[#660000] transition-colors shadow-xs"
                      title={`Gọi ${contact.name || contact.phone}`}
                    >
                      <PhoneCall className="w-2.5 h-2.5" />
                      <span>GỌI</span>
                    </a>
                  </div>
                ) : (
                  <span className="font-mono-tech text-[10px] text-[#1A1A1A]/40 shrink-0">
                    Chưa có SĐT
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. CCCD & Runner's Direct Phone */}
      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[#1A1A1A]/20 font-mono-tech text-xs">
        <div>
          <span className="text-[9px] uppercase opacity-60 font-bold block">CCCD</span>
          <span className="font-bold text-[#1A1A1A]">{runner.cccd || '---'}</span>
        </div>
        <div className="text-right">
          <span className="text-[9px] uppercase opacity-60 font-bold block">SĐT VẬN ĐỘNG VIÊN</span>
          <div className="flex items-center justify-end gap-1">
            <span className="font-bold text-[#1A1A1A]">{runner.sdt || '---'}</span>
            {runner.sdt && (
              <a
                href={`tel:${runner.sdt.replace(/[^0-9+]/g, '')}`}
                className="p-1 bg-[#1A1A1A] text-[#F4F1EA] inline-flex items-center justify-center hover:bg-[#333333]"
                title="Gọi VĐV"
              >
                <Phone className="w-2.5 h-2.5" />
              </a>
            )}
          </div>
        </div>
      </div>
    </article>
  );
};

