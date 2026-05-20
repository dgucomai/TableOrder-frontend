import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // 1. 사용자가 접속을 시도한 URL에서 쿼리 파라미터 추출
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('qt') || searchParams.get('qrToken') || searchParams.get('qtnum');

  // 2. 파라미터가 없으면 즉시 다른 페이지로 튕겨냄
  if (!token) {
    // '/access-denied' 경로로 강제 이동 (필요시 홈 경로 '/' 등으로 수정 가능)
    return NextResponse.redirect(new URL('/access-denied', request.url));
  }

  // 3. 파라미터가 존재하면 원래 요청한 페이지로 무사히 통과시킴
  return NextResponse.next();
}

// 4. 이 검사를 실행할 타겟 URL 설정
export const config = {
  matcher: [
    // /customer 경로와 그 하위 경로에서만 이 미들웨어가 작동함
    '/customer/:path*',
  ],
};