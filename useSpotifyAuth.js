import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

WebBrowser.maybeCompleteAuthSession();

const CLIENT_ID = "b62141322e27420c965c038797c4ae61";
const SCOPES = ["user-read-email", "user-read-private", "user-top-read"];
const TOKEN_STORAGE_KEY = "spotifyToken";

const discovery = {
  authorizationEndpoint: "https://accounts.spotify.com/authorize",
  tokenEndpoint: "https://accounts.spotify.com/api/token",
};

export default function useSpotifyAuth() {
  const [token, setToken] = useState(null);

  // 👇 Stable redirect URI (works across all networks/devices)
  const redirectUri = AuthSession.makeRedirectUri({
    useProxy: true,
  });

  // Request setup
  const [request, response, promptAsync] = AuthSession.useAuthRequest(
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

  // Load token from storage on mount
  useEffect(() => {
    const loadToken = async () => {
      const storedToken = await AsyncStorage.getItem(TOKEN_STORAGE_KEY);
      if (storedToken) {
        setToken(storedToken);
      }
    };
    loadToken();
  }, []);

  // Handle auth response
  useEffect(() => {
    if (response?.type === "success" && response.params.code) {
      exchangeCodeForToken(response.params.code);
    }
  }, [response]);

  // Exchange authorization code for access token
  const exchangeCodeForToken = async (code) => {
    if (!request?.codeVerifier) return;

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
        await AsyncStorage.setItem(TOKEN_STORAGE_KEY, data.access_token);
      } else {
        console.error("[useSpotifyAuth] No access token returned:", data);
      }
    } catch (err) {
      console.error("[useSpotifyAuth] Token exchange failed:", err);
    }
  };

  // Clear token
  const logout = async () => {
    setToken(null);
    await AsyncStorage.removeItem(TOKEN_STORAGE_KEY);
  };

  // Force reset (without clearing storage)
  const resetAuth = () => {
    setToken(null);
  };

  return {
    token,
    login: () =>
      request &&
      promptAsync({
        useProxy: true,
        showInRecents: true,
      }),
    logout,
    resetAuth,
  };
}
