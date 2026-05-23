import React from 'react';
import { XCircle, AlertTriangle } from 'lucide-react';

export default function AccessDeniedPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-[32px] p-8 shadow-sm border border-gray-100 flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-200">
        
        {/* 경고 아이콘 영역 */}
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-6">
          <XCircle className="text-red-500 w-10 h-10" />
        </div>
        
        {/* 에러 메시지 */}
        <h1 className="text-2xl font-black text-gray-900 mb-3 tracking-tight">
          토큰이 만료 되었습니다.
        </h1>
        
        <p className="text-gray-500 text-sm leading-relaxed mb-8">
          유효하지 않은 접근이거나 인증 정보가 누락되었습니다.<br />
          테이블에 부착된 <strong>QR 코드를 다시 스캔</strong>하거나<br />
          매장 직원에게 문의해 주시기 바랍니다.
        </p>

        {/* 안내 문구 또는 추가 액션 버튼 (필요 시 주석 해제 후 사용) */}
        <div className="w-full bg-gray-50 p-4 rounded-2xl border border-gray-100 flex items-start gap-3 text-left">
          <AlertTriangle className="text-orange-500 w-5 h-5 shrink-0 mt-0.5" />
        </div>

      </div>
    </div>
  );
}