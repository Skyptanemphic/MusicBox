// useSpotifyAuth.js
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { useState, useEffect } from 'react';

WebBrowser.maybeCompleteAuthSession();

const CLIENT_ID = 'b62141322e27420c965c038797c4ae61';
const SCOPES = ['user-read-email', 'user-read-private', 'user-top-read'];

const discovery = {
  authorizationEndpoint: 'https://accounts.spotify.com/authorize',
  tokenEndpoint: 'https://accounts.spotify.com/api/token',
};

export default function useSpotifyAuth() {
  const [token, setToken] = useState(null);

  const redirectUri = AuthSession.makeRedirectUri({ useProxy: true });

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: CLIENT_ID,
      scopes: SCOPES,
      redirectUri,
      responseType: AuthSession.ResponseType.Code, // Authorization Code Flow
      usePKCE: true,
      extraParams: { show_dialog: 'true' },
    },
    discovery
  );

  useEffect(() => {
    if (response?.type === 'success' && response.params.code) {
      const code = response.params.code;
      exchangeCodeForToken(code);
    }
  }, [response]);

  const exchangeCodeForToken = async (code) => {
    if (!request?.codeVerifier) return;

    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      client_id: CLIENT_ID,
      code_verifier: request.codeVerifier,
    }).toString();

    try {
      const res = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
      });

      const data = await res.json();
      if (data.access_token) {
        setToken(data.access_token);
      }
    } catch (err) {
      // You can handle errors here if needed
    }
  };

  return {
    token,
    login: () => {
      if (request) {
        promptAsync({ useProxy: true, showInRecents: true });
      }
    },
  };
}
