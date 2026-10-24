import { StyleSheet, Text, View } from 'react-native';

type Props = {
  title: string;
  text?: string;
};

export function EmptyState({ title, text }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {text ? <Text style={styles.text}>{text}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 8 },
  title: { fontSize: 18, fontWeight: '600', textAlign: 'center' },
  text: { fontSize: 16, textAlign: 'center' },
});
