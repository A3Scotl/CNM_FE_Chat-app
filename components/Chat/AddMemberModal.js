import React, { useState, useEffect } from "react";
import { View, StyleSheet, TouchableOpacity, FlatList } from "react-native";
import { Modal, Avatar, Text } from "react-native-paper";
import { getUserById } from "../../apis/user.api"; // Adjust the import path

const AddMemberModal = ({
  visible,
  onDismiss,
  availableFriends,
  onAddMember,
}) => {
  const [friendsWithDetails, setFriendsWithDetails] = useState([]);

  // Fetch user details if necessary
  useEffect(() => {
    const fetchFriendDetails = async () => {
      try {
        const updatedFriends = await Promise.all(
          availableFriends.map(async (friend) => {
            // If friend already has avatar and userName, use them
            if (friend.avatar && friend.userName) {
              return friend;
            }
            // Fetch user details by ID
            const userDetails = await getUserById(friend._id);
            return {
              ...friend,
              avatar: userDetails.avatar || "https://i.pravatar.cc/150",
              userName: userDetails.userName || "Unknown User",
            };
          })
        );
        setFriendsWithDetails(updatedFriends);
      } catch (error) {
        console.error("Error fetching friend details:", error);
        // Fallback to original data with default values
        setFriendsWithDetails(
          availableFriends.map((friend) => ({
            ...friend,
            avatar: friend.avatar || "https://i.pravatar.cc/150",
            userName: friend.userName || "Unknown User",
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
          avatar: friend.avatar || "https://i.pravatar.cc/150",
          userName: friend.userName || "Unknown User",
        }))
      );
    }
  }, [visible, availableFriends]);

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
            onPress={() => onAddMember(item)} // Pass the entire user object
          >
            <Avatar.Image
              size={40}
              source={{ uri: item.avatar || "https://i.pinimg.com/736x/2f/15/f2/2f15f2e8c688b3120d3d26467b06330c.jpg" }}
            />
            <Text style={styles.participantName}>
              {item.userName || "Unknown User"}
            </Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text>Không có bạn bè nào để thêm.</Text>}
        style={styles.participantList}
      />
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
    maxHeight: 200,
  },
  participantItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },
  participantName: {
    fontSize: 16,
    fontWeight: "500",
    marginLeft: 10,
  },
});

export default AddMemberModal;
