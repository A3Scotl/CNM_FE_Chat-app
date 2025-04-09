import React from 'react';
import { Portal, Dialog, Button, Paragraph } from 'react-native-paper';

export default function ErrorDialog({ visible, message, onDismiss }) {
  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss}>
        <Dialog.Title>Lỗi</Dialog.Title>
        <Dialog.Content>
          <Paragraph>{message}</Paragraph>
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={onDismiss}>Đóng</Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}
