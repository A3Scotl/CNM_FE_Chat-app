import axiosInstance from "./axiosInstance";
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
    const data = {
      avatar: `data:image/${fileType};base64,${base64}`,
    };

    const response = await axiosInstance.patch(`/user/${userId}`, data);
    console.log("Upload response:", response.data);
    return response.data.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

export const searchUserByPhone = async (phone) => {
  try {
    const { data } = await axiosInstance.get(`/users/search?phone=${phone}`);
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