import _ from 'lodash';
import EpisodeView from './EpisodeView';
import { useAppDispatch, useAppSelector } from '../redux/store';
import { loadEpisodes, search } from '../redux/slices/EpisodeSlice';

export default ({ query }: { query?: string }) => {
  const dispatch = useAppDispatch();
  const { episodes, nextEpisodeUrl, isLoading } = useAppSelector(
    (state) => state.episodes,
  );

  if (!episodes || episodes.length === 0) {
    return null;
  }
  let loadMoreView = (
    <span
      className="w-full my-3 transition ease-in-out duration-500 hover:bg-green-800 items-center rounded cursor-pointer"
      onClick={() => dispatch(loadEpisodes(nextEpisodeUrl))}
    >
      Carica altri episodi...
    </span>
  );
  if (query && query !== '') {
    loadMoreView = (
      <span
        className="my-3 text-4xl cursor-pointer"
        onClick={() => dispatch(search(query, nextEpisodeUrl))}
      >
        Continua a cercare...
      </span>
    );
  }

  return (
    <>
      <ul className="bg-transparent">
        {episodes.map((e, i) => (
          <EpisodeView key={i} episode={e} />
        ))}
      </ul>
      {!isLoading && nextEpisodeUrl && loadMoreView}
      {isLoading && (
        <div className="w-full flex items-center justify-center">
          <svg
            className="animate-spin -ml-1 mr-3 h-16 w-16 text-green-500"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        </div>
      )}
      <div className="h-32"></div>
    </>
  );
};
