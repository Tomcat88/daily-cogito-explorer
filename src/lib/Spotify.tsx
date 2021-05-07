import { History } from 'history';
import querystring from 'querystring';
import randomstring from 'randomstring';
import base64 from 'base64-js';
import axios from 'axios';
import { useEffect } from 'react';
import { Redirect, useHistory, useLocation } from 'react-router';
import cookies from 'js-cookie';
import { addSeconds, getUnixTime, fromUnixTime, isAfter } from 'date-fns';
const SHOW_ID = '3CPV6sZxGV3fVuDLbR9uWh';
const BASE_URL = 'https://accounts.spotify.com';
const API_URL = 'https://api.spotify.com/v1';
const CLIENT_ID = '5bc24f8db71840ef9066aa5cf44a46ea';

const scopes =
  'streaming user-read-playback-position user-read-email user-read-private';

type SpotifyAuth = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  auth_on: number;
};

type ObjectList<T> = {
  items: T[];
  next?: string;
};

export type ShowEpisode = {
  id: string;
  name: string;
  release_date: string;
  description: string;
  images: Image[];
  duration_ms: number;
};

export type Image = {
  url: string;
  width: number;
  height: number;
};

export type Show = {
  id: string;
  name: string;
  images: Image[];
};

class Spotify {
  static async isLogged() {
    const auth_on = parseInt(cookies.get('spotify_auth_on') || '-1');
    const expires_in = parseInt(cookies.get('spotify_expire') || '-1');
    const access_token = cookies.get('spotify_access_token');
    const refresh_token = cookies.get('spotify_refresh_token');

    if (auth_on === -1 || expires_in === -1 || !access_token || !refresh_token)
      return false;

    return true;
  }
  static async login(history: History<unknown>) {
    const { state, verifier } = saveAndGetStateAndVerifier();
    if (!state || !verifier) return; //TODO error handling

    console.log('auth verifier', verifier);
    const challenge = await generateChallenge(verifier);

    const url =
      BASE_URL +
      '/authorize?' +
      querystring.stringify({
        response_type: 'code',
        client_id: CLIENT_ID,
        redirect_uri: 'http://localhost:3000/logincb',
        state,
        scope: scopes,
        code_challenge_method: 'S256',
        code_challenge: challenge,
      });
    window.location.href = url;
  }
  static async logincb(
    history: History<unknown>,
    stateParam: string,
    codeParam: string,
  ) {
    const { state, verifier } = getStateAndVerifier();
    if (!state || !verifier) {
      //TODO handle error
      return;
    }
    if (state !== stateParam) {
      console.log('state', state, 'stateParam', stateParam);
      return Promise.reject();
    }
    const response = await axios.post(
      `${BASE_URL}/api/token`,
      querystring.stringify({
        client_id: CLIENT_ID,
        grant_type: 'authorization_code',
        code: codeParam,
        redirect_uri: 'http://localhost:3000/logincb',
        code_verifier: verifier,
      }),
      {
        headers: {
          'content-type': 'application/x-www-form-urlencoded;charset=utf-8',
        },
      },
    );
    console.log(response.data);
    saveAuth(response.data);
    history.replace('/');
  }

  static async getShowInfo() {
    try {
      await loadAuth();
      console.log(axios.defaults.headers.common['Authorization']);
      const r = await axios.get(`${API_URL}/shows/${SHOW_ID}`);
      return r.data;
    } catch (err) {
      console.error(err);
      await refreshAuth();
    }
  }

  static async getEpisodes(nextUrl?: string): Promise<ObjectList<ShowEpisode>> {
    try {
      await loadAuth();
      const r = await axios.get(
        nextUrl || `${API_URL}/shows/${SHOW_ID}/episodes`,
        {
          params: {
            limit: 20,
          },
        },
      );
      return r.data;
    } catch (err) {
      console.error(err);
      await refreshAuth();
      return Promise.reject();
    }
  }

  static async search(q: string) {
    try {
      let results = [];
      let nextUrl: string | undefined;
      do {
        console.log('search with ' + nextUrl);
        const { items, next } = await Spotify.getEpisodes(nextUrl);
        results.push(...items);
        console.log(results.length);
        nextUrl = next;
      } while (results.length < 100 && nextUrl != null);

      return results;
    } catch (err) {
      console.error(err);
      return Promise.reject();
    }
  }
}

export async function refreshAuth() {
  const refresh_token = cookies.get('spotify_refresh_token');
  const response = await axios.post(
    `${BASE_URL}/api/token`,
    querystring.stringify({
      client_id: CLIENT_ID,
      grant_type: 'refresh_token',
      refresh_token,
    }),
    {
      headers: {
        'content-type': 'application/x-www-form-urlencoded;charset=utf-8',
      },
    },
  );
  console.log('refresh', response.data);
  saveAuth(response.data);
  return response.data;
}

function saveAuth({
  access_token,
  refresh_token,
  expires_in,
}: {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}) {
  console.log('saving new auth');
  cookies.set('spotify_access_token', access_token, {
    expires: 7,
  });
  cookies.set('spotify_refresh_token', refresh_token, {
    expires: 7,
  });
  cookies.set('spotify_expire', expires_in.toString(), { expires: 7 });
  cookies.set('spotify_auth_on', getUnixTime(new Date()).toString(), {
    expires: 7,
  });
  axios.defaults.headers.common['Authorization'] = 'Bearer ' + access_token;
  console.log('axios', axios.defaults.headers.common['Authorization']);
}

export async function loadAuth(): Promise<SpotifyAuth> {
  const auth_on = parseInt(cookies.get('spotify_auth_on') || '-1');
  const expires_in = parseInt(cookies.get('spotify_expire') || '-1');
  const access_token = cookies.get('spotify_access_token');
  const refresh_token = cookies.get('spotify_refresh_token');
  if (auth_on === -1 || expires_in === -1) return Promise.reject();
  if (!access_token || !refresh_token) return Promise.reject();
  const { verifier } = getStateAndVerifier();
  if (!verifier) return Promise.reject();
  const expireTime = addSeconds(fromUnixTime(auth_on), expires_in);
  if (isAfter(new Date(), expireTime)) {
    console.log('isAfter', new Date(), expireTime);
    const auth = await refreshAuth();
    return auth;
  } else {
    axios.defaults.headers.common['Authorization'] = 'Bearer ' + access_token;
    return {
      access_token,
      refresh_token,
      expires_in,
      auth_on,
    };
  }
}

export const SpotifyAuthCallback = () => {
  const history = useHistory();
  const search = useLocation().search;
  const params = new URLSearchParams(search);
  const state = params.get('state');
  const code = params.get('code');
  if (!state || !code) {
    return <Redirect to="/" />;
  }
  useEffect(() => {
    const fetchToken = async () => {
      await Spotify.logincb(history, state, code);
    };
    fetchToken();
  }, []);
  return <h2>Loading...</h2>;
};

async function generateChallenge(verifier: string) {
  const data = new TextEncoder().encode(verifier);
  const encoded = await window.crypto.subtle.digest('SHA-256', data);
  return base64
    .fromByteArray(new Uint8Array(encoded))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

function getStateAndVerifier() {
  const storage = window.sessionStorage;
  return {
    state: storage.getItem('state'),
    verifier: storage.getItem('verifier'),
  };
}

function saveAndGetStateAndVerifier() {
  const storage = window.sessionStorage;

  if (window.location.search.includes('state')) return getStateAndVerifier();

  const state = randomstring.generate();
  const verifier = randomstring.generate(128);

  storage.clear();
  storage.setItem('state', state);
  storage.setItem('verifier', verifier);

  return { state, verifier };
}

loadAuth();

export default Spotify;
