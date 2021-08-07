import React, { useEffect } from 'react';
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';
import { toast } from 'react-toastify';
import Home from './containers/HomeView';
import { refreshAuth, SpotifyAuthCallback } from './lib/Spotify';

function App() {
  useEffect(() => {
    try {
      refreshAuth();
    } catch (error) {
      if (error !== 'unlogged') {
        toast.error("Impossibile caricare l'autenticazione");
      }
    }
  }, []);
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
