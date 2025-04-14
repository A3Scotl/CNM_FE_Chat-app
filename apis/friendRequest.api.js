import axiosInstance from "../utils/axiosInstance";
import { handleApiError } from "../utils/handleApiError";

export const sendRequest = async (toUserId) => {
  try {
    const { data } = await axiosInstance.post("/friend-request/send", { to: toUserId });
    console.log("Friend request sent to:", toUserId);
    return data;
  } catch (error) {
    const errorMessage = handleApiError(error);
    throw new Error(errorMessage || "Failed to send friend request");
  }
};

export const getRequests = async (userId) => {
  try {
    const response = await axiosInstance.get(`/friend-request/pending?userId=${userId}`);
    return response.data;
  } catch (error) {
    const errorMessage = handleApiError(error);
    throw new Error(errorMessage || "Failed to fetch pending requests");
  }
};

export const acceptRequest = async (requestId) => {
  try {
    const { data } = await axiosInstance.put(`/friend-request/accept/${requestId}`);
    return data;
  } catch (error) {
    const errorMessage = handleApiError(error);
    throw new Error(errorMessage || "Failed to accept friend request");
  }
};

export const rejectRequest = async (requestId) => {
  try {
    const { data } = await axiosInstance.put(`/friend-request/reject/${requestId}`);
    console.log("Rejected request:", requestId);
    return data;
  } catch (error) {
    const errorMessage = handleApiError(error);
    throw new Error(errorMessage || "Failed to reject friend request");
  }
};