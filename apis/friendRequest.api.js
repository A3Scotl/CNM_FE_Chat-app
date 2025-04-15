// friendRequest.api.js
import axiosInstance from "../utils/axiosInstance";
import { handleApiError } from "../utils/handleApiError";

export const sendRequest = async (receiverId) => {
  try {
    console.log("API sendRequest called with receiverId:", receiverId);
    const response = await axiosInstance.post("/friend-request/send", { to: receiverId });
    return response.data.data || response.data;
  } catch (error) {
    console.error("sendRequest error:", error);
    const errorMessage = handleApiError(error);
    throw new Error(errorMessage || "Failed to send friend request");
  }
};

export const getRequests = async () => {
  try {
    console.log("API getRequests called");
    const response = await axiosInstance.get("/friend-request/pending");
    console.log("API getRequests response:", response.data);
    return response.data.data || response.data;
  } catch (error) {
    console.error("getRequests error:", error);
    const errorMessage = handleApiError(error);
    throw new Error(errorMessage || "Failed to fetch requests");
  }
};

export const acceptRequest = async (requestId) => {
  try {
    console.log("API acceptRequest called with requestId:", requestId);
    const response = await axiosInstance.put(`/friend-request/accept/${requestId}`);
    console.log("API acceptRequest response:", response.data);
    return response.data.data || response.data;
  } catch (error) {
    console.error("acceptRequest error:", error);
    const errorMessage = handleApiError(error);
    throw new Error(errorMessage || "Failed to accept request");
  }
};

export const rejectRequest = async (requestId) => {
  try {
    console.log("API rejectRequest called with requestId:", requestId);
    const response = await axiosInstance.put(`/friend-request/reject/${requestId}`);
    console.log("API rejectRequest response:", response.data);
    return response.data.data || response.data;
  } catch (error) {
    console.error("rejectRequest error:", error);
    const errorMessage = handleApiError(error);
    throw new Error(errorMessage || "Failed to reject request");
  }
};