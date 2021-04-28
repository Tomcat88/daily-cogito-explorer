import { Link, useParams } from 'react-router-dom';
import { Alert } from 'reactstrap';
import { useAppSelector } from '../redux/store';

export default () => {
  const { todoId } = useParams<{ todoId?: string }>();
  const { todos, isLoading } = useAppSelector((state) => state.todos);

  if (isLoading) {
    return <div className="text-xl flex flex-col items-center">Loading...</div>;
  }

  const todo = todos[Number(todoId)];
  let view;
  if (!todo) {
    view = <div>Todo {todoId} not found.</div>;
  } else {
    view = (
      <div className="flex flex-col">
        {todo.completed && <Alert color="success">Completed!</Alert>}
        <span>Title: {todo.title}</span>
        <span>UserId: {todo.userId}</span>
      </div>
    );
  }

  return (
    <div className="text-lg">
      <div>
        <Link to="/">go back</Link>
      </div>
      {view}
    </div>
  );
};
