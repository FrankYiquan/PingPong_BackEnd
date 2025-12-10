// src/hooks/useStartMatchmaking.ts
import { useState } from 'react';
import { Alert } from 'react-native';
import { API_URL } from '../constants/config';
import { useAuth } from '../context/AuthContext';

const COURT_MAP: Record<number, string> = {
  1: "Gosman",
  2: "Shapiro", 
  3: "IBS" 
};

export const useStartMatchmaking = () => {
  const { userToken } = useAuth();
  const [isStarting, setIsStarting] = useState(false);

  const startSearch = async (courtId: number, startTime: Date, endTime: Date): Promise<string | null> => {
    setIsStarting(true);
    try {
      const response = await fetch(`${API_URL}/match/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`
        },
        body: JSON.stringify({
          location: COURT_MAP[courtId],
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          playerCount: 2
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to start matchmaking");
      }

      console.log("Match Request Started:", data.matchRequestId);
      return data.matchRequestId; // Return ID on success

    } catch (error: any) {
      Alert.alert("Error", error.message);
      return null;
    } finally {
      setIsStarting(false);
    }
  };

  return { startSearch, isStarting };
};