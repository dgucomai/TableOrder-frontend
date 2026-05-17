import { Metadata } from "next";
import Menu from "./menu"; // 알맹이 불러오기

export const metadata: Metadata = {
  title: "STAFF MENU", 
};

export default function StaffPage() {
  return <Menu />; // 클라이언트 컴포넌트를 조립해서 리턴
}