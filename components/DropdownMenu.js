import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

const DropdownMenu = ({ showDropdown, setShowDropdown, currentUser, setVisibleProfile, setVisibleSettings, handleLogout, colors }) => {
  return (
    showDropdown && (
      <View
        style={[
          styles.dropdownMenu,
          {
            backgroundColor: colors.surface,
            shadowColor: colors.shadow,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => {
            setVisibleProfile(true);
            setShowDropdown(false);
          }}
        >
          <Text style={[styles.menuText, { color: colors.text }]}>
            Hồ sơ
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => {
            setVisibleSettings(true);
            setShowDropdown(false);
          }}
        >
          <Text style={[styles.menuText, { color: colors.text }]}>
            Cài đặt
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={handleLogout}
        >
          <Text style={[styles.menuText, { color: colors.error }]}>
            Đăng xuất
          </Text>
        </TouchableOpacity>
      </View>
    )
  );
};

const styles = StyleSheet.create({
  dropdownMenu: {
    position: 'absolute',
    right: 0,
    top: 45,
    width: 150,
    borderRadius: 8,
    elevation: 5,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    zIndex: 100,
    paddingVertical: 8,
  },
  menuItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  menuText: {
    fontSize: 16,
  },
});

export default DropdownMenu;