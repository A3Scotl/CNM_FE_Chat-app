import { useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import friendRequest from "../apis/friendRequest.api";
import { useSocket } from "./useSocket";

export const useFriendRequest = () => {
  const [requests, setRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [userId, setUserId] = useState(null);

  // Lấy userId từ AsyncStorage
  useEffect(() => {
    let isMounted = true;
    const fetchUserId = async () => {
      try {
        const id = await AsyncStorage.getItem("userId");
        if (isMounted && id) {
          setUserId(id);
        }
      } catch (err) {
        if (isMounted) {
          setError("Failed to fetch user ID");
        }
      }
    };
    fetchUserId();
    return () => {
      isMounted = false;
    };
  }, []);

  // Khởi tạo socket listeners
  useSocket(userId, {
    onFriendRequest: ({ from, requestId }) => {
      setRequests((prev) => {
        if (!prev.some((req) => req._id === requestId)) {
          return [...prev, { _id: requestId, from, status: "pending" }];
        }
        return prev;
      });
    },
    onFriendRequestAccepted: ({ user }) => {
      setSentRequests((prev) => prev.filter((req) => req.to._id !== user._id));
      fetchFriends(); // Cập nhật danh sách bạn bè khi có chấp nhận
    },
  });

  // Hàm fetch chung để tái sử dụng
  const fetchData = async (fetchFn, setState) => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchFn();
      setState(data || []);
    } catch (err) {
      setError(err.message);
      setState([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch các loại dữ liệu
  const fetchRequests = useCallback(() => fetchData(friendRequest.getRequests, setRequests), [userId]);
  const fetchSentRequests = useCallback(() => fetchData(friendRequest.getSentFriendsRequest, setSentRequests), [userId]);
  const fetchFriends = useCallback(() => fetchData(friendRequest.getFriends, setFriends), [userId]);

  // Gửi lời mời kết bạn
  const sendRequest = async (receiverId) => {
    try {
      const response = await friendRequest.sendRequest(receiverId);
      setSentRequests((prev) => [
        ...prev,
        { _id: response._id, to: { _id: receiverId }, status: "pending" },
      ]);
    } catch (err) {
      throw new Error(err.message);
    }
  };

  // Chấp nhận lời mời
  const acceptRequest = async (requestId) => {
    try {
      await friendRequest.acceptRequest(requestId);
      setRequests((prev) => prev.filter((req) => req._id !== requestId));
      fetchFriends(); // Cập nhật danh sách bạn bè
    } catch (err) {
      throw new Error(err.message);
    }
  };

  // Từ chối lời mời
  const rejectRequest = async (requestId) => {
    try {
      await friendRequest.rejectRequest(requestId);
      setRequests((prev) => prev.filter((req) => req._id !== requestId));
    } catch (err) {
      throw new Error(err.message);
    }
  };

  // Tự động fetch khi có userId
  useEffect(() => {
    if (userId) {
      fetchRequests();
      fetchSentRequests();
      fetchFriends();
    }
  }, [userId, fetchRequests, fetchSentRequests, fetchFriends]);

  return {
    requests,
    sentRequests,
    friends,
    loading,
    error,
    sendRequest,
    acceptRequest,
    rejectRequest,
    fetchRequests,
    fetchSentRequests,
    fetchFriends,
  };
};