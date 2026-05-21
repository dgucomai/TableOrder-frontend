import { Metadata } from "next";
import Orders from "./orders"; // 알맹이 불러오기

export const metadata: Metadata = {
  title: "주문 내역", 
};

export default function OrdersPage() {
  return <Orders />; // 클라이언트 컴포넌트를 조립해서 리턴
}