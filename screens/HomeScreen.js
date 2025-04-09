import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Appbar, Avatar, useTheme } from 'react-native-paper';
import ProfileModal from '../components/ProfileModal';
import ChatList from '../components/ChatList';
import ChatArea from '../components/ChatArea';

const HomeScreen = ({ navigation, route }) => {
  const { colors } = useTheme();
  const [currentUser, setCurrentUser] = useState(route.params?.user.user || {});
  const [visibleProfile, setVisibleProfile] = useState(false);
  const [selectedChat, setSelectedChat] = useState(null);
  const token = route.params?.user.token;

  // Danh sách demo
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

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Appbar.Header style={{ backgroundColor: colors.primary }}>
        {selectedChat && (
          <Appbar.BackAction onPress={() => setSelectedChat(null)} color="white" />
        )}
        <Appbar.Content title="Trang chủ" titleStyle={{ color: 'white' }} />
        <Appbar.Action
          icon={() => (
            <Avatar.Image
              size={40}
              source={{ uri: currentUser?.avatar || 'https://i.pravatar.cc/150' }}
            />
          )}
          onPress={() => setVisibleProfile(true)}
          color="white"
        />
      </Appbar.Header>

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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default HomeScreen;
