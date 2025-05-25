import React, { useState, useEffect } from "react";
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
import { useGroupInvite } from "../../hooks/useGroupInvite";

const { width, height } = Dimensions.get("window");
const baseWidth = 375;
const baseHeight = 667;
const scaleWidth = width / baseWidth;
const scaleHeight = height / baseHeight;

const normalize = (size, isHeight = false) => {
  const scale = isHeight ? scaleHeight : scaleWidth;
  return Math.round(size * scale);
};

const InviteMemberModal = ({ visible, onDismiss, chatId, userId, socket }) => {
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const {
    availableFriends,
    friendsLoaded,
    loadingFriends,
    fetchAvailableFriends,
    handleSendInvite,
  } = useGroupInvite(userId, chatId, socket);

  useEffect(() => {
    if (visible && !friendsLoaded) {
      fetchAvailableFriends();
    }
    if (visible) {
      setSelectedUser(null);
    }
  }, [visible, friendsLoaded, fetchAvailableFriends]);

  const toggleUserSelection = (userId) => {
    setSelectedUser((prev) => (prev === userId ? null : userId));
  };

  const sendInvite = async () => {
    if (!selectedUser) {
      Alert.alert("Thông báo", "Vui lòng chọn một người để mời.");
      return;
    }

    console.log("InviteMemberModal - sendInvite:", {
      chatId,
      selectedUser,
      invitedBy: userId,
    });

    if (!selectedUser || typeof selectedUser !== "string") {
      Alert.alert("Lỗi", "Người dùng được chọn không hợp lệ.");
      return;
    }

    setLoading(true);
    try {
      await handleSendInvite(selectedUser);
      setSelectedUser(null);
      onDismiss();
    } catch (error) {
      // Lỗi đã được xử lý trong handleSendInvite
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
      {selectedUser === item._id && (
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
        ) : availableFriends.length === 0 ? (
          <Text style={styles.emptyText}>Không có bạn bè để mời.</Text>
        ) : (
          <FlatList
            data={availableFriends}
            keyExtractor={(item) => item._id.toString()}
            renderItem={renderFriendItem}
            style={styles.friendList}
          />
        )}
        <Button
          mode="contained"
          onPress={sendInvite}
          disabled={loading || !selectedUser}
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
