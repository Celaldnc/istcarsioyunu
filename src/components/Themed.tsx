/**
 * Temaya duyarli temel bilesenler.
 * https://docs.expo.dev/guides/color-schemes/
 */
import { Text as DefaultText, View as DefaultView, StyleSheet } from 'react-native';

import { useColorScheme } from './useColorScheme';

import Colors from '@/constants/Colors';

type ThemeProps = {
  lightColor?: string;
  darkColor?: string;
};

export type TextProps = ThemeProps & DefaultText['props'];
export type ViewProps = ThemeProps & DefaultView['props'];

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: keyof typeof Colors.light & keyof typeof Colors.dark,
) {
  const theme = useColorScheme();
  const colorFromProps = props[theme];

  // Truthy degil, tanimlilik kontrolu: bos string bilincli bir deger olabilir.
  if (colorFromProps !== undefined) {
    return colorFromProps;
  }
  return Colors[theme][colorName];
}

export function Text(props: TextProps) {
  const { style, lightColor, darkColor, ...otherProps } = props;
  const color = useThemeColor({ light: lightColor, dark: darkColor }, 'text');

  return <DefaultText style={[{ color }, style]} {...otherProps} />;
}

export function View(props: ViewProps) {
  const { style, lightColor, darkColor, ...otherProps } = props;
  const backgroundColor = useThemeColor({ light: lightColor, dark: darkColor }, 'background');

  return <DefaultView style={[{ backgroundColor }, style]} {...otherProps} />;
}

/**
 * Ekran basligi. Gorsel olarak baslik olmak yetmez; ekran okuyucularin
 * baslik gezinmesi (VoiceOver rotor / TalkBack headings) icin rol gerekir.
 */
export function Heading(props: TextProps) {
  const { style, ...otherProps } = props;
  return <Text accessibilityRole="header" style={[styles.heading, style]} {...otherProps} />;
}

/** Temaya duyarli yatay ayrac. Rengi Colors.separator token'indan gelir. */
export function Separator(props: ViewProps) {
  const { style, lightColor, darkColor, ...otherProps } = props;
  const backgroundColor = useThemeColor({ light: lightColor, dark: darkColor }, 'separator');

  return (
    <DefaultView
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.separator, { backgroundColor }, style]}
      {...otherProps}
    />
  );
}

const styles = StyleSheet.create({
  heading: { fontSize: 24, fontWeight: 'bold' },
  separator: { marginVertical: 24, height: 1, width: '80%' },
});
