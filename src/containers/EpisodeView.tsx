import { faPlayCircle } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  format,
  parseISO,
  addMilliseconds,
  formatDistanceToNowStrict,
  isThisYear,
} from 'date-fns';
import { it } from 'date-fns/locale';
import _ from 'lodash';
import React, { useState } from 'react';
import { Collapse } from 'reactstrap';
import { ShowEpisode } from '../lib/Spotify';
import { startPlayback } from '../redux/slices/PlaybackSlice';
import { useAppDispatch } from '../redux/store';

export default ({ episode }: { episode: ShowEpisode }) => {
  const dispatch = useAppDispatch();
  const { name, description, images, release_date, duration_ms, uri } = episode;
  const image = _.find(images, (i) => i.height === 300);
  const [open, setOpen] = useState(false);
  const distance = formatDistanceToNowStrict(
    addMilliseconds(new Date(), duration_ms),
    { locale: it },
  );
  const d = parseISO(release_date);
  const date = format(d, `d MMMM${isThisYear(d) ? '' : ' yyyy'}`, {
    locale: it,
  });
  console.log(uri);
  return (
    <li className="w-full m-3 p-3 transition ease-in-out duration-500 hover:bg-green-800 items-center rounded">
      <div className="flex flex-col">
        <div className="flex flex-row">
          <div className="h-24 w-24 relative">
            <div
              className="h-24 w-24 absolute inset-0 bg-cover bg-center z-0 rounded shadow"
              style={{ backgroundImage: `url('${image?.url}')` }}
            ></div>
            <div className="opacity-0 hover:opacity-100 duration-300 absolute inset-0 z-10 flex justify-center items-center"></div>
            {/* <img
              src={image?.url}
              className="h-24 mr-2 rounded shadow"
              alt="episode image"
            /> */}
          </div>
          <div className="ml-1 flex flex-col">
            <p className="ml-2 cursor-pointer" onClick={() => setOpen(!open)}>
              {name}
            </p>
            <div className="ml-2 flex flex-row items-center">
              <FontAwesomeIcon
                className="transform-gpu duration-500 hover:scale-110"
                icon={faPlayCircle}
                onClick={() => dispatch(startPlayback(uri))}
              />
              <span className="ml-2 text-sm items-center">
                {date} - {distance}
              </span>
            </div>
          </div>
        </div>
        <Collapse isOpen={open} className="max-w-4xl mt-3">
          <p className="text-sm">{description}</p>
        </Collapse>
      </div>
    </li>
  );
};
