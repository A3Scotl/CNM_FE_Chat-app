import { useEffect, useRef } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import io from "socket.io-client";
import { Alert } from "react-native";

const SOCKET_URL = "https://be.haudev.io.vn";

export const useSocket = (userId, { onFriendRequest, onFriendRequestAccepted } = {}) => {
  const socketRef = useRef(null);

  useEffect(() => {
    if (!userId) {
      return;
    }

    const initializeSocket = async () => {
      if (socketRef.current) {
        return;
      }

      try {
        const token = await AsyncStorage.getItem("token");
        if (!token) {
          return;
        }

        socketRef.current = io(SOCKET_URL, {
          auth: { userId, token },
          reconnection: true,
          reconnectionAttempts: 20,
          reconnectionDelay: 1000,
          timeout: 40000,
        });

        socketRef.current.on("connect", () => {
          socketRef.current.emit("register", userId);
        });

        socketRef.current.on("connect_error", (err) => {
          console.error("Lỗi kết nối socket:", {
            message: err.message,
            description: err.description,
            context: err.context,
          });
          Alert.alert("Lỗi kết nối", "Không thể kết nối đến máy chủ.");
        });

        socketRef.current.on("friend-request", ({ message, from, requestId }) => {
          console.log("Nhận yêu cầu kết bạn:", { message, from, requestId });
          Alert.alert("Yêu cầu kết bạn mới", `${message} từ ${from.fullName}`);
          if (onFriendRequest) {
            onFriendRequest({ message, from, requestId });
          }
        });

        socketRef.current.on("friend-request-accepted", ({ message, user }) => {
          console.log("Yêu cầu kết bạn đã được chấp nhận:", { message, user });
          Alert.alert("Yêu cầu kết bạn đã được chấp nhận", message);
          if (onFriendRequestAccepted) {
            onFriendRequestAccepted({ message, user });
          }
        });

        socketRef.current.on("disconnect", (reason) => {
          Alert.alert("Ngắt kết nối", `Lý do: ${reason}`);
        });

        socketRef.current.onAny((event, ...args) => {
        });

      } catch (err) {
        console.error("Lỗi khi khởi tạo socket:", err);
      }
    };

    initializeSocket();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [userId, onFriendRequest, onFriendRequestAccepted]);

  return null;
};

