import { useEffect } from 'react';
import { Alert } from 'react-native';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';

export const useGlobalListeners = () => {
  const { socket } = useSocket();
  const { userToken, refreshUser } = useAuth();

  useEffect(() => {
    if (!socket) return;

    // Listener for Cancellation
    const handleCancellation = (data: any) => {
      console.log("Global Socket: Cancellation Received", data);

      // 1. Show the Alert
      Alert.alert(
        "Match Cancelled",
        `Your match with ${data.opponentName} at ${data.location} on ${data.date} at ${data.time} was cancelled.`,
        [
          { 
            text: "OK", 
            onPress: () => {
              // 2. Refresh Data when they click OK
              if (userToken) refreshUser(userToken);
            } 
          }
        ]
      );
    };

    socket.on("MATCH_CANCELLED", handleCancellation);

    return () => {
      socket.off("MATCH_CANCELLED_BY_OPPONENT", handleCancellation);
    };
  }, [socket, userToken]);

  useEffect(() => {
    if (!socket) return;

    // Listener for Cancellation
    const handleDirectMatchCreation = (data: any) => {
      console.log("Global Socket: Direct Match Created", data);

      // 1. Show the Alert
      Alert.alert(
        "Match Created",
        `Your match with ${data.opponentName} is at ${data.location} on ${data.date} at ${data.time} .`,
        [
          { 
            text: "OK", 
            onPress: () => {
              // 2. Refresh Data when they click OK
              if (userToken) refreshUser(userToken);
            } 
          }
        ]
      );
    };

    socket.on("MATCH_QR_CODE_CREATED", handleDirectMatchCreation);

    return () => {
      socket.off("MATCH_QR_CODE_CREATED", handleDirectMatchCreation);
    };
  }, [socket, userToken]);

};