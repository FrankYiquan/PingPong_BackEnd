import React from 'react';
import { StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { AuthProvider } from './src/context/AuthContext';
import { SocketProvider } from './src/context/SocketContext';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <NavigationContainer>
          <StatusBar barStyle="dark-content" />
          <AppNavigator />
        </NavigationContainer>
      </SocketProvider>
    </AuthProvider>
  );
}