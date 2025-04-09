import React, { useState } from 'react';
import { View, StyleSheet, TouchableWithoutFeedback, TouchableOpacity, Text } from 'react-native';
import { Appbar, Avatar, useTheme } from 'react-native-paper';
import ProfileModal from '../components/ProfileModal';
import ChatList from '../components/ChatList';
import ChatArea from '../components/ChatArea';
import SettingsModal from '../components/SettingsModal';
import { logout } from '../apis/auth.api';

const HomeScreen = ({ navigation, route }) => {
  const { colors } = useTheme();
  const [currentUser, setCurrentUser] = useState(route.params?.user.user || {});
  const [visibleProfile, setVisibleProfile] = useState(false);
  const [visibleSettings, setVisibleSettings] = useState(false);
  const [selectedChat, setSelectedChat] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const token = route.params?.user.token;

  const mockChats = [
    {
      id: '1',
      name: 'Alice',
      avatar: 'https://i.pravatar.cc/150?img=1',
      lastMessage: 'Hey there!',
      time: '10:30 AM',
      unread: 2,
    },
    {
      id: '2',
      name: 'Bob',
      avatar: 'https://i.pravatar.cc/150?img=2',
      lastMessage: 'What\'s up?',
      time: '9:15 AM',
      unread: 0,
    },
  ];

  const handleLogout = async () => {
    try {
      setShowDropdown(false);
      await logout();
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    }catch(error){
      console.log(error.message);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={() => setShowDropdown(false)}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {!selectedChat && (
          <Appbar.Header style={{ backgroundColor: colors.primary, zIndex: 1000 }}>
            <Appbar.Content
              title="ChatApp"
              titleStyle={{
                color: 'white',
                fontWeight: 'bold',
                textAlign: 'left',
                marginLeft: -8,
              }}
            />
            <View style={styles.avatarContainer}>
              <Appbar.Action
                icon={() => (
                  <Avatar.Image
                    size={40}
                    source={{ uri: currentUser?.avatar || 'https://i.pravatar.cc/150' }}
                  />
                )}
                onPress={(e) => {
                  e.stopPropagation();
                  setShowDropdown(!showDropdown);
                }}
                color="white"
              />

              {showDropdown && (
                <View style={[styles.dropdownMenu, { backgroundColor: colors.surface }]}>
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
                    <Text style={[styles.menuText, { color: colors.error }]} onPress={handleLogout}>Đăng xuất</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </Appbar.Header>
        )}



        {selectedChat ? (
          <ChatArea
            chat={selectedChat}
            onBack={() => setSelectedChat(null)}
            user={currentUser}
          />
        ) : (
          <ChatList chats={mockChats} onChatSelect={setSelectedChat} />
        )}

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
  },
  dropdownMenu: {
    position: 'absolute',
    right: 10,
    top: 50,
    width: 150,
    borderRadius: 8,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
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

export default HomeScreen;