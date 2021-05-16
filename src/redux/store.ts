import { Action, configureStore, ThunkAction } from '@reduxjs/toolkit';
import { useDispatch, useSelector } from 'react-redux';
import episodes from './slices/EpisodeSlice';
import playback from './slices/PlaybackSlice';

export const store = configureStore({
  reducer: {
    episodes,
    playback,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action<string>
>;
export type AppDispatch = typeof store.dispatch;
export const useAppDispatch = () => useDispatch<AppDispatch>();
export function useAppSelector<Selected = unknown>(
  selector: (state: RootState) => Selected,
) {
  return useSelector(selector);
}
