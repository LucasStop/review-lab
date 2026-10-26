import { Linking, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '../theme';
import type { Block, Inline } from '../utils/sanitizeHtml';

// Só desenha o que o sanitizeHtml já filtrou: texto, ênfase, código e links http(s). Nada daqui
// executa o conteúdo do PR (ADR 0001).
function Spans({ content }: { content: Inline[] }) {
  return content.map((span, index) => {
    const style = [
      span.bold && styles.bold,
      span.italic && styles.italic,
      span.code && styles.inlineCode,
      span.href && styles.link,
    ];
    const href = span.href;
    return (
      <Text
        key={index}
        style={style}
        accessibilityRole={href ? 'link' : undefined}
        onPress={href ? () => void Linking.openURL(href) : undefined}
      >
        {span.text}
      </Text>
    );
  });
}

export function BodyBlocks({ blocks }: { blocks: Block[] }) {
  return (
    <View style={styles.container}>
      {blocks.map((block, index) => {
        switch (block.type) {
          case 'paragraph':
            return (
              <Text key={index} style={styles.text}>
                <Spans content={block.content} />
              </Text>
            );
          case 'heading':
            return (
              <Text key={index} style={styles.heading} accessibilityRole="header">
                <Spans content={block.content} />
              </Text>
            );
          case 'quote':
            return (
              <Text key={index} style={[styles.text, styles.quote]}>
                <Spans content={block.content} />
              </Text>
            );
          case 'code':
            return (
              <Text key={index} style={styles.codeBlock}>
                {block.text}
              </Text>
            );
          case 'list':
            return (
              <View key={index} style={styles.list}>
                {block.items.map((item, i) => (
                  <View key={i} style={styles.item}>
                    <Text style={styles.text}>{block.ordered ? `${i + 1}.` : '•'}</Text>
                    <Text style={[styles.text, styles.itemText]}>
                      <Spans content={item} />
                    </Text>
                  </View>
                ))}
              </View>
            );
        }
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.md },
  text: { ...typography.body, color: colors.text },
  heading: { ...typography.heading, color: colors.text },
  bold: { fontWeight: '700' },
  italic: { fontStyle: 'italic' },
  link: { color: colors.link, textDecorationLine: 'underline' },
  inlineCode: { fontFamily: 'Menlo', backgroundColor: colors.surface },
  quote: {
    color: colors.textMuted,
    borderLeftWidth: spacing.xs,
    borderLeftColor: colors.border,
    paddingLeft: spacing.md,
  },
  codeBlock: {
    ...typography.caption,
    fontFamily: 'Menlo',
    color: colors.text,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  list: { gap: spacing.xs },
  item: { flexDirection: 'row', gap: spacing.sm },
  itemText: { flex: 1 },
});
