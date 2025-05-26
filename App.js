import * as React from 'react';
import { Provider as PaperProvider, DefaultTheme } from 'react-native-paper';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppRouter from './routes/AppRouter';
const chatTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#0084ff',
    accent: '#ffffff',
    background: '#ffffff',
    surface: '#ffffff',
    text: '#000000',
    placeholder: '#999999',
  },
};

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <PaperProvider theme={chatTheme}>
          <AppRouter />
        </PaperProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}