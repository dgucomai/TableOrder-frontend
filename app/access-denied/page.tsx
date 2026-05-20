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
          접근 권한이 없습니다
        </h1>
        
        <p className="text-gray-500 text-sm leading-relaxed mb-8">
          유효하지 않은 접근이거나 인증 정보가 누락되었습니다.<br />
          테이블에 부착된 <strong>QR 코드를 다시 스캔</strong>하거나<br />
          매장 직원에게 문의해 주시기 바랍니다.
        </p>

        {/*
        <div className="w-full bg-gray-50 p-4 rounded-2xl border border-gray-100 flex items-start gap-3 text-left">
          <AlertTriangle className="text-orange-500 w-5 h-5 shrink-0 mt-0.5" />
          <div className="text-xs text-gray-600 leading-normal">
            <span className="font-bold block mb-0.5">지속적으로 오류가 발생하나요?</span>
            브라우저의 주소창에 <code className="bg-gray-200 px-1 py-0.5 rounded font-mono text-[11px]">?qtnum=토큰값</code> 형식을 포함하여 정상적인 경로로 접근했는지 확인해 주세요.
          </div>
        </div>
        */}

      </div>
    </div>
  );
}