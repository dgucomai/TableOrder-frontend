"use client";

import React, { useEffect, useState } from "react";
import { staffFetch } from "@/lib/staffFetch";
import { MenuItem, StaffOrderItem } from "./types";
import { getOrdersFromStorage } from "./utils";
import MenuListView from "./MenuListView";
import MenuDetailView from "./MenuDetailView";

export default function StaffMenuPage() {
  const [orders, setOrders] = useState<StaffOrderItem[]>([]);
  const [menus, setMenus] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<string[]>(["All"]);
  const [selectedMenu, setSelectedMenu] = useState<MenuItem | null>(null);
  const [activeCategory, setActiveCategory] = useState("All");
  const [isLoading, setIsLoading] = useState(true);
  const [isTogglingSoldOut, setIsTogglingSoldOut] = useState(false);

  // 메뉴 데이터 API 호출
  useEffect(() => {
    const fetchMenus = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("/api/menus");
        const result = await response.json();

        if (result.success && result.data?.menus) {
          const fetchedMenus = result.data.menus;
          setMenus(fetchedMenus);

          const uniqueCategories = Array.from(
            new Set(fetchedMenus.map((m: MenuItem) => m.categoryName))
          ) as string[];
          setCategories(["All", ...uniqueCategories]);
        }
      } catch (error) {
        console.error("메뉴 API 호출 중 오류 발생:", error);
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

  // 주문 데이터 갱신 및 로컬스토리지 동기화
  const refreshOrders = () => {
    setOrders(getOrdersFromStorage());
  };

  useEffect(() => {
    refreshOrders();

    const handleStorage = (event: StorageEvent) => {
      if (event.key === "staffOrders") refreshOrders();
    };
    const handleFocus = () => refreshOrders();

    window.addEventListener("storage", handleStorage);
    window.addEventListener("focus", handleFocus);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  // 상세 메뉴 클릭 처리 (히스토리 스택 추가)
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

      if (result.success && result.data) {
        const updatedMenu = result.data;
        
        // 현재 열려있는 상세 메뉴 상태 업데이트
        setSelectedMenu(updatedMenu);
        
        // 전체 메뉴 목록의 해당 메뉴 상태도 업데이트
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

  // 조건부 렌더링: 선택된 메뉴가 있으면 상세 뷰, 없으면 목록 뷰 렌더링
  if (selectedMenu) {
    return (
      <MenuDetailView
        menu={selectedMenu}
        orders={orders}
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
      orders={orders}
      onCategoryChange={setActiveCategory}
      onMenuClick={handleMenuClick}
    />
  );
}