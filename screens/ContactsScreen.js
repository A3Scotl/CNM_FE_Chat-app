import React from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from "react-native";
import { useTheme, Avatar, Button } from "react-native-paper";
import { useFriendRequest } from "../hooks/useFriendRequest";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback } from "react";

const ContactsScreen = () => {
  const { colors } = useTheme();
  const {
    pendingRequests,
    loading: pendingLoading,
    error: pendingError,
    acceptRequest,
    rejectRequest,
    fetchPendingRequests,
    acceptedRequests, // Get the acceptedRequests
    loadingAccepted, // Get the loadingAccepted state
    errorAccepted,   // Get the errorAccepted state
    fetchAcceptedRequests, // Get the fetchAcceptedRequests function
  } = useFriendRequest();

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

  const renderRequestItem = ({ item }) => {
    return (
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
  };

  const renderFriendItem = ({ item }) => {
    return (
      <View style={styles.friendItemContainer}>
        <Avatar.Image
          size={48}
          source={{ uri: item.avatar || "https://i.pravatar.cc/150" }}
        />
        <Text style={[styles.friendName, { color: colors.text }]}>
          {item.fullName || "Unknown User"}
        </Text>
      </View>
    );
  };

  useFocusEffect(
    useCallback(() => {
      fetchPendingRequests();
      fetchAcceptedRequests(); // Call fetchAcceptedRequests on focus
    }, [fetchPendingRequests, fetchAcceptedRequests])
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.sectionTitle, { color: colors.primary }]}>
          Friend Requests
        </Text>
        <TouchableOpacity onPress={fetchPendingRequests} disabled={pendingLoading}>
          <Text style={[styles.refreshText, { color: colors.primary }]}>Refresh</Text>
        </TouchableOpacity>
      </View>
      {pendingLoading ? (
        <Text style={[styles.emptyText, { color: colors.text }]}>Loading requests...</Text>
      ) : pendingError ? (
        <Text style={[styles.errorText, { color: colors.error }]}>
          Error loading requests: {pendingError.message}
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

      <View style={styles.separator} />

      <Text style={[styles.sectionTitle, { color: colors.primary }]}>
        Friends
      </Text>
      {loadingAccepted ? (
        <Text style={[styles.emptyText, { color: colors.text }]}>Loading friends...</Text>
      ) : errorAccepted ? (
        <Text style={[styles.errorText, { color: colors.error }]}>
          Error loading friends: {errorAccepted.message}
        </Text>
      ) : acceptedRequests.length > 0 ? (
        <FlatList
          data={acceptedRequests}
          renderItem={renderFriendItem}
          keyExtractor={(item) => item._id}
        />
      ) : (
        <Text style={[styles.emptyText, { color: colors.text }]}>No friends yet.</Text>
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
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e0e0e0',
  },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoContainer: {
    marginLeft: 16,
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '500',
  },
  rowBottom: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
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
  separator: {
    height: 10,
  },
  friendItemContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e0e0e0',
    paddingHorizontal: 16,
  },
  friendName: {
    marginLeft: 16,
    fontSize: 16,
    fontWeight: "500",
  },
});

export default ContactsScreen;