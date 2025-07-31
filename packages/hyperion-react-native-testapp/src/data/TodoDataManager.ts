import {guid} from 'hyperion-util/src/guid';

export interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
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

// Simulate API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export class TodoDataManager {
  // Cache for the todos promise
  private static todosPromise: Promise<TodoItem[]> | null = null;

  // Simulate fetching todos from a server with caching
  static fetchTodos(): Promise<TodoItem[]> {
    return this.todosPromise ??= this.__fetchTodos();
  }

  // The actual fetch implementation
  private static async __fetchTodos(): Promise<TodoItem[]> {
    await delay(1500);
    return [...initialTodos];
  }

  // Simulate adding a todo to the server
  static async addTodo(text: string): Promise<TodoItem> {
    await delay(500);
    return {
      id: guid(),
      text,
      completed: false,
    };
  }

  // Simulate toggling a todo's completed status
  static async toggleTodo(_id: string, _completed: boolean): Promise<void> {
    await delay(300);
  }

  // Simulate deleting a todo
  static async deleteTodo(_id: string): Promise<void> {
    await delay(300);
  }
}
