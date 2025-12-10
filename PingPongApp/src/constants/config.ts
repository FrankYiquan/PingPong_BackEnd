import { Platform } from "react-native";
import Constants from "expo-constants";

const PORT = process.env.EXPO_PUBLIC_API_PORT || "4000";

const resolveLanUrl = () => {
  // Expo exposes the dev server host (e.g. 192.168.x.x:8081) when running locally.
  const manifest2 = (Constants as any).manifest2;
  const hostUri =
    Constants.expoConfig?.hostUri ||
    Constants.manifest?.debuggerHost ||
    manifest2?.extra?.expoGo?.developer?.host;

  if (!hostUri) return null;

  const host = hostUri.split(":")[0];
  return host ? `http://${host}:${PORT}` : null;
};

const LOCALHOST =
  Platform.OS === "android"
    ? `http://10.0.2.2:${PORT}`
    : `http://localhost:${PORT}`;

export const API_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  resolveLanUrl() ||
  LOCALHOST;
