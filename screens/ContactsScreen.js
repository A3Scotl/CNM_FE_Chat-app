import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { useTheme, Avatar, Button } from "react-native-paper";
import { useFriendRequest } from "../hooks/useFriendRequest";
import { useFocusEffect } from "@react-navigation/native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import dayjs from "dayjs";
import { getMyProfile } from "../apis/user.api";
import relativeTime from "dayjs/plugin/relativeTime";
import debounce from "lodash.debounce";
import { getMyConversations } from "../apis/conversation.api";
import ChatList from "../components/Chat/ChatList";
import { get, set } from "lodash";
import axios from "axios";

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
  } = useFriendRequest();
  const [activeTab, setActiveTab] = useState("friends");
  const [refreshing, setRefreshing] = useState(false);
  const [groups, setGroups] = useState([]);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [errorGroups, setErrorGroups] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  // const [user,setUser] = useState(null);

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
          user: {
            fullName: convo.name,
            avatar: convo.avatar || "https://i.pravatar.cc/150",
          },
          lastMessage: convo.lastMessage || null,
          type: "group",
          unreadCount: convo.unreadCount || 0,
        }))
        .sort((a, b) => {
          const aTime = a.lastMessage?.createdAt
            ? new Date(a.lastMessage.createdAt)
            : 0;
          const bTime = b.lastMessage?.createdAt
            ? new Date(b.lastMessage.createdAt)
            : 0;
          return bTime - aTime;
        });
      setGroups(mappedGroups);
    } catch (error) {
      console.error("❌ Lỗi khi tải danh sách nhóm:", error);
      setErrorGroups("Không thể tải danh sách nhóm.");
    } finally {
      setLoadingGroups(false);
    }
  }, []);

  // Refresh data
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    Promise.all([
      fetchRequests(),
      fetchSentRequests(),
      fetchFriends(),
      fetchGroups(),
    ]).finally(() => setRefreshing(false));
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
      await acceptRequest(requestId);
    } catch (error) {
      ToastAndroid.show(
        error.message || "Không thể chấp nhận lời mời",
        ToastAndroid.SHORT
      );
    }
  };

  // Handle reject request
  const handleReject = async (requestId) => {
    try {
      await rejectRequest(requestId);
    } catch (error) {
      ToastAndroid.show(
        error.message || "Không thể từ chối lời mời",
        ToastAndroid.SHORT
      );
    }
  };

  // Handle navigation to ChatScreen
  const handleChatSelect = async (chat) => {
    try {
      // navigation.navigate("Chat", {
      //   conversationId: chat._id,
      //   chat: chat,
      //   user: { _id: currentUserId },
      // });
    } catch (error) {
      console.error("Lỗi khi mở chat:", error);
      Alert.alert("Lỗi", "Không thể mở hội thoại.");
    }
  };
  // Handle chat with friend
  const handleChat = async (friend) => {
    try {
      const token = await AsyncStorage.getItem("token");
      const response = await fetch(
        "https://be.haudev.io.vn/api/conversation/detail",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            to: friend._id,
          }),
        }
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Không thể tạo/mở hội thoại");
      }
      // console.log("chat:",data.data);
      // console.log(await getMyProfile());
      const user = await getMyProfile();
      // console.log(user);
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

  const RequestItem = React.memo(
    ({ item, handleAccept, handleReject, colors }) => (
      <View style={styles.itemContainer}>
        <View style={styles.rowTop}>
          <Avatar.Image
            size={48}
            source={{ uri: item.from?.avatar || "https://i.pravatar.cc/150" }}
          />
          <View style={styles.infoContainer}>
            <Text style={[styles.name, { color: colors.text }]}>
              {item.from?.fullName || "Người dùng ẩn danh"}
            </Text>
            <Text style={[styles.subText, { color: colors.text }]}>
              {dayjs(item.createdAt).fromNow()}
            </Text>
          </View>
        </View>
        <View style={styles.rowBottom}>
          <Button
            mode="contained"
            onPress={() => handleAccept(item._id)}
            style={[styles.button, { backgroundColor: colors.primary }]}
          >
            Chấp nhận
          </Button>
          <Button
            mode="outlined"
            onPress={() => handleReject(item._id)}
            style={styles.button}
          >
            Từ chối
          </Button>
        </View>
      </View>
    )
  );

  const SentRequestItem = React.memo(({ item, colors }) => (
    <View style={styles.itemContainer}>
      <View style={styles.rowTop}>
        <Avatar.Image
          size={48}
          source={{ uri: item.to?.avatar || "https://i.pravatar.cc/150" }}
        />
        <View style={styles.infoContainer}>
          <Text style={[styles.name, { color: colors.text }]}>
            {item.to?.fullName || "Người dùng ẩn danh"}
          </Text>
          <Text style={[styles.subText, { color: colors.text }]}>
            Đã gửi {dayjs(item.createdAt).fromNow()}
          </Text>
        </View>
      </View>
    </View>
  ));

  const FriendItem = React.memo(({ item, colors, onChatPress }) => (
    <View style={styles.itemContainer}>
      <View style={styles.rowTop}>
        <Avatar.Image
          size={48}
          source={{ uri: item.avatar || "https://i.pravatar.cc/150" }}
        />
        <View style={styles.infoContainer}>
          <Text style={[styles.name, { color: colors.text }]}>
            {item.fullName || "Người dùng ẩn danh"}
          </Text>
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
        <Button mode="outlined" style={styles.button} disabled>
          Hủy kết bạn
        </Button>
      </View>
    </View>
  ));

  // Render items
  const renderRequestItem = ({ item }) => (
    <RequestItem
      item={item}
      handleAccept={handleAccept}
      handleReject={handleReject}
      colors={colors}
    />
  );

  const renderSentRequestItem = ({ item }) => (
    <SentRequestItem item={item} colors={colors} />
  );

  const renderFriendItem = ({ item }) => (
    <FriendItem
      item={item}
      colors={colors}
      onChatPress={() => handleChat(item)}
    />
  );

  // Combine sections for friends tab
  const friendSections = [
    {
      title: `Lời mời kết bạn (${(requests && requests.length) || 0})`,
      data: requests || [],
      renderItem: renderRequestItem,
      emptyMessage: "Không có lời mời kết bạn.",
      isLoading: loadingRequests,
      error: errorRequests,
    },
    {
      title: `Lời mời đã gửi (${(sentRequests && sentRequests.length) || 0})`,
      data: sentRequests || [],
      renderItem: renderSentRequestItem,
      emptyMessage: "Bạn chưa gửi lời mời kết bạn nào.",
      isLoading: loadingSentRequests,
      error: errorSentRequests,
    },
    {
      title: `Bạn bè (${(friends && friends.length) || 0})`,
      data: friends || [],
      renderItem: renderFriendItem,
      emptyMessage: "Chưa có bạn bè.",
      isLoading: loadingFriends,
      error: errorFriends,
    },
  ];

  // Render section header
  const renderSectionHeader = ({ section }) => (
    <View style={styles.sectionHeader}>
      <Text style={[styles.sectionTitle, { color: colors.primary }]}>
        {section.title}
      </Text>
    </View>
  );

  // Render section item
  const renderSectionItem = ({ item, section }) => {
    if (section.isLoading) {
      return (
        <Text style={[styles.emptyText, { color: colors.text }]}>
          Đang tải...
        </Text>
      );
    }
    if (section.error) {
      return (
        <Text style={[styles.errorText, { color: colors.error }]}>
          Lỗi: {section.error}
        </Text>
      );
    }
    if (!section.data || section.data.length === 0) {
      return (
        <Text style={[styles.emptyText, { color: colors.text }]}>
          {section.emptyMessage}
        </Text>
      );
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
          <Text
            style={[
              styles.tabText,
              activeTab === "friends" && { color: colors.primary },
            ]}
          >
            Bạn bè
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "groups" && styles.activeTab]}
          onPress={() => setActiveTab("groups")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "groups" && { color: colors.primary },
            ]}
          >
            Nhóm
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === "friends" && (
        <SectionList
          sections={friendSections}
          keyExtractor={(item, index) => item._id + index}
          renderSectionHeader={renderSectionHeader}
          renderItem={renderSectionItem}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <Text style={[styles.emptyText, { color: colors.text }]}>
              Không có dữ liệu.
            </Text>
          }
        />
      )}

      {activeTab === "groups" && (
        <View style={{ flex: 1 }}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.primary }]}>
              Danh sách nhóm ({(groups && groups.length) || 0})
            </Text>
          </View>
          {loadingGroups ? (
            <Text style={[styles.emptyText, { color: colors.text }]}>
              Đang tải...
            </Text>
          ) : errorGroups ? (
            <Text style={[styles.errorText, { color: colors.error }]}>
              Lỗi: {errorGroups}
            </Text>
          ) : groups && groups.length > 0 ? (
            <ChatList
              chats={groups}
              onChatSelect={handleChatSelect}
              currentUserId={currentUserId}
            />
          ) : (
            <Text style={[styles.emptyText, { color: colors.text }]}>
              Chưa tham gia nhóm nào.
            </Text>
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
