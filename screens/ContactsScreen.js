import React, { useState, useCallback } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView, RefreshControl } from "react-native";
import { useTheme, Avatar, Button } from "react-native-paper";
import { useFriendRequest } from "../hooks/useFriendRequest";
import { useFocusEffect } from "@react-navigation/native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";

import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import debounce from "lodash.debounce";

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

  // Refresh dữ liệu khi làm mới
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    Promise.all([fetchRequests(), fetchSentRequests(), fetchFriends()])
      .finally(() => setRefreshing(false));
  }, [fetchRequests, fetchSentRequests, fetchFriends]);

  // Refresh dữ liệu khi màn hình được focus
  useFocusEffect(
    useCallback(
      debounce(() => {
        fetchRequests();
        fetchSentRequests();
        fetchFriends();
      }, 300),
      [fetchRequests, fetchSentRequests, fetchFriends]
    )
  );

  // Xử lý chấp nhận lời mời
  const handleAccept = async (requestId) => {
    try {
      await acceptRequest(requestId);
    } catch (error) {
      ToastAndroid.show(error.message || "Không thể chấp nhận lời mời", ToastAndroid.SHORT);
    }
  };

  // Xử lý từ chối lời mời
  const handleReject = async (requestId) => {
    try {
      await rejectRequest(requestId);
    } catch (error) {
      ToastAndroid.show(error.message || "Không thể từ chối lời mời", ToastAndroid.SHORT);
    }
  };
  const handleChat = async (friend) => {
    // try {
    //   const token = await AsyncStorage.getItem("token");
    //   const currentUserId = await AsyncStorage.getItem("userId");
  
    //   // Gọi đúng API getOrCreateConversationDetail của backend
    //   const response = await fetch("https://be.haudev.io.vn/api/conversation/detail", {
    //     method: "POST",
    //     headers: {
    //       "Content-Type": "application/json",
    //       Authorization: `Bearer ${token}`,
    //     },
    //     body: JSON.stringify({
    //       to: friend._id // Đúng với tham số backend yêu cầu
    //     }),
    //   });
  
    //   const data = await response.json();
      
    //   if (!response.ok) {
    //     throw new Error(data.message || "Không thể tạo/mở hội thoại");
    //   }
  
    //   // Backend trả về data có cấu trúc { messages, ...conversation }
    //   navigation.navigate("Chat", {
    //     chat: data,
    //     user: friend
    //   });
  
    // } catch (error) {
    //   console.error("Lỗi khi mở chat:", error);
      
    //   // Fallback: tạo conversation tạm trên client
    //   const tempConversation = {
    //     _id: `temp_${currentUserId}_${friend._id}`,
    //     participants: [
    //       { _id: currentUserId, fullName: "Bạn" },
    //       { _id: friend._id, fullName: friend.fullName }
    //     ],
    //     type: "private",
    //     messages: [], // Thêm mảng messages trống
    //     isTemp: true
    //   };
      
    //   navigation.navigate("Chat", {
    //     chat: tempConversation,
    //     user: friend
    //   });
      
    //   Alert.alert("Thông báo", "Đang sử dụng hội thoại tạm");
    // }
  };
  const RequestItem = React.memo(({ item, handleAccept, handleReject, colors }) => (
    <View style={styles.itemContainer}>
      <View style={styles.rowTop}>
        <Avatar.Image size={48} source={{ uri: item.from?.avatar || "https://i.pravatar.cc/150" }} />
        <View style={styles.infoContainer}>
          <Text style={[styles.name, { color: colors.text }]}>{item.from?.fullName || "Người dùng ẩn danh"}</Text>
          <Text style={[styles.subText, { color: colors.text }]}>{dayjs(item.createdAt).fromNow()}</Text>
        </View>
      </View>
      <View style={styles.rowBottom}>
        <Button mode="contained" onPress={() => handleAccept(item._id)} style={[styles.button, { backgroundColor: colors.primary }]}>
          Chấp nhận
        </Button>
        <Button mode="outlined" onPress={() => handleReject(item._id)} style={styles.button}>
          Từ chối
        </Button>
      </View>
    </View>
  ));

  const SentRequestItem = React.memo(({ item, colors }) => (
    <View style={styles.itemContainer}>
      <View style={styles.rowTop}>
        <Avatar.Image size={48} source={{ uri: item.to?.avatar || "https://i.pravatar.cc/150" }} />
        <View style={styles.infoContainer}>
          <Text style={[styles.name, { color: colors.text }]}>{item.to?.fullName || "Người dùng ẩn danh"}</Text>
          <Text style={[styles.subText, { color: colors.text }]}>Đã gửi {dayjs(item.createdAt).fromNow()}</Text>
        </View>
      </View>
    </View>
  ));

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
        <Button mode="contained" onPress={() => onChatPress(item)} style={[styles.button, { backgroundColor: colors.primary }]}>
          Nhắn tin
        </Button>
        <Button mode="outlined" style={styles.button} disabled>
          Hủy kết bạn
        </Button>
      </View>
    </View>
  ));


  // Render các item
  const renderRequestItem = ({ item }) => (
    <RequestItem item={item} handleAccept={handleAccept} handleReject={handleReject} colors={colors} />
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


  // Render section
  const renderSection = (title, data, renderItem, emptyMessage, isLoading, error) => (
    <>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.primary }]}>{title}</Text>

      </View>
      {isLoading ? (
        <Text style={[styles.emptyText, { color: colors.text }]}>Đang tải...</Text>
      ) : error ? (
        <Text style={[styles.errorText, { color: colors.error }]}>Lỗi: {error}</Text>
      ) : data.length > 0 ? (
        <FlatList
          data={data}
          renderItem={renderItem}
          keyExtractor={(item) => item._id}
          scrollEnabled={false}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={21}
        />
      ) : (
        <Text style={[styles.emptyText, { color: colors.text }]}>{emptyMessage}</Text>
      )}
    </>
  );

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
        <ScrollView style={{ flex: 1 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
          {renderSection(`Lời mời kết bạn (${requests.length})`, requests, renderRequestItem, "Không có lời mời kết bạn.", loadingRequests, errorRequests)}
          {renderSection(`Lời mời đã gửi (${sentRequests.length})`, sentRequests, renderSentRequestItem, "Bạn chưa gửi lời mời kết bạn nào.", loadingSentRequests, errorSentRequests)}
          {renderSection(`Bạn bè (${friends.length})`, friends, renderFriendItem, "Chưa có bạn bè.", loadingFriends, errorFriends)}
        </ScrollView>
      )}

      {activeTab === "groups" && (
        <ScrollView style={{ flex: 1 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.primary }]}>Danh sách nhóm</Text>
          </View>
          <Text style={[styles.emptyText, { color: colors.text }]}>Chưa có dữ liệu nhóm.</Text>
        </ScrollView>
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
    flex: 1
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