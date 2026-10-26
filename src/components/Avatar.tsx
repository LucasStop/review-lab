import { useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

import { colors, typography } from '../theme';
import { avatarColor, initialOf } from '../utils/avatar';

type Props = {
  uri?: string;
  name: string;
  size: number;
  // Falso quando o nome já aparece em texto ao lado: evita o leitor de tela ler duas vezes.
  accessible?: boolean;
};

export function Avatar({ uri, name, size, accessible = true }: Props) {
  // Imagem que falha (404, offline) cai no placeholder em vez de deixar um buraco no card.
  // `failedUri` guarda qual uri falhou: trocar a uri na mesma instância tenta a nova.
  const [failedUri, setFailedUri] = useState<string>();
  const failed = failedUri === uri;
  const box = { width: size, height: size, borderRadius: size / 2 };

  if (uri && !failed) {
    return (
      <Image
        key={uri}
        source={{ uri }}
        accessible={accessible}
        accessibilityLabel={accessible ? `Avatar de ${name}` : undefined}
        onError={() => setFailedUri(uri)}
        style={[box, styles.image]}
        testID="avatar.image"
      />
    );
  }

  return (
    <View
      accessible={accessible}
      accessibilityLabel={accessible ? `Avatar de ${name}` : undefined}
      style={[box, styles.placeholder, { backgroundColor: avatarColor(name) }]}
      testID="avatar.placeholder"
    >
      <Text style={[styles.initial, { fontSize: size / 2 }]}>{initialOf(name)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  image: { backgroundColor: colors.surface },
  placeholder: { alignItems: 'center', justifyContent: 'center' },
  initial: { color: colors.onPrimary, fontWeight: typography.heading.fontWeight },
});
