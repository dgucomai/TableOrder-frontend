"use client";

import React from 'react';

const NotFound: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center px-6">
      <div className="text-center">
        {/* 에러 코드 및 아이콘 */}
        <h1 className="text-9xl font-extrabold text-blue-600 tracking-widest">404</h1>
        <div className="bg-blue-500 text-white px-2 text-sm rounded rotate-12 absolute transform -translate-y-12 translate-x-24">
          Page Not Found
        </div>

        {/* 메시지 섹션 */}
        <div className="mt-8">
          <h2 className="text-3xl font-bold text-gray-800 md:text-4xl">
            길을 잃으신 것 같아요!
          </h2>
          <p className="mt-4 text-gray-600 text-lg">
            찾으시려는 페이지가 삭제되었거나, 주소가 변경되었을 수 있습니다. <br />
            입력하신 주소가 정확한지 다시 한번 확인해 주세요.
          </p>
        </div>

        {/* 액션 버튼 */}
        <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
          <button 
            onClick={() => window.history.back()}
            className="px-6 py-3 border border-blue-600 text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition-colors"
          >
            이전 페이지로
          </button>
          
          <a 
            href="/"
            className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-shadow shadow-md"
          >
            메인으로 돌아가기
          </a>
        </div>
      </div>

      {/* 하단 장식 요소 (선택 사항) */}
      <div className="mt-16 text-gray-400 text-sm">
        © 2026 Your Service Name. All rights reserved.
      </div>
    </div>
  );
};

export default NotFound;