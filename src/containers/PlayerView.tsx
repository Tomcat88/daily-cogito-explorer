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
import { useCallback, useEffect, useState } from 'react';
import { updateResumePoint } from '../redux/slices/EpisodeSlice';
export default () => {
  const dispatch = useAppDispatch();
  const {
    playback,
    playbackAvailable,
    playbackOn,
    isPlaying,
    progressMs,
    item,
  } = useAppSelector((s) => s.playback);
  if (!playback || !item) return null;

  const [progress, setProgress] = useState(progressMs || 0);
  //console.log(progress, progressMs);
  const [progressInterval, setProgressInterval] = useState<
    NodeJS.Timeout | undefined
  >();
  const { name, images, duration_ms } = item;
  const image = _.find(images, (i) => i.height === 300);
  const onChange = useCallback(
    _.debounce((newProgress) => {
      console.log('onChange', newProgress);
      setProgress(newProgress);
    }, 1000),
    [],
  );
  console.log(item.uri);
  useEffect(() => {
    // console.log('update resume point', progress);
    dispatch(
      updateResumePoint({
        id: item.id,
        resume_point: {
          fully_played: false,
          resume_position_ms: progress,
        },
      }),
    );
  }, [progress]);

  useEffect(() => {
    console.log('update progress with progressMs');
    setProgress(progressMs || 0);
  }, [progressMs]);

  useEffect(() => {
    if (isPlaying) {
      console.log('set progress interval');
      console.log(progressInterval);
      setProgressInterval(
        setInterval(() => {
          setProgress((p) => p + 1000);
        }, 1000),
      );
      return () => {
        if (progressInterval) {
          clearInterval(progressInterval);
        }
      };
    } else {
      console.log('clear progress interval');
      if (progressInterval) {
        clearInterval(progressInterval);
      }
    }
  }, [isPlaying]);
  const durationDuration = intervalToDuration({
    start: 0,
    end: addMilliseconds(0, duration_ms),
  });
  const progressDuration = intervalToDuration({
    start: 0,
    end: addMilliseconds(0, progress),
  });
  const progressStr = `${
    progressDuration.hours
      ? String(progressDuration.hours).padStart(2, '0') + ':'
      : ''
  }${String(progressDuration.minutes).padStart(2, '0')}:${String(
    progressDuration.seconds,
  ).padStart(2, '0')}`;
  const durationStr = `${
    durationDuration.hours
      ? String(durationDuration.hours).padStart(2, '0') + ':'
      : ''
  }${String(durationDuration.minutes).padStart(2, '0')}:${String(
    durationDuration.seconds,
  ).padStart(2, '0')}`;
  // console.log(durationDuration, progressDuration);
  // console.log('playbackAvailable', playbackAvailable, 'playbackOn', playbackOn);
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
                {playbackAvailable && isPlaying && (
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
              <div className="mx-5 flex flex-row items-center">
                <span className="mr-2">{progressStr}</span>
                <Slider
                  value={progress}
                  step={1000}
                  max={duration_ms}
                  onChange={onChange}
                  trackStyle={{ backgroundColor: 'green', height: '10px' }}
                  railStyle={{ height: '10px' }}
                  handle={() => <i></i>}
                />
                <span className="ml-2">{durationStr}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
