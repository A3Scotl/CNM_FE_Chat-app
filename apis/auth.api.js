import axiosInstance from "../utils/axiosInstance";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { handleApiError } from "../utils/handleApiError";

export const login = async ({ phoneNumber, passWord }) => {
  try {
    const { data } = await axiosInstance.post("/auth/log-in", { phoneNumber, passWord });
    if (data?.data?.access_token) {
      await AsyncStorage.setItem("token", data.data.access_token);
    }
    if (data?.data?.user?._id) {
      await AsyncStorage.setItem("userId", data.data.user._id);
    }
    console.log("Login successful:", data.data.user._id);
    return data;
  } catch (error) {
    const errorMessage = handleApiError(error);
    throw new Error(errorMessage);
  }
};

export const register = async (form) => {
  try {
    const { data } = await axiosInstance.post("/auth/sign-up", form);
    return data;
  } catch (error) {
    const errorMessage = handleApiError(error);
    throw new Error(errorMessage);
  }
};

export const logout = async () => {
  try {
    await axiosInstance.post("/auth/logout");
    await AsyncStorage.removeItem("token");
    await AsyncStorage.removeItem("userId");
  } catch (error) {
    const errorMessage = handleApiError(error);
    throw new Error(errorMessage);
  }
};

export const requestOtpSignup = async (form) => {
  try {
    const { data } = await axiosInstance.post("/auth/sign-up/request-otp", form);
    return data;
  } catch (error) {
    const errorMessage = handleApiError(error);
    throw new Error(errorMessage);
  }
};

export const sendOtp = async (phoneNumber) => {
  try {
    const { data } = await axiosInstance.post("/auth/send-otp", { phoneNumber });
    return data;
  } catch (error) {
    const errorMessage = handleApiError(error);
    throw new Error(errorMessage);
  }
};

export const requestOtpForgotPassword = async (phoneNumber) => {
  try {
    const { data } = await axiosInstance.post("/auth/forgot-password", { phoneNumber });
    return data;
  } catch (error) {
    const errorMessage = handleApiError(error);
    throw new Error(errorMessage);
  }
};

export const verifyOtpFotgotpassword = async ({ phoneNumber, otp }) => {
  try {
    const { data } = await axiosInstance.post("/auth/forgot-password/verify-otp", { phoneNumber, otp });
    console.log("Xác minh OTP quên mật khẩu thành công:", data);
    return data;
  } catch (error) {
    const errorMessage = handleApiError(error);
    throw new Error(errorMessage);
  }
};

export const resetPasswordWithOtp = async ({ phoneNumber, otp, newPassword }) => {
  try {
    const { data } = await axiosInstance.post("/auth/reset-password", { phoneNumber, otp, newPassword });
    return data;
  } catch (error) {
    const errorMessage = handleApiError(error);
    throw new Error(errorMessage);
  }
};

export const verifyOtpSignup = async ({ phoneNumber, otp }) => {
  try {
    const { data } = await axiosInstance.post("/auth/sign-up/verify-otp", { phoneNumber, otp });
    if (data?.data?.access_token) {
      await AsyncStorage.setItem("token", data.data.access_token);
    }
    return data;
  } catch (error) {
    const errorMessage = handleApiError(error);
    throw new Error(errorMessage);
  }
};

export const changePassword = async ({ oldPassword, newPassword, confirmPassword }) => {
  try {
    const token = await AsyncStorage.getItem("token");
    const { data } = await axiosInstance.post(
      "/auth/change-password",
      { oldPassword, newPassword, confirmPassword },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return data;
  } catch (error) {
    const errorMessage = handleApiError(error);
    throw new Error(errorMessage);
  }
};