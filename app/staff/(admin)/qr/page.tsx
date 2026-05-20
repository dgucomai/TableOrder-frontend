"use client";

import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode'; // npm install qrcode @types/qrcode 필요

const QRCodeGenerator: React.FC = () => {
  // 사용자가 입력한 텍스트를 관리하는 상태
  const [inputText, setInputText] = useState<string>('https://donggukcomai.shop/?qt=');
  // 생성된 QR 코드의 Data URL(Base64)을 저장하는 상태
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');

  // inputText가 변경될 때마다 QR 코드를 새로 생성
  useEffect(() => {
    const generateQR = async () => {
      // 입력값이 비어있으면 QR 코드를 지움
      if (!inputText.trim()) {
        setQrCodeUrl('');
        return;
      }

      try {
        const dataUrl = await QRCode.toDataURL(inputText, {
          errorCorrectionLevel: 'H',
          margin: 2,
          width: 250,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        });
        setQrCodeUrl(dataUrl);
      } catch (error) {
        console.error('QR 코드 생성 실패:', error);
      }
    };

    generateQR();
  }, [inputText]);

  // 입력창 변경 핸들러
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '2rem' }}>
      <h2>QR 코드 생성기</h2>
      
      <input
        type="text"
        value={inputText}
        onChange={handleInputChange}
        placeholder="URL 또는 텍스트를 입력하세요"
        style={{
          width: '300px',
          padding: '10px',
          marginBottom: '20px',
          borderRadius: '4px',
          border: '1px solid #ccc'
        }}
      />

      {/* qrCodeUrl 값이 있을 때만 img 태그 렌더링 */}
      {qrCodeUrl ? (
        <img 
          src={qrCodeUrl} 
          alt="Generated QR Code" 
          style={{ border: '1px solid #eee', borderRadius: '8px', padding: '10px' }}
        />
      ) : (
        <p style={{ color: '#888' }}>텍스트를 입력하면 QR 코드가 생성됩니다.</p>
      )}
    </div>
  );
};

export default QRCodeGenerator;