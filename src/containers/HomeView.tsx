import { Button, Collapse } from 'reactstrap';
import { useHistory } from 'react-router-dom';
import Spotify, { ShowEpisode } from '../lib/Spotify';
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
import SpotifyPlayer from '../lib/SpotifyPlayer';

const Home = () => {
  const history = useHistory();
  const [isSearching, setIsSearching] = useState();
  const [showName, setShowName] = useState();
  const [showImage, setShowImage] = useState();
  const [isLogged, setIsLogged] = useState(false);
  const [query, setQuery] = useState<string | undefined>();
  const dispatch = useAppDispatch();
  const { nextEpisodeUrl } = useAppSelector((state) => state.episodes);

  useEffect(() => {
    (async () => {
      const isLogged = await Spotify.isLogged();
      const show = await Spotify.getShowInfo();
      setShowName(show?.name);
      setShowImage(_.find(show?.images, (i) => i.width === 640)?.url);
      setIsLogged(isLogged);
      if (isLogged) {
        dispatch(loadEpisodes());
      }
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
                  <FontAwesomeIcon icon={faTimes} size="2x" onClick={onClear} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="mt-10 mr-10 px-5 flex flex-col text-4xl text-white">
        {isLogged || (
          <Button
            color="success"
            onClick={async () => await Spotify.login(history)}
          >
            Login to Spotify
          </Button>
        )}
        <EpisodeList query={query} />
      </div>
      <SpotifyPlayer playingRecordingId="spotify:episode:1IzNyKUDbwWWAGCKA2bM2k" />
    </div>
  );
};

export default Home;
