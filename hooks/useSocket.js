import { useEffect, useRef } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import io from "socket.io-client";
import { Alert } from "react-native";

const SOCKET_URL = "https://be.haudev.io.vn";

export const useSocket = (
  userId,
  { onFriendRequest, onFriendRequestAccepted } = {}
) => {
  const socketRef = useRef(null);

  useEffect(() => {
    if (!userId) {
      console.log("No userId provided, skipping socket initialization");
      return;
    }

    const initializeSocket = async () => {
      if (socketRef.current) {
        console.log("Socket already initialized, skipping");
        return;
      }

      try {
        const token = await AsyncStorage.getItem("token");
        if (!token) {
          console.error("No token found in AsyncStorage");
          return;
        }

        console.log("Initializing socket for userId:", userId);
        console.log("Token used:", token.substring(0, 10) + "...");
        socketRef.current = io(SOCKET_URL, {
          auth: { userId, token },
          reconnection: true,
          reconnectionAttempts: 20,
          reconnectionDelay: 1000,
          timeout: 40000,
        });

        socketRef.current.on("connect", () => {
          console.log("iOS Connected to socket server, userId:", userId);
          console.log("Transport:", socketRef.current.io.engine.transport.name);
          socketRef.current.emit("register", userId);
          console.log("Registered userId:", userId);
        });

        socketRef.current.on(
          "friend-request",
          ({ message, from, requestId }) => {
            console.log("iOS Received friend request:", {
              message,
              from,
              requestId,
            });
            Alert.alert(
              "New Friend Request",
              `${message} from ${from.fullName}`
            );
            if (onFriendRequest) {
              onFriendRequest({ message, from, requestId });
            }
          }
        );

        socketRef.current.on("friend-request-accepted", ({ message, user }) => {
          console.log("iOS Friend request accepted:", { message, user });
          Alert.alert("Friend Request Accepted", message);
          if (onFriendRequestAccepted) {
            onFriendRequestAccepted({ message, user });
          }
        });

        socketRef.current.on("connect_error", (err) => {
          console.error("iOS Socket connection error:", {
            message: err.message,
            description: err.description,
            context: err.context,
          });
        });

        socketRef.current.on("disconnect", (reason) => {
          console.log("iOS Disconnected, reason:", reason);
        });

        socketRef.current.onAny((event, ...args) => {
          console.log(`iOS Received event: ${event}`, args);
        });
      } catch (err) {
        console.error("Failed to initialize socket:", err);
      }
    };

    initializeSocket();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        console.log("Socket disconnected on cleanup");
        socketRef.current = null;
      }
    };
  }, [userId, onFriendRequest, onFriendRequestAccepted]);

  return null;
};
