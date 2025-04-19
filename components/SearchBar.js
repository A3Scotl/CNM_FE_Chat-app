import React from "react";
import { View, TextInput, StyleSheet, TouchableOpacity } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const SearchBar = ({
  searchQuery,
  setSearchQuery,
  setIsSearchFocused,
  colors,
  onSearch,
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
        placeholder="Tìm theo số điện thoại"
        placeholderTextColor="#888"
        keyboardType="phone-pad"
        onFocus={() => setIsSearchFocused(true)}
        onBlur={() => setIsSearchFocused(false)}
        onSubmitEditing={() => onSearch(searchQuery)}
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
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 16,
  },
  searchIcon: {
    marginRight: 10,
    color: '#888',
  },
  clearIconContainer: {
    marginLeft: 10,
  },
});

export default SearchBar;