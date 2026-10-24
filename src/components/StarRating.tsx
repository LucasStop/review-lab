import { Pressable, StyleSheet, Text, View } from 'react-native';

const STARS = [1, 2, 3, 4, 5];

type Props = {
  value: number;
  onChange?: (value: number) => void;
};

export function StarRating({ value, onChange }: Props) {
  const readOnly = !onChange;

  return (
    <View
      accessible={readOnly}
      accessibilityLabel={readOnly ? `Nota ${value} de 5` : undefined}
      style={styles.row}
    >
      {STARS.map((star) => {
        const selected = star <= value;
        const glyph = <Text style={styles.star}>{selected ? '★' : '☆'}</Text>;

        if (readOnly) {
          return (
            <View key={star} style={styles.target}>
              {glyph}
            </View>
          );
        }

        return (
          <Pressable
            key={star}
            accessibilityRole="button"
            accessibilityLabel={`Dar nota ${star} de 5`}
            accessibilityState={{ selected: star === value }}
            onPress={() => onChange(star)}
            style={styles.target}
          >
            {glyph}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row' },
  target: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  star: { fontSize: 28 },
});
