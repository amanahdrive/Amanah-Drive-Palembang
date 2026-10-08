import { Platform, Linking } from "react-native";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";

import {
  fetchReportCashflowHtml,
  reportCashflowUrl,
  fetchSertifikatHtml,
  sertifikatUrl,
} from "@/src/api/client";

async function openOrShareHtml(html: string, filename: string, dialogTitle: string) {
  if (Platform.OS === "web") {
    const g = globalThis as unknown as { open?: (u: string, t: string) => void };
    const win = g.open ? g.open("", "_blank") : null;
    if (win && (win as unknown as { document?: Document }).document) {
      const w = win as unknown as { document: Document };
      w.document.open();
      w.document.write(html);
      w.document.close();
    }
    return;
  }
  const { uri } = await Print.printToFileAsync({ html });
  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(uri, {
      UTI: "com.adobe.pdf",
      mimeType: "application/pdf",
      dialogTitle,
    });
  }
}

export async function downloadCashflowPdf(bulan?: string): Promise<void> {
  if (Platform.OS === "web") {
    const url = reportCashflowUrl(bulan);
    const g = globalThis as unknown as { open?: (u: string, t: string) => void };
    if (g.open) g.open(url, "_blank");
    else await Linking.openURL(url);
    return;
  }
  const html = await fetchReportCashflowHtml(bulan);
  await openOrShareHtml(html, "cashflow.pdf", "Laporan Cashflow Amanah Drive");
}

export async function downloadSertifikat(studentId: string, studentName: string): Promise<void> {
  if (Platform.OS === "web") {
    const url = sertifikatUrl(studentId);
    const g = globalThis as unknown as { open?: (u: string, t: string) => void };
    if (g.open) g.open(url, "_blank");
    else await Linking.openURL(url);
    return;
  }
  const html = await fetchSertifikatHtml(studentId);
  await openOrShareHtml(html, `sertifikat-${studentName}.pdf`, `Sertifikat ${studentName}`);
}
