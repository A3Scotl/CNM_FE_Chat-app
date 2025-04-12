import React, { useState } from 'react';
import { View, StyleSheet, TouchableWithoutFeedback, TouchableOpacity, Text, TextInput, Keyboard } from 'react-native';
import { Appbar, Avatar, useTheme, BottomNavigation } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import ProfileModal from '../components/ProfileModal';
import ChatList from '../components/ChatList';
import ChatArea from '../components/ChatArea';
import SettingsModal from '../components/SettingsModal';
import { logout } from '../apis/auth.api';
import ContactsScreen from './ContactsScreen';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const HomeScreen = ({ navigation, route }) => {
  const theme = {
    ...useTheme(),
    colors: {
      ...useTheme().colors,
      primary: '#0098f9',
      accent: '#0098f9',
    },
  };
  const { colors } = theme;
  const [currentUser, setCurrentUser] = useState(route.params?.user.user || {});
  const [visibleProfile, setVisibleProfile] = useState(false);
  const [visibleSettings, setVisibleSettings] = useState(false);
  const [selectedChat, setSelectedChat] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: 'messages', title: 'Tin nhắn', icon: 'message-text' },
    { key: 'contacts', title: 'Danh bạ', icon: 'account-group' },
  ]);
  const token = route.params?.user.token;

  const mockChats = [
    {
      id: '1',
      name: 'Nghĩa',
      avatar: 'https://i.pravatar.cc/150?img=1',
      lastMessage: '[Danh thiếp] Nghĩa',
      time: '1 giờ',
      unread: 0,
    },
    {
      id: '2',
      name: 'Nơi Thắng',
      avatar: 'https://i.pravatar.cc/150?img=2',
      lastMessage: 'hay tui làm phần add friend cho',
      time: '7 phút',
      unread: 0,
    },
    {
      id: '3',
      name: 'CNM_NHOM_03',
      avatar: 'https://i.pravatar.cc/150?img=3',
      lastMessage: 'oke',
      time: '9 phút',
      unread: 0,
    },
    {
      id: '4',
      name: 'Nhóm-NMDLL',
      avatar: 'https://i.pravatar.cc/150?img=4',
      lastMessage: 'Hồ Văn Sang tham gia cuộc bình...',
      time: '2 giờ',
      unread: 0,
    },
    {
      id: '5',
      name: 'Kiến trúc',
      avatar: 'https://i.pravatar.cc/150?img=5',
      lastMessage: '@Nguyen Kha push cái lúc nãy...',
      time: '6 giờ',
      unread: 0,
    },
  ];

  const handleLogout = async () => {
    try {
      setShowDropdown(false);
      await logout();
      navigation.navigate('Login');
    } catch (error) {
      console.log(error);
    }
  };

  const renderScene = BottomNavigation.SceneMap({
    messages: () => (
      selectedChat ? (
        <ChatArea
          chat={selectedChat}
          onBack={() => setSelectedChat(null)}
          user={currentUser}
        />
      ) : (
        <ChatList chats={mockChats} onChatSelect={setSelectedChat} />
      )
    ),
    contacts: () => <ContactsScreen />,
  });

  return (
    <TouchableWithoutFeedback onPress={() => {
      setShowDropdown(false);
      Keyboard.dismiss();
    }}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Appbar.Header style={{
          backgroundColor: '#0098f9',
          elevation: 0,
          shadowOpacity: 0,
          zIndex: 1000,
          paddingHorizontal: 10,
        }}>
          <View style={[styles.searchContainer, {
            backgroundColor: isSearchFocused ? 'white' : '#f5f5f5',
            borderColor: isSearchFocused ? colors.primary : '#f5f5f5',
          }]}>
            <MaterialIcons
              name="search"
              size={24}
              color={isSearchFocused ? colors.primary : '#888'}
              style={styles.searchIcon}
            />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Tìm kiếm"
              placeholderTextColor="#888"
              value={searchQuery}
              onChangeText={setSearchQuery}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
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
          <View style={styles.avatarContainer}>
            <TouchableOpacity onPress={(e) => {
              e.stopPropagation();
              setShowDropdown(!showDropdown);
            }}>
              <Avatar.Image
                size={36}
                source={{ uri: currentUser?.avatar || 'https://i.pravatar.cc/150' }}
                style={styles.avatar}
              />
            </TouchableOpacity>

            {showDropdown && (
              <View style={[styles.dropdownMenu, {
                backgroundColor: colors.surface,
                shadowColor: colors.shadow,
              }]}>
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    setVisibleProfile(true);
                    setShowDropdown(false);
                  }}
                >
                  <Text style={[styles.menuText, { color: colors.text }]}>Hồ sơ</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    setVisibleSettings(true);
                    setShowDropdown(false);
                  }}
                >
                  <Text style={[styles.menuText, { color: colors.text }]}>Cài đặt</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={handleLogout}
                >
                  <Text style={[styles.menuText, { color: colors.error }]}>Đăng xuất</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </Appbar.Header>

        <BottomNavigation
          navigationState={{ index, routes }}
          onIndexChange={setIndex}
          renderScene={renderScene}
          barStyle={{
            backgroundColor: 'white', 
            elevation: 8,
            shadowColor: '#000',
            shadowOffset: {
              width: 0,
              height: -2,
            },
            shadowOpacity: 0.1,
            shadowRadius: 4
          }}
          activeColor={colors.primary}
          inactiveColor="#888"
          labeled={false}
          sceneAnimationEnabled={true}
          sceneAnimationType="shifting"
          renderIcon={({ route, focused, color }) => {
            let iconName;
            if (route.key === 'messages') {
              iconName = focused ? 'message-text' : 'message-text-outline';
            } else if (route.key === 'contacts') {
              iconName = focused ? 'account-group' : 'account-group-outline';
            }
            return (
              <View style={[
                styles.iconContainer,
                focused && styles.activeIconContainer 
              ]}>
                <MaterialCommunityIcons
                  name={iconName}
                  size={28}
                  color={color}
                />
              </View>
            );
          }}
          style={styles.bottomNav}
        />

        <ProfileModal
          visible={visibleProfile}
          user={currentUser}
          token={token}
          onDismiss={() => setVisibleProfile(false)}
          onUpdateSuccess={(updatedUser) => setCurrentUser(updatedUser)}
        />

        <SettingsModal
          visible={visibleSettings}
          user={currentUser}
          onDismiss={() => setVisibleSettings(false)}
        />
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  avatarContainer: {
    position: 'relative',
    marginLeft: 10,
  },
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
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    paddingHorizontal: 15,
    height: 40,
    borderWidth: 1,
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
  avatar: {
    marginLeft: 10,
  },
  bottomNav: {
    borderTopWidth: 0.5,
    borderTopColor: '#e0e0e0',
    elevation: 8,
    shadowColor: '#000',
    
  },
});

export default HomeScreen;