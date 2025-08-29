import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import base64 from "base-64"; // npm install base-64

WebBrowser.maybeCompleteAuthSession();

const CLIENT_ID = "b62141322e27420c965c038797c4ae61";
const CLIENT_SECRET = "959cfd59e1cc44a08b8328ff36740345";
const SCOPES = ["user-read-email", "user-read-private", "user-top-read"];
const TOKEN_STORAGE_KEY = "spotifyToken";
const REFRESH_TOKEN_STORAGE_KEY = "spotifyRefreshToken";

const discovery = {
  authorizationEndpoint: "https://accounts.spotify.com/authorize",
  tokenEndpoint: "https://accounts.spotify.com/api/token",
};

export default function useSpotifyAuth() {
  const [token, setToken] = useState(null);
  const [refreshToken, setRefreshToken] = useState(null);

  const redirectUri = AuthSession.makeRedirectUri({ useProxy: true });

  const [request, , promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: CLIENT_ID,
      scopes: SCOPES,
      redirectUri,
      responseType: AuthSession.ResponseType.Code,
      usePKCE: true,
      extraParams: { show_dialog: "true" },
    },
    discovery
  );

  // Load tokens from storage
  useEffect(() => {
    const loadTokens = async () => {
      const storedToken = await AsyncStorage.getItem(TOKEN_STORAGE_KEY);
      const storedRefresh = await AsyncStorage.getItem(REFRESH_TOKEN_STORAGE_KEY);
      if (storedToken) setToken(storedToken);
      if (storedRefresh) setRefreshToken(storedRefresh);
    };
    loadTokens();
  }, []);

  // Exchange authorization code for access & refresh tokens
  const exchangeCodeForToken = async (code) => {
    if (!request?.codeVerifier) return null;

    const body = new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
      client_id: CLIENT_ID,
      code_verifier: request.codeVerifier,
    }).toString();

    try {
      const res = await fetch(discovery.tokenEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
      });
      const data = await res.json();

      if (data.access_token) {
        setToken(data.access_token);
        setRefreshToken(data.refresh_token);
        await AsyncStorage.setItem(TOKEN_STORAGE_KEY, data.access_token);
        await AsyncStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, data.refresh_token);
        return { accessToken: data.access_token, refreshToken: data.refresh_token };
      } else {
        console.error("[useSpotifyAuth] No access token returned:", data);
        return null;
      }
    } catch (err) {
      console.error("[useSpotifyAuth] Token exchange failed:", err);
      return null;
    }
  };

  // Refresh token using refresh_token
  const refreshAccessToken = async (rToken = refreshToken) => {
    if (!rToken) return null;
    try {
      const basicAuth = base64.encode(`${CLIENT_ID}:${CLIENT_SECRET}`);
      const body = new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: rToken,
      }).toString();

      const res = await fetch(discovery.tokenEndpoint, {
        method: "POST",
        headers: {
          Authorization: `Basic ${basicAuth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body,
      });

      const data = await res.json();

      if (data.access_token) {
        setToken(data.access_token);
        await AsyncStorage.setItem(TOKEN_STORAGE_KEY, data.access_token);
        console.log("[useSpotifyAuth] Token refreshed successfully");
        return data.access_token;
      }
      console.error("[useSpotifyAuth] Failed to refresh token:", data);
    } catch (err) {
      console.error("[useSpotifyAuth] Refresh token failed:", err);
    }
    return null;
  };

  // Logout
  const logout = async () => {
    setToken(null);
    setRefreshToken(null);
    await AsyncStorage.removeItem(TOKEN_STORAGE_KEY);
    await AsyncStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
  };

  // Force reset (without clearing storage)
  const resetAuth = () => setToken(null);

  // Login: only exchange code here
  const login = async () => {
    if (!request) return null;

    const result = await promptAsync({ useProxy: true, showInRecents: true });
    if (result?.type === "success" && result.params.code) {
      return await exchangeCodeForToken(result.params.code);
    }

    return null;
  };

  return {
    token,
    refreshToken,
    login,
    logout,
    resetAuth,
    refreshAccessToken,
  };
}
