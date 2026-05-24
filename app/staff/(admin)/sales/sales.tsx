"use client";

import React, { useState, useEffect } from 'react';
import { staffFetch } from "@/lib/staffFetch";

export default function SalesReport() {
  // 화면에 띄울 텍스트(매출액 또는 에러 메시지)를 하나의 상태로 관리합니다.
  const [displayText, setDisplayText] = useState('불러오는 중...');

  useEffect(() => {
    const fetchSalesData = async () => {
      try {
        const response = await staffFetch('/api/admin/sales');
        const result = await response.json();

        // 성공 여부에 따라 화면에 띄울 값을 다르게 설정합니다.
        if (result.success === true) {
          // 성공: {"success":true,"data":{"totalSales":71000},"message":null}
          setDisplayText(result.data.totalSales + '원');
        } else {
          // 실패: {"success":false,"data":null,"message":"스태프를 찾을 수 없습니다"}
          setDisplayText(result.message); 
        }
      } catch (error) {
        // 서버가 죽었거나 네트워크가 끊긴 경우의 대비책
        console.error("통신 에러:", error);
        setDisplayText("통신 오류가 발생했습니다.");
      }
    };

    fetchSalesData();
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '2rem' }}>
      <h2>매출 현황</h2>
      
      <div style={{ marginTop: '1rem', padding: '1rem', border: '1px solid #ccc', borderRadius: '8px' }}>
        <strong style={{ fontSize: '1.5rem', color: '#0070f3' }}>
          {displayText}
        </strong>
      </div>
    </div>
  );
}