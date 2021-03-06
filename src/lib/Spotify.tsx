import { History } from 'history';
import querystring from 'querystring';
import randomstring from 'randomstring';
import base64 from 'base64-js';
import axios from 'axios';
import { useEffect } from 'react';
import { Redirect, useHistory, useLocation } from 'react-router';
import cookies from 'js-cookie';
import { addSeconds, getUnixTime, fromUnixTime, isAfter } from 'date-fns';
import ca from 'date-fns/esm/locale/ca/index.js';
const SHOW_ID = '3CPV6sZxGV3fVuDLbR9uWh';
const BASE_URL = 'https://accounts.spotify.com';
const API_URL = 'https://api.spotify.com/v1';
const CLIENT_ID = '5bc24f8db71840ef9066aa5cf44a46ea';

const scopes =
  'streaming user-read-playback-state user-read-playback-position user-read-email user-read-private';

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
  uri: string;
  name: string;
  release_date: string;
  description: string;
  html_description?: string;
  images: Image[];
  duration_ms: number;
  resume_point: ResumePoint;
};

export type ResumePoint = {
  fully_played: boolean;
  resume_position_ms: number;
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

class SpotifyAPI {
  static loggedAxios = axios.create({
    baseURL: API_URL,
    timeout: 3000,
  });
  static async isLogged() {
    const auth_on = parseInt(cookies.get('spotify_auth_on') || '-1');
    const expires_in = parseInt(cookies.get('spotify_expire') || '-1');
    const access_token = cookies.get('spotify_access_token');
    const refresh_token = cookies.get('spotify_refresh_token');

    if (auth_on === -1 || expires_in === -1 || !access_token || !refresh_token)
      return false;
    console.log('logged');
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
        redirect_uri: `${window.location.protocol}//${window.location.host}/logincb`,
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
        redirect_uri: `${window.location.protocol}//${window.location.host}/logincb`,
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
      const r = await this.loggedAxios(`/shows/${SHOW_ID}`);
      return r.data;
    } catch (err) {
      console.error(err);
      await refreshAuth();
    }
  }

  static async getEpisodes(
    nextUrl?: string,
    limit: number = 50,
  ): Promise<ObjectList<ShowEpisode>> {
    try {
      const r = await this.loggedAxios.get(
        nextUrl || `/shows/${SHOW_ID}/episodes`,
        {
          params: {
            limit,
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

  static async currentlyPlaying() {
    try {
      const r = await this.loggedAxios.get(
        `/me/player/currently-playing?additional_types=episode`,
      );
      if (r.status === 204) return Promise.resolve();

      return r.data;
    } catch (err) {
      console.error(err);
      return Promise.reject();
    }
  }

  static async currentPlayback() {
    try {
      const r = await this.loggedAxios.get(
        `/me/player?additional_types=episode`,
      );

      return r.data;
    } catch (err) {
      console.error(err);
      return Promise.reject();
    }
  }

  static async startPlayback(uri: string, deviceId?: string) {
    try {
      const r = await this.loggedAxios.put(
        `/me/player/play`,
        { uris: [uri] },
        { params: { device_id: deviceId } },
      );
      console.log('playback', r);
      if (r.status === 403) {
        return Promise.reject('premium');
      } else {
        return true;
      }
    } catch (error) {
      console.log(error);
      return Promise.reject();
    }
  }

  static async resumePlayback(deviceId?: string) {
    try {
      const r = await this.loggedAxios.put(
        `/me/player/play?device_id=${deviceId}`,
        {},
        { params: { device_id: deviceId } },
      );
      console.log('resume', r);
      if (r.status === 403) {
        return Promise.reject('premium');
      } else {
        return true;
      }
    } catch (error) {
      console.log(error);
      return Promise.reject();
    }
  }

  static async pausePlayback(deviceId?: string) {
    try {
      const r = await this.loggedAxios.put(
        `/me/player/pause?device_id=${deviceId}`,
        {},
        { params: { device_id: deviceId } },
      );
      console.log('pause', r);
      if (r.status === 403) {
        return Promise.reject('premium');
      } else {
        return true;
      }
    } catch (error) {
      console.log(error);
      return Promise.reject();
    }
  }
}

export async function refreshAuth() {
  const refresh_token = cookies.get('spotify_refresh_token');
  if (!refresh_token) return Promise.reject('unlogged');

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
  SpotifyAPI.loggedAxios.defaults.headers.common['Authorization'] =
    'Bearer ' + access_token;
  console.log(
    'axios',
    SpotifyAPI.loggedAxios.defaults.headers.common['Authorization'],
  );
}

export async function loadAuth(): Promise<SpotifyAuth> {
  const auth_on = parseInt(cookies.get('spotify_auth_on') || '-1');
  const expires_in = parseInt(cookies.get('spotify_expire') || '-1');
  const access_token = cookies.get('spotify_access_token');
  const refresh_token = cookies.get('spotify_refresh_token');
  if (auth_on === -1 || expires_in === -1 || !access_token || !refresh_token)
    return Promise.reject('unlogged');

  const expireTime = addSeconds(fromUnixTime(auth_on), expires_in);
  if (isAfter(new Date(), expireTime)) {
    console.log('isAfter', new Date(), expireTime);
    const auth = await refreshAuth();
    return auth;
  } else {
    SpotifyAPI.loggedAxios.defaults.headers.common['Authorization'] =
      'Bearer ' + access_token;
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
      try {
        await SpotifyAPI.logincb(history, state, code);
      } catch (err) {
        console.error('error on logincb', err);
      }
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

// loadAuth();

export default SpotifyAPI;
