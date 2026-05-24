let isRefreshing = false;
let pendingQueue: Array<(newToken: string) => void> = [];

function flushQueue(newToken: string) {
  pendingQueue.forEach((cb) => cb(newToken));
  pendingQueue = [];
}

function clearTokensAndRedirect() {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("staffId");
  localStorage.removeItem("currentStaffName");
  window.location.replace("/staff");
}

function buildHeaders(options: RequestInit, token: string): HeadersInit {
  return {
    ...(options.headers as Record<string, string>),
    Authorization: `Bearer ${token}`,
  };
}

export async function staffFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const accessToken = localStorage.getItem("accessToken") || "";
  const res = await fetch(url, {
    ...options,
    headers: buildHeaders(options, accessToken),
  });

  if (res.status !== 401) return res;

  // 401 — 다른 요청이 이미 갱신 중이면 완료될 때까지 대기
  if (isRefreshing) {
    return new Promise<Response>((resolve) => {
      pendingQueue.push(async (newToken) => {
        resolve(
          fetch(url, { ...options, headers: buildHeaders(options, newToken) })
        );
      });
    });
  }

  isRefreshing = true;

  try {
    const refreshToken = localStorage.getItem("refreshToken") || "";
    const refreshRes = await fetch("/api/staff/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    const refreshData = await refreshRes.json();

    if (!refreshRes.ok || refreshData.success === false) {
      clearTokensAndRedirect();
      return res;
    }

    const newAccessToken = refreshData.data.accessToken;
    localStorage.setItem("accessToken", newAccessToken);
    if (refreshData.data.refreshToken) {
      localStorage.setItem("refreshToken", refreshData.data.refreshToken);
    }

    flushQueue(newAccessToken);

    return fetch(url, {
      ...options,
      headers: buildHeaders(options, newAccessToken),
    });
  } catch {
    clearTokensAndRedirect();
    return res;
  } finally {
    isRefreshing = false;
  }
}
