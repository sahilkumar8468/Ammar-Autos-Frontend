import db from "./localDb";
import axios from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:5000";

/**
 * Get unsynced changes count across all local tables
 */
export const getUnsyncedCount = async () => {
  if (typeof window === "undefined" || !db) return 0;
  try {
    const unsyncedSales = await db.sales.where("isSynced").equals(0).or("isSynced").equals(false).count();
    const unsyncedExpenses = await db.expenses.where("isSynced").equals(0).or("isSynced").equals(false).count();
    const unsyncedPurchases = await db.purchases.where("isSynced").equals(0).or("isSynced").equals(false).count();
    const queueCount = await db.syncQueue.count();

    return unsyncedSales + unsyncedExpenses + unsyncedPurchases + queueCount;
  } catch (error) {
    console.error("Error fetching unsynced count:", error);
    return 0;
  }
};

/**
 * Save item locally (Local First) and queue for sync
 */
export const saveLocalRecord = async (tableName, recordData, action = "CREATE") => {
  if (typeof window === "undefined" || !db) return { success: false, error: "SSR mode" };
  try {
    const record = {
      ...recordData,
      isSynced: false,
      updatedAt: new Date().toISOString(),
    };

    const id = await db[tableName].add(record);

    await db.syncQueue.add({
      collectionName: tableName,
      action,
      payload: { ...record, localId: id },
      createdAt: new Date().toISOString(),
    });

    return { success: true, id };
  } catch (error) {
    console.error(`Error saving to local DB table ${tableName}:`, error);
    return { success: false, error: error.message };
  }
};

/**
 * Get paginated local records (Method 3: limit)
 */
export const getLocalPaginated = async (tableName, page = 1, limit = 20) => {
  if (typeof window === "undefined" || !db) return { success: false, data: [], total: 0 };
  try {
    const offset = (page - 1) * limit;
    const items = await db[tableName]
      .reverse()
      .offset(offset)
      .limit(limit)
      .toArray();

    const total = await db[tableName].count();

    return {
      success: true,
      data: items,
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
    };
  } catch (error) {
    console.error(`Error fetching local ${tableName}:`, error);
    return { success: false, data: [], total: 0 };
  }
};

/**
 * Executes Cloud Batch Sync by sending queued local changes to backend API
 */
export const syncCloudBatch = async () => {
  if (typeof window === "undefined" || !db) return { success: false, message: "SSR mode" };
  try {
    const queueItems = await db.syncQueue.toArray();

    const unsyncedSales = await db.sales.filter(item => !item.isSynced).toArray();
    const unsyncedExpenses = await db.expenses.filter(item => !item.isSynced).toArray();
    const unsyncedPurchases = await db.purchases.filter(item => !item.isSynced).toArray();

    if (
      queueItems.length === 0 &&
      unsyncedSales.length === 0 &&
      unsyncedExpenses.length === 0 &&
      unsyncedPurchases.length === 0
    ) {
      return { success: true, syncedCount: 0, message: "Everything is already synced!" };
    }

    const payload = {
      sales: unsyncedSales,
      expenses: unsyncedExpenses,
      purchases: unsyncedPurchases,
      queue: queueItems,
    };

    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    const response = await axios.post(`${BASE_URL}/api/sync/batch`, payload, { headers });

    if (response.data && response.data.success) {
      // Mark local records as synced
      await db.transaction("rw", [db.sales, db.expenses, db.purchases, db.syncQueue], async () => {
        for (const item of unsyncedSales) {
          if (item.id) await db.sales.update(item.id, { isSynced: true });
        }
        for (const item of unsyncedExpenses) {
          if (item.id) await db.expenses.update(item.id, { isSynced: true });
        }
        for (const item of unsyncedPurchases) {
          if (item.id) await db.purchases.update(item.id, { isSynced: true });
        }
        await db.syncQueue.clear();
      });

      const totalSynced = unsyncedSales.length + unsyncedExpenses.length + unsyncedPurchases.length;
      return {
        success: true,
        syncedCount: totalSynced,
        message: `Successfully synced ${totalSynced} records with Cloud Firestore!`,
      };
    } else {
      return { success: false, message: response.data.message || "Sync failed on server." };
    }
  } catch (error) {
    console.error("Cloud Sync error:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Sync failed. Check backend connection.",
    };
  }
};
