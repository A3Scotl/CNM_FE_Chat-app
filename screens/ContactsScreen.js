import React, { useEffect } from "react";
import { View, Text, StyleSheet, FlatList } from "react-native";
import { useTheme, Avatar, Button } from "react-native-paper";
import { useFriendRequest } from "../hooks/useFriendRequest";

const ContactsScreen = () => {
  const { colors } = useTheme();
  const { pendingRequests, friends, fetchRequests, acceptRequest, rejectRequest } = useFriendRequest();

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleAccept = async (requestId) => {
    await acceptRequest(requestId);
  };

  const handleReject = async (requestId) => {
    await rejectRequest(requestId);
  };

  const renderRequestItem = ({ item }) => (
    <View style={styles.itemContainer}>
      <Avatar.Image
        size={48}
        source={{ uri: item.from?.avatar || "https://i.pravatar.cc/150" }}
      />
      <View style={styles.infoContainer}>
        <Text style={[styles.name, { color: colors.text }]}>
          {item.from?.fullName || "Unknown User"}
        </Text>
        <Text style={[styles.subText, { color: colors.text }]}>
          {item.from?.phoneNumber || "No phone number"}
        </Text>
      </View>
      <View style={styles.actionsContainer}>
        <Button
          mode="contained"
          onPress={() => handleAccept(item._id)}
          style={[styles.button, { backgroundColor: colors.primary }]}
        >
          Accept
        </Button>
        <Button
          mode="outlined"
          onPress={() => handleReject(item._id)}
          style={styles.button}
        >
          Reject
        </Button>
      </View>
    </View>
  );

  const renderFriendItem = ({ item }) => (
    <View style={styles.itemContainer}>
      <Avatar.Image
        size={48}
        source={{ uri: item.avatar || "https://i.pravatar.cc/150" }}
      />
      <View style={styles.infoContainer}>
        <Text style={[styles.name, { color: colors.text }]}>
          {item.fullName || "Unknown Friend"}
        </Text>
        <Text style={[styles.subText, { color: colors.text }]}>
          {item.phoneNumber || "No phone number"}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={[styles.sectionTitle, { color: colors.primary }]}>
        Friend Requests
      </Text>
      {pendingRequests.length > 0 ? (
        <FlatList
          data={pendingRequests}
          renderItem={renderRequestItem}
          keyExtractor={(item) => item._id}
          scrollEnabled={false}
        />
      ) : (
        <Text style={[styles.emptyText, { color: colors.text }]}>
          No pending requests.
        </Text>
      )}

      <Text style={[styles.sectionTitle, { color: colors.primary }]}>
        Friends
      </Text>
      {friends.length > 0 ? (
        <FlatList
          data={friends}
          renderItem={renderFriendItem}
          keyExtractor={(item) => item._id}
          scrollEnabled={false}
        />
      ) : (
        <Text style={[styles.emptyText, { color: colors.text }]}>
          No friends yet.
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 15,
    backgroundColor: "#f5f5f5",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginVertical: 10,
  },
  itemContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
    elevation: 2,
  },
  infoContainer: {
    flex: 1,
    marginLeft: 15,
  },
  name: {
    fontSize: 16,
    fontWeight: "500",
  },
  subText: {
    fontSize: 14,
    opacity: 0.6,
  },
  actionsContainer: {
    flexDirection: "row",
    gap: 5,
  },
  button: {
    paddingHorizontal: 5,
  },
  emptyText: {
    fontSize: 14,
    opacity: 0.6,
    textAlign: "center",
    marginVertical: 10,
  },
});

export default ContactsScreen;