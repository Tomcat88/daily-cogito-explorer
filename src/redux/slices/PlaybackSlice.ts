import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { SHOW_ID } from '../../config/config';
import SpotifyAPI, { Image, loadAuth } from '../../lib/Spotify';
import { ScriptCache } from '../../util/ScriptCache';
import { AppThunk } from '../store';

type PlaybackItem = {
  id: string;
  name: string;
  duration_ms: number;
  uri: string;
  images: Image[];
};

export type Playback = {
  is_playing: boolean;
  progress_ms: number;
  item: PlaybackItem;
};

type PlaybackState = {
  playbackAvailable: boolean;
  playback?: Playback;
  player?: Spotify.Player;
  deviceId?: string;
  connected: boolean;
  playbackOn: boolean;
  isPlaying: boolean;
};

const initialState: PlaybackState = {
  playbackAvailable: false,
  connected: false,
  playbackOn: false,
  isPlaying: false,
};

const playback = createSlice({
  name: 'playback',
  initialState,
  reducers: {
    setPlaybackAvailable(state, { payload }: PayloadAction<boolean>) {
      state.playbackAvailable = payload;
    },
    setPlayback(state, { payload }: PayloadAction<Playback>) {
      state.playback = payload;
    },
    setPlayer(state, { payload }: PayloadAction<Spotify.Player>) {
      state.player = payload;
    },
    setDeviceId(state, { payload }: PayloadAction<string | undefined>) {
      state.deviceId = payload;
    },
    setConnected(state, { payload }: PayloadAction<boolean>) {
      state.connected = payload;
    },
    setPlaybackOn(state, { payload }: PayloadAction<boolean>) {
      state.playbackOn = payload;
    },
    setIsPlaying(state, { payload }: PayloadAction<boolean>) {
      state.isPlaying = payload;
    },
  },
});

export default playback.reducer;

export const {
  setPlaybackAvailable,
  setPlayback,
  setPlayer,
  setDeviceId,
  setConnected,
  setPlaybackOn,
  setIsPlaying,
} = playback.actions;

export function loadCurrentlyPlaying(): AppThunk {
  return async (dispatch) => {
    try {
      const r = await SpotifyAPI.currentlyPlayback();
      console.log('currently, playing', r);
      if (r && r.currently_playing_type === 'episode') {
        const showUri: string = r.context?.uri;
        if (showUri.includes(SHOW_ID)) {
          dispatch(setPlaybackAvailable(true));
          dispatch(setPlayback(r));
        }
      } else {
        dispatch(setPlaybackAvailable(false));
      }
    } catch (error) {
      console.error(error);
    }
  };
}

export function spotifySDKCallback(): AppThunk {
  return async (dispatch) => {
    window.onSpotifyWebPlaybackSDKReady = () => {
      console.log('spotify sdk callback');

      const spotifyPlayer = new Spotify.Player({
        name: 'React Spotify Player',
        getOAuthToken: (cb: (access_token: string) => void) => {
          loadAuth().then(({ access_token }) => {
            cb(access_token);
          });
        },
      });

      // Playback status updates
      spotifyPlayer.addListener('player_state_changed', (state) => {
        console.log(state);
      });

      //dispatch(setPlayer(spotifyPlayer));

      spotifyPlayer.addListener('ready', ({ device_id }) => {
        console.log('Ready with Device ID', device_id);
        dispatch(setDeviceId(device_id));
      });

      // Not Ready
      spotifyPlayer.addListener('not_ready', ({ device_id }) => {
        console.log('Device ID has gone offline', device_id);
        dispatch(setDeviceId(undefined));
      });

      spotifyPlayer.connect().then((connected) => {
        console.log('connected: ', connected);
        dispatch(setConnected(connected));
      });
    };
    new ScriptCache([
      {
        name: 'https://sdk.scdn.co/spotify-player.js',
      },
    ]);
  };
}

export function startPlayback(uri: string): AppThunk {
  return async (dispatch, getState) => {
    try {
      const deviceId = getState().playback?.deviceId;
      if (deviceId) {
        const r = await SpotifyAPI.startPlayback(deviceId, uri);
        dispatch(setPlaybackOn(true));
      }
    } catch (error) {
      console.error(error);
      dispatch(setPlaybackOn(false));
    }
  };
}

export function resumePlayback(): AppThunk {
  return async (dispatch, getState) => {
    try {
      const deviceId = getState().playback?.deviceId;
      if (deviceId) {
        const r = await SpotifyAPI.resumePlayback(deviceId);
        dispatch(setIsPlaying(true));
      }
    } catch (error) {
      console.error(error);
    }
  };
}

export function pausePlayback(): AppThunk {
  return async (dispatch, getState) => {
    try {
      const deviceId = getState().playback?.deviceId;
      if (deviceId) {
        const r = await SpotifyAPI.pausePlayback(deviceId);
        dispatch(setIsPlaying(false));
      }
    } catch (error) {
      console.error(error);
    }
  };
}
