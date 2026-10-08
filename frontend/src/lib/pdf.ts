import { Platform, Linking } from "react-native";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";

import { fetchReportCashflowHtml, reportCashflowUrl } from "@/src/api/client";

/**
 * Fetch the backend-rendered HTML report and either:
 *  - open it in a new tab on web (user hits Ctrl/Cmd+P to save PDF), or
 *  - render to a PDF file on native and open the share sheet.
 */
export async function downloadCashflowPdf(bulan?: string): Promise<void> {
  if (Platform.OS === "web") {
    const url = reportCashflowUrl(bulan);
    const w = (globalThis as unknown as { open?: (u: string, t: string) => void }).open;
    if (w) {
      w(url, "_blank");
    } else {
      await Linking.openURL(url);
    }
    return;
  }

  const html = await fetchReportCashflowHtml(bulan);
  const { uri } = await Print.printToFileAsync({ html });
  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(uri, {
      UTI: "com.adobe.pdf",
      mimeType: "application/pdf",
      dialogTitle: "Laporan Cashflow Amanah Drive",
    });
  }
}
