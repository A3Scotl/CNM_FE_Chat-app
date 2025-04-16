import React from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from "react-native";
import { Avatar } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const SearchOverlay = ({ 
  isVisible, 
  searchResults, 
  isSearching, 
  searchQuery, 
  currentUser, 
  onSendFriendRequest, 
  message, 
  colors 
}) => {
  if (!isVisible) return null;
  
  return (
    <View style={styles.overlayContainer}>
      {searchResults.length > 0 ? (
        <FlatList
          data={searchResults}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => {
            const isCurrentUser = item._id === currentUser?._id;
            return (
              <View style={styles.userItem}>
                <Avatar.Image
                  size={40}
                  source={{ uri: item.avatar || "https://i.pravatar.cc/150" }}
                />
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>
                    {item.fullName || "Unknown User"}
                  </Text>
                  <Text style={styles.userPhone}>{item.phoneNumber}</Text>
                </View>
                {!isCurrentUser && (
                  <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => onSendFriendRequest(item._id)}
                  >
                    <MaterialCommunityIcons
                      name="account-plus"
                      size={24}
                      color={colors.primary}
                    />
                  </TouchableOpacity>
                )}
              </View>
            );
          }}
          style={styles.resultsContainer}
        />
      ) : (
        !isSearching && searchQuery.trim() && (
          <Text style={styles.noResults}>No users found.</Text>
        )
      )}
      {message && (
        <Text style={[styles.message, { color: colors.primary }]}>
          {message}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  overlayContainer: {
    position: "absolute",
    top: 110, 
    left: 0,
    right: 0,
    backgroundColor: "white",
    zIndex: 5,
    maxHeight: "70%",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
  },
  resultsContainer: {
    paddingHorizontal: 15,
    backgroundColor: "#fff",
  },
  userItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  userInfo: {
    flex: 1,
    marginLeft: 15,
  },
  userName: {
    fontSize: 16,
    fontWeight: "500",
  },
  userPhone: {
    fontSize: 14,
    color: "#666",
  },
  addButton: {
    padding: 5,
  },
  noResults: {
    textAlign: "center",
    marginVertical: 20,
    padding: 15,
    color: "#666",
    fontStyle: "italic",
  },
  message: {
    textAlign: "center",
    marginVertical: 10,
    fontSize: 14,
    padding: 10,
    backgroundColor: "#fff",
    width: "100%",
  },
});

export default SearchOverlay;