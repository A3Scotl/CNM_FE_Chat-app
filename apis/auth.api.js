import axiosInstance from "./axiosInstance";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { handleApiError } from "../utils/handleApiError";

export const login = async ({ phoneNumber, passWord }) => {
  try {
    const { data } = await axiosInstance.post("/auth/log-in", { phoneNumber, passWord });

    if (data?.data?.access_token) {
      await AsyncStorage.setItem('token', data.data.access_token);
      // console.log("Đăng nhập thành công:", data);
    }
    return data;
  } catch (error) {
    handleApiError(error);
  }
};
export const register = async (form) => {
  try {
    const { data } = await axiosInstance.post("/auth/sign-up", form);
    console.log("Đăng ký thành công:", data);
    return data;
  } catch (error) {
    handleApiError(error);
  }
};
export const logout = async () => {
  try {
    await axiosInstance.post("/auth/logout");
    await AsyncStorage.removeItem('token');
    console.log("Đăng xuất thành công");
  } catch (error) {
    handleApiError(error);
  }
};
export const verifyOtpSignup = async ({ phoneNumber, otp }) => {
  try {
    const { data } = await axiosInstance.post('/auth/verifyOtpSignup', {
      phoneNumber,
      otp,
    });
    console.log("Xác minh OTP thành công:", data);
    return data;
  } catch (error) {
    handleApiError(error);
  }
};
