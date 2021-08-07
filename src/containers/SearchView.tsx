import React, { useEffect, useState, useCallback } from 'react';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useAppDispatch } from '../redux/store';
import _ from 'lodash';
import {
  clearEpisodes,
  loadEpisodes,
  search,
  setNextEpisodeUrl,
} from '../redux/slices/EpisodeSlice';

export default ({
  query,
  setQuery,
}: {
  query?: string;
  setQuery: React.Dispatch<React.SetStateAction<string | undefined>>;
}) => {
  const dispatch = useAppDispatch();

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
    <div className="w-1/2 flex items-center">
      <div className="w-full bg-white flex items-center rounded shadow-xl">
        <input
          className="text-4xl rounded w-full py-4 px-6 text-gray-700 leading-tight focus:outline-none"
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
  );
};
