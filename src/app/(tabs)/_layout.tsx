import { MaterialIcons } from '@expo/vector-icons';
import { Link, Tabs } from 'expo-router';
import { Pressable, StyleSheet, type ColorValue } from 'react-native';

import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';

const ICON = {
  TAB_SIZE: 26,
  HEADER_SIZE: 24,
  /** iOS HIG 44pt / Material 48dp dokunma hedefini saglayan padding */
  HEADER_TOUCH_PADDING: 12,
  PRESSED_OPACITY: 0.5,
} as const;

type MaterialIconName = React.ComponentProps<typeof MaterialIcons>['name'];

function tabIcon(name: MaterialIconName) {
  return function TabIcon({ color }: { color: ColorValue }) {
    return <MaterialIcons name={name} size={ICON.TAB_SIZE} color={color} />;
  };
}

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme];

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.tint,
        tabBarInactiveTintColor: theme.tabIconDefault,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Oyna',
          tabBarIcon: tabIcon('grid-view'),
          headerRight: () => (
            <Link href="/modal" asChild>
              {/* Erisilebilir ad Pressable'a veriliyor: ikon bileseni Android'de
                  accessibility prop'larini iletmez, etiket sessizce kaybolur. */}
              <Pressable
                accessibilityLabel="Hakkında"
                accessibilityHint="Oyun hakkında bilgi ekranını açar"
                style={styles.headerButton}
              >
                {({ pressed }) => (
                  <MaterialIcons
                    name="info-outline"
                    size={ICON.HEADER_SIZE}
                    color={theme.text}
                    style={{ opacity: pressed ? ICON.PRESSED_OPACITY : 1 }}
                  />
                )}
              </Pressable>
            </Link>
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Ayarlar',
          tabBarIcon: tabIcon('settings'),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  headerButton: {
    padding: ICON.HEADER_TOUCH_PADDING,
    marginRight: 3,
  },
});
