"use client";

import React, { useEffect, useState } from "react";
import { staffFetch } from "@/lib/staffFetch";
import { MenuItem } from "./types";
import MenuListView from "./MenuListView";
import MenuDetailView from "./MenuDetailView";

export default function StaffMenuPage() {
  const [menus, setMenus] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<string[]>(["All"]);
  const [selectedMenu, setSelectedMenu] = useState<MenuItem | null>(null);
  const [activeCategory, setActiveCategory] = useState("All");
  const [isLoading, setIsLoading] = useState(true);
  const [isTogglingSoldOut, setIsTogglingSoldOut] = useState(false);

  // 메뉴 리스트 API 호출 및 안정적인 데이터 병합
  useEffect(() => {
    const fetchMenus = async () => {
      let originMenus = [];
      let staffData: any[] = [];

      try {
        setIsLoading(true);
        console.log("[스태프 메뉴] 데이터 로딩 시작");

        // 1. 일반 메뉴 API 호출
        console.log("[스태프 메뉴] 1단계: /api/menus 호출 시도...");
        const menuRes = await fetch("/api/menus");
        const menuResult = await menuRes.json();
        console.log("[스태프 메뉴] 1단계 성공 응답:", menuResult);
        
        if (menuResult.success && menuResult.data?.menus) {
          originMenus = menuResult.data.menus;
        }

        // 2. 스태프 현황 메뉴 API 호출 (개별 try-catch로 감싸서 예외 격리)
        console.log("[스태프 메뉴] 2단계: /api/staff/menus 호출 시도...");
        try {
          const staffRes = await staffFetch("/api/staff/menus");
          const staffResult = await staffRes.json();
          console.log("[스태프 메뉴] 2단계 성공 응답:", staffResult);

          if (staffResult.success && staffResult.data) {
            staffData = staffResult.data;
          }
        } catch (staffError) {
          // staffFetch 내부(JWT 검증, 로컬스토리지 접근 등)에서 터지면 이곳에 잡힙니다.
          console.error("[스태프 메뉴] 2단계(staffFetch) 자체에서 에러 발생:", staffError);
          alert("스태프 전용 API 호출 중 실패했습니다. 콘솔 창을 확인하세요.");
        }

        // 3. 두 데이터 병합 프로세스 수행
        console.log("[스태프 메뉴] 3단계: 데이터 병합 프로세스 시작");
        if (originMenus.length > 0) {
          const mergedMenus: MenuItem[] = originMenus.map((originItem: any) => {
            const staffItem = staffData.find(
              (s: any) => s.menuItemId === originItem.menuId
            );

            return {
              menuId: originItem.menuId,
              categoryId: originItem.categoryId,
              categoryName: originItem.categoryName,
              menuName: originItem.menuName,
              price: originItem.price,
              description: originItem.description,
              imageUrl: originItem.imageUrl,
              isSoldOut: originItem.isSoldOut,
              // staff/menus 패킷이 실패해 데이터가 없더라도 화면이 깨지지 않게 0으로 방어 처리
              countPreparing: staffItem ? staffItem.countPreparing : 0,
              countServed: staffItem ? staffItem.countServed : 0,
              subtotal: staffItem ? staffItem.subtotal : 0,
            };
          });

          console.log("[스태프 메뉴] 최종 병합 완료 데이터:", mergedMenus);
          setMenus(mergedMenus);

          // 카테고리 추출
          const uniqueCategories = Array.from(
            new Set(mergedMenus.map((m: MenuItem) => m.categoryName))
          ) as string[];
          setCategories(["All", ...uniqueCategories]);
        }

      } catch (error) {
        console.error("[스태프 메뉴] 전체 흐름 중 치명적 오류 발생:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMenus();
  }, []);

  // 브라우저 뒤로가기(History API) 처리용 useEffect
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      if (event.state && event.state.menuId) {
        const menu = menus.find((m) => m.menuId === event.state.menuId);
        if (menu) setSelectedMenu(menu);
      } else {
        setSelectedMenu(null);
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [menus]);

  // 상세 메뉴 클릭 처리
  const handleMenuClick = (menu: MenuItem) => {
    setSelectedMenu(menu);
    window.history.pushState(
      { menuId: menu.menuId },
      "",
      `?menuId=${menu.menuId}`
    );
  };

  // 상세 메뉴 내 뒤로가기 버튼 클릭 처리
  const handleBackClick = () => {
    if (window.history.state?.menuId) {
      window.history.back();
    } else {
      setSelectedMenu(null);
    }
  };

  // 품절 상태 변경 API 호출 로직
  const toggleSoldOutStatus = async () => {
    if (!selectedMenu) return;

    try {
      setIsTogglingSoldOut(true);
      const newSoldOutStatus = !selectedMenu.isSoldOut;
      
      const response = await staffFetch(`/api/admin/menu-items/${selectedMenu.menuId}/sold-out`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isSoldOut: newSoldOutStatus }),
      });

      const result = await response.json();

      if (result.success) {
        const updatedMenu = { ...selectedMenu, isSoldOut: newSoldOutStatus };
        setSelectedMenu(updatedMenu);
        setMenus((prevMenus) =>
          prevMenus.map((m) =>
            m.menuId === updatedMenu.menuId ? updatedMenu : m
          )
        );
      } else {
        alert(result.message || "품절 상태 변경에 실패했습니다.");
      }
    } catch (error) {
      console.error("품절 상태 통신 오류:", error);
      alert("통신 오류가 발생했습니다.");
    } finally {
      setIsTogglingSoldOut(false);
    }
  };

  if (selectedMenu) {
    return (
      <MenuDetailView
        menu={selectedMenu}
        isTogglingSoldOut={isTogglingSoldOut}
        onBackClick={handleBackClick}
        onToggleSoldOut={toggleSoldOutStatus}
      />
    );
  }

  return (
    <MenuListView
      menus={menus}
      categories={categories}
      activeCategory={activeCategory}
      isLoading={isLoading}
      onCategoryChange={setActiveCategory}
      onMenuClick={handleMenuClick}
    />
  );
}