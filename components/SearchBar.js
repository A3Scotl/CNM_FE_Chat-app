import React, { useEffect } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { debounce } from 'lodash';

const SearchBar = ({
  searchQuery,
  setSearchQuery,
  isSearchFocused,
  setIsSearchFocused,
  onSearch,
  colors,
}) => {
  const debouncedSearch = debounce((query) => {
    onSearch(query);
  }, 500);

  useEffect(() => {
    if (searchQuery) {
      debouncedSearch(searchQuery);
    }
  }, [searchQuery]);

  return (
    <View
      style={[
        styles.searchContainer,
        {
          backgroundColor: isSearchFocused ? 'white' : '#f5f5f5',
          borderColor: isSearchFocused ? colors.primary : '#f5f5f5',
        },
      ]}
    >
      <MaterialIcons
        name="search"
        size={24}
        color={isSearchFocused ? colors.primary : '#888'}
        style={styles.searchIcon}
      />
      <TextInput
        style={[styles.searchInput, { color: colors.text }]}
        placeholder="Tìm kiếm theo số điện thoại"
        placeholderTextColor="#888"
        value={searchQuery}
        onChangeText={setSearchQuery}
        onFocus={() => setIsSearchFocused(true)}
        onBlur={() => setIsSearchFocused(false)}
        keyboardType="phone-pad"
      />
      {searchQuery.length > 0 && (
        <TouchableOpacity onPress={() => setSearchQuery('')}>
          <MaterialIcons
            name="close"
            size={20}
            color="#888"
            style={styles.clearIcon}
          />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    paddingHorizontal: 15,
    height: 40,
    borderWidth: 1,
    marginVertical: 5, // Thêm margin dọc để tách biệt
  },
  searchInput: {
    flex: 1,
    height: 40,
    paddingHorizontal: 10,
    fontSize: 16,
  },
  searchIcon: {
    marginRight: 8,
  },
  clearIcon: {
    marginLeft: 8,
  },
});

export default SearchBar;