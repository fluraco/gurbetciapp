import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  Platform,
  useColorScheme,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';

const { width } = Dimensions.get('window');

interface TabItem {
  id: string;
  icon: string;
  label: string;
  activeColor?: string;
}

interface LiquidBottomBarProps {
  tabs?: TabItem[];
  activeTab?: string;
  onTabPress?: (tabId: string) => void;
}

const defaultTabs: TabItem[] = [
  { id: 'news', icon: 'newspaper-sharp', label: 'Haberler', activeColor: '#FF6B6B' },
  { id: 'ads', icon: 'cart-sharp', label: 'İlanlar', activeColor: '#4ECDC4' },
  { id: 'discover', icon: 'compass-sharp', label: 'Keşfet', activeColor: '#FFD93D' },
  { id: 'messages', icon: 'chatbubbles-sharp', label: 'Mesajlar', activeColor: '#9B59B6' },
];

export default function LiquidBottomBar({
  tabs = defaultTabs,
  activeTab = 'news',
  onTabPress,
}: LiquidBottomBarProps) {
  const insets = useSafeAreaInsets();
  const [pressedTab, setPressedTab] = useState<string | null>(null);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  // Animasyon için
  const slideAnimation = useRef(new Animated.Value(0)).current;
  const scaleAnimation = useRef(new Animated.Value(1)).current;

  // Düzeltilmiş renk sistemi
  const colors = {
    background: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.12)',
    border: isDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.15)',
    inactiveIcon: isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(255, 255, 255, 0.8)',
    activeIcon: isDark ? '#FFFFFF' : '#FFFFFF',
    shadowColor: isDark ? '#000' : '#000',
    ripple: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.3)',
    indicatorBg: isDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255, 255, 255, 0.4)',
  };

  // Aktif tab değiştiğinde animasyonu çalıştır
  useEffect(() => {
    const activeIndex = tabs.findIndex(tab => tab.id === activeTab);
    const containerWidth = width * 0.75;
    const tabWidth = containerWidth / tabs.length;
    const indicatorWidth = 62; // Daha geniş indicator genişliği
    const tabCenter = tabWidth / 2;
    const indicatorCenter = indicatorWidth / 2;
    
    Animated.spring(slideAnimation, {
      toValue: activeIndex * tabWidth + tabCenter - indicatorCenter,
      useNativeDriver: true,
      tension: 150,
      friction: 8,
    }).start();
  }, [activeTab, tabs]);

  const handleTabPress = (tabId: string) => {
    setPressedTab(tabId);
    
    // Basma animasyonu
    Animated.sequence([
      Animated.timing(scaleAnimation, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnimation, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
    
    setTimeout(() => setPressedTab(null), 200);
    onTabPress?.(tabId);
  };

  const renderTab = (tab: TabItem, index: number) => {
    const isActive = activeTab === tab.id;
    const isPressed = pressedTab === tab.id;
    const containerWidth = width * 0.75;
    const tabWidth = containerWidth / tabs.length;
    
    return (
      <View
        key={tab.id}
        style={[
          styles.tabItemContainer,
          { width: tabWidth }
        ]}
      >
        <TouchableOpacity
          style={[
            styles.tabItem,
            isPressed && styles.pressedTab,
          ]}
          onPress={() => handleTabPress(tab.id)}
          activeOpacity={0.6}
        >
          <Animated.View style={[
            styles.tabIconContainer,
            isPressed && { backgroundColor: colors.ripple },
            { transform: [{ scale: scaleAnimation }] }
          ]}>
            <Ionicons
              name={tab.icon as any}
              size={isActive ? 26 : 24}
              color={isActive ? colors.activeIcon : colors.inactiveIcon}
              style={[
                styles.tabIcon,
                isActive && styles.activeTabIcon,
              ]}
            />
          </Animated.View>
        </TouchableOpacity>
      </View>
    );
  };

  const containerWidth = width * 0.75; // %75 genişlik

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 12) }]}>
      <View style={[styles.liquidBar, { width: containerWidth, shadowColor: colors.shadowColor }]}>
        {/* Glassmorphism blur effect */}
        <BlurView
          intensity={60}
          style={styles.blurContainer}
          tint={isDark ? 'light' : 'dark'}
        />
        
        {/* Glassmorphism background overlay */}
        <View style={[styles.backgroundOverlay, { backgroundColor: colors.background }]} />
        
        {/* Animasyonlu sliding indicator */}
        <Animated.View
          style={[
            styles.slidingIndicator,
            {
              width: 62,
              backgroundColor: colors.indicatorBg,
              transform: [{ translateX: slideAnimation }],
            },
          ]}
        />
        
        {/* Tabs container */}
        <View style={styles.tabsContainer}>
          {tabs.map((tab, index) => renderTab(tab, index))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  liquidBar: {
    position: 'relative',
    marginBottom: 8,
    borderRadius: 35,
    overflow: 'hidden',
    height: 65,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 15,
        },
        shadowOpacity: 0.3,
        shadowRadius: 30,
      },
      android: {
        elevation: 20,
      },
    }),
  },
  blurContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 35,
  },
  backgroundOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 35,
  },

  slidingIndicator: {
    position: 'absolute',
    top: 8,
    height: 49,
    borderRadius: 25,
    zIndex: 1,
  },
  tabsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 0,
    backgroundColor: 'transparent',
    height: '100%',
  },
  tabItemContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 25,
    width: 62,
    height: 62,
    position: 'relative',
    transform: [{ scale: 1 }],
    zIndex: 2,
  },
  pressedTab: {
    transform: [{ scale: 0.9 }],
  },
  tabIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  tabIcon: {
    // Icon styles
  },
  activeTabIcon: {
    transform: [{ scale: 1.05 }],
  },
}); 