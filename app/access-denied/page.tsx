import { Metadata } from "next";
import AccessDenied from "./access-denied"; // 알맹이 불러오기

export const metadata: Metadata = {
  title: "토큰 만료", 
};

export default function AccessDeniedPage() {
return <AccessDenied />; // 클라이언트 컴포넌트를 조립해서 리턴
}