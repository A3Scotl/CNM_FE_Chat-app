import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, FlatList, Alert } from 'react-native';
import { Avatar, IconButton, ActivityIndicator } from 'react-native-paper';
import { Swipeable } from 'react-native-gesture-handler';
import { hideConversation } from '../../apis/message.api';
import ChatListItem from './ChatListItem';

const ChatList = ({ chats, onChatSelect, currentUserId, onDeleteConversation }) => {
  const [isDeleting, setIsDeleting] = useState(null);

  const handleDeleteConversation = async (conversationId) => {
    if (!hideConversation || typeof hideConversation !== 'function') {
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
              await hideConversation(conversationId);
              if (onDeleteConversation) {
                onDeleteConversation(conversationId);
              }
              Alert.alert('Thành công', 'Đã xóa lịch sử cuộc trò chuyện');
            } catch (error) {
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
      <ChatListItem
        item={item}
        onPress={onChatSelect}
        userId={currentUserId}
      />
      {isDeleting === item._id && (
        <View style={styles.deleteOverlay}>
          <ActivityIndicator size="small" color="#ff4444" />
        </View>
      )}
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
  deleteOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1, 
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