import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, FlatList, Alert } from 'react-native';
import { Avatar, IconButton, ActivityIndicator } from 'react-native-paper';
import { Swipeable } from 'react-native-gesture-handler';
import { hideConversation } from '../../apis/message.api';

const ChatList = ({ chats, onChatSelect, currentUserId, onUpdateConversation, onDeleteConversation }) => {
  const [isDeleting, setIsDeleting] = useState(null);

  const handleDeleteConversation = async (conversationId) => {
    if (!hideConversation || typeof hideConversation !== 'function') {
      console.error('❌ hideConversation is not a function or undefined');
      Alert.alert('Lỗi', 'Chức năng xóa hội thoại không khả dụng. Vui lòng thử lại sau.');
      return;
    }

    Alert.alert(
      'Xóa lịch sử trò chuyện',
      'Bạn có chắc muốn xóa lịch sử cuộc trò chuyện này?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(conversationId);
            try {
              console.log('Calling hideConversation with ID:', conversationId);
              await hideConversation(conversationId); // Call the API to hide the conversation
              // Now, call onDeleteConversation to remove it from the list immediately
              if (onDeleteConversation) {
                onDeleteConversation(conversationId);
              }
              Alert.alert('Thành công', 'Đã xóa lịch sử cuộc trò chuyện');
            } catch (error) {
              console.error('Error hiding conversation:', error);
              Alert.alert('Lỗi', error?.response?.data?.message || 'Không thể xóa lịch sử cuộc trò chuyện');
            } finally {
              setIsDeleting(null);
            }
          },
        },
      ]
    );
  };

  const renderRightActions = (conversationId) => (
    <View style={styles.deleteAction}>
      <IconButton
        icon="delete"
        size={24}
        iconColor="#fff"
        onPress={() => handleDeleteConversation(conversationId)}
        disabled={isDeleting !== null}
      />
    </View>
  );

  const renderItem = ({ item }) => (
    <Swipeable
      renderRightActions={() => renderRightActions(item._id)}
      overshootRight={false}
      friction={2}
    >
      <TouchableOpacity
        style={styles.chatItem}
        onPress={() => onChatSelect(item)}
        activeOpacity={0.7}
        disabled={isDeleting !== null}
      >
        <Avatar.Image
          size={50}
          source={{ uri: item.user.avatar || 'https://i.pravatar.cc/150' }}
          style={styles.avatar}
        />
        <View style={styles.chatInfo}>
          <Text style={styles.chatName}>{item.user.fullName}</Text>
          <Text style={styles.lastMessage} numberOfLines={1}>
            {item.lastMessage
              ? item.lastMessage.isRevoke
                ? 'Tin nhắn đã thu hồi'
                : item.lastMessage.content
              : 'Chưa có tin nhắn'}
          </Text>
        </View>
        {item.unreadCount > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadCount}>{item.unreadCount}</Text>
          </View>
        )}
        {isDeleting === item._id && (
          <View style={styles.deleteButtonContainer}>
            <ActivityIndicator size="small" color="#ff4444" />
          </View>
        )}
      </TouchableOpacity>
    </Swipeable>
  );

  return (
    <FlatList
      data={chats}
      renderItem={renderItem}
      keyExtractor={(item) => item._id}
      contentContainerStyle={styles.list}
    />
  );
};

const styles = StyleSheet.create({
  list: {
    flexGrow: 1,
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
  },
  avatar: {
    marginRight: 10,
  },
  chatInfo: {
    flex: 1,
  },
  chatName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  lastMessage: {
    fontSize: 14,
    color: '#888',
  },
  unreadBadge: {
    backgroundColor: '#0098f9',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  unreadCount: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  deleteButtonContainer: {
    marginLeft: 10,
    justifyContent: 'center',
  },
  deleteAction: {
    backgroundColor: '#ff4444',
    justifyContent: 'center',
    alignItems: 'center',
    width: 70,
    height: '100%',
  },
});

export default ChatList;