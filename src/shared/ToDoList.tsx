import { loadToDos, setHideCompleted } from '../redux/slices/ToDoSlice';
import { useAppDispatch, useAppSelector } from '../redux/store';
import { Button } from 'reactstrap';
import { Link } from 'react-router-dom';

const TodoList = () => {
  const dispatch = useAppDispatch();
  const { isLoading, todos, hideCompleted } = useAppSelector(
    (state) => state.todos,
  );

  if (isLoading) {
    return <div className="text-xl flex flex-col items-center">Loading...</div>;
  }

  return (
    <div className="text-xl flex flex-col items-center">
      <div className="mb-3">
        <Button
          color="info"
          className="mr-3"
          onClick={() => dispatch(loadToDos())}
        >
          Load todos
        </Button>
        <input
          id="hide"
          type="checkbox"
          onChange={(e) => dispatch(setHideCompleted(e.target.checked))}
          defaultChecked={hideCompleted}
        />
        <label className="ml-1" htmlFor="hide">
          Hide completed todos
        </label>
      </div>
      <ul className="h-80 overflow-auto">
        {Object.values(todos)
          .filter((t) => !hideCompleted || !t.completed)
          .map((todo) => {
            return (
              <li
                key={todo.id}
                className={todo.completed ? 'line-through' : ''}
              >
                <Link to={`/todos/${todo.id}`}>
                  {todo.id} - {todo.title}
                </Link>
              </li>
            );
          })}
      </ul>
    </div>
  );
};

export default TodoList;
