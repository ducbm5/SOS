import React, { useState } from 'react';
import { Lock, KeyRound, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface PasswordGateProps {
  onAuthenticated: () => void;
}

const REQUIRED_PASS = '898989';

export const PasswordGate: React.FC<PasswordGateProps> = ({ onAuthenticated }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.trim() === REQUIRED_PASS) {
      sessionStorage.setItem('med_auth_token', 'authenticated_898989');
      localStorage.setItem('med_auth_token', 'authenticated_898989');
      setError(false);
      onAuthenticated();
    } else {
      setError(true);
      setPassword('');
    }
  };

  return (
    <div className="min-h-screen bg-[#1A1A1A] text-[#F4F1EA] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm border border-[#F4F1EA]/20 bg-[#242424] p-6 shadow-2xl space-y-6">
        {/* Header Badge */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 border border-[#8B0000] bg-[#8B0000] text-[#F4F1EA] flex items-center justify-center mx-auto shadow-md">
            <Lock className="w-6 h-6" />
          </div>
          <div className="text-[10px] font-mono-tech uppercase font-bold text-[#8B0000] tracking-widest">
            HỆ THỐNG Y TẾ NỘI BỘ
          </div>
          <h1 className="font-editorial text-xl font-bold uppercase text-[#F4F1EA]">
            XÁC THỰC TRUY CẬP
          </h1>
          <p className="font-mono-tech text-xs text-[#F4F1EA]/70">
            Vui lòng nhập mã PIN bảo mật để truy cập dữ liệu tra cứu VĐV.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="gate-pass-input" className="block text-[11px] font-mono-tech uppercase font-bold text-[#F4F1EA]/80 mb-1.5">
              Mã PIN bảo mật
            </label>
            <div className="relative">
              <input
                id="gate-pass-input"
                type="password"
                maxLength={10}
                autoFocus
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError(false);
                }}
                placeholder="Nhập mã PIN..."
                className={`w-full bg-[#1A1A1A] text-[#F4F1EA] px-3 py-3 border text-center font-mono-tech text-lg font-bold tracking-widest placeholder:text-[#F4F1EA]/30 focus:outline-hidden ${
                  error
                    ? 'border-red-500 ring-2 ring-red-500/30'
                    : 'border-[#F4F1EA]/30 focus:border-[#F4F1EA]'
                }`}
              />
              <KeyRound className="w-4 h-4 text-[#F4F1EA]/40 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
            {error && (
              <div className="flex items-center gap-1 text-red-400 font-mono-tech text-[11px] mt-2 font-bold">
                <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                <span>Mã PIN không chính xác. Vui lòng thử lại!</span>
              </div>
            )}
          </div>

          <button
            id="btn-submit-pass"
            type="submit"
            className="w-full py-3 bg-[#8B0000] text-[#F4F1EA] font-mono-tech text-xs uppercase font-bold tracking-wider hover:bg-[#a10000] active:scale-[0.99] transition-all flex items-center justify-center gap-2 border border-[#8B0000] shadow-md cursor-pointer"
          >
            <span>MỞ KHÓA HỆ THỐNG</span>
            <CheckCircle2 className="w-4 h-4" />
          </button>
        </form>

        <div className="border-t border-[#F4F1EA]/10 pt-3 text-center">
          <span className="text-[10px] font-mono-tech text-[#F4F1EA]/40 uppercase tracking-wider">
            Bảo mật thông tin nhân viên y tế
          </span>
        </div>
      </div>
    </div>
  );
};
