import ExcelJS from "exceljs";

const generateExcelFromReceipt = async (receiptData: any): Promise<Buffer> => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Receipt");

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  };

  // Add static rows
  const data = [
    ["Store", receiptData.store || "N/A"],
    ["Location", receiptData.location || "N/A"],
    ["Receipt ID", receiptData.receipt_id || "N/A"],
    ["Date", receiptData.date ? formatDate(receiptData.date) : "N/A"],
    ["Time", receiptData.time || "N/A"],
    ["Payment Method", receiptData.payment_method || "N/A"],
    ["Total Amount", receiptData.total_amount || "N/A"],
    ["Total Discount", receiptData.total_discount || "N/A"],
    ["0% VAT", receiptData.tax_breakdown?.["0% VAT"] || "N/A"],
    ["13.5% VAT", receiptData.tax_breakdown?.["13.5% VAT"] || "N/A"],
    ["", ""],
    ["Item Name", "Quantity", "Price", "Discount", "Tax Category"],
  ];

  data.forEach((row) => worksheet.addRow(row));

  receiptData.items.forEach((item: any) => {
    worksheet.addRow([
      item.name || "N/A",
      item.quantity || "N/A",
      item.price || "N/A",
      item.discount || "N/A",
      item.category || "N/A",
    ]);
  });

  worksheet.eachRow((row, rowNumber) => {
    row.eachCell((cell) => {
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };

      if (rowNumber === 1 || rowNumber === 11) {
        cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "4F81BD" },
        };
        cell.alignment = { horizontal: "center", vertical: "middle" };
      }
    });
  });

  worksheet.columns.forEach((column) => {
    if (column.values) {
      const maxLength = column.values
          .filter((v: any) => v !== undefined && v !== null)
          .map((v: any) => v.toString().length)
          .reduce((max, curr) => Math.max(max, curr), 10);
      column.width = Math.min(maxLength + 5, 50);
    } else {
      column.width = 15;
    }
  });

  // Convert ArrayBuffer to Node.js Buffer
  const arrayBuffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
};

export default generateExcelFromReceipt;
