import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableWithoutFeedback,
  Keyboard,
  TouchableOpacity

} from 'react-native';
import {
  Appbar,
  Avatar,
  useTheme,
  BottomNavigation,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import ChatList from '../components/Chat/ChatList';
import ChatArea from '../components/Chat/ChatArea';
import ProfileModal from '../components/Modal/ProfileModal';
import SettingsModal from '../components/Modal/SettingsModal';
import { logout } from '../apis/auth.api';
import ContactsScreen from './ContactsScreen';
import DropdownMenu from '../components/DropdownMenu';
import SearchBar from '../components/SearchBar';

const HomeScreen = ({ navigation, route }) => {
  const theme = useTheme();
  const colors = {
    ...theme.colors,
    primary: '#0098f9',
    accent: '#0098f9',
  };

  const [currentUser, setCurrentUser] = useState(route.params?.user || {});
  const [visibleProfile, setVisibleProfile] = useState(false);
  const [visibleSettings, setVisibleSettings] = useState(false);
  const [selectedChat, setSelectedChat] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [showAppbar, setShowAppbar] = useState(true);
  const [showBottomNav, setShowBottomNav] = useState(true);
  const [index, setIndex] = useState(0);

  const [routes] = useState([
    { key: 'messages', title: 'Tin nhắn', icon: 'message-text' },
    { key: 'contacts', title: 'Danh bạ', icon: 'account-group' },
  ]);

  const token = route.params?.user.token;

  const mockChats = [
    {
      id: '1',
      name: 'Alice',
      avatar: 'https://i.pravatar.cc/150?img=1',
      lastMessage: {
        content: 'Chào bạn! Bạn khỏe không?',
        timestamp: '10:01 AM',
      },
    },
    {
      id: '2',
      name: 'Bob',
      avatar: 'https://i.pravatar.cc/150?img=2',
      lastMessage: {
        content: 'Mình đã gửi tài liệu cho bạn.',
        timestamp: '9:45 AM',
      },
    },
    {
      id: '3',
      name: 'Charlie',
      avatar: 'https://i.pravatar.cc/150?img=3',
      lastMessage: {
        content: 'Hẹn gặp lại vào cuối tuần này!',
        timestamp: '8:30 AM',
      },
    },
    {
      id: '4',
      name: 'David',
      avatar: 'https://i.pravatar.cc/150?img=4',
      lastMessage: {
        content: 'Bạn có thể giúp mình với dự án này không?',
        timestamp: 'Yesterday',
      },
    },
    {
      id: '5',
      name: 'Eva',
      avatar: 'https://i.pravatar.cc/150?img=5',
      lastMessage: {
        content: 'Cảm ơn bạn đã giúp đỡ!',
        timestamp: 'Yesterday',
      },
    },
    {
      id: '6',
      name: 'Frank',
      avatar: 'https://i.pravatar.cc/150?img=6',
      lastMessage: {
        content: 'Chúng ta nên đi ăn trưa!',
        timestamp: '2 days ago',
      },
    },
    {
      id: '7',
      name: 'Frank',
      avatar: 'https://i.pravatar.cc/150?img=6',
      lastMessage: {
        content: 'Chúng ta nên đi ăn trưa!',
        timestamp: '2 days ago',
      },
    },
  ];

  const handleLogout = async () => {
    try {
      setShowDropdown(false);
      await logout();
      navigation.navigate('Login');
    } catch (error) {
      console.error(error);
    }
  };

  const renderScene = () => {
    if (index === 0) {
      return selectedChat ? (
        <ChatArea
          chat={selectedChat}
          onBack={() => {
            setSelectedChat(null);
            setShowAppbar(true);
            setShowBottomNav(true);
          }}
          user={currentUser}
        />
      ) : (
        <ChatList
          chats={mockChats}
          onChatSelect={(chat) => {
            setSelectedChat(chat);
            setShowAppbar(false);
            setShowBottomNav(false);
          }}
        />
      );
    } else if (index === 1) {
      return <ContactsScreen />;
    }
  };

  return (
    <TouchableWithoutFeedback onPress={() => {
      setShowDropdown(false);
      Keyboard.dismiss();
    }}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Appbar */}
        {showAppbar && (
          <Appbar.Header style={styles.appBar}>
            {/* SearchBar Component */}
            <SearchBar
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              isSearchFocused={isSearchFocused}
              setIsSearchFocused={setIsSearchFocused}
              colors={colors}
            />

            {/* Avatar and Dropdown Menu */}
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

              <DropdownMenu
                showDropdown={showDropdown}
                setShowDropdown={setShowDropdown}
                currentUser={currentUser}
                setVisibleProfile={setVisibleProfile}
                setVisibleSettings={setVisibleSettings}
                handleLogout={handleLogout}
                colors={colors}
              />
            </View>
          </Appbar.Header>
        )}

        {/* Main Content */}
        <View style={{ flex: 1 }}>{renderScene()}</View>

        {/* Bottom Navigation */}
        {showBottomNav && (
          <BottomNavigation
            navigationState={{ index, routes }}
            onIndexChange={setIndex}
            renderScene={() => null} 
            barStyle={styles.bottomNavBar}
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
                <View style={[styles.iconContainer, focused && styles.activeIconContainer]}>
                  <MaterialCommunityIcons name={iconName} size={28} color={color} />
                </View>
              );
            }}
            style={styles.bottomNav}
          />
        )}

        {/* Profile and Settings Modals */}
        <ProfileModal
          visible={visibleProfile}
          user={currentUser}
          token={token}
          onDismiss={() => setVisibleProfile(false)}
          onUpdateSuccess={setCurrentUser}
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
  appBar: {
    backgroundColor: '#0098f9',
    elevation: 0,
    shadowOpacity: 0,
    zIndex: 1000,
    paddingHorizontal: 10,
  },
  avatarContainer: {
    position: 'relative',
    marginLeft: 10,
  },
  bottomNavBar: {
    borderTopWidth: 0.5,
    borderTopColor: '#e0e0e0',
    elevation: 8,
    shadowColor: '#000',
    backgroundColor:'white'
  },
  iconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeIconContainer: {
    backgroundColor: 'rgba(0, 152, 249, 0.1)',
    borderRadius: 20,
  },
  avatar: {
    marginLeft: 10,
  },
});

export default HomeScreen;