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

  useEffect(() => {
    const fetchMenus = async () => {
      setIsLoading(true);

      let originMenus: any[] = [];
      let staffData: any[] = [];

      const [menuResult, staffResult] = await Promise.allSettled([
        fetch("/api/menus").then((r) => { if (!r.ok) throw new Error(`${r.status}`); return r.json(); }),
        staffFetch("/api/staff/menus").then((r) => { if (!r.ok) throw new Error(`${r.status}`); return r.json(); }),
      ]);

      if (menuResult.status === "fulfilled" && menuResult.value?.data?.menus) {
        originMenus = menuResult.value.data.menus;
      } else if (menuResult.status === "rejected") {
        console.error("❌ /api/menus 실패:", menuResult.reason);
      }

      if (staffResult.status === "fulfilled" && staffResult.value?.data) {
        staffData = staffResult.value.data;
      } else if (staffResult.status === "rejected") {
        console.error("❌ /api/staff/menus 실패:", staffResult.reason);
      }

      // [3] 안전한 병합 로직
      let mergedMenus: MenuItem[] = [];

      if (originMenus.length > 0) {
        // 기본 메뉴를 바탕으로 스태프 데이터를 끼워넣음
        mergedMenus = originMenus.map((originItem: any) => {
          // 간혹 string과 number 타입이 달라 매칭이 안되는 경우를 방어하기 위해 Number() 강제 형변환
          const staffItem = staffData.find(
            (s: any) => Number(s.menuItemId) === Number(originItem.menuId)
          );

          return {
            menuId: originItem.menuId,
            categoryId: originItem.categoryId || 0,
            categoryName: originItem.categoryName || "기본",
            menuName: originItem.menuName || "이름 없음",
            price: originItem.price || 0,
            description: originItem.description || "",
            // imageUrl 속성에 API의 imageUrl360 값을 매핑합니다.
            imageUrl: originItem.imageUrl360 || null,
            isSoldOut: originItem.isSoldOut || false,
            countPreparing: staffItem ? staffItem.countPreparing : 0,
            countServed: staffItem ? staffItem.countServed : 0,
            subtotal: staffItem ? staffItem.subtotal : 0,
            totalItemCount: staffItem ? staffItem.totalItemCount : 0,
          };
        });
      } else if (staffData.length > 0) {
        // 만약 기본 메뉴 API가 터졌는데 스태프 API만 성공한 경우, 화면이 텅 비는 것을 막기 위한 예외 처리
        mergedMenus = staffData.map((staffItem: any) => ({
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
            totalItemCount: staffItem.totalItemCount || 0,
        }));
      }

      // 상태 업데이트
      setMenus(mergedMenus);
      
      const uniqueCategories = Array.from(
        new Set(mergedMenus.map((m: MenuItem) => m.categoryName))
      ) as string[];
      setCategories(["All", ...uniqueCategories]);
      
      setIsLoading(false);
    };

    fetchMenus();
  }, []);

  // 뒤로가기 제어용
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