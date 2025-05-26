import React from "react";
import { View, StyleSheet, TouchableOpacity, FlatList } from "react-native";
import { Modal, Avatar, Text } from "react-native-paper";

const AddMemberModal = ({ visible, onDismiss, availableFriends, onAddMember }) => {
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
        data={availableFriends}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.participantItem}
            onPress={() => onAddMember(item._id)}
          >
            <Avatar.Image
              size={40}
              source={{ uri: item.avatar || "https://i.pinimg.com/736x/2f/15/f2/2f15f2e8c688b3120d3d26467b06330c.jpg" }}
            />
            <Text style={styles.participantName}>{item.username}</Text>
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