import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Appbar, Avatar, Menu, Divider, useTheme, Text } from 'react-native-paper';
import ChatList from '../components/ChatList';
import ChatArea from '../components/ChatArea';
import ProfileModal from '../components/ProfileModal';

const HomeScreen = ({ navigation, route }) => {
  const { colors } = useTheme();
  const { user } = route.params || {};
  
  const [visibleMenu, setVisibleMenu] = useState(false);
  const [visibleProfile, setVisibleProfile] = useState(false);
  const [activeChat, setActiveChat] = useState(null); 

  const [chats, setChats] = useState([
    { id: '1', name: 'Nhóm lớp học', lastMessage: 'Hôm nay có bài tập mới', time: '10:30', unread: 2, avatar: 'https://i.pravatar.cc/150?img=1' },
    { id: '2', name: 'Mẹ', lastMessage: 'Tối nay về ăn cơm không con?', time: '09:15', unread: 0, avatar: 'https://i.pravatar.cc/150?img=2' },
  ]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <Appbar.Header style={{ backgroundColor: colors.primary }}>
        <Appbar.Content title="Zalo" titleStyle={{ color: colors.white }} />
        <Menu
          visible={visibleMenu}
          onDismiss={() => setVisibleMenu(false)}
          anchor={
            <Appbar.Action 
              icon={() => (
                <Avatar.Image 
                  size={40} 
                  source={{ uri: user?.avatar || 'https://i.pravatar.cc/150' }} 
                />
              )} 
              onPress={() => setVisibleMenu(true)} 
              color={colors.white}
            />
          }
        >
          <Menu.Item onPress={() => { setVisibleMenu(false); setVisibleProfile(true); }} title="Hồ sơ" />
          <Divider />
          <Menu.Item onPress={() => navigation.replace('Login')} title="Đăng xuất" />
        </Menu>
      </Appbar.Header>

      {/* Nội dung chính */}
      <View style={styles.mainContent}>
        {/* Luôn hiển thị danh sách chat chiếm toàn bộ màn hình khi chưa chọn chat */}
        {!activeChat ? (
          <ChatList 
            chats={chats}
            onChatSelect={setActiveChat}
          />
        ) : (
          <ChatArea 
            chat={activeChat}
            onBack={() => setActiveChat(null)}
            user={user}
          />
        )}
      </View>

      <ProfileModal
        visible={visibleProfile}
        user={user}
        onDismiss={() => setVisibleProfile(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mainContent: {
    flex: 1,
  },
});

export default HomeScreen;