import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { COLORS } from '../constants/theme';

// Screens
import PlayScreen from '../screens/PlayScreen';
import ProfileScreen from '../screens/ProfileScreen';
import AuthModal from '../components/modals/AuthModal';
import { useGlobalListeners } from '../hooks/useGlobalListeners';

const Tab = createBottomTabNavigator();

// --- 1. Custom Tab Bar Component ---
const CustomTabBar = ({ state, descriptors, navigation }: any) => {
  const { userToken } = useAuth();
  const [authVisible, setAuthVisible] = useState(false);

  return (
    <>
      <View style={styles.tabBar}>
        {state.routes.map((route: any, index: number) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            // --- PROTECTED ROUTE LOGIC ---
            if (route.name === 'Profile' && !userToken) {
              setAuthVisible(true); // Show Login if clicking Profile while logged out
            } else if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          // Define Icons based on Route Name
          let icon;
          if (route.name === 'Play') {
            icon = <MaterialCommunityIcons name="table-tennis" size={26} color={isFocused ? COLORS.primary : COLORS.textSec} />;
          } else if (route.name === 'Profile') {
            icon = <FontAwesome5 name="user-alt" size={20} color={isFocused ? COLORS.primary : COLORS.textSec} />;
          }

          return (
            <TouchableOpacity
              key={index}
              onPress={onPress}
              style={styles.tabItem}
            >
              {icon}
              <Text style={[styles.tabText, { color: isFocused ? COLORS.primary : COLORS.textSec }]}>
                {route.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Global Login Modal is controlled here now */}
      <AuthModal 
        visible={authVisible} 
        onClose={() => setAuthVisible(false)}
        onLoginSuccess={() => navigation.navigate('Profile')} // Auto-navigate on success
      />
    </>
  );
};

// --- 2. The Navigator Configuration ---
const AppNavigator = () => {
  useGlobalListeners(); 
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />} // Use our custom design
      screenOptions={{
        headerShown: false, // We use custom headers inside screens
      }}
    >
      <Tab.Screen name="Play" component={PlayScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.tabBar,
    paddingVertical: 10,
    paddingBottom: Platform.OS === 'ios' ? 25 : 15,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    elevation: 0
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  tabText: {
    fontSize: 10,
    marginTop: 4,
    fontWeight: '600'
  },
});

export default AppNavigator;