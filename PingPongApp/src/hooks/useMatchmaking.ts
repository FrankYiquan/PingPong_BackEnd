
import { useState, useEffect, useRef } from 'react';
import { Vibration, Alert, Animated } from 'react-native';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../constants/config';
import { RedisMatchRequest } from '../constants/data';

export const useMatchmaking = (
  matchRequestId: string | null, 
  onMatchConfirmedCallback: (data: any) => void,
  onCloseCallback: () => void
) => {
  const { socket } = useSocket();
  const { userToken } = useAuth();

  const [status, setStatus] = useState<'searching' | 'found' | 'accepted' | 'waiting'>('searching');
  const [opponent, setOpponent] = useState<RedisMatchRequest | null>(null);

  // Animation values
  const pulse = useRef(new Animated.Value(1)).current;
  const flyIn = useRef(new Animated.Value(50)).current;
  const fade = useRef(new Animated.Value(0)).current;

  // --- 1. NEW: RESET STATE ON NEW REQUEST ---
  // This ensures every time get a new ID, the screen starts fresh.
  useEffect(() => {
    if (matchRequestId) {
      setStatus('searching');
      setOpponent(null);
      
      // Reset Animations
      flyIn.setValue(50);
      fade.setValue(0);
      // Optional: Stop pulse if needed, but the loop in UI handles that
    }
  }, [matchRequestId]); 

  // --- 2. SOCKET LISTENERS (Existing logic) ---
  useEffect(() => {
    if (!socket || !matchRequestId) return;

    const handleMatchFound = (data: any) => {
      console.log("Hook: MATCH_FOUND", data);
      setOpponent(data.opponent);
      setStatus('found');
      Vibration.vibrate();
      
      Animated.parallel([
        Animated.spring(flyIn, { toValue: 0, useNativeDriver: true }),
        Animated.timing(fade, { toValue: 1, duration: 500, useNativeDriver: true })
      ]).start();
    };

    const handleMatchConfirmed = (data: any) => {
      console.log("Hook: MATCH_CONFIRMED", data);
      onMatchConfirmedCallback(data);
    };

    const handleMatchDeclined = (data: any) => {
      console.log("Hook: MATCH_DECLINED", data);
      //Alert.alert("Declined", "Opponent declined. Searching again...");
      
      // Reset State
      setStatus('searching');
      setOpponent(null);
      flyIn.setValue(50);
      fade.setValue(0);
    };

    socket.on("MATCH_FOUND", handleMatchFound);
    socket.on("MATCH_CONFIRMED", handleMatchConfirmed);
    socket.on("MATCH_DECLINED", handleMatchDeclined);

    return () => {
      socket.off("MATCH_FOUND", handleMatchFound);
      socket.off("MATCH_CONFIRMED", handleMatchConfirmed);
      socket.off("MATCH_DECLINED", handleMatchDeclined);
    };
  }, [socket, matchRequestId]);

  // --- API ACTIONS (Existing logic) ---
  const acceptMatch = async () => {
    if (!matchRequestId) return;
    setStatus('accepted'); 
    try {
      await fetch(`${API_URL}/match/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userToken}` },
        body: JSON.stringify({ matchRequestId })
      });
    } catch (e) {
      console.error("Accept failed", e);
      setStatus('found');
    }
  };

  const declineMatch = async () => {
    if (!matchRequestId) return;
    setStatus('searching');
    setOpponent(null);
    flyIn.setValue(50);
    fade.setValue(0);

    try {
      await fetch(`${API_URL}/match/decline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userToken}` },
        body: JSON.stringify({ matchRequestId })
      });
    } catch (e) {
      console.error("Decline failed", e);
    }
  };

  const cancelSearch = async () => {
    // Optimistic close
    onCloseCallback();
    
    if (matchRequestId) {
      try {
        fetch(`${API_URL}/match/cancel`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userToken}` },
          body: JSON.stringify({ matchRequestId })
        });
      } catch (e) {
        console.log("Cancel failed", e);
      }
    }
  };

//   console.log("useMatchmaking State:", { status, opponent });

  return {
    status,
    opponent,
    pulse,
    flyIn,
    fade,
    acceptMatch,
    declineMatch,
    cancelSearch
  };
};