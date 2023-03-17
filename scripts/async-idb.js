class AsyncIDB {
  /**
   * Converting an open request to async/await.
   * @param {IDBOpenDBRequest} openDbReq 
   * @param {{ upgradeNeededCb: (db: IDBDatabase) => void }} param1 
   * @returns {Promise<IDBDatabase>}
   */
  static openDbFrom(openDbReq, { upgradeNeededCb = null }) {
    return new Promise((resolve, reject) => {
      openDbReq.onsuccess = _ => resolve(openDbReq.result);
      openDbReq.onerror = reject;
      openDbReq.onupgradeneeded = _ => {
        if (upgradeNeededCb) {
          upgradeNeededCb(openDbReq.result);
        }
        resolve(openDbReq.result);
      }
    });
  }

  /**
   * Converting a normal request to async/await.
   * @param {IDBRequest} request
   */
  static requestFrom(request) {
    return new Promise((resolve, reject) => {
      request.onsuccess = _ => resolve(request.result);
      request.onerror = reject;
    });
  }

  /**
   * Makes calls to a transaction async/awaitable.
   * @param {IDBTransaction} transaction 
   * @param {(transaction: IDBTransaction) => void} callback 
   * @returns {Pronise<null>}
   */
  static processTransaction(transaction, callback) {
    return new Promise((resolve, reject) => {
      transaction.oncomplete = _ => resolve(null);
      transaction.onerror = reject;
      transaction.onabort = reject;
      callback(transaction);
    });
  }
}
