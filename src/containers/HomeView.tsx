import { Button } from 'reactstrap';
import { useHistory } from 'react-router-dom';
import SpotifyAPI, { loadAuth } from '../lib/Spotify';
import { useEffect, useState } from 'react';
import _ from 'lodash';
import EpisodeList from './EpisodeList';
import { useAppDispatch, useAppSelector } from '../redux/store';
import { loadEpisodes } from '../redux/slices/EpisodeSlice';
import {
  loadCurrentlyPlaying,
  loadCurrentPlayback,
  spotifySDKCallback,
} from '../redux/slices/PlaybackSlice';
import PlayerView from './PlayerView';
import { toast } from 'react-toastify';
import SearchView from './SearchView';

const Home = () => {
  const history = useHistory();
  const [showImage, setShowImage] = useState();
  const [isLogged, setIsLogged] = useState(false);
  const [query, setQuery] = useState<string | undefined>();
  const dispatch = useAppDispatch();
  const { playback, playbackOn, isPlaying } = useAppSelector(
    (state) => state.playback,
  );

  useEffect(() => {
    (async () => {
      const isLogged = await SpotifyAPI.isLogged();
      if (isLogged) {
        try {
          await loadAuth();
          const show = await SpotifyAPI.getShowInfo();
          setShowImage(_.find(show?.images, (i) => i.width === 640)?.url);
          setIsLogged(isLogged);
          dispatch(loadEpisodes());
          dispatch(spotifySDKCallback());
        } catch (error) {
          if (error !== 'unlogged') {
            toast.error(`Errore: ${error}`);
          }
        }
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      if (isLogged) {
        dispatch(loadCurrentlyPlaying());
        dispatch(loadCurrentPlayback());
      }
    })();
  }, [isLogged, playbackOn, isPlaying]);

  const unloggedView = (
    <Button
      color="success"
      className="max-w-2xl"
      onClick={async () => {
        try {
          await SpotifyAPI.login(history);
        } catch (error) {
          console.log('error on login', error);
        }
      }}
    >
      Login to Spotify
    </Button>
  );
  return (
    <div className="pt-2">
      <div className="flex">
        {isLogged || unloggedView}
        {showImage && (
          <img
            src={showImage}
            className="ml-2 mr-5 h-32 rounded shadow-lg"
            alt="logo"
          />
        )}
        {isLogged && <SearchView query={query} setQuery={setQuery} />}
      </div>
      <div className="mt-10 mr-10 px-5 flex flex-col text-4xl text-white">
        {isLogged && <EpisodeList query={query} />}
      </div>
      {isLogged && playback && <PlayerView />}
    </div>
  );
};

export default Home;
