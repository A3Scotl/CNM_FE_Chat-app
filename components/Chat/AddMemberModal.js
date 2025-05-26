// AddMemberModal.js
import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
} from "react-native";
import { Modal, Avatar, Text, Button, Checkbox } from "react-native-paper";
import { getUserById } from "../../apis/user.api"; // Adjust the import path

const AddMemberModal = ({
  visible,
  onDismiss,
  availableFriends,
  onAddMember,
}) => {
  const [friendsWithDetails, setFriendsWithDetails] = useState([]);
  const [selectedFriends, setSelectedFriends] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch user details if necessary
  useEffect(() => {
    const fetchFriendDetails = async () => {
      try {
        const updatedFriends = await Promise.all(
          availableFriends.map(async (friend) => {
            if (friend.avatar && friend.userName) {
              return friend;
            }
            const userDetails = await getUserById(friend._id);
            return {
              ...friend,
              avatar:
                userDetails.avatar ||
                "https://i.pinimg.com/736x/2f/15/f2/2f15f2e8c688b3120d3d26467b06330c.jpg",
              userName: userDetails.userName,
            };
          })
        );
        setFriendsWithDetails(updatedFriends);
      } catch (error) {
        console.error("Error fetching friend details:", error);
        setFriendsWithDetails(
          availableFriends.map((friend) => ({
            ...friend,
            avatar:
              friend.avatar ||
              "https://i.pinimg.com/736x/2f/15/f2/2f15f2e8c688b3120d3d26467b06330c.jpg",
            userName: friend.userName,
          }))
        );
      }
    };

    if (visible && availableFriends.length > 0) {
      fetchFriendDetails();
    } else {
      setFriendsWithDetails(
        availableFriends.map((friend) => ({
          ...friend,
          avatar:
            friend.avatar ||
            "https://i.pinimg.com/736x/2f/15/f2/2f15f2e8c688b3120d3d26467b06330c.jpg",
          userName: friend.userName,
        }))
      );
    }
    // Reset selected friends when modal opens/closes
    setSelectedFriends([]);
  }, [visible, availableFriends]);

  // Toggle friend selection
  const toggleFriendSelection = (friend) => {
    setSelectedFriends((prev) => {
      if (prev.some((f) => f._id === friend._id)) {
        return prev.filter((f) => f._id !== friend._id);
      }
      return [...prev, friend];
    });
  };

  // Handle adding multiple members
  const handleAddMembers = async () => {
    if (selectedFriends.length === 0) {
      Alert.alert("Thông báo", "Vui lòng chọn ít nhất một người bạn để thêm.");
      return;
    }

    setIsSubmitting(true);
    try {
      const userIds = selectedFriends.map((friend) => friend._id);
      await onAddMember(userIds); // Call the updated onAddMember with userIds array
      Alert.alert(
        "Thành công",
        `Đã thêm ${selectedFriends.length} thành viên vào nhóm.`
      );
      setSelectedFriends([]); // Clear selection
      onDismiss(); // Close modal
    } catch (error) {
      console.error("Error adding members:", error);
      Alert.alert("Lỗi", error.message || "Không thể thêm thành viên.");
    } finally {
      setIsSubmitting(false);
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
        data={friendsWithDetails}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.participantItem}
            onPress={() => toggleFriendSelection(item)}
          >
            <Avatar.Image
              size={40}
              source={{
                uri:
                  item.avatar ||
                  "https://i.pinimg.com/736x/2f/15/f2/2f15f2e8c688b3120d3d26467b06330c.jpg",
              }}
            />
            <Text style={styles.participantName}>
              {item.userName || "Unknown User"}
            </Text>
            <Checkbox
              status={
                selectedFriends.some((f) => f._id === item._id)
                  ? "checked"
                  : "unchecked"
              }
              onPress={() => toggleFriendSelection(item)}
            />
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text>Không có bạn bè nào để thêm.</Text>}
        style={styles.participantList}
      />
      <Button
        mode="contained"
        onPress={handleAddMembers}
        disabled={isSubmitting || selectedFriends.length === 0}
        style={styles.confirmButton}
        loading={isSubmitting}
      >
        Xác nhận ({selectedFriends.length})
      </Button>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    backgroundColor: "white",
    margin: 20,
    padding: 20,
    borderRadius: 10,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  modalCloseText: {
    fontSize: 16,
    color: "#0098f9",
  },
  participantList: {
    maxHeight: 300,
  },
  participantItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    justifyContent: "space-between",
  },
  participantName: {
    fontSize: 16,
    fontWeight: "500",
    marginLeft: 10,
    flex: 1,
  },
  confirmButton: {
    marginTop: 20,
    backgroundColor: "#0098f9",
  },
});

export default AddMemberModal;
