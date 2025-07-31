import React, {useState, use} from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  useColorScheme,
} from 'react-native';
import {Colors} from 'react-native/Libraries/NewAppScreen';

import TodoTextField from './TodoInput';
import {TodoDataManager, TodoItem} from '../data/TodoDataManager';

type Props = {
  todos: TodoItem[];
  onAddTodo: (text: string) => void;
  onToggleTodo: (id: string) => void;
  onDeleteTodo: (id: string) => void;
};

export default function TodoView({
  todos,
  onAddTodo,
  onToggleTodo,
  onDeleteTodo,
}: Props) {
  const isDarkMode = useColorScheme() === 'dark';

  const renderTodoItem = ({item}: {item: TodoItem}) => (
    <View style={styles.todoItem}>
      <TouchableOpacity
        style={[styles.checkbox, item.completed && styles.checkboxChecked]}
        onPress={() => onToggleTodo(item.id)}
      />
      <Text
        style={[
          styles.todoText,
          item.completed && styles.todoTextCompleted,
          {color: isDarkMode ? Colors.white : Colors.black},
        ]}>
        {item.text}
      </Text>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => onDeleteTodo(item.id)}>
        <Text style={styles.deleteButtonText}>✕</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <>
      <TodoTextField onAddTodo={onAddTodo} />
      {todos.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, {color: isDarkMode ? Colors.light : Colors.dark}]}>
            No todos yet. Add one above!
          </Text>
        </View>
      ) : (
        <FlatList
          data={todos}
          renderItem={renderTodoItem}
          keyExtractor={item => item.id}
          style={styles.list}
        />
      )}
    </>
  );
};

const styles = StyleSheet.create({
  list: {
    flex: 1,
  },
  todoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#2196F3',
    marginRight: 12,
  },
  checkboxChecked: {
    backgroundColor: '#2196F3',
  },
  todoText: {
    flex: 1,
    fontSize: 16,
  },
  todoTextCompleted: {
    textDecorationLine: 'line-through',
    opacity: 0.6,
  },
  deleteButton: {
    padding: 8,
  },
  deleteButtonText: {
    color: '#ff6b6b',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
});
