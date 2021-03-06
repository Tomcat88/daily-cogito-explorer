import axios from 'axios';
import React from 'react';
import { ScriptCache } from '../util/ScriptCache';
import { loadAuth } from './Spotify';
import { faPlay, faPause } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Playback } from '../redux/slices/PlaybackSlice';
import _ from 'lodash';

interface Props {
  playback?: Playback;
}

interface State {
  loadingState: string;
  spotifyAccessToken: string;
  spotifyDeviceId: string;
  spotifySDKLoaded: boolean;
  spotifyAuthorizationGranted: boolean;
  spotifyPlayerConnected: boolean;
  spotifyPlayerReady: boolean;
  spotifyPlayer: Spotify.Player | undefined;
  playbackOn: boolean;
  playbackPaused: boolean;
}

class SpotifyPlayer extends React.Component<Props, State> {
  private connectToPlayerTimeout: any;

  public constructor(props: Props) {
    super(props);
    console.log('init Spotify Player', props.playback);
    this.spotifySDKCallback();
    new ScriptCache([
      {
        name: 'https://sdk.scdn.co/spotify-player.js',
      },
    ]);

    this.state = {
      loadingState: 'loading scripts',
      spotifyAccessToken: '',
      spotifyDeviceId: '',
      spotifyAuthorizationGranted: false,
      spotifyPlayerConnected: false,
      spotifyPlayerReady: false,
      spotifySDKLoaded: false,
      spotifyPlayer: undefined,
      playbackOn: false,
      playbackPaused: false,
    };
  }

  private spotifySDKCallback = () => {
    window.onSpotifyWebPlaybackSDKReady = () => {
      console.log('spotify sdk callback');
      const spotifyPlayer = new Spotify.Player({
        name: 'React Spotify Player',
        getOAuthToken: (cb) => {
          loadAuth().then(({ access_token }) => {
            cb(access_token);
          });
        },
      });

      // Playback status updates
      spotifyPlayer.addListener('player_state_changed', (state) => {
        console.log(state);
      });

      this.setState({
        loadingState: 'spotify scripts loaded',
        spotifyPlayer,
      });

      this.connectToPlayer();
    };
  };
  private connectToPlayer = () => {
    if (this.state.spotifyPlayer) {
      clearTimeout(this.connectToPlayerTimeout);
      // Ready
      this.state.spotifyPlayer.addListener('ready', ({ device_id }) => {
        console.log('Ready with Device ID', device_id);
        this.setState({
          loadingState: 'spotify player ready',
          spotifyDeviceId: device_id,
          spotifyPlayerReady: true,
        });
      });

      // Not Ready
      this.state.spotifyPlayer.addListener('not_ready', ({ device_id }) => {
        console.log('Device ID has gone offline', device_id);
      });

      this.state.spotifyPlayer.connect().then((ev: any) => {
        this.setState({ loadingState: 'connected to player' });
      });
    } else {
      this.connectToPlayerTimeout = setTimeout(
        this.connectToPlayer.bind(this),
        1000,
      );
    }
  };

  private startPlayback = async (spotify_uri: string) => {
    axios
      .put(
        `https://api.spotify.com/v1/me/player/play?device_id=${this.state.spotifyDeviceId}`,
        { uris: [spotify_uri] },
      )
      .then((ev) => {
        console.log(ev);
        if (ev.status === 403) {
          this.setState({
            loadingState: 'you need to upgrade to premium for playback',
          });
        } else {
          this.setState({
            loadingState: 'playback started',
            playbackOn: true,
            playbackPaused: false,
          });
          console.log('Started playback', this.state);
        }
      })
      .catch((error) => {
        this.setState({ loadingState: 'playback error: ' + error });
      });
  };

  private resumePlayback = () => {
    axios
      .put(
        `https://api.spotify.com/v1/me/player/play?device_id=${this.state.spotifyDeviceId}`,
      )
      .then((ev) => {
        this.setState({ playbackPaused: false });
      });
    console.log('Started playback', this.state);
  };

  private pauseTrack = () => {
    axios
      .put(
        `https://api.spotify.com/v1/me/player/pause?device_id=${this.state.spotifyDeviceId}`,
      )
      .then((ev) => {
        this.setState({ playbackPaused: true });
      });
  };

  render() {
    const { playback } = this.props;

    if (!playback) return null;

    const { name, images } = playback.item;
    const image = _.find(images, (i) => i.height === 300);
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
                  {this.state.spotifyPlayerReady && !this.state.playbackOn && (
                    <div
                      className="cursor-pointer"
                      onClick={() => {
                        if (!this.state.playbackOn) {
                          this.startPlayback(playback.item.uri);
                        } else {
                          if (this.state.playbackPaused) {
                            this.resumePlayback();
                          }
                        }
                      }}
                    >
                      <FontAwesomeIcon icon={faPlay} size="2x" />
                    </div>
                  )}
                  {this.state.spotifyPlayerReady && this.state.playbackOn && (
                    <div
                      className="cursor-pointer"
                      onClick={() => {
                        if (!this.state.playbackPaused) {
                          this.pauseTrack();
                        }
                      }}
                    >
                      <FontAwesomeIcon icon={faPause} size="2x" />
                    </div>
                  )}
                </div>
                <div className="h-3 relative max-w-xl rounded-full overflow-hidden">
                  <div className="w-full h-full bg-gray-200 absolute"></div>
                  <div
                    className="h-full bg-green-500 absolute"
                    style={{ width: '10%' }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    );
  }
}

export default SpotifyPlayer;
