import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Image, Animated, Easing, Platform, Modal, TouchableWithoutFeedback, Alert } from 'react-native';
import { Avatar, Text } from 'react-native-paper';
import { FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import { Video } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';

const MessageItem = ({ msg, user, userId, onReply, onForward, onRecall, onFocus, viewRefs, playAudio, focusedMessageId, onSendEmoji, onRevokeEmoji }) => {
  const isCurrentUser = String(msg.sender._id) === String(userId);
  const textColor = isCurrentUser ? styles.messageTextMe : styles.messageTextOther;
  const iconColor = isCurrentUser ? 'white' : '#444';
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;
  const [audioProgress, setAudioProgress] = useState(0);
  const [showMenu, setShowMenu] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const EMOJI_TYPES = ['👍', '❤️', '😂', '😢', '😡'];

  useEffect(() => {
    if (focusedMessageId === msg._id) {
      highlightMessage();
    }
  }, [focusedMessageId]);

  const highlightMessage = () => {
    scaleAnim.setValue(1);
    opacityAnim.setValue(1);
    Animated.sequence([
      Animated.parallel([
        Animated.timing(scaleAnim, { toValue: 1.2, duration: 300, useNativeDriver: true, easing: Easing.out(Easing.ease) }),
        Animated.timing(opacityAnim, { toValue: 0.8, duration: 150, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(scaleAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]),
    ]).start();
  };

  const shadowStyle = Platform.select({
    ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 3 },
    android: { elevation: 2 },
  });

  const downloadFile = async (file) => {
    try {
      // Yêu cầu quyền lưu trữ trên Android
      if (Platform.OS === 'android') {
        const { status } = await MediaLibrary.requestPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(
            'Cần quyền truy cập',
            'Ứng dụng cần quyền truy cập bộ nhớ để tải file. Vui lòng cấp quyền trong cài đặt.',
            [
              { text: 'Hủy', style: 'cancel' },
              { text: 'Mở cài đặt', onPress: () => Linking.openSettings() },
            ]
          );
          return;
        }
      }

      // Tạo đường dẫn tạm cho file
      const fileUri = `${FileSystem.cacheDirectory}${file.name}`;
      // Tải file từ URL
      const { uri } = await FileSystem.downloadAsync(file.url, fileUri);
      // Mở file hoặc lưu vào thiết bị
      await Sharing.shareAsync(uri, { mimeType: file.mimeType, dialogTitle: `Tải ${file.name}` });
    } catch (error) {
      console.error('Lỗi tải file:', error);
      Alert.alert('Lỗi', `Không thể tải file: ${error.message}`);
    }
  };

const renderMedia = () => {
  if (!msg.fileMeta || msg.fileMeta.length === 0) return null;
  console.log('msg.content:', msg.content); // Log để kiểm tra

  return (
    <View style={styles.mediaContainer}>
      {msg.fileMeta.map((file, index) => (
        <View key={index} style={styles.mediaItem}>
          {file.mimeType.startsWith('image') ? (
            <TouchableOpacity onPress={() => onFocus(file.url, true)}>
              <Image source={{ uri: file.url }} style={styles.messageImage} resizeMode="cover" />
            </TouchableOpacity>
          ) : file.mimeType.startsWith('audio') ? (
            <TouchableOpacity
              style={styles.audioContainer}
              onPress={() => {
                // Chọn URI dựa trên người gửi
                const audioUri = !isCurrentUser && msg.content && msg.content.startsWith('http') ? msg.content : file.url;
                if (!audioUri) {
                  Alert.alert('Lỗi', 'Không tìm thấy URI âm thanh');
                  return;
                }
                playAudio(audioUri);
                setAudioProgress(0);
                const interval = setInterval(() => {
                  setAudioProgress(prev => {
                    if (prev >= 1) {
                      clearInterval(interval);
                      return 1;
                    }
                    return prev + 0.02;
                  });
                }, 100);
              }}
            >
              <FontAwesome5 name="play-circle" size={24} color={iconColor} />
              <Text style={textColor}>{file.duration ? `${file.duration}s` : 'Audio message'}</Text>
              <View style={styles.progressBarBackground}>
                <Animated.View style={[styles.progressBarFill, { width: `${audioProgress * 100}%`, backgroundColor: iconColor }]} />
              </View>
            </TouchableOpacity>
          ) : file.mimeType.startsWith('video') ? (
            <Video
              source={{ uri: file.url }}
              style={styles.messageVideo}
              useNativeControls
              resizeMode="contain"
              onError={(error) => {
                console.error('Lỗi phát video:', error);
                Alert.alert('Lỗi', 'Không thể phát video');
              }}
            />
          ) : (
            <TouchableOpacity style={styles.fileContainer} onPress={() => downloadFile(file)}>
              <FontAwesome5 name="file-alt" size={24} color={iconColor} />
              <View style={styles.fileInfo}>
                <Text style={textColor}>{file.name || 'Unknown file'}</Text>
                <Text style={textColor}>{file.size ? `${(file.size / 1024).toFixed(2)} KB` : 'Unknown size'}</Text>
              </View>
              <FontAwesome5 name="download" size={20} color={iconColor} style={styles.downloadIcon} />
            </TouchableOpacity>
          )}
        </View>
      ))}
    </View>
  );
};
  const renderMessageContent = () => {
    if (msg.isRevoke) {
      return <Text style={[textColor, { fontStyle: 'italic' }]}>Tin nhắn đã bị thu hồi</Text>;
    }
    if (msg.fileMeta && msg.fileMeta.length > 0) {
      return renderMedia();
    }
    return <Text style={textColor}>{msg.content || 'No content'}</Text>;
  };

  const renderReplyToMessage = () => {
    if (msg.isRevoke || !msg.replyTo) return null;

    console.log('msg.replyTo:', msg.replyTo); // Log để kiểm tra dữ liệu

    const isCurrentUserReply = String(msg.replyTo.sender?._id || msg.replyTo.sender) === String(userId);
    const senderName = isCurrentUserReply
      ? 'You'
      : typeof msg.replyTo.sender?.fullName === 'string'
      ? msg.replyTo.sender.fullName.split(' ').pop() || 'Unknown'
      : 'Unknown';

    let replyContent = 'Unknown';
    if (msg.replyTo.type === 'text' && typeof msg.replyTo.content === 'string') {
      replyContent = msg.replyTo.content;
    } else if (msg.replyTo.type === 'image') {
      replyContent = 'Image';
    } else if (msg.replyTo.type === 'audio') {
      replyContent = 'Audio message';
    } else if (msg.replyTo.type === 'file') {
      replyContent = 'File attachment';
    } else if (msg.replyTo.type === 'video') {
      replyContent = 'Video';
    }

    return (
      <TouchableOpacity
        style={[styles.replyToContainer, isCurrentUser ? styles.replyToContainerMe : styles.replyToContainerOther]}
        onPress={() => onFocus(msg.replyTo._id, false)}
      >
        <View style={[styles.replyIndicatorSmall, { backgroundColor: isCurrentUser ? 'white' : '#0e76a8' }]} />
        <View>
          <Text style={[styles.replySenderTextSmall, { color: isCurrentUser ? 'white' : '#0e76a8' }]}>{senderName}</Text>
          <Text
            style={[styles.replyContentTextSmall, { color: isCurrentUser ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)' }]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {replyContent}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmojis = () => {
    if (!msg.emoji || Object.keys(msg.emoji).length === 0) return null;

    const allEmojis = Object.entries(msg.emoji)
      .filter(([, users]) => users && users.length > 0)
      .map(([emojiType, users]) => {
        const count = users.length;
        const hasUserReacted = users.includes(userId);
        return { emojiType, count, hasUserReacted };
      });

    if (allEmojis.length === 0) return null;

    return (
      <View style={[styles.emojiReactionsContainer, isCurrentUser ? styles.emojiReactionsContainerMe : styles.emojiReactionsContainerOther]}>
        {allEmojis.map(({ emojiType, count, hasUserReacted }, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.emojiReactionBubble, hasUserReacted && styles.myReactionBubble]}
            onPress={() => handleEmojiPress(emojiType)}
          >
            <Text style={styles.emojiText}>{emojiType || '😊'}</Text>
            {count > 1 && <Text style={styles.emojiCount}>{count}</Text>}
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const handleLongPress = () => {
    if (!msg.isRevoke) {
      setShowMenu(true);
    }
  };

  const handleMenuOption = (option) => {
    setShowMenu(false);
    if (option === 'reply') {
      onReply(msg);
    } else if (option === 'forward') {
      onForward(msg);
    } else if (option === 'recall' && isCurrentUser && !msg.isRevoke) {
      onRecall(msg._id);
    } else if (option === 'react') {
      setShowEmojiPicker(true);
    }
  };

  const handleEmojiPress = (emojiType) => {
    setShowEmojiPicker(false);
    if (msg.emoji && msg.emoji[emojiType] && msg.emoji[emojiType].includes(userId)) {
      console.log(emojiType);
      onRevokeEmoji(msg._id, emojiType);
    } else {
      onSendEmoji(msg._id, emojiType);
    }
  };

  return (
    <View
      ref={(ref) => (viewRefs.current[msg._id] = ref)}
      collapsable={false}
      style={[styles.messageContainer, isCurrentUser ? styles.messageContainerMe : styles.messageContainerOther]}
    >
      {!isCurrentUser && (
        <Avatar.Image size={32} source={{ uri: msg.sender?.avatar || 'https://i.pravatar.cc/150' }} style={styles.messageAvatar} />
      )}
      <Animated.View
        style={[
          styles.messageBubble,
          isCurrentUser ? styles.messageMe : styles.messageOther,
          shadowStyle,
          { transform: [{ scale: scaleAnim }], opacity: opacityAnim },
        ]}
      >
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => msg.replyTo && !msg.isRevoke && onFocus(msg.replyTo._id, false)}
          onLongPress={handleLongPress}
          delayLongPress={200}
        >
          {renderReplyToMessage()}
          {renderMessageContent()}
          <Text style={[styles.timestamp, { color: isCurrentUser ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)' }]}>{msg.timestamp}</Text>
        </TouchableOpacity>
        {renderEmojis()}
      </Animated.View>
      {isCurrentUser && (
        <Avatar.Image size={32} source={{ uri: user?.avatar || 'https://i.pravatar.cc/150' }} style={styles.messageAvatar} />
      )}

      <Modal
        visible={showMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMenu(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowMenu(false)}>
          <View style={styles.modalOverlay}>
            <View style={[styles.menuContainer, isCurrentUser ? styles.menuRight : styles.menuLeft]}>
              <TouchableOpacity style={styles.menuItem} onPress={() => handleMenuOption('react')}>
                <FontAwesome5 name="smile" size={24} color="#FFD700" />
                <Text style={styles.menuText}>Thả cảm xúc</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.menuItem} onPress={() => handleMenuOption('reply')}>
                <MaterialIcons name="reply" size={24} color="#007AFF" />
                <Text style={styles.menuText}>Trả lời</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.menuItem} onPress={() => handleMenuOption('forward')}>
                <MaterialIcons name="forward" size={24} color="#007AFF" />
                <Text style={styles.menuText}>Chuyển tiếp</Text>
              </TouchableOpacity>
              {isCurrentUser && !msg.isRevoke && (
                <TouchableOpacity style={styles.menuItem} onPress={() => handleMenuOption('recall')}>
                  <MaterialIcons name="delete" size={24} color="#FF3B30" />
                  <Text style={styles.menuText}>Thu hồi</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <Modal
        visible={showEmojiPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowEmojiPicker(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowEmojiPicker(false)}>
          <View style={styles.modalOverlay}>
            <View style={[styles.emojiPickerContainer, isCurrentUser ? styles.menuRight : styles.menuLeft]}>
              {EMOJI_TYPES.map((emoji) => (
                <TouchableOpacity key={emoji} style={styles.emojiPickerItem} onPress={() => handleEmojiPress(emoji)}>
                  <Text style={styles.emojiPickerText}>{emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  messageContainer: { flexDirection: 'row', alignItems: 'flex-end', marginVertical: 8 },
  messageContainerMe: { justifyContent: 'flex-end' },
  messageContainerOther: { justifyContent: 'flex-start' },
  messageAvatar: { marginHorizontal: 8 },
  messageBubble: { padding: 12, borderRadius: 16, maxWidth: '75%' },
  messageMe: { backgroundColor: '#007AFF', borderBottomRightRadius: 2 },
  messageOther: { backgroundColor: '#E5E5EA', borderBottomLeftRadius: 2 },
  messageTextMe: { color: 'white', fontSize: 16 },
  messageTextOther: { color: 'black', fontSize: 16 },
  timestamp: { fontSize: 11, alignSelf: 'flex-end', marginTop: 4 },
  messageImage: { width: 200, height: 150, borderRadius: 8 },
  messageVideo: { width: 200, height: 150, borderRadius: 8 },
  audioContainer: { flexDirection: 'column', marginTop: 8, width: 100 },
  progressBarBackground: { height: 5, backgroundColor: '#ddd', borderRadius: 3, overflow: 'hidden', marginTop: 4 },
  progressBarFill: { height: '100%' },
  fileContainer: { flexDirection: 'row', alignItems: 'center', padding: 8 },
  fileInfo: { marginLeft: 10, flex: 1 },
  downloadIcon: { marginLeft: 10 },
  replyToContainer: { padding: 8, borderRadius: 8, marginBottom: 5, flexDirection: 'row', alignItems: 'center' },
  replyToContainerMe: { backgroundColor: 'rgba(255,255,255,0.2)' },
  replyToContainerOther: { backgroundColor: 'rgba(0,122,255,0.1)' },
  replyIndicatorSmall: { width: 3, height: 30, borderRadius: 2, marginRight: 8 },
  replySenderTextSmall: { fontWeight: '600', fontSize: 12 },
  replyContentTextSmall: { fontSize: 12, marginTop: 2 },
  mediaContainer: { marginTop: 5 },
  mediaItem: { marginBottom: 5 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' },
  menuContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 5,
  },
  menuRight: { marginLeft: 50 },
  menuLeft: { marginRight: 50 },
  menuItem: { alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5 },
  menuText: { fontSize: 10, color: '#333' },
  emojiReactionsContainer: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: -22,
  },
  emojiReactionsContainerMe: {
    alignSelf: 'flex-end',
  },
  emojiReactionsContainerOther: {
    alignSelf: 'flex-start',
  },
  emojiReactionBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e0e0e0',
    borderRadius: 15,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 5,
    marginBottom: 5,
  },
  myReactionBubble: {
    backgroundColor: '#fff',
  },
  emojiText: {
    fontSize: 14,
    marginRight: 2,
  },
  emojiCount: {
    fontSize: 12,
    color: '#000',
  },
  emojiPickerContainer: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  emojiPickerItem: {
    padding: 10,
  },
  emojiPickerText: {
    fontSize: 20,
  },
});

export default MessageItem;