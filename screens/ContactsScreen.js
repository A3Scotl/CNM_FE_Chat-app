import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from "react-native";
import { useTheme, Avatar, Button } from "react-native-paper";
import { useFriendRequest } from "../hooks/useFriendRequest";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import dayjs from "dayjs";
import { getMyProfile, findUserById } from "../apis/user.api";
import relativeTime from "dayjs/plugin/relativeTime";
import debounce from "lodash.debounce";
import { getMyConversations } from "../apis/conversation.api";
import ChatList from "../components/Chat/ChatList";
import io from "socket.io-client";
import { Audio } from "expo-av";
import {API_URL,SOCKET_URL} from "@env";

dayjs.extend(relativeTime);

const ContactsScreen = () => {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const {
    requests,
    sentRequests,
    friends,
    loadingRequests,
    loadingSentRequests,
    loadingFriends,
    errorRequests,
    errorSentRequests,
    errorFriends,
    acceptRequest,
    rejectRequest,
    fetchRequests,
    fetchSentRequests,
    fetchFriends,
    deleteFriendShip,
  } = useFriendRequest();
  const [activeTab, setActiveTab] = useState("friends");
  const [refreshing, setRefreshing] = useState(false);
  const [groups, setGroups] = useState([]);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [errorGroups, setErrorGroups] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [loadingAction, setLoadingAction] = useState({});

  // Fetch current user ID
  useFocusEffect(
    useCallback(() => {
      const fetchUserId = async () => {
        const userId = await AsyncStorage.getItem("userId");
        setCurrentUserId(userId);
      };
      fetchUserId();
    }, [])
  );

  // Fetch groups
  const fetchGroups = useCallback(async () => {
    try {
      setLoadingGroups(true);
      setErrorGroups(null);
      const response = await getMyConversations();
      const data = response.data || [];
      if (!Array.isArray(data)) {
        throw new Error("Dữ liệu cuộc trò chuyện không hợp lệ");
      }
      const mappedGroups = data
        .filter((convo) => convo.type === "group")
        .map((convo) => ({
          _id: convo._id,
          user: { fullName: convo.name, avatar: convo.avatar || "https://i.pravatar.cc/150" },
          lastMessage: convo.lastMessage || null,
          type: "group",
          unreadCount: convo.unreadCount || 0,
        }))
        .sort((a, b) => {
          const aTime = a.lastMessage?.createdAt ? new Date(a.lastMessage.createdAt) : 0;
          const bTime = b.lastMessage?.createdAt ? new Date(b.lastMessage.createdAt) : 0;
          return bTime - aTime;
        });
      setGroups(mappedGroups);
    } catch (error) {
      // console.error("❌ Lỗi khi tải danh sách nhóm:", error);
      setErrorGroups("Không thể tải danh sách nhóm.");
    } finally {
      setLoadingGroups(false);
    }
  }, []);

  // Socket.IO setup
  useEffect(() => {
    let socketConnection;

    const setupSocket = async () => {
      const token = await AsyncStorage.getItem("token");
      const userId = await AsyncStorage.getItem("userId");
      if (!token || !userId) {
        console.warn("Token hoặc userId không tồn tại, không thể kết nối socket");
        return;
      }

      socketConnection = io(SOCKET_URL, {
        auth: { token },
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
      });

      socketConnection.on("connect", () => {
        console.log("✅ Socket kết nối thành công trong ContactsScreen");
        socketConnection.emit("register", userId);
      });

      socketConnection.on("friend-request", async ({ requestId, from }) => {
        // console.log("Nhận lời mời kết bạn:", { requestId, from });
        // Alert.alert("Lời mời kết bạn", `Bạn nhận được lời mời kết bạn mới.`);
        await fetchRequests();
      });

      socketConnection.on("friend-request-accepted", async ({ requestId, userId }) => {
        // console.log("Lời mời kết bạn được chấp nhận:", { requestId, userId });
        // Alert.alert("Thông báo", `Lời mời kết bạn của bạn đã được chấp nhận.`);
        await Promise.all([fetchFriends(), fetchSentRequests(true)]);
      });

      socketConnection.on("friend-removed", async ({ userId }) => {
        console.log("Người bạn bị hủy kết bạn:", { userId });
        await Promise.all([fetchFriends(), fetchRequests()]);
      });

      socketConnection.on("disconnect", (reason) => {
        // console.log("Ngắt kết nối Socket.IO trong ContactsScreen. Lý do:", reason);
      });

      socketConnection.on("connect_error", (error) => {
        // console.error("Lỗi kết nối Socket.IO trong ContactsScreen:", error);
      });
    };

    setupSocket();

    return () => {
      if (socketConnection) {
        socketConnection.disconnect();
      }
    };
  }, [fetchRequests, fetchSentRequests, fetchFriends]);

  // Refresh data
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    Promise.all([fetchRequests(), fetchSentRequests(), fetchFriends(), fetchGroups()])
      .finally(() => setRefreshing(false));
  }, [fetchRequests, fetchSentRequests, fetchFriends, fetchGroups]);

  // Refresh data on focus
  useFocusEffect(
    useCallback(
      debounce(() => {
        fetchRequests();
        fetchSentRequests();
        fetchFriends();
        fetchGroups();
      }, 300),
      [fetchRequests, fetchSentRequests, fetchFriends, fetchGroups]
    )
  );

  // Handle accept request
  const handleAccept = async (requestId) => {
    try {
      setLoadingAction((prev) => ({ ...prev, [requestId]: "accept" }));
      await acceptRequest(requestId);
      Alert.alert("Thành công", "Đã chấp nhận lời mời kết bạn!");
      await Promise.all([fetchFriends(), fetchRequests()]);
    } catch (error) {
      console.error("Lỗi khi chấp nhận lời mời:", error);
      Alert.alert("Lỗi", error.message || "Không thể chấp nhận lời mời.");
    } finally {
      setLoadingAction((prev) => ({ ...prev, [requestId]: undefined }));
    }
  };

  // Handle reject request
  const handleReject = async (requestId) => {
    try {
      setLoadingAction((prev) => ({ ...prev, [requestId]: "reject" }));
      await rejectRequest(requestId);
      Alert.alert("Thành công", "Đã từ chối lời mời kết bạn!");
      await fetchRequests();
    } catch (error) {
      console.error("Lỗi khi từ chối lời mời:", error);
      Alert.alert("Lỗi", error.message || "Không thể từ chối lời mời.");
    } finally {
      setLoadingAction((prev) => ({ ...prev, [requestId]: undefined }));
    }
  };

  // Handle remove friend or cancel sent request
  const handleRemoveFriend = async (requestId) => {
    try {
      setLoadingAction((prev) => ({ ...prev, [requestId]: "remove" }));
      await deleteFriendShip(requestId);
      Alert.alert("Thành công", "Hủy thành công!");
      await Promise.all([fetchFriends(), fetchRequests(), fetchSentRequests(true)]);
    } catch (error) {
      console.error("Lỗi khi hủy kết bạn:", error);
      Alert.alert("Lỗi", error.message || "Không thể hủy.");
    } finally {
      setLoadingAction((prev) => ({ ...prev, [requestId]: undefined }));
    }
  };

  // Handle navigation to ChatScreen
  const handleChatSelect = async (chat) => {
    try {
      navigation.navigate("Chat", {
        conversationId: chat._id,
        chat: chat,
        user: { _id: currentUserId },
      });
    } catch (error) {
      console.error("Lỗi khi mở chat:", error);
      Alert.alert("Lỗi", "Không thể mở hội thoại.");
    }
  };

  // Handle chat with friend
  const handleChat = async (friend) => {
    try {
      const token = await AsyncStorage.getItem("token");
      const response = await fetch(`${API_URL}/conversation/detail`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          to: friend._id,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Không thể tạo/mở hội thoại");
      }
      const user = await getMyProfile();
      navigation.navigate("Chat", {
        conversationId: data.data.conversationId,
        chat: data.data,
        user: user,
      });
    } catch (error) {
      console.error("Lỗi khi mở chat:", error);
      Alert.alert("Lỗi", "Không thể mở hội thoại.");
    }
  };

  // Fetch user info for request
  const fetchUserInfo = async (userId) => {
    try {
      const user = await findUserById(userId);
      return user || { fullName: "Người dùng ẩn danh", avatar: "https://i.pravatar.cc/150" };
    } catch (error) {
      console.error("Lỗi khi lấy thông tin người dùng:", error);
      return { fullName: "Người dùng ẩn danh", avatar: "https://i.pravatar.cc/150" };
    }
  };

  const RequestItem = React.memo(({ item, handleAccept, handleReject, colors }) => {
    const [userInfo, setUserInfo] = useState(
      item.user || { fullName: "Người dùng ẩn danh", avatar: "https://i.pravatar.cc/150" }
    );

    React.useEffect(() => {
      if (item.user && typeof item.user === "string") {
        fetchUserInfo(item.user).then(setUserInfo);
      } else if (item.from && !item.user?.fullName) {
        fetchUserInfo(item.from._id || item.from).then(setUserInfo);
      }
    }, [item.from]);

    return (
      <View style={styles.itemContainer}>
        <View style={styles.rowTop}>
          <Avatar.Image size={48} source={{ uri: userInfo.avatar }} />
          <View style={styles.infoContainer}>
            <Text style={[styles.name, { color: colors.text }]}>{userInfo.fullName}</Text>
            <Text style={[styles.subText, { color: colors.text }]}>{dayjs(item.createdAt).fromNow()}</Text>
          </View>
        </View>
        <View style={styles.rowBottom}>
          <Button
            mode="contained"
            onPress={() => handleAccept(item.requestId || item._id)}
            style={[styles.button, { backgroundColor: colors.primary }]}
            disabled={loadingAction[item.requestId || item._id] === "accept"}
            loading={loadingAction[item.requestId || item._id] === "accept"}
          >
            Chấp nhận
          </Button>
          <Button
            mode="outlined"
            onPress={() => handleReject(item.requestId || item._id)}
            style={styles.button}
            disabled={loadingAction[item.requestId || item._id] === "reject"}
            loading={loadingAction[item.requestId || item._id] === "reject"}
          >
            Từ chối
          </Button>
        </View>
      </View>
    );
  });

  const SentRequestItem = React.memo(({ item, colors }) => {
    const [userInfo, setUserInfo] = useState(
      item.to || { fullName: "Người dùng ẩn danh", avatar: "https://i.pravatar.cc/150" }
    );

    React.useEffect(() => {
      if (item.to && typeof item.to === "string") {
        fetchUserInfo(item.to).then(setUserInfo);
      } else if (item.to && !item.to.fullName) {
        fetchUserInfo(item.to._id).then(setUserInfo);
      }
    }, [item.to]);

    return (
      <View style={styles.itemContainer}>
        <View style={styles.rowTop}>
          <Avatar.Image size={48} source={{ uri: userInfo.avatar }} />
          <View style={styles.infoContainer}>
            <Text style={[styles.name, { color: colors.text }]}>{userInfo.fullName}</Text>
            <Text style={[styles.subText, { color: colors.text }]}>Đã gửi {dayjs(item.createdAt).fromNow()}</Text>
          </View>
          <Button
            mode="outlined"
            onPress={() => handleRemoveFriend(item._id)}
            style={styles.button}
            disabled={loadingAction[item._id] === "remove"}
            loading={loadingAction[item._id] === "remove"}
          >
            Hủy
          </Button>
        </View>
      </View>
    );
  });

  const FriendItem = React.memo(({ item, colors, onChatPress }) => (
    <View style={styles.itemContainer}>
      <View style={styles.rowTop}>
        <Avatar.Image size={48} source={{ uri: item.avatar || "https://i.pravatar.cc/150" }} />
        <View style={styles.infoContainer}>
          <Text style={[styles.name, { color: colors.text }]}>{item.fullName || "Người dùng ẩn danh"}</Text>
          <Text style={[styles.subText, { color: colors.text }]}>Bạn bè</Text>
        </View>
      </View>
      <View style={styles.rowBottom}>
        <Button
          mode="contained"
          onPress={() => onChatPress(item)}
          style={[styles.button, { backgroundColor: colors.primary }]}
        >
          Nhắn tin
        </Button>
        <Button
          mode="outlined"
          onPress={() => handleRemoveFriend(item.fs_id)}
          style={[{ backgroundColor: 'red',outlineColor:'red' }]}
          disabled={loadingAction[item.fs_id] === "remove"}
          loading={loadingAction[item.fs_id] === "remove"}
          textColor="white"
        >
          Hủy kết bạn
        </Button>
      </View>
    </View>
  ));

  const renderRequestItem = ({ item }) => (
    <RequestItem item={item} handleAccept={handleAccept} handleReject={handleReject} colors={colors} />
  );

  const renderSentRequestItem = ({ item }) => (
    <SentRequestItem item={item} colors={colors} />
  );

  const renderFriendItem = ({ item }) => (
    <FriendItem item={item} colors={colors} onChatPress={() => handleChat(item)} />
  );

  const friendSections = [
    {
      title: `Lời mời kết bạn (${requests?.length || 0})`,
      data: requests || [],
      renderItem: renderRequestItem,
      emptyMessage: errorRequests ? `Lỗi: ${errorRequests}` : "Không có lời mời kết bạn.",
      isLoading: loadingRequests,
      error: errorRequests,
    },
    {
      title: `Lời mời đã gửi (${sentRequests?.length || 0})`,
      data: sentRequests || [],
      renderItem: renderSentRequestItem,
      emptyMessage: errorSentRequests ? `Lỗi: ${errorSentRequests}` : "Bạn chưa gửi lời mời kết bạn nào.",
      isLoading: loadingSentRequests,
      error: errorSentRequests,
    },
    {
      title: `Bạn bè (${friends?.length || 0})`,
      data: friends || [],
      renderItem: renderFriendItem,
      emptyMessage: errorFriends ? `Lỗi: ${errorFriends}` : "Chưa có bạn bè.",
      isLoading: loadingFriends,
      error: errorFriends,
    },
  ];

  const renderSectionHeader = ({ section }) => (
    <View style={styles.sectionHeader}>
      <Text style={[styles.sectionTitle, { color: colors.primary }]}>{section.title}</Text>
    </View>
  );

  const renderSectionItem = ({ item, section }) => {
    if (section.isLoading) {
      return <Text style={[styles.emptyText, { color: colors.text }]}>Đang tải...</Text>;
    }
    if (section.error) {
      return <Text style={[styles.errorText, { color: colors.error }]}>Lỗi: {section.error}</Text>;
    }
    if (!section.data || section.data.length === 0) {
      return <Text style={[styles.emptyText, { color: colors.text }]}>{section.emptyMessage}</Text>;
    }
    return section.renderItem({ item });
  };

  return (
    <View style={styles.container}>
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "friends" && styles.activeTab]}
          onPress={() => setActiveTab("friends")}
        >
          <Text style={[styles.tabText, activeTab === "friends" && { color: colors.primary }]}>Bạn bè</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "groups" && styles.activeTab]}
          onPress={() => setActiveTab("groups")}
        >
          <Text style={[styles.tabText, activeTab === "groups" && { color: colors.primary }]}>Nhóm</Text>
        </TouchableOpacity>
      </View>

      {activeTab === "friends" && (
        <SectionList
          sections={friendSections}
          keyExtractor={(item, index) => `${item._id || item.fs_id || item.requestId}-${index}`}
          renderSectionHeader={renderSectionHeader}
          renderItem={renderSectionItem}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={<Text style={[styles.emptyText, { color: colors.text }]}>Không có dữ liệu.</Text>}
          extraData={sentRequests} // Buộc render lại khi sentRequests thay đổi
        />
      )}

      {activeTab === "groups" && (
        <View style={{ flex: 1 }}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.primary }]}>Danh sách nhóm ({groups?.length || 0})</Text>
          </View>
          {loadingGroups ? (
            <Text style={[styles.emptyText, { color: colors.text }]}>Đang tải...</Text>
          ) : errorGroups ? (
            <Text style={[styles.errorText, { color: colors.error }]}>Lỗi: {errorGroups}</Text>
          ) : groups && groups.length > 0 ? (
            <ChatList
              chats={groups}
              onChatSelect={handleChatSelect}
              currentUserId={currentUserId}
            />
          ) : (
            <Text style={[styles.emptyText, { color: colors.text }]}>Chưa tham gia nhóm nào.</Text>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  tabContainer: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: "center",
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: "#0098f9",
  },
  tabText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#666",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  itemContainer: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#e0e0e0",
  },
  rowTop: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  infoContainer: {
    marginLeft: 16,
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: "500",
  },
  subText: {
    fontSize: 14,
    opacity: 0.6,
  },
  rowBottom: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  button: {
    marginLeft: 8,
  },
  emptyText: {
    fontSize: 14,
    opacity: 0.6,
    textAlign: "center",
    marginVertical: 10,
  },
  errorText: {
    fontSize: 14,
    textAlign: "center",
    marginVertical: 10,
  },
});

export default ContactsScreen;