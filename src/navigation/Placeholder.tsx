import { StyleSheet, Text, View } from 'react-native';

// Tela vazia até a issue da tela real entrar; cada uma substitui o seu uso em AuthStack/AppStack.
export function placeholder(title: string) {
  return function PlaceholderScreen() {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>{title}</Text>
      </View>
    );
  };
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 18 },
});
