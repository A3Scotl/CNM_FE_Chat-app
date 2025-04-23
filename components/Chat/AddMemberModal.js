import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Dimensions,
  Alert,
} from "react-native";
import { Modal, Avatar, Text, Button } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { sendGroupInvite } from "../../apis/pendingGroupInvite.api";

// Tính toán kích thước dựa trên Dimensions (copied from ChatInfoModal for consistency)
const { width, height } = Dimensions.get("window");
const baseWidth = 375; // iPhone 8 width
const baseHeight = 667; // iPhone 8 height
const scaleWidth = width / baseWidth;
const scaleHeight = height / baseHeight;

const normalize = (size, isHeight = false) => {
  const scale = isHeight ? scaleHeight : scaleWidth;
  return Math.round(size * scale);
};

const AddMemberModal = ({
  visible,
  onDismiss,
  chatId,
  userId,
  friends,
  onFetchFriends,
  onSendInvites,
  emitGroupInvite, // Add this prop to emit Socket.IO events
}) => {
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch friends when the modal opens
  useEffect(() => {
    if (visible) {
      onFetchFriends(); // Refresh friends list when modal opens
    }
  }, [visible, onFetchFriends]);

  // Reset selected members when modal closes
  useEffect(() => {
    if (!visible) {
      setSelectedMembers([]);
    }
  }, [visible]);

  // Toggle selection of a member
  const toggleMember = (userId) => {
    setSelectedMembers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  // Send invites to selected members
  const handleSendInvites = async () => {
    if (selectedMembers.length === 0) {
      Alert.alert("Lỗi", "Vui lòng chọn ít nhất một người để mời.");
      return;
    }

    setLoading(true);
    try {
      const newInvites = [];
      for (const invitedUserId of selectedMembers) {
        const invite = await sendGroupInvite(chatId, invitedUserId, userId);
        newInvites.push(invite);
        // Emit Socket.IO event for real-time update
        if (emitGroupInvite) {
          emitGroupInvite(invitedUserId, invite);
        }
      }
      onSendInvites(newInvites);
      onDismiss();
      Alert.alert("Thành công", "Đã gửi lời mời đến các thành viên được chọn.");
    } catch (error) {
      console.error("Lỗi gửi lời mời nhóm:", error);
      Alert.alert("Lỗi", error.message || "Không thể gửi lời mời nhóm.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      onDismiss={onDismiss}
      contentContainerStyle={styles.modalContainer}
    >
      <View style={styles.modalHeader}>
        <Text style={styles.modalTitle}>Thêm thành viên</Text>
        <TouchableOpacity onPress={onDismiss}>
          <Text style={styles.modalCloseText}>Đóng</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={friends}
        keyExtractor={(item) =>
          item._id?.toString() || Math.random().toString()
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.participantItem}
            onPress={() => toggleMember(item._id)}
          >
            <Avatar.Image
              size={normalize(40)}
              source={{ uri: item.avatar || "https://i.pravatar.cc/150" }}
            />
            <View style={styles.participantInfo}>
              <Text style={styles.participantName}>
                {item.fullName || item.username || "Không rõ"}
              </Text>
            </View>
            <View style={styles.checkboxContainer}>
              <MaterialCommunityIcons
                name={
                  selectedMembers.includes(item._id)
                    ? "checkbox-marked"
                    : "checkbox-blank-outline"
                }
                size={normalize(24)}
                color="#0098f9"
              />
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Không có bạn bè nào để thêm.</Text>
        }
        style={styles.participantList}
        nestedScrollEnabled={true}
      />
      <Button
        mode="contained"
        onPress={handleSendInvites}
        style={styles.sendInviteButton}
        disabled={loading || selectedMembers.length === 0}
        loading={loading}
      >
        Gửi lời mời
      </Button>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    backgroundColor: "white",
    margin: normalize(20),
    padding: normalize(20),
    borderRadius: 12,
    maxHeight: height * 0.8,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: normalize(20, true),
  },
  modalTitle: {
    fontSize: normalize(20),
    fontWeight: "bold",
    color: "#333",
  },
  modalCloseText: {
    fontSize: normalize(16),
    color: "#0098f9",
    fontWeight: "500",
  },
  participantList: {
    maxHeight: normalize(300, true),
  },
  participantItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: normalize(8, true),
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  participantInfo: {
    flex: 1,
    marginLeft: normalize(10),
  },
  participantName: {
    fontSize: normalize(16),
    fontWeight: "500",
    color: "#333",
  },
  checkboxContainer: {
    padding: normalize(8),
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: normalize(14),
    color: "#666",
    textAlign: "center",
    marginVertical: normalize(10, true),
  },
  sendInviteButton: {
    marginTop: normalize(15, true),
    borderRadius: 8,
    backgroundColor: "#0098f9",
    elevation: 3,
  },
});

export default AddMemberModal;
