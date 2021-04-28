import React, { useEffect } from 'react';
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';
import Home from './containers/HomeView';
import ToDo from './containers/ToDoView';
import { loadToDos } from './redux/slices/ToDoSlice';
import { useAppDispatch } from './redux/store';

function App() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(loadToDos());
  }, []);

  return (
    <div className="bg-gray-700 min-h-screen flex flex-col items-center justify-items-center text-4xl text-white">
      <Router>
        <Switch>
          <Route path="/todos/:todoId">
            <ToDo />
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
