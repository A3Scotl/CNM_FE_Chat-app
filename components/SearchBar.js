import React from "react";
import { View, TextInput, StyleSheet, TouchableOpacity } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const SearchBar = ({
  searchQuery,
  setSearchQuery,
  setIsSearchFocused,
  colors,

}) => {
  return (
    <View style={styles.searchContainer}>
      <MaterialCommunityIcons name="magnify" size={24} style={styles.searchIcon} />
      <TextInput
        style={[
          styles.searchInput,
          {
            backgroundColor: "white",
            color: colors.text,
          },
        ]}
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Nhập tên hoặc số điện thoại"
        placeholderTextColor="#888"
        // keyboardType="phone-pad"
        returnKeyType="none"
        onFocus={() => setIsSearchFocused(true)}
        onBlur={() => setIsSearchFocused(false)}
        dense
      />
      {searchQuery.length > 0 && (
        <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearIconContainer}>
          <MaterialCommunityIcons name="close" size={20} color="#888" />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
    backgroundColor: 'white',
    borderRadius: 20,
    paddingHorizontal: 15,
    width: 270,
    flex:1
  },
  searchInput: {
    flex: 1,
    paddingVertical: 8,
    fontSize: 13,
  },
  searchIcon: {
    marginRight:5,
    color: '#888',
  },
  clearIconContainer: {
    marginLeft: 10,
  },
});

export default SearchBar;