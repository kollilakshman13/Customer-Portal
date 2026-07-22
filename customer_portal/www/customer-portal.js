// Mobile Sidebar Toggle
function toggleMobileSidebar(show) {
    const sidebar = document.querySelector('.pf-side');
    const backdrop = document.getElementById('sidebar-backdrop');
    if (!sidebar || !backdrop) return;
    
    if (show === undefined) {
        show = !sidebar.classList.contains('open');
    }
    if (show) {
        sidebar.classList.add('open');
        backdrop.classList.add('on');
    } else {
        sidebar.classList.remove('open');
        backdrop.classList.remove('on');
    }
}

// Tab switching logic
function pfGo(name, el) {
    document.querySelectorAll('.pf-page').forEach(p => p.classList.remove('on'));
    const targetPage = document.getElementById('page-' + name);
    if (targetPage) {
        targetPage.classList.add('on');
    }
    document.querySelectorAll('.pf-nav a').forEach(a => a.classList.remove('on'));
    if (el) {
        el.classList.add('on');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Automatically close mobile sidebar menu drawer on navigation
    toggleMobileSidebar(false);
}

function pfGoByName(name) {
    const link = Array.from(document.querySelectorAll('.pf-nav a')).find(a => a.getAttribute('onclick').includes("'" + name + "'"));
    pfGo(name, link);
}

// Helper to construct secure elements using browser document APIs (No innerHTML, strictly XSS safe)
function cel(tag, attrs = {}, children = []) {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
        if (k === 'textContent' || k === 'innerText') {
            el.textContent = v;
        } else if (k.startsWith('on') && typeof v === 'function') {
            const eventName = k.substring(2).toLowerCase();
            el.addEventListener(eventName, v);
        } else {
            el.setAttribute(k, v);
        }
    }
    for (const child of children) {
        if (typeof child === 'string') {
            el.appendChild(document.createTextNode(child));
        } else if (child) {
            el.appendChild(child);
        }
    }
    return el;
}

// Format helpers
function formatCurrency(val) {
    if (val === undefined || val === null) return '-';
    return '₹' + Number(val).toLocaleString('en-IN', { maximumFractionDigits: 0 });
}

// Safe date formatter
function formatDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

function dateDiffInDays(a, b) {
    const _MS_PER_DAY = 1000 * 60 * 60 * 24;
    const utc1 = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
    const utc2 = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
    return Math.floor((utc2 - utc1) / _MS_PER_DAY);
}

// State & Rendering
let portalData = null;

function fetchPortalData() {
    frappe.call({
        method: "customer_portal.api.get_portal_data",
        callback: function(r) {
            if (r.message) {
                if (r.message.error) {
                    console.error(r.message.error);
                    alert(r.message.error);
                    return;
                }
                portalData = r.message;
                renderPortal();
            }
        }
    });
}

function renderEmptyState(message) {
    return cel('div', { class: 'pf-empty' }, [
        cel('i', { class: 'ti ti-info-circle' }),
        cel('div', { class: 't', textContent: message })
    ]);
}

function renderInvoiceRow(inv) {
    const statusClass = getInvoiceStatusClass(inv.status);
    return cel('div', { class: 'pf-row' }, [
        cel('div', { class: 'pf-row-icon' }, [cel('i', { class: 'ti ti-file-invoice' })]),
        cel('div', { class: 'pf-row-body' }, [
            cel('div', { class: 'pf-row-title', textContent: inv.name }),
            cel('div', { class: 'pf-row-sub', textContent: `Issued ${formatDate(inv.posting_date)} · Due ${formatDate(inv.due_date)}` })
        ]),
        cel('div', { class: 'pf-row-right' }, [
            cel('div', { class: 'pf-row-amt', textContent: formatCurrency(inv.grand_total) }),
            cel('span', { class: `pf-pill ${statusClass}`, textContent: inv.status })
        ])
    ]);
}

function getInvoiceStatusClass(status) {
    if (!status) return 'closed';
    status = status.toLowerCase();
    if (status === 'paid') return 'paid';
    if (status === 'overdue') return 'overdue';
    if (status === 'unpaid') return 'due';
    return 'closed';
}

function renderTicketRow(ticket) {
    const statusClass = getTicketStatusClass(ticket.status);
    return cel('div', { class: 'pf-row' }, [
        cel('div', { class: 'pf-row-icon' }, [cel('i', { class: 'ti ti-headset' })]),
        cel('div', { class: 'pf-row-body' }, [
            cel('div', { class: 'pf-row-title', textContent: ticket.subject }),
            cel('div', { class: 'pf-row-sub', textContent: `Ticket #${ticket.name} · Raised by ${ticket.raised_by || 'system'}` })
        ]),
        cel('div', { class: 'pf-row-right' }, [
            cel('span', { class: `pf-pill ${statusClass}`, textContent: ticket.status })
        ])
    ]);
}

function getTicketStatusClass(status) {
    if (!status) return 'closed';
    status = status.toLowerCase();
    if (status === 'open' || status === 'assigned') return 'open';
    if (status === 'closed' || status === 'resolved') return 'closed';
    return 'due';
}

function renderRenewalRow(ren) {
    const statusClass = getRenewalStatusClass(ren.status);
    return cel('div', { class: 'pf-row' }, [
        cel('div', { class: 'pf-row-icon' }, [cel('i', { class: 'ti ti-refresh' })]),
        cel('div', { class: 'pf-row-body' }, [
            cel('div', { class: 'pf-row-title', textContent: `${ren.product_name} — ${ren.total_quantity} seats` }),
            cel('div', { class: 'pf-row-sub', textContent: `Renews ${formatDate(ren.end_date)} · Invoice ${ren.invoice_no || '-'}` })
        ]),
        cel('div', { class: 'pf-row-right' }, [
            cel('div', { class: 'pf-row-amt', textContent: formatCurrency(ren.total_amount) }),
            cel('span', { class: `pf-pill ${statusClass}`, textContent: ren.status })
        ])
    ]);
}

function getRenewalStatusClass(status) {
    if (!status) return 'closed';
    status = status.toLowerCase();
    if (status === 'active') return 'paid';
    if (status === 'draft') return 'due';
    if (status === 'lost') return 'overdue';
    return 'closed';
}

function renderContactRow(contact) {
    const fullName = `${contact.first_name} ${contact.last_name || ''}`.trim();
    const designation = contact.designation || 'Contact';
    const detailText = `${contact.email_id || '-'} · ${contact.mobile_no || contact.phone || '-'}`;
    
    return cel('div', { class: 'pf-row' }, [
        cel('div', { class: 'pf-row-icon' }, [cel('i', { class: 'ti ti-user' })]),
        cel('div', { class: 'pf-row-body' }, [
            cel('div', { class: 'pf-row-title', textContent: fullName }),
            cel('div', { class: 'pf-row-sub', textContent: `${detailText} · ${designation}` })
        ]),
        contact.is_primary_contact ? cel('span', { class: 'pf-pill open', textContent: 'Primary' }) : null
    ]);
}

function renderOrderSection(order) {
    const steps = ["Placed", "Confirmed", "Processing", "Shipped", "Delivered"];
    let currentStepIndex = 1;
    if (order.status === "To Deliver and Bill" || order.status === "To Deliver") {
        currentStepIndex = 2;
    } else if (order.delivery_status === "Partially Delivered") {
        currentStepIndex = 3;
    } else if (order.delivery_status === "Fully Delivered") {
        currentStepIndex = 4;
    } else if (order.status === "Completed") {
        currentStepIndex = 5;
    }
    
    const trackDiv = cel('div', { class: 'pf-track' });
    steps.forEach((step, idx) => {
        const stepClass = idx < currentStepIndex ? "pf-step done" : (idx === currentStepIndex ? "pf-step now" : "pf-step");
        const dotContent = idx < currentStepIndex ? cel('i', { class: 'ti ti-check' }) : document.createTextNode(String(idx + 1));
        
        trackDiv.appendChild(cel('div', { class: stepClass }, [
            cel('div', { class: 'pf-dot' }, [dotContent]),
            cel('div', { class: 'l', textContent: step })
        ]));
    });

    const estText = order.status === "Completed" ? `Delivered ${formatDate(order.delivery_date || order.modified)}` : `Expected to ship by ${formatDate(order.delivery_date) || 'soon'}`;
    const statusPill = order.status === "Completed" ? cel('span', { class: 'pf-pill paid', textContent: 'Delivered' }) : cel('span', { class: 'pf-pill open', textContent: order.status });

    return cel('div', { class: 'pf-section' }, [
        cel('div', { class: 'pf-section-head' }, [
            cel('h3', { textContent: `Order #${order.name}` }),
            statusPill
        ]),
        trackDiv,
        cel('div', { style: 'padding:6px 18px 16px;font-size:12px;color:var(--ink-soft);', textContent: estText })
    ]);
}

const paginationState = {
    invoices: { limit: 10, data: [], renderFn: renderInvoicesListItems, containerId: 'invoices-list', sizeId: 'invoice-page-size', countId: 'invoice-record-count', btnId: 'invoice-load-more' },
    renewals: { limit: 10, data: [], renderFn: renderRenewalsListItems, containerId: 'renewals-list', sizeId: 'renewal-page-size', countId: 'renewal-record-count', btnId: 'renewal-load-more' },
    orders: { limit: 10, data: [], renderFn: renderOrdersListItems, containerId: 'orders-list', sizeId: 'order-page-size', countId: 'order-record-count', btnId: 'order-load-more' },
    support: { limit: 10, data: [], renderFn: renderTicketsListItems, containerId: 'support-tickets-list', sizeId: 'support-page-size', countId: 'support-record-count', btnId: 'support-load-more' },
    contacts: { limit: 10, data: [], renderFn: renderContactsListItems, containerId: 'contacts-list', sizeId: 'contact-page-size', countId: 'contact-record-count', btnId: 'contact-load-more' }
};

function renderInvoicesListItems(inv) {
    const row = renderInvoiceRow(inv);
    const rightBlock = row.querySelector('.pf-row-right');
    if (rightBlock) {
        const btn = cel('button', { 
            class: 'pf-btn sm', 
            onclick: (e) => {
                e.stopPropagation();
                window.open(`/api/method/frappe.utils.print_format.download_pdf?doctype=Sales+Invoice&name=${encodeURIComponent(inv.name)}&format=Standard`, '_blank');
            }
        }, [cel('i', { class: 'ti ti-download' })]);
        rightBlock.appendChild(btn);
    }
    return row;
}

function renderRenewalsListItems(ren) {
    return renderRenewalRow(ren);
}

function renderOrdersListItems(order) {
    return renderOrderSection(order);
}

function renderTicketsListItems(ticket) {
    return renderTicketRow(ticket);
}

function renderContactsListItems(contact) {
    return renderContactRow(contact);
}

function changePageSize(pageName) {
    const state = paginationState[pageName];
    if (!state) return;
    const sizeSelect = document.getElementById(state.sizeId);
    state.limit = sizeSelect ? parseInt(sizeSelect.value, 10) : 10;
    renderPaginatedList(pageName);
}

function loadMoreRecords(pageName) {
    const state = paginationState[pageName];
    if (!state) return;
    const sizeSelect = document.getElementById(state.sizeId);
    const pageSize = sizeSelect ? parseInt(sizeSelect.value, 10) : 10;
    state.limit += pageSize;
    renderPaginatedList(pageName);
}

function renderPaginatedList(pageName) {
    const state = paginationState[pageName];
    if (!state) return;
    
    const listDiv = document.getElementById(state.containerId);
    if (!listDiv) return;
    listDiv.replaceChildren();
    
    const totalCount = state.data.length;
    const paginatedData = state.data.slice(0, state.limit);
    
    if (paginatedData.length === 0) {
        let emptyMsg = "No records found.";
        if (pageName === 'invoices') emptyMsg = "No invoices found.";
        else if (pageName === 'renewals') emptyMsg = "No renewals found.";
        else if (pageName === 'orders') emptyMsg = "No orders found.";
        else if (pageName === 'support') emptyMsg = "No open support tickets.";
        else if (pageName === 'contacts') emptyMsg = "No contacts found.";
        listDiv.appendChild(renderEmptyState(emptyMsg));
    } else {
        paginatedData.forEach(item => {
            const row = state.renderFn(item);
            listDiv.appendChild(row);
        });
    }
    
    // Update counts and button visibility
    const recordCountSpan = document.getElementById(state.countId);
    const loadMoreBtn = document.getElementById(state.btnId);
    if (recordCountSpan && loadMoreBtn) {
        const showingCount = Math.min(state.limit, totalCount);
        recordCountSpan.textContent = `Showing ${showingCount} of ${totalCount}`;
        if (showingCount >= totalCount) {
            loadMoreBtn.style.display = 'none';
        } else {
            loadMoreBtn.style.display = 'inline-block';
        }
    }
}

function filterInvoices(resetLimit = true) {
    if (!portalData) return;
    
    const state = paginationState['invoices'];
    if (resetLimit) {
        const sizeSelect = document.getElementById(state.sizeId);
        state.limit = sizeSelect ? parseInt(sizeSelect.value, 10) : 10;
    }
    
    const query = document.getElementById('invoice-search-input').value.toLowerCase().trim();
    const status = document.getElementById('invoice-status-filter').value;
    
    let filtered = portalData.invoices || [];
    if (status !== 'All') {
        filtered = filtered.filter(inv => inv.status === status);
    }
    if (query) {
        filtered = filtered.filter(inv => inv.name.toLowerCase().includes(query));
    }
    
    state.data = filtered;
    renderPaginatedList('invoices');
}

function submitTicket() {
    const subject = document.getElementById('ticket-subject').value.trim();
    const details = document.getElementById('ticket-details').value.trim();
    const category = document.getElementById('ticket-category').value;
    const priority = document.getElementById('ticket-priority').value;

    if (!subject || !details) {
        alert("Please fill in both the Subject and Details of the issue.");
        return;
    }

    frappe.call({
        method: "customer_portal.api.create_support_ticket",
        args: {
            subject: subject,
            description: details,
            priority: priority,
            category: category
        },
        callback: function(r) {
            if (r.message && r.message.status === "success") {
                alert("Ticket successfully submitted! Ticket ID: " + r.message.name);
                document.getElementById('ticket-subject').value = '';
                document.getElementById('ticket-details').value = '';
                fetchPortalData();
            } else {
                alert("An error occurred while submitting the ticket.");
            }
        }
    });
}

function saveSettings() {
    const legalName = document.getElementById('settings-legal-name').value.trim();
    const gstin = document.getElementById('settings-gstin').value.trim();
    const address = document.getElementById('settings-address').value.trim();

    if (!legalName || !address) {
        alert("Please enter both the Legal name and Billing address.");
        return;
    }

    frappe.call({
        method: "customer_portal.api.save_account_settings",
        args: {
            legal_name: legalName,
            gstin: gstin,
            billing_address: address
        },
        callback: function(r) {
            if (r.message && r.message.status === "success") {
                alert("Settings successfully saved!");
                fetchPortalData();
            } else {
                alert("An error occurred while saving settings.");
            }
        }
    });
}

function renderPortal() {
    const companyName = portalData.customer_info.customer_name;
    // userEmail will be populated dynamically or loaded from local global
    const emailToUse = window.userEmail || '';
    
    document.getElementById('sidebar-company').textContent = companyName;
    document.getElementById('sidebar-user').textContent = emailToUse;
    
    const avatarWord = companyName.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
    document.getElementById('sidebar-avatar').textContent = avatarWord;

    const primaryContact = portalData.contacts.find(c => c.is_primary_contact) || portalData.contacts[0];
    const contactFirstName = primaryContact ? primaryContact.first_name : "User";
    document.getElementById('overview-username').textContent = contactFirstName;

    document.getElementById('stat-active-licenses').textContent = portalData.stats.active_licenses;
    document.getElementById('stat-open-tickets').textContent = portalData.stats.open_tickets;
    
    const nextDays = portalData.stats.next_renewal_days;
    document.getElementById('stat-next-renewal').textContent = nextDays !== null ? (nextDays + ' days') : '-';
    
    const openInvCount = portalData.stats.open_invoices_count;
    const openInvAmt = portalData.stats.open_invoices_amount;
    const openAmtStr = formatCurrency(openInvAmt);
    document.getElementById('stat-open-invoices').replaceChildren(
        document.createTextNode(openAmtStr + ' '),
        cel('small', { id: 'stat-open-invoices-sub', textContent: `· ${openInvCount} due` })
    );

    const latestInv = portalData.invoices.length ? portalData.invoices[0].name : "None";
    document.getElementById('qa-invoice-desc').textContent = `Latest: ${latestInv}`;
    document.getElementById('qa-contact-desc').textContent = `${portalData.contacts.length} on this account`;

    const upcomingRenewals = portalData.renewals.filter(r => r.status === "Active" && r.end_date);
    if (upcomingRenewals.length > 0) {
        const bannerRen = upcomingRenewals[0];
        const nextRenDays = dateDiffInDays(new Date(), new Date(bannerRen.end_date));
        if (nextRenDays >= 0 && nextRenDays <= 60) {
            document.getElementById('overview-banner-title').textContent = `Your ${bannerRen.product_name} license renews in ${nextRenDays} days`;
            document.getElementById('overview-banner-subtitle').textContent = `${bannerRen.total_quantity} seats · ${formatCurrency(bannerRen.total_amount)} · Auto-renew is on`;
            document.getElementById('overview-banner').style.display = 'flex';
        } else {
            document.getElementById('overview-banner').style.display = 'none';
        }
    } else {
        document.getElementById('overview-banner').style.display = 'none';
    }

    const activeOrder = portalData.orders.find(o => o.status !== "Completed" && o.status !== "Cancelled");
    if (activeOrder) {
        document.getElementById('overview-order-title').textContent = `Order ${activeOrder.name} — ${activeOrder.status}`;
        const trackDiv = document.getElementById('overview-order-track');
        trackDiv.replaceChildren();
        
        const steps = ["Placed", "Confirmed", "Processing", "Shipped", "Delivered"];
        let currentStepIndex = 1;
        if (activeOrder.status === "To Deliver and Bill" || activeOrder.status === "To Deliver") {
            currentStepIndex = 2;
        } else if (activeOrder.delivery_status === "Partially Delivered") {
            currentStepIndex = 3;
        } else if (activeOrder.delivery_status === "Fully Delivered") {
            currentStepIndex = 4;
        }
        
        steps.forEach((step, idx) => {
            const stepClass = idx < currentStepIndex ? "pf-step done" : (idx === currentStepIndex ? "pf-step now" : "pf-step");
            const dotContent = idx < currentStepIndex ? cel('i', { class: 'ti ti-check' }) : document.createTextNode(String(idx + 1));
            
            trackDiv.appendChild(cel('div', { class: stepClass }, [
                cel('div', { class: 'pf-dot' }, [dotContent]),
                cel('div', { class: 'l', textContent: step })
            ]));
        });
        
        const estDate = activeOrder.delivery_date ? formatDate(activeOrder.delivery_date) : "soon";
        document.getElementById('overview-order-footer').textContent = `Expected delivery by ${estDate}`;
        document.getElementById('overview-order-section').style.display = 'block';
    } else {
        document.getElementById('overview-order-section').style.display = 'none';
    }

    const recentInvsDiv = document.getElementById('overview-invoices-list');
    recentInvsDiv.replaceChildren();
    if (portalData.invoices.length === 0) {
        recentInvsDiv.appendChild(renderEmptyState("No invoices found."));
    } else {
        portalData.invoices.slice(0, 2).forEach(inv => {
            recentInvsDiv.appendChild(renderInvoiceRow(inv));
        });
    }

    const recentTicketsDiv = document.getElementById('overview-tickets-list');
    recentTicketsDiv.replaceChildren();
    if (portalData.support.tickets.length === 0) {
        recentTicketsDiv.appendChild(renderEmptyState("No support tickets raised."));
    } else {
        portalData.support.tickets.slice(0, 2).forEach(ticket => {
            recentTicketsDiv.appendChild(renderTicketRow(ticket));
        });
    }

    document.getElementById('renewals-sub-title').textContent = `${portalData.renewals.length} licenses on this account`;
    paginationState.renewals.data = portalData.renewals || [];
    paginationState.renewals.limit = 10;
    const renSelect = document.getElementById(paginationState.renewals.sizeId);
    if (renSelect) renSelect.value = "10";
    renderPaginatedList('renewals');

    document.getElementById('invoices-sub-title').textContent = `${portalData.invoices.length} invoices on this account`;
    const statusSelect = document.getElementById('invoice-status-filter');
    statusSelect.replaceChildren(cel('option', { value: 'All', textContent: 'All' }));
    const uniqueStatuses = [...new Set(portalData.invoices.map(inv => inv.status))];
    uniqueStatuses.forEach(st => {
        statusSelect.appendChild(cel('option', { value: st, textContent: st }));
    });
    paginationState.invoices.data = portalData.invoices || [];
    paginationState.invoices.limit = 10;
    const invSelect = document.getElementById(paginationState.invoices.sizeId);
    if (invSelect) invSelect.value = "10";
    renderPaginatedList('invoices');

    document.getElementById('orders-sub-title').textContent = `${portalData.orders.length} orders on this account`;
    paginationState.orders.data = portalData.orders || [];
    paginationState.orders.limit = 10;
    const ordSelect = document.getElementById(paginationState.orders.sizeId);
    if (ordSelect) ordSelect.value = "10";
    renderPaginatedList('orders');

    const openTicketsList = (portalData.support.tickets || []).filter(t => t.status !== "Closed" && t.status !== "Resolved");
    paginationState.support.data = openTicketsList;
    paginationState.support.limit = 10;
    const supSelect = document.getElementById(paginationState.support.sizeId);
    if (supSelect) supSelect.value = "10";
    renderPaginatedList('support');

    const categorySelect = document.getElementById('ticket-category');
    categorySelect.replaceChildren();
    portalData.support.issue_types.forEach(cat => {
        categorySelect.appendChild(cel('option', { value: cat, textContent: cat }));
    });
    if (portalData.support.issue_types.includes("Other")) {
        categorySelect.value = "Other";
    }

    const prioritySelect = document.getElementById('ticket-priority');
    prioritySelect.replaceChildren();
    const orderedPriorities = ["Medium", "High", "Low"].filter(p => portalData.support.priorities.includes(p));
    portalData.support.priorities.forEach(pr => {
        if (!orderedPriorities.includes(pr)) orderedPriorities.push(pr);
    });
    orderedPriorities.forEach(pr => {
        prioritySelect.appendChild(cel('option', { value: pr, textContent: pr }));
    });

    document.getElementById('contacts-sub-title').textContent = `${portalData.contacts.length} people on this account`;
    paginationState.contacts.data = portalData.contacts || [];
    paginationState.contacts.limit = 10;
    const conSelect = document.getElementById(paginationState.contacts.sizeId);
    if (conSelect) conSelect.value = "10";
    renderPaginatedList('contacts');

    document.getElementById('settings-legal-name').value = portalData.customer_info.customer_name || '';
    document.getElementById('settings-gstin').value = portalData.customer_info.gstin || '';
    document.getElementById('settings-address').value = portalData.customer_info.billing_address || '';
}

// Helper to construct secure SVG elements (strictly XSS safe)
function csvg(tag, attrs = {}, children = []) {
    const el = document.createElementNS("http://www.w3.org/2000/svg", tag);
    for (const [k, v] of Object.entries(attrs)) {
        el.setAttribute(k, v);
    }
    for (const child of children) {
        el.appendChild(child);
    }
    return el;
}

function initMobileMenuToggles() {
    document.querySelectorAll('.pf-top').forEach(pfTop => {
        const titleDiv = pfTop.querySelector('div:first-child');
        if (titleDiv && !titleDiv.querySelector('.pf-menu-toggle')) {
            // Apply layout styles
            titleDiv.style.display = 'flex';
            titleDiv.style.alignItems = 'flex-start';
            titleDiv.style.gap = '12px';
            
            // Create inline hamburger SVG
            const svgIcon = csvg('svg', {
                width: '24',
                height: '24',
                viewBox: '0 0 24 24',
                fill: 'none',
                stroke: 'currentColor',
                'stroke-width': '2.5',
                'stroke-linecap': 'round',
                'stroke-linejoin': 'round'
            }, [
                csvg('line', { x1: '3', y1: '12', x2: '21', y2: '12' }),
                csvg('line', { x1: '3', y1: '6', x2: '21', y2: '6' }),
                csvg('line', { x1: '3', y1: '18', x2: '21', y2: '18' })
            ]);
            
            // Create the hamburger menu toggle button
            const toggleBtn = cel('button', {
                class: 'pf-menu-toggle',
                onclick: (e) => {
                    e.stopPropagation();
                    toggleMobileSidebar(true);
                }
            }, [
                svgIcon
            ]);
            
            // Move title elements to a vertical text group block
            const textGroup = cel('div');
            while (titleDiv.firstChild) {
                textGroup.appendChild(titleDiv.firstChild);
            }
            
            titleDiv.appendChild(toggleBtn);
            titleDiv.appendChild(textGroup);
        }
    });
}

window.addEventListener('DOMContentLoaded', (event) => {
    initMobileMenuToggles();
    fetchPortalData();
});
