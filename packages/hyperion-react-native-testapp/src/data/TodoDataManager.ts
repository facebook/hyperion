import {guid} from 'hyperion-util/src/guid';

export interface TodoItem {
  id: string;
  text: string;
  description: string;
  completed: boolean;
}

export interface TodoListMeta {
  id: string;
  name: string;
  createdAt: Date;
}

export interface PaginatedResponse {
  items: TodoItem[];
  totalItems: number;
  hasNextPage: boolean;
  currentPage: number;
  pageSize: number;
}

interface Response {
  id: string;
  success: boolean;
}

const delay = <V>(value: V, ms: number) => new Promise<V>(
  resolve => setTimeout(() => resolve(value), ms),
);

const delayError = <V>(reason: string, ms: number) => new Promise<V>(
  (_, reject) => setTimeout(() => reject(reason), ms),
);

const generateSampleData = (listId: string, count: number = 100): TodoItem[] => {
  const items: TodoItem[] = [];

  const taskTemplates = {
    'work-tasks-001': [
      { title: 'Review code changes', description: 'Go through the latest pull requests and provide feedback on code quality, security, and performance improvements.' },
      { title: 'Update documentation', description: 'Refresh API docs and README files to reflect recent changes and ensure new team members can get started quickly.' },
      { title: 'Test new features', description: 'Run comprehensive tests on the authentication system and user interface to catch any bugs before release.' },
      { title: 'Prepare release notes', description: 'Document all new features, bug fixes, and breaking changes for the upcoming v2.1 release.' },
      { title: 'Attend team meeting', description: 'Weekly standup to discuss project progress, blockers, and plan for the next sprint iteration.' },
      { title: 'Fix bug in authentication', description: 'Resolve the JWT token expiration issue that is causing users to be logged out unexpectedly.' },
      { title: 'Optimize database queries', description: 'Improve performance of the user search functionality by adding proper indexes and query optimization.' },
      { title: 'Write unit tests', description: 'Increase test coverage for the payment processing module to ensure reliability and prevent regressions.' },
      { title: 'Deploy to staging', description: 'Push the latest changes to the staging environment for QA testing and stakeholder review.' },
      { title: 'Code review for PR', description: 'Review the mobile app integration pull request and ensure it follows coding standards and best practices.' },
    ],
    'personal-001': [
      { title: 'Buy groceries', description: 'Get weekly essentials including fresh vegetables, fruits, dairy products, and household cleaning supplies.' },
      { title: 'Call dentist', description: 'Schedule the bi-annual cleaning appointment and ask about the whitening treatment options.' },
      { title: 'Schedule car maintenance', description: 'Book the 30,000-mile service appointment and get the air conditioning system checked before summer.' },
      { title: 'Pay utility bills', description: 'Pay the monthly electricity, water, gas, and internet bills before the due date to avoid late fees.' },
      { title: 'Book doctor appointment', description: 'Schedule annual physical exam and discuss the recent allergy symptoms with the physician.' },
      { title: 'Clean the house', description: 'Deep clean the kitchen and bathrooms, vacuum all carpets, and organize the cluttered home office space.' },
      { title: 'Exercise at gym', description: 'Complete the cardio and strength training workout routine, focusing on core exercises and flexibility.' },
      { title: 'Read a book', description: 'Continue reading "The Psychology of Money" and take notes on key insights about financial decision-making.' },
      { title: 'Plan weekend trip', description: 'Research accommodations and activities for the upcoming visit to the national park with family.' },
      { title: 'Call family', description: 'Check in with parents and siblings, share updates about work and life, and plan the next family gathering.' },
    ]
  };

  const templates = taskTemplates[listId as keyof typeof taskTemplates] || [
    { title: 'Task item', description: 'Complete this general task with attention to detail and quality.' },
    { title: 'Another task', description: 'Work on this important item that requires focus and dedication.' },
    { title: 'Complete assignment', description: 'Finish the assigned work according to specifications and requirements.' },
    { title: 'Review materials', description: 'Go through all the provided documents and resources thoroughly.' },
    { title: 'Prepare presentation', description: 'Create a comprehensive presentation with clear objectives and engaging content.' }
  ];

  for (let i = 0; i < count; i++) {
    const template = templates[i % templates.length];
    const suffix = Math.floor(i / templates.length) > 0 ? ` (${Math.floor(i / templates.length) + 1})` : '';
    items.push({
      id: guid(),
      text: `${template.title}${suffix}`,
      description: template.description,
      completed: Math.random() < 0.3 // 30% chance of being completed
    });
  }

  return items;
};

const initialTodoListMetas: TodoListMeta[] = [
  {
    id: 'work-tasks-001',
    name: 'Work Tasks',
    createdAt: new Date('2024-01-01'),
  },
  {
    id: 'personal-001',
    name: 'Personal',
    createdAt: new Date('2024-01-02'),
  },
];

export class TodoListMetaManager {
  private static todoListMetasPromise: Promise<TodoListMeta[]> | null = null;

  static fetchTodoListMetas(): Promise<TodoListMeta[]> {
    return this.todoListMetasPromise ??= this.__fetchTodoListMetas();
  }

  private static async __fetchTodoListMetas(): Promise<TodoListMeta[]> {
    const todoListMetas = await Promise.all([
      delay([...initialTodoListMetas], 1000),
      delay("meta data", 800),
    ]);
    return todoListMetas[0];
  }

  static async addTodoListMeta(name: string): Promise<TodoListMeta> {
    return name.trim().toLowerCase() === 'error'
      ? delayError("forcing error", 800)
      : delay({
          id: `list-${guid()}`,
          name,
          createdAt: new Date()
        }, 800);
  }

  static async deleteTodoListMeta(listId: string): Promise<Response> {
    return delay({id: listId, success: true}, 500);
  }
}

export class IndividualTodoListManager {
  private listId: string;
  private localTodos: TodoItem[] | null = null;
  private fullDataset: TodoItem[] | null = null;
  private readonly pageSize: number = 10;

  constructor(listId: string) {
    this.listId = listId;
  }

  fetchTodos(): Promise<TodoItem[]> {
    if (this.localTodos !== null) {
      return Promise.resolve([...this.localTodos]);
    }
    return this.fetchFirstPage().then(response => response.items);
  }

  getCurrentTodos(): TodoItem[] | null {
    return this.localTodos ? [...this.localTodos] : null;
  }

  resetData(): void {
    this.localTodos = null;
    this.fullDataset = null;
  }

  async fetchTodosPage(page: number = 1): Promise<PaginatedResponse> {
    if (this.fullDataset === null) {
      const loadingTime = this.listId.includes('work') ? 1500 : 1000;
      await delay(null, loadingTime);
      this.fullDataset = generateSampleData(this.listId, 100);
    }

    const startIndex = (page - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    const items = this.fullDataset.slice(startIndex, endIndex);

    // Simulate network delay
    await delay(null, 500);

    return {
      items: [...items],
      totalItems: this.fullDataset.length,
      hasNextPage: endIndex < this.fullDataset.length,
      currentPage: page,
      pageSize: this.pageSize
    };
  }

  async fetchFirstPage(): Promise<PaginatedResponse> {
    const response = await this.fetchTodosPage(1);
    this.localTodos = [...response.items];
    return response;
  }

  async loadMoreTodos(currentPage: number): Promise<PaginatedResponse> {
    const nextPage = currentPage + 1;
    const response = await this.fetchTodosPage(nextPage);

    if (this.localTodos !== null) {
      this.localTodos = [...this.localTodos, ...response.items];
    } else {
      this.localTodos = [...response.items];
    }

    return response;
  }

  async addTodo(text: string, description: string = ''): Promise<TodoItem> {
    if (text.trim().toLowerCase() === 'error') {
      return delayError("forcing error", 800);
    }

    const newTodo = {
      id: guid(),
      text,
      description: description || 'No description provided',
      completed: false
    };

    if (this.fullDataset === null) {
      this.fullDataset = generateSampleData(this.listId, 100);
    }
    if (this.localTodos === null) {
      this.localTodos = [];
    }

    this.fullDataset.push(newTodo);
    this.localTodos.push(newTodo);

    return delay(newTodo, 800);
  }

  async toggleTodo(itemId: string, completed: boolean): Promise<Response> {
    if (this.fullDataset !== null) {
      const fullIndex = this.fullDataset.findIndex(todo => todo.id === itemId);
      if (fullIndex !== -1) {
        this.fullDataset[fullIndex].completed = completed;
      }
    }

    if (this.localTodos !== null) {
      const localIndex = this.localTodos.findIndex(todo => todo.id === itemId);
      if (localIndex !== -1) {
        this.localTodos[localIndex].completed = completed;
      }
    }

    return delay({id: itemId, success: true}, 300);
  }

  async deleteTodo(itemId: string): Promise<Response> {
    if (this.fullDataset !== null) {
      this.fullDataset = this.fullDataset.filter(todo => todo.id !== itemId);
    }

    if (this.localTodos !== null) {
      this.localTodos = this.localTodos.filter(todo => todo.id !== itemId);
    }

    return delay({id: itemId, success: true}, 400);
  }

  async deleteAllTodos(): Promise<Response> {
    this.fullDataset = [];
    this.localTodos = [];
    return delay({id: 'all', success: true}, 600);
  }

  getTotalCount(): number {
    return this.fullDataset?.length || 0;
  }

  getListId(): string {
    return this.listId;
  }
}
