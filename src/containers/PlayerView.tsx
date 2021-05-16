import _ from 'lodash';
import { useAppDispatch, useAppSelector } from '../redux/store';
import { faPlay, faPause } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Slider from 'rc-slider';
import { addMilliseconds, format, intervalToDuration } from 'date-fns';
import 'rc-slider/assets/index.css';

import {
  startPlayback,
  resumePlayback,
  pausePlayback,
} from '../redux/slices/PlaybackSlice';
import { useCallback, useState } from 'react';
export default () => {
  const dispatch = useAppDispatch();
  const { playback, playbackAvailable, playbackOn, isPlaying } = useAppSelector(
    (s) => s.playback,
  );
  if (!playback) return null;
  const { progress_ms, item, is_playing } = playback;
  const [progress, setProgress] = useState(progress_ms);
  const { name, images, duration_ms } = item;
  const image = _.find(images, (i) => i.height === 300);
  const onChange = useCallback(
    _.debounce((newProgress) => {
      console.log('onChange', newProgress);
      setProgress(newProgress);
    }, 1000),
    [],
  );
  const durationDuration = intervalToDuration({
    start: 0,
    end: addMilliseconds(0, duration_ms),
  });
  const progressDuration = intervalToDuration({
    start: 0,
    end: addMilliseconds(0, progress),
  });

  console.log(durationDuration, progressDuration);
  return (
    <footer className="fixed pl-2 pt-2 h-28 bg-opacity-90	bg-black w-full bottom-0 flex text-white text-xl">
      <div className="w-full">
        <div className="flex flex-col">
          <div className="flex flex-row w-full">
            <img
              src={image?.url}
              className="h-24 mr-2 rounded shadow"
              alt="episode image"
            />
            <div className="ml-1 w-full flex flex-col">
              <span>{name}</span>
              <div className="flex flex-col justify-items-center items-center">
                {playbackAvailable && !isPlaying && (
                  <div
                    className="cursor-pointer"
                    onClick={() => {
                      if (!playbackOn) {
                        dispatch(startPlayback(playback.item.uri));
                      } else {
                        if (!isPlaying) {
                          dispatch(resumePlayback());
                        }
                      }
                    }}
                  >
                    <FontAwesomeIcon icon={faPlay} size="2x" />
                  </div>
                )}
                {playbackAvailable && playbackOn && isPlaying && (
                  <div
                    className="cursor-pointer"
                    onClick={() => {
                      dispatch(pausePlayback());
                    }}
                  >
                    <FontAwesomeIcon icon={faPause} size="2x" />
                  </div>
                )}
              </div>
              <div className="mt-1 mx-5 flex flex-row">
                {`${progressDuration.hours}:${progressDuration.minutes}:${progressDuration.seconds}`}
                <Slider
                  value={progress}
                  step={1000}
                  max={duration_ms}
                  onChange={onChange}
                  trackStyle={{ backgroundColor: 'green', height: '10px' }}
                  railStyle={{ height: '10px' }}
                  handle={() => <i></i>}
                />
                {`${durationDuration.hours}:${durationDuration.minutes}:${durationDuration.seconds}`}
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
