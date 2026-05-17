import { Metadata } from "next";
import Calls from "./calls"; // 알맹이 불러오기

export const metadata: Metadata = {
  title: "STAFF CALL", 
};

export default function StaffPage() {
  return <Calls />; // 클라이언트 컴포넌트를 조립해서 리턴
}