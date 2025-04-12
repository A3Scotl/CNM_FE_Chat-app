import axiosInstance from "./axiosInstance";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { handleApiError } from "../utils/handleApiError";

export const login = async ({ phoneNumber, passWord }) => {
  try {
    const { data } = await axiosInstance.post("/auth/log-in", { phoneNumber, passWord });

    if (data?.data?.access_token) {
      await AsyncStorage.setItem('token', data.data.access_token);
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
// Gửi OPT khi đăng kí
export const requestOtpSignup = async (form) => {
  try {
    const { data } = await axiosInstance.post("/auth/sign-up/request-otp", form);
    console.log("Gửi OTP đăng ký thành công:", data);
    return data;
  } catch (error) {
    handleApiError(error);
  }
};

// Gửi OTP đến số điện thoại
export const sendOtp = async (phoneNumber) => {
  try {
    const { data } = await axiosInstance.post("/auth/send-otp", { phoneNumber });
    console.log("Gửi OTP thành công:", data);
    return data;
  } catch (error) {
    handleApiError(error);
  }
};

// Yêu cầu OTP cho quên mật khẩu
export const requestOtpFotgotPassword = async (phoneNumber) => {
  try {
    const { data } = await axiosInstance.post("/auth/forgot-password", { phoneNumber });
    console.log("Gửi OTP quên mật khẩu thành công:", data);
    return data;
  } catch (error) {
    handleApiError(error);
  }
};

// Xác minh OTP quên mật khẩu
export const verifyOtpFotgotpassword = async ({ phoneNumber, otp }) => {
  try {
    const { data } = await axiosInstance.post("/auth/forgot-password/verify-otp", { phoneNumber, otp });
    console.log("Xác minh OTP quên mật khẩu thành công:", data);
    return data;
  } catch (error) {
    handleApiError(error);
  }
};

// Đặt lại mật khẩu với OTP (user tự chọn password mới)
export const resetPasswordWithOtp = async ({ phoneNumber, otp, newPassword }) => {
  try {
    const { data } = await axiosInstance.post("/auth/reset-password", { phoneNumber, otp, newPassword });
    console.log("Đặt lại mật khẩu thành công:", data);
    return data;
  } catch (error) {
    handleApiError(error);
  }
};

// Xác minh OTP đăng ký (hoàn tất đăng ký)
export const verifyOtpSignup = async ({ phoneNumber, otp }) => {
  try {
    const { data } = await axiosInstance.post('/auth/sign-up/verify-otp', { phoneNumber, otp });
    console.log("Xác minh OTP đăng ký thành công:", data);
    if (data?.data?.access_token) {
      await AsyncStorage.setItem('token', data.data.access_token);
    }
    return data;
  } catch (error) {
    handleApiError(error);
  }
};

// Đổi mật khẩu khi đã đăng nhập
export const changePassword = async ({ oldPassword, newPassword, confirmPassword }) => {
  try {
    const token = await AsyncStorage.getItem('token');
    const { data } = await axiosInstance.post("/auth/change-password",
      { oldPassword, newPassword, confirmPassword },
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
    console.log("Đổi mật khẩu thành công:", data);
    return data;
  } catch (error) {
    handleApiError(error);
  }
};
