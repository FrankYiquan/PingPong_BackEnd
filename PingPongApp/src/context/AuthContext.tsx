import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import { Alert } from 'react-native';
import { API_URL } from '../constants/config';
import { DEFAULT_USER, UserProfile } from '../constants/data';

interface AuthContextType {
  userToken: string | null;
  isLoading: boolean;
  userData: UserProfile; 
  login: (email: string, password: string) => Promise<string>;
  register: (username: string, email: string, password: string) => Promise<string>;
  logout: () => Promise<void>;
  refreshUser: (token: string) => Promise<void>; 
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [userToken, setUserToken] = useState<string | null>(null);
  const [userData, setUserData] = useState<UserProfile>(DEFAULT_USER);

  // Helper to fetch user data
  const refreshUser = async (token: string) => {
    try {
      const res = await fetch(`${API_URL}/user/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setUserData(data);
      } else {
        console.log("Failed to refresh user:", data.error);
      }
    } catch (e) {
      console.log("Fetch profile error", e);
    }
  };

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/user/login`, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }
      
      // Store token
      await SecureStore.setItemAsync('userToken', data.token);
      setUserToken(data.token);
      
      await refreshUser(data.token);

      console.log("Logged in successfully");

      return data.token as string;

    } catch (error: any) {
      Alert.alert('Login Error', error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (username: string, email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/user/create`, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Signup failed');
      }

      const token = await login(email, password);
      return token as string;

    } catch (error: any) {
      Alert.alert('Signup Error', error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    await SecureStore.deleteItemAsync('userToken');
    setUserToken(null);
    setUserData(DEFAULT_USER); // FIX: Reset data on logout
    setIsLoading(false);
  };

  // Check if user is already logged in when app starts
  // (Combined into one useEffect)
  useEffect(() => {
    const loadToken = async () => {
      try {
        const token = await SecureStore.getItemAsync('userToken');
        if (token) {
          setUserToken(token);
          await refreshUser(token);
        }
      } catch (e) {
        console.error("Failed to load token", e);
      }
    };
    loadToken();
  }, []);
  
  return (
    <AuthContext.Provider value={{ 
      login, 
      register, 
      logout, 
      userToken, 
      isLoading,
      userData,    
      refreshUser  
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};