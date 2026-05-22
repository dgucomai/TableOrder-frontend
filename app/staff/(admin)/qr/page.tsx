import { Metadata } from "next";
import Qr from "./qr"; // 알맹이 불러오기

export const metadata: Metadata = {
  title: "QR", 
};

export default function QrPage() {
  return <Qr />; // 클라이언트 컴포넌트를 조립해서 리턴
}