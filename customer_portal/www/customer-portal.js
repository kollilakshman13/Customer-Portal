const titles = {
    dashboard: ['Dashboard', 'Real-time overview of your security, services & spend'],
    renewals: ['Renewals', 'Track and manage every license renewal'],
    'renewal-detail': ['Renewal Details', ''],
    invoices: ['Invoices', 'View, download and pay your invoices'],
    'invoice-detail': ['Invoice Details', ''],
    tickets: ['Support Tickets', 'Raise a ticket or check on an existing one'],
    'ticket-detail': ['Ticket Details', ''],
    'ticket-new': ['Raise Support Ticket', 'Submit your technical issue or service request'],
    account: ['Profile & Settings', '']
};

let portalData = null;
let currentTicket = null;
let currentInvoice = null;

function getCompanyAbbr() {
    return portalData?.company_info?.abbr || '64 NSPL';
}

function getCompanyName() {
    return portalData?.company_info?.company_name || 'NETWORK SECURITY';
}

function updateDocumentTitle(pageTitle, detailName = null) {
    const compAbbr = getCompanyAbbr();
    if (detailName) {
        document.title = `${detailName} | ${pageTitle} - ${compAbbr}`;
    } else if (pageTitle) {
        document.title = `${pageTitle} - ${compAbbr}`;
    } else {
        document.title = compAbbr;
    }
}

// Page List States for filtering and pagination
const listState = {
    renewals: { search: '', status: 'active', limit: 10 },
    invoices: { search: '', status: 'all', limit: 10 },
    tickets: { search: '', status: 'all', limit: 10 }
};

// DOM Element Creator
function cel(tag, attrs = {}, children = []) {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
        if (k === 'class') el.className = v;
        else if (k === 'style') el.style.cssText = v;
        else if (k === 'textContent') el.textContent = v;
        else if (k === 'innerHTML') el.innerHTML = v;
        else if (k === 'checked') el.checked = Boolean(v);
        else if (k === 'disabled') el.disabled = Boolean(v);
        else if (k === 'value') el.value = (v === null || v === undefined) ? '' : v;
        else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.substring(2).toLowerCase(), v);
        else el.setAttribute(k, v);
    }
    for (const child of children) {
        if (!child) continue;
        if (typeof child === 'string' || typeof child === 'number') {
            el.appendChild(document.createTextNode(String(child)));
        } else {
            el.appendChild(child);
        }
    }
    return el;
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function safeEscape(str) {
    return escapeHtml(str);
}
window.safeEscape = safeEscape;

function formatDate(dateStr) {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

function formatDateTime(dateStr) {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    let hours = d.getHours();
    const minutes = d.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()} ${hours}:${minutes} ${ampm}`;
}
window.formatDateTime = formatDateTime;

function formatRelativeTime(dateStr) {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const now = new Date();
    const diffMs = now - d;
    if (diffMs < 0 || isNaN(diffMs)) return formatDateTime(dateStr);
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    const timePart = formatDateTime(dateStr).split(' ').slice(3).join(' ');

    if (diffSec < 60) return `Just now (${timePart})`;
    if (diffMin < 60) return `${diffMin}m ago (${timePart})`;
    if (diffHour < 24) return `${diffHour}h ago (${timePart})`;
    if (diffDay < 7) return `${diffDay}d ago (${timePart})`;

    return formatDateTime(dateStr);
}
window.formatRelativeTime = formatRelativeTime;

function formatCurrency(amt) {
    if (amt === null || amt === undefined || isNaN(amt)) return '₹0';
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amt);
}

// Status Display & Class Resolvers
function getInvoiceDisplayStatus(inv) {
    if (!inv) return 'Issued';
    if (inv.status && inv.status.toLowerCase() === 'paid') return 'Paid';
    if (inv.outstanding_amount === 0) return 'Paid';
    const today = new Date();
    if (inv.due_date && new Date(inv.due_date) < today && inv.outstanding_amount > 0) {
        return 'Overdue';
    }
    if (inv.status && inv.status.toLowerCase() === 'draft') return 'Draft';
    if (inv.outstanding_amount > 0) return 'Unpaid';
    return inv.status || 'Issued';
}

function getInvoiceStatusClass(status) {
    if (!status) return 'orange';
    status = status.toLowerCase();
    if (status === 'paid') return 'green';
    if (status === 'overdue') return 'red';
    if (status === 'unpaid' || status === 'submitted') return 'orange';
    if (status === 'draft') return 'blue';
    return 'green';
}

function getRenewalDisplayStatus(ren) {
    if (!ren) return 'Active';
    const today = new Date();
    const endDate = ren.end_date ? new Date(ren.end_date) : null;
    const daysLeft = endDate ? Math.ceil((endDate - today) / (1000 * 60 * 60 * 24)) : 999;
    if (ren.status && ren.status.toLowerCase() === 'draft') return 'Draft';
    if (daysLeft < 0 || (ren.status && ren.status.toLowerCase() === 'expired') || (ren.status && ren.status.toLowerCase() === 'lost')) return 'Expired';
    return ren.status || 'Active';
}

function getRenewalStatusClass(status) {
    if (!status) return 'green';
    status = status.toLowerCase();
    if (status === 'active') return 'green';
    if (status === 'draft') return 'blue';
    if (status === 'due soon' || status === 'due') return 'orange';
    if (status === 'expired' || status === 'lost' || status === 'cancelled') return 'red';
    return 'green';
}

function getTicketDisplayStatus(t) {
    if (!t) return 'Open';
    return t.status || 'Open';
}

function getTicketStatusClass(status) {
    if (!status) return 'green';
    status = status.toLowerCase();
    if (status === 'open' || status === 'assigned' || status === 'in progress' || status === 'pending') return 'orange';
    if (status === 'closed' || status === 'resolved') return 'green';
    if (status === 'urgent' || status === 'high') return 'red';
    return 'orange';
}

// Clean URL Routing Utilities
function updateUrlPath(pathSegment) {
    let cleanPath = '/customer-portal';
    let targetSegment = pathSegment;

    if (pathSegment === 'ticket-new' || pathSegment === 'tickets/new') {
        targetSegment = 'tickets/new';
    } else if (pathSegment === 'dashboard') {
        targetSegment = '';
    }

    if (targetSegment) {
        cleanPath += '/' + targetSegment;
    }

    if (window.location.pathname + window.location.hash !== cleanPath) {
        if (history.pushState) {
            history.pushState(null, null, cleanPath);
        } else {
            window.location.hash = '#' + targetSegment;
        }
    }
}

function toggleMobileSidebar(e) {
    if (e) e.stopPropagation();
    const side = document.querySelector('.side');
    const backdrop = document.getElementById('side-backdrop');
    if (side) side.classList.toggle('open');
    if (backdrop) backdrop.classList.toggle('active');
}

function closeAllModals() {
    // Hide all custom modal backdrops (.cp-modal-backdrop)
    document.querySelectorAll('.cp-modal-backdrop').forEach(m => {
        m.style.display = 'none';
    });

    // Hide mobile sidebar and side backdrop
    const side = document.querySelector('.side');
    if (side) side.classList.remove('open');
    const sideBackdrop = document.getElementById('side-backdrop');
    if (sideBackdrop) {
        sideBackdrop.classList.remove('active');
        sideBackdrop.style.display = 'none';
    }

    // Remove dynamically injected Bootstrap / Frappe modal backdrops
    document.querySelectorAll('.modal-backdrop').forEach(mb => mb.remove());

    // Hide all Bootstrap modal dialogs
    document.querySelectorAll('.modal').forEach(m => {
        m.classList.remove('show');
        m.style.display = 'none';
    });

    // Reset body scrolling
    document.body.classList.remove('modal-open');
    document.body.style.overflow = '';
    document.body.style.paddingRight = '';
}

function closeMobileSidebar() {
    const side = document.querySelector('.side');
    const backdrop = document.getElementById('side-backdrop');
    if (side) side.classList.remove('open');
    if (backdrop) {
        backdrop.classList.remove('active');
        backdrop.style.display = 'none';
    }
}

function go(name, el, skipHash, statusFilter) {
    closeAllModals();

    let targetEl = null;
    let filterVal = statusFilter;

    if (el) {
        if (typeof el === 'string') {
            filterVal = el;
        } else if (el instanceof HTMLElement || (typeof el === 'object' && el.classList)) {
            targetEl = el;
        }
    }

    closeMobileSidebar();

    document.querySelectorAll('.page').forEach(p => p.classList.remove('on'));
    const targetPage = document.getElementById('page-' + name);
    if (targetPage) {
        targetPage.classList.add('on');
    }

    document.querySelectorAll('.side-nav a').forEach(a => a.classList.remove('on'));
    if (targetEl) {
        targetEl.classList.add('on');
    } else {
        const parent = { 'renewal-detail': 'renewals', 'invoice-detail': 'invoices', 'ticket-detail': 'tickets', 'ticket-new': 'tickets' }[name];
        const target = parent || name;
        const link = Array.from(document.querySelectorAll('.side-nav a')).find(a => {
            const onclickAttr = a.getAttribute('onclick');
            return onclickAttr && onclickAttr.includes("'" + target + "'");
        });
        if (link) link.classList.add('on');
    }

    const t = titles[name];
    const topbarTitle = document.getElementById('topbar-title');
    if (t && topbarTitle) {
        topbarTitle.replaceChildren();
        const h1 = document.createElement('h1');
        h1.textContent = t[0];
        topbarTitle.appendChild(h1);
        if (t[1]) {
            const sub = document.createElement('div');
            sub.className = 'sub';
            sub.textContent = t[1];
            topbarTitle.appendChild(sub);
        }
    }
    if (t && t[0]) {
        updateDocumentTitle(t[0]);
    }

    const content = document.querySelector('.content');
    if (content) content.scrollTop = 0;
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (filterVal && typeof filterVal === 'string' && listState[name]) {
        listState[name].status = filterVal;
        if (typeof getPageSize === 'function') {
            listState[name].limit = getPageSize(name);
        }
    }

    if (name === 'tickets') renderTickets();
    else if (name === 'renewals') renderRenewals();
    else if (name === 'invoices') renderInvoices();
    else if (name === 'account') renderAccount();

    if (!skipHash) {
        updateUrlPath(name);
    }
}

// Route Restoration Handler for Initial Load & Popstate
function handleUrlRoute() {
    if (!portalData) return;

    let routeStr = '';
    const currentPath = window.location.pathname;
    if (currentPath.includes('/customer-portal')) {
        routeStr = currentPath.replace(/^.*\/customer-portal\/?/, '');
    }

    if (!routeStr && window.location.hash) {
        routeStr = window.location.hash.replace('#', '').trim();
    }

    routeStr = routeStr.replace(/^\/+|\/+$/g, '');

    if (!routeStr) {
        routeStr = 'dashboard';
    }

    // Direct match for tickets/new route variations
    if (routeStr === 'tickets/new' || routeStr === 'ticket-new') {
        openNewTicketModal();
        return;
    }

    const parts = routeStr.split('/');
    const mainTab = (parts[0] || '').toLowerCase();
    const detailId = parts.length > 1 ? decodeURIComponent(parts.slice(1).join('/')) : null;

    if (mainTab === 'tickets' && (detailId === 'new' || detailId === 'ticket-new')) {
        openNewTicketModal();
        return;
    }

    if (mainTab === 'ticket-new') {
        openNewTicketModal();
        return;
    }

    const validTabs = ['dashboard', 'renewals', 'invoices', 'tickets', 'account', 'ticket-new'];
    if (!validTabs.includes(mainTab)) {
        go('dashboard', null, true);
        return;
    }

    if (detailId) {
        let found = false;
        if (mainTab === 'renewals' && portalData.renewals) {
            const rec = portalData.renewals.find(r => r.name === detailId);
            if (rec) { openRenewalDetail(rec, true); found = true; }
        } else if (mainTab === 'invoices' && portalData.invoices) {
            const rec = portalData.invoices.find(inv => inv.name === detailId);
            if (rec) { openInvoiceDetail(rec, true); found = true; }
        } else if (mainTab === 'tickets') {
            const ticketsList = (portalData && portalData.support && portalData.support.tickets) ? portalData.support.tickets : (portalData.tickets || []);
            let rec = ticketsList.find(t => t.name === detailId);
            if (!rec && detailId && detailId !== 'new') {
                rec = { name: detailId, subject: 'Support Ticket', status: 'Open' };
            }
            if (rec) { openTicketDetail(rec, true); found = true; }
        }

        if (!found) {
            go(mainTab, null, true);
        }
    } else {
        go(mainTab, null, true);
    }
}

// Admin & System User Customer Switcher State
let adminPermittedCustomers = [];
let activeAdminCustomer = null;

// Fetch Portal Data from Frappe Backend
function fetchPortalData(targetCustomer, onComplete) {
    if (typeof targetCustomer === 'function') {
        onComplete = targetCustomer;
        targetCustomer = null;
    }

    if (!window.frappe || !window.frappe.call) {
        console.log("Frappe call not available in static environment.");
        return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const custParam = targetCustomer || urlParams.get('customer') || sessionStorage.getItem('cp_active_customer');

    frappe.call({
        method: "customer_portal.api.get_portal_data",
        args: custParam ? { customer_name: custParam } : {},
        callback: function (r) {
            if (r.message) {
                if (r.message.permission_denied) {
                    showPermissionDeniedScreen(r.message.error, r.message.permitted_customers);
                    return;
                }
                if (r.message.needs_customer_selection) {
                    adminPermittedCustomers = r.message.permitted_customers || [];
                    openAdminCustomerModal();
                    return;
                }
                if (r.message.error) {
                    showPermissionDeniedScreen(r.message.error);
                    return;
                }

                hidePermissionDeniedScreen();
                portalData = r.message;

                // Handle System User Admin Switcher UI
                if (portalData.is_system_user) {
                    const custName = portalData.customer_info?.customer_name || portalData.customer_info?.name;
                    activeAdminCustomer = custName;
                    sessionStorage.setItem('cp_active_customer', custName);
                    renderAdminViewingBadge(custName);
                } else {
                    hideAdminViewingBadge();
                }

                renderPortal();
                if (!onComplete) {
                    handleUrlRoute();
                }
                if (typeof onComplete === 'function') {
                    onComplete();
                }
            }
        }
    });
}

function renderAdminViewingBadge(customerName) {
    const badge = document.getElementById('admin-viewing-badge');
    const nameEl = document.getElementById('admin-viewing-cust-name');
    if (badge && nameEl) {
        nameEl.textContent = customerName || 'Select Customer';
        badge.style.display = 'inline-flex';
    }
}

function hideAdminViewingBadge() {
    const badge = document.getElementById('admin-viewing-badge');
    if (badge) badge.style.display = 'none';
}

function showPermissionDeniedScreen(msg, permittedList) {
    if (permittedList) adminPermittedCustomers = permittedList;
    document.querySelectorAll('.page').forEach(p => p.classList.remove('on'));
    const deniedPage = document.getElementById('page-permission-denied');
    if (deniedPage) {
        deniedPage.style.display = 'block';
        deniedPage.classList.add('on');
    }
    const msgEl = document.getElementById('portal-perm-denied-msg');
    if (msgEl) msgEl.textContent = msg || 'You do not have permission to view this customer account.';
}

function hidePermissionDeniedScreen() {
    const deniedPage = document.getElementById('page-permission-denied');
    if (deniedPage) {
        deniedPage.style.display = 'none';
        deniedPage.classList.remove('on');
    }
}

let adminCustSearchTimer = null;

function openAdminCustomerModal() {
    const modal = document.getElementById('modal-admin-select-customer');
    if (modal) {
        modal.style.display = 'flex';
        const searchInput = document.getElementById('admin-cust-search-input');
        if (searchInput) {
            searchInput.value = '';
            setTimeout(() => searchInput.focus(), 150);
        }

        // Fetch initial top 20 customers
        frappe.call({
            method: 'customer_portal.api.get_permitted_customers',
            args: { limit: 20 },
            callback: function (r) {
                adminPermittedCustomers = r.message || [];
                renderAdminCustomerList(adminPermittedCustomers);
            }
        });
    }
}

function closeAdminCustomerModal() {
    const modal = document.getElementById('modal-admin-select-customer');
    if (modal) modal.style.display = 'none';
}

function renderAdminCustomerList(customers) {
    const container = document.getElementById('admin-cust-modal-list');
    if (!container) return;
    container.replaceChildren();

    if (!customers || customers.length === 0) {
        container.appendChild(cel('div', {
            style: 'text-align:center;padding:24px;color:var(--ink-soft);font-size:13px;',
            textContent: 'No matching customers found or accessible.'
        }));
        return;
    }

    customers.forEach(c => {
        const isCurrent = activeAdminCustomer && (c.name === activeAdminCustomer || c.customer_name === activeAdminCustomer);
        const card = cel('div', {
            class: `admin-cust-card ${isCurrent ? 'active' : ''}`,
            style: 'display:flex;align-items:center;justify-content:space-between;padding:12px 16px;background:#ffffff;border:1px solid var(--line);border-radius:10px;cursor:pointer;transition:all 0.2s ease;',
            onclick: () => selectAdminCustomer(c.name)
        }, [
            cel('div', { style: 'display:flex;align-items:center;gap:12px;' }, [
                cel('div', {
                    style: 'width:36px;height:36px;border-radius:8px;background:var(--blue-light);color:var(--blue);display:grid;place-items:center;font-weight:700;font-size:14px;flex-shrink:0;'
                }, [(c.customer_name || c.name || 'C')[0].toUpperCase()]),
                cel('div', {}, [
                    cel('div', { style: 'font-weight:600;font-size:13.5px;color:var(--ink);' }, [c.customer_name || c.name]),
                    cel('div', { style: 'font-size:11.5px;color:var(--ink-soft);margin-top:2px;' }, [
                        [c.customer_group, c.territory].filter(Boolean).join(' · ') || c.name
                    ])
                ])
            ]),
            isCurrent ? cel('span', {
                style: 'font-size:11px;font-weight:700;color:var(--green);background:var(--green-wash);padding:4px 8px;border-radius:6px;'
            }, ['ACTIVE']) : cel('i', { class: 'ti ti-chevron-right', style: 'color:var(--ink-soft);' })
        ]);

        card.onmouseenter = () => { if (!isCurrent) card.style.borderColor = 'var(--blue)'; card.style.background = 'var(--bg)'; };
        card.onmouseleave = () => { if (!isCurrent) card.style.borderColor = 'var(--line)'; card.style.background = '#ffffff'; };

        container.appendChild(card);
    });
}

function filterAdminCustomerList(searchTerm) {
    const term = (searchTerm || '').trim();
    if (adminCustSearchTimer) clearTimeout(adminCustSearchTimer);

    // Immediate local match for responsive feel
    if (adminPermittedCustomers && adminPermittedCustomers.length > 0) {
        const localFiltered = adminPermittedCustomers.filter(c =>
            (c.customer_name && c.customer_name.toLowerCase().includes(term.toLowerCase())) ||
            (c.name && c.name.toLowerCase().includes(term.toLowerCase())) ||
            (c.customer_group && c.customer_group.toLowerCase().includes(term.toLowerCase())) ||
            (c.territory && c.territory.toLowerCase().includes(term.toLowerCase()))
        );
        if (localFiltered.length > 0 || !term) {
            renderAdminCustomerList(localFiltered);
        }
    }

    // Debounced live server search across entire database
    adminCustSearchTimer = setTimeout(() => {
        frappe.call({
            method: 'customer_portal.api.get_permitted_customers',
            args: { search_term: term, limit: term ? 50 : 20 },
            callback: function (r) {
                const results = r.message || [];
                renderAdminCustomerList(results);
            }
        });
    }, 200);
}

function selectAdminCustomer(customerName) {
    closeAdminCustomerModal();
    sessionStorage.setItem('cp_active_customer', customerName);

    // Update URL parameter cleanly without reloading page
    const url = new URL(window.location.href);
    url.searchParams.set('customer', customerName);
    window.history.replaceState({}, '', url.toString());

    fetchPortalData(customerName, () => {
        go('dashboard');
    });
}

function renderPortal() {
    if (!portalData) return;
    renderHeader();
    renderDashboard();
    renderRenewals();
    renderInvoices();
    renderTickets();
    renderAccount();
}

function getTimeBasedGreeting() {
    const hour = new Date().getHours();
    if (hour >= 4 && hour < 12) {
        return 'Good Morning,';
    } else if (hour >= 12 && hour < 17) {
        return 'Good Afternoon,';
    } else if (hour >= 17 && hour < 22) {
        return 'Good Evening,';
    } else {
        return 'Good Night,';
    }
}

// Header & User Details
function renderHeader() {
    const info = portalData.customer_info || {};
    const customerName = info.customer_name || 'Valued Customer';
    const userFullName = info.user_fullname || customerName;
    const userEmail = info.user_email || '';
    const initial = (userFullName || customerName).charAt(0).toUpperCase() || 'C';

    const sideAvatar = document.getElementById('side-user-avatar');
    if (sideAvatar) sideAvatar.textContent = initial;

    const sideName = document.getElementById('side-user-name');
    if (sideName) {
        sideName.textContent = userFullName;
        sideName.title = userFullName;
    }

    const sideSub = document.getElementById('side-user-sub');
    if (sideSub) {
        const subText = customerName !== userFullName ? customerName : userEmail;
        sideSub.textContent = subText;
        sideSub.title = subText;
    }

    const topbarAvatar = document.getElementById('topbar-avatar');
    if (topbarAvatar) {
        topbarAvatar.textContent = initial;
        topbarAvatar.title = userFullName;
    }

    const greetT = document.getElementById('greet-t');
    if (greetT) greetT.textContent = getTimeBasedGreeting();

    const greetName = document.getElementById('greet-name');
    if (greetName) greetName.textContent = `${userFullName} 👋`;

    // Dynamic company branding from ERPNext Company
    const compInfo = portalData.company_info || {};
    const sideBrandMark = document.getElementById('side-brand-mark');
    if (sideBrandMark) {
        if (compInfo.logo && compInfo.logo.trim()) {
            sideBrandMark.innerHTML = `<img src="${escapeHtml(compInfo.logo.trim())}" alt="Logo" onerror="this.replaceWith('${escapeHtml(compInfo.mark || '')}')"/>`;
        } else {
            sideBrandMark.textContent = compInfo.mark || '64';
        }
    }
    const sideBrandName = document.getElementById('side-brand-name');
    if (sideBrandName) {
        sideBrandName.textContent = compInfo.display_name || compInfo.company_name || 'NETWORK SECURITY';
        sideBrandName.title = compInfo.company_name || '';
    }

    // Populate dropdown header elements
    ['topbar', 'side'].forEach(type => {
        const uName = document.getElementById(`drop-${type}-user-name`);
        if (uName) {
            uName.textContent = userFullName;
            uName.title = userFullName;
        }
        const cName = document.getElementById(`drop-${type}-customer-name`);
        if (cName) {
            const subText = customerName !== userFullName ? customerName : userEmail;
            cName.textContent = subText;
            cName.title = subText;
        }
    });
}

// Account Dropdown & Logout Handlers
function toggleAccountDropdown(e, type = 'topbar') {
    if (e) e.stopPropagation();
    const dropId = type === 'side' ? 'side-account-dropdown' : 'topbar-account-dropdown';
    const drop = document.getElementById(dropId);
    if (!drop) return;
    const isOpen = drop.classList.contains('show');
    closeAccountDropdown();
    if (!isOpen) {
        drop.classList.add('show');
    }
}

function closeAccountDropdown() {
    document.querySelectorAll('.pf-account-dropdown').forEach(d => d.classList.remove('show'));
}

function handleLogout() {
    if (window.frappe && window.frappe.call) {
        frappe.call({
            method: 'logout',
            callback: function () {
                window.location.href = '/login';
            },
            error: function () {
                window.location.href = '/login';
            }
        });
    } else {
        window.location.href = '/login';
    }
}

// Dashboard Render
function renderDashboard() {
    const stats = portalData.stats || {};
    const custInfo = portalData.customer_info || {};

    const nameEl = document.getElementById('db-customer-name');
    if (nameEl && custInfo.customer_name) {
        nameEl.textContent = custInfo.customer_name;
    }

    const nameEl2 = document.getElementById('db-user-name');
    if (nameEl2 && (custInfo.user_fullname || custInfo.customer_name)) {
        nameEl2.textContent = custInfo.user_fullname || custInfo.customer_name;
        nameEl2.title = custInfo.user_fullname || custInfo.customer_name;
    }

    // Stat 1: Security Score (dynamic computation)
    const secHealth = portalData.security_health || {};
    const scoreValEl = document.getElementById('db-sec-score-val');
    const scoreLblEl = document.getElementById('db-sec-score-lbl');
    const fillEl = document.getElementById('db-sec-ring-fill');
    if (secHealth.score !== undefined && secHealth.score !== null) {
        const scoreVal = secHealth.score;
        const scoreLbl = secHealth.label || (scoreVal >= 80 ? 'Excellent' : scoreVal >= 60 ? 'Good' : 'Needs Attention');
        if (scoreValEl) scoreValEl.textContent = String(scoreVal);
        if (scoreLblEl) scoreLblEl.textContent = scoreLbl;
        if (fillEl) fillEl.setAttribute('stroke-dasharray', `${scoreVal}, 100`);
    } else {
        if (scoreValEl) scoreValEl.textContent = '-';
        if (scoreLblEl) scoreLblEl.textContent = 'Not Available';
        if (fillEl) fillEl.setAttribute('stroke-dasharray', `0, 100`);
    }

    // Stat 2: Open Tickets
    const openTkts = (portalData.support?.tickets || portalData.tickets || []).filter(t => (t.status || '').toLowerCase() !== 'closed' && (t.status || '').toLowerCase() !== 'resolved');
    const highPriorityCount = openTkts.filter(t => (t.priority || '').toLowerCase() === 'high' || (t.priority || '').toLowerCase() === 'urgent').length;
    const openTktEl = document.getElementById('db-stat-open-tickets');
    if (openTktEl) openTktEl.textContent = String(openTkts.length || stats.open_tickets || 0);
    const highPriEl = document.getElementById('db-stat-high-priority');
    if (highPriEl) highPriEl.textContent = `${highPriorityCount} High Priority`;

    // Stat 3: Upcoming Renewals (within 30 days)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const renewals = portalData.renewals || [];
    const upcomingRenewals = renewals.filter(ren => {
        const dispStatus = getRenewalDisplayStatus(ren);
        const endDate = ren.end_date ? new Date(ren.end_date) : null;
        const daysLeft = endDate ? Math.ceil((endDate - today) / (1000 * 60 * 60 * 24)) : 999;
        return dispStatus !== 'Expired' && dispStatus !== 'Draft' && daysLeft >= 0 && daysLeft <= 30;
    });
    const upRenEl = document.getElementById('db-stat-upcoming-renewals');
    if (upRenEl) upRenEl.textContent = String(upcomingRenewals.length);

    // Stat 4: Outstanding Invoices
    const openInvoices = (portalData.invoices || []).filter(inv => {
        const st = (getInvoiceDisplayStatus(inv) || '').toLowerCase();
        return st === 'unpaid' || st === 'overdue' || (inv.outstanding_amount && inv.outstanding_amount > 0);
    });
    const totalOutstanding = openInvoices.reduce((sum, inv) => sum + (inv.outstanding_amount || inv.grand_total || 0), 0);
    const outAmtEl = document.getElementById('db-stat-outstanding-amount');
    if (outAmtEl) outAmtEl.textContent = formatCurrency(totalOutstanding || stats.open_invoices_amount || 0);
    const openInvCntEl = document.getElementById('db-stat-open-invoices-count');
    if (openInvCntEl) openInvCntEl.textContent = `${openInvoices.length || stats.open_invoices_count || 0} Invoices`;

    // Stat 5: Active Products
    const activeProducts = renewals.filter(r => (getRenewalDisplayStatus(r) || '').toLowerCase() === 'active');
    const actProdEl = document.getElementById('db-stat-active-products');
    if (actProdEl) actProdEl.textContent = String(activeProducts.length || stats.active_licenses || 0);
    const catSet = new Set(activeProducts.map(r => r.category || r.item_group || r.product_category || 'General'));
    const actCatEl = document.getElementById('db-stat-active-categories');
    if (actCatEl) actCatEl.textContent = `Across ${catSet.size} ${catSet.size === 1 ? 'Category' : 'Categories'}`;

    // Render Subsections
    renderServiceOverviewChart();
    renderRenewalsDueSoonList();
    renderRecentTicketsList();
    renderOutstandingInvoicesList();
    renderActiveProductsSummary();
}

function renderServiceOverviewChart() {
    const wrap = document.getElementById('db-service-chart-wrap');
    if (!wrap) return;

    if (!wrap.dataset.resizeObserved && window.ResizeObserver) {
        wrap.dataset.resizeObserved = 'true';
        let resizeTimer = null;
        const ro = new ResizeObserver(() => {
            if (resizeTimer) cancelAnimationFrame(resizeTimer);
            resizeTimer = requestAnimationFrame(() => {
                renderServiceOverviewChart();
            });
        });
        ro.observe(wrap);
    }

    // Generate dynamic month labels for past N months
    const rangeSelect = document.getElementById('db-chart-range');
    const numMonths = rangeSelect && rangeSelect.value === '3m' ? 3 : (rangeSelect && rangeSelect.value === '12m' ? 12 : 6);

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const months = [];
    const today = new Date();
    for (let i = numMonths - 1; i >= 0; i--) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
        months.push({ label: monthNames[d.getMonth()], year: d.getFullYear(), monthIdx: d.getMonth() });
    }

    // Dynamic aggregated metrics per month from real portalData
    const allTickets = portalData.support?.tickets || portalData.tickets || [];

    const series1 = months.map(m => {
        return allTickets.filter(t => {
            if (!t.creation) return false;
            const d = new Date(t.creation);
            return d.getFullYear() === m.year && d.getMonth() === m.monthIdx;
        }).length;
    });

    const series2 = months.map(m => {
        return allTickets.filter(t => {
            if (!t.creation) return false;
            const st = (t.status || '').toLowerCase();
            const d = new Date(t.creation);
            return (st === 'resolved' || st === 'closed') && d.getFullYear() === m.year && d.getMonth() === m.monthIdx;
        }).length;
    });

    const series3 = months.map(m => {
        return allTickets.filter(t => {
            if (!t.creation) return false;
            const d = new Date(t.creation);
            return (t.sla_met || true) && d.getFullYear() === m.year && d.getMonth() === m.monthIdx;
        }).length;
    });

    const maxVal = Math.max(10, ...series1, ...series2, ...series3);
    const w = wrap.clientWidth > 0 ? wrap.clientWidth : 560;
    const h = wrap.clientHeight > 0 ? wrap.clientHeight : 200;
    const paddingLeft = 30;
    const paddingRight = 15;
    const paddingTop = 20;
    const paddingBottom = 25;
    const chartW = Math.max(10, w - paddingLeft - paddingRight);
    const chartH = Math.max(10, h - paddingTop - paddingBottom);

    const getCoords = (data) => {
        return data.map((val, idx) => {
            const x = paddingLeft + (idx / Math.max(1, data.length - 1)) * chartW;
            const y = h - paddingBottom - (val / maxVal) * chartH;
            return { x, y, val };
        });
    };

    const pts1 = getCoords(series1);
    const pts2 = getCoords(series2);
    const pts3 = getCoords(series3);

    const makeSmoothPath = (pts) => {
        if (!pts || pts.length === 0) return '';
        let d = `M ${pts[0].x} ${pts[0].y}`;
        for (let i = 0; i < pts.length - 1; i++) {
            const curr = pts[i];
            const next = pts[i + 1];
            const cp1x = curr.x + (next.x - curr.x) / 2;
            const cp1y = curr.y;
            const cp2x = curr.x + (next.x - curr.x) / 2;
            const cp2y = next.y;
            d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${next.x} ${next.y}`;
        }
        return d;
    };

    let gridLinesHtml = '';
    const step = Math.ceil(maxVal / 5);
    for (let v = 0; v <= maxVal; v += step) {
        const y = h - paddingBottom - (v / maxVal) * chartH;
        gridLinesHtml += `<line x1="${paddingLeft}" y1="${y}" x2="${w - paddingRight}" y2="${y}" stroke="#f1f5f9" stroke-width="1"/>`;
        gridLinesHtml += `<text x="${paddingLeft - 8}" y="${y + 4}" text-anchor="end" font-size="10" fill="#94a3b8" font-family="Inter">${v}</text>`;
    }

    let xLabelsHtml = '';
    months.forEach((m, idx) => {
        const x = paddingLeft + (idx / Math.max(1, months.length - 1)) * chartW;
        xLabelsHtml += `<text x="${x}" y="${h - 6}" text-anchor="middle" font-size="11" fill="#64748b" font-family="Inter">${m.label}</text>`;
    });

    const renderDots = (pts, color) => {
        return pts.map(p => `<circle cx="${p.x}" cy="${p.y}" r="4" fill="${color}" stroke="#ffffff" stroke-width="2"><title>${p.val}</title></circle>`).join('');
    };

    wrap.innerHTML = `
        <svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" style="width:100%; height:100%; overflow:visible;">
            ${gridLinesHtml}
            ${xLabelsHtml}
            <path d="${makeSmoothPath(pts1)}" fill="none" stroke="#2563eb" stroke-width="3" stroke-linecap="round"/>
            <path d="${makeSmoothPath(pts2)}" fill="none" stroke="#10b981" stroke-width="3" stroke-linecap="round"/>
            <path d="${makeSmoothPath(pts3)}" fill="none" stroke="#a855f7" stroke-width="3" stroke-linecap="round"/>
            ${renderDots(pts1, '#2563eb')}
            ${renderDots(pts2, '#10b981')}
            ${renderDots(pts3, '#a855f7')}
        </svg>
    `;
}

function getBrandInitials(str) {
    if (!str) return 'RN';
    let cleanStr = String(str).replace(/^ti-brand-/, '').replace(/^ti-/, '').trim();
    if (!cleanStr) return 'RN';
    const words = cleanStr.split(/[\s_\-]+/).filter(w => w.length > 0);
    if (words.length >= 2) {
        const c1 = words[0].replace(/[^a-zA-Z0-9]/g, '').charAt(0);
        const c2 = words[1].replace(/[^a-zA-Z0-9]/g, '').charAt(0);
        const pair = (c1 + c2).toUpperCase();
        if (pair.length === 2) return pair;
    }
    const single = cleanStr.replace(/[^a-zA-Z0-9]/g, '');
    if (single.length >= 2) {
        return single.slice(0, 2).toUpperCase();
    }
    return (single || 'RN').slice(0, 2).toUpperCase();
}

function createBrandIconElement(ren) {
    const childBrand = (ren.items && ren.items.length) ? (ren.items[0].item_brand || ren.items[0].brand) : '';
    const childLogo = (ren.items && ren.items.length) ? (ren.items[0].image || ren.items[0].logo) : '';

    const rawBrand = (ren.brand && !ren.brand.startsWith('ti-')) ? ren.brand : '';
    const brandName = ren.brand_name || rawBrand || childBrand || ren.product_name || ren.item_name || ren.name || 'Renewal';
    const logoUrl = ren.brand_logo || ren.logo || childLogo || ren.image || ren.item_image || ren.product_image || ren.brand_icon_url || ren.icon_url;

    const isImageUrl = logoUrl && typeof logoUrl === 'string' &&
        (logoUrl.startsWith('http://') || logoUrl.startsWith('https://') || logoUrl.startsWith('/') || logoUrl.startsWith('data:image/') || /\.(png|jpg|jpeg|svg|webp|ico|gif)/i.test(logoUrl));

    if (isImageUrl) {
        const img = cel('img', {
            src: logoUrl,
            alt: brandName,
            style: 'width:100%; height:100%; object-fit:contain; border-radius:6px; padding:3px;'
        });
        const container = cel('div', { class: 'db-brand-icon', style: 'overflow:hidden;' }, [img]);

        img.onerror = function () {
            const initials = getBrandInitials(brandName);
            container.replaceChildren(document.createTextNode(initials));
            container.style.background = '#eff6ff';
            container.style.color = '#2563eb';
            container.style.fontWeight = '700';
            container.style.fontSize = '13px';
            container.style.letterSpacing = '0.5px';
        };
        return container;
    }

    const initials = getBrandInitials(brandName);
    const bgColor = ren.brandBg || '#eff6ff';
    const textColor = ren.brandColor || '#2563eb';
    return cel('div', {
        class: 'db-brand-icon',
        style: `color:${textColor}; font-weight:700; font-size:13px; letter-spacing:0.5px;`
    }, [initials]);
}

function renderRenewalsDueSoonList() {
    const listEl = document.getElementById('db-renewals-due-list');
    if (!listEl) return;
    listEl.replaceChildren();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const renewals = (portalData.renewals || []).filter(ren => {
        const dispStatus = getRenewalDisplayStatus(ren);
        if (dispStatus === 'Draft') return false;
        const endDate = ren.end_date ? new Date(ren.end_date) : null;
        const daysLeft = endDate ? Math.ceil((endDate - today) / (1000 * 60 * 60 * 24)) : null;
        if (daysLeft === null) return false;
        // Show: expiring within next 90 days OR expired within last 30 days
        return daysLeft <= 90 && daysLeft >= -30;
    });

    renewals.sort((a, b) => {
        const dA = a.end_date ? new Date(a.end_date) : new Date(8640000000000000);
        const dB = b.end_date ? new Date(b.end_date) : new Date(8640000000000000);
        return dA - dB;
    });

    const items = renewals.slice(0, 3);
    if (items.length === 0) {
        listEl.appendChild(cel('div', { style: 'text-align:center; color:var(--ink-soft); padding:30px 12px; font-size:13px;' }, [
            cel('i', { class: 'ti ti-calendar-off', style: 'font-size:24px; display:block; margin-bottom:6px; opacity:0.6;' }),
            document.createTextNode('No renewals due soon.')
        ]));
        return;
    }

    items.forEach(ren => {
        const name = ren.product_name || ren.name;
        const endDate = ren.end_date ? new Date(ren.end_date) : null;
        const days = endDate ? Math.ceil((endDate - today) / (1000 * 60 * 60 * 24)) : 0;
        const isExpired = days < 0;
        const dateStr = ren.end_date ? formatDate(ren.end_date) : 'N/A';
        const qtyStr = ren.qty || (ren.quantity ? `${ren.quantity} Licenses` : '0 License');
        const subText = isExpired
            ? `${qtyStr} • Expired on ${dateStr}`
            : `${qtyStr} • Expires on ${dateStr}`;

        let daysClass;
        let daysNumText;
        let daysLblText;
        if (isExpired) {
            daysClass = 'red';
            daysNumText = String(Math.abs(days));
            daysLblText = 'Days Ago';
        } else if (days <= 7) {
            daysClass = 'red';
            daysNumText = String(days);
            daysLblText = 'Days Left';
        } else if (days <= 20) {
            daysClass = 'orange';
            daysNumText = String(days);
            daysLblText = 'Days Left';
        } else {
            daysClass = 'yellow';
            daysNumText = String(days);
            daysLblText = 'Days Left';
        }

        const row = cel('div', { class: 'db-renewal-item', onclick: () => openRenewalDetail(ren) }, [
            cel('div', { class: 'db-renewal-left' }, [
                createBrandIconElement(ren),
                cel('div', {}, [
                    cel('div', { class: 'db-renewal-title', textContent: name }),
                    cel('div', { class: 'db-renewal-sub', textContent: subText })
                ])
            ]),
            cel('div', { class: 'db-days-badge' }, [
                cel('div', { class: `db-days-num ${daysClass}`, textContent: daysNumText }),
                cel('div', { class: 'db-days-lbl', textContent: daysLblText })
            ])
        ]);
        listEl.appendChild(row);
    });
}

function renderRecentTicketsList() {
    const listEl = document.getElementById('db-recent-tickets-list');
    if (!listEl) return;
    listEl.replaceChildren();

    const tickets = portalData.support?.tickets || portalData.tickets || [];
    if (tickets.length === 0) {
        listEl.appendChild(cel('div', { style: 'text-align:center; color:var(--ink-soft); padding:30px 12px; font-size:13px;' }, [
            cel('i', { class: 'ti ti-inbox-off', style: 'font-size:24px; display:block; margin-bottom:6px; opacity:0.6;' }),
            document.createTextNode('No recent tickets found.')
        ]));
        return;
    }

    // Sort by creation descending
    const sortedTickets = [...tickets].sort((a, b) => String(b.creation || '').localeCompare(String(a.creation || '')));
    const items = sortedTickets.slice(0, 3);
    items.forEach(t => {
        const prio = (t.priority || 'Low').toLowerCase();
        const st = t.status || 'Open';
        const stColor = st.toLowerCase() === 'resolved' || st.toLowerCase() === 'closed' ? 'green' : 'blue';
        const metaStr = `#${t.name} • Created ${t.created_ago || (t.creation ? formatDate(t.creation) : 'recently')}`;

        const row = cel('div', { class: 'db-ticket-item', onclick: () => openTicketDetail(t) }, [
            cel('div', { style: 'display:flex; align-items:flex-start; gap:10px;' }, [
                cel('span', { class: `db-ticket-pill ${prio}`, textContent: t.priority || 'Low' }),
                cel('div', {}, [
                    cel('div', { class: 'db-ticket-title', textContent: t.subject }),
                    cel('div', { class: 'db-ticket-meta', textContent: metaStr })
                ])
            ]),
            cel('div', { class: `db-status-text ${stColor}` }, [
                document.createTextNode(st + ' '),
                cel('span', { style: 'font-size:8px;' }, ['●'])
            ])
        ]);
        listEl.appendChild(row);
    });
}

function renderOutstandingInvoicesList() {
    const listEl = document.getElementById('db-outstanding-invoices-list');
    if (!listEl) return;
    listEl.replaceChildren();

    const invoices = (portalData.invoices || []).filter(inv => {
        const st = (getInvoiceDisplayStatus(inv) || '').toLowerCase();
        return st === 'unpaid' || st === 'overdue' || (inv.outstanding_amount && inv.outstanding_amount > 0);
    });

    if (invoices.length === 0) {
        listEl.appendChild(cel('div', { style: 'text-align:center; color:var(--ink-soft); padding:30px 12px; font-size:13px;' }, [
            cel('i', { class: 'ti ti-file-off', style: 'font-size:24px; display:block; margin-bottom:6px; opacity:0.6;' }),
            document.createTextNode('No outstanding invoices.')
        ]));
        return;
    }

    const items = invoices.slice(0, 2);
    items.forEach(inv => {
        const st = getInvoiceDisplayStatus(inv) || inv.status || 'Unpaid';
        const isOverdue = st.toLowerCase() === 'overdue';
        const badgeClass = isOverdue ? 'pill red' : 'pill orange';

        const row = cel('div', { class: 'db-invoice-item', onclick: () => openInvoiceDetail(inv) }, [
            cel('div', {}, [
                cel('div', { class: 'db-invoice-name', textContent: inv.name }),
                cel('div', { class: 'db-invoice-date', textContent: formatDate(inv.posting_date) })
            ]),
            cel('div', {}, [
                cel('div', { class: 'db-invoice-amt', textContent: formatCurrency(inv.grand_total) }),
                cel('div', { style: 'text-align:right; margin-top:2px;' }, [
                    cel('span', { class: badgeClass, style: 'font-size:10.5px; padding:2px 6px;', textContent: st })
                ])
            ])
        ]);
        listEl.appendChild(row);
    });
}

function renderActiveProductsSummary() {
    const donutSvg = document.getElementById('db-products-donut-svg');
    const legendEl = document.getElementById('db-products-legend');
    const totalEl = document.getElementById('db-prod-donut-total');

    const activeProducts = (portalData.renewals || []).filter(r => (getRenewalDisplayStatus(r) || '').toLowerCase() === 'active');
    const total = activeProducts.length;
    if (totalEl) totalEl.textContent = String(total);

    if (total === 0) {
        if (donutSvg) {
            donutSvg.innerHTML = `<circle cx="18" cy="18" r="15.9155" fill="none" stroke="#e2e8f0" stroke-width="4.5"/>`;
        }
        if (legendEl) {
            legendEl.replaceChildren();
            legendEl.appendChild(cel('div', { style: 'font-size:12px; color:var(--ink-soft); font-style:italic;' }, ['No active products available.']));
        }
        return;
    }

    // Group dynamically Item Group-wise
    const categoryColors = ['#10b981', '#a855f7', '#2563eb', '#f97316', '#64748b', '#ec4899', '#06b6d4'];
    const catMap = {};
    activeProducts.forEach(r => {
        const childItem = (r.items && r.items.length) ? r.items[0] : {};
        let cat = r.item_group || childItem.item_group || r.category || r.product_category || 'General';
        if (!cat || typeof cat !== 'string' || !cat.trim() || cat.trim().toLowerCase() === 'undefined' || cat.trim().toLowerCase() === 'null') {
            cat = 'General';
        }
        cat = cat.trim();
        catMap[cat] = (catMap[cat] || 0) + 1;
    });

    const categories = Object.keys(catMap).map((catName, idx) => {
        const count = catMap[catName];
        const pct = Math.round((count / total) * 100);
        return {
            name: catName,
            count: count,
            pct: pct,
            color: categoryColors[idx % categoryColors.length]
        };
    });

    if (donutSvg) {
        let accumulatedPct = 0;
        let pathsHtml = '';
        categories.forEach(cat => {
            const strokeDash = `${cat.pct} ${100 - cat.pct}`;
            const strokeOffset = -accumulatedPct;
            accumulatedPct += cat.pct;
            pathsHtml += `<circle cx="18" cy="18" r="15.9155" fill="none" stroke="${cat.color}" stroke-width="4.5" stroke-dasharray="${strokeDash}" stroke-dashoffset="${strokeOffset}"/>`;
        });
        donutSvg.innerHTML = pathsHtml;
    }

    if (legendEl) {
        legendEl.replaceChildren();
        categories.forEach(cat => {
            const row = cel('div', { class: 'db-prod-legend-row' }, [
                cel('div', { class: 'db-prod-legend-label' }, [
                    cel('span', { class: 'db-legend-dot', style: `background:${cat.color}` }),
                    document.createTextNode(cat.name)
                ]),
                cel('div', { class: 'db-prod-legend-val', textContent: `${cat.count} (${cat.pct}%)` })
            ]);
            legendEl.appendChild(row);
        });
    }
}

// Renewals & Detail Render with Filtering & Pagination
function renderRenewals() {
    const tbody = document.getElementById('renewals-tbody');
    if (!tbody || !portalData) return;

    const rawRenewals = portalData.renewals || [];
    const search = listState.renewals.search.toLowerCase();
    const statusTab = listState.renewals.status;
    const today = new Date();

    // Compute Tab Counts
    let cntActive = 0, cntDue = 0, cntExpired = 0;
    rawRenewals.forEach(r => {
        const endDate = r.end_date ? new Date(r.end_date) : null;
        const daysLeft = endDate ? Math.ceil((endDate - today) / (1000 * 60 * 60 * 24)) : 999;
        const rawSt = (r.status || 'Active').toLowerCase();

        if (rawSt === 'draft') {
            // Draft excluded from visible tabs
        } else if (daysLeft < 0 || rawSt === 'expired' || rawSt === 'lost') {
            // Only count expired if within last 90 days
            if (daysLeft >= -90) cntExpired++;
        } else {
            cntActive++;
            if (daysLeft <= 30) {
                cntDue++;
            }
        }
    });

    const tabsRow = document.getElementById('renewals-tabs-row');
    if (tabsRow) {
        tabsRow.querySelectorAll('.tab').forEach(t => {
            const st = t.getAttribute('data-status') || 'active';
            if (st === statusTab) t.classList.add('on');
            else t.classList.remove('on');
        });
        const tActive = tabsRow.querySelector('[data-status="active"]');
        if (tActive) tActive.textContent = `Active (${cntActive})`;
        const tDue = tabsRow.querySelector('[data-status="due"]');
        if (tDue) tDue.textContent = `Due Soon 30d (${cntDue})`;
        const tExpired = tabsRow.querySelector('[data-status="expired"]');
        if (tExpired) tExpired.textContent = `Expired (${cntExpired})`;
    }

    // Filter Items
    let items = rawRenewals;
    if (statusTab === 'active') {
        // Active: not draft/expired/lost, and not yet expired
        items = items.filter(r => {
            const endDate = r.end_date ? new Date(r.end_date) : null;
            const daysLeft = endDate ? Math.ceil((endDate - today) / (1000 * 60 * 60 * 24)) : 999;
            const rawSt = (r.status || 'Active').toLowerCase();
            return rawSt !== 'draft' && rawSt !== 'expired' && rawSt !== 'lost' && daysLeft >= 0;
        });
    } else if (statusTab === 'due') {
        // Due Soon 30d: expiring within next 30 days
        items = items.filter(r => {
            const endDate = r.end_date ? new Date(r.end_date) : null;
            const daysLeft = endDate ? Math.ceil((endDate - today) / (1000 * 60 * 60 * 24)) : 999;
            const rawSt = (r.status || 'Active').toLowerCase();
            return rawSt !== 'draft' && rawSt !== 'expired' && rawSt !== 'lost' && daysLeft <= 30 && daysLeft >= 0;
        });
    } else if (statusTab === 'expired') {
        // Show only renewals expired within the last 90 days
        items = items.filter(r => {
            const endDate = r.end_date ? new Date(r.end_date) : null;
            const daysLeft = endDate ? Math.ceil((endDate - today) / (1000 * 60 * 60 * 24)) : 999;
            const rawSt = (r.status || '').toLowerCase();
            const isExpiredStatus = rawSt === 'expired' || rawSt === 'lost';
            // Must be past end_date AND within last 90 days
            return daysLeft < 0 && daysLeft >= -90 || (isExpiredStatus && daysLeft >= -90);
        });
    }

    if (search) {
        items = items.filter(r => {
            const dispSt = getRenewalDisplayStatus(r);
            const txt = `${r.name || ''} ${r.product_name || ''} ${r.invoice_no || ''} ${r.sales_user || ''} ${r.company || ''} ${r.total_amount || ''} ${dispSt}`.toLowerCase();
            return txt.includes(search);
        });
    }

    const totalCount = items.length;
    const limit = listState.renewals.limit || 10;
    const visibleItems = items.slice(0, limit);

    updateQueuePaginationUI('renewals', totalCount);

    tbody.replaceChildren();

    if (visibleItems.length === 0) {
        tbody.appendChild(cel('tr', {}, [cel('td', { colspan: 5, style: 'text-align:center;color:var(--ink-soft);padding:18px;' }, ['No matching renewals found.'])]));
        return;
    }

    visibleItems.forEach(ren => {
        const endDate = ren.end_date ? new Date(ren.end_date) : null;
        const daysLeft = endDate ? Math.ceil((endDate - today) / (1000 * 60 * 60 * 24)) : null;
        const dispStatus = getRenewalDisplayStatus(ren);
        const statusClass = getRenewalStatusClass(dispStatus);

        let daysBadgeClass = 'pill blue';
        let daysLabel = '-';
        if (daysLeft !== null) {
            if (daysLeft < 0) {
                daysBadgeClass = 'pill red';
                daysLabel = `${Math.abs(daysLeft)} Days Ago`;
            } else if (daysLeft <= 7) {
                daysBadgeClass = 'pill red';
                daysLabel = `${daysLeft} Days Left`;
            } else if (daysLeft <= 30) {
                daysBadgeClass = 'pill orange';
                daysLabel = `${daysLeft} Days Left`;
            } else {
                daysBadgeClass = 'pill green';
                daysLabel = `${daysLeft} Days Left`;
            }
        }

        const nameStr = ren.product_name || ren.name;
        const subStr = ren.product_name ? `ID: ${ren.name}` : `Renewal Service`;

        const tr = cel('tr', { onclick: () => openRenewalDetail(ren) }, [
            cel('td', {}, [
                cel('div', { class: 'tbl-item-cell' }, [
                    cel('div', { class: 'tbl-item-icon blue' }, [cel('i', { class: 'ti ti-refresh' })]),
                    cel('div', {}, [
                        cel('div', { class: 'tbl-item-title', textContent: nameStr }),
                        cel('div', { class: 'tbl-item-sub', textContent: subStr })
                    ])
                ])
            ]),
            cel('td', { style: 'vertical-align:middle;' }, [formatDate(ren.end_date)]),
            cel('td', { style: 'vertical-align:middle;' }, [
                cel('span', { class: daysBadgeClass }, [daysLabel])
            ]),
            cel('td', { style: 'vertical-align:middle; font-weight:700; font-variant-numeric:tabular-nums; color:#0f172a; font-size:14px;' }, [formatCurrency(ren.total_amount)]),
            cel('td', { style: 'vertical-align:middle;' }, [
                cel('span', { class: `pill ${statusClass}` }, [dispStatus])
            ])
        ]);
        tbody.appendChild(tr);
    });
}

function openRenewalDetail(ren, skipHash) {
    const setText = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.textContent = val || '-';
    };

    const dispStatus = getRenewalDisplayStatus(ren);
    const statusClass = getRenewalStatusClass(dispStatus);

    setText('rd-title', ren.product_name || ren.name);
    setText('rd-subtitle', `Renewal ID ${ren.name}`);
    setText('rd-date', formatDate(ren.end_date));
    setText('rd-amount', formatCurrency(ren.total_amount));
    setText('rd-qty', ren.total_quantity ? `${ren.total_quantity} units` : '0 unit');
    setText('rd-owner', ren.sales_user || ren.renewal_owner || '-');
    setText('rd-company', ren.company || portalData.customer_info?.customer_name || '-');
    setText('rd-status', dispStatus);

    const statusPill = document.getElementById('rd-status-pill');
    if (statusPill) {
        statusPill.textContent = dispStatus;
        statusPill.className = `pill ${statusClass}`;
    }

    const today = new Date();
    const endDate = ren.end_date ? new Date(ren.end_date) : null;
    const daysLeft = endDate ? Math.ceil((endDate - today) / (1000 * 60 * 60 * 24)) : '-';
    setText('rd-days-remaining', String(daysLeft));

    const itemsTbody = document.getElementById('rd-items-tbody');
    if (itemsTbody) {
        itemsTbody.replaceChildren();
        const countEl = document.getElementById('rd-items-count');
        const items = ren.items || [];
        if (countEl) countEl.textContent = `${items.length}`;

        if (items.length === 0) {
            itemsTbody.appendChild(cel('tr', {}, [
                cel('td', { colspan: '5', style: 'text-align:center;color:var(--ink-soft);padding:18px;' }, ['No items breakdown available.'])
            ]));
        } else {
            items.forEach(it => {
                const titleDiv = cel('div', { class: 'pf-item-title', textContent: it.item_name || it.item_code });
                const codeTag = it.item_code && it.item_name && it.item_code !== it.item_name ? cel('span', { class: 'pf-item-code-tag', textContent: it.item_code }) : null;
                const descNode = createItemDescNode(it.description || ren.description || '');

                itemsTbody.appendChild(cel('tr', {}, [
                    cel('td', {}, [titleDiv, codeTag, descNode]),
                    cel('td', { style: 'text-align:center;font-weight:600;' }, [String(it.qty || 1)]),
                    cel('td', { style: 'text-align:right;font-weight:600;font-variant-numeric:tabular-nums;' }, [formatCurrency(it.rate)]),
                    cel('td', { style: 'text-align:right;font-weight:700;color:var(--ink);font-variant-numeric:tabular-nums;' }, [formatCurrency(it.amount)]),
                    cel('td', { style: 'text-align:center;font-size:12px;color:var(--ink-soft);' }, [`${formatDate(it.start_date)} → ${formatDate(it.end_date)}`])
                ]));
            });
        }
    }

    // Description & Notes binding
    const descText = ren.description || ren.note || ren.terms || ren.remarks || '';
    const descCard = document.getElementById('rd-desc-card');
    const descTextEl = document.getElementById('rd-desc-text');
    const descWrap = document.getElementById('rd-desc-wrap');
    const descToggle = document.getElementById('rd-desc-toggle');

    if (descCard && descTextEl) {
        if (descText.trim()) {
            descCard.style.display = 'block';
            descTextEl.textContent = descText;
            if (descWrap) descWrap.classList.remove('expanded');
            if (descToggle) {
                descToggle.innerHTML = '<i class="ti ti-chevron-down"></i> Read More';
                setTimeout(() => {
                    if (descTextEl.scrollHeight > 72) {
                        descToggle.style.display = 'inline-flex';
                    } else {
                        descToggle.style.display = 'none';
                    }
                }, 50);
            }
        } else {
            descCard.style.display = 'none';
        }
    }

    go('renewal-detail', null, true);
    if (ren && (ren.product_name || ren.name)) {
        updateDocumentTitle('Renewal Details', ren.product_name || ren.name);
    }
    if (!skipHash && ren && ren.name) {
        updateUrlPath('renewals/' + encodeURIComponent(ren.name));
    }
}

// Invoices & Detail Render with Filtering & Pagination
function renderInvoices() {
    const tbody = document.getElementById('invoices-tbody');
    if (!tbody || !portalData) return;

    const rawInvoices = portalData.invoices || [];
    const search = listState.invoices.search.toLowerCase();
    const statusTab = listState.invoices.status;

    // Compute Tab Counts
    let cntAll = rawInvoices.length;
    let cntUnpaid = 0, cntPaid = 0, cntOverdue = 0;
    rawInvoices.forEach(inv => {
        const st = getInvoiceDisplayStatus(inv).toLowerCase();
        if (st === 'paid') cntPaid++;
        else if (st === 'overdue') cntOverdue++;
        else if (st === 'unpaid') cntUnpaid++;
    });

    const tabsRow = document.getElementById('invoices-tabs-row');
    if (tabsRow) {
        tabsRow.querySelectorAll('.tab').forEach(t => {
            const st = t.getAttribute('data-status') || 'all';
            if (st === statusTab) t.classList.add('on');
            else t.classList.remove('on');
        });
        const tAll = tabsRow.querySelector('[data-status="all"]');
        if (tAll) tAll.textContent = `All (${cntAll})`;
        const tUnpaid = tabsRow.querySelector('[data-status="unpaid"]');
        if (tUnpaid) tUnpaid.textContent = `Unpaid (${cntUnpaid})`;
        const tPaid = tabsRow.querySelector('[data-status="paid"]');
        if (tPaid) tPaid.textContent = `Paid (${cntPaid})`;
        const tOverdue = tabsRow.querySelector('[data-status="overdue"]');
        if (tOverdue) tOverdue.textContent = `Overdue (${cntOverdue})`;
    }

    // Filter Items
    let items = rawInvoices;
    if (statusTab === 'unpaid') {
        items = items.filter(inv => getInvoiceDisplayStatus(inv).toLowerCase() === 'unpaid');
    } else if (statusTab === 'paid') {
        items = items.filter(inv => getInvoiceDisplayStatus(inv).toLowerCase() === 'paid');
    } else if (statusTab === 'overdue') {
        items = items.filter(inv => getInvoiceDisplayStatus(inv).toLowerCase() === 'overdue');
    }

    if (search) {
        items = items.filter(inv => {
            const dispSt = getInvoiceDisplayStatus(inv);
            const txt = `${inv.name || ''} ${inv.posting_date || ''} ${inv.due_date || ''} ${inv.grand_total || ''} ${dispSt}`.toLowerCase();
            return txt.includes(search);
        });
    }

    const totalCount = items.length;
    const limit = listState.invoices.limit || 10;
    const visibleItems = items.slice(0, limit);

    updateQueuePaginationUI('invoices', totalCount);

    tbody.replaceChildren();

    if (visibleItems.length === 0) {
        tbody.appendChild(cel('tr', {}, [cel('td', { colspan: 5, style: 'text-align:center;color:var(--ink-soft);padding:18px;' }, ['No matching invoices found.'])]));
        return;
    }

    visibleItems.forEach(inv => {
        const dispStatus = getInvoiceDisplayStatus(inv);
        const statusClass = getInvoiceStatusClass(dispStatus);

        const tr = cel('tr', { onclick: () => openInvoiceDetail(inv) }, [
            cel('td', {}, [
                cel('div', { class: 'tbl-item-cell' }, [
                    cel('div', { class: 'tbl-item-icon green' }, [cel('i', { class: 'ti ti-file-invoice' })]),
                    cel('div', {}, [
                        cel('div', { class: 'tbl-item-title', textContent: inv.name }),
                        cel('div', { class: 'tbl-item-sub', textContent: `Due: ${formatDate(inv.due_date)}` })
                    ])
                ])
            ]),
            cel('td', { style: 'vertical-align:middle;' }, [formatDate(inv.posting_date)]),
            cel('td', { style: 'vertical-align:middle; font-weight:700; font-variant-numeric:tabular-nums; color:#0f172a; font-size:14px;' }, [formatCurrency(inv.grand_total)]),
            cel('td', { style: 'vertical-align:middle;' }, [cel('span', { class: `pill ${statusClass}` }, [dispStatus])]),
            cel('td', { style: 'vertical-align:middle;' }, [
                cel('button', { class: 'btn sm', style: 'padding:4px 8px; font-size:12px; margin-right:6px;', title: 'Preview Invoice PDF', onclick: (e) => { e.stopPropagation(); previewInvoicePdf(inv.name); } }, [
                    cel('i', { class: 'ti ti-eye', style: 'color:#2563eb;' }), document.createTextNode(' Preview')
                ]),
                cel('button', { class: 'btn sm', style: 'padding:4px 8px; font-size:12px;', title: 'Download PDF', onclick: (e) => { e.stopPropagation(); previewInvoicePdf(inv.name); } }, [
                    cel('i', { class: 'ti ti-download' })
                ])
            ])
        ]);
        tbody.appendChild(tr);
    });
}

function openInvoiceDetail(inv, skipHash) {
    currentInvoice = inv;
    const setText = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.textContent = val || '-';
    };

    const dispStatus = getInvoiceDisplayStatus(inv);

    const netTotal = inv.net_total != null ? inv.net_total : ((inv.grand_total || 0) - (inv.total_taxes_and_charges || 0));
    const totalTaxes = inv.total_taxes_and_charges != null ? inv.total_taxes_and_charges : ((inv.taxes || []).reduce((acc, t) => acc + (t.tax_amount || 0), 0));

    setText('inv-title', inv.name);
    setText('inv-subtitle', `Issued ${formatDate(inv.posting_date)} · Due ${formatDate(inv.due_date)}`);
    setText('inv-net-total', formatCurrency(netTotal));
    setText('inv-taxes-total', formatCurrency(totalTaxes));
    setText('inv-total', formatCurrency(inv.grand_total));
    setText('inv-due', formatCurrency(inv.outstanding_amount));
    setText('inv-status-val', dispStatus);
    const cleanAddr = (addrStr) => {
        if (!addrStr) return '';
        return addrStr
            .replace(/<br\s*[\/]?>/gi, ', ')
            .replace(/<[^>]*>/g, '')
            .replace(/\s+,/g, ',')
            .replace(/,\s*,/g, ', ')
            .replace(/,\s*$/, '')
            .trim();
    };

    setText('inv-customer-name', portalData.customer_info?.customer_name || 'Customer Name');
    const billingAddr = cleanAddr(inv.address_display) || portalData.customer_info?.billing_address || 'Primary Address';
    setText('inv-billing-address', billingAddr);

    setText('inv-ship-customer-name', portalData.customer_info?.customer_name || 'Customer Name');
    const shippingAddr = cleanAddr(inv.shipping_address) || portalData.customer_info?.shipping_address || billingAddr || '-';
    setText('inv-shipping-address', shippingAddr);

    const pdfBtn = document.getElementById('inv-pdf-btn');
    if (pdfBtn) {
        pdfBtn.onclick = () => previewInvoicePdf(inv.name);
    }

    const itemsTbody = document.getElementById('inv-items-tbody');
    if (itemsTbody) {
        itemsTbody.replaceChildren();
        const countEl = document.getElementById('inv-items-count');
        const items = inv.items || [];
        if (countEl) countEl.textContent = `${items.length}`;

        if (items.length === 0) {
            itemsTbody.appendChild(cel('tr', {}, [
                cel('td', { colspan: '4', style: 'text-align:center;color:var(--ink-soft);padding:18px;' }, ['No line items recorded.'])
            ]));
        } else {
            items.forEach(it => {
                const titleDiv = cel('div', { class: 'pf-item-title', textContent: it.item_name || it.item_code });
                const codeTag = it.item_code && it.item_name && it.item_code !== it.item_name ? cel('span', { class: 'pf-item-code-tag', textContent: it.item_code }) : null;
                const descNode = createItemDescNode(it.description || '');

                itemsTbody.appendChild(cel('tr', {}, [
                    cel('td', {}, [titleDiv, codeTag, descNode]),
                    cel('td', { style: 'text-align:center;font-weight:600;' }, [String(it.qty || 1)]),
                    cel('td', { style: 'text-align:right;font-weight:600;font-variant-numeric:tabular-nums;' }, [formatCurrency(it.rate)]),
                    cel('td', { style: 'text-align:right;font-weight:700;color:var(--ink);font-variant-numeric:tabular-nums;' }, [formatCurrency(it.amount)])
                ]));
            });
        }
    }

    // Render Taxes & Charges Breakdown
    const taxesCard = document.getElementById('inv-taxes-card');
    const taxesTbody = document.getElementById('inv-taxes-tbody');
    if (taxesTbody) {
        taxesTbody.replaceChildren();
        const taxes = inv.taxes || [];
        if (taxesCard) taxesCard.style.display = taxes.length > 0 ? 'block' : 'none';
        if (taxes.length === 0) {
            taxesTbody.appendChild(cel('tr', {}, [
                cel('td', { colspan: '3', style: 'text-align:center;color:var(--ink-soft);padding:18px;' }, ['No additional taxes and charges recorded.'])
            ]));
        } else {
            console.log("taxes", taxes);
            taxes.forEach(tx => {
                const taxName = tx.account_head || tx.description || 'Tax';
                const taxRate = tx.rate != null && tx.rate !== 0 ? `${tx.rate}%` : '-';
                taxesTbody.appendChild(cel('tr', {}, [
                    cel('td', { style: 'font-weight:600;' }, [taxName]),
                    cel('td', { style: 'text-align:center;font-weight:500;' }, [taxRate]),
                    cel('td', { style: 'text-align:right;font-weight:600;font-variant-numeric:tabular-nums;' }, [formatCurrency(tx.tax_amount)]),
                    cel('td', { style: 'text-align:right;font-weight:600;font-variant-numeric:tabular-nums;' }, [formatCurrency(tx.total)])
                ]));
            });
        }
    }

    go('invoice-detail', null, true);
    if (inv && inv.name) {
        updateDocumentTitle('Invoice Details', inv.name);
    }
    if (!skipHash && inv && inv.name) {
        updateUrlPath('invoices/' + encodeURIComponent(inv.name));
    }
}

function createItemDescNode(rawDesc) {
    if (!rawDesc || typeof rawDesc !== 'string' || !rawDesc.trim()) return null;

    const tempEl = document.createElement('div');
    tempEl.innerHTML = rawDesc;
    const plainText = (tempEl.textContent || tempEl.innerText || '').replace(/^description\s*:\s*/i, '').trim();

    if (!plainText || plainText === '-' || plainText === '--' || plainText === 'null' || plainText === 'No description provided.') {
        return null;
    }

    const wrapper = cel('div', { class: 'pf-item-desc-wrapper' });
    const descDiv = cel('div', { class: 'pf-item-desc' });
    descDiv.innerHTML = tempEl.innerHTML;
    wrapper.appendChild(descDiv);

    const isLong = plainText.length > 90 || (rawDesc.match(/<\/p>|<br\s*\/?>|\n/gi) || []).length > 1;

    if (isLong) {
        descDiv.classList.add('pf-item-desc-clamped');

        const toggleBtn = cel('button', {
            type: 'button',
            class: 'pf-desc-toggle-btn'
        }, [
            cel('span', { textContent: 'Show more ' }),
            cel('i', { class: 'ti ti-chevron-down' })
        ]);

        toggleBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            const isClamped = descDiv.classList.contains('pf-item-desc-clamped');
            if (isClamped) {
                descDiv.classList.remove('pf-item-desc-clamped');
                descDiv.classList.add('pf-item-desc-expanded');
                toggleBtn.querySelector('span').textContent = 'Show less ';
                toggleBtn.querySelector('i').className = 'ti ti-chevron-up';
            } else {
                descDiv.classList.remove('pf-item-desc-expanded');
                descDiv.classList.add('pf-item-desc-clamped');
                toggleBtn.querySelector('span').textContent = 'Show more ';
                toggleBtn.querySelector('i').className = 'ti ti-chevron-down';
            }
        });

        wrapper.appendChild(toggleBtn);
    }

    return wrapper;
}

function toggleDescription(wrapId) {
    const wrap = document.getElementById(wrapId);
    if (!wrap) return;
    const toggleBtn = wrap.querySelector('.toggle-desc-btn');
    const isExpanded = wrap.classList.contains('expanded');
    if (isExpanded) {
        wrap.classList.remove('expanded');
        if (toggleBtn) {
            toggleBtn.innerHTML = '<i class="ti ti-chevron-down"></i> Read More';
        }
    } else {
        wrap.classList.add('expanded');
        if (toggleBtn) {
            toggleBtn.innerHTML = '<i class="ti ti-chevron-up"></i> Show Less';
        }
    }
}

let currentInvoicePdfBlobUrl = null;
let currentInvoicePdfFilename = null;

function previewInvoicePdf(invoiceName) {
    const modal = document.getElementById('cp-invoice-pdf-modal');
    const iframe = document.getElementById('cp-pdf-modal-iframe');
    const loading = document.getElementById('cp-pdf-modal-loading');
    const titleEl = document.getElementById('cp-pdf-modal-title');
    const subtitleEl = document.getElementById('cp-pdf-modal-subtitle');

    if (!modal) {
        downloadInvoicePdf(invoiceName);
        return;
    }

    if (currentInvoicePdfBlobUrl) {
        URL.revokeObjectURL(currentInvoicePdfBlobUrl);
        currentInvoicePdfBlobUrl = null;
    }

    if (titleEl) titleEl.textContent = `Invoice Preview: ${invoiceName}`;
    if (subtitleEl) subtitleEl.textContent = `Sales Invoice · ${invoiceName}`;
    currentInvoicePdfFilename = `${invoiceName}.pdf`;

    if (iframe) {
        iframe.style.display = 'none';
        iframe.src = 'about:blank';
    }
    if (loading) loading.style.display = 'flex';

    modal.style.display = 'flex';

    if (!window.frappe || !window.frappe.call) {
        if (loading) loading.style.display = 'none';
        alert("Preview PDF for " + invoiceName);
        return;
    }

    frappe.call({
        method: "customer_portal.api.download_invoice_pdf",
        args: { invoice_name: invoiceName },
        callback: function (r) {
            if (r.message && r.message.pdf_b64) {
                if (r.message.filename) {
                    currentInvoicePdfFilename = r.message.filename;
                }
                const byteCharacters = atob(r.message.pdf_b64);
                const byteNumbers = new Array(byteCharacters.length);
                for (let i = 0; i < byteCharacters.length; i++) {
                    byteNumbers[i] = byteCharacters.charCodeAt(i);
                }
                const byteArray = new Uint8Array(byteNumbers);
                const blob = new Blob([byteArray], { type: 'application/pdf' });
                currentInvoicePdfBlobUrl = URL.createObjectURL(blob);

                if (iframe) {
                    iframe.src = currentInvoicePdfBlobUrl + '#toolbar=1';
                    iframe.style.display = 'block';
                }
                if (loading) loading.style.display = 'none';
            } else {
                if (loading) loading.style.display = 'none';
                alert("Could not generate invoice PDF.");
                cpCloseInvoicePdfModal();
            }
        },
        error: function () {
            if (loading) loading.style.display = 'none';
            alert("Failed to load invoice PDF preview.");
            cpCloseInvoicePdfModal();
        }
    });
}

function cpCloseInvoicePdfModal() {
    const modal = document.getElementById('cp-invoice-pdf-modal');
    const iframe = document.getElementById('cp-pdf-modal-iframe');
    if (modal) modal.style.display = 'none';
    if (iframe) iframe.src = 'about:blank';
    if (currentInvoicePdfBlobUrl) {
        URL.revokeObjectURL(currentInvoicePdfBlobUrl);
        currentInvoicePdfBlobUrl = null;
    }
}

function cpDownloadCurrentInvoicePdf() {
    if (!currentInvoicePdfBlobUrl) {
        alert("PDF is not ready for download.");
        return;
    }
    const link = document.createElement('a');
    link.href = currentInvoicePdfBlobUrl;
    link.download = currentInvoicePdfFilename || 'Sales-Invoice.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function cpPrintInvoicePdf() {
    const iframe = document.getElementById('cp-pdf-modal-iframe');
    if (iframe && iframe.contentWindow) {
        try {
            iframe.contentWindow.focus();
            iframe.contentWindow.print();
        } catch (e) {
            if (currentInvoicePdfBlobUrl) window.open(currentInvoicePdfBlobUrl, '_blank');
        }
    } else if (currentInvoicePdfBlobUrl) {
        window.open(currentInvoicePdfBlobUrl, '_blank');
    }
}

function downloadInvoicePdf(invoiceName) {
    if (!window.frappe || !window.frappe.call) {
        alert("Downloading PDF for " + invoiceName);
        return;
    }
    frappe.call({
        method: "customer_portal.api.download_invoice_pdf",
        args: { invoice_name: invoiceName },
        callback: function (r) {
            if (r.message && r.message.pdf_b64) {
                const byteCharacters = atob(r.message.pdf_b64);
                const byteNumbers = new Array(byteCharacters.length);
                for (let i = 0; i < byteCharacters.length; i++) {
                    byteNumbers[i] = byteCharacters.charCodeAt(i);
                }
                const byteArray = new Uint8Array(byteNumbers);
                const blob = new Blob([byteArray], { type: 'application/pdf' });
                const link = document.createElement('a');
                link.href = window.URL.createObjectURL(blob);
                link.download = r.message.filename || `${invoiceName}.pdf`;
                link.click();
            } else {
                alert("Could not generate invoice PDF.");
            }
        }
    });
}

// Tickets & Detail Render with Filtering & Pagination
function renderTickets() {
    const tbody = document.getElementById('tickets-tbody');
    if (!tbody || !portalData) return;

    const rawTickets = portalData.support?.tickets || portalData.tickets || [];
    const search = listState.tickets.search.toLowerCase();
    const statusTab = listState.tickets.status;

    // Compute Tab Counts
    let cntAll = rawTickets.length;
    let cntOpen = 0, cntClosed = 0;
    rawTickets.forEach(t => {
        const st = getTicketDisplayStatus(t).toLowerCase();
        if (st === 'closed' || st === 'resolved') cntClosed++;
        else cntOpen++;
    });

    const tabsRow = document.getElementById('tickets-tabs-row');
    if (tabsRow) {
        tabsRow.querySelectorAll('.tab').forEach(t => {
            const st = t.getAttribute('data-status') || 'all';
            if (st === statusTab) t.classList.add('on');
            else t.classList.remove('on');
        });
        const tAll = tabsRow.querySelector('[data-status="all"]');
        if (tAll) tAll.textContent = `All (${cntAll})`;
        const tOpen = tabsRow.querySelector('[data-status="open"]');
        if (tOpen) tOpen.textContent = `Open (${cntOpen})`;
        const tClosed = tabsRow.querySelector('[data-status="closed"]');
        if (tClosed) tClosed.textContent = `Closed (${cntClosed})`;
    }

    // Filter Items
    let items = rawTickets;
    if (statusTab === 'open') {
        items = items.filter(t => {
            const st = getTicketDisplayStatus(t).toLowerCase();
            return st !== 'closed' && st !== 'resolved';
        });
    } else if (statusTab === 'closed') {
        items = items.filter(t => {
            const st = getTicketDisplayStatus(t).toLowerCase();
            return st === 'closed' || st === 'resolved';
        });
    }

    if (search) {
        items = items.filter(t => {
            const dispSt = getTicketDisplayStatus(t);
            const txt = `${t.name || ''} ${t.subject || ''} ${t.custom_query_type || t.category || ''} ${t.priority || ''} ${dispSt} ${t.raised_by || ''}`.toLowerCase();
            return txt.includes(search);
        });
    }

    const totalCount = items.length;
    const limit = listState.tickets.limit || 10;
    const visibleItems = items.slice(0, limit);

    updateQueuePaginationUI('tickets', totalCount);

    tbody.replaceChildren();

    if (visibleItems.length === 0) {
        tbody.appendChild(cel('tr', {}, [cel('td', { colspan: 4, style: 'text-align:center;color:var(--ink-soft);padding:18px;' }, ['No matching tickets found.'])]));
        return;
    }

    visibleItems.forEach(t => {
        const dispStatus = getTicketDisplayStatus(t);
        const statusClass = getTicketStatusClass(dispStatus);
        const prioText = t.priority || '';
        const prioKey = prioText.toLowerCase();

        let prioClass = 'pill medium';
        if (prioKey === 'high' || prioKey === 'urgent') prioClass = 'pill high';
        else if (prioKey === 'low') prioClass = 'pill low';

        const tr = cel('tr', { onclick: () => openTicketDetail(t) }, [
            cel('td', {}, [
                cel('div', { class: 'tbl-item-cell' }, [
                    cel('div', { class: 'tbl-item-icon orange' }, [cel('i', { class: 'ti ti-ticket' })]),
                    cel('div', {}, [
                        cel('div', { class: 'tbl-item-title', textContent: t.subject }),
                        cel('div', { class: 'tbl-item-sub', textContent: `#${t.name} • Created ${t.created_ago || (t.creation ? formatDate(t.creation) : 'recently')}` })
                    ])
                ])
            ]),
            cel('td', { style: 'vertical-align:middle;' }, [
                cel('span', { class: prioClass }, [prioText])
            ]),
            cel('td', { style: 'vertical-align:middle;' }, [formatDate(t.creation)]),
            cel('td', { style: 'vertical-align:middle;' }, [
                cel('span', { class: `pill ${statusClass}` }, [dispStatus])
            ])
        ]);
        tbody.appendChild(tr);
    });
}

function renderTicketProgressStepper(ticket) {
    const container = document.getElementById('sd-stepper-container');
    if (!container) return;

    // 7 Steppers requested: Created, Assigned, Open, Client Input, OEM Escalated, Resolved, Closed
    const steps = [
        { key: 'created', label: 'Created' },
        { key: 'assigned', label: 'Assigned' },
        { key: 'open', label: 'Open' },
        { key: 'client_input', label: 'Client Input' },
        { key: 'oem_escalated', label: 'OEM Escalated' },
        { key: 'resolved', label: 'Resolved' },
        { key: 'closed', label: 'Closed' }
    ];

    const status = (ticket.status || '').toLowerCase();

    let activeIdx = 1;
    if (status.includes('closed')) {
        activeIdx = 7;
    } else if (status.includes('resolve')) {
        activeIdx = 6;
    } else if (status.includes('oem') || status.includes('escalat')) {
        activeIdx = 5;
    } else if (status.includes('client') || status.includes('input') || status.includes('pending')) {
        activeIdx = 4;
    } else if (status.includes('progress') || status.includes('open') || status.includes('work')) {
        activeIdx = 3;
    } else if (ticket.assigned_to || ticket.working_agent || ticket.assigned_team || (ticket.assignees && ticket.assignees.length > 0)) {
        activeIdx = 2;
    } else {
        activeIdx = 1;
    }

    container.replaceChildren();

    steps.forEach((step, idx) => {
        const stepNum = idx + 1;
        const isCompleted = stepNum < activeIdx || (stepNum === 7 && activeIdx === 7);
        const isActive = stepNum === activeIdx;

        let statusClass = '';
        if (isCompleted) statusClass = 'completed';
        else if (isActive) statusClass = 'active';

        const stepItem = document.createElement('div');
        stepItem.className = `tkt-step-item ${statusClass}`;

        const iconContent = isCompleted ? '<i class="ti ti-check"></i>' : stepNum;

        let stepTime = '';
        if (stepNum === 1 && ticket.creation) {
            stepTime = formatDate(ticket.creation);
        } else if (isActive && ticket.modified) {
            stepTime = formatDate(ticket.modified);
        }

        stepItem.innerHTML = `
            <div class="tkt-step-line"></div>
            <div class="tkt-step-icon">${iconContent}</div>
            <div class="tkt-step-label">${step.label}</div>
            <div class="tkt-step-time">${stepTime}</div>
        `;

        container.appendChild(stepItem);
    });
}

function renderTicketHappeningNow(ticket) {
    const textEl = document.getElementById('sd-happening-now-text');
    if (!textEl) return;

    const status = (ticket.status || '').toLowerCase();

    if (status.includes('closed')) {
        textEl.textContent = 'This ticket has been closed. Thank you for using our support service.';
    } else if (status.includes('resolve')) {
        textEl.textContent = 'Our support team has provided a resolution for your ticket.';
    } else if (status.includes('oem') || status.includes('escalat')) {
        textEl.textContent = 'Your ticket has been escalated to our specialized OEM technical partners for detailed resolution.';
    } else if (status.includes('client') || status.includes('input') || status.includes('pending')) {
        textEl.textContent = 'Our support team is awaiting additional information/input from you to proceed.';
    } else if (status.includes('progress') || status.includes('open')) {
        textEl.textContent = 'Our technical support team is actively checking the ticket configuration and working on resolution.';
    } else {
        textEl.textContent = 'Your ticket has been logged and assigned to our technical support team for initial analysis.';
    }
}

let allConversationMessages = [];
let showAllConversation = false;

function renderTicketConversation(communications, ticket) {
    const convoEl = document.getElementById('sd-conversation-list');
    if (!convoEl) return;

    convoEl.replaceChildren();

    const comms = Array.isArray(communications) && communications.length > 0
        ? communications
        : (ticket && ticket.comments ? ticket.comments : []);

    allConversationMessages = comms;

    if (!comms.length) {
        convoEl.innerHTML = '<div style="padding:14px;text-align:center;color:#94a3b8;font-size:13px;font-style:italic;">No replies recorded yet. Use the reply box below to send a message.</div>';
        return;
    }

    // Limit display to latest 5 messages by default to avoid excessive space
    const MAX_CONVO = 5;
    const hasMore = comms.length > MAX_CONVO;
    const displayComms = (!showAllConversation && hasMore) ? comms.slice(-MAX_CONVO) : comms;

    if (hasMore) {
        const topBar = document.createElement('div');
        topBar.style.cssText = 'display:flex;justify-content:center;margin-bottom:14px;';
        const toggleBtn = document.createElement('button');
        toggleBtn.type = 'button';
        toggleBtn.className = 'td-btn';
        toggleBtn.style.cssText = 'font-size:11.5px;padding:4px 14px;border-radius:20px;background:#f1f5f9;color:#0284c7;font-weight:600;cursor:pointer;';
        toggleBtn.innerHTML = showAllConversation
            ? '<i class="ti ti-chevron-up"></i> Collapse Older Messages'
            : `<i class="ti ti-history"></i> View ${comms.length - MAX_CONVO} Older Message${comms.length - MAX_CONVO > 1 ? 's' : ''}`;
        toggleBtn.onclick = function () {
            showAllConversation = !showAllConversation;
            renderTicketConversation(allConversationMessages, ticket);
        };
        topBar.appendChild(toggleBtn);
        convoEl.appendChild(topBar);
    }

    displayComms.forEach(c => {
        const senderEmail = (c.sender || c.comment_email || '').toLowerCase();
        const currentCustEmail = (portalData?.customer_info?.email || frappe.session.user || '').toLowerCase();
        const isCustomer = senderEmail === currentCustEmail || (c.sender_full_name && c.sender_full_name.includes('(You)'));

        let authorName = c.sender_full_name || c.sender || (isCustomer ? 'Customer' : 'Support Team');
        const initials = getInitials(authorName);
        let bubbleContent = c.content || c.description || c.subject || '';

        if (bubbleContent.includes('href=') && (bubbleContent.includes('.png') || bubbleContent.includes('.jpg') || bubbleContent.includes('.jpeg') || bubbleContent.includes('.webp') || bubbleContent.includes('.gif'))) {
            bubbleContent = bubbleContent.replace(/<a href="([^"]+\.(?:png|jpg|jpeg|webp|gif))"[^>]*>(.*?)<\/a>/gi, function (match, imgUrl, text) {
                return `
                    <div style="margin-top:6px;">
                        <a href="${imgUrl}" target="_blank" style="display:inline-block;border-radius:8px;overflow:hidden;border:1px solid #e2e8f0;max-width:260px;max-height:180px;">
                            <img src="${imgUrl}" alt="Attachment" style="max-width:100%;height:auto;display:block;">
                        </a>
                        <div style="margin-top:4px;font-size:11.5px;"><a href="${imgUrl}" target="_blank" style="color:var(--indigo);font-weight:600;">${text || '📎 View Image'}</a></div>
                    </div>
                `;
            });
        }

        const msgItem = document.createElement('div');
        msgItem.className = 'tkt-convo-item';
        msgItem.innerHTML = `
            <div class="tkt-convo-avatar ${isCustomer ? '' : 'support'}">${initials}</div>
            <div class="tkt-convo-body">
                <div class="tkt-convo-header">
                    <span class="tkt-convo-author">${safeEscape(authorName)} <span style="font-size:10.5px;font-weight:700;padding:2px 7px;border-radius:4px;background:${isCustomer ? '#f0f9ff;color:#0284c7;border:1px solid #bae6fd;' : '#ecfdf5;color:#10b981;border:1px solid #a7f3d0;'};margin-left:6px;">${isCustomer ? 'Customer' : 'Support Team'}</span></span>
                    <span class="tkt-convo-time">${formatRelativeTime(c.creation || c.timestamp)}</span>
                </div>
                <div class="tkt-convo-bubble" style="${isCustomer ? 'background:#f8fafc;' : 'background:#f0fdf4;border-color:#bbf7d0;'}">${bubbleContent}</div>
            </div>
        `;
        convoEl.appendChild(msgItem);
    });
}

function tdPageTab(tabEl, panelId) {
    document.querySelectorAll('.td-page-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.td-page-panel').forEach(p => p.classList.remove('active'));
    if (tabEl) {
        tabEl.classList.add('active');
    }
    const panel = document.getElementById(panelId);
    if (panel) {
        panel.classList.add('active');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function scrollToReplyBox() {
    tdPageTab(document.querySelector('.td-page-tab'), 'tab-overview');
    const input = document.getElementById('sd-reply-input');
    if (input) {
        input.scrollIntoView({ behavior: 'smooth', block: 'center' });
        input.focus();
    }
}

function renderTicketSLA(ticket) {
    const expectedResEl = document.getElementById('sd-expected-resolution');
    const slaStatusBadge = document.getElementById('sd-sla-status-badge');
    const progressPctEl = document.getElementById('sd-sla-progress-pct');
    const gaugeCircle = document.getElementById('sd-sla-gauge-circle');
    const responseSlaVal = document.getElementById('sd-response-sla-val');
    const resolutionSlaVal = document.getElementById('sd-resolution-sla-val');
    const responseBox = document.getElementById('sd-response-sla-box');
    const resolutionBox = document.getElementById('sd-resolution-sla-box');

    if (!ticket) return;

    const status = (ticket.status || '').toLowerCase();
    const isResolved = status.includes('closed') || status.includes('resolve') || ticket.resolution_date;
    const resolutionTarget = ticket.resolution_by || ticket.sla_resolution_by;
    const responseTarget = ticket.response_by || ticket.sla_t1;
    const creationTime = ticket.creation ? new Date(ticket.creation).getTime() : null;
    const now = Date.now();

    // Overdue check
    let isResolutionOverdue = false;
    if (!isResolved && resolutionTarget) {
        const targetMs = new Date(resolutionTarget).getTime();
        if (!isNaN(targetMs) && now > targetMs) {
            isResolutionOverdue = true;
        }
    }

    let isResponseOverdue = false;
    const hasResponded = ticket.first_responded_on || ticket.working_agent || ticket.assigned_to || (ticket.assignees && ticket.assignees.length > 0) || status !== 'open';
    if (!hasResponded && responseTarget) {
        const respMs = new Date(responseTarget).getTime();
        if (!isNaN(respMs) && now > respMs) {
            isResponseOverdue = true;
        }
    }

    const agreementStatus = (ticket.agreement_status || '').toLowerCase();
    const isBreached = isResolutionOverdue || isResponseOverdue || agreementStatus.includes('failed') || agreementStatus.includes('breach') || agreementStatus.includes('overdue');

    // Expected resolution text
    if (expectedResEl) {
        if (resolutionTarget) {
            expectedResEl.textContent = formatDateTime(resolutionTarget);
        } else if (isResolved && ticket.resolution_date) {
            expectedResEl.textContent = formatDateTime(ticket.resolution_date);
        } else {
            expectedResEl.textContent = 'Not specified';
        }
    }

    // Donut Gauge % Calculation (from 0% at creation time to 100% at SLA resolution deadline)
    let pct = 0;
    if (isResolved) {
        pct = 100;
    } else if (isResolutionOverdue || isBreached) {
        pct = 100;
    } else if (creationTime && resolutionTarget) {
        const targetMs = new Date(resolutionTarget).getTime();
        if (!isNaN(targetMs) && targetMs > creationTime) {
            const elapsed = Math.max(0, now - creationTime);
            const total = targetMs - creationTime;
            pct = Math.min(Math.round((elapsed / total) * 100), 100);
        } else {
            pct = 0;
        }
    } else {
        pct = 0;
    }

    // Dynamic Status Color & Badge State
    let statusColor = 'var(--td-cyan, #0f7fb8)';
    let badgeText = 'WITHIN SLA';
    let badgeClass = 'td-sla-badge';

    if (isResolved) {
        statusColor = 'var(--td-green, #10b981)';
        badgeText = 'RESOLVED';
        badgeClass = 'td-sla-badge';
    } else if (isBreached || isResolutionOverdue || pct >= 100) {
        statusColor = 'var(--td-red, #d13a58)';
        badgeText = 'SLA BREACHED';
        badgeClass = 'td-sla-badge breached';
    } else if (pct >= 75) {
        statusColor = 'var(--td-amber, #c96f0a)';
        badgeText = 'NEAR SLA';
        badgeClass = 'td-sla-badge warning';
    } else {
        statusColor = 'var(--td-cyan, #0f7fb8)';
        badgeText = 'WITHIN SLA';
        badgeClass = 'td-sla-badge';
    }

    // Badge
    if (slaStatusBadge) {
        slaStatusBadge.textContent = badgeText;
        slaStatusBadge.className = badgeClass;
    }

    if (progressPctEl) {
        progressPctEl.textContent = `${pct}%`;
        progressPctEl.style.color = statusColor;
    }

    if (gaugeCircle) {
        const dashOffset = 201 * (1 - pct / 100);
        gaugeCircle.style.strokeDashoffset = Math.max(0, dashOffset);
        gaugeCircle.style.stroke = statusColor;
    }

    // Response Box
    if (responseSlaVal) {
        if (hasResponded) {
            responseSlaVal.innerHTML = `<i class="ti ti-check" style="color:var(--td-green, #10b981);"></i><span class="sla-val-txt">Completed</span>`;
            if (responseBox) responseBox.className = 'v done';
        } else if (isResponseOverdue) {
            responseSlaVal.innerHTML = `<i class="ti ti-alert-circle" style="color:var(--td-red, #ef4444);"></i><span class="sla-val-txt">Overdue (${formatDateTime(responseTarget)})</span>`;
            if (responseBox) responseBox.className = 'v pending';
        } else if (responseTarget) {
            responseSlaVal.innerHTML = `<i class="ti ti-clock" style="color:var(--td-amber, #f59e0b);"></i><span class="sla-val-txt">Due ${formatDateTime(responseTarget)}</span>`;
            if (responseBox) responseBox.className = 'v pending';
        } else {
            responseSlaVal.innerHTML = `<i class="ti ti-clock" style="color:var(--td-amber, #f59e0b);"></i><span class="sla-val-txt">In Progress</span>`;
            if (responseBox) responseBox.className = 'v pending';
        }
    }

    // Resolution Box
    if (resolutionSlaVal) {
        if (isResolved) {
            resolutionSlaVal.innerHTML = `<i class="ti ti-check" style="color:var(--td-green, #10b981);"></i><span class="sla-val-txt">Completed</span>`;
            if (resolutionBox) resolutionBox.className = 'v done';
        } else if (isResolutionOverdue) {
            resolutionSlaVal.innerHTML = `<i class="ti ti-alert-circle" style="color:var(--td-red, #ef4444);"></i><span class="sla-val-txt">Overdue (${formatDateTime(resolutionTarget)})</span>`;
            if (resolutionBox) resolutionBox.className = 'v pending';
        } else if (resolutionTarget) {
            resolutionSlaVal.innerHTML = `<i class="ti ti-clock" style="color:var(--td-amber, #f59e0b);"></i><span class="sla-val-txt">Due ${formatDateTime(resolutionTarget)}</span>`;
            if (resolutionBox) resolutionBox.className = 'v pending';
        } else {
            resolutionSlaVal.innerHTML = `<i class="ti ti-clock" style="color:var(--td-amber, #f59e0b);"></i><span class="sla-val-txt">In Progress</span>`;
            if (resolutionBox) resolutionBox.className = 'v pending';
        }
    }
}

function openTicketDetail(ticket, skipHash) {
    currentTicket = ticket;
    window.currentPortalTicketName = ticket ? ticket.name : null;

    // Reset or preserve active tab
    const activeTabEl = document.querySelector('.td-page-tab.active');
    const activePanelId = activeTabEl ? (activeTabEl.getAttribute('onclick')?.match(/'([^']+)'/)?.[1] || 'tab-overview') : 'tab-overview';
    if (!skipHash) {
        tdPageTab(document.querySelector('.td-page-tab'), 'tab-overview');
    } else {
        const currentTab = document.querySelector(`.td-page-tab[onclick*="${activePanelId}"]`);
        if (currentTab) tdPageTab(currentTab, activePanelId);
    }

    const setText = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.textContent = val || '-';
    };

    const updateStatusPillsAndBadges = (t) => {
        const dispStatus = getTicketDisplayStatus(t);
        const statusClass = getTicketStatusClass(dispStatus);

        const statusPill = document.getElementById('sd-status-pill');
        if (statusPill) {
            statusPill.textContent = dispStatus;
        }

        const statusLed = document.getElementById('sd-status-led');
        if (statusLed) {
            statusLed.className = 'td-led';
            if (statusClass.includes('green') || statusClass.includes('closed') || statusClass.includes('resolved')) {
                statusLed.classList.add('green');
            } else if (statusClass.includes('cyan') || statusClass.includes('progress')) {
                statusLed.classList.add('cyan');
            } else if (statusClass.includes('red') || statusClass.includes('escalat')) {
                statusLed.classList.add('red');
            }
        }
    };

    updateStatusPillsAndBadges(ticket);

    setText('sd-ticket-id', ticket.name || '');
    setText('sd-subject', ticket.subject || '');
    setText('sd-created', formatDate(ticket.creation));
    setText('sd-updated', formatDate(ticket.modified || ticket.creation));
    setText('sd-salesperson', ticket.sales_person || ticket.sales_person_details?.full_name);
    setText('sd-workingagent', ticket.working_agent_name || ticket.working_agent);

    const priorityPill = document.getElementById('sd-priority-pill');
    if (priorityPill) {
        priorityPill.textContent = `${ticket.priority || 'Medium'}`;
    }

    renderTicketSLA(ticket);
    setRichTextOrCleanHtml('sd-description', ticket.description, 'No description text provided for this ticket.');
    renderTicketAttachments(ticket.attachments || []);
    renderTicketFilesGrid(ticket.attachments || []);
    renderTicketActivity(ticket.activity || []);
    renderTicketEmailLogs(ticket.emails || []);
    renderTicketConversation(ticket.comments || ticket.conversation || ticket.communications || [], ticket);

    if (typeof renderTicketAssignments === 'function') {
        renderTicketAssignments(ticket.assignees_details || ticket.assignees || []);
    }
    if (typeof renderTicketScopeOfWork === 'function') {
        renderTicketScopeOfWork(ticket.scope_of_work || ticket.custom_scope_of_work || '');
    }
    if (typeof renderTicketChecklist === 'function') {
        renderTicketChecklist(ticket.checklist_items || [], ticket.checklist_state || ticket.custom_checklist_state || '');
    }
    if (typeof renderTicketContacts === 'function') {
        renderTicketContacts(ticket.customer_contacts || ticket.issue_contact_list || [], ticket);
    }
    if (typeof renderTicketRenewals === 'function') {
        renderTicketRenewals(ticket.active_renewals || []);
    }

    // Sidebar Info Card
    setText('sd-info-support-type', ticket.custom_support_type || ticket.support_type || '-');
    setText('sd-info-query-type', ticket.custom_query_type || ticket.category || '-');
    setText('sd-info-contact-name', ticket.person_name || ticket.raised_by_details?.full_name || portalData?.customer_info?.customer_name || '-');
    setText('sd-info-contact-email', ticket.contact_email || portalData?.customer_info?.email || '-');
    setText('sd-info-assigned-team', ticket.assigned_team || ticket.working_agent_name || ticket.support_team || '-');

    // Resolution Card
    const resCard = document.getElementById('sd-resolution-card');
    const resBadge = document.getElementById('sd-res-status-badge');
    const resDesc = document.getElementById('sd-res-desc-text');
    const resDetails = ticket.resolution_details || ticket.resolution || '';

    if ((resDetails && resDetails.trim() && resDetails !== '-') || ticket.status === 'Resolved' || ticket.status === 'Closed') {
        if (resCard) resCard.style.display = 'block';
        if (resBadge) {
            resBadge.textContent = ticket.status === 'Closed' ? 'Closed' : 'Resolved';
        }
        if (resDesc) {
            resDesc.textContent = resDetails || `Ticket marked as ${ticket.status}.`;
        }
    } else {
        if (resCard) resCard.style.display = 'none';
    }

    go('ticket-detail', null, true);
    if (ticket && ticket.name) {
        updateDocumentTitle('Ticket Details', ticket.subject || ('Ticket #' + ticket.name));
    }
    if (!skipHash && ticket && ticket.name) {
        updateUrlPath('tickets/' + encodeURIComponent(ticket.name));
    }

    // Fetch live ticket details from server
    if (ticket && ticket.name && window.frappe && window.frappe.call) {
        frappe.call({
            method: 'customer_portal.api.get_ticket_details',
            args: { ticket_name: ticket.name },
            callback: function (r) {
                if (r && r.message) {
                    const d = r.message.issue || r.message;
                    currentTicket = d;

                    updateStatusPillsAndBadges(d);

                    setText('sd-ticket-id', d.name || '');
                    setText('sd-subject', d.subject || '');
                    setText('sd-created', formatDate(d.creation));
                    setText('sd-updated', formatDate(d.modified || d.creation));
                    setText('sd-salesperson', d.sales_person || d.sales_person_details?.full_name);
                    setText('sd-workingagent', d.working_agent_name || d.working_agent);

                    if (priorityPill) {
                        priorityPill.textContent = `${d.priority || 'Medium'}`;
                    }

                    setRichTextOrCleanHtml('sd-description', d.description, 'No description text provided for this ticket.');

                    renderTicketSLA(d);
                    renderTicketContacts(r.message.customer_contacts || d.customer_contacts || d.issue_contact_list || [], d);
                    renderTicketRenewals(r.message.active_renewals || d.active_renewals || []);
                    renderTicketAttachments(r.message.attachments || d.attachments || []);
                    renderTicketFilesGrid(r.message.attachments || d.attachments || []);
                    renderTicketActivity(r.message.activity || []);
                    renderTicketEmailLogs(r.message.emails || []);
                    renderTicketConversation(r.message.comments || r.message.communications || d.comments || d.conversation || [], d);

                    if (typeof renderTicketAssignments === 'function') {
                        renderTicketAssignments(r.message.assignees_details || d.assignees_details || d.assignees || []);
                    }
                    if (typeof renderTicketScopeOfWork === 'function') {
                        renderTicketScopeOfWork(d.scope_of_work || d.custom_scope_of_work || '');
                    }
                    if (typeof renderTicketChecklist === 'function') {
                        renderTicketChecklist(r.message.checklist_items || d.checklist_items || [], d.checklist_state || d.custom_checklist_state || '');
                    }

                    setText('sd-info-support-type', d.custom_support_type || d.support_type || '-');
                    setText('sd-info-query-type', d.custom_query_type || d.category || '-');
                    setText('sd-info-contact-name', d.person_name || d.raised_by_details?.full_name || portalData?.customer_info?.customer_name || '-');
                    setText('sd-info-contact-email', d.contact_email || portalData?.customer_info?.email || '-');
                    setText('sd-info-assigned-team', d.assigned_team || d.working_agent_name || d.support_team || '-');

                    const dResDetails = d.resolution_details || d.resolution || '';
                    if ((dResDetails && dResDetails.trim() && dResDetails !== '-') || d.status === 'Resolved' || d.status === 'Closed') {
                        if (resCard) resCard.style.display = 'block';
                        if (resBadge) {
                            resBadge.textContent = d.status === 'Closed' ? 'Closed' : 'Resolved';
                        }
                        if (resDesc) {
                            resDesc.textContent = dResDetails || `Ticket marked as ${d.status}.`;
                        }
                    } else {
                        if (resCard) resCard.style.display = 'none';
                    }
                }
            }
        });
    }
}

function setRichTextOrCleanHtml(elOrId, htmlContent, fallbackText = 'No description provided.') {
    const el = typeof elOrId === 'string' ? document.getElementById(elOrId) : elOrId;
    if (!el) return;

    if (!htmlContent || typeof htmlContent !== 'string' || !htmlContent.trim()) {
        el.textContent = fallbackText;
        return;
    }

    let raw = htmlContent.trim();
    if (!/<[a-z][\s\S]*>/i.test(raw)) {
        el.textContent = raw;
    } else {
        try {
            const parser = new DOMParser();
            const doc = parser.parseFromString(raw, 'text/html');
            doc.querySelectorAll('script, style, iframe, object, embed').forEach(s => s.remove());
            el.replaceChildren();
            Array.from(doc.body.childNodes).forEach(node => {
                el.appendChild(node.cloneNode(true));
            });
        } catch (e) {
            el.textContent = raw;
        }
    }
}

function getInitials(name) {
    if (!name) return 'U';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return parts[0].substring(0, 2).toUpperCase();
}

function renderSlaTiers(ticket) {
    const l1Status = document.getElementById('sd-sla-l1-status');
    const l1Meta = document.getElementById('sd-sla-l1-meta');
    const l2Status = document.getElementById('sd-sla-l2-status');
    const l2Meta = document.getElementById('sd-sla-l2-meta');
    const l3Status = document.getElementById('sd-sla-l3-status');
    const l3Meta = document.getElementById('sd-sla-l3-meta');

    const agent = ticket.working_agent_name || ticket.working_agent;
    if (l1Status) {
        l1Status.textContent = agent ? `Assigned (${agent})` : 'Claimed';
    }
    if (l1Meta) {
        const target = ticket.sla_t1 || ticket.response_by || ticket.sla_resolution_by;
        l1Meta.textContent = 'Deadline: ' + (target ? formatDateTime(target) : 'N/A');
    }

    if (l2Status) l2Status.textContent = 'Unassigned';
    if (l2Meta) l2Meta.textContent = 'Deadline: ' + (ticket.sla_t2 ? formatDateTime(ticket.sla_t2) : 'N/A (Stopped)');

    if (l3Status) l3Status.textContent = 'Unassigned';
    if (l3Meta) l3Meta.textContent = 'Deadline: ' + (ticket.sla_t3 ? formatDateTime(ticket.sla_t3) : 'N/A (Stopped)');

    const createdEl = document.getElementById('sd-sla-created-on');
    const updatedEl = document.getElementById('sd-sla-updated-on');
    if (createdEl) createdEl.textContent = ticket.creation ? formatDateTime(ticket.creation) : '-';
    if (updatedEl) updatedEl.textContent = ticket.modified ? formatDateTime(ticket.modified) : '-';
}

function renderStakeholderCards(ticket) {
    const assignedCard = document.getElementById('sd-assignedto-card');
    const agentMeta = ticket.working_agent_details || {};
    const agentName = agentMeta.full_name || ticket.working_agent;

    if (agentName && assignedCard) {
        assignedCard.style.display = '';
        const setText = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val || '-'; };
        setText('sd-assignedto-av', getInitials(agentName));
        setText('sd-assignedto-name', agentName);
        setText('sd-assignedto-role', agentMeta.designation || 'Support Technician');
    } else if (assignedCard) {
        assignedCard.style.display = 'none';
    }

    const raisedName = ticket.person_name || (ticket.raised_by_details && ticket.raised_by_details.full_name) || ticket.raised_by || 'Customer';
    const raisedRole = (ticket.raised_by_details && ticket.raised_by_details.designation) || ticket.contact_email || 'Customer User';
    const setText = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val || '-'; };
    setText('sd-raised-by-av', getInitials(raisedName));
    setText('sd-raised-by-name', raisedName);
    setText('sd-raised-by-role', raisedRole);
}

function renderTicketAssignments(assignees) {
    const secEl = document.getElementById('sd-assignments-section');
    const container = document.getElementById('sd-assignments-container');
    if (!container) return;

    container.innerHTML = '';
    const list = Array.isArray(assignees) ? assignees : [];
    if (list.length === 0) {
        container.innerHTML = '<span style="font-size:12.5px;color:var(--ink-soft);">No assignments</span>';
        if (secEl) secEl.style.display = '';
        return;
    }

    if (secEl) secEl.style.display = '';
    list.forEach(u => {
        const name = typeof u === 'string' ? u : (u.full_name || u.name || u.email || 'User');
        const badge = cel('span', {
            style: 'display:inline-flex;align-items:center;gap:6px;padding:4px 10px;background:var(--indigo-wash,#f5f3ff);color:var(--indigo,#4f46e5);border-radius:12px;font-size:12px;font-weight:600;',
            textContent: name
        });
        container.appendChild(badge);
    });
}

function renderTicketScopeOfWork(scopeText) {
    const secEl = document.getElementById('sd-scope-section');
    const previewEl = document.getElementById('sd-scope-preview');
    if (!secEl) return;

    const hasContent = !!(scopeText && scopeText.trim() && scopeText.trim() !== '-');
    if (hasContent) {
        secEl.style.display = '';
        if (previewEl) {
            setRichTextOrCleanHtml(previewEl, scopeText, '');
            previewEl.style.display = 'block';
        }
    } else {
        secEl.style.display = 'none';
    }
}

function togglePortalScopeExpand() {
    const previewEl = document.getElementById('sd-scope-preview');
    if (previewEl) previewEl.style.display = previewEl.style.display === 'none' ? 'block' : 'none';
}

function formatShortTimestamp(tsStr) {
    if (!tsStr) return '';
    try {
        const d = new Date(tsStr);
        if (isNaN(d.getTime())) return tsStr;
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = String(d.getFullYear()).slice(-2);
        const hours = String(d.getHours()).padStart(2, '0');
        const mins = String(d.getMinutes()).padStart(2, '0');
        return `${day}-${month}-${year} ${hours}:${mins}`;
    } catch (e) {
        return tsStr;
    }
}

function renderTicketChecklist(checklistItems, checklistStateStr) {
    const secEl = document.getElementById('sd-checklist-section');
    const listEl = document.getElementById('sd-checklist-container');
    if (!secEl || !listEl) return;

    listEl.innerHTML = '';
    let itemsMap = {};
    let checkedStates = {};

    if (checklistStateStr) {
        if (typeof checklistStateStr === 'object' && checklistStateStr !== null) {
            checkedStates = checklistStateStr;
        } else if (typeof checklistStateStr === 'string' && checklistStateStr.trim() !== '' && checklistStateStr.trim() !== '{}') {
            try {
                checkedStates = JSON.parse(checklistStateStr);
            } catch (e) { }
        }
    }

    if (Array.isArray(checklistItems)) {
        checklistItems.forEach(chk => {
            const rawTitle = typeof chk === 'string' ? chk : (chk.item || chk.activity || chk.title || chk.task_description || '');
            if (rawTitle && rawTitle.trim()) {
                const cleanTitle = rawTitle.includes('::') ? rawTitle.split('::').pop().trim() : rawTitle.trim();
                const level = chk.level || chk.support_level || (rawTitle.includes('::') ? rawTitle.split('::')[0] : '');
                itemsMap[cleanTitle] = {
                    item: cleanTitle,
                    status: (chk.status === 1 || chk.status === 'Completed' || chk.status === 'completed' || chk.status === '1' || chk.completed) ? 'completed' : 'pending',
                    level: level,
                    user: chk.user || chk.username || chk.by || '',
                    timestamp: chk.timestamp || chk.display_time || '',
                    note: chk.note || chk.action || chk.reason || ''
                };
            }
        });
    }

    if (checkedStates && Array.isArray(checkedStates._selected_items)) {
        checkedStates._selected_items.forEach(stItem => {
            const rawTitle = typeof stItem === 'string' ? stItem : (stItem.item || stItem.activity || stItem.title || stItem.label || '');
            const cleanTitle = rawTitle ? (rawTitle.includes('::') ? rawTitle.split('::').pop().trim() : rawTitle.trim()) : '';
            const level = typeof stItem === 'string' && stItem.includes('::') ? stItem.split('::')[0].trim() : (stItem.level || stItem.support_level || '');

            if (cleanTitle && !itemsMap[cleanTitle]) {
                itemsMap[cleanTitle] = {
                    item: cleanTitle,
                    status: (stItem.checked || stItem.status === 'completed') ? 'completed' : 'pending',
                    level: level,
                    user: stItem.user || stItem.username || '',
                    timestamp: stItem.timestamp || '',
                    note: stItem.note || stItem.action || ''
                };
            }
        });
    }

    if (checkedStates && typeof checkedStates === 'object' && !Array.isArray(checkedStates)) {
        Object.keys(checkedStates).forEach(key => {
            if (key.startsWith('_')) return;
            const cleanTitle = key.includes('::') ? key.split('::')[1].trim() : key.trim();
            const level = key.includes('::') ? key.split('::')[0].trim() : '';
            const val = checkedStates[key];

            if (cleanTitle) {
                let st = 'pending';
                let u = '';
                let ts = '';
                let n = '';

                if (val === true || val === 'completed') {
                    st = 'completed';
                } else if (val === 'not_required') {
                    st = 'not_required';
                } else if (val === 'transferred') {
                    st = 'transferred';
                } else if (val && typeof val === 'object') {
                    st = val.status || 'completed';
                    u = val.username || val.user || val.by || '';
                    ts = val.timestamp || val.time || val.date || '';
                    n = val.action || val.note || val.reason || val.comment || '';
                }

                if (itemsMap[cleanTitle]) {
                    itemsMap[cleanTitle].status = st;
                    if (u) itemsMap[cleanTitle].user = u;
                    if (ts) itemsMap[cleanTitle].timestamp = ts;
                    if (n) itemsMap[cleanTitle].note = n;
                    if (level && !itemsMap[cleanTitle].level) itemsMap[cleanTitle].level = level;
                } else {
                    itemsMap[cleanTitle] = {
                        item: cleanTitle,
                        status: st,
                        level: level,
                        user: u,
                        timestamp: ts,
                        note: n
                    };
                }
            }
        });
    }

    const allItems = Object.values(itemsMap).filter(i => i.item && i.item.trim());

    if (!allItems || allItems.length === 0) {
        secEl.style.display = 'none';
        return;
    }

    let items = allItems;
    if (checkedStates && Array.isArray(checkedStates._selected_items) && checkedStates._selected_items.length > 0) {
        const selectedList = checkedStates._selected_items;

        const filtered = allItems.filter(itemObj => {
            const cleanTitle = itemObj.item.trim();
            return selectedList.some(st => {
                if (typeof st === 'string') {
                    const stClean = st.includes('::') ? st.split('::').pop().trim() : st.trim();
                    return stClean === cleanTitle || st === cleanTitle;
                } else if (typeof st === 'object' && st !== null) {
                    const stTitle = (st.item || st.activity || st.title || st.label || '').split('::').pop().trim();
                    return stTitle === cleanTitle;
                }
                return false;
            });
        });

        if (filtered.length > 0) {
            items = filtered;
        }
    }

    if (!items || items.length === 0) {
        secEl.style.display = 'none';
        return;
    }

    secEl.style.display = '';

    const doneCount = items.filter(i => i.status === 'completed' || i.status === 1).length;
    const escCount = items.filter(i => i.status === 'transferred' || i.status === 'escalated').length;
    const naCount = items.filter(i => i.status === 'not_required').length;
    const pendingCount = Math.max(0, items.length - (doneCount + escCount + naCount));
    const pct = items.length > 0 ? Math.round((doneCount / items.length) * 100) : 0;

    const setText = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    setText('sd-chk-pct', pct + '%');
    const barEl = document.getElementById('sd-chk-bar');
    if (barEl) barEl.style.width = pct + '%';

    setText('sd-chk-cnt-done', doneCount);
    setText('sd-chk-cnt-esc', escCount);
    setText('sd-chk-cnt-pending', pendingCount);
    setText('sd-chk-cnt-na', naCount);
    setText('sd-chk-completion-ratio', doneCount + '/' + items.length);

    function safeEscape(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    items.forEach(chk => {
        const isDone = chk.status === 'completed' || chk.status === 1;
        const isNA = chk.status === 'not_required';
        const isEscalated = chk.status === 'transferred' || chk.status === 'escalated';

        const circleDiv = cel('div', {
            style: `width: 24px; height: 24px; border-radius: 50%; display: grid; place-items: center; flex-shrink: 0; margin-top: 2px; ${isDone
                ? 'background: #16a34a; border: none; color: #ffffff;'
                : 'background: #ffffff; border: 2px solid #cbd5e1; color: transparent;'
                }`
        });
        circleDiv.innerHTML = isDone
            ? '<i class="ti ti-check" style="font-size: 14px; font-weight: 800;"></i>'
            : '';

        const mainDiv = cel('div', { style: 'flex: 1; display: flex; flex-direction: column; gap: 4px;' });
        const titleRow = cel('div', { style: 'display: flex; align-items: center; gap: 8px; flex-wrap: wrap;' });

        const titleSpan = cel('span', {
            style: `font-size: 14px; font-weight: 700; color: ${isDone ? '#334155' : isNA ? '#94a3b8' : '#1e293b'}; ${isNA ? 'font-style: italic;' : ''}`,
            textContent: chk.item || ''
        });

        let pillBg = '#fef9c3';
        let pillColor = '#854d0e';
        let pillText = '⏳ Pending';
        if (isDone) {
            pillBg = '#dcfce7';
            pillColor = '#166534';
            pillText = '✓ Done';
        } else if (isNA) {
            pillBg = '#f1f5f9';
            pillColor = '#64748b';
            pillText = '— N/A';
        } else if (isEscalated) {
            pillBg = '#f3e8ff';
            pillColor = '#6b21a8';
            pillText = '↳ Escalated';
        }

        const pillSpan = cel('span', {
            style: `font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 12px; background: ${pillBg}; color: ${pillColor}; display: inline-flex; align-items: center; gap: 3px;`,
            textContent: pillText
        });

        titleRow.appendChild(titleSpan);
        titleRow.appendChild(pillSpan);
        mainDiv.appendChild(titleRow);

        const noteText = chk.note || (isDone ? 'completed issues' : isNA ? 'Already completed externally' : '');
        if (noteText) {
            const noteDiv = cel('div', {
                style: `font-size: 12.5px; margin-top: 1px; display: flex; align-items: center; gap: 4px; ${isDone ? 'color: #16a34a; font-weight: 500;' : isNA ? 'color: #94a3b8; font-style: italic;' : 'color: #64748b;'}`
            });
            const noteIcon = cel('i', {
                class: isDone ? 'ti ti-checkbox' : isNA ? 'ti ti-x' : 'ti ti-notes',
                style: 'font-size: 13px;'
            });
            const noteSpan = cel('span', { textContent: noteText });
            noteDiv.appendChild(noteIcon);
            noteDiv.appendChild(noteSpan);
            mainDiv.appendChild(noteDiv);
        }

        if (chk.user || chk.timestamp) {
            const metaDiv = cel('div', { style: 'display: flex; align-items: center; gap: 14px; margin-top: 3px; font-size: 11.5px; color: #64748b;' });
            if (chk.user) {
                const userSpan = cel('span', { style: 'display: flex; align-items: center; gap: 4px;' });
                userSpan.innerHTML = `<i class="ti ti-user" style="font-size: 12px;"></i> ${safeEscape(chk.user)}`;
                metaDiv.appendChild(userSpan);
            }
            if (chk.timestamp) {
                const formattedTime = formatShortTimestamp(chk.timestamp);
                const timeSpan = cel('span', { style: 'display: flex; align-items: center; gap: 4px;' });
                timeSpan.innerHTML = `<i class="ti ti-clock" style="font-size: 12px;"></i> ${safeEscape(formattedTime)}`;
                metaDiv.appendChild(timeSpan);
            }
            mainDiv.appendChild(metaDiv);
        }

        let btnBg = '#fef9c3';
        let btnColor = '#854d0e';
        let btnBorder = '#fef08a';
        let btnIcon = 'ti ti-clock';
        let btnText = 'Pending';

        if (isDone) {
            btnBg = '#dcfce7';
            btnColor = '#166534';
            btnBorder = '#bbf7d0';
            btnIcon = 'ti ti-check';
            btnText = 'Completed';
        } else if (isNA) {
            btnBg = '#f1f5f9';
            btnColor = '#64748b';
            btnBorder = '#e2e8f0';
            btnIcon = 'ti ti-x';
            btnText = 'Not Required';
        } else if (isEscalated) {
            btnBg = '#f3e8ff';
            btnColor = '#6b21a8';
            btnBorder = '#e9d5ff';
            btnIcon = 'ti ti-corner-down-right';
            btnText = 'Transferred';
        }

        const rightDiv = cel('div', { style: 'display: flex; align-items: center; flex-shrink: 0;' });
        const badgeBtn = cel('div', {
            style: `padding: 6px 14px; border-radius: 6px; font-size: 12px; font-weight: 600; background: ${btnBg}; color: ${btnColor}; border: 1px solid ${btnBorder}; display: inline-flex; align-items: center; gap: 5px;`,
            innerHTML: `<i class="${btnIcon}" style="font-size: 13px;"></i> ${btnText}`
        });
        rightDiv.appendChild(badgeBtn);

        const itemRow = cel('div', {
            style: `display: flex; align-items: flex-start; gap: 14px; padding: 16px 20px; border-bottom: 1px solid #f1f5f9; ${isDone ? 'background: rgba(34, 197, 94, 0.02);' : 'background: #ffffff;'}`
        }, [circleDiv, mainDiv, rightDiv]);

        listEl.appendChild(itemRow);
    });
}

function renderTicketContacts(contacts, d) {
    const secEl = document.getElementById('sd-contacts-card');
    const listEl = document.getElementById('sd-contacts-list');
    if (!listEl) return;

    listEl.innerHTML = '';
    let list = Array.isArray(contacts) ? contacts : [];

    if (!list.length && d && (d.person_name || d.contact_email)) {
        list = [{
            person_name: d.person_name || d.raised_by_details?.full_name || 'Contact Person',
            email_id: d.contact_email || '',
            mobile_no: d.contact_number || d.phone || '',
            designation: 'Contact Person',
            is_primary: 1
        }];
    }

    if (!list.length) {
        if (secEl) secEl.style.display = 'none';
        return;
    }

    if (secEl) secEl.style.display = 'block';

    list.forEach(c => {
        const rawName = c.person_name || c.user_name || c.name || 'Contact';
        const displayName = (rawName || '').split('-')[0].trim() || rawName || 'Unnamed Contact';
        const initial = displayName.charAt(0).toUpperCase();
        const desig = c.designation || '';
        const email = c.email_id || '';
        const mobile = c.mobile_no || c.phone || '';
        const isTpoc = c.tpoc || c.is_primary || c.custom_tpoc;

        const card = cel('div', {
            style: 'padding:14px 16px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;margin-bottom:12px;'
        }, [
            cel('div', { style: 'display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:10px;' }, [
                cel('div', { style: 'display:flex;align-items:center;gap:10px;' }, [
                    cel('div', { style: 'width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,#0284c7,#2563eb);color:#fff;font-weight:700;display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0;' }, [
                        document.createTextNode(initial)
                    ]),
                    cel('div', {}, [
                        cel('div', { style: 'font-weight:700;font-size:13.5px;color:#0f172a;', textContent: displayName }),
                        desig ? cel('div', { style: 'font-size:11.5px;color:#64748b;margin-top:1px;', textContent: desig }) : null
                    ].filter(Boolean))
                ]),
                isTpoc ? cel('span', { class: 'tpoc-badge-green', style: 'font-size:10.5px;padding:3px 8px;border-radius:6px;font-weight:700;', textContent: '✓ TPOC' }) : null
            ].filter(Boolean)),
            email || mobile ? cel('div', { style: 'border-top:1px dashed #e2e8f0;padding-top:8px;display:flex;flex-direction:column;gap:6px;' }, [
                email ? cel('div', { style: 'font-size:12px;color:#0284c7;display:grid;grid-template-columns:18px 1fr;gap:6px;align-items:center;' }, [
                    cel('i', { class: 'ti ti-mail', style: 'color:#64748b;font-size:14px;' }),
                    cel('span', { style: 'word-break:break-all;font-weight:500;', textContent: email })
                ]) : null,
                mobile ? cel('div', { style: 'font-size:12px;color:#334155;display:grid;grid-template-columns:18px 1fr;gap:6px;align-items:center;' }, [
                    cel('i', { class: 'ti ti-phone', style: 'color:#64748b;font-size:14px;' }),
                    cel('span', { style: 'font-weight:500;', textContent: mobile })
                ]) : null
            ].filter(Boolean)) : null
        ].filter(Boolean));

        listEl.appendChild(card);
    });
}

function renderTicketRenewals(renewals) {
    const secEl = document.getElementById('sd-renewals-card') || document.getElementById('sd-renewals-section');
    const listEl = document.getElementById('sd-renewals-list');
    if (!listEl) return;

    listEl.innerHTML = '';
    const list = Array.isArray(renewals) ? renewals : [];
    if (!list.length) {
        if (secEl) secEl.style.display = 'none';
        return;
    }

    if (secEl) secEl.style.display = 'block';

    list.forEach((ren, index) => {
        const title = ren.item || ren.item_name || ren.product_name || 'Asset Item';
        const rows = [];

        // Item Name Row
        rows.push(cel('div', { style: 'display:flex;align-items:flex-start;margin-bottom:6px;font-size:12.5px;line-height:1.4;' }, [
            cel('span', { style: 'color:var(--ink-soft,#64748b);font-weight:500;width:80px;flex-shrink:0;', textContent: 'Asset :' }),
            cel('span', { style: 'font-weight:600;color:var(--ink,#1e293b);', textContent: title })
        ]));

        // ID Row
        if (ren.renewal_id) {
            rows.push(cel('div', { style: 'display:flex;align-items:center;margin-bottom:6px;font-size:12px;' }, [
                cel('span', { style: 'color:var(--ink-soft,#64748b);font-weight:500;width:80px;flex-shrink:0;', textContent: 'ID :' }),
                cel('span', { style: 'font-weight:600;color:var(--ink,#1e293b);', textContent: ren.renewal_id })
            ]));
        }

        // Qty Row
        const qtyVal = ren.quantity || ren.total_quantity;
        if (qtyVal) {
            rows.push(cel('div', { style: 'display:flex;align-items:center;margin-bottom:6px;font-size:12px;' }, [
                cel('span', { style: 'color:var(--ink-soft,#64748b);font-weight:500;width:80px;flex-shrink:0;', textContent: 'Qty :' }),
                cel('span', { style: 'font-weight:600;color:var(--ink,#1e293b);', textContent: qtyVal })
            ]));
        }

        // End Date Row
        if (ren.end_date) {
            rows.push(cel('div', { style: 'display:flex;align-items:center;margin-bottom:6px;font-size:12px;' }, [
                cel('span', { style: 'color:var(--ink-soft,#64748b);font-weight:500;width:80px;flex-shrink:0;', textContent: 'End Date :' }),
                cel('span', { style: 'font-weight:600;color:var(--ink,#1e293b);', textContent: formatDate(ren.end_date) })
            ]));
        }

        const isLast = index === list.length - 1;
        const card = cel('div', {
            style: isLast ? 'margin-bottom:6px;' : 'margin-bottom:14px;border-bottom:1px dashed var(--line,#e2e8f0);padding-bottom:10px;'
        }, rows);

        listEl.appendChild(card);
    });
}

function renderTicketAttachments(attachments) {
    const listEl = document.getElementById('sd-attachments-list');
    const overviewCountEl = document.getElementById('sd-att-count');
    if (!listEl) return;
    listEl.innerHTML = '';

    const list = attachments || [];
    if (overviewCountEl) overviewCountEl.textContent = list.length;

    if (!list.length) {
        listEl.innerHTML = '<div class="td-empty-msg">No attachments for this ticket.</div>';
        return;
    }

    // Render ONLY the latest 5 attachments in Overview tab
    const overviewList = list.slice(0, 5);

    overviewList.forEach(att => {
        const ext = (att.file_name || '').split('.').pop().toUpperCase() || 'FILE';
        const formattedSize = att.file_size ? `${Math.round(att.file_size / 1024)} KB` : 'File';
        const isImg = ['JPG', 'JPEG', 'PNG', 'GIF', 'WEBP', 'SVG'].includes(ext);

        const item = document.createElement('a');
        item.className = 'td-attach-row';
        item.href = att.file_url || '#';
        item.target = '_blank';

        let badgeHtml = `<span class="ext mono">${safeEscape(ext)}</span>`;
        if (isImg && att.file_url) {
            badgeHtml = `<div style="width:28px;height:28px;border-radius:6px;overflow:hidden;background:#f1f5f9;flex-shrink:0;margin-right:8px;border:1px solid #cbd5e1;"><img src="${att.file_url}" alt="Preview" style="width:100%;height:100%;object-fit:cover;"></div>`;
        }

        item.innerHTML = `
            ${badgeHtml}
            <span class="name" title="${safeEscape(att.file_name)}">${safeEscape(att.file_name || 'Attachment')}</span>
            <span class="sz">${formattedSize}</span>
            <i class="ti ti-download dl"></i>
        `;
        listEl.appendChild(item);
    });

    // If total attachments > 5, render link to switch to Files tab
    if (list.length > 5) {
        const moreLink = document.createElement('div');
        moreLink.style.cssText = 'padding:10px 0 2px 0;text-align:center;border-top:1px dashed var(--td-line,#e2e6f0);margin-top:6px;';
        moreLink.innerHTML = `
            <a href="javascript:void(0)" onclick="const tab = document.querySelector('.td-page-tab[onclick*=\\'tab-files\\']'); if(tab) tdPageTab(tab, 'tab-files');" style="color:var(--td-cyan,#0284c7);font-size:12.5px;font-weight:600;display:inline-flex;align-items:center;gap:5px;text-decoration:none;">
                View all ${list.length} attachments in Files tab <i class="ti ti-arrow-right"></i>
            </a>
        `;
        listEl.appendChild(moreLink);
    }
}

function renderTicketFilesGrid(attachments) {
    const gridEl = document.getElementById('sd-files-attach-grid');
    const countEl = document.getElementById('sd-files-grid-count');
    const tabCountEl = document.getElementById('td-files-count');
    const overviewCountEl = document.getElementById('sd-att-count');
    if (!gridEl) return;
    gridEl.innerHTML = '';

    const list = attachments || [];
    if (countEl) countEl.textContent = list.length;
    if (tabCountEl) tabCountEl.textContent = list.length;
    if (overviewCountEl) overviewCountEl.textContent = list.length;

    if (!list.length) {
        gridEl.innerHTML = '<div class="td-empty-msg" style="grid-column:1/-1;">No attachments uploaded.</div>';
        return;
    }

    list.forEach(att => {
        const ext = (att.file_name || '').split('.').pop().toUpperCase() || 'FILE';
        const card = document.createElement('a');
        card.className = 'td-attach-card';
        card.href = att.file_url || '#';
        card.target = '_blank';

        const isImg = ['JPG', 'JPEG', 'PNG', 'GIF', 'WEBP', 'SVG'].includes(ext);
        const iconClass = isImg ? 'ti ti-photo' : (ext === 'PDF' ? 'ti ti-file-text' : 'ti ti-paperclip');
        const formattedSize = att.file_size ? `${Math.round(att.file_size / 1024)} KB` : 'File';

        let thumbContent = `<i class="${iconClass}"></i>`;
        if (isImg && att.file_url) {
            thumbContent = `<img src="${att.file_url}" alt="Preview" style="width:100%;height:100%;object-fit:cover;border-radius:6px;">`;
        }

        card.innerHTML = `
            <div class="td-attach-thumb">${thumbContent}</div>
            <div class="td-attach-meta">
                <div class="td-attach-name" title="${safeEscape(att.file_name)}">${safeEscape(att.file_name || 'Attachment')}</div>
                <div class="td-attach-sub"><span>${formattedSize}</span><i class="ti ti-download"></i></div>
            </div>
        `;
        gridEl.appendChild(card);
    });
}

function cleanTextSummary(htmlString) {
    if (!htmlString) return '';
    let text = String(htmlString);
    text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
    text = text.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
    text = text.replace(/<[^>]*>/g, ' ');
    text = text.replace(/&nbsp;/gi, ' ')
        .replace(/&amp;/gi, '&')
        .replace(/&lt;/gi, '<')
        .replace(/&gt;/gi, '>')
        .replace(/&quot;/gi, '"')
        .replace(/&#39;/gi, "'");
    return text.replace(/\s+/g, ' ').trim();
}

function toggleEmailTemplate(id, btn) {
    const el = document.getElementById(id);
    if (!el) return;
    const isExpanded = el.classList.contains('expanded');
    const span = btn.querySelector('span');
    const icon = btn.querySelector('i');

    if (isExpanded) {
        el.classList.remove('expanded');
        if (span) span.textContent = 'Show Email Template';
        if (icon) icon.className = 'ti ti-mail-opened';
    } else {
        el.classList.add('expanded');
        if (span) span.textContent = 'Hide Email Template';
        if (icon) icon.className = 'ti ti-mail';
    }
}
window.toggleEmailTemplate = toggleEmailTemplate;

function renderTicketEmailLogs(emails) {
    const feedEl = document.getElementById('sd-email-log-feed');
    const countEl = document.getElementById('td-emails-count');
    const flagEl = document.getElementById('td-emails-flag');
    if (!feedEl) return;
    feedEl.innerHTML = '';

    const emailList = emails || [];
    if (countEl) countEl.textContent = emailList.length;

    let hasFailures = false;
    if (!emailList.length) {
        feedEl.innerHTML = '<div class="td-empty-msg">No emails logged for this ticket.</div>';
        if (flagEl) flagEl.style.display = 'none';
        return;
    }

    emailList.forEach((em, idx) => {
        if (em.status === 'fail') hasFailures = true;
        const row = document.createElement('div');
        row.className = 'td-elog-row';

        const descText = em.content || '';
        const isHtml = typeof descText === 'string' && (descText.includes('<table') || descText.includes('<div') || descText.includes('<html>') || descText.includes('<!DOCTYPE') || descText.includes('<style'));

        const toVal = em.recipients || 'N/A';
        const ccVal = em.cc || '';
        const bccVal = em.bcc || '';
        let rawSubj = em.subject || '';
        let subjVal = rawSubj ? rawSubj.replace(/Ticket\s*No\s*[:|-]?\s*[A-Z0-9_-]+/gi, '').trim().replace(/^[:\s-]+/, '').trim() : '';
        let subjectHtml = subjVal ? `<span class="td-elog-subject">${safeEscape(subjVal)}</span>` : '';

        let recipientsMeta = `<b>To</b> ${safeEscape(toVal)}`;
        if (ccVal) recipientsMeta += ` &bull; <b>Cc</b> ${safeEscape(ccVal)}`;
        if (bccVal) recipientsMeta += ` &bull; <b>Bcc</b> ${safeEscape(bccVal)}`;

        let bodySection = '';
        if (descText) {
            const tmplId = `elog-tmpl-${idx}-${Math.random().toString(36).substring(7)}`;
            if (isHtml) {
                bodySection = `
                    <div class="td-email-template-wrapper" id="${tmplId}">
                        <div class="td-email-template-inner">
                            ${descText}
                        </div>
                    </div>
                    <button type="button" class="td-email-toggle-btn" onclick="window.toggleEmailTemplate('${tmplId}', this)">
                        <i class="ti ti-mail-opened"></i> <span>Show Email Template</span>
                    </button>
                `;
            } else {
                const plainText = cleanTextSummary(descText);
                const isLong = plainText.length > 150;
                bodySection = `
                    <div style="font-size:12px;color:var(--td-muted,#6b7290);margin-top:6px;background:var(--td-surface-2,#f4f6fb);padding:8px 10px;border-radius:6px;border:1px solid var(--td-line,#e2e6f0);">
                        ${safeEscape(isLong ? plainText.substring(0, 150) + '...' : plainText)}
                    </div>
                `;
            }
        }

        row.innerHTML = `
            <div class="td-elog-icon"><i class="ti ti-mail"></i></div>
            <div class="td-elog-body">
                <div class="td-elog-top">
                    ${subjectHtml}
                    <span class="td-elog-status ${em.status === 'fail' ? 'fail' : 'sent'}">${safeEscape(em.status_text || em.status)}</span>
                    <span class="td-elog-time">${formatDateTime(em.creation || new Date())}</span>
                </div>
                <div class="td-elog-to">${recipientsMeta}</div>
                ${bodySection}
            </div>
        `;
        feedEl.appendChild(row);
    });

    if (flagEl) {
        flagEl.style.display = hasFailures ? 'inline-block' : 'none';
        flagEl.title = hasFailures ? 'Delivery issue detected' : '';
    }
}

function renderTicketActivity(activity) {
    const feedEl = document.getElementById('sd-activity-log-feed');
    const countEl = document.getElementById('td-activity-count');
    const listEl = document.getElementById('sd-timeline-list');

    const list = Array.isArray(activity) ? activity : [];
    if (countEl) countEl.textContent = list.length;

    if (feedEl) {
        feedEl.innerHTML = '';
        if (!list.length) {
            feedEl.innerHTML = '<div class="td-empty-msg">No activity recorded yet.</div>';
        } else {
            let html = '';
            list.forEach((act, idx) => {
                const rawType = (act.type || act.title || 'comment').toLowerCase();
                const descText = act.description || act.content || '';

                const isHtmlTemplate = typeof descText === 'string' && (descText.includes('<table') || descText.includes('<html') || descText.includes('<!DOCTYPE') || descText.includes('<body') || (descText.includes('<style') && descText.length > 200));
                const isSentEmail = (act.sent_or_received === 'Sent' && act.recipients && act.recipients !== 'N/A') || (rawType === 'email' && act.recipients) || (rawType === 'automated message') || isHtmlTemplate;
                const isCustomerMessage = !isHtmlTemplate && (rawType.includes('customer message') || rawType === 'communication' || rawType.includes('message') || rawType.includes('description'));

                let iconClass = 'ti ti-message-circle';
                let rowClass = 'comment';
                let categoryName = 'Comment';
                let categoryBadgeClass = 'comment';

                if (rawType.includes('create')) {
                    iconClass = 'ti ti-circle-plus';
                    rowClass = 'created';
                    categoryName = 'Ticket Created';
                    categoryBadgeClass = 'created';
                } else if (rawType.includes('file') || rawType.includes('attach')) {
                    iconClass = 'ti ti-paperclip';
                    rowClass = 'file';
                    categoryName = 'Attachment';
                    categoryBadgeClass = 'file';
                } else if (rawType.includes('status')) {
                    iconClass = 'ti ti-refresh';
                    rowClass = 'status';
                    categoryName = 'Status Change';
                    categoryBadgeClass = 'status';
                } else if (isSentEmail || isHtmlTemplate) {
                    iconClass = 'ti ti-mail';
                    rowClass = 'email';
                    categoryName = 'Email Notification';
                    categoryBadgeClass = 'email';
                } else if (isCustomerMessage) {
                    iconClass = 'ti ti-file-text';
                    rowClass = 'comment';
                    categoryName = 'Ticket Description';
                    categoryBadgeClass = 'comment';
                }

                const byName = act.by || act.sender_full_name || act.sender || 'Customer';
                const stamp = act.timestamp || act.creation || '';
                const relTime = formatRelativeTime(stamp);

                let contentHtml = '';
                if (isSentEmail || isHtmlTemplate) {
                    const tmplId = `act-tmpl-${idx}-${Math.random().toString(36).substring(7)}`;
                    const toVal = act.recipients || act.to || '';
                    const ccVal = act.cc || '';
                    const bccVal = act.bcc || '';
                    const cleanSum = cleanTextSummary(descText);
                    let rawSubj = act.subject || '';
                    let subjVal = rawSubj ? rawSubj.replace(/Ticket\s*No\s*[:|-]?\s*[A-Z0-9_-]+/gi, '').trim().replace(/^[:\s-]+/, '').trim() : '';
                    let subjectLine = subjVal ? `<div style="font-size:13px;font-weight:700;color:var(--td-text,#161b2c);margin-bottom:4px;">${safeEscape(subjVal)}</div>` : '';

                    let metaHtml = '';
                    if (toVal || ccVal || bccVal || subjectLine) {
                        metaHtml = `
                            <div style="font-size:12px;color:var(--td-muted,#6b7290);margin-top:6px;background:var(--td-surface-2,#f4f6fb);padding:8px 12px;border-radius:8px;border:1px solid var(--td-line,#e2e6f0);line-height:1.5;">
                                ${subjectLine}
                                <div style="display:flex;flex-wrap:wrap;gap:12px;color:var(--td-muted,#6b7290);">
                                    ${toVal ? `<div><b>To:</b> ${safeEscape(toVal)}</div>` : ''}
                                    ${ccVal ? `<div><b>Cc:</b> ${safeEscape(ccVal)}</div>` : ''}
                                    ${bccVal ? `<div><b>Bcc:</b> ${safeEscape(bccVal)}</div>` : ''}
                                </div>
                            </div>
                        `;
                    }

                    contentHtml = `
                        ${metaHtml}
                        <div class="td-email-template-wrapper" id="${tmplId}">
                            <div class="td-email-template-inner">
                                ${descText}
                            </div>
                        </div>
                        <button type="button" class="td-email-toggle-btn" onclick="window.toggleEmailTemplate('${tmplId}', this)">
                            <i class="ti ti-mail-opened"></i> <span>Show Email Template</span>
                        </button>
                    `;
                } else if (act.is_html || (typeof descText === 'string' && (descText.includes('<a ') || descText.includes('📎')))) {
                    contentHtml = `<div class="td-log-content">${descText}</div>`;
                } else {
                    const safe = safeEscape(descText).replace(/\n/g, '<br>');
                    contentHtml = `<div class="td-log-content">${safe}</div>`;
                }

                html += `
                    <div class="td-log-row ${rowClass}">
                        <div class="td-log-icon ${rowClass}"><i class="${iconClass}"></i></div>
                        <div class="td-log-body">
                            <div class="td-log-row-top">
                                <span class="td-log-name">${safeEscape(byName)}</span>
                                <span class="td-cat-badge ${categoryBadgeClass}">${safeEscape(categoryName)}</span>
                                <span class="td-log-time">${relTime}</span>
                            </div>
                            ${contentHtml}
                        </div>
                    </div>
                `;
            });
            feedEl.innerHTML = html;
        }
    }

    if (listEl) {
        if (!list.length) {
            listEl.innerHTML = '<div style="padding:16px;text-align:center;color:var(--ink-soft);font-size:13px;">No updates recorded yet.</div>';
        } else if (typeof _buildTimelineHTML === 'function') {
            listEl.innerHTML = _buildTimelineHTML(list);
        }
    }
}

window.toggleEmailExpand = function (btn) {
    const wrapper = btn.previousElementSibling;
    if (!wrapper) return;
    const isCollapsed = wrapper.classList.contains('collapsed');
    const labelSpan = btn.querySelector('span');

    if (isCollapsed) {
        wrapper.classList.remove('collapsed');
        btn.classList.add('expanded');
        if (labelSpan) labelSpan.textContent = 'Show Less';
    } else {
        wrapper.classList.add('collapsed');
        btn.classList.remove('expanded');
        if (labelSpan) labelSpan.textContent = 'Show More';
    }
};

let sdReplyUploadedFiles = [];

function handleReplyFileUpload(e) {
    const files = Array.from(e.target.files || []);
    const ticketName = window.currentPortalTicketName;
    if (!files.length) return;

    files.forEach(file => {
        const item = {
            name: file.name,
            file_name: file.name,
            file: file,
            uploading: true,
            file_url: null,
            error: false
        };
        sdReplyUploadedFiles.push(item);

        const onUploadSuccess = (fileData) => {
            item.name = fileData.name || item.name;
            item.file_url = fileData.file_url;
            item.file_name = fileData.file_name || item.file_name;
            item.uploading = false;
            renderSdReplyAttachmentsPreview();
        };

        const onUploadError = (err) => {
            item.error = true;
            item.uploading = false;
            showPortalToast(`Failed to upload ${item.file_name}`, 'error');
            renderSdReplyAttachmentsPreview();
        };

        if (typeof frappe !== 'undefined' && typeof frappe.upload_file === 'function') {
            frappe.upload_file(file, {
                doctype: 'Issue',
                docname: ticketName || '',
                is_private: 0
            }, function (r) {
                if (r && (r.file_url || r.name)) {
                    onUploadSuccess(r);
                } else {
                    onUploadError(r);
                }
            });
        } else {
            const formData = new FormData();
            if (ticketName) {
                formData.append('attached_to_doctype', 'Issue');
                formData.append('attached_to_name', ticketName);
            }
            formData.append('file', file);

            fetch('/api/method/customer_portal.api.upload_portal_attachment', {
                method: 'POST',
                headers: {
                    'X-Frappe-CSRF-Token': (window.frappe && frappe.csrf_token) || ''
                },
                body: formData
            })
                .then(res => res.json())
                .then(data => {
                    const resObj = data.message || data;
                    if (resObj && (resObj.file_url || resObj.name)) {
                        onUploadSuccess(resObj);
                    } else {
                        onUploadError(data);
                    }
                })
                .catch(err => onUploadError(err));
        }
    });

    renderSdReplyAttachmentsPreview();
    e.target.value = '';
}

function removeSdReplyAttachment(idx) {
    sdReplyUploadedFiles.splice(idx, 1);
    renderSdReplyAttachmentsPreview();
}
window.removeSdReplyAttachment = removeSdReplyAttachment;

function renderSdReplyAttachmentsPreview() {
    const wrap = document.getElementById('sd-reply-attachments-preview');
    if (!wrap) return;
    wrap.replaceChildren();

    if (!sdReplyUploadedFiles || !sdReplyUploadedFiles.length) {
        wrap.style.display = 'none';
        return;
    }

    wrap.style.display = 'flex';

    sdReplyUploadedFiles.forEach((f, idx) => {
        const ext = (f.file_name || f.name || '').split('.').pop().toUpperCase() || 'FILE';
        const isImg = ['JPG', 'JPEG', 'PNG', 'GIF', 'WEBP', 'SVG'].includes(ext) || (f.file && f.file.type && f.file.type.startsWith('image/'));

        let previewUrl = f.file_url;
        if (!previewUrl && f.file && f.file instanceof File) {
            try {
                previewUrl = URL.createObjectURL(f.file);
            } catch (e) { }
        }

        let leadingIcon = `<i class="ti ti-paperclip" style="color:var(--indigo,#4f46e5);font-size:15px;flex-shrink:0;"></i>`;
        if (isImg && previewUrl) {
            leadingIcon = `<img src="${previewUrl}" alt="Preview" style="width:24px;height:24px;border-radius:4px;object-fit:cover;flex-shrink:0;">`;
        } else if (isImg) {
            leadingIcon = `<i class="ti ti-photo" style="color:var(--indigo,#4f46e5);font-size:15px;flex-shrink:0;"></i>`;
        }

        let statusIcon = `<i class="ti ti-x" style="cursor:pointer;margin-left:6px;color:var(--td-faint,#9aa0b8);font-size:14px;" title="Remove" onclick="window.removeSdReplyAttachment(${idx})"></i>`;

        if (f.uploading) {
            statusIcon = `<i class="ti ti-loader-2" style="animation:spin 1s linear infinite;margin-left:6px;color:#2563eb;"></i>`;
        } else if (f.error) {
            statusIcon = `<i class="ti ti-alert-circle" style="margin-left:6px;color:#dc2626;" title="Upload failed"></i><i class="ti ti-x" style="cursor:pointer;margin-left:4px;" onclick="window.removeSdReplyAttachment(${idx})"></i>`;
        }

        const chip = cel('div', {
            style: 'display:inline-flex;align-items:center;gap:6px;padding:4px 10px;background:var(--indigo-wash,#f5f3ff);color:var(--indigo,#4f46e5);border-radius:16px;font-size:11.5px;font-weight:600;margin-top:6px;margin-right:6px;',
            innerHTML: `
                ${leadingIcon}
                <span style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:180px;" title="${safeEscape(f.file_name || f.name)}">${safeEscape(f.file_name || f.name)}</span>
                ${statusIcon}
            `
        });
        wrap.appendChild(chip);
    });
}

async function handleDirectAttachmentUpload(e) {
    const files = Array.from(e.target.files || []);
    const ticketName = window.currentPortalTicketName;
    if (!files.length) return;
    if (!ticketName) {
        showPortalToast('No active ticket selected.', 'error');
        return;
    }

    showPortalToast(`Uploading ${files.length} attachment(s)...`, 'info');

    let uploadedCount = 0;
    for (const file of files) {
        try {
            const formData = new FormData();
            formData.append('attached_to_doctype', 'Issue');
            formData.append('attached_to_name', ticketName);
            formData.append('file', file);

            const res = await fetch('/api/method/customer_portal.api.upload_portal_attachment', {
                method: 'POST',
                headers: {
                    'X-Frappe-CSRF-Token': frappe.csrf_token || ''
                },
                body: formData
            });
            const data = await res.json();
            const result = data.message || data;
            if (result && (result.file_url || result.status === 'success')) {
                uploadedCount++;
            } else if (data.exception) {
                showPortalToast(data.exception || `Failed to upload ${file.name}`, 'error');
            }
        } catch (err) {
            console.error('Direct attachment upload error:', err);
        }
    }

    e.target.value = '';

    if (uploadedCount > 0) {
        showPortalToast(`Successfully uploaded ${uploadedCount} attachment(s)!`, 'success');
        // Refresh ticket details to render new attachments immediately
        frappe.call({
            method: 'customer_portal.api.get_ticket_details',
            args: { ticket_name: ticketName },
            callback: function (res) {
                if (res && res.message && typeof openTicketDetail === 'function') {
                    openTicketDetail(res.message, true);
                }
            }
        });
    } else {
        showPortalToast('Failed to upload attachment(s).', 'error');
    }
}

function submitPortalTicketReply() {
    const ticketName = window.currentPortalTicketName;
    const inputEl = document.getElementById('sd-reply-input');
    const btnEl = document.getElementById('sd-reply-submit-btn');
    if (!ticketName || !inputEl) return;

    if (sdReplyUploadedFiles.some(f => f.uploading)) {
        showPortalToast('Please wait for file upload to complete.', 'info');
        return;
    }

    const validAttachments = sdReplyUploadedFiles.filter(f => !f.error && f.file_url);

    const replyText = inputEl.value.trim();
    if (!replyText && !validAttachments.length) {
        showPortalToast('Please type a message or attach a file before sending.', 'error');
        return;
    }

    if (btnEl) btnEl.disabled = true;

    frappe.call({
        method: 'customer_portal.api.add_ticket_reply',
        args: {
            ticket_name: ticketName,
            comment_text: replyText || 'Attached file(s)',
            attachments: JSON.stringify(validAttachments)
        },
        callback: function (r) {
            if (btnEl) btnEl.disabled = false;
            if (r && r.message) {
                inputEl.value = '';
                sdReplyUploadedFiles = [];
                renderSdReplyAttachmentsPreview();
                showPortalToast('Reply submitted successfully!', 'success');
                // Refresh ticket details
                frappe.call({
                    method: 'customer_portal.api.get_ticket_details',
                    args: { ticket_name: ticketName },
                    callback: function (res) {
                        if (res && res.message && typeof openTicketDetail === 'function') {
                            openTicketDetail(res.message, true);
                        }
                    }
                });
            }
        },
        error: function () {
            if (btnEl) btnEl.disabled = false;
            showPortalToast('Failed to submit reply.', 'error');
        }
    });
}

window.handleDirectAttachmentUpload = handleDirectAttachmentUpload;
window.handleReplyFileUpload = handleReplyFileUpload;
window.submitPortalTicketReply = submitPortalTicketReply;

function renderContactDetails(contacts, fallbackName, fallbackEmail) {
    const listEl = document.getElementById('sd-contacts-list');
    if (!listEl) return;

    listEl.innerHTML = '';
    let items = Array.isArray(contacts) ? [...contacts] : [];
    window.currentTicketContacts = items;

    if (!items.length && (fallbackName || fallbackEmail)) {
        items.push({
            person_name: fallbackName || fallbackEmail,
            designation: 'Primary Contact',
            email_id: fallbackEmail || '',
            mobile_no: '',
            is_primary: 1
        });
    }

    if (!items.length) {
        listEl.innerHTML = '<div style="color:var(--ink-soft);font-size:13px;text-align:center;padding:12px;">No contact persons linked.</div>';
        return;
    }

    items.forEach(c => {
        const cName = c.person_name || c.name || 'Contact';
        const displayName = (c.user_name || "").split("-")[0].trim() || c.user_name || "Unnamed Contact";
        const initials = getInitials(displayName);

        const card = cel('div', { class: 'pf-contact-card', style: 'display:flex;align-items:center;gap:10px;padding:10px;border-radius:8px;border:1px solid var(--line);margin-bottom:8px;' }, [
            cel('div', { class: 'pf-contact-av', style: 'width:34px;height:34px;border-radius:50%;background:var(--indigo-subtle,#e0e7ff);color:var(--indigo,#4f46e5);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;' }, [initials]),
            cel('div', { class: 'pf-contact-body', style: 'flex:1;min-width:0;' }, [
                cel('div', { class: 'pf-contact-name', style: 'font-weight:600;font-size:13px;', textContent: displayName }),
                c.designation ? cel('div', { class: 'pf-contact-desig', style: 'font-size:11.5px;color:var(--ink-soft);', textContent: c.designation }) : null,
                c.email_id ? cel('div', { class: 'pf-contact-meta', style: 'font-size:11px;color:var(--ink-soft);display:flex;align-items:center;gap:4px;' }, [
                    cel('i', { class: 'ti ti-mail' }),
                    cel('span', { textContent: c.email_id })
                ]) : null,
                c.mobile_no ? cel('div', { class: 'pf-contact-meta', style: 'font-size:11px;color:var(--ink-soft);display:flex;align-items:center;gap:4px;' }, [
                    cel('i', { class: 'ti ti-phone' }),
                    cel('span', { textContent: c.mobile_no })
                ]) : null,
                c.tpoc ? cel('div', { style: 'margin-top:4px;' }, [
                    cel('span', { class: 'tpoc-badge-green', style: 'font-size:10px;padding:2px 6px;', textContent: '✓ TPOC' })
                ]) : null
            ])
        ]);
        listEl.appendChild(card);
    });
}


// New Ticket Modal Handlers
let cpUploadedFiles = [];
let cpSelectedDept = "";
let cpProductAssocType = "";
let cpSelectedSub = null;
let cpActiveRenewals = [];
let cpSelectedQuery = "";
let cpSelectedPriority = "Medium";
let cpSelectedContacts = [];
let cpActiveQueryTypes = null;

const CP_DEPARTMENTS = [
    { id: "Technical", name: "Technical", icon: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>', color: "#2563eb", bg: "rgba(37, 99, 235, 0.1)" },
    { id: "Accounts Team & Billing", name: "Accounts & Billing", icon: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>', color: "#0f766e", bg: "rgba(15, 118, 110, 0.1)" },
    { id: "Sales", name: "Sales", icon: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>', color: "#8b5cf6", bg: "rgba(139, 92, 246, 0.1)" },
    { id: "Demo", name: "Demo", icon: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>', color: "#d97706", bg: "rgba(217, 119, 6, 0.1)" },
    { id: "Licence Activation", name: "Licence Activation", icon: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>', color: "#ea580c", bg: "rgba(234, 88, 12, 0.1)" },
    { id: "Other", name: "Other", icon: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>', color: "#64748b", bg: "rgba(100, 116, 139, 0.1)" }
];

function getCategoryOptions() {
    if (cpActiveQueryTypes && cpActiveQueryTypes.length > 0) {
        return cpActiveQueryTypes;
    }
    const genericTypes = (portalData && portalData.support && (portalData.support.query_types || portalData.support.custom_query_types || portalData.support.issue_types)) || [];
    if (genericTypes && genericTypes.length > 0) {
        return genericTypes.map(t => ({
            id: typeof t === 'string' ? t : (t.name || t.id),
            name: typeof t === 'string' ? t : (t.name || t.id),
            icon: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>'
        }));
    }
    return [];
}

function openNewTicketModal() {
    initCustomerPortalWizard();
    cpGoToStep(1);
    go('ticket-new');
}

function closeNewTicketModal() {
    const modal = document.getElementById('modal-new-ticket');
    if (modal) modal.style.display = 'none';
}

function initCustomerPortalWizard() {
    if (!portalData) return;

    const info = portalData.customer_info || {};
    const custEl = document.getElementById('cp-wiz-customer-name');
    if (custEl) custEl.textContent = info.customer_name || 'Valued Customer';

    const mgrEl = document.getElementById('cp-wiz-sales-person');
    if (mgrEl) mgrEl.textContent = info.sales_person || '';

    // Set Default Contact Person to logged-in user contact or primary contact
    const userEmail = (window.userEmail || (portalData.customer_info && portalData.customer_info.user_email) || "").toLowerCase().trim();
    let defaultContact = null;

    if (portalData.contacts && portalData.contacts.length > 0) {
        // Priority 1: Check for logged-in user email match
        if (userEmail) {
            defaultContact = portalData.contacts.find(c => c.email_id && c.email_id.toLowerCase().trim() === userEmail);
        }

        // Priority 2: Check for explicit TPOC contact in portalData.contacts
        if (!defaultContact) {
            defaultContact = portalData.contacts.find(c => c.tpoc || c.custom_tpoc);
        }

        // Priority 3: Check for primary contact
        if (!defaultContact) {
            defaultContact = portalData.contacts.find(c => c.is_primary_contact || c.is_primary) || portalData.contacts[0];
        }
    }

    if (defaultContact) {
        defaultContact = { ...defaultContact, tpoc: 1, custom_tpoc: 1 };
    } else {
        defaultContact = {
            first_name: userEmail ? userEmail.split('@')[0] : (info.user_fullname || "Customer"),
            last_name: "",
            email_id: userEmail || info.user_email || "",
            phone: "",
            designation: "Contact Person",
            tpoc: 1,
            custom_tpoc: 1,
            is_primary: true
        };
    }

    cpSelectedContacts = [defaultContact];

    cpSelectedDept = "";
    cpProductAssocType = "";
    cpSelectedSub = null;
    cpActiveRenewals = [];
    cpSelectedQuery = "";
    cpActiveQueryTypes = null;
    cpSelectedPriority = "Medium";
    cpUploadedFiles = [];

    cpRenderSelectedContact();
    cpRenderSelectedDept();
    cpRenderProductAssoc();
    cpRenderSelectedSub();
    cpRenderSelectedQuery();
    cpSelectPriority('Medium');
    cpRenderAttachmentsList();
}

function cpResetTicketWizard() {
    cpUploadedFiles = [];
    cpSelectedDept = "";
    cpProductAssocType = "";
    cpSelectedSub = null;
    cpActiveRenewals = [];
    cpSelectedQuery = "";
    cpActiveQueryTypes = null;
    cpSelectedPriority = "Medium";
    cpSelectedContacts = [];

    const subj = document.getElementById('nt-subject');
    if (subj) subj.value = '';
    const desc = document.getElementById('nt-description');
    if (desc) desc.value = '';

    initCustomerPortalWizard();
}

/* ─── CONTACT SELECTION & MULTI-CONTACT ADDING ─── */
function cpRenderSelectedContact() {
    const wrap = document.getElementById('cp-wizard-contacts-list');
    if (!wrap) return;
    wrap.replaceChildren();

    if (!cpSelectedContacts || cpSelectedContacts.length === 0) {
        wrap.appendChild(cel('div', { style: 'padding:14px;text-align:center;border:1px dashed #cbd5e1;border-radius:10px;background:#f8fafc;color:var(--ink-soft);font-size:13px;' }, [
            cel('i', { class: 'ti ti-users-minus', style: 'font-size:24px;display:block;margin-bottom:4px;color:#94a3b8;' }),
            document.createTextNode("No contact person selected. Click 'Add / Change Contact' to pick contact person(s).")
        ]));
        return;
    }

    cpSelectedContacts.forEach((c, idx) => {
        const firstName = c.first_name || '';
        const lastName = c.last_name || '';
        const nameStr = `${firstName} ${lastName}`.trim() || c.name || c.email_id || "Customer Contact";

        let initials = "CC";
        if (firstName && lastName) {
            initials = (firstName[0] + lastName[0]).toUpperCase();
        } else if (nameStr) {
            initials = nameStr.substring(0, 2).toUpperCase();
        }

        const isTpoc = (c.tpoc || c.custom_tpoc) ? 1 : 0;

        const removeBtn = cel('button', {
            type: 'button',
            class: 'cp-cc-remove-btn',
            title: 'Remove contact',
            onclick: (e) => {
                e.stopPropagation();
                cpRemoveContact(idx);
            }
        }, [
            cel('i', { class: 'ti ti-x' })
        ]);

        const card = cel('div', { class: 'cp-contact-card', style: 'margin-bottom:8px;' }, [
            cel('div', { class: 'cp-cc-avatar', textContent: initials }),
            cel('div', { class: 'cp-cc-body' }, [
                cel('div', { class: 'cp-cc-top' }, [
                    cel('div', { class: 'cp-cc-name', textContent: nameStr }),
                    isTpoc ? cel('span', { class: 'tpoc-badge-green', title: 'Technical Point of Contact', textContent: '✓ TPOC' }) : null
                ].filter(Boolean)),
                cel('div', { class: 'cp-cc-sub', textContent: `${c.email_id || '-'} · ${c.mobile_no || c.phone || '-'} ${c.designation ? '· ' + c.designation : ''}` })
            ]),
            removeBtn
        ]);
        wrap.appendChild(card);
    });
}

function cpRemoveContact(idx) {
    cpSelectedContacts.splice(idx, 1);
    cpRenderSelectedContact();
    cpRenderContactsModalList();
}

let cpContactModalMode = 'wizard'; // 'wizard' (for ticket creation) or 'detail' (for ticket detail view)

function cpOpenContactModal() {
    cpContactModalMode = 'wizard';
    const modal = document.getElementById('cp-contact-modal');
    if (modal) modal.style.display = 'flex';
    cpSwitchContactTab('existing');
}

function cpOpenTicketDetailContactModal() {
    if (!window.currentPortalTicketName) {
        showPortalToast("No active ticket selected.", "error");
        return;
    }

    cpContactModalMode = 'detail';

    const curContacts = Array.isArray(window.currentTicketContacts) ? window.currentTicketContacts : [];
    cpSelectedContacts = curContacts.map(c => ({
        name: c.name || c.user_name,
        user_name: c.user_name || c.name,
        person_name: c.person_name || c.name,
        first_name: c.first_name || (c.person_name ? c.person_name.split(' ')[0] : ''),
        last_name: c.last_name || (c.person_name ? c.person_name.split(' ').slice(1).join(' ') : ''),
        email_id: c.email_id || '',
        phone: c.mobile_no || c.phone || '',
        mobile_no: c.mobile_no || c.phone || '',
        designation: c.designation || 'Contact',
        tpoc: (c.is_primary || c.tpoc) ? 1 : 0
    }));

    const modal = document.getElementById("cp-contact-modal");
    if (modal) modal.style.display = "flex";
    cpSwitchContactTab('existing');
}

function cpCloseContactModal() {
    const modal = document.getElementById('cp-contact-modal');
    if (modal) modal.style.display = 'none';
}

function cpSaveTicketDetailContacts() {
    if (!window.currentPortalTicketName) return;
    if (window.cpIsSavingTicketContacts) return;
    window.cpIsSavingTicketContacts = true;

    frappe.call({
        method: "customer_portal.api.update_ticket_contacts",
        args: {
            ticket_name: window.currentPortalTicketName,
            contacts: JSON.stringify(cpSelectedContacts)
        },
        callback: function (r) {
            window.cpIsSavingTicketContacts = false;
            if (r && r.message) {
                const d = r.message;
                renderContactDetails(d.customer_contacts || [], d.person_name, d.contact_email);
                showPortalToast("Ticket contacts updated successfully!", "success");
                cpRenderContactsModalList();
            }
        },
        error: function (err) {
            window.cpIsSavingTicketContacts = false;
            showPortalToast((err && err.message) || "Failed to update ticket contacts.", "error");
        }
    });
}

function showPortalToast(msg, type = "info") {
    if (typeof frappe !== 'undefined' && frappe.show_alert) {
        frappe.show_alert({ message: msg, indicator: type === "error" ? "red" : "green" });
    } else {
        alert(msg);
    }
}

function cpSwitchContactTab(tab) {
    if (tab === 'manual') {
        cpCloseContactModal();
        openContactWizModal(null);
        return;
    }
    const tabExist = document.getElementById('cp-ctab-existing');
    const tabMan = document.getElementById('cp-ctab-manual');
    const paneExist = document.getElementById('cp-cpane-existing');
    const paneMan = document.getElementById('cp-cpane-manual');

    if (tabExist) tabExist.classList.add('active');
    if (tabMan) tabMan.classList.remove('active');
    if (paneExist) paneExist.classList.add('active');
    if (paneMan) paneMan.classList.remove('active');
    cpRenderContactsModalList();
}

/* ─── 5-STEP CONTACT WIZARD MODAL CONTROLLER ─── */
let cpContactWizStep = 1;
let cpWizContactEmails = [];
let cpWizContactPhones = [];

function openContactWizModal(docId = null) {
    const modal = document.getElementById("cust-contact-modal-overlay");
    if (!modal) return;

    cpWizContactEmails = [];
    cpWizContactPhones = [];

    const contactIdInput = document.getElementById("cm-contact-id");
    if (contactIdInput) contactIdInput.value = docId || "";

    const fnEl = document.getElementById("cm-first-name"); if (fnEl) fnEl.value = "";
    const lnEl = document.getElementById("cm-last-name"); if (lnEl) lnEl.value = "";
    const stEl = document.getElementById("cm-status"); if (stEl) stEl.value = "Open";
    const gnEl = document.getElementById("cm-gender"); if (gnEl) gnEl.value = "";
    const liEl = document.getElementById("cm-linkedin"); if (liEl) liEl.value = "";
    const dbEl = document.getElementById("cm-dob"); if (dbEl) dbEl.value = "";
    const prEl = document.getElementById("cm-is-primary"); if (prEl) prEl.checked = false;
    const tpEl = document.getElementById("cm-tpoc"); if (tpEl) tpEl.checked = false;

    const desigSelect = document.getElementById("cm-designation-select");
    const desigCustom = document.getElementById("cm-designation-custom");
    const desigHidden = document.getElementById("cm-designation");
    if (desigSelect) desigSelect.value = "";
    if (desigCustom) { desigCustom.value = ""; desigCustom.style.display = "none"; }
    if (desigHidden) desigHidden.value = "";

    const deptSelect = document.getElementById("cm-department-select");
    const deptCustom = document.getElementById("cm-department-custom");
    const deptHidden = document.getElementById("cm-department");
    if (deptSelect) deptSelect.value = "";
    if (deptCustom) { deptCustom.value = ""; deptCustom.style.display = "none"; }
    if (deptHidden) deptHidden.value = "";

    const addrSelect = document.getElementById("cm-address");
    if (addrSelect) {
        const addresses = (portalData && portalData.customer_info && portalData.customer_info.addresses) ? portalData.customer_info.addresses : [];
        addrSelect.replaceChildren(cel('option', { value: '', textContent: '-- Select Address --' }));
        addresses.forEach(a => {
            addrSelect.appendChild(cel('option', { value: a.name || a.id, textContent: `${a.address_title || a.city || 'Address'} (${a.address_type || 'Billing'})` }));
        });
        addrSelect.value = "";
    }

    if (document.getElementById("cm-new-email")) document.getElementById("cm-new-email").value = "";
    if (document.getElementById("cm-new-email-primary")) document.getElementById("cm-new-email-primary").checked = false;
    if (document.getElementById("cm-new-phone")) document.getElementById("cm-new-phone").value = "";
    if (document.getElementById("cm-new-phone-primary-phone")) document.getElementById("cm-new-phone-primary-phone").checked = false;
    if (document.getElementById("cm-new-phone-primary-mobile")) document.getElementById("cm-new-phone-primary-mobile").checked = false;

    const titleEl = document.getElementById("cust-contact-modal-title");
    if (titleEl) titleEl.textContent = docId ? "Edit Contact" : "New Contact";

    cpRenderModalEmails();
    cpRenderModalPhones();
    cpSetContactWizStep(1);

    if (docId) {
        frappe.call({
            method: "customer_portal.api.get_contact_detail",
            args: { contact_id: docId },
            callback: function (r) {
                if (r && r.message) {
                    const doc = r.message;
                    const fnE = document.getElementById("cm-first-name"); if (fnE) fnE.value = doc.first_name || "";
                    const lnE = document.getElementById("cm-last-name"); if (lnE) lnE.value = doc.last_name || "";
                    const stE = document.getElementById("cm-status"); if (stE) stE.value = doc.status || "Open";
                    const gnE = document.getElementById("cm-gender"); if (gnE) gnE.value = doc.gender || "";
                    const liE = document.getElementById("cm-linkedin"); if (liE) liE.value = doc.custom_linked_in || "";
                    const dbE = document.getElementById("cm-dob"); if (dbE) dbE.value = doc.date_of_birth || "";
                    const prE = document.getElementById("cm-is-primary"); if (prE) prE.checked = Boolean(doc.is_primary_contact);
                    const tpE = document.getElementById("cm-tpoc"); if (tpE) tpE.checked = Boolean(doc.tpoc || doc.custom_tpoc);

                    const dVal = doc.designation || "";
                    if (desigSelect) {
                        const hasOpt = Array.from(desigSelect.options).some(o => o.value === dVal);
                        if (dVal && hasOpt) {
                            desigSelect.value = dVal;
                            if (desigCustom) desigCustom.style.display = "none";
                        } else if (dVal) {
                            desigSelect.value = "Custom";
                            if (desigCustom) { desigCustom.value = dVal; desigCustom.style.display = "block"; }
                        }
                    }

                    const deptVal = doc.department || "";
                    if (deptSelect) {
                        const hasOpt = Array.from(deptSelect.options).some(o => o.value === deptVal);
                        if (deptVal && hasOpt) {
                            deptSelect.value = deptVal;
                            if (deptCustom) deptCustom.style.display = "none";
                        } else if (deptVal) {
                            deptSelect.value = "Custom";
                            if (deptCustom) { deptCustom.value = deptVal; deptCustom.style.display = "block"; }
                        }
                    }

                    if (addrSelect && doc.address) addrSelect.value = doc.address;

                    cpWizContactEmails = Array.isArray(doc.email_ids) ? doc.email_ids.map(e => ({ email_id: e.email_id, is_primary: e.is_primary })) : [];
                    if (!cpWizContactEmails.length && doc.email_id) {
                        cpWizContactEmails.push({ email_id: doc.email_id, is_primary: 1 });
                    }

                    cpWizContactPhones = Array.isArray(doc.phone_nos) ? doc.phone_nos.map(p => ({ phone: p.phone, is_primary_phone: p.is_primary_phone, is_primary_mobile_no: p.is_primary_mobile_no })) : [];
                    if (!cpWizContactPhones.length && (doc.phone || doc.mobile_no)) {
                        cpWizContactPhones.push({ phone: doc.phone || doc.mobile_no, is_primary_phone: 1, is_primary_mobile_no: 1 });
                    }

                    cpRenderModalEmails();
                    cpRenderModalPhones();
                }
            }
        });
    }

    modal.style.display = "flex";
}

function cpOpenAddContactModalStandalone() {
    openContactWizModal(null);
}

function cpCloseContactWizModal() {
    const modal = document.getElementById("cust-contact-modal-overlay");
    if (modal) modal.style.display = "none";
}

function cpSetContactWizStep(step) {
    cpContactWizStep = step;

    document.querySelectorAll(".cm-wiz-panel").forEach(panel => {
        const pNum = parseInt(panel.dataset.panel);
        panel.style.display = (pNum === step) ? "block" : "none";
    });

    document.querySelectorAll(".cm-wiz-step-item").forEach(item => {
        const itemStep = parseInt(item.dataset.step);
        const circle = item.querySelector(".step-circle");
        const text = item.querySelector("span");

        if (!circle || !text) return;

        if (itemStep === step) {
            circle.style.background = "var(--indigo, #4f46e5)";
            circle.style.color = "white";
            circle.style.borderColor = "var(--indigo, #4f46e5)";
            text.style.fontWeight = "700";
            text.style.color = "var(--ink, #0f172a)";
        } else if (itemStep < step) {
            circle.style.background = "var(--indigo-soft, #e0e7ff)";
            circle.style.color = "var(--indigo, #4f46e5)";
            circle.style.borderColor = "var(--indigo, #4f46e5)";
            text.style.fontWeight = "500";
            text.style.color = "var(--ink-soft, #64748b)";
        } else {
            circle.style.background = "var(--surface-2, #f8fafc)";
            circle.style.color = "var(--ink-soft, #94a3b8)";
            circle.style.borderColor = "var(--line, #cbd5e1)";
            text.style.fontWeight = "500";
            text.style.color = "var(--ink-soft, #94a3b8)";
        }
    });

    const backBtn = document.getElementById("cust-contact-modal-back");
    const nextBtn = document.getElementById("cust-contact-modal-next");
    const saveBtn = document.getElementById("cust-contact-modal-save");

    if (backBtn) backBtn.style.display = (step > 1) ? "block" : "none";
    if (nextBtn) nextBtn.style.display = (step < 5) ? "block" : "none";
    if (saveBtn) saveBtn.style.display = (step === 5) ? "block" : "none";

    if (step === 5) {
        cpRenderWizReviewSummary();
    }
}

function cpWizNextStep() {
    if (cpContactWizStep === 1) {
        const fnEl = document.getElementById("cm-first-name");
        const fname = fnEl ? fnEl.value.trim() : "";
        if (!fname) {
            showPortalToast("First Name is required.", "error");
            if (fnEl) fnEl.focus();
            return;
        }
    } else if (cpContactWizStep === 4) {
        const desigSelect = document.getElementById("cm-designation-select");
        const desigCustom = document.getElementById("cm-designation-custom");
        const designation = (desigSelect ? (desigSelect.value === "Custom" ? (desigCustom ? desigCustom.value : "") : desigSelect.value) : "").trim();

        const deptSelect = document.getElementById("cm-department-select");
        const deptCustom = document.getElementById("cm-department-custom");
        const department = (deptSelect ? (deptSelect.value === "Custom" ? (deptCustom ? deptCustom.value : "") : deptSelect.value) : "").trim();

        const gnEl = document.getElementById("cm-gender");
        const gender = gnEl ? gnEl.value : "";

        if (!designation) {
            showPortalToast("Designation is required.", "error");
            if (desigSelect && desigSelect.value === "Custom") { if (desigCustom) desigCustom.focus(); } else if (desigSelect) desigSelect.focus();
            return;
        }
        if (!department) {
            showPortalToast("Department is required.", "error");
            if (deptSelect && deptSelect.value === "Custom") { if (deptCustom) deptCustom.focus(); } else if (deptSelect) deptSelect.focus();
            return;
        }
        if (!gender) {
            showPortalToast("Gender is required.", "error");
            if (gnEl) gnEl.focus();
            return;
        }
    }

    if (cpContactWizStep < 5) {
        cpSetContactWizStep(cpContactWizStep + 1);
    }
}

function cpWizPrevStep() {
    if (cpContactWizStep > 1) {
        cpSetContactWizStep(cpContactWizStep - 1);
    }
}

function cpHandleDesignationChange(selectEl) {
    const customInp = document.getElementById("cm-designation-custom");
    if (customInp) {
        customInp.style.display = selectEl.value === "Custom" ? "block" : "none";
        if (selectEl.value === "Custom") customInp.focus();
    }
}

function cpHandleDepartmentChange(selectEl) {
    const customInp = document.getElementById("cm-department-custom");
    if (customInp) {
        customInp.style.display = selectEl.value === "Custom" ? "block" : "none";
        if (selectEl.value === "Custom") customInp.focus();
    }
}

function cpRenderModalEmails() {
    const wrap = document.getElementById("cm-emails-list");
    if (!wrap) return;
    wrap.replaceChildren();

    if (!cpWizContactEmails || !cpWizContactEmails.length) {
        wrap.appendChild(cel('div', { style: 'padding:8px;font-size:12px;color:var(--ink-soft);text-align:center;' }, [
            document.createTextNode("No email addresses added yet.")
        ]));
        return;
    }

    cpWizContactEmails.forEach((item, idx) => {
        const badge = cel('div', { style: 'display:flex;align-items:center;justify-content:space-between;padding:8px 12px;border:1px solid var(--line,#cbd5e1);border-radius:8px;background:white;' }, [
            cel('div', { style: 'display:flex;align-items:center;gap:8px;' }, [
                cel('i', { class: 'ti ti-mail', style: 'color:var(--indigo,#4f46e5);font-size:14px;' }),
                cel('span', { style: 'font-size:13px;font-weight:500;color:var(--ink);', textContent: item.email_id }),
                item.is_primary ? cel('span', { class: 'pf-pill paid', style: 'font-size:10px;padding:2px 6px;', textContent: 'Primary' }) : null
            ].filter(Boolean)),
            cel('div', { style: 'display:flex;gap:6px;' }, [
                !item.is_primary ? cel('button', {
                    type: 'button',
                    class: 'btn secondary btn-sm',
                    style: 'font-size:10px;padding:2px 8px;',
                    onclick: () => {
                        cpWizContactEmails.forEach((e, i) => e.is_primary = (i === idx ? 1 : 0));
                        cpRenderModalEmails();
                    }
                }, [document.createTextNode("Set Primary")]) : null,
                cel('button', {
                    type: 'button',
                    class: 'btn secondary btn-sm',
                    style: 'font-size:10px;padding:2px 6px;color:var(--crimson,#ef4444);',
                    onclick: () => {
                        cpWizContactEmails.splice(idx, 1);
                        cpRenderModalEmails();
                    }
                }, [cel('i', { class: 'ti ti-trash' })])
            ].filter(Boolean))
        ]);
        wrap.appendChild(badge);
    });
}

function cpAddWizEmail() {
    const inp = document.getElementById("cm-new-email");
    const chk = document.getElementById("cm-new-email-primary");
    const emailVal = inp ? inp.value.trim() : "";

    if (!emailVal) {
        showPortalToast("Please enter an email address.", "error");
        if (inp) inp.focus();
        return;
    }

    const isPrimary = chk && chk.checked ? 1 : (cpWizContactEmails.length === 0 ? 1 : 0);
    if (isPrimary) {
        cpWizContactEmails.forEach(e => e.is_primary = 0);
    }

    cpWizContactEmails.push({ email_id: emailVal, is_primary: isPrimary });
    if (inp) inp.value = "";
    if (chk) chk.checked = false;
    cpRenderModalEmails();
}

function cpRenderModalPhones() {
    const wrap = document.getElementById("cm-phones-list");
    if (!wrap) return;
    wrap.replaceChildren();

    if (!cpWizContactPhones || !cpWizContactPhones.length) {
        wrap.appendChild(cel('div', { style: 'padding:8px;font-size:12px;color:var(--ink-soft);text-align:center;' }, [
            document.createTextNode("No phone numbers added yet.")
        ]));
        return;
    }

    cpWizContactPhones.forEach((item, idx) => {
        const tags = [];
        if (item.is_primary_phone) tags.push("Primary Phone");
        if (item.is_primary_mobile_no) tags.push("Primary Mobile");

        const badge = cel('div', { style: 'display:flex;align-items:center;justify-content:space-between;padding:8px 12px;border:1px solid var(--line,#cbd5e1);border-radius:8px;background:white;' }, [
            cel('div', { style: 'display:flex;align-items:center;gap:8px;' }, [
                cel('i', { class: 'ti ti-phone', style: 'color:var(--indigo,#4f46e5);font-size:14px;' }),
                cel('span', { style: 'font-size:13px;font-weight:500;color:var(--ink);', textContent: item.phone }),
                tags.length ? cel('span', { class: 'pf-pill paid', style: 'font-size:10px;padding:2px 6px;', textContent: tags.join(' · ') }) : null
            ].filter(Boolean)),
            cel('button', {
                type: 'button',
                class: 'btn secondary btn-sm',
                style: 'font-size:10px;padding:2px 6px;color:var(--crimson,#ef4444);',
                onclick: () => {
                    cpWizContactPhones.splice(idx, 1);
                    cpRenderModalPhones();
                }
            }, [cel('i', { class: 'ti ti-trash' })])
        ]);
        wrap.appendChild(badge);
    });
}

function cpAddWizPhone() {
    const inp = document.getElementById("cm-new-phone");
    const chkPhone = document.getElementById("cm-new-phone-primary-phone");
    const chkMobile = document.getElementById("cm-new-phone-primary-mobile");
    const phoneVal = inp ? inp.value.trim() : "";

    if (!phoneVal) {
        showPortalToast("Please enter a phone number.", "error");
        if (inp) inp.focus();
        return;
    }

    const isPrimaryPhone = chkPhone && chkPhone.checked ? 1 : (cpWizContactPhones.length === 0 ? 1 : 0);
    const isPrimaryMobile = chkMobile && chkMobile.checked ? 1 : (cpWizContactPhones.length === 0 ? 1 : 0);

    if (isPrimaryPhone) cpWizContactPhones.forEach(p => p.is_primary_phone = 0);
    if (isPrimaryMobile) cpWizContactPhones.forEach(p => p.is_primary_mobile_no = 0);

    cpWizContactPhones.push({
        phone: phoneVal,
        is_primary_phone: isPrimaryPhone,
        is_primary_mobile_no: isPrimaryMobile
    });

    if (inp) inp.value = "";
    if (chkPhone) chkPhone.checked = false;
    if (chkMobile) chkMobile.checked = false;
    cpRenderModalPhones();
}

function cpRenderWizReviewSummary() {
    const reviewDiv = document.getElementById("cm-review-summary");
    if (!reviewDiv) return;
    reviewDiv.replaceChildren();

    const fnEl = document.getElementById("cm-first-name");
    const lnEl = document.getElementById("cm-last-name");
    const firstName = fnEl ? fnEl.value.trim() : "";
    const lastName = lnEl ? lnEl.value.trim() : "";

    const desigSelect = document.getElementById("cm-designation-select");
    const desigCustom = document.getElementById("cm-designation-custom");
    const designation = (desigSelect ? (desigSelect.value === "Custom" ? (desigCustom ? desigCustom.value : "") : desigSelect.value) : "").trim();

    const deptSelect = document.getElementById("cm-department-select");
    const deptCustom = document.getElementById("cm-department-custom");
    const department = (deptSelect ? (deptSelect.value === "Custom" ? (deptCustom ? deptCustom.value : "") : deptSelect.value) : "").trim();

    const stEl = document.getElementById("cm-status");
    const gnEl = document.getElementById("cm-gender");
    const prEl = document.getElementById("cm-is-primary");
    const tpEl = document.getElementById("cm-tpoc");

    const status = stEl ? stEl.value : "";
    const gender = gnEl ? gnEl.value : "";
    const isPrimary = prEl ? prEl.checked : false;
    const isTpoc = tpEl ? tpEl.checked : false;

    const emailListStr = cpWizContactEmails.map(e => `${e.email_id}${e.is_primary ? ' (Primary)' : ''}`).join(', ') || '-';
    const phoneListStr = cpWizContactPhones.map(p => p.phone).join(', ') || '-';

    const card = cel('div', { style: 'padding:14px;border:1px solid var(--line,#e2e8f0);border-radius:10px;background:var(--surface-2,#f8fafc);' }, [
        cel('h4', { style: 'margin:0 0 10px;font-size:15px;font-weight:700;color:var(--indigo,#4f46e5);', textContent: `${firstName} ${lastName}`.trim() }),
        cel('div', { style: 'display:grid;grid-template-columns:1fr 1fr;gap:10px;font-size:13px;' }, [
            cel('div', {}, [cel('strong', { textContent: 'Designation: ' }), document.createTextNode(designation || '-')]),
            cel('div', {}, [cel('strong', { textContent: 'Department: ' }), document.createTextNode(department || '-')]),
            cel('div', {}, [cel('strong', { textContent: 'Gender: ' }), document.createTextNode(gender || '-')]),
            cel('div', {}, [cel('strong', { textContent: 'Status: ' }), document.createTextNode(status || '-')]),
            cel('div', { style: 'grid-column:1 / -1;' }, [cel('strong', { textContent: 'Emails: ' }), document.createTextNode(emailListStr)]),
            cel('div', { style: 'grid-column:1 / -1;' }, [cel('strong', { textContent: 'Phones: ' }), document.createTextNode(phoneListStr)]),
            cel('div', { style: 'grid-column:1 / -1;display:flex;gap:10px;margin-top:4px;' }, [
                isPrimary ? cel('span', { class: 'pf-pill paid', textContent: 'Primary Contact' }) : null,
                isTpoc ? cel('span', { class: 'pf-pill paid', style: 'background:#dcfce7;color:#15803d;', textContent: 'TPOC' }) : null
            ].filter(Boolean))
        ])
    ]);

    reviewDiv.appendChild(card);
}

function cpSaveContactWiz() {
    const saveBtn = document.getElementById("cust-contact-modal-save");
    if (saveBtn) {
        if (saveBtn.disabled) return;
        saveBtn.disabled = true;
        if (!saveBtn.dataset.origText) saveBtn.dataset.origText = saveBtn.innerHTML;
        saveBtn.innerHTML = '<i class="ti ti-loader spin" style="margin-right:6px;"></i> Saving...';
    }

    const idEl = document.getElementById("cm-contact-id");
    const docId = idEl ? idEl.value : "";

    const fnEl = document.getElementById("cm-first-name");
    const lnEl = document.getElementById("cm-last-name");
    const firstName = fnEl ? fnEl.value.trim() : "";
    const lastName = lnEl ? lnEl.value.trim() : "";

    const desigSelect = document.getElementById("cm-designation-select");
    const desigCustom = document.getElementById("cm-designation-custom");
    const designation = (desigSelect ? (desigSelect.value === "Custom" ? (desigCustom ? desigCustom.value : "") : desigSelect.value) : "").trim();

    const deptSelect = document.getElementById("cm-department-select");
    const deptCustom = document.getElementById("cm-department-custom");
    const department = (deptSelect ? (deptSelect.value === "Custom" ? (deptCustom ? deptCustom.value : "") : deptSelect.value) : "").trim();

    const stEl = document.getElementById("cm-status");
    const gnEl = document.getElementById("cm-gender");
    const liEl = document.getElementById("cm-linkedin");
    const dbEl = document.getElementById("cm-dob");
    const prEl = document.getElementById("cm-is-primary");
    const tpEl = document.getElementById("cm-tpoc");
    const adEl = document.getElementById("cm-address");

    const status = stEl ? stEl.value : "Open";
    const gender = gnEl ? gnEl.value : "";
    const linkedin = liEl ? liEl.value.trim() : "";
    const dob = dbEl ? dbEl.value : "";
    const isPrimary = prEl && prEl.checked ? 1 : 0;
    const isTpoc = tpEl && tpEl.checked ? 1 : 0;
    const address = adEl ? adEl.value : "";

    frappe.call({
        method: "customer_portal.api.save_contact",
        args: {
            docname: docId || null,
            first_name: firstName,
            last_name: lastName,
            designation: designation,
            department: department,
            status: status,
            gender: gender,
            is_primary: isPrimary,
            tpoc: isTpoc,
            emails: JSON.stringify(cpWizContactEmails),
            phones: JSON.stringify(cpWizContactPhones),
            custom_linked_in: linkedin,
            date_of_birth: dob,
            address: address
        },
        callback: function (r) {
            if (saveBtn) {
                saveBtn.disabled = false;
                if (saveBtn.dataset.origText) saveBtn.innerHTML = saveBtn.dataset.origText;
            }
            if (r && r.message) {
                const updatedContact = r.message;

                if (portalData) {
                    if (!portalData.contacts) portalData.contacts = [];
                    const idx = portalData.contacts.findIndex(c => c.name === updatedContact.name || (c.email_id && c.email_id === updatedContact.email_id));
                    if (idx >= 0) {
                        portalData.contacts[idx] = { ...portalData.contacts[idx], ...updatedContact };
                    } else {
                        portalData.contacts.unshift(updatedContact);
                    }
                }

                showPortalToast(docId ? "Contact updated successfully!" : "Contact created successfully!", "success");
                cpCloseContactWizModal();

                const selIdx = cpSelectedContacts.findIndex(c => c.name === updatedContact.name || (c.email_id && c.email_id === updatedContact.email_id));
                if (selIdx >= 0) {
                    cpSelectedContacts[selIdx] = { ...cpSelectedContacts[selIdx], ...updatedContact };
                } else {
                    cpSelectedContacts.push({ ...updatedContact, tpoc: isTpoc, custom_tpoc: isTpoc });
                }
                cpRenderSelectedContact();
            }
        },
        error: function (err) {
            if (saveBtn) {
                saveBtn.disabled = false;
                if (saveBtn.dataset.origText) saveBtn.innerHTML = saveBtn.dataset.origText;
            }
            showPortalToast((err && err.message) || "Failed to save contact.", "error");
        }
    });
}

function cpRenderContactsModalList() {
    const list = document.getElementById('cp-contacts-modal-list');
    if (!list) return;
    list.replaceChildren();

    const contacts = (portalData && portalData.contacts) ? portalData.contacts : [];
    if (!contacts.length) {
        list.appendChild(cel('div', { style: 'padding:16px;text-align:center;color:var(--ink-soft);font-size:13px;' }, ['No existing contacts found. Click "Add New Contact" to create one.']));
        return;
    }

    contacts.forEach(c => {
        const nameStr = `${c.first_name || ''} ${c.last_name || ''}`.trim() || c.name || c.email_id;
        const isSel = cpSelectedContacts.some(sc => sc.name === c.name || (sc.email_id && sc.email_id === c.email_id));
        const selObj = cpSelectedContacts.find(sc => sc.name === c.name || (sc.email_id && sc.email_id === c.email_id));

        // Unselected contacts are unchecked (false) initially unless user manually checks
        const isTpoc = isSel ? Boolean(selObj && (selObj.tpoc === 1 || selObj.tpoc === true)) : Boolean(c._manual_tpoc === 1);

        const tpocWrap = cel('div', {
            style: 'display:flex;align-items:center;gap:4px;margin-right:12px;',
            onclick: (e) => e.stopPropagation()
        }, [
            cel('input', {
                type: 'checkbox',
                id: `cp-existing-tpoc-${c.name || c.email_id}`,
                style: 'width:14px;height:14px;cursor:pointer;accent-color:var(--indigo,#4f46e5);',
                checked: Boolean(isTpoc),
                onchange: (e) => {
                    const isChecked = e.target.checked;
                    const val = isChecked ? 1 : 0;
                    c._manual_tpoc = val;
                    c.tpoc = val;
                    c.custom_tpoc = val;
                    if (selObj) {
                        selObj.tpoc = val;
                        selObj.custom_tpoc = val;
                        cpRenderSelectedContact();
                    }
                }
            }),
            cel('label', {
                for: `cp-existing-tpoc-${c.name || c.email_id}`,
                style: 'font-size:11px;font-weight:600;color:var(--ink-soft);cursor:pointer;margin-bottom:0;user-select:none;',
                textContent: 'TPOC'
            })
        ]);

        const addBtn = cel('button', {
            type: 'button',
            class: 'cp-con-pick-add-btn ' + (isSel ? 'added' : ''),
            title: isSel ? 'Remove contact' : 'Add contact',
            onclick: (e) => {
                e.stopPropagation();
                cpToggleContact(c);
            }
        }, [
            cel('i', { class: isSel ? 'ti ti-check' : 'ti ti-plus' })
        ]);

        const item = cel('div', {
            class: 'cp-contact-modal-item ' + (isSel ? 'selected' : ''),
            onclick: () => cpToggleContact(c)
        }, [
            cel('div', { class: 'cp-cmi-avatar', textContent: (nameStr[0] || 'U').toUpperCase() }),
            cel('div', { class: 'cp-cmi-info' }, [
                cel('div', { class: 'cp-cmi-name', textContent: nameStr }),
                cel('div', { class: 'cp-cmi-sub', textContent: `${c.email_id || ''} ${c.phone || c.mobile_no || ''}`.trim() })
            ]),
            tpocWrap,
            addBtn
        ]);

        list.appendChild(item);
    });
}

function cpToggleContact(c) {
    const idx = cpSelectedContacts.findIndex(sc => sc.name === c.name || (sc.email_id && sc.email_id === c.email_id));
    if (idx >= 0) {
        cpSelectedContacts.splice(idx, 1);
        c._manual_tpoc = 0;
    } else {
        const tpocChk = document.getElementById(`cp-existing-tpoc-${c.name || c.email_id}`);
        const isTpoc = (tpocChk && tpocChk.checked) || c._manual_tpoc === 1 ? 1 : 0;
        cpSelectedContacts.push({ ...c, tpoc: isTpoc, custom_tpoc: isTpoc });
    }

    if (typeof cpContactModalMode !== 'undefined' && cpContactModalMode === 'detail' && window.currentPortalTicketName) {
        if (typeof cpSaveTicketDetailContacts === 'function') cpSaveTicketDetailContacts();
    }
    cpRenderSelectedContact();
    cpRenderContactsModalList();
}

function cpSaveNewContact() {
    const firstName = document.getElementById('cp-nc-first-name')?.value.trim();
    const lastName = document.getElementById('cp-nc-last-name')?.value.trim();
    const email = document.getElementById('cp-nc-email')?.value.trim();
    const mobile = document.getElementById('cp-nc-mobile')?.value.trim();
    const designation = document.getElementById('cp-nc-designation')?.value.trim();

    if (!firstName || !email) {
        alert('Please fill in First Name and Email Address.');
        return;
    }

    const tpocChk = document.getElementById('cp-nc-tpoc');
    const isTpoc = tpocChk && tpocChk.checked ? 1 : 0;

    const newContact = {
        name: email,
        first_name: firstName,
        last_name: lastName,
        email_id: email,
        mobile_no: mobile,
        designation: designation,
        is_primary: isTpoc ? true : false,
        tpoc: isTpoc,
        custom_tpoc: isTpoc
    };

    if (portalData) {
        if (!portalData.contacts) portalData.contacts = [];
        portalData.contacts.push(newContact);
    }

    cpSelectedContacts.push(newContact);
    cpRenderSelectedContact();
    cpCloseContactModal();
}

/* ─── DEPARTMENT MODEL CARD & MODAL ─── */
function cpRenderSelectedDept() {
    const card = document.getElementById('cp-selected-dept-card');
    if (!card) return;
    card.replaceChildren();

    if (!cpSelectedDept) {
        card.className = "selected-model-card placeholder-state";
        card.style.borderStyle = "dashed";
        card.appendChild(cel('div', { class: 'smc-left' }, [
            cel('div', { class: 'smc-ico placeholder', innerHTML: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>' }),
            cel('div', { class: 'smc-info' }, [
                cel('div', { class: 'smc-title placeholder', textContent: "Select Department *" })
            ])
        ]));
        cpUpdateDeptVisibility();
        return;
    }

    card.className = "selected-model-card";
    card.style.borderStyle = "solid";

    const d = CP_DEPARTMENTS.find(dept => dept.id === cpSelectedDept) || { name: cpSelectedDept, icon: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 21h18M3 7v14M21 7v14M6 3h12v4H6z"/></svg>', color: "var(--indigo, #4f46e5)", bg: "rgba(79, 70, 229, 0.1)" };

    const leftWrap = cel('div', { class: 'smc-left' }, [
        cel('div', {
            class: 'smc-ico',
            style: `background: ${d.bg}; color: ${d.color};`,
            innerHTML: d.icon
        }),
        cel('div', { class: 'smc-info' }, [
            cel('div', { class: 'smc-title', textContent: d.name })
        ])
    ]);

    const rightWrap = cel('div', { class: 'smc-radio-chk' }, [
        cel('div', { class: 'smc-radio-dot' })
    ]);

    card.appendChild(leftWrap);
    card.appendChild(rightWrap);
    cpUpdateDeptVisibility();
}

function cpOpenDeptModal() {
    const modal = document.getElementById('cp-dept-modal');
    if (modal) modal.style.display = 'flex';
    cpRenderDeptModalGrid();
}

function cpCloseDeptModal() {
    const modal = document.getElementById('cp-dept-modal');
    if (modal) modal.style.display = 'none';
}

function cpRenderDeptModalGrid() {
    const grid = document.getElementById('cp-dept-modal-grid');
    if (!grid) return;
    grid.replaceChildren();

    CP_DEPARTMENTS.forEach(d => {
        const isSel = cpSelectedDept === d.id;
        const tile = cel('div', {
            class: 'cp-dept-tile model-tile ' + (isSel ? 'selected' : ''),
            onclick: () => cpSelectDept(d.id)
        }, [
            cel('div', {
                class: 'model-tile-ico',
                style: `background: ${d.bg}; color: ${d.color};`,
                innerHTML: d.icon
            }),
            cel('div', { class: 'cp-dept-info' }, [
                cel('div', { class: 'model-tile-title', textContent: d.name })
            ]),
            isSel ? cel('div', { class: 'smc-radio-chk', style: 'margin-left:auto;' }, [cel('div', { class: 'smc-radio-dot' })]) : null
        ].filter(Boolean));
        grid.appendChild(tile);
    });
}

function cpSelectDept(deptId) {
    cpSelectedDept = deptId;
    if (cpSelectedDept !== 'Technical') {
        cpProductAssocType = "";
        const inp = document.getElementById('nt-product-association-type');
        if (inp) inp.value = "";
    }
    cpRenderSelectedDept();
    cpRenderProductAssoc();
    cpCloseDeptModal();
}

/* ─── PRODUCT ASSOCIATION TYPE (EXISTING ASSET VS NEW PRODUCT) ─── */
function cpSelectProductAssoc(type) {
    cpProductAssocType = type;
    const inp = document.getElementById('nt-product-association-type');
    if (inp) inp.value = type;
    cpRenderProductAssoc();
}

function cpRenderProductAssoc() {
    const grp = document.getElementById('cp-product-assoc-grp');
    if (grp) {
        grp.style.display = (cpSelectedDept === 'Technical') ? 'block' : 'none';
    }
    const cardExisting = document.getElementById('cp-assoc-existing');
    const cardNew = document.getElementById('cp-assoc-new');
    if (cardExisting) {
        if (cpProductAssocType === 'Existing Asset') {
            cardExisting.classList.add('selected');
        } else {
            cardExisting.classList.remove('selected');
        }
    }
    if (cardNew) {
        if (cpProductAssocType === 'New Product') {
            cardNew.classList.add('selected');
        } else {
            cardNew.classList.remove('selected');
        }
    }
    cpUpdateDeptVisibility();
    if (typeof cpUpdateStepperVisibility === 'function') {
        cpUpdateStepperVisibility();
    }
}

function cpUpdateDeptVisibility() {
    const isTech = cpSelectedDept === 'Technical';
    const isExisting = isTech && cpProductAssocType === 'Existing Asset';

    const assocGrp = document.getElementById('cp-product-assoc-grp');
    if (assocGrp) assocGrp.style.display = isTech ? 'block' : 'none';

    const subGrp = document.getElementById('cp-sub-grp');
    if (subGrp) subGrp.style.display = isExisting ? 'block' : 'none';

    if (!isExisting) {
        cpSelectedSub = null;
        cpActiveQueryTypes = null;
        cpSelectedQuery = "";
        cpRenderSelectedSub();
        cpRenderSelectedQuery();
    }
}

/* ─── ACTIVE SUBSCRIPTION MODEL CARD & MODAL (DYNAMIC SLA TASKS) ─── */
function cpRenderSelectedSub() {
    const card = document.getElementById('cp-selected-sub-card');
    if (!card) return;
    card.replaceChildren();

    if (!cpSelectedSub) {
        card.className = 'selected-model-card placeholder-state';
        card.style.borderStyle = "dashed";
        card.appendChild(cel('div', { class: 'smc-left' }, [
            cel('div', { class: 'smc-ico placeholder', innerHTML: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>' }),
            cel('div', { class: 'smc-info' }, [
                cel('div', { class: 'smc-title placeholder', textContent: 'Select Active Subscription / Asset (Optional)' })
            ])
        ]));
        return;
    }

    card.className = 'selected-model-card';
    card.style.borderStyle = "solid";

    const leftWrap = cel('div', { class: 'smc-left' }, [
        cel('div', { class: 'smc-ico sub-icon', innerHTML: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>' }),
        cel('div', { class: 'smc-info' }, [
            cel('div', { class: 'smc-title', textContent: cpSelectedSub.product_name || cpSelectedSub.name }),
            cel('div', { class: 'smc-sub', textContent: `Ref: ${cpSelectedSub.name} · Qty: ${cpSelectedSub.total_quantity || 1} · End Date: ${cpSelectedSub.end_date || '-'}` })
        ])
    ]);

    const clearBtn = cel('button', {
        type: 'button',
        class: 'smc-clear-btn',
        onclick: (e) => {
            e.stopPropagation();
            cpClearSub();
        }
    }, [
        cel('i', { class: 'ti ti-x' }),
        document.createTextNode(' Clear')
    ]);

    card.appendChild(leftWrap);
    card.appendChild(clearBtn);
}

function cpOpenSubModal() {
    const modal = document.getElementById('cp-sub-modal');
    if (modal) modal.style.display = 'flex';
    cpRenderSubModalList();
}

function cpCloseSubModal() {
    const modal = document.getElementById('cp-sub-modal');
    if (modal) modal.style.display = 'none';
}

function cpFilterSubscriptions(query) {
    cpRenderSubModalList(query);
}

function cpRenderSubModalList(filterQuery = '') {
    const list = document.getElementById('cp-sub-modal-list');
    if (!list) return;
    list.replaceChildren();

    let items = (portalData && portalData.renewals) ? portalData.renewals : [];
    items = items.filter(s => {
        if (!s) return false;
        const status = (s.status || '').toLowerCase();
        if (status === 'cancelled' || status === 'expired') return false;
        if (s.end_date) {
            const days = Math.ceil((new Date(s.end_date) - new Date()) / (1000 * 60 * 60 * 24));
            if (days < -30) return false;
        }
        return true;
    });

    if (filterQuery.trim()) {
        const q = filterQuery.toLowerCase().trim();
        items = items.filter(s =>
            (s.product_name || '').toLowerCase().includes(q) ||
            (s.name || '').toLowerCase().includes(q) ||
            (s.domain_name || '').toLowerCase().includes(q)
        );
    }

    if (!items.length) {
        list.appendChild(cel('div', { style: 'padding:20px;text-align:center;color:var(--ink-soft);font-size:13px;' }, [
            document.createTextNode(filterQuery ? 'No matching active subscriptions found.' : 'No active subscriptions or assets found for this customer.')
        ]));
        return;
    }

    items.forEach(s => {
        const isSel = cpSelectedSub && cpSelectedSub.name === s.name;
        const days = s.end_date ? Math.ceil((new Date(s.end_date) - new Date()) / (1000 * 60 * 60 * 24)) : 9999;
        const daysStr = days >= 9999 ? "Perpetual" : (days < 0 ? "EXPIRED" : `${days}d left`);

        const boxSvg = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>';
        const chkSvg = '<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>';

        const card = cel('div', {
            class: 'cp-sub-modal-item ' + (isSel ? 'selected' : ''),
            onclick: () => cpSelectSub(s)
        }, [
            cel('div', { class: 'cp-smi-icon', innerHTML: boxSvg }),
            cel('div', { class: 'cp-smi-info' }, [
                cel('div', { class: 'cp-smi-title', textContent: `${s.product_name || s.name} · ${daysStr}` }),
                cel('div', { class: 'cp-smi-sub', textContent: `Ref #${s.name} · Qty: ${s.total_quantity || 1} · End Date: ${formatDate(s.end_date)}` })
            ]),
            isSel ? cel('div', { class: 'cp-smi-chk', innerHTML: chkSvg }) : null
        ].filter(Boolean));

        list.appendChild(card);
    });
}

function cpSelectSub(subItem) {
    cpSelectedSub = subItem;
    if (subItem) {
        cpActiveRenewals = [{
            item: subItem.product_name || subItem.item || subItem.name || '',
            start_date: subItem.start_date || '',
            end_date: subItem.end_date || '',
            quantity: subItem.total_quantity || subItem.quantity || 1,
            amount: subItem.total_amount || subItem.amount || 0,
            renewal_id: subItem.name || subItem.renewal_id || ''
        }];
    } else {
        cpActiveRenewals = [];
    }
    cpRenderSelectedSub();
    cpCloseSubModal();

    // Fetch dynamic SLA Tasks / custom query types for selected subscription from Python API
    if (subItem && subItem.name) {
        frappe.call({
            method: "renewal_module.custom_module.page.ticket_list.ticket_list.get_sla_tasks_for_subscription",
            args: { subscription_name: subItem.name },
            callback: function (r) {
                const tasks = r && r.message ? r.message : [];
                if (tasks.length) {
                    const taskSvg = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>';
                    cpActiveQueryTypes = tasks.map(t => ({
                        id: t.task_name || t.name,
                        name: t.task_name || t.name,
                        desc: t.description || '',
                        icon: taskSvg
                    }));
                    cpSelectedQuery = "";
                } else {
                    cpActiveQueryTypes = null;
                    cpSelectedQuery = "";
                }
                cpRenderSelectedQuery();
            }
        });
    }
}

function cpClearSub() {
    cpSelectedSub = null;
    cpActiveRenewals = [];
    cpActiveQueryTypes = null;
    cpRenderSelectedSub();
    cpRenderSelectedQuery();
}

/* ─── CATEGORY / QUERY TYPE MODEL CARD & MODAL ─── */
function cpRenderSelectedQuery() {
    const card = document.getElementById('cp-selected-query-card');
    if (!card) return;
    card.replaceChildren();

    if (cpSelectedDept === "Technical" && !cpSelectedSub && (!cpActiveQueryTypes || !cpActiveQueryTypes.length)) {
        card.className = "selected-model-card placeholder-state";
        card.style.borderStyle = "dashed";
        card.appendChild(cel('div', { class: 'smc-left' }, [
            cel('div', { class: 'smc-ico placeholder', innerHTML: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>' }),
            cel('div', { class: 'smc-info' }, [
                cel('div', { class: 'smc-title placeholder', textContent: "Select Query Type" })
            ])
        ]));
        return;
    }

    if (!cpSelectedQuery) {
        card.className = "selected-model-card placeholder-state";
        card.style.borderStyle = "dashed";
        card.appendChild(cel('div', { class: 'smc-left' }, [
            cel('div', { class: 'smc-ico placeholder', innerHTML: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>' }),
            cel('div', { class: 'smc-info' }, [
                cel('div', { class: 'smc-title placeholder', textContent: "Select Query Type" })
            ])
        ]));
        return;
    }

    card.className = "selected-model-card";
    card.style.borderStyle = "solid";

    const queryList = (cpActiveQueryTypes && cpActiveQueryTypes.length > 0) ? cpActiveQueryTypes : [];
    const defaultSvg = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>';
    const q = (Array.isArray(queryList) ? queryList.find(item => item.id === cpSelectedQuery || item.name === cpSelectedQuery) : null) || {
        id: cpSelectedQuery,
        name: cpSelectedQuery,
        desc: "Category classification for ticket routing",
        icon: defaultSvg
    };

    const leftWrap = cel('div', { class: 'smc-left' }, [
        cel('div', { class: 'smc-ico query-icon', innerHTML: q.icon || defaultSvg }),
        cel('div', { class: 'smc-info' }, [
            cel('div', { class: 'smc-title', textContent: q.name })
        ])
    ]);

    const rightWrap = cel('div', { class: 'smc-radio-chk' }, [
        cel('div', { class: 'smc-radio-dot' })
    ]);

    card.appendChild(leftWrap);
    card.appendChild(rightWrap);
}

function cpOpenQueryModal() {
    const modal = document.getElementById('cp-query-modal');
    if (modal) modal.style.display = 'flex';
    cpRenderQueryModalGrid();
}

function cpCloseQueryModal() {
    const modal = document.getElementById('cp-query-modal');
    if (modal) modal.style.display = 'none';
}

function cpRenderQueryModalGrid() {
    const grid = document.getElementById('cp-query-modal-grid');
    if (!grid) return;
    grid.replaceChildren();

    if (cpSelectedDept === "Technical" && !cpSelectedSub && (!cpActiveQueryTypes || !cpActiveQueryTypes.length)) {
        grid.style.gridTemplateColumns = "1fr";
        grid.appendChild(cel('div', { style: 'padding:32px 16px;text-align:center;color:var(--ink-soft);width:100%;grid-column:1/-1;' }, [
            cel('div', { style: 'font-size:36px;margin-bottom:8px;', textContent: '📋' }),
            cel('div', { style: 'font-weight:700;font-size:15px;color:var(--ink);margin-bottom:4px;', textContent: 'No SLA Tasks Available' }),
            cel('div', { style: 'font-size:13px;', textContent: 'Please select an active subscription / asset first to view and select task options.' })
        ]));
        return;
    }

    if (!cpActiveQueryTypes || cpActiveQueryTypes.length === 0) {
        grid.style.gridTemplateColumns = "1fr";
        grid.appendChild(cel('div', { style: 'padding:32px 16px;text-align:center;color:var(--ink-soft);width:100%;grid-column:1/-1;' }, [
            cel('div', { style: 'font-size:36px;margin-bottom:8px;', textContent: '📋' }),
            cel('div', { style: 'font-weight:700;font-size:15px;color:var(--ink);margin-bottom:4px;', textContent: 'No checklist available' })
        ]));
        return;
    }

    grid.style.gridTemplateColumns = "1fr 1fr";
    const defaultSvg = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>';

    cpActiveQueryTypes.forEach(q => {
        const isSel = cpSelectedQuery === q.id || cpSelectedQuery === q.name;
        const tile = cel('div', {
            class: 'cp-dept-tile model-tile ' + (isSel ? 'selected' : ''),
            onclick: () => cpSelectQuery(q.id || q.name)
        }, [
            cel('div', { class: 'cp-dept-icon model-tile-ico query-icon', innerHTML: q.icon || defaultSvg }),
            cel('div', { class: 'cp-dept-info' }, [
                cel('div', { class: 'model-tile-title', textContent: q.name })
            ]),
            isSel ? cel('div', { class: 'smc-radio-chk', style: 'margin-left:auto;' }, [cel('div', { class: 'smc-radio-dot' })]) : null
        ].filter(Boolean));
        grid.appendChild(tile);
    });
}

function cpSelectQuery(queryId) {
    cpSelectedQuery = queryId;
    cpRenderSelectedQuery();
    cpCloseQueryModal();
}

/* ─── PRIORITY SELECTION ─── */
function cpSelectPriority(prio) {
    cpSelectedPriority = prio;
    const prioInput = document.getElementById('nt-priority');
    if (prioInput) prioInput.value = prio;

    const cards = document.querySelectorAll('#cp-prio-grid .cp-prio-card');
    cards.forEach(card => {
        if (card.getAttribute('data-priority') === prio) {
            card.classList.add('sel');
        } else {
            card.classList.remove('sel');
        }
    });
}

/* ─── WIZARD STEPPER NAVIGATION & DYNAMIC STEP COUNT ─── */
function getActiveStepList() {
    const isExistingAsset = (cpSelectedDept === 'Technical' && cpProductAssocType === 'Existing Asset');
    return isExistingAsset ? [1, 2, 3, 4, 5, 6] : [1, 2, 5, 6];
}

function cpUpdateStepperVisibility(targetStep = 1) {
    const activeSteps = getActiveStepList();

    for (let i = 1; i <= 6; i++) {
        const ind = document.getElementById(`cp-step-indicator-${i}`);
        const div = ind?.nextElementSibling;
        const numEl = ind ? ind.querySelector('.cp-step-num') : null;

        const isStepActiveInFlow = activeSteps.includes(i);

        if (ind) {
            if (!isStepActiveInFlow) {
                ind.style.display = 'none';
            } else {
                ind.style.display = '';
                // Dynamically assign 1-based index (1..4 for 4-step mode, 1..6 for 6-step mode)
                const stepPos = activeSteps.indexOf(i) + 1;
                if (numEl) numEl.textContent = String(stepPos);

                const currentActivePos = activeSteps.indexOf(targetStep);
                const thisPos = activeSteps.indexOf(i);

                if (thisPos < currentActivePos) {
                    ind.className = 'cp-step-item completed';
                } else if (thisPos === currentActivePos) {
                    ind.className = 'cp-step-item active';
                } else {
                    ind.className = 'cp-step-item';
                }
            }
        }

        if (div && div.classList.contains('cp-step-divider')) {
            const thisPos = activeSteps.indexOf(i);
            const isLastActive = (thisPos === activeSteps.length - 1);
            div.style.display = (isStepActiveInFlow && !isLastActive) ? '' : 'none';
        }
    }
}

function cpGoToStep(stepNum) {
    const activeSteps = getActiveStepList();
    if (!activeSteps.includes(stepNum)) {
        return;
    }
    cpUpdateStepperVisibility(stepNum);

    for (let i = 1; i <= 6; i++) {
        const panel = document.getElementById(`cp-step-panel-${i}`);
        if (panel) {
            panel.className = (i === stepNum) ? 'cp-step-panel active' : 'cp-step-panel';
        }
    }
}

function cpGoNextStep(currStep) {
    if (currStep === 1) {
        // Step 1: Customer (auto) & Contact Person
        if (!cpSelectedContacts || cpSelectedContacts.length === 0) {
            alert('Please select or add at least one Contact Person.');
            return;
        }
    } else if (currStep === 2) {
        // Step 2: Subject & Department & Product Association Type
        const subject = document.getElementById('nt-subject')?.value.trim();
        if (!subject) {
            alert('Please enter a Subject for your ticket.');
            document.getElementById('nt-subject')?.focus();
            return;
        }
        if (!cpSelectedDept) {
            alert('Please select a Department.');
            return;
        }
        if (cpSelectedDept === 'Technical' && !cpProductAssocType) {
            alert('Please select a Product Association Type (Existing Asset or New Product).');
            return;
        }
    } else if (currStep === 3) {
        // Step 3: Active Subscription (Mandatory for Existing Asset)
        if (cpSelectedDept === 'Technical' && cpProductAssocType === 'Existing Asset') {
            if (!cpSelectedSub) {
                alert('Please select an Active Subscription / Asset for your existing asset.');
                return;
            }
        }
    } else if (currStep === 4) {
        // Step 4: Query Type (Mandatory for Existing Asset)
        if (cpSelectedDept === 'Technical' && cpProductAssocType === 'Existing Asset') {
            if (!cpSelectedQuery) {
                alert('Please select a Query Type / SLA Task.');
                return;
            }
        }
    } else if (currStep === 5) {
        // Step 5: Description & Attachments
        const desc = document.getElementById('nt-description')?.value.trim();
        if (!desc) {
            alert('Please provide a Detailed Description of your issue.');
            document.getElementById('nt-description')?.focus();
            return;
        }
        cpUpdateSummaryBreakdown();
    }

    const activeSteps = getActiveStepList();
    const currentIndex = activeSteps.indexOf(currStep);
    if (currentIndex >= 0 && currentIndex < activeSteps.length - 1) {
        cpGoToStep(activeSteps[currentIndex + 1]);
    }
}

function cpGoPrevStep(currStep) {
    const activeSteps = getActiveStepList();
    const currentIndex = activeSteps.indexOf(currStep);
    if (currentIndex > 0) {
        cpGoToStep(activeSteps[currentIndex - 1]);
    }
}

function cpUpdateSummaryBreakdown() {
    if (!portalData) return;
    const info = portalData.customer_info || {};

    const sumCust = document.getElementById('cp-sum-customer');
    if (sumCust) sumCust.textContent = info.customer_name || '-';

    const sumSales = document.getElementById('cp-sum-sales-person');
    const sumSalesRow = document.getElementById('cp-sum-sales-row');
    if (sumSales) sumSales.textContent = info.sales_person || '-';
    if (sumSalesRow) sumSalesRow.style.display = info.sales_person ? 'flex' : 'none';

    const sumSubj = document.getElementById('cp-sum-subject');
    if (sumSubj) sumSubj.textContent = document.getElementById('nt-subject')?.value.trim() || '-';

    const sumDesc = document.getElementById('cp-sum-description');
    if (sumDesc) {
        const descVal = document.getElementById('nt-description')?.value.trim();
        sumDesc.textContent = descVal || 'No detailed description provided.';
    }

    let contactStr = '-';
    if (cpSelectedContacts.length > 0) {
        contactStr = cpSelectedContacts.map(c => {
            const firstName = c.first_name || '';
            const lastName = c.last_name || '';
            return `${firstName} ${lastName}`.trim() || c.name || c.email_id;
        }).join(', ');
    } else {
        contactStr = info.user_fullname || info.user_email || '-';
    }
    const sumContact = document.getElementById('cp-sum-contact');
    if (sumContact) sumContact.textContent = contactStr;

    const sumDept = document.getElementById('cp-sum-dept');
    if (sumDept) sumDept.textContent = cpSelectedDept || '-';

    const sumAssoc = document.getElementById('cp-sum-assoc');
    const sumAssocRow = document.getElementById('cp-sum-assoc-row');
    if (sumAssoc) sumAssoc.textContent = cpProductAssocType || '-';
    if (sumAssocRow) sumAssocRow.style.display = (cpSelectedDept === 'Technical') ? 'flex' : 'none';

    const sumSub = document.getElementById('cp-sum-sub');
    const sumSubRow = document.getElementById('cp-sum-sub-row');
    if (sumSub) sumSub.textContent = cpSelectedSub ? (cpSelectedSub.product_name || cpSelectedSub.name) : 'None';
    if (sumSubRow) sumSubRow.style.display = (cpSelectedDept === 'Technical' && cpProductAssocType === 'Existing Asset') ? 'flex' : 'none';

    const sumCat = document.getElementById('cp-sum-category');
    const sumCatRow = document.getElementById('cp-sum-query-row');
    if (sumCat) sumCat.textContent = cpSelectedQuery || '-';
    if (sumCatRow) sumCatRow.style.display = (cpSelectedDept === 'Technical' && cpProductAssocType === 'Existing Asset') ? 'flex' : 'none';

    const sumFilesCount = document.getElementById('cp-sum-files-count');
    if (sumFilesCount) sumFilesCount.textContent = String(cpUploadedFiles.length);

    const sumFilesWrap = document.getElementById('cp-sum-attachments-list');
    if (sumFilesWrap) {
        sumFilesWrap.replaceChildren();
        if (cpUploadedFiles.length === 0) {
            sumFilesWrap.appendChild(cel('div', { style: 'font-size:12.5px;color:var(--ink-soft);font-style:italic;', textContent: 'No files attached' }));
        } else {
            cpUploadedFiles.forEach(f => {
                sumFilesWrap.appendChild(cel('div', { class: 'cp-rf-item' }, [
                    cel('i', { class: 'ti ti-paperclip' }),
                    document.createTextNode(f.file_name || 'Attached File')
                ]));
            });
        }
    }
}

/* ─── FILE UPLOAD HANDLERS ─── */
function cpHandleFiles(files) {
    if (!files || files.length === 0) return;

    Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onload = function (e) {
            const base64Data = e.target.result;
            frappe.call({
                method: 'customer_portal.api.upload_portal_attachment',
                args: {
                    filename: file.name,
                    filedata: base64Data
                },
                callback: function (r) {
                    if (r.message && r.message.status === 'success') {
                        cpUploadedFiles.push({
                            file_name: file.name,
                            file_url: r.message.file_url
                        });
                        cpRenderAttachmentsList();
                    } else {
                        alert('Failed to upload ' + file.name);
                    }
                }
            });
        };
        reader.readAsDataURL(file);
    });
}

function cpRemoveFile(idx) {
    cpUploadedFiles.splice(idx, 1);
    cpRenderAttachmentsList();
}

function cpRenderAttachmentsList() {
    const wrap = document.getElementById('cp-attachments-list');
    if (!wrap) return;
    wrap.replaceChildren();

    cpUploadedFiles.forEach((file, idx) => {
        const item = cel('div', { class: 'cp-att-item' }, [
            cel('i', { class: 'ti ti-paperclip', style: 'color:var(--blue);' }),
            document.createTextNode(' ' + file.file_name),
            cel('button', {
                type: 'button',
                class: 'cp-att-remove',
                style: 'margin-left:8px;',
                onclick: () => cpRemoveFile(idx)
            }, [
                cel('i', { class: 'ti ti-x' })
            ])
        ]);
        wrap.appendChild(item);
    });
}

/* ─── SUBMIT TICKET API CALL ─── */
function submitTicket() {
    const btn = document.getElementById('cp-submit-btn') || document.getElementById('nt-submit-btn');
    if (btn && btn.disabled) return;

    const subjectEl = document.getElementById('ticket-subject') || document.getElementById('nt-subject');
    const detailsEl = document.getElementById('ticket-details') || document.getElementById('nt-description');

    const subject = subjectEl ? subjectEl.value.trim() : '';
    const details = detailsEl ? detailsEl.value.trim() : '';

    let contactPersonStr = "";
    if (cpSelectedContacts && cpSelectedContacts.length > 0) {
        const c0 = cpSelectedContacts[0];
        contactPersonStr = `${c0.first_name || ''} ${c0.last_name || ''}`.trim() || c0.name || c0.email_id;
    }

    const contactsPayload = cpSelectedContacts.map(c => ({
        user_name: `${c.first_name || ''} ${c.last_name || ''}`.trim() || c.name || c.email_id || "",
        email_id: c.email_id || "",
        mobile_no: c.phone || c.mobile_no || "",
        designation: c.designation || "",
        is_primary: (c.tpoc || c.custom_tpoc || c.is_primary) ? 1 : 0
    }));

    const activeSubStr = cpSelectedSub ? (cpSelectedSub.name || cpSelectedSub.product_name) : "";

    if (!subject || !details) {
        alert("Please fill in both the Subject and Detailed Description of the issue.");
        return;
    }

    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="ti ti-loader spin"></i> Submitting Ticket...';
    }

    const attachmentUrls = cpUploadedFiles.map(f => f.file_url);

    frappe.call({
        method: "customer_portal.api.create_support_ticket",
        args: {
            subject: subject,
            description: details,
            status: "Created",
            priority: cpSelectedPriority,
            category: cpSelectedQuery,
            department: cpSelectedDept,
            product_association_type: cpProductAssocType,
            active_subscription: activeSubStr,
            active_renewals: JSON.stringify(cpActiveRenewals),
            contact_person: contactPersonStr,
            contacts: JSON.stringify(contactsPayload),
            raised_via_channel: "Customer Portal",
            attachments: attachmentUrls
        },
        callback: function (r) {
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = '<i class="ti ti-send"></i> Submit Ticket Now';
            }
            if (r.message && r.message.status === "success") {
                const newTicketId = r.message.name || r.message.ticket_id;

                if (window.frappe) {
                    if (typeof frappe.hide_msgprint === 'function') frappe.hide_msgprint();
                    if (frappe.msgprint_dialog && typeof frappe.msgprint_dialog.hide === 'function') {
                        frappe.msgprint_dialog.hide();
                    }
                }

                if (typeof closeNewTicketModal === 'function') closeNewTicketModal();
                if (typeof cpResetTicketWizard === 'function') cpResetTicketWizard();

                fetchPortalData(function () {
                    if (typeof openTicketDetail === 'function') {
                        const ticketsList = (portalData && portalData.support && portalData.support.tickets) ? portalData.support.tickets : (portalData && portalData.tickets ? portalData.tickets : []);
                        let newTicket = ticketsList.find(t => t.name === newTicketId);
                        if (!newTicket) {
                            newTicket = {
                                name: newTicketId,
                                subject: subject,
                                description: details,
                                status: "Created",
                                priority: cpSelectedPriority,
                                department: cpSelectedDept,
                                creation: new Date().toISOString()
                            };
                        }
                        openTicketDetail(newTicket);
                    } else if (typeof go === 'function') {
                        go('tickets');
                    }
                });
            } else {
                alert("An error occurred while submitting the ticket.");
            }
        },
        error: function () {
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = '<i class="ti ti-send"></i> Submit Ticket Now';
            }
        }
    });
}

function submitNewTicket() {
    submitTicket();
}

// Account Tabs Switcher
function acctTab(tabEl, panelId) {
    document.querySelectorAll('.pf-acct-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.pf-acct-panel').forEach(p => {
        p.classList.remove('active');
        p.style.display = 'none';
    });
    if (tabEl) {
        tabEl.classList.add('active');
    }
    const panel = document.getElementById(panelId);
    if (panel) {
        panel.classList.add('active');
        panel.style.display = 'block';
    }
}

// Account & Contacts Render
function renderAccount() {
    if (!portalData) return;
    const info = portalData.customer_info || {};
    const name = info.customer_name || 'Valued Customer';
    const initial = (info.customer_name || info.user_fullname || name).charAt(0).toUpperCase() || 'C';
    const imgUrl = info.image || info.customer_logo || info.user_image || '';

    const iconCircle = document.getElementById('acct-company-icon-circle');
    if (iconCircle) {
        iconCircle.replaceChildren();
        if (imgUrl && imgUrl.trim()) {
            const imgEl = cel('img', {
                src: imgUrl.trim(),
                alt: name,
                class: 'pf-company-avatar-img',
                onerror: function () {
                    this.replaceWith(cel('span', { class: 'pf-company-initials', id: 'acct-avatar-initial', textContent: initial }));
                }
            });
            iconCircle.appendChild(imgEl);
        } else {
            iconCircle.appendChild(cel('span', { class: 'pf-company-initials', id: 'acct-avatar-initial', textContent: initial }));
        }
    }

    const legalNameEl = document.getElementById('acct-legal-name-val');
    if (legalNameEl) legalNameEl.textContent = info.customer_name || name;

    const gstinEl = document.getElementById('acct-gstin');
    if (gstinEl) gstinEl.textContent = info.gstin || '-';

    renderSupportTeamCards();
    renderAccountAddresses();
    renderAccountContacts();

    // Update Tab Badges
    const addrBadge = document.getElementById('acct-addr-tab-count');
    if (addrBadge) {
        const addrs = portalData.addresses || [];
        const addrCount = addrs.length || (info.billing_address ? 1 : 0);
        addrBadge.textContent = addrCount;
    }

    const contactBadge = document.getElementById('acct-contact-tab-count');
    if (contactBadge) {
        const contacts = portalData.contacts || [];
        contactBadge.textContent = contacts.length;
    }
}

function renderSupportTeamCards() {
    const container = document.getElementById('acct-team-cards-container');
    if (!container || !portalData) return;
    container.replaceChildren();

    const info = portalData.customer_info || {};

    const teamMembers = [
        {
            role: 'ACCOUNT MANAGER',
            name: info.sales_person || '',
            image: info.sales_person_image || '',
            email: info.sales_person_email || '',
            bgColor: '#2563eb'
        },
        {
            role: 'TECHNICAL LEAD',
            name: info.technical_lead || '',
            image: info.technical_lead_image || '',
            email: info.technical_lead_email || '',
            bgColor: '#9333ea'
        },
        {
            role: 'BILLING SUPPORT',
            name: info.billing_contact || '',
            image: info.billing_contact_image || '',
            email: info.billing_contact_email || '',
            bgColor: '#059669'
        }
    ];

    teamMembers.forEach(m => {
        const rawName = (m.name && m.name.trim()) ? m.name.trim() : 'Unassigned';
        const initial = rawName !== 'Unassigned' ? rawName.charAt(0).toUpperCase() : '?';

        let avatarEl;
        if (m.image && m.image.trim() && rawName !== 'Unassigned') {
            avatarEl = cel('div', { class: 'pf-support-avatar', style: 'overflow:hidden;padding:0;background:transparent;' });
            const imgEl = cel('img', {
                src: m.image.trim(),
                alt: rawName,
                class: 'pf-company-avatar-img',
                onerror: function () {
                    this.replaceWith(document.createTextNode(initial));
                    avatarEl.style.background = m.bgColor;
                    avatarEl.style.padding = '';
                }
            });
            avatarEl.appendChild(imgEl);
        } else {
            const bg = rawName === 'Unassigned' ? '#94a3b8' : m.bgColor;
            avatarEl = cel('div', { class: 'pf-support-avatar', style: `background:${bg};` }, [
                document.createTextNode(initial)
            ]);
        }

        const card = cel('div', { class: 'pf-support-team-card' }, [
            avatarEl,
            cel('div', { class: 'pf-support-team-info' }, [
                cel('div', { class: 'pf-support-role-label', textContent: m.role }),
                cel('div', { class: 'pf-support-person-name', textContent: rawName }),
                (m.email && m.email.trim() && rawName !== 'Unassigned') ? cel('div', { class: 'pf-support-person-email' }, [
                    cel('i', { class: 'ti ti-mail', style: 'font-size:12px;margin-right:4px;color:var(--blue);' }),
                    cel('span', { textContent: m.email.trim() })
                ]) : null
            ].filter(Boolean))
        ]);

        container.appendChild(card);
    });
}

function triggerCompanyLogoUpload() {
    const fileInput = document.getElementById('pf-company-logo-input');
    if (fileInput) fileInput.click();
}

function uploadCompanyLogo(input) {
    if (!input || !input.files || !input.files[0]) return;
    const file = input.files[0];

    const formData = new FormData();
    formData.append("file", file);
    formData.append("cmd", "customer_portal.api.upload_company_logo");

    const iconCircle = document.getElementById('acct-company-icon-circle');
    if (iconCircle) {
        iconCircle.innerHTML = '<i class="ti ti-loader spin" style="font-size:20px;color:#16a34a;"></i>';
    }

    fetch('/api/method/customer_portal.api.upload_company_logo', {
        method: 'POST',
        headers: {
            'X-Frappe-CSRF-Token': window.csrf_token || (window.frappe && window.frappe.csrf_token) || ''
        },
        body: formData
    })
        .then(res => res.json())
        .then(data => {
            if (data.message && data.message.file_url) {
                const newUrl = data.message.file_url;
                if (portalData && portalData.customer_info) {
                    portalData.customer_info.image = newUrl;
                }
                renderAccount();
            } else {
                alert(data.exception || "Failed to upload logo.");
                renderAccount();
            }
        })
        .catch(() => {
            alert("Error uploading company logo file.");
            renderAccount();
        });
}

function renderAccountContacts() {
    const container = document.getElementById('acct-contacts-container');
    if (!container || !portalData) return;
    container.replaceChildren();

    const contacts = portalData.contacts || [];
    if (contacts.length === 0) {
        container.appendChild(cel('div', { style: 'color:var(--ink-soft);font-size:13px;padding:12px 0;' }, ['No team contacts registered for this account.']));
        return;
    }

    const gridDiv = cel('div', { class: 'pf-contact-cards-grid' });
    const avatarColors = ['#2563eb', '#9333ea', '#059669', '#ea580c', '#0891b2', '#d97706'];

    contacts.forEach((c, idx) => {
        const fullName = `${c.first_name || ''} ${c.last_name || ''}`.trim() || c.name || 'Contact';
        const initial = fullName.charAt(0).toUpperCase() || 'C';
        const isTpoc = Boolean(c.tpoc || c.custom_tpoc);
        const isPrimary = Boolean(c.is_primary_contact || c.is_primary);
        const designationText = c.designation || 'Team Contact';
        const emailText = c.email_id || '-';
        const phoneText = c.mobile_no || c.phone || '-';

        const contactImg = c.image || c.user_image || c.custom_image || c.contact_image || c.avatar || c.photo || '';
        const avatarColor = avatarColors[idx % avatarColors.length];

        let avatarEl;
        if (contactImg && contactImg.trim()) {
            avatarEl = cel('div', { class: 'pf-contact-avatar', style: 'overflow:hidden;padding:0;background:transparent;' });
            const imgEl = cel('img', {
                src: contactImg.trim(),
                alt: fullName,
                class: 'pf-company-avatar-img',
                onerror: function () {
                    this.replaceWith(document.createTextNode(initial));
                    avatarEl.style.background = avatarColor;
                    avatarEl.style.padding = '';
                }
            });
            avatarEl.appendChild(imgEl);
        } else {
            avatarEl = cel('div', { class: 'pf-contact-avatar', style: `background:${avatarColor};` }, [document.createTextNode(initial)]);
        }

        const card = cel('div', { class: 'pf-contact-card' }, [
            // Top Avatar & Title Row
            cel('div', { class: 'pf-contact-card-top' }, [
                cel('div', { class: 'pf-contact-avatar-box' }, [
                    avatarEl,
                    cel('div', { class: 'pf-contact-info-head' }, [
                        cel('div', { class: 'pf-contact-name', textContent: fullName }),
                        cel('div', { class: 'pf-contact-designation', textContent: designationText })
                    ])
                ]),
                // Badges
                cel('div', { class: 'pf-contact-badges' }, [
                    isPrimary ? cel('span', { class: 'pill green', style: 'font-size:10.5px;padding:2px 8px;font-weight:700;', textContent: 'Primary' }) : null,
                    isTpoc ? cel('span', { class: 'tpoc-badge-green', style: 'font-size:10.5px;padding:3px 8px;font-weight:700;', textContent: '✓ TPOC' }) : null
                ].filter(Boolean))
            ]),

            // Details List (Email & Phone)
            cel('div', { class: 'pf-contact-details-list' }, [
                cel('div', { class: 'pf-contact-detail-item' }, [
                    cel('i', { class: 'ti ti-mail' }),
                    cel('span', { textContent: emailText })
                ]),
                cel('div', { class: 'pf-contact-detail-item' }, [
                    cel('i', { class: 'ti ti-phone' }),
                    cel('span', { textContent: phoneText })
                ])
            ])
        ]);

        gridDiv.appendChild(card);
    });

    container.appendChild(gridDiv);
}

function renderAccountAddresses() {
    const container = document.getElementById('acct-addresses-container');
    if (!container || !portalData) return;
    container.replaceChildren();

    const addresses = portalData.addresses || [];
    const info = portalData.customer_info || {};

    let billingList = addresses.filter(a => a.address_type === "Billing" || a.is_primary_address);
    let shippingList = addresses.filter(a => a.address_type === "Shipping" || a.is_shipping_address);
    let otherList = addresses.filter(a => a.address_type !== "Billing" && !a.is_primary_address && a.address_type !== "Shipping" && !a.is_shipping_address);

    if (billingList.length === 0) {
        if (addresses.length > 0) {
            billingList = [addresses[0]];
        } else if (info.billing_address) {
            billingList = [{
                address_title: info.customer_name || 'Primary Billing Location',
                address_type: 'Billing',
                address_line1: info.billing_address,
                gstin: info.gstin || '',
                is_primary_address: 1
            }];
        }
    }

    let isShippingSameAsBilling = false;
    if (shippingList.length === 0) {
        if (info.shipping_address && info.shipping_address !== info.billing_address) {
            shippingList = [{
                address_title: info.customer_name || 'Shipping Location',
                address_type: 'Shipping',
                address_line1: info.shipping_address,
                is_shipping_address: 1
            }];
        } else if (billingList.length > 0) {
            shippingList = [billingList[0]];
            isShippingSameAsBilling = true;
        }
    }

    function createAddressCard(addr, type, isSameAsBilling = false) {
        const isBilling = type === 'Billing';
        const cardClass = isBilling ? 'billing-card' : 'shipping-card';
        const iconClass = isBilling ? 'billing' : 'shipping';
        const iconName = isBilling ? 'ti ti-file-text' : 'ti ti-truck';
        const typeLabel = isBilling ? 'Billing Address' : 'Shipping Address';
        const titleText = addr.address_title || info.customer_name || `${type} Location`;

        const rawLines = [
            addr.address_line1,
            addr.address_line2,
            [addr.city, addr.state, addr.pincode].filter(Boolean).join(', '),
            addr.country
        ].filter(Boolean);

        let linesToRender = rawLines;
        if (rawLines.length === 0 && addr.address_line1) {
            linesToRender = [addr.address_line1];
        }

        const topBadge = isSameAsBilling ?
            cel('span', { class: 'pf-badge-primary shipping', textContent: 'SAME AS BILLING' }) :
            (isBilling ? cel('span', { class: 'pf-badge-primary billing', textContent: 'PRIMARY' }) :
                cel('span', { class: 'pf-badge-primary shipping', textContent: 'SHIPPING' }));

        const gstinVal = addr.gstin || (isBilling ? info.gstin : '');

        return cel('div', { class: `pf-card-address-v2 ${cardClass}` }, [
            cel('div', { class: 'pf-card-address-top' }, [
                cel('div', { class: 'pf-card-address-type-badge' }, [
                    cel('div', { class: `pf-type-icon-box ${iconClass}` }, [
                        cel('i', { class: iconName })
                    ]),
                    cel('span', { class: `pf-type-label ${iconClass}`, textContent: typeLabel })
                ]),
                cel('div', { class: 'pf-card-address-top-right' }, [
                    topBadge
                ])
            ]),

            cel('div', { class: 'pf-card-address-company', textContent: titleText }),

            cel('div', { class: 'pf-card-address-location' }, [
                cel('i', { class: 'ti ti-map-pin' }),
                cel('div', { class: 'pf-card-address-lines' },
                    linesToRender.length > 0 ?
                        linesToRender.map(l => cel('div', { textContent: l })) :
                        [cel('div', { style: 'color:var(--ink-soft);', textContent: 'No address details provided.' })]
                )
            ]),

            gstinVal ? cel('div', { class: `pf-gstin-pill-tag ${iconClass}` }, [
                cel('i', { class: 'ti ti-receipt-tax' }),
                document.createTextNode(`GSTIN: ${gstinVal}`)
            ]) : null
        ]);
    }

    const gridDiv = cel('div', { class: 'pf-address-grid-v2' });

    billingList.forEach(addr => {
        gridDiv.appendChild(createAddressCard(addr, 'Billing', false));
    });

    shippingList.forEach(addr => {
        gridDiv.appendChild(createAddressCard(addr, 'Shipping', isShippingSameAsBilling));
    });

    container.appendChild(gridDiv);

    if (otherList.length > 0) {
        const otherGrid = cel('div', { class: 'pf-address-grid-v2', style: 'margin-top:16px;' });
        otherList.forEach(addr => {
            otherGrid.appendChild(createAddressCard(addr, 'Other', false));
        });
        container.appendChild(otherGrid);
    }
}

// Pagination and Filtering Handlers
function getPageSize(pageName) {
    const possibleIds = [
        `${pageName}-page-size`,
        `${pageName.replace(/s$/, '')}-page-size`,
        pageName === 'tickets' ? 'support-page-size' : '',
        pageName === 'support' ? 'tickets-page-size' : '',
        pageName === 'renewals' ? 'renewal-page-size' : '',
        pageName === 'invoices' ? 'invoice-page-size' : ''
    ].filter(Boolean);

    for (const id of possibleIds) {
        const el = document.getElementById(id);
        if (el && el.value) {
            return parseInt(el.value, 10) || 10;
        }
    }
    return 10;
}

function updateQueuePaginationUI(pageName, totalCount) {
    const state = listState[pageName];
    if (!state) return;

    const limit = state.limit || 10;
    const countInfo = document.getElementById(`${pageName}-count-info`);
    if (countInfo) {
        countInfo.textContent = `${Math.min(limit, totalCount)} of ${totalCount}`;
    }

    const loadMoreBtn = document.getElementById(`${pageName}-load-more`);
    if (loadMoreBtn) {
        loadMoreBtn.disabled = limit >= totalCount;
    }

    const btnsContainer = document.getElementById(`${pageName}-page-size-btns`);
    if (btnsContainer) {
        btnsContainer.querySelectorAll('.btn-paging').forEach(btn => {
            const btnVal = parseInt(btn.getAttribute('data-value'), 10);
            if (btnVal === limit) {
                btn.classList.add('active-pagination');
            } else {
                btn.classList.remove('active-pagination');
            }
        });
    }
}

function loadMore(pageName) {
    if (listState[pageName]) {
        const curLimit = listState[pageName].limit || 10;
        listState[pageName].limit += curLimit;
        if (pageName === 'renewals') renderRenewals();
        else if (pageName === 'invoices') renderInvoices();
        else if (pageName === 'tickets') renderTickets();
    }
}

function changePageSize(pageName, val) {
    if (listState[pageName]) {
        const numVal = parseInt(val, 10) || 10;
        listState[pageName].limit = numVal;
        if (pageName === 'renewals') renderRenewals();
        else if (pageName === 'invoices') renderInvoices();
        else if (pageName === 'tickets') renderTickets();
    }
}

// Setup Event Listeners for Search Inputs, Status Tabs, & Document Clicks
function setupEventListeners() {
    // Search Inputs
    const renSearch = document.getElementById('renewals-search-input');
    if (renSearch) {
        renSearch.addEventListener('input', function () {
            listState.renewals.search = this.value;
            listState.renewals.limit = getPageSize('renewals');
            renderRenewals();
        });
    }

    const invSearch = document.getElementById('invoices-search-input');
    if (invSearch) {
        invSearch.addEventListener('input', function () {
            listState.invoices.search = this.value;
            listState.invoices.limit = getPageSize('invoices');
            renderInvoices();
        });
    }

    const tktSearch = document.getElementById('tickets-search-input');
    if (tktSearch) {
        tktSearch.addEventListener('input', function () {
            listState.tickets.search = this.value;
            listState.tickets.limit = getPageSize('tickets');
            renderTickets();
        });
    }

    const globalSearch = document.getElementById('global-search-input');
    if (globalSearch) {
        globalSearch.addEventListener('input', function () {
            const val = this.value;
            listState.renewals.search = val;
            listState.invoices.search = val;
            listState.tickets.search = val;
            listState.renewals.limit = getPageSize('renewals');
            listState.invoices.limit = getPageSize('invoices');
            listState.tickets.limit = getPageSize('tickets');
            renderRenewals();
            renderInvoices();
            renderTickets();
        });
    }

    // Status Tab Row Listeners
    ['renewals', 'invoices', 'tickets'].forEach(pageName => {
        const tabsRow = document.getElementById(`${pageName}-tabs-row`);
        if (tabsRow) {
            tabsRow.querySelectorAll('.tab').forEach(tab => {
                tab.addEventListener('click', function () {
                    tabsRow.querySelectorAll('.tab').forEach(t => t.classList.remove('on'));
                    this.classList.add('on');
                    const status = this.getAttribute('data-status') || 'all';
                    listState[pageName].status = status;
                    listState[pageName].limit = getPageSize(pageName);
                    if (pageName === 'renewals') renderRenewals();
                    else if (pageName === 'invoices') renderInvoices();
                    else if (pageName === 'tickets') renderTickets();
                });
            });
        }
    });

    // Dismiss account dropdown when clicking outside
    document.addEventListener('click', function (e) {
        const isClickInside = e.target.closest('.pf-account-dropdown') || e.target.closest('#topbar-avatar') || e.target.closest('#side-acct-btn');
        if (!isClickInside) {
            closeAccountDropdown();
        }
    });

    // Close PDF preview modal or any popup modal on backdrop click
    document.querySelectorAll('.cp-modal-backdrop').forEach(modal => {
        modal.addEventListener('click', function (e) {
            if (e.target === this) {
                closeAllModals();
            }
        });
    });

    // Window history listeners for Back / Forward / Route restoration
    window.addEventListener('popstate', () => handleUrlRoute());
    window.addEventListener('hashchange', () => handleUrlRoute());
}

// Auto-initialize on page load
document.addEventListener('DOMContentLoaded', function () {
    setupEventListeners();
    fetchPortalData();
});
