import { createSlice, PayloadAction, ThunkAction } from '@reduxjs/toolkit';
import { AppThunk } from '../store';
import axios from 'axios';

type ToDo = {
  userId: number;
  id: number;
  title: string;
  completed: boolean;
};

type ToDoState = {
  isLoading: boolean;
  hideCompleted: boolean;
  todos: Record<ToDo['id'], ToDo>;
};

const initialState: ToDoState = {
  isLoading: false,
  hideCompleted: false,
  todos: {},
};

const todoSlice = createSlice({
  name: 'todoSlice',
  initialState,
  reducers: {
    setHideCompleted(state: ToDoState, { payload }: PayloadAction<boolean>) {
      state.hideCompleted = payload;
    },
    setToDos(state: ToDoState, { payload }: PayloadAction<ToDo[]>) {
      state.todos = payload.reduce((acc, todo) => {
        acc[todo.id] = todo;
        return acc;
      }, {} as Record<number, ToDo>);
    },
    setLoading(state: ToDoState, { payload }: PayloadAction<boolean>) {
      state.isLoading = payload;
    },
  },
});

export default todoSlice.reducer;
export const { setHideCompleted, setToDos, setLoading } = todoSlice.actions;

export function loadToDos(): AppThunk {
  return async (dispatch) => {
    try {
      dispatch(setLoading(true));
      const todos = await axios.get(
        'https://jsonplaceholder.typicode.com/todos',
      );

      dispatch(setToDos(todos.data));
    } catch (err) {
      console.error(err);
    }
    dispatch(setLoading(false));
  };
}
