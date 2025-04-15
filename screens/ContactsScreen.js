import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import { useTheme, Avatar, Button } from "react-native-paper";
import { useFriendRequest } from "../hooks/useFriendRequest";
import { useFocusEffect } from "@react-navigation/native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
dayjs.extend(relativeTime);


const ContactsScreen = () => {
  const { colors } = useTheme();
  const {
    requests,
    loading,
    error,
    acceptRequest,
    rejectRequest,
    fetchRequests,
  } = useFriendRequest();
  const [activeTab, setActiveTab] = useState("friends");

  useFocusEffect(
    useCallback(() => {
      fetchRequests();
    }, [fetchRequests])
  );

  const handleAccept = async (requestId) => {
    try {
      await acceptRequest(requestId);
    } catch (error) {
      console.error("Failed to accept request:", error);
      Alert.alert("Lỗi", error.message || "Không thể chấp nhận lời mời");
    }
  };

  const handleReject = async (requestId) => {
    try {
      await rejectRequest(requestId);
    } catch (error) {
      console.error("Failed to reject request:", error);
      Alert.alert("Lỗi", error.message || "Không thể từ chối lời mời");
    }
  };

  const renderRequestItem = ({ item }) => (
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
  );
  const renderSentRequestItem = ({ item }) => (
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
  );


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
        <ScrollView>
          {/* Lời mời kết bạn */}
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.primary }]}>
              Lời mời kết bạn ({requests.length})
            </Text>
            <TouchableOpacity onPress={fetchRequests} disabled={loading}>
              <MaterialCommunityIcons
                name="refresh"
                size={24}
                color={colors.primary}
              />
            </TouchableOpacity>
          </View>

          {loading ? (
            <Text style={[styles.emptyText, { color: colors.text }]}>Đang tải...</Text>
          ) : error ? (
            <Text style={[styles.errorText, { color: colors.error }]}>Lỗi: {error}</Text>
          ) : requests.length > 0 ? (
            <FlatList
              data={requests}
              renderItem={renderRequestItem}
              keyExtractor={(item) => item._id}
              scrollEnabled={false}
            />
          ) : (
            <Text style={[styles.emptyText, { color: colors.text }]}>Không có lời mời kết bạn.</Text>
          )}

          {/* Lời mời đã gửi */}
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.primary }]}>
              Lời mời đã gửi ({requests.length})
            </Text>
          </View>

          {requests.length > 0 ? (
            <FlatList
              data={requests}
              renderItem={renderSentRequestItem}
              keyExtractor={(item) => item._id}
              scrollEnabled={false}
            />
          ) : (
            <Text style={[styles.emptyText, { color: colors.text }]}>
              Bạn chưa gửi lời mời kết bạn nào.
            </Text>
          )}
        </ScrollView>
      )}


      {activeTab === "groups" && (
        <ScrollView>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.primary }]}>
              Danh sách nhóm
            </Text>
          </View>
          <Text style={[styles.emptyText, { color: colors.text }]}>
            Chưa có dữ liệu nhóm.
          </Text>
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
