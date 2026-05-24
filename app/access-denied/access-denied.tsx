import React from 'react';
import { QrCode } from 'lucide-react';

export default function AccessDeniedPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-[32px] p-8 shadow-sm border border-gray-100 flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-200">
        
        {/* 친절한 안내 아이콘 (빨간색 경고 대신 부드러운 파란색 계열 사용) */}
        <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-6">
          <QrCode className="text-blue-500 w-8 h-8" />
        </div>
        
        {/* 친근한 타이틀 */}
        <h1 className="text-xl font-bold text-gray-900 mb-3 tracking-tight">
          토큰이 만료되었어요
        </h1>
        
        {/* 간결하고 직관적인 설명 */}
        <p className="text-gray-500 text-sm leading-relaxed mb-8">
          계속해서 둘러보시려면<br />
          테이블의 <strong>QR 코드를 다시 스캔</strong>해 주세요!
        </p>

        {/* 간결한 추가 안내 (선택사항) */}
        <div className="w-full bg-gray-50 p-4 rounded-2xl border border-gray-100 text-center">
          <p className="text-sm text-gray-600">
            💡 지속해서 문제가 발생하면<br />
            직원에게 문의해 주세요.
          </p>
        </div>

      </div>
    </div>
  );
}