import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { de } from 'date-fns/locale';
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

export type PlaybackDevice = {
  id: string;
  is_private_session: boolean;
  is_active: boolean;
  is_restricted: boolean;
  name: string;
  type: string;
  volume_percent: number;
};

export type Playback = {
  is_playing: boolean;
  progress_ms: number;
  item: PlaybackItem;
};

type PlaybackState = {
  playbackAvailable: boolean;
  playback?: Playback;
  playbackDevice?: PlaybackDevice;
  player?: Spotify.Player;
  deviceId?: string;
  connected: boolean;
  playbackOn: boolean;
  isPlaying: boolean;
  progressMs?: number;
  item?: PlaybackItem;
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
    setPlaybackDevice(
      state,
      { payload }: PayloadAction<PlaybackDevice | undefined>,
    ) {
      state.playbackDevice = payload;
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
    setProgressMs(state, { payload }: PayloadAction<number | undefined>) {
      state.progressMs = payload;
    },
    setPlaybackItem(
      state,
      { payload }: PayloadAction<PlaybackItem | undefined>,
    ) {
      state.item = payload;
    },
  },
});

export default playback.reducer;

export const {
  setPlaybackAvailable,
  setPlayback,
  setPlaybackDevice,
  setPlayer,
  setDeviceId,
  setConnected,
  setPlaybackOn,
  setIsPlaying,
  setPlaybackItem,
  setProgressMs,
} = playback.actions;

export function loadCurrentlyPlaying(): AppThunk {
  return async (dispatch) => {
    try {
      const r = await SpotifyAPI.currentlyPlaying();
      console.log('currently playing', r);
      if (r && r.currently_playing_type === 'episode') {
        const showUri: string | undefined = r.item?.show?.uri;
        if (showUri?.includes(SHOW_ID)) {
          dispatch(setIsPlaying(r?.is_playing || false));
          dispatch(setProgressMs(r?.progress_ms));
          dispatch(setPlaybackItem(r?.item));
          dispatch(setPlaybackAvailable(true));
          // dispatch(setPlaybackOn(true));
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

export function loadCurrentPlayback(): AppThunk {
  return async (dispatch) => {
    try {
      const r = await SpotifyAPI.currentPlayback();
      console.log('playback ', r);
      if (r && r.currently_playing_type === 'episode') {
        dispatch(setPlaybackDevice(r.device));
      } else {
        dispatch(setPlaybackDevice(undefined));
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
        console.log('player_state_changed', state);
        const { paused, position } = state;
        dispatch(setIsPlaying(!paused));
        dispatch(setProgressMs(position));
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
      const { playbackDevice, deviceId } = getState().playback;
      const r = await SpotifyAPI.startPlayback(
        uri,
        playbackDevice?.id || deviceId,
      );
      console.log('start playback', r);
      dispatch(setPlaybackOn(true));
      dispatch(setIsPlaying(true));
    } catch (error) {
      console.error(error);
      dispatch(setPlaybackOn(false));
    }
  };
}

export function resumePlayback(): AppThunk {
  return async (dispatch, getState) => {
    try {
      const { playbackDevice, deviceId } = getState().playback;
      const r = await SpotifyAPI.resumePlayback(playbackDevice?.id || deviceId);
      dispatch(setIsPlaying(true));
    } catch (error) {
      console.error(error);
    }
  };
}

export function pausePlayback(): AppThunk {
  return async (dispatch, getState) => {
    try {
      const { playbackDevice, deviceId } = getState().playback;
      console.log(playbackDevice, deviceId);
      const r = await SpotifyAPI.pausePlayback(playbackDevice?.id || deviceId);
      dispatch(setIsPlaying(false));
    } catch (error) {
      console.error(error);
    }
  };
}
