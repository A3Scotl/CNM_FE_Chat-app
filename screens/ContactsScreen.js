import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { useTheme, Avatar, Button } from "react-native-paper";
import { useFriendRequest } from "../hooks/useFriendRequest";
import { useFocusEffect } from "@react-navigation/native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

// Mock data for suggested friends, groups, and community invites
const mockSuggestedFriends = [
  { _id: "s1", fullName: "John Doe", avatar: "https://i.pravatar.cc/150?img=1" },
  { _id: "s2", fullName: "Jane Smith", avatar: "https://i.pravatar.cc/150?img=2" },
];

const mockGroups = [
  { _id: "g1", name: "Work Team", members: 10, avatar: "https://i.pravatar.cc/150?img=3" },
  { _id: "g2", name: "Family Chat", members: 5, avatar: "https://i.pravatar.cc/150?img=4" },
];

const mockGroupInvites = [
  { _id: "gi1", name: "Gaming Community", inviter: "Alex", avatar: "https://i.pravatar.cc/150?img=5" },
  { _id: "gi2", name: "Book Club", inviter: "Emma", avatar: "https://i.pravatar.cc/150?img=6" },
];

const ContactsScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const {
    pendingRequests,
    loading: pendingLoading,
    error: pendingError,
    acceptRequest,
    rejectRequest,
    fetchPendingRequests,
    acceptedRequests,
    loadingAccepted,
    errorAccepted,
    fetchAcceptedRequests,
  } = useFriendRequest();
  const [activeTab, setActiveTab] = useState("friends");

  const handleAccept = async (requestId) => {
    try {
      await acceptRequest(requestId);
      fetchPendingRequests();
      fetchAcceptedRequests();
    } catch (error) {
      console.error("Failed to accept request:", error);
    }
  };

  const handleReject = async (requestId) => {
    try {
      await rejectRequest(requestId);
      fetchPendingRequests();
    } catch (error) {
      console.error("Failed to reject request:", error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchPendingRequests();
      fetchAcceptedRequests();
    }, [fetchPendingRequests, fetchAcceptedRequests])
  );

  const renderRequestItem = ({ item }) => (
    <View style={styles.itemContainer}>
      <View style={styles.rowTop}>
        <Avatar.Image
          size={48}
          source={{ uri: item.from?.avatar || "https://i.pravatar.cc/150" }}
        />
        <View style={styles.infoContainer}>
          <Text style={[styles.name, { color: colors.text }]}>
            {item.from?.fullName || "Unknown User"}
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

  const renderFriendItem = ({ item }) => (
    <TouchableOpacity
      style={styles.friendItemContainer}
      onPress={() => navigation.navigate("Profile", { userId: item._id })}
    >
      <Avatar.Image
        size={48}
        source={{ uri: item.avatar || "https://i.pravatar.cc/150" }}
      />
      <Text style={[styles.friendName, { color: colors.text }]}>
        {item.fullName || "Unknown User"}
      </Text>
    </TouchableOpacity>
  );

  const renderSuggestedFriendItem = ({ item }) => (
    <View style={styles.itemContainer}>
      <View style={styles.rowTop}>
        <Avatar.Image
          size={48}
          source={{ uri: item.avatar }}
        />
        <View style={styles.infoContainer}>
          <Text style={[styles.name, { color: colors.text }]}>
            {item.fullName}
          </Text>
        </View>
      </View>
      <View style={styles.rowBottom}>
        <Button
          mode="contained"
          onPress={() => console.log(`Add friend: ${item._id}`)}
          style={[styles.button, { backgroundColor: colors.primary }]}
        >
          Thêm bạn
        </Button>
      </View>
    </View>
  );

  const renderGroupItem = ({ item }) => (
    <View style={styles.friendItemContainer}>
      <Avatar.Image
        size={48}
        source={{ uri: item.avatar }}
      />
      <View style={styles.infoContainer}>
        <Text style={[styles.friendName, { color: colors.text }]}>
          {item.name}
        </Text>
        <Text style={[styles.subText, { color: colors.text }]}>
          {item.members} thành viên
        </Text>
      </View>
    </View>
  );

  const renderGroupInviteItem = ({ item }) => (
    <View style={styles.itemContainer}>
      <View style={styles.rowTop}>
        <Avatar.Image
          size={48}
          source={{ uri: item.avatar }}
        />
        <View style={styles.infoContainer}>
          <Text style={[styles.name, { color: colors.text }]}>
            {item.name}
          </Text>
          <Text style={[styles.subText, { color: colors.text }]}>
            Mời bởi: {item.inviter}
          </Text>
        </View>
      </View>
      <View style={styles.rowBottom}>
        <Button
          mode="contained"
          onPress={() => console.log(`Accept group invite: ${item._id}`)}
          style={[styles.button, { backgroundColor: colors.primary }]}
        >
          Chấp nhận
        </Button>
        <Button
          mode="outlined"
          onPress={() => console.log(`Reject group invite: ${item._id}`)}
          style={styles.button}
        >
          Từ chối
        </Button>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Custom Tabs */}
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

      {/* Friends Tab */}
      {activeTab === "friends" && (
        <ScrollView>
          {/* Friend Requests Section */}
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.primary }]}>
              Lời mời kết bạn ({pendingRequests.length})
            </Text>
            <TouchableOpacity
              onPress={fetchPendingRequests}
              disabled={pendingLoading}
            >
              <MaterialCommunityIcons
                name="refresh"
                size={24}
                color={colors.primary}
              />
            </TouchableOpacity>
          </View>
          {pendingLoading ? (
            <Text style={[styles.emptyText, { color: colors.text }]}>
              Đang tải...
            </Text>
          ) : pendingError ? (
            <Text style={[styles.errorText, { color: colors.error }]}>
              Lỗi khi tải lời mời: {pendingError.message}
            </Text>
          ) : pendingRequests.length > 0 ? (
            <FlatList
              data={pendingRequests}
              renderItem={renderRequestItem}
              keyExtractor={(item) => item._id}
              scrollEnabled={false}
            />
          ) : (
            <Text style={[styles.emptyText, { color: colors.text }]}>
              Không có lời mời kết bạn.
            </Text>
          )}

          {/* Friends Section */}
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.primary }]}>
              Danh sách bạn bè ({acceptedRequests.length})
            </Text>
          </View>
          {loadingAccepted ? (
            <Text style={[styles.emptyText, { color: colors.text }]}>
              Đang tải danh sách bạn...
            </Text>
          ) : errorAccepted ? (
            <Text style={[styles.errorText, { color: colors.error }]}>
              Lỗi khi tải danh sách bạn: {errorAccepted.message}
            </Text>
          ) : acceptedRequests.length > 0 ? (
            <FlatList
              data={acceptedRequests}
              renderItem={renderFriendItem}
              keyExtractor={(item) => item._id}
              scrollEnabled={false}
            />
          ) : (
            <Text style={[styles.emptyText, { color: colors.text }]}>
              Chưa có bạn bè.
            </Text>
          )}

          {/* Suggested Friends Section */}
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.primary }]}>
              Gợi ý kết bạn ({mockSuggestedFriends.length})
            </Text>
          </View>
          <FlatList
            data={mockSuggestedFriends}
            renderItem={renderSuggestedFriendItem}
            keyExtractor={(item) => item._id}
            scrollEnabled={false}
          />
        </ScrollView>
      )}

      {/* Groups Tab */}
      {activeTab === "groups" && (
        <ScrollView>
          {/* Group Invites Section */}
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.primary }]}>
              Lời mời vào nhóm ({mockGroupInvites.length})
            </Text>
          </View>
          <FlatList
            data={mockGroupInvites}
            renderItem={renderGroupInviteItem}
            keyExtractor={(item) => item._id}
            scrollEnabled={false}
          />

          {/* Groups Section */}
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.primary }]}>
              Danh sách nhóm ({mockGroups.length})
            </Text>
          </View>
          <FlatList
            data={mockGroups}
            renderItem={renderGroupItem}
            keyExtractor={(item) => item._id}
            scrollEnabled={false}
          />
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
    height:10000
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
    color: "red",
    textAlign: "center",
    marginVertical: 10,
  },
  friendItemContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#e0e0e0",
  },
  friendName: {
    marginLeft: 16,
    fontSize: 16,
    fontWeight: "500",
  },
});

export default ContactsScreen;