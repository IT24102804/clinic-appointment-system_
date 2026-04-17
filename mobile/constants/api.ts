import Constants from "expo-constants";
import { Platform } from "react-native";

type ExpoConstantsWithHost = {
  expoGoConfig?: {
    debuggerHost?: string;
    hostUri?: string;
  };
  manifest2?: {
    extra?: {
      expoClient?: {
        hostUri?: string;
      };
    };
  };
};

function buildLocalApiUrl(hostOrUrl: string) {
  if (hostOrUrl.startsWith("http://") || hostOrUrl.startsWith("https://")) {
    return hostOrUrl.replace(/\/$/, "");
  }

  const host = hostOrUrl.split(":")[0];
  return `http://${host}:5000`;
}

function resolveApiBaseUrl() {
  const explicitUrl = process.env.EXPO_PUBLIC_API_URL;

  if (explicitUrl) {
    return buildLocalApiUrl(explicitUrl);
  }

  const extraConstants = Constants as typeof Constants & ExpoConstantsWithHost;
  const candidateHosts = [
    extraConstants.expoGoConfig?.debuggerHost,
    extraConstants.expoGoConfig?.hostUri,
    extraConstants.manifest2?.extra?.expoClient?.hostUri,
  ].filter((value): value is string => Boolean(value));

  if (candidateHosts.length > 0) {
    return buildLocalApiUrl(candidateHosts[0]);
  }

  if (Platform.OS === "android") {
    return "http://10.0.2.2:5000";
  }

  return "http://localhost:5000";
}

export const API_BASE_URL = resolveApiBaseUrl();

export function toApiUrl(path: string) {
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
}
