import { useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import friendRequest from "../apis/friendRequest.api";
import { useSocket } from "./useSocket";

export const useFriendRequest = () => {
  const [requests, setRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [friends, setFriends] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [loadingSentRequests, setLoadingSentRequests] = useState(false);
  const [loadingFriends, setLoadingFriends] = useState(false);
  const [errorRequests, setErrorRequests] = useState(null);
  const [errorSentRequests, setErrorSentRequests] = useState(null);
  const [errorFriends, setErrorFriends] = useState(null);
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
          console.error("Failed to fetch user ID:", err);
        }
      }
    };
    fetchUserId();
    return () => {
      isMounted = false;
    };
  }, []);

  // Hàm cache dữ liệu
  const cacheData = async (key, data) => {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(data));
    } catch (err) {
      console.error(`Failed to cache ${key}:`, err);
    }
  };

  const getCachedData = async (key) => {
    try {
      const data = await AsyncStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (err) {
      console.error(`Failed to get cached ${key}:`, err);
      return null;
    }
  };

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
      fetchFriends(true);
      fetchSentRequests(true);
    },
  });

  // Hàm fetch chung
  const fetchData = async (
    fetchFn,
    setState,
    cacheKey,
    setLoading,
    setError,
    skipCache = false
  ) => {
    if (!userId) return;
    setLoading(true);
    setError(null);

    if (!skipCache) {
      const cachedData = await getCachedData(cacheKey);
      if (cachedData) {
        setState(cachedData);
        setLoading(false);
        // Cập nhật nền
        try {
          const data = await fetchFn();
          const uniqueData = Array.from(
            new Map(data.map((item) => [item._id, item])).values()
          );
          setState(uniqueData || []);
          await cacheData(cacheKey, uniqueData || []);
        } catch (err) {
          console.error(`Failed to update ${cacheKey}:`, err);
        }
        return;
      }
    }

    try {
      const data = await fetchFn();
      const uniqueData = Array.from(
        new Map(data.map((item) => [item._id, item])).values()
      );
      setState(uniqueData || []);
      await cacheData(cacheKey, uniqueData || []);
    } catch (err) {
      setError(err.message);
      setState([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch các loại dữ liệu
  const fetchRequests = useCallback(
    (skipCache = false) =>
      fetchData(
        friendRequest.getRequests,
        setRequests,
        "friendRequests",
        setLoadingRequests,
        setErrorRequests,
        skipCache
      ),
    [userId]
  );

  const fetchSentRequests = useCallback(
    (skipCache = false) =>
      fetchData(
        async () => {
          const data = await friendRequest.getSentFriendsRequest();
          console.log("Fetched sentRequests:", data);
          return data;
        },
        setSentRequests,
        "sentRequests",
        setLoadingSentRequests,
        setErrorSentRequests,
        skipCache
      ),
    [userId]
  );

  const fetchFriends = useCallback(
    (skipCache = false) =>
      fetchData(
        friendRequest.getFriends,
        setFriends,
        "friends",
        setLoadingFriends,
        setErrorFriends,
        skipCache
      ),
    [userId]
  );

  // Gửi lời mời kết bạn
  const sendRequest = async (receiverId) => {
    try {
      const response = await friendRequest.sendRequest(receiverId);
      console.log("Send request response:", response);
      setSentRequests((prev) => {
        const newRequest = {
          _id: response._id,
          to: { _id: receiverId },
          status: "pending",
          createdAt: new Date().toISOString(), // Thêm createdAt để hiển thị thời gian
        };
        const updatedRequests = [...prev, newRequest];
        const uniqueRequests = Array.from(
          new Map(updatedRequests.map((item) => [item._id, item])).values()
        );
        cacheData("sentRequests", uniqueRequests);
        console.log("Updated sentRequests:", uniqueRequests);
        return uniqueRequests;
      });
      // Làm mới sentRequests từ server, bỏ qua cache
      await fetchSentRequests(true);
    } catch (err) {
      console.error("Error sending friend request:", err);
      throw new Error(err.message);
    }
  };

  // Chấp nhận lời mời
  const acceptRequest = async (requestId) => {
    try {
      await friendRequest.acceptRequest(requestId);
      setRequests((prev) => {
        const updatedRequests = prev.filter((req) => req._id !== requestId);
        cacheData("friendRequests", updatedRequests);
        return updatedRequests;
      });
      await fetchFriends(true);
    } catch (err) {
      throw new Error(err.message);
    }
  };

  // Từ chối lời mời
  const rejectRequest = async (requestId) => {
    try {
      await friendRequest.rejectRequest(requestId);
      setRequests((prev) => {
        const updatedRequests = prev.filter((req) => req._id !== requestId);
        cacheData("friendRequests", updatedRequests);
        return updatedRequests;
      });
    } catch (err) {
      throw new Error(err.message);
    }
  };

  // Hủy lời mời kết bạn hoặc hủy kết bạn
  const deleteFriendShip = async (requestId) => {
    try {
      await friendRequest.deleteFriendShip(requestId);
      setSentRequests((prev) => {
        const updatedRequests = prev.filter((req) => req._id !== requestId);
        cacheData("sentRequests", updatedRequests);
        return updatedRequests;
      });
      setRequests((prev) => {
        const updatedRequests = prev.filter((req) => req._id !== requestId);
        cacheData("friendRequests", updatedRequests);
        return updatedRequests;
      });
      await fetchFriends(true);
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
    loadingRequests,
    loadingSentRequests,
    loadingFriends,
    errorRequests,
    errorSentRequests,
    errorFriends,
    sendRequest,
    acceptRequest,
    rejectRequest,
    fetchRequests,
    fetchSentRequests,
    fetchFriends,
    deleteFriendShip,
  };
};
