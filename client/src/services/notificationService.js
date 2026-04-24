import api from "../api";

const API_BASE = "/api/notifications";

export const getNotifications = async (limit = 20) => {
  const response = await api.get(API_BASE, { params: { limit } });
  const payload = response?.data;
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

export const getUnreadCount = async () => {
  const response = await api.get(`${API_BASE}/unread-count`);
  const payload = response?.data;
  if (typeof payload?.count === "number") return payload.count;
  if (typeof payload?.data?.count === "number") return payload.data.count;
  return 0;
};

export const markNotificationAsRead = async (id) => {
  const response = await api.patch(`${API_BASE}/${id}/read`);
  return response?.data?.data ?? response?.data;
};

export const markAllNotificationsAsRead = async () => {
  const response = await api.patch(`${API_BASE}/read-all`);
  const payload = response?.data;
  if (typeof payload?.updated === "number") return payload.updated;
  if (typeof payload?.data?.updated === "number") return payload.data.updated;
  return 0;
};

export const deleteNotificationById = async (id) => {
  await api.delete(`${API_BASE}/${id}`);
};
