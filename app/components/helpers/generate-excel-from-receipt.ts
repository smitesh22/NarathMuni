import * as XLSX from "xlsx";

const generateExcelFromReceipt = (receiptData: any) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  };

  // Prepare the Excel data
  const data = [
    // Store information
    ["Store", receiptData.store || "N/A"],
    ["Location", receiptData.location || "N/A"],
    ["Receipt ID", receiptData.receipt_id || "N/A"],
    ["Date", receiptData.date ? formatDate(receiptData.date) : "N/A"],
    ["Time", receiptData.time || "N/A"],
    ["Payment Method", receiptData.payment_method || "N/A"],
    ["Total Amount", receiptData.total_amount || "N/A"],
    ["Total Discount", receiptData.total_discount || "N/A"],
    // Use safe access for tax_breakdown keys
    ["0% VAT", receiptData.tax_breakdown?.["0% VAT"] || "N/A"],
    ["13.5% VAT", receiptData.tax_breakdown?.["13.5% VAT"] || "N/A"],

    // Items section
    ["", ""], // Empty row for separation
    ["Item Name", "Quantity", "Price", "Discount", "Tax Category"],
    ...receiptData.items.map((item: any) => [
      item.name || "N/A",
      item.quantity || "N/A",
      item.price || "N/A",
      item.discount || "N/A",
      item.category || "N/A",
    ]),
  ];

  // Create a worksheet
  const ws = XLSX.utils.aoa_to_sheet(data);

  // Apply styling (you can adjust the styles as per your preference)
  const range = XLSX.utils.decode_range(ws["!ref"]!);

  // Style the header row
  for (let col = range.s.c; col <= range.e.c; col++) {
    const cell = ws[XLSX.utils.encode_cell({ r: 0, c: col })];
    if (cell) {
      cell.s = {
        font: { bold: true, color: { rgb: "FFFFFF" } },
        fill: { fgColor: { rgb: "4F81BD" } },
        alignment: { horizontal: "center", vertical: "center" },
        border: {
          top: { style: "thin", color: { rgb: "000000" } },
          bottom: { style: "thin", color: { rgb: "000000" } },
          left: { style: "thin", color: { rgb: "000000" } },
          right: { style: "thin", color: { rgb: "000000" } },
        },
      };
    }
  }

  // Style the data rows
  for (let row = 1; row <= range.e.r; row++) {
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cell = ws[XLSX.utils.encode_cell({ r: row, c: col })];
      if (cell) {
        cell.s = {
          border: {
            top: { style: "thin", color: { rgb: "000000" } },
            bottom: { style: "thin", color: { rgb: "000000" } },
            left: { style: "thin", color: { rgb: "000000" } },
            right: { style: "thin", color: { rgb: "000000" } },
          },
        };
      }
    }
  }

  // Create a workbook
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Receipt");

  // Return the workbook buffer
  return XLSX.write(wb, { bookType: "xlsx", type: "buffer" });
};

export default generateExcelFromReceipt;
