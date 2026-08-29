import {
  Document,
  Link,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import type { ReactNode } from "react";

import type { CvBlock, CvInline } from "./markdown-to-pdf";

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 11,
    padding: 48,
    color: "#111111",
  },
  h1: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    marginBottom: 12,
  },
  h2: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    marginBottom: 8,
    marginTop: 14,
  },
  h3: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    marginBottom: 6,
    marginTop: 10,
  },
  paragraph: {
    marginBottom: 8,
    lineHeight: 1.4,
  },
  list: {
    marginBottom: 8,
    paddingLeft: 8,
  },
  listItem: {
    flexDirection: "row",
    marginBottom: 3,
  },
  bullet: {
    width: 14,
  },
  listItemBody: {
    flex: 1,
  },
  link: {
    color: "#1a0dab",
    textDecoration: "underline",
  },
});

function fontFamily(strong: boolean, emphasis: boolean): string {
  if (strong && emphasis) {
    return "Helvetica-BoldOblique";
  }
  if (strong) {
    return "Helvetica-Bold";
  }
  if (emphasis) {
    return "Helvetica-Oblique";
  }
  return "Helvetica";
}

function renderInline(
  nodes: CvInline[],
  strong = false,
  emphasis = false,
): ReactNode[] {
  return nodes.map((node, index) => {
    if (node.type === "text") {
      return (
        <Text key={index} style={{ fontFamily: fontFamily(strong, emphasis) }}>
          {node.value}
        </Text>
      );
    }
    if (node.type === "strong") {
      return (
        <Text key={index}>{renderInline(node.children, true, emphasis)}</Text>
      );
    }
    if (node.type === "emphasis") {
      return (
        <Text key={index}>{renderInline(node.children, strong, true)}</Text>
      );
    }
    return (
      <Link key={index} src={node.href} style={styles.link}>
        {renderInline(node.children, strong, emphasis)}
      </Link>
    );
  });
}

function BlockView({ block }: { block: CvBlock }) {
  if (block.type === "heading") {
    const headingStyle =
      block.level === 1 ? styles.h1 : block.level === 2 ? styles.h2 : styles.h3;
    return <Text style={headingStyle}>{renderInline(block.children)}</Text>;
  }

  if (block.type === "paragraph") {
    return <Text style={styles.paragraph}>{renderInline(block.children)}</Text>;
  }

  return (
    <View style={styles.list}>
      {block.items.map((item, index) => (
        <View key={index} style={styles.listItem}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.listItemBody}>{renderInline(item.children)}</Text>
        </View>
      ))}
    </View>
  );
}

export function CvDocument({ blocks }: { blocks: CvBlock[] }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {blocks.map((block, index) => (
          <BlockView key={index} block={block} />
        ))}
      </Page>
    </Document>
  );
}
