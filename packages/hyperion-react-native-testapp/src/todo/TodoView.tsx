import React, {useState, useEffect, useCallback, useRef} from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  useColorScheme,
  ActivityIndicator,
  ListRenderItem,
  Animated,
} from 'react-native';
import {Colors} from 'react-native/Libraries/NewAppScreen';

import AddTodoBottomSheet from './AddTodoBottomSheet';
import AddTodoFloatingButton from './AddTodoFloatingButton';
import DeleteAllFloatingButton from './DeleteAllFloatingButton';
import {IndividualTodoListManager, TodoItem, PaginatedResponse} from '../data/TodoDataManager';
import { SurfaceComp } from '../hyperion/Surface';

type Props = {
  listId: string;
  listManager: IndividualTodoListManager;
  listName?: string;
};

export default function TodoView({
  listId,
  listManager,
  listName
}: Props) {
  const isDarkMode = useColorScheme() === 'dark';

  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [isBottomSheetVisible, setIsBottomSheetVisible] = useState(false);
  const [isMenuExpanded, setIsMenuExpanded] = useState(false);

  const menuRotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let isMounted = true;

    const loadFirstPage = async () => {
      try {
        setIsLoading(true);
        setTodos([]);
        setCurrentPage(1);
        setHasNextPage(true);

        const response: PaginatedResponse = await listManager.fetchFirstPage();

        if (isMounted) {
          setTodos(response.items);
          setHasNextPage(response.hasNextPage);
          setCurrentPage(response.currentPage);
          setTotalItems(response.totalItems);
        }
      } catch (error) {
        console.error(`Error loading first page for ${listId}:`, error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadFirstPage();

    return () => {
      isMounted = false;
    };
  }, [listId, listManager]);

  const loadMoreItems = useCallback(async () => {
    if (isLoadingMore || !hasNextPage) {
      return;
    }

    try {
      setIsLoadingMore(true);

      const response: PaginatedResponse = await listManager.loadMoreTodos(currentPage);

      setTodos(prevTodos => [...prevTodos, ...response.items]);
      setHasNextPage(response.hasNextPage);
      setCurrentPage(response.currentPage);
      setTotalItems(response.totalItems);
    } catch (error) {
      console.error(`Error loading more items for ${listId}:`, error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, hasNextPage, currentPage, listId, listManager]);

  const handleEndReached = useCallback(() => {
    if (!isLoadingMore && hasNextPage) {
      loadMoreItems();
    }
  }, [isLoadingMore, hasNextPage, loadMoreItems]);

  const addTodo = async (text: string, description?: string) => {
    const newTodo = await listManager.addTodo(text, description);
    setTodos(prevTodos => [...prevTodos, newTodo]);
    setTotalItems(prev => prev + 1);
  };

  const toggleTodo = async (id: string) => {
    const todo = todos.find(t => t.id === id);
    if (todo) {
      setTodos(prevTodos =>
        prevTodos.map(todo =>
          todo.id === id ? {...todo, completed: !todo.completed} : todo,
        ),
      );

      try {
        await listManager.toggleTodo(id, !todo.completed);
      } catch (error) {
        console.error('Failed to toggle todo:', error);
        setTodos(prevTodos =>
          prevTodos.map(todo =>
            todo.id === id ? {...todo, completed: todo.completed} : todo,
          ),
        );
      }
    }
  };

  const deleteTodo = async (id: string) => {
    await listManager.deleteTodo(id);
    setTodos(prevTodos => prevTodos.filter(todo => todo.id !== id));
    setTotalItems(prev => prev - 1);
  };

  const handleDeleteAllPress = async () => {
    await listManager.deleteAllTodos();
    setTodos([]);
    setTotalItems(0);
    setCurrentPage(1);
    setHasNextPage(false);
  };

  const toggleMenu = () => {
    const toValue = isMenuExpanded ? 0 : 1;
    setIsMenuExpanded(!isMenuExpanded);

    Animated.timing(menuRotation, {
      toValue,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const renderTodoItem: ListRenderItem<TodoItem> = ({item, index}) => (
    <SurfaceComp
      surface={`todo-item-${item.text}(${item.id})`}
      metadata={{
        todoId: item.id,
        text: item.text,
        description: item.description,
        completed: item.completed,
        index: index,
        listId: listId,
        page: Math.floor(index / 10) + 1,
        timestamp: Date.now()
      }}
    >
      <View style={styles.todoItem}>
        <TouchableOpacity
          style={[styles.checkbox, item.completed && styles.checkboxChecked]}
          onPress={() => toggleTodo(item.id)}
        />
        <View style={styles.todoContent}>
          <Text
            style={[
              styles.todoTitle,
              item.completed && styles.todoTextCompleted,
              {color: isDarkMode ? Colors.white : Colors.black},
            ]}>
            {item.text}
          </Text>
          {item.description && (
            <Text
              style={[
                styles.todoDescription,
                item.completed && styles.todoTextCompleted,
                {color: isDarkMode ? Colors.light : Colors.dark},
              ]}>
              {item.description}
            </Text>
          )}
        </View>
        <TouchableOpacity id='deleteButton'
          style={styles.deleteButton}
          onPress={() => deleteTodo(item.id)}>
          <Text style={styles.deleteButtonText}>✕</Text>
        </TouchableOpacity>
      </View>
    </SurfaceComp>
  );

  const renderFooter = () => {
    if (!isLoadingMore) return null;

    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#2196F3" />
        <Text style={[styles.footerLoaderText, {color: isDarkMode ? Colors.light : Colors.dark}]}>
          Loading more items...
        </Text>
      </View>
    );
  };

  return (
    <SurfaceComp
      surface={`todo-list-${listName}(${listId})`}
      metadata={{
        listId: listId,
        totalItems: totalItems,
        loadedItems: todos.length,
        completedItems: todos.filter(todo => todo.completed).length,
        currentPage: currentPage,
        hasNextPage: hasNextPage,
        timestamp: Date.now()
      }}
    >
      <View style={styles.container}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2196F3" />
            <Text style={[styles.loadingText, {color: isDarkMode ? Colors.light : Colors.dark}]}>
              Loading todos...
            </Text>
          </View>
        ) : todos.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, {color: isDarkMode ? Colors.light : Colors.dark}]}>
              No items in this list yet.
            </Text>
            <Text style={[styles.emptySubtext, {color: isDarkMode ? Colors.light : Colors.dark}]}>
              Tap the + button to add your first todo!
            </Text>
          </View>
        ) : (
          <View style={styles.listContainer}>
            <View style={styles.statsContainer}>
              <Text style={[styles.statsText, {color: isDarkMode ? Colors.light : Colors.dark}]}>
                {todos.filter(todo => todo.completed).length} of {todos.length} completed
              </Text>
              <Text style={[styles.paginationText, {color: isDarkMode ? Colors.light : Colors.dark}]}>
                Showing {todos.length} of {totalItems} items
                {hasNextPage && ' (scroll for more)'}
              </Text>
            </View>

            <FlatList
              data={todos}
              renderItem={renderTodoItem}
              keyExtractor={item => item.id}
              style={styles.list}
              showsVerticalScrollIndicator={true}
              onEndReached={handleEndReached}
              onEndReachedThreshold={0.2}
              ListFooterComponent={renderFooter}
              removeClippedSubviews={true}
              maxToRenderPerBatch={10}
              updateCellsBatchingPeriod={50}
              initialNumToRender={10}
              windowSize={21}
            />
          </View>
        )}

        {/* Floating Action Buttons */}
        <View style={styles.fabContainer}>
          {isMenuExpanded && (
            <AddTodoFloatingButton
              listId={listId}
              onPress={() => {
                setIsBottomSheetVisible(true);
                toggleMenu();
              }}
              style={[styles.fab, { position: 'absolute', bottom: 80, right: 0 }]}
            />
          )}

          {isMenuExpanded && todos.length > 0 && (
            <DeleteAllFloatingButton
              listId={listId}
              itemCount={todos.length}
              onPress={() => {
                handleDeleteAllPress();
                toggleMenu();
              }}
              style={[styles.fab, { position: 'absolute', bottom: 140, right: 0 }]}
            />
          )}

          <SurfaceComp
            surface="menu-floating-action-button"
            metadata={{
              listId: listId,
              isExpanded: isMenuExpanded,
              timestamp: Date.now()
            }}
          >
            <Animated.View
              style={[
                styles.fab,
                styles.menuFab,
                {
                  transform: [
                    {
                      rotate: menuRotation.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0deg', '45deg'],
                      }),
                    },
                  ],
                }
              ]}
            >
              <TouchableOpacity
                style={[
                  styles.fabButton,
                  {
                    backgroundColor: isDarkMode ? '#6C757D' : '#495057',
                    shadowColor: isDarkMode ? '#000' : '#495057',
                  }
                ]}
                onPress={toggleMenu}
                activeOpacity={0.8}
              >
                <Text style={styles.fabText}>⋯</Text>
              </TouchableOpacity>
            </Animated.View>
          </SurfaceComp>
        </View>

        <AddTodoBottomSheet
          isVisible={isBottomSheetVisible}
          onClose={() => setIsBottomSheetVisible(false)}
          onAddTodo={addTodo}
        />

      </View>
    </SurfaceComp>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContainer: {
    flex: 1,
  },
  statsContainer: {
    padding: 16,
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  statsText: {
    fontSize: 14,
    fontWeight: '600',
  },
  paginationText: {
    fontSize: 12,
    marginTop: 4,
    fontStyle: 'italic',
  },
  list: {
    flex: 1,
  },
  todoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#ffffff',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#2196F3',
    marginRight: 12,
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: '#2196F3',
  },
  todoContent: {
    flex: 1,
    paddingRight: 8,
  },
  todoTitle: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
    marginBottom: 4,
  },
  todoDescription: {
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.8,
  },
  todoTextCompleted: {
    textDecorationLine: 'line-through',
    opacity: 0.5,
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
    fontStyle: 'italic',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.7,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
  },
  footerLoader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8f9fa',
  },
  footerLoaderText: {
    marginLeft: 8,
    fontSize: 14,
  },
  fabContainer: {
    position: 'absolute',
    bottom: 20,
    right: 20,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fabButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  menuFab: {
    position: 'absolute',
    bottom: 0,
    right: 0,
  },
  fabText: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '300',
    lineHeight: 28,
  },
});
