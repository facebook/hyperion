import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  useColorScheme,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import {Colors} from 'react-native/Libraries/NewAppScreen';
import { SurfaceComp } from '../hyperion/Surface';

interface Props {
  isVisible: boolean;
  onClose: () => void;
  onAddTodo: (title: string, description?: string) => void;
}

const { height: screenHeight } = Dimensions.get('window');

export default function AddTodoBottomSheet({ isVisible, onClose, onAddTodo }: Props) {
  const isDarkMode = useColorScheme() === 'dark';
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const slideAnim = useRef(new Animated.Value(screenHeight)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    if (isVisible) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 65,
          friction: 11,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 65,
          friction: 11,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: screenHeight,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.95,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isVisible, slideAnim, opacityAnim, scaleAnim]);

  const handleAddTodo = () => {
    if (title.trim()) {
      onAddTodo(title.trim(), description.trim());
      setTitle('');
      setDescription('');
      onClose();
    }
  };

  const handleCancel = () => {
    setTitle('');
    setDescription('');
    onClose();
  };

  const handleBackdropPress = () => {
    handleCancel();
  };

  if (!isVisible) {
    return null;
  }

  return (
    <Modal
      visible={isVisible}
      transparent={true}
      animationType="none"
      onRequestClose={handleCancel}
      statusBarTranslucent={true}
    >
      <SafeAreaView style={styles.modalContainer}>
          <TouchableOpacity
            style={styles.backdropTouchable}
            onPress={handleBackdropPress}
            activeOpacity={1}
          />

        <Animated.View
          style={[
            styles.bottomSheet,
            {
              backgroundColor: isDarkMode ? '#1c1c1e' : '#ffffff',
              transform: [
                { translateY: slideAnim },
                { scale: scaleAnim }
              ],
            },
          ]}
        >
          <SurfaceComp
            surface="add-todo-bottom-sheet"
            metadata={{
              isVisible: isVisible,
              timestamp: Date.now()
            }}
          >
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={styles.keyboardAvoidingView}
              keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
            >
              <View style={[
                styles.header,
                { borderBottomColor: isDarkMode ? '#2c2c2e' : '#e0e0e0' }
              ]}>
                <View style={[
                  styles.dragHandle,
                  { backgroundColor: isDarkMode ? '#48484a' : '#c6c6c8' }
                ]} />
                <Text style={[
                  styles.headerTitle,
                  { color: isDarkMode ? Colors.white : Colors.black }
                ]}>
                  Add New Todo Item
                </Text>
              </View>

              <ScrollView
                style={styles.scrollContent}
                contentContainerStyle={styles.scrollContentContainer}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                bounces={false}
              >

                <SurfaceComp surface="add-todo-list-title">
                <View style={styles.inputContainer}>
                  <View style={styles.inputSection}>
                    <Text style={[
                      styles.inputLabel,
                      { color: isDarkMode ? Colors.light : Colors.dark }
                    ]}>
                      Title *
                    </Text>
                    <TextInput
                      style={[
                        styles.titleInput,
                        {
                          backgroundColor: isDarkMode ? '#2c2c2e' : '#f2f2f7',
                          color: isDarkMode ? Colors.white : Colors.black,
                          borderColor: isDarkMode ? '#38383a' : '#d1d1d6',
                        }
                      ]}
                      value={title}
                      onChangeText={setTitle}
                      placeholder="Enter todo title..."
                      placeholderTextColor={isDarkMode ? '#8e8e93' : '#8e8e93'}
                      autoCorrect={false}
                      returnKeyType="next"
                      maxLength={100}
                      autoFocus={true}
                      selectionColor={isDarkMode ? '#0a84ff' : '#007aff'}
                    />
                  </View>

                  <View style={styles.inputSection}>
                    <Text style={[
                      styles.inputLabel,
                      { color: isDarkMode ? Colors.light : Colors.dark }
                    ]}>
                      Description (Optional)
                    </Text>
                    <TextInput
                      style={[
                        styles.descriptionInput,
                        {
                          backgroundColor: isDarkMode ? '#2c2c2e' : '#f2f2f7',
                          color: isDarkMode ? Colors.white : Colors.black,
                          borderColor: isDarkMode ? '#38383a' : '#d1d1d6',
                        }
                      ]}
                      value={description}
                      onChangeText={setDescription}
                      placeholder="Add a detailed description of what needs to be done..."
                      placeholderTextColor={isDarkMode ? '#8e8e93' : '#8e8e93'}
                      autoCorrect={true}
                      multiline={true}
                      numberOfLines={4}
                      returnKeyType="done"
                      onSubmitEditing={handleAddTodo}
                      maxLength={500}
                      textAlignVertical="top"
                      selectionColor={isDarkMode ? '#0a84ff' : '#007aff'}
                    />
                    <Text style={[
                      styles.characterCount,
                      { color: isDarkMode ? '#8e8e93' : '#8e8e93' }
                    ]}>
                      {description.length}/500 characters
                    </Text>
                  </View>
                </View>
                </SurfaceComp>
              </ScrollView>

              {/* Fixed Footer Buttons */}
              <View style={[
                styles.footer,
                {
                  borderTopColor: isDarkMode ? '#2c2c2e' : '#e0e0e0',
                  backgroundColor: isDarkMode ? '#1c1c1e' : '#ffffff',
                }
              ]}>
                <TouchableOpacity
                  style={[
                    styles.button,
                    styles.cancelButton,
                    {
                      backgroundColor: isDarkMode ? '#2c2c2e' : '#f2f2f7',
                      borderColor: isDarkMode ? '#38383a' : '#d1d1d6',
                    }
                  ]}
                  onPress={handleCancel}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.buttonText,
                    { color: isDarkMode ? Colors.light : Colors.dark }
                  ]}>
                    Cancel
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.button,
                    {
                      backgroundColor: !title.trim()
                        ? (isDarkMode ? '#2c2c2e' : '#e5e5ea')
                        : (isDarkMode ? '#0a84ff' : '#007aff'),
                    }
                  ]}
                  onPress={handleAddTodo}
                  disabled={!title.trim()}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.buttonText,
                    {
                      color: !title.trim()
                        ? (isDarkMode ? '#8e8e93' : '#8e8e93')
                        : '#ffffff'
                    }
                  ]}>
                    Add Todo Item
                  </Text>
                </TouchableOpacity>
              </View>
            </KeyboardAvoidingView>
          </SurfaceComp>
        </Animated.View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  backdropTouchable: {
    flex: 1,
  },
  bottomSheet: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    height: screenHeight * 0.60,
    elevation: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  dragHandle: {
    width: 36,
    height: 5,
    borderRadius: 3,
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: -0.4,
  },
  scrollContent: {
    flex: 1,
  },
  scrollContentContainer: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  inputContainer: {
    padding: 24,
  },
  inputSection: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    letterSpacing: -0.2,
  },
  titleInput: {
    fontSize: 17,
    fontWeight: '400',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    minHeight: 52,
    lineHeight: 22,
  },
  descriptionInput: {
    fontSize: 16,
    fontWeight: '400',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    minHeight: 120,
    maxHeight: 200,
    lineHeight: 22,
  },
  characterCount: {
    fontSize: 13,
    textAlign: 'right',
    marginTop: 8,
    fontWeight: '400',
  },
  tipsSection: {
    marginTop: 12,
    padding: 16,
    backgroundColor: 'rgba(0, 122, 255, 0.08)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 122, 255, 0.2)',
  },
  tipsTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 6,
  },
  tipsText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingVertical: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    gap: 12,
    borderTopWidth: 1,
  },
  button: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  cancelButton: {
    borderWidth: 1,
  },
  buttonText: {
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.4,
  },
});
