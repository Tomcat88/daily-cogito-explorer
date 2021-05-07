import {
  format,
  parseISO,
  addMilliseconds,
  formatDistanceToNowStrict,
  isThisYear,
} from 'date-fns';
import { it } from 'date-fns/locale';
import _ from 'lodash';
import { useState } from 'react';
import { Collapse } from 'reactstrap';
import { ShowEpisode } from '../lib/Spotify';

export default ({ episode }: { episode: ShowEpisode }) => {
  const { name, description, images, release_date, duration_ms } = episode;
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
  return (
    <li className="w-full m-3 p-3 transition ease-in-out duration-500 hover:bg-green-800 items-center rounded">
      <div className="flex flex-col">
        <div className="flex flex-row">
          <img
            src={image?.url}
            className="h-24 mr-2 rounded shadow"
            alt="episode image"
          />
          <div className="ml-1 flex flex-col">
            <p className="cursor-pointer" onClick={() => setOpen(!open)}>
              {name}
            </p>
            <span className="text-sm">
              {date} - {distance}
            </span>
          </div>
        </div>
        <Collapse isOpen={open} className="max-w-4xl mt-3">
          <p className="text-sm">{description}</p>
        </Collapse>
      </div>
    </li>
  );
};
