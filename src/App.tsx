import React, { useEffect } from 'react';
import { HashRouter as Router, Switch, Route } from 'react-router-dom';
import Home from './containers/HomeView';
import { SpotifyAuthCallback } from './lib/Spotify';

function App() {
  return (
    <div className="font-sans bg-gradient-to-b from-green-600 to-gray-900 min-h-screen">
      <Router>
        <Switch>
          <Route path="/logincb">
            <SpotifyAuthCallback />
          </Route>
          <Route path="/">
            <Home />
          </Route>
        </Switch>
      </Router>
    </div>
  );
}

export default App;
