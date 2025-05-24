import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from "@env";
API_URL != null ? API_URL : "http://192.168.1.9:3000/api";
const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  timeout: 20000,
});

axiosInstance.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (e) {
      console.error("Error getting token:", e);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default axiosInstance;
export const handleApiError = (error) => {
  if (error.response) {
    return error.response.data?.message || "Đã xảy ra lỗi từ server";
  } else if (error.request) {
    return "Không thể kết nối đến máy chủ. Kiểm tra mạng!";
  } else {
    return "Lỗi không xác định";
  }
};
