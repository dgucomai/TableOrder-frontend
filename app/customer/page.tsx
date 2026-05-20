import { Metadata } from "next";
import Customer from "./customer"; // 알맹이 불러오기

export const metadata: Metadata = {
  title: "주문 페이지", 
};

export default function CustomerPage() {
  return <Customer />; // 클라이언트 컴포넌트를 조립해서 리턴
}