// apis/conversation.api.js
import axiosInstance from "../utils/axiosInstance";

export const getMyConversations = async () => {
  const res = await axiosInstance.get("/conversation/me");
  return res.data;
};
