import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, glyph, touch } from '../theme';

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
      accessibilityRole={readOnly ? 'image' : undefined}
      accessibilityLabel={readOnly ? `Nota ${value} de 5` : undefined}
      style={styles.row}
    >
      {STARS.map((star) => {
        const selected = star <= value;
        const icon = <Text style={styles.star}>{selected ? '★' : '☆'}</Text>;

        if (readOnly) {
          return (
            <View key={star} style={styles.target}>
              {icon}
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
            {icon}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  // Com a fonte do sistema no máximo a estrela passa de 90pt e as 5 não cabem numa linha.
  row: { flexDirection: 'row', flexWrap: 'wrap' },
  target: {
    minWidth: touch.min,
    minHeight: touch.min,
    alignItems: 'center',
    justifyContent: 'center',
  },
  star: { fontSize: glyph.lg, color: colors.star },
});
