import Dexie from "dexie";

let dbInstance = null;

if (typeof window !== "undefined") {
  dbInstance = new Dexie("AmmarAutosDB");
  dbInstance.version(1).stores({
    sales: "++id, firestoreId, registrationNo, category, saleDateTime, totalSaleAmount, isSynced, updatedAt",
    expenses: "++id, firestoreId, title, category, expenseDate, amount, transactionType, isSynced, updatedAt",
    purchases: "++id, firestoreId, registrationNo, vehicleCompany, purchaseAmount, isSynced, updatedAt",
    inventory: "++id, firestoreId, registrationNo, bikeCompany, bikeModel, isSynced, updatedAt",
    customers: "++id, firestoreId, customerName, phone, cnic, isSynced, updatedAt",
    syncQueue: "++id, collectionName, action, payload, createdAt",
  });
}

export const db = dbInstance;
export default db;
