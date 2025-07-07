// Client-side cache clearing script
// Run this in browser console to clear all client-side caches

(function clearAllCaches() {
  console.log("🧹 Starting comprehensive cache clearing...");

  // 1. Clear localStorage
  try {
    localStorage.clear();
    console.log("✅ LocalStorage cleared");
  } catch (e) {
    console.log("❌ LocalStorage clear failed:", e);
  }

  // 2. Clear sessionStorage
  try {
    sessionStorage.clear();
    console.log("✅ SessionStorage cleared");
  } catch (e) {
    console.log("❌ SessionStorage clear failed:", e);
  }

  // 3. Clear IndexedDB
  if ("indexedDB" in window) {
    indexedDB
      .databases()
      .then((databases) => {
        databases.forEach((db) => {
          if (db.name) {
            const deleteReq = indexedDB.deleteDatabase(db.name);
            deleteReq.onsuccess = () =>
              console.log(`✅ IndexedDB "${db.name}" cleared`);
            deleteReq.onerror = () =>
              console.log(`❌ IndexedDB "${db.name}" clear failed`);
          }
        });
      })
      .catch((e) => console.log("❌ IndexedDB clear failed:", e));
  }

  // 4. Clear Service Worker caches
  if ("caches" in window) {
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            return caches.delete(cacheName).then(() => {
              console.log(`✅ Service Worker cache "${cacheName}" cleared`);
            });
          })
        );
      })
      .catch((e) => console.log("❌ Service Worker cache clear failed:", e));
  }

  // 5. Clear cookies for current domain
  try {
    document.cookie.split(";").forEach((cookie) => {
      const eqPos = cookie.indexOf("=");
      const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
    });
    console.log("✅ Cookies cleared");
  } catch (e) {
    console.log("❌ Cookie clear failed:", e);
  }

  // 6. Reload page to apply changes
  console.log("🔄 Reloading page to apply cache clearing...");
  setTimeout(() => {
    window.location.reload(true);
  }, 1000);
})();
