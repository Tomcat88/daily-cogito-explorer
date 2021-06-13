import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import SpotifyAPI, {
  refreshAuth,
  ResumePoint,
  ShowEpisode,
} from '../../lib/Spotify';
import { AppThunk } from '../store';
import find from 'lodash/find';

type EpisodeState = {
  episodes: ShowEpisode[];
  nextEpisodeUrl?: string;
  isLoading: boolean;
};

const initialState: EpisodeState = {
  episodes: [],
  isLoading: false,
};

const episodeSlice = createSlice({
  name: 'episode',
  initialState,
  reducers: {
    setEpisodes(state, { payload }: PayloadAction<ShowEpisode[]>) {
      state.episodes = payload;
    },
    addEpisodes(state, { payload }: PayloadAction<ShowEpisode[]>) {
      state.episodes.push(...payload);
    },
    setNextEpisodeUrl(state, { payload }: PayloadAction<string | undefined>) {
      state.nextEpisodeUrl = payload;
    },
    setLoading(state, { payload }: PayloadAction<boolean>) {
      state.isLoading = payload;
    },
    clearEpisodes(state) {
      console.log('clearEpisodes');
      state.episodes = [];
    },
    updateResumePoint(
      state,
      { payload }: PayloadAction<{ id: string; resume_point: ResumePoint }>,
    ) {
      const { id, resume_point } = payload;

      const ep = find(state.episodes, (e) => e.id === id);
      // console.log('find ep for id', id, ep);
      if (ep) {
        // console.log('found ep', ep);
        ep.resume_point = resume_point;
      }
    },
  },
});

export default episodeSlice.reducer;

export const {
  addEpisodes,
  setNextEpisodeUrl,
  setEpisodes,
  setLoading,
  clearEpisodes,
  updateResumePoint,
} = episodeSlice.actions;

export function loadEpisodes(nextUrl?: string): AppThunk {
  return async (dispatch) => {
    console.log('dispatch loadEpisodes');
    try {
      dispatch(setLoading(true));
      const { items, next } = await SpotifyAPI.getEpisodes(nextUrl, 20);
      dispatch(setNextEpisodeUrl(next));
      dispatch(addEpisodes(items));
    } catch (err) {
      console.error(err);
      await refreshAuth();
      return Promise.reject();
    }
    dispatch(setLoading(false));
  };
}

export function search(q: string, startFromUrl?: string): AppThunk {
  return async (dispatch) => {
    if (q === '') return;
    dispatch(setLoading(true));
    console.log('query', q);
    try {
      let size = 0;
      let nextUrl: string | undefined = startFromUrl;
      do {
        console.log('search with ' + nextUrl);
        const { items, next } = await SpotifyAPI.getEpisodes(nextUrl);
        const terms = q.split(' ').map((t) => t.toLowerCase());
        const results = items.filter(
          (e) =>
            terms
              .map((t) => e.name.toLowerCase().includes(t))
              .reduce((a, b) => a && b, true) ||
            terms
              .map((t) => e.description.toLowerCase().includes(t))
              .reduce((a, b) => a && b, true),
        );
        dispatch(addEpisodes(results));
        size += results.length;
        nextUrl = next;
      } while (size < 10 && nextUrl != null);
      dispatch(setNextEpisodeUrl(nextUrl));
    } catch (err) {
      console.error(err);
      await refreshAuth();
      return Promise.reject();
    }
    dispatch(setLoading(false));
  };
}
