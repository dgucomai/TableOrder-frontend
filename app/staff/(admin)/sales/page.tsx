import { Metadata } from "next";
import Sales from "./sales"; // 알맹이 불러오기

export const metadata: Metadata = {
  title: "매출현황", 
};

export default function StaffPage() {
  return <Sales />; // 클라이언트 컴포넌트를 조립해서 리턴
}