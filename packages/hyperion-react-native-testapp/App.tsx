/**
 * Todo List App with React Native
 *
 * @format
 */

import React from 'react';
import {
  SafeAreaView,
  useColorScheme,
} from 'react-native';
import {Colors} from 'react-native/Libraries/NewAppScreen';
import * as AutoLoggingWrapper from './src/hyperion/AutoLoggingWrapper';

import TodoList from './src/todo/TodoContainer';

AutoLoggingWrapper.init();

function App(): React.JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';

  const backgroundStyle = {
    backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
    flex: 1,
  };

  return (
    <SafeAreaView style={backgroundStyle}>
      <TodoList />
    </SafeAreaView>
  );
}

export default App;
