// useFriendRequest.js
import { useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  sendRequest as sendFriendRequest,
  getRequests,
  acceptRequest as acceptFriendRequest,
  rejectRequest as rejectFriendRequest,
} from "../apis/friendRequest.api";
import { useSocket } from "./useSocket";

export const useFriendRequest = () => {
  const [requests, setRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [userId, setUserId] = useState(null);

  // Lấy userId từ AsyncStorage
  useEffect(() => {
    let isMounted = true;
    const fetchUserId = async () => {
      try {
        const id = await AsyncStorage.getItem("userId");
        if (isMounted) {
          if (id) {
            console.log("Fetched userId from AsyncStorage:", id);
            setUserId(id);
          } else {
            console.error("No userId found in AsyncStorage");
          }
        }
      } catch (err) {
        if (isMounted) {
          console.error("Failed to fetch userId:", err);
        }
      }
    };
    fetchUserId();
    return () => {
      isMounted = false;
    };
  }, []);

  // Socket chỉ chạy khi userId sẵn sàng
  useSocket(userId, {
    onFriendRequest: ({ message, from, requestId }) => {
      console.log("Adding new request:", { message, from, requestId });
      setRequests((prev) => {
        const exists = prev.some((req) => req._id === requestId);
        if (!exists) {
          return [...prev, { _id: requestId, from, status: "pending" }];
        }
        return prev;
      });
    },
    onFriendRequestAccepted: ({ user }) => {
      console.log("Friend request accepted by:", user);
      setSentRequests((prev) =>
        prev.filter((req) => req.to._id !== user._id)
      );
    },
  });

  const fetchRequests = useCallback(async () => {
    if (!userId) {
      console.log("No userId, skipping fetchRequests");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      console.log("Fetching requests for userId:", userId);
      const response = await getRequests();
      console.log("API getRequests response:", response);
      setRequests(response || []);
      console.log("Fetched requests:", response || []);
    } catch (err) {
      console.error("Failed to fetch requests:", err);
      setError(err.message || "Failed to fetch friend requests");
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const sendRequest = async (receiverId) => {
    try {
      console.log("Sending friend request to:", receiverId);
      const response = await sendFriendRequest(receiverId);
      console.log("API sendRequest response:", response);
      setSentRequests((prev) => [
        ...prev,
        { _id: response._id, to: { _id: receiverId }, status: "pending" },
      ]);
    } catch (err) {
      console.error("Failed to send friend request:", err);
      throw err;
    }
  };

  const acceptRequest = async (requestId) => {
    try {
      console.log("Accepting request:", requestId);
      const response = await acceptFriendRequest(requestId);
      console.log("API acceptRequest response:", response);
      setRequests((prev) => prev.filter((req) => req._id !== requestId));
    } catch (err) {
      console.error("Failed to accept request:", err);
      throw err;
    }
  };

  const rejectRequest = async (requestId) => {
    try {
      console.log("Rejecting request:", requestId);
      const response = await rejectFriendRequest(requestId);
      console.log("API rejectRequest response:", response);
      setRequests((prev) => prev.filter((req) => req._id !== requestId));
    } catch (err) {
      console.error("Failed to reject request:", err);
      throw err;
    }
  };

  useEffect(() => {
    if (userId) {
      fetchRequests();
    }
  }, [userId, fetchRequests]);

  return {
    requests,
    sentRequests,
    loading,
    error,
    sendRequest,
    acceptRequest,
    rejectRequest,
    fetchRequests,
  };
};