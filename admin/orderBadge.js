/**
 * orderBadge.js
 * Centralized script — handles live badge counts for:
 *   1. Order Management sidebar link
 *   2. Prescriptions sidebar link
 *
 * Usage: Add ONE script tag to ANY admin page before </body>
 *   <script src="../Order/orderBadge.js"></script>
 *
 * Logic:
 *   - Badge shows count of items added AFTER the admin's last visit to that page.
 *   - When ON the target page, timestamp is saved and badge clears immediately.
 *   - Both APIs are fetched in parallel every 60 seconds.
 */

(function () {

    // ─── CONFIG ────────────────────────────────────────────────────────────────

    const POLL_INTERVAL_MS = 60 * 1000;

    const MODULES = [
        {
            // Order Management
            apiUrl:       'http://localhost:8083/api/orders/get-all-orders?page=0&size=100&sort=orderDate,desc',
            storageKey:   'orderMgmt_lastVisited',
            pageMatch:    'ordermanagment',          // substring of URL when ON this page
            linkMatch:    'ordermanagment',           // substring of sidebar <a href>
            badgeId:      'sidebarOrderCount',
            dateField:    'orderDate',               // field name in API response item
        },
        {
            // Prescription Management
            apiUrl:       'http://localhost:8083/api/prescriptions/get-all-orders?page=0&size=1000&sortBy=createdAt&sortDirection=DESC',
            storageKey:   'prescriptionMgmt_lastVisited',
            pageMatch:    'prescription',
            linkMatch:    'prescription',
            badgeId:      'sidebarPrescriptionCount',
            dateField:    'createdAt',
        }
    ];

    // ─── HELPERS ───────────────────────────────────────────────────────────────

    function getLastVisited(storageKey) {
        const val = localStorage.getItem(storageKey);
        return val ? parseInt(val, 10) : 0;
    }

    function isNewItem(dateStr, storageKey) {
        if (!dateStr || dateStr === '-') return false;
        try {
            const t = new Date(dateStr).getTime();
            if (isNaN(t)) return false;
            return t > getLastVisited(storageKey);
        } catch (e) {
            return false;
        }
    }

    function getOrCreateBadge(badgeId, linkMatch) {
        let badge = document.getElementById(badgeId);
        if (badge) return badge;

        const link = document.querySelector(`a[href*="${linkMatch}"]`);
        if (!link) return null;

        link.style.display     = 'flex';
        link.style.alignItems  = 'center';

        badge = document.createElement('span');
        badge.id = badgeId;
        badge.style.cssText = `
            margin-left: auto;
            display: none;
            font-size: 0.65rem;
            font-weight: 700;
            background-color: #ef4444;
            color: #ffffff;
            border-radius: 9999px;
            min-width: 20px;
            height: 20px;
            align-items: center;
            justify-content: center;
            padding: 0 5px;
            line-height: 1;
            text-align: center;
        `;
        link.appendChild(badge);
        return badge;
    }

    function setBadge(badge, count) {
        if (!badge) return;
        if (count > 0) {
            badge.textContent    = count > 99 ? '99+' : count;
            badge.style.display  = 'inline-flex';
        } else {
            badge.style.display  = 'none';
        }
    }

    // ─── CORE ──────────────────────────────────────────────────────────────────

    const currentHref = window.location.href.toLowerCase();

    // Stamp visit timestamps immediately (before any async work)
    MODULES.forEach(mod => {
        if (currentHref.includes(mod.pageMatch)) {
            localStorage.setItem(mod.storageKey, Date.now().toString());
        }
    });

    async function fetchModule(mod) {
        try {
            const res = await fetch(mod.apiUrl);
            if (!res.ok) throw new Error('HTTP ' + res.status);
            const data = await res.json();
            const items = data.content || [];

            // On the page itself → always 0 (already stamped above)
            const onPage = currentHref.includes(mod.pageMatch);
            const count  = onPage ? 0 : items.filter(item => isNewItem(item[mod.dateField], mod.storageKey)).length;

            const badge = getOrCreateBadge(mod.badgeId, mod.linkMatch);
            setBadge(badge, count);
        } catch (err) {
            console.warn(`[orderBadge.js] ${mod.badgeId} fetch failed:`, err.message);
        }
    }

    async function fetchAll() {
        await Promise.all(MODULES.map(fetchModule));
    }

    function init() {
        fetchAll();
        setInterval(fetchAll, POLL_INTERVAL_MS);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();