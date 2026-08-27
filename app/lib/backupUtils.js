import db from "./localDb";

/**
 * Exports all local IndexedDB data to a JSON backup file on user's laptop disk
 */
export const exportLocalData = async () => {
  if (typeof window === "undefined" || !db) {
    return { success: false, message: "Not available on server." };
  }

  try {
    const sales = await db.sales.toArray();
    const expenses = await db.expenses.toArray();
    const purchases = await db.purchases.toArray();
    const inventory = await db.inventory.toArray();
    const customers = await db.customers.toArray();

    const backupData = {
      appName: "Ammar Autos",
      version: "1.0",
      exportedAt: new Date().toISOString(),
      data: {
        sales,
        expenses,
        purchases,
        inventory,
        customers,
      },
    };

    const jsonString = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const dateStr = new Date().toISOString().split("T")[0];
    const link = document.createElement("a");
    link.href = url;
    link.download = `Ammar_Autos_Backup_${dateStr}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return { success: true, message: "Backup downloaded successfully!" };
  } catch (error) {
    console.error("Export backup failed:", error);
    return { success: false, message: error.message };
  }
};

/**
 * Imports data from a JSON backup file into local IndexedDB
 */
export const importLocalData = async (file) => {
  if (typeof window === "undefined" || !db) {
    return { success: false, message: "Not available on server." };
  }

  return new Promise((resolve) => {
    if (!file) {
      return resolve({ success: false, message: "No file selected." });
    }

    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const content = JSON.parse(e.target.result);

        if (!content.data) {
          return resolve({ success: false, message: "Invalid backup file format." });
        }

        const { sales = [], expenses = [], purchases = [], inventory = [], customers = [] } = content.data;

        await db.transaction("rw", [db.sales, db.expenses, db.purchases, db.inventory, db.customers], async () => {
          if (sales.length) await db.sales.bulkPut(sales);
          if (expenses.length) await db.expenses.bulkPut(expenses);
          if (purchases.length) await db.purchases.bulkPut(purchases);
          if (inventory.length) await db.inventory.bulkPut(inventory);
          if (customers.length) await db.customers.bulkPut(customers);
        });

        resolve({
          success: true,
          message: `Imported: ${sales.length} Sales, ${expenses.length} Expenses, ${purchases.length} Purchases!`,
        });
      } catch (err) {
        console.error("Import error:", err);
        resolve({ success: false, message: "Failed to parse backup JSON file." });
      }
    };

    reader.onerror = () => {
      resolve({ success: false, message: "Error reading file." });
    };

    reader.readAsText(file);
  });
};
