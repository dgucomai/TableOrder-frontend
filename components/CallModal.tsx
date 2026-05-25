import React, { useState } from 'react';
import { BellRing, X } from 'lucide-react';

const CALL_PRESETS = [
  "문제가 생겼어요",
  "앞접시 주세요",
  "젓가락 주세요",
  "테이블 정리 부탁드려요",
  "기타(직접 입력)"
];

const API_BASE_URL = "/api";

interface Props {
  setIsCallModalOpen: (open: boolean) => void;
  qrToken: string | null;
}

export default function CallModal({ setIsCallModalOpen, qrToken }: Props) {
  const [selectedCall, setSelectedCall] = useState<string>(CALL_PRESETS[0]);
  const [customCallText, setCustomCallText] = useState("");
  const [isCallLoading, setIsCallLoading] = useState(false);

  const submitStaffCall = async () => {
    const messageToSend = selectedCall === "기타(직접 입력)" ? customCallText : selectedCall;
    
    if (selectedCall === "기타(직접 입력)" && !customCallText.trim()) {
      alert("호출 내용을 입력해주세요.");
      return;
    }

    setIsCallLoading(true);

    try {
      const payload = { qrToken: qrToken, message: messageToSend };
      const response = await fetch(`${API_BASE_URL}/staff-call`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (result.success) {
        alert("직원 호출이 완료되었습니다. 잠시만 기다려주세요!");
        setIsCallModalOpen(false);
        setSelectedCall(CALL_PRESETS[0]);
        setCustomCallText("");
      } else {
        alert(result.message || "호출 중 오류가 발생했습니다.");
      }
    } catch (error) {
      alert("서버와 통신하는 중 에러가 발생했습니다.");
    } finally {
      setIsCallLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/60 flex flex-col justify-end">
      <div className="bg-white w-full rounded-t-[32px] p-6 animate-in slide-in-from-bottom duration-300">
        <div className="flex justify-between items-center mb-6 shrink-0">
          <h2 className="text-xl text-black font-bold flex items-center gap-3 whitespace-nowrap">
            <BellRing className="text-orange-600 shrink-0" size={24} />
            직원 호출
          </h2>
          <button onClick={() => setIsCallModalOpen(false)} className="p-2 bg-orange-500 text-white hover:bg-orange-600 rounded-full transition-colors shrink-0">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-3 mb-6">
          <p className="text-sm font-bold text-gray-600 whitespace-nowrap truncate">어떤 도움이 필요하신가요?</p>
          
          <div className="flex flex-wrap gap-2">
            {CALL_PRESETS.map((preset) => (
              <button
                key={preset}
                onClick={() => setSelectedCall(preset)}
                className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-colors border whitespace-nowrap shrink-0 ${
                  selectedCall === preset 
                    ? "bg-orange-50 border-orange-500 text-orange-600" 
                    : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                {preset}
              </button>
            ))}
          </div>

          {selectedCall === "기타(직접 입력)" && (
            <div className="mt-4 animate-in fade-in zoom-in-95 duration-200">
              <input
                type="text"
                value={customCallText}
                onChange={(e) => setCustomCallText(e.target.value)}
                maxLength={20}
                placeholder="필요한 사항을 적어주세요. (20자 이내)"
                className="text-black w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-sm whitespace-nowrap"
                autoFocus
              />
            </div>
          )}
        </div>

        <button
          onClick={submitStaffCall}
          disabled={isCallLoading}
          className="w-full py-4 bg-gray-900 text-white rounded-2xl font-bold text-lg disabled:bg-gray-400 transition-colors flex justify-center items-center whitespace-nowrap shrink-0"
        >
          {isCallLoading ? "호출 중..." : "직원 부르기"}
        </button>
      </div>
    </div>
  );
}