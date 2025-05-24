import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Alert,
} from "react-native";
import { Portal, Modal, Text, Avatar, Button } from "react-native-paper";
import { MaterialIcons } from "@expo/vector-icons";
import { getFriendsNotInGroup } from "../../apis/conversationGroup.api";
import { sendGroupInvite } from "../../apis/pendingGroupInvite.api";
const { width, height } = Dimensions.get("window");
const baseWidth = 375;
const baseHeight = 667;
const scaleWidth = width / baseWidth;
const scaleHeight = height / baseHeight;

const normalize = (size, isHeight = false) => {
  const scale = isHeight ? scaleHeight : scaleWidth;
  return Math.round(size * scale);
};

const InviteMemberModal = ({
  visible,
  onDismiss,
  chatId,
  userId,
  friends,
  friendsLoaded,
  onFetchFriends,
  onInviteSent,
  socket,
}) => {
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingFriends, setLoadingFriends] = useState(false);

  useEffect(() => {
    if (visible && !friendsLoaded) {
      fetchFriends();
    }
  }, [visible, friendsLoaded]);

  const fetchFriends = async () => {
    setLoadingFriends(true);
    try {
      await onFetchFriends();
    } catch (error) {
      console.error("Lỗi tải danh sách bạn bè:", error);
      Alert.alert("Lỗi", "Không thể tải danh sách bạn bè.");
    } finally {
      setLoadingFriends(false);
    }
  };

  const toggleUserSelection = (userId) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSendInvites = async () => {
    if (selectedUsers.length === 0) {
      Alert.alert("Thông báo", "Vui lòng chọn ít nhất một người để mời.");
      return;
    }

    setLoading(true);
    try {
      for (const invitedUserId of selectedUsers) {
        await sendGroupInvite(chatId, invitedUserId, userId);
      }
      Alert.alert("Thành công", "Đã gửi lời mời tham gia nhóm.");
      setSelectedUsers([]);
      onInviteSent(selectedUsers);
      onDismiss();
    } catch (error) {
      console.error("Lỗi gửi lời mời:", error);
      Alert.alert("Lỗi", "Không thể gửi lời mời nhóm.");
    } finally {
      setLoading(false);
    }
  };

  const renderFriendItem = ({ item }) => (
    <TouchableOpacity
      style={styles.friendItem}
      onPress={() => toggleUserSelection(item._id)}
      disabled={loading}
    >
      <Avatar.Image
        size={normalize(40)}
        source={{ uri: item.avatar || "https://i.pravatar.cc/150" }}
        style={styles.avatar}
      />
      <View style={styles.friendInfo}>
        <Text style={styles.friendName}>{item.fullName || "Không rõ"}</Text>
      </View>
      {selectedUsers.includes(item._id) && (
        <MaterialIcons
          name="check-circle"
          size={normalize(24)}
          color="#0098f9"
        />
      )}
    </TouchableOpacity>
  );

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={styles.modalContainer}
      >
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Mời thành viên vào nhóm</Text>
          <TouchableOpacity onPress={onDismiss}>
            <Text style={styles.closeText}>Đóng</Text>
          </TouchableOpacity>
        </View>
        {loadingFriends ? (
          <ActivityIndicator
            size="large"
            color="#0098f9"
            style={styles.loader}
          />
        ) : friends.length === 0 ? (
          <Text style={styles.emptyText}>Không có bạn bè để mời.</Text>
        ) : (
          <FlatList
            data={friends}
            keyExtractor={(item) => item._id.toString()}
            renderItem={renderFriendItem}
            style={styles.friendList}
          />
        )}
        <Button
          mode="contained"
          onPress={handleSendInvites}
          disabled={loading || selectedUsers.length === 0}
          loading={loading}
          style={styles.inviteButton}
          labelStyle={styles.inviteButtonLabel}
        >
          Gửi lời mời
        </Button>
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    backgroundColor: "white",
    margin: normalize(20),
    padding: normalize(15),
    borderRadius: 12,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: normalize(10),
  },
  modalTitle: {
    fontSize: normalize(18),
    fontWeight: "bold",
    color: "#333",
  },
  closeText: {
    fontSize: normalize(16),
    color: "#0098f9",
  },
  friendList: {
    maxHeight: normalize(300, true),
  },
  friendItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: normalize(8),
  },
  avatar: {
    marginRight: normalize(10),
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    fontSize: normalize(16),
    color: "#333",
  },
  emptyText: {
    fontSize: normalize(14),
    color: "#666",
    textAlign: "center",
    marginVertical: normalize(20),
  },
  inviteButton: {
    marginTop: normalize(10),
    backgroundColor: "#0098f9",
    borderRadius: 8,
  },
  inviteButtonLabel: {
    fontSize: normalize(16),
    color: "white",
  },
  loader: {
    marginVertical: normalize(20),
  },
});

export default InviteMemberModal;
