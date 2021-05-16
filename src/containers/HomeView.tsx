import { Button, Collapse } from 'reactstrap';
import { useHistory } from 'react-router-dom';
import SpotifyAPI, { loadAuth, refreshAuth, ShowEpisode } from '../lib/Spotify';
import React, { useEffect, useState, useCallback } from 'react';
import _ from 'lodash';
import EpisodeList from './EpisodeList';
import { useAppDispatch, useAppSelector } from '../redux/store';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  clearEpisodes,
  loadEpisodes,
  search,
  setNextEpisodeUrl,
} from '../redux/slices/EpisodeSlice';
import {
  loadCurrentlyPlaying,
  spotifySDKCallback,
} from '../redux/slices/PlaybackSlice';
import SpotifyPlayer from '../lib/SpotifyPlayer';
import PlayerView from './PlayerView';

const Home = () => {
  const history = useHistory();
  const [showImage, setShowImage] = useState();
  const [isLogged, setIsLogged] = useState(false);
  const [query, setQuery] = useState<string | undefined>();
  const dispatch = useAppDispatch();
  const { playbackAvailable, playback } = useAppSelector(
    (state) => state.playback,
  );

  useEffect(() => {
    (async () => {
      const isLogged = await SpotifyAPI.isLogged();
      if (isLogged) {
        await loadAuth();
      }
      const show = await SpotifyAPI.getShowInfo();
      setShowImage(_.find(show?.images, (i) => i.width === 640)?.url);
      setIsLogged(isLogged);
      dispatch(loadEpisodes());
      dispatch(loadCurrentlyPlaying());
      dispatch(spotifySDKCallback());
    })();
  }, []);
  const onChange = useCallback(
    _.debounce((q) => {
      console.log('onChange');
      dispatch(setNextEpisodeUrl(undefined));
      dispatch(clearEpisodes());
      if (!q || q === '') {
        dispatch(loadEpisodes());
      } else {
        dispatch(search(q));
      }
    }, 1000),
    [],
  );

  const onClear = () => {
    setQuery('');
    dispatch(clearEpisodes());
    dispatch(loadEpisodes());
  };
  return (
    <div className="pt-2">
      <div className="flex">
        {showImage && (
          <img
            src={showImage}
            className="ml-2 mr-5 h-32 rounded shadow-lg"
            alt="logo"
          />
        )}
        {isLogged && (
          <div className="w-1/2 flex items-center">
            <div className="w-full bg-white flex items-center rounded-full shadow-xl">
              <input
                className="text-4xl rounded-full w-full py-4 px-6 text-gray-700 leading-tight focus:outline-none"
                id="search"
                type="text"
                placeholder="Cerca episodi per nome o descrizione..."
                onChange={(e) => {
                  setQuery(e.target.value);
                  onChange(e.target.value);
                }}
                value={query}
              />
              {query && (
                <div className="mr-5">
                  <button>
                    <FontAwesomeIcon
                      icon={faTimes}
                      size="2x"
                      onClick={onClear}
                    />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      <div className="mt-10 mr-10 px-5 flex flex-col text-4xl text-white">
        {isLogged || (
          <Button
            color="success"
            className="max-w-2xl"
            onClick={async () => await SpotifyAPI.login(history)}
          >
            Login to Spotify
          </Button>
        )}
        {isLogged && <EpisodeList query={query} />}
      </div>
      {isLogged && playback && <PlayerView />}
    </div>
  );
};

export default Home;
