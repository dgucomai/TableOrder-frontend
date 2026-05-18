import { Metadata } from "next";
import Login from "./login"; // 알맹이 불러오기

export const metadata: Metadata = {
  title: "STAFF LOGIN", 
};

export default function StaffPage() {
  return <Login />; // 클라이언트 컴포넌트를 조립해서 리턴
}