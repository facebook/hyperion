import React, { useRef, useEffect } from 'react';
import { TouchableOpacity, Text, Animated, useColorScheme } from 'react-native';
import { SurfaceComp } from '../hyperion/Surface';

type Props = {
  listId: string;
  itemCount: number;
  onPress: () => void;
  style?: any;
};

export default function DeleteAllFloatingButton({ listId, itemCount, onPress, style }: Props) {
  const isDarkMode = useColorScheme() === 'dark';
  const mountAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animate in when component mounts
    Animated.timing(mountAnimation, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();

    // Cleanup animation when component unmounts
    return () => {
      Animated.timing(mountAnimation, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    };
  }, [mountAnimation]);

  return (
    <SurfaceComp
      surface="delete-all-floating-action-button"
      metadata={{
        listId: listId,
        itemCount: itemCount,
        timestamp: Date.now()
      }}
    >
      <Animated.View
        style={[
          style,
          {
            opacity: mountAnimation,
            transform: [
              {
                scale: mountAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.8, 1],
                }),
              },
            ],
          }
        ]}
      >
        <TouchableOpacity
          style={{
            width: 56,
            height: 56,
            borderRadius: 28,
            justifyContent: 'center',
            alignItems: 'center',
            elevation: 8,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 6,
            backgroundColor: isDarkMode ? '#ff6b6b' : '#ff3b30',
            shadowColor: isDarkMode ? '#000' : '#ff3b30',
          }}
          id='deleteButton'
          onPress={onPress}
          activeOpacity={0.8}
        >
          <Text style={{
            color: '#ffffff',
            fontSize: 24,
            fontWeight: '300',
            lineHeight: 28,
          }}>🗑</Text>
        </TouchableOpacity>
      </Animated.View>
    </SurfaceComp>
  );
}
