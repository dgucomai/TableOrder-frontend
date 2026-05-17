import { Metadata } from "next";
import Log from "./log"; // 알맹이 불러오기

export const metadata: Metadata = {
  title: "STAFF LOG", 
};

export default function StaffPage() {
  return <Log />; // 클라이언트 컴포넌트를 조립해서 리턴
}