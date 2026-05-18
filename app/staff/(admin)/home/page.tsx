import { Metadata } from "next";
import Home from "./home"; // 알맹이 불러오기

export const metadata: Metadata = {
  title: "STAFF HOME", 
};

export default function StaffPage() {
  return <Home />; // 클라이언트 컴포넌트를 조립해서 리턴
}