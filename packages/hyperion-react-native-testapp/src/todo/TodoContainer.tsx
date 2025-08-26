import React, {Suspense, use, useState, useRef} from 'react';
import {
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  useColorScheme,
  TouchableOpacity,
  FlatList,
  TextInput,
} from 'react-native';
import {Colors} from 'react-native/Libraries/NewAppScreen';
import { SurfaceComp } from '../hyperion/Surface';

import { TodoListMetaManager, TodoListMeta, IndividualTodoListManager } from '../data/TodoDataManager';
import TodoView from './TodoView';

const LoadingFallback = () => {
  const isDarkMode = useColorScheme() === 'dark';
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#2196F3" />
      <Text style={[styles.loadingText, {color: isDarkMode ? Colors.white : Colors.black}]}>
        Loading todo lists...
      </Text>
    </View>
  );
};

const TodoContainer = () => {
  const isDarkMode = useColorScheme() === 'dark';

  const initialTodoListMetas = use(TodoListMetaManager.fetchTodoListMetas());

  const [todoListMetas, setTodoListMetas] = useState<TodoListMeta[]>(initialTodoListMetas);
  const [activeTabId, setActiveTabId] = useState<string>(initialTodoListMetas[0]?.id || '');
  const [activeTabName, setActiveTabName] = useState<string>(initialTodoListMetas[0]?.name || '');
  const [newListName, setNewListName] = useState('');

  const listManagersRef = useRef<Map<string, IndividualTodoListManager>>(new Map());

  const getListManager = (listId: string): IndividualTodoListManager => {
    if (!listManagersRef.current.has(listId)) {
      const newManager = new IndividualTodoListManager(listId);
      listManagersRef.current.set(listId, newManager);
    }
    return listManagersRef.current.get(listId)!;
  };

  const addTodoList = async (name: string) => {
    const newTodoListMeta = await TodoListMetaManager.addTodoListMeta(name);
    setTodoListMetas([...todoListMetas, newTodoListMeta]);
    setActiveTabId(newTodoListMeta.id);
  };

  const deleteTodoList = async (listId: string) => {
    await TodoListMetaManager.deleteTodoListMeta(listId);
    setTodoListMetas(todoListMetas.filter(meta => meta.id !== listId));

    listManagersRef.current.delete(listId);

    if (activeTabId === listId && todoListMetas.length > 1) {
      const remainingLists = todoListMetas.filter(meta => meta.id !== listId);
      if (remainingLists.length > 0) {
        setActiveTabId(remainingLists[0].id);
      }
    }
  };

  const switchTab = (listId: string) => {
    const selectedList = todoListMetas.find(meta => meta.id === listId);
    setActiveTabId(listId);
    setActiveTabName(selectedList?.name || '');
  };

  const renderTab = ({item}: {item: TodoListMeta}) => (
    <SurfaceComp
      surface={`tab-${item.name}`}
      metadata={{
        tabId: item.id,
        tabName: item.name,
        isActive: activeTabId === item.id,
        timestamp: Date.now()
      }}
    >
      <TouchableOpacity
        style={[
          styles.tab,
          activeTabId === item.id && styles.activeTab,
          {
            backgroundColor: activeTabId === item.id
              ? (isDarkMode ? '#4A90E2' : '#2196F3')
              : (isDarkMode ? '#2c2c2c' : '#f5f5f5')
          }
        ]}
        onPress={() => switchTab(item.id)}
      >
        <Text
          style={[
            styles.tabText,
            activeTabId === item.id && styles.activeTabText,
            {
              color: activeTabId === item.id
                ? 'white'
                : (isDarkMode ? Colors.white : Colors.black)
            }
          ]}
        >
          {item.name}
        </Text>
          <TouchableOpacity
            style={styles.deleteTabButton}
            onPress={() => deleteTodoList(item.id)}
            hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
          >
            <Text style={styles.deleteTabButtonText}>×</Text>
          </TouchableOpacity>
      </TouchableOpacity>
    </SurfaceComp>
  );

  return (
    <SurfaceComp surface="todo-container">
      <View style={styles.container}>
        <SurfaceComp surface="header">
          <View style={styles.header}>
            <Text style={[styles.title, {color: isDarkMode ? Colors.white : Colors.black}]}>
              Todo Lists
            </Text>
          </View>
        </SurfaceComp>

        <SurfaceComp surface="add-list-section">
          <View style={styles.addListSection}>
            <View style={styles.addListInputContainer}>
              <TextInput
                style={styles.addListInput}
                value={newListName}
                onChangeText={setNewListName}
                placeholder="Enter new list name..."
                placeholderTextColor="#888"
                onSubmitEditing={() => {
                  if (newListName.trim()) {
                    addTodoList(newListName.trim());
                    setNewListName('');
                  }
                }}
                returnKeyType="done"
                maxLength={50}
              />
              <Text style={[styles.addListLabel, {color: isDarkMode ? Colors.light : Colors.dark}]}>
                Add New List
              </Text>
            </View>
          </View>
        </SurfaceComp>

        <SurfaceComp surface="todo-tabs">
          <View style={styles.tabsSection}>
            <FlatList
              data={todoListMetas}
              renderItem={renderTab}
              keyExtractor={item => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.tabsList}
              contentContainerStyle={styles.tabsListContent}
            />
          </View>
        </SurfaceComp>

        <SurfaceComp surface="active-todo-list">
          <View style={styles.contentContainer}>
            {activeTabId ? (
              <TodoView
                listId={activeTabId}
                listManager={getListManager(activeTabId)}
                listName={activeTabName}
              />
            ) : (
              <View style={styles.noTabsContainer}>
                <Text style={[styles.noTabsText, {color: isDarkMode ? Colors.light : Colors.dark}]}>
                  No todo lists available. Create one above!
                </Text>
              </View>
            )}
          </View>
        </SurfaceComp>
      </View>
    </SurfaceComp>
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
  addListSection: {
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  addListInputContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  addListInput: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: 8,
  },
  addListLabel: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    color: '#666',
  },
  tabsSection: {
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tabsList: {
    maxHeight: 60,
  },
  tabsListContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginRight: 8,
    borderRadius: 25,
    minWidth: 120,
    justifyContent: 'center',
  },
  activeTab: {
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
  },
  activeTabText: {
    fontWeight: 'bold',
  },
  deleteTabButton: {
    marginLeft: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteTabButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    lineHeight: 18,
  },
  contentContainer: {
    flex: 1,
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
  noTabsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  noTabsText: {
    fontSize: 16,
    textAlign: 'center',
  },
});

export default function TodoContainerWrapper() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <TodoContainer />
    </Suspense>
  );
}
