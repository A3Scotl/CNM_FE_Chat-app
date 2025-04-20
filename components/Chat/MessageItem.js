import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Image, Animated, Easing, Platform, Modal, TouchableWithoutFeedback } from 'react-native';
import { Avatar, Text } from 'react-native-paper';
import { FontAwesome5, MaterialIcons } from '@expo/vector-icons';

const MessageItem = ({ msg, user, userId, onReply, onForward, onRecall, onFocus, viewRefs, playAudio, focusedMessageId }) => {
  const isCurrentUser = String(msg.sender._id) === String(userId);
  const textColor = isCurrentUser ? styles.messageTextMe : styles.messageTextOther;
  const iconColor = isCurrentUser ? 'white' : '#444';
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;
  const [audioProgress, setAudioProgress] = useState(0);
  const [showMenu, setShowMenu] = useState(false);

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

  const renderMedia = () => {
    if (!msg.fileMeta || msg.fileMeta.length === 0) return null;

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
                  playAudio(file.url);
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
            ) : (
              <View style={styles.fileContainer}>
                <FontAwesome5 name="file-alt" size={24} color={iconColor} />
                <View style={styles.fileInfo}>
                  <Text style={textColor}>{file.name}</Text>
                  <Text style={textColor}>{(file.size / 1024).toFixed(2)} KB</Text>
                </View>
              </View>
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
    return <Text style={textColor}>{msg.content}</Text>;
  };

  const renderReplyToMessage = () => {
    // Nếu tin nhắn đã bị thu hồi, không hiển thị reply
    if (msg.isRevoke || !msg.replyTo) return null;

    const isCurrentUserReply = String(msg.replyTo.sender?._id || msg.replyTo.sender) === String(userId);
    const senderName = isCurrentUserReply ? 'You' : msg.sender.fullName.split(' ').pop();

    let replyContent = '';
    if (msg.replyTo.type === 'text') replyContent = msg.replyTo.content;
    else if (msg.replyTo.type === 'image') replyContent = 'Image';
    else if (msg.replyTo.type === 'audio') replyContent = 'Audio message';
    else if (msg.replyTo.type === 'file') replyContent = 'File attachment';

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

  const handleLongPress = () => {
    // Không hiển thị menu nếu tin nhắn đã bị thu hồi
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
          onPress={() => msg.replyTo && !msg.isRevoke && onFocus(msg.replyTo._id, false)} // Chỉ cho phép nhấn vào reply nếu tin nhắn chưa bị thu hồi
          onLongPress={handleLongPress}
          delayLongPress={200}
        >
          {renderReplyToMessage()}
          {renderMessageContent()}
          <Text style={[styles.timestamp, { color: isCurrentUser ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)' }]}>{msg.timestamp}</Text>
        </TouchableOpacity>
      </Animated.View>
      {isCurrentUser && (
        <Avatar.Image size={32} source={{ uri: user?.avatar || 'https://i.pravatar.cc/150' }} style={styles.messageAvatar} />
      )}

      {/* Menu when long press */}
      <Modal
        visible={showMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMenu(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowMenu(false)}>
          <View style={styles.modalOverlay}>
            <View style={[styles.menuContainer, isCurrentUser ? styles.menuRight : styles.menuLeft]}>
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
  audioContainer: { flexDirection: 'column', marginTop: 8, width: 100 },
  progressBarBackground: { height: 5, backgroundColor: '#ddd', borderRadius: 3, overflow: 'hidden', marginTop: 4 },
  progressBarFill: { height: '100%' },
  fileContainer: { flexDirection: 'row', alignItems: 'center', padding: 8 },
  fileInfo: { marginLeft: 10, flex: 1 },
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
  menuText: { fontSize: 12, marginTop: 4, color: '#333' },
});

export default MessageItem;