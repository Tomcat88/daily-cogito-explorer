import logo from './logo.svg';
import TodoList from '../shared/ToDoList';

const Home = () => {
  return (
    <>
      <img src={logo} className="h-96 animate-spin" alt="logo" />
      <p>
        Edit <code>src/App.tsx</code> and save to reload.
      </p>
      <a
        className="text-blue-400 mb-10"
        href="https://reactjs.org"
        target="_blank"
        rel="noopener noreferrer"
      >
        Learn React
      </a>
      <TodoList />
    </>
  );
};

export default Home;
