import {guid} from 'hyperion-util/src/guid';

export interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
}

interface Response {
  id: string;
  success: boolean;
}

const initialTodos: TodoItem[] = [
  {
    id: guid(),
    text: 'Learn React Native',
    completed: true,
  },
  {
    id: guid(),
    text: 'Build a Todo App',
    completed: false,
  },
  {
    id: guid(),
    text: 'Implement data fetching',
    completed: false,
  },
];

const delay = <V>(value: V, ms: number) => new Promise<V>(
  resolve => setTimeout(() => resolve(value), ms),
);

const delayError = <V>(reason: string, ms: number) => new Promise<V>(
  (_, reject) => setTimeout(() => reject(reason), ms),
);

export class TodoDataManager {
  // Cache for the todos promise
  private static todosPromise: Promise<TodoItem[]> | null = null;

  // Simulate fetching todos from a server with caching
  static fetchTodos(): Promise<TodoItem[]> {
    return this.todosPromise ??= this.__fetchTodos();
  }

  // The actual fetch implementation
  private static async __fetchTodos(): Promise<TodoItem[]> {
    console.log('%c TodoDataManager.fetchTodos', 'color: green');
    const todos = await Promise.all([
      delay([...initialTodos], 2000),
      delay("something else", 1500),
    ]);
    return todos[0];
  }

  // Simulate adding a todo to the server
  static async addTodo(text: string): Promise<TodoItem> {
    console.log('%c TodoDataManager.addTodo', 'color: green');
    return text.trim().toLowerCase() === 'error'
      ? delayError("forcing error", 1500)
      : delay({ id: guid(), text, completed: false }, 1500);
  }

  // Simulate toggling a todo's completed status
  static async toggleTodo(_id: string, _completed: boolean): Promise<Response> {
    console.log('%c TodoDataManager.toggleTodo', 'color: green');
    return delay({id: _id, success: true}, 300);
  }

  // Simulate deleting a todo
  static async deleteTodo(_id: string): Promise<Response> {
    console.log('%c TodoDataManager.deleteTodo', 'color: green');
    return delay({id: _id, success: true}, 300);
  }
}
