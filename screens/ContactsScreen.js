import React from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from "react-native";
import { useTheme, Avatar, Button } from "react-native-paper";
import { useFriendRequest } from "../hooks/useFriendRequest";

const ContactsScreen = () => {
  const { colors } = useTheme();
  const { pendingRequests, loading, error, acceptRequest, rejectRequest, fetchPendingRequests } =
    useFriendRequest();

  const handleAccept = async (requestId) => {
    try {
      await acceptRequest(requestId);
    } catch (error) {
      console.error("Failed to accept request:", error);
    }
  };

  const handleReject = async (requestId) => {
    try {
      await rejectRequest(requestId);
    } catch (error) {
      console.error("Failed to reject request:", error);
    }
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.sectionTitle, { color: colors.primary }]}>
          Friend Requests
        </Text>
        <TouchableOpacity onPress={fetchPendingRequests} disabled={loading}>
          <Text style={[styles.refreshText, { color: colors.primary }]}>Refresh</Text>
        </TouchableOpacity>
      </View>
      {loading ? (
        <Text style={[styles.emptyText, { color: colors.text }]}>Loading requests...</Text>
      ) : error ? (
        <Text style={[styles.errorText, { color: colors.error }]}>
          Error loading requests: {error.message}
        </Text>
      ) : pendingRequests.length > 0 ? (
        <FlatList
          data={pendingRequests}
          renderItem={renderRequestItem}
          keyExtractor={(item) => item._id}
          scrollEnabled={false}
        />
      ) : (
        <Text style={[styles.emptyText, { color: colors.text }]}>No pending requests.</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 15,
    backgroundColor: "white",
   
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginVertical: 10,
  },
  refreshText: {
    fontSize: 16,
    fontWeight: "500",
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
  errorText: {
    fontSize: 14,
    color: "red",
    textAlign: "center",
    marginVertical: 10,
  },
});

export default ContactsScreen;