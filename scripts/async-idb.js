class IDBAbortError extends Error {
  constructor(message = null) { super(message); }
}

class AsyncIDB {
  /**
   * Converting an open request to async/await.
   * @param {IDBOpenDBRequest} openDbReq 
   * @param {(db: IDBDatabase) => void | Promise<void>} upgradeNeededCb 
   * @returns {Promise<IDBDatabase>}
   */
  static processOpenDb(openDbReq, upgradeNeededCb = null) {
    return new Promise((resolve, reject) => {
      openDbReq.onsuccess = _ => resolve(openDbReq.result);
      openDbReq.onerror = _ => reject(new Error('OpenDBRequest failed'));
      openDbReq.onupgradeneeded = async _ => {
        if (upgradeNeededCb) {
          if (upgradeNeededCb instanceof Promise) {
            await upgradeNeededCb(openDbReq.result);
          } else {
            upgradeNeededCb(openDbReq.result);
          }
        }
        resolve(openDbReq.result);
      }
    });
  }

  /**
   * Converting a normal request to async/await.
   * @param {IDBRequest} request
   */
  static processRequest(request) {
    return new Promise((resolve, reject) => {
      request.onsuccess = _ => resolve(request.result);
      request.onerror = _ => reject(new Error('Request failed'));
    });
  }

  /**
   * Makes calls to a transaction async/awaitable.
   * @param {IDBTransaction} transaction 
   * @param {(transaction: IDBTransaction) => void | Promise<void>} callback 
   * @returns {Promise<void>}
   */
  static processTransaction(transaction, callback) {
    return new Promise(async (resolve, reject) => {
      transaction.oncomplete = _ => resolve();
      transaction.onerror = _ => reject(new Error('Transaction failed'));
      transaction.onabort = _ => reject(new IDBAbortError('Transaction aborted'));
      if (callback instanceof Promise) {
        await callback(transaction);
      } else {
        callback(transaction);
      }
    });
  }
}
