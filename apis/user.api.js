import axiosInstance from "../utils/axiosInstance";
import * as FileSystem from "expo-file-system";
import { handleApiError } from "../utils/handleApiError";

export const getMyProfile = async () => {
  try {
    const { data } = await axiosInstance.get("/user/me");
    return data.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

export const uploadAvatar = async (avatarUri, userId) => {
  try {
    const base64 = await FileSystem.readAsStringAsync(avatarUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    const fileType = avatarUri.split(".").pop();
    const payload = {
      avatar: `data:image/${fileType};base64,${base64}`,
    };
    const { data } = await axiosInstance.patch(`/user/${userId}`, payload);
    return data.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

export const updateProfile = async (profileData) => {
  try {
    const { data } = await axiosInstance.patch("/user/me", profileData);
    return data.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

export const findUserByPhone = async (phone) => {
  try {
    console.log(`Searching: ${phone}`);
    const { data } = await axiosInstance.get("/user/search", {
      params: { phone },
    });

    return data.data || [];
  } catch (error) {
    handleApiError(error);
    return [];
  }
};

export const getUserById = async (userId) => {
  try {
    const { data } = await axiosInstance.get(`/user/find-byid/${userId}`);
    return data.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};
