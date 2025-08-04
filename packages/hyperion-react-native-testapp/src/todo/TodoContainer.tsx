import React, {Suspense, use, useState} from 'react';
import {
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  useColorScheme,
} from 'react-native';
import {Colors} from 'react-native/Libraries/NewAppScreen';

import TodoListContent from './TodoView';
import { TodoDataManager, TodoItem } from '../data/TodoDataManager';



const LoadingFallback = () => {
  const isDarkMode = useColorScheme() === 'dark';
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#2196F3" />
      <Text style={[styles.loadingText, {color: isDarkMode ? Colors.white : Colors.black}]}>
        Loading todos...
      </Text>
    </View>
  );
};

const TodoContainer = () => {
  const isDarkMode = useColorScheme() === 'dark';

  const initialTodos = use(TodoDataManager.fetchTodos());

  const [todos, setTodos] = useState<TodoItem[]>(initialTodos);

  const addTodo = async (text: string) => {
    const newTodo = await TodoDataManager.addTodo(text);
    setTodos([...todos, newTodo]);
  };

  const toggleTodo = async (id: string) => {
    const todo = todos.find(t => t.id === id);
    if (todo) {
      await TodoDataManager.toggleTodo(id, !todo.completed);
      setTodos(
        todos.map(todo =>
          todo.id === id ? {...todo, completed: !todo.completed} : todo,
        ),
      );
    }
  };

  const deleteTodo = async (id: string) => {
    await TodoDataManager.deleteTodo(id);
    setTodos(todos.filter(todo => todo.id !== id));
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, {color: isDarkMode ? Colors.white : Colors.black}]}>
          Todo List
        </Text>
      </View>
      <Suspense fallback={<LoadingFallback />}>
        <TodoListContent
          todos={todos}
          onAddTodo={addTodo}
          onToggleTodo={toggleTodo}
          onDeleteTodo={deleteTodo}
        />
      </Suspense>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
});

export default function TodoContainerWrapper() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <TodoContainer />
    </Suspense>
  );
}
