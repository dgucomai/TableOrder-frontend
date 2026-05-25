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
  
  // 1. 각각의 API 로딩 상태를 독립적으로 분리 관리
  const [isBaseLoading, setIsBaseLoading] = useState(true);
  const [isStaffLoading, setIsStaffLoading] = useState(true);

  // 2. 각각의 API 응답 데이터를 따로 임시 저장할 상태
  const [baseMenus, setBaseMenus] = useState<any[]>([]);
  const [staffMenus, setStaffMenus] = useState<any[]>([]);

  const [isTogglingSoldOut, setIsTogglingSoldOut] = useState(false);

  // [API 1] 일반 메뉴 정보 가져오기 (완전 독립 실행)
  useEffect(() => {
    const fetchBaseMenus = async () => {
      try {
        const response = await fetch("/api/menus");
        const result = await response.json();
        if (result.success && result.data?.menus) {
          setBaseMenus(result.data.menus);
        }
      } catch (error) {
        console.error("❌ 기본 메뉴(/api/menus) 호출 중 에러 발생:", error);
      } finally {
        setIsBaseLoading(false);
      }
    };
    fetchBaseMenus();
  }, []);

  // [API 2] 스태프 현황 정보 가져오기 (완전히 격리된 독립 실행)
  // sales.tsx와 완전히 동일한 단독 요청 구조로 만들어 패킷 누락을 완벽히 방지합니다.
  useEffect(() => {
    const fetchStaffMenus = async () => {
      try {
        console.log("▶️ [스태프 메뉴] staffFetch 요청을 전송합니다.");
        const response = await staffFetch("/api/staff/menus");
        const result = await response.json();
        console.log("✅ [스태프 메뉴] staffFetch 응답 수신 성공:", result);
        
        if (result.success && result.data) {
          setStaffMenus(result.data);
        }
      } catch (error) {
        console.error("❌ [스태프 메뉴] staffFetch 실행 자체에서 에러 발생:", error);
      } finally {
        setIsStaffLoading(false);
      }
    };
    fetchStaffMenus();
  }, []);

  // [데이터 병합] 두 API 데이터가 모두 준비 완료되면 실행되는 결합 프로세스
  useEffect(() => {
    // 둘 중 하나라도 아직 통신 중이라면 병합을 보류하고 기다립니다.
    if (isBaseLoading || isStaffLoading) return;

    let mergedMenus: MenuItem[] = [];

    if (baseMenus.length > 0) {
      // 기본 메뉴 데이터를 순회하면서 일치하는 스태프 수량 데이터를 조인
      mergedMenus = baseMenus.map((baseItem: any) => {
        const staffItem = staffMenus.find(
          (s: any) => Number(s.menuItemId) === Number(baseItem.menuId)
        );

        return {
          menuId: baseItem.menuId,
          categoryId: baseItem.categoryId || 0,
          categoryName: baseItem.categoryName || "기본",
          menuName: baseItem.menuName || "이름 없음",
          price: baseItem.price || 0,
          description: baseItem.description || "",
          imageUrl: baseItem.imageUrl || null,
          isSoldOut: baseItem.isSoldOut || false,
          // 수량이 정상 매핑되면 넣고, 없으면 안정적으로 0 처리
          countPreparing: staffItem ? staffItem.countPreparing : 0,
          countServed: staffItem ? staffItem.countServed : 0,
          subtotal: staffItem ? staffItem.subtotal : 0,
        };
      });
    } else if (staffMenus.length > 0) {
      // 예외 처리: 혹시 기본 메뉴 API가 먹통이 되더라도 스태프 데이터만 가지고 목록을 복구
      mergedMenus = staffMenus.map((staffItem: any) => ({
        menuId: staffItem.menuItemId,
        categoryId: 0,
        categoryName: "기본",
        menuName: staffItem.name || "이름 없음",
        price: 0,
        description: "",
        imageUrl: null,
        isSoldOut: false,
        countPreparing: staffItem.countPreparing || 0,
        countServed: staffItem.countServed || 0,
        subtotal: staffItem.subtotal || 0,
      }));
    }

    setMenus(mergedMenus);

    // 카테고리 실시간 추출 및 중복 제거
    const uniqueCategories = Array.from(
      new Set(mergedMenus.map((m: MenuItem) => m.categoryName).filter(Boolean))
    ) as string[];
    setCategories(["All", ...uniqueCategories]);

  }, [baseMenus, staffMenus, isBaseLoading, isStaffLoading]);

  // 브라우저 뒤로가기 핸들러
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

  const handleMenuClick = (menu: MenuItem) => {
    setSelectedMenu(menu);
    window.history.pushState(
      { menuId: menu.menuId },
      "",
      `?menuId=${menu.menuId}`
    );
  };

  const handleBackClick = () => {
    if (window.history.state?.menuId) {
      window.history.back();
    } else {
      setSelectedMenu(null);
    }
  };

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

  // 두 API 호출이 모두 완료되었을 때 로딩 레이아웃을 해제합니다.
  const isLoading = isBaseLoading || isStaffLoading;

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