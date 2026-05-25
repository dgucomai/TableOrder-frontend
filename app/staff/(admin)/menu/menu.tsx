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

  // 메뉴 리스트 API 호출
  useEffect(() => {
    const fetchMenus = async () => {
      try {
        setIsLoading(true);
        const response = await staffFetch("/api/staff/menus");
        const result = await response.json();

        if (result.success && result.data) {
          // API 응답 객체를 UI 요구사항에 맞게 매핑
          const fetchedMenus: MenuItem[] = result.data.map((item: any) => ({
            ...item,
            menuId: item.menuItemId,
            menuName: item.name,
            // API 응답에 누락될 경우를 대비한 기본값 처리
            categoryName: item.categoryName || "기본",
            price: item.price || 0,
            imageUrl: item.imageUrl || null,
            isSoldOut: item.isSoldOut || false,
          }));
          
          setMenus(fetchedMenus);

          const uniqueCategories = Array.from(
            new Set(fetchedMenus.map((m: MenuItem) => m.categoryName).filter(Boolean))
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