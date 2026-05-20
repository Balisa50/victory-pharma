import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";
import { formatDate } from "@/lib/utils";
import type { OrderItem } from "@/types";

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: "Helvetica", fontSize: 10, color: "#111827" },
  header: { marginBottom: 24 },
  title: { fontSize: 20, fontWeight: "bold", color: "#1e40af", marginBottom: 4 },
  subtitle: { fontSize: 10, color: "#6b7280" },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 11, fontWeight: "bold", marginBottom: 8, color: "#374151" },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  label: { color: "#6b7280" },
  value: { fontWeight: "bold" },
  divider: { borderBottom: 1, borderBottomColor: "#e5e7eb", marginVertical: 12 },
  tableHeader: {
    flexDirection: "row",
    borderBottom: 1,
    borderBottomColor: "#e5e7eb",
    paddingBottom: 6,
    marginBottom: 4,
    fontSize: 9,
    color: "#6b7280",
    textTransform: "uppercase",
  },
  tableRow: { flexDirection: "row", paddingVertical: 5, borderBottom: 1, borderBottomColor: "#f9fafb" },
  col1: { flex: 3 },
  col2: { flex: 1, textAlign: "right" },
  col3: { flex: 1, textAlign: "right" },
  col4: { flex: 1, textAlign: "right" },
  total: { flexDirection: "row", justifyContent: "space-between", marginTop: 12, fontSize: 13, fontWeight: "bold" },
  footer: { marginTop: 40, fontSize: 9, color: "#9ca3af", textAlign: "center" },
  badge: { backgroundColor: "#d1fae5", color: "#065f46", padding: "4 8", borderRadius: 4, fontSize: 9 },
});

type Props = {
  receiptId: string;
  orderId: string;
  pharmacyName: string;
  items: Pick<OrderItem, "productName" | "quantity" | "unitPrice" | "subtotal">[];
  totalAmount: number;
  date: string | Date;
  paymentMethod: string;
};

export function ReceiptDocument({
  receiptId,
  orderId,
  pharmacyName,
  items,
  totalAmount,
  date,
  paymentMethod,
}: Props) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Victory Pharmaceutical</Text>
          <Text style={styles.subtitle}>Payment Receipt</Text>
        </View>

        <View style={styles.section}>
          <View style={styles.row}>
            <Text style={styles.label}>Receipt ID</Text>
            <Text style={styles.value}>#{receiptId.slice(-8)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Order ID</Text>
            <Text style={styles.value}>#{orderId.slice(-8)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Pharmacy</Text>
            <Text style={styles.value}>{pharmacyName}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Date</Text>
            <Text style={styles.value}>{formatDate(date)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Payment Method</Text>
            <Text style={styles.value}>{paymentMethod.replace("_", " ")}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Status</Text>
            <Text style={[styles.value, { color: "#059669" }]}>Confirmed</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Items</Text>
          <View style={styles.tableHeader}>
            <Text style={styles.col1}>Product</Text>
            <Text style={styles.col2}>Qty</Text>
            <Text style={styles.col3}>Unit Price</Text>
            <Text style={styles.col4}>Subtotal</Text>
          </View>
          {items.map((item, i) => (
            <View key={i} style={styles.tableRow}>
              <Text style={styles.col1}>{item.productName}</Text>
              <Text style={styles.col2}>{item.quantity}</Text>
              <Text style={styles.col3}>D{Number(item.unitPrice).toFixed(2)}</Text>
              <Text style={styles.col4}>D{Number(item.subtotal).toFixed(2)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.divider} />

        <View style={styles.total}>
          <Text>Total Amount</Text>
          <Text>D{totalAmount.toFixed(2)}</Text>
        </View>

        <Text style={styles.footer}>
          Thank you for your business. Victory Pharmaceutical — Quality you can trust.
        </Text>
      </Page>
    </Document>
  );
}
