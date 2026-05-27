"use client";

/**
 * Placeholder for @react-pdf/renderer integration.
 * Wire this into the editor preview when you move off HTML-only preview.
 */
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 11, fontFamily: "Helvetica" },
  paragraph: { marginBottom: 8, lineHeight: 1.4 },
});

export function ResumePdfDocument({ plainText }: { plainText: string }) {
  const lines = plainText.split("\n").filter(Boolean);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {lines.map((line, index) => (
          <View key={index}>
            <Text style={styles.paragraph}>{line}</Text>
          </View>
        ))}
      </Page>
    </Document>
  );
}
