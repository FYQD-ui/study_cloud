import { Fragment } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { useStudyTheme } from '../theme/ThemeContext';
import type { AppPalette } from '../theme/colors';

type MarkdownBlock =
  | { type: 'code'; content: string }
  | { type: 'heading'; level: number; content: string }
  | { type: 'hr' }
  | { type: 'quote'; content: string }
  | { type: 'list'; ordered: boolean; items: string[] }
  | { type: 'paragraph'; content: string };

type MarkdownContentProps = {
  content: string;
};

function flushParagraph(blocks: MarkdownBlock[], lines: string[]) {
  if (lines.length === 0) {
    return;
  }

  blocks.push({ type: 'paragraph', content: lines.join('\n') });
  lines.length = 0;
}

function parseMarkdown(content: string): MarkdownBlock[] {
  const lines = content.replace(/\r\n/g, '\n').split('\n');
  const blocks: MarkdownBlock[] = [];
  const paragraphLines: string[] = [];
  let codeLines: string[] | null = null;

  for (const line of lines) {
    if (line.trim().startsWith('```')) {
      if (codeLines) {
        blocks.push({ type: 'code', content: codeLines.join('\n') });
        codeLines = null;
      } else {
        flushParagraph(blocks, paragraphLines);
        codeLines = [];
      }
      continue;
    }

    if (codeLines) {
      codeLines.push(line);
      continue;
    }

    const trimmed = line.trim();

    if (!trimmed) {
      flushParagraph(blocks, paragraphLines);
      continue;
    }

    const headingMatch = /^(#{1,6})\s+(.+)$/.exec(trimmed);
    if (headingMatch) {
      flushParagraph(blocks, paragraphLines);
      blocks.push({
        type: 'heading',
        level: headingMatch[1].length,
        content: headingMatch[2],
      });
      continue;
    }

    if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
      flushParagraph(blocks, paragraphLines);
      blocks.push({ type: 'hr' });
      continue;
    }

    if (trimmed.startsWith('>')) {
      flushParagraph(blocks, paragraphLines);
      blocks.push({ type: 'quote', content: trimmed.replace(/^>\s?/, '') });
      continue;
    }

    const unorderedMatch = /^[-*+]\s+(.+)$/.exec(trimmed);
    const orderedMatch = /^\d+[.)]\s+(.+)$/.exec(trimmed);
    if (unorderedMatch || orderedMatch) {
      flushParagraph(blocks, paragraphLines);
      const ordered = Boolean(orderedMatch);
      const contentText = unorderedMatch?.[1] ?? orderedMatch?.[1] ?? '';
      const previous = blocks[blocks.length - 1];

      if (previous?.type === 'list' && previous.ordered === ordered) {
        previous.items.push(contentText);
      } else {
        blocks.push({ type: 'list', ordered, items: [contentText] });
      }
      continue;
    }

    paragraphLines.push(line);
  }

  if (codeLines) {
    blocks.push({ type: 'code', content: codeLines.join('\n') });
  }

  flushParagraph(blocks, paragraphLines);
  return blocks;
}

function renderInline(text: string, styles: ReturnType<typeof createStyles>) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);

  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <Text key={`${part}-${index}`} style={styles.bold}>
          {part.slice(2, -2)}
        </Text>
      );
    }

    return <Fragment key={`${part}-${index}`}>{part}</Fragment>;
  });
}

export function MarkdownContent({ content }: MarkdownContentProps) {
  const { colors } = useStudyTheme();
  const styles = createStyles(colors);
  const blocks = parseMarkdown(content);

  if (!content.trim()) {
    return <Text style={styles.emptyText}>正文为空</Text>;
  }

  return (
    <View style={styles.container}>
      {blocks.map((block, index) => {
        if (block.type === 'heading') {
          const headingStyle =
            block.level === 1 ? styles.h1 : block.level === 2 ? styles.h2 : styles.h3;

          return (
            <Text key={index} style={[styles.heading, headingStyle]}>
              {renderInline(block.content, styles)}
            </Text>
          );
        }

        if (block.type === 'hr') {
          return <View key={index} style={styles.hr} />;
        }

        if (block.type === 'quote') {
          return (
            <View key={index} style={styles.quote}>
              <Text style={styles.quoteText}>{renderInline(block.content, styles)}</Text>
            </View>
          );
        }

        if (block.type === 'list') {
          return (
            <View key={index} style={styles.list}>
              {block.items.map((item, itemIndex) => (
                <View key={`${item}-${itemIndex}`} style={styles.listItem}>
                  <Text style={styles.bullet}>
                    {block.ordered ? `${itemIndex + 1}.` : '•'}
                  </Text>
                  <Text style={styles.paragraph}>{renderInline(item, styles)}</Text>
                </View>
              ))}
            </View>
          );
        }

        if (block.type === 'code') {
          return (
            <ScrollView key={index} horizontal style={styles.codeBlock}>
              <Text style={styles.codeText}>{block.content}</Text>
            </ScrollView>
          );
        }

        return (
          <Text key={index} style={styles.paragraph}>
            {renderInline(block.content, styles)}
          </Text>
        );
      })}
    </View>
  );
}

function createStyles(colors: AppPalette) {
  return StyleSheet.create({
    container: {
      gap: 12,
    },
    emptyText: {
      color: colors.mutedText,
      fontSize: 15,
      lineHeight: 24,
    },
    paragraph: {
      color: colors.text,
      fontSize: 16,
      lineHeight: 25,
    },
    bold: {
      fontWeight: '800',
      color: colors.text,
    },
    heading: {
      color: colors.text,
      fontWeight: '800',
      lineHeight: 30,
    },
    h1: {
      fontSize: 24,
    },
    h2: {
      fontSize: 21,
    },
    h3: {
      fontSize: 18,
    },
    hr: {
      height: 1,
      backgroundColor: colors.border,
      marginVertical: 4,
    },
    quote: {
      borderLeftWidth: 4,
      borderLeftColor: colors.primary,
      borderRadius: 8,
      backgroundColor: colors.chip,
      paddingHorizontal: 12,
      paddingVertical: 10,
    },
    quoteText: {
      color: colors.mutedText,
      fontSize: 15,
      lineHeight: 23,
    },
    list: {
      gap: 8,
    },
    listItem: {
      flexDirection: 'row',
      gap: 8,
      alignItems: 'flex-start',
    },
    bullet: {
      width: 24,
      color: colors.primary,
      fontSize: 16,
      lineHeight: 25,
      fontWeight: '800',
    },
    codeBlock: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      backgroundColor: colors.input,
      paddingHorizontal: 12,
      paddingVertical: 10,
    },
    codeText: {
      color: colors.text,
      fontFamily: 'Courier',
      fontSize: 14,
      lineHeight: 21,
    },
  });
}
