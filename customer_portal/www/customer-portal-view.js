function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
if (typeof window !== 'undefined') {
    window.escapeHtml = escapeHtml;
}

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

function stripHtmlTags(html) {
    if (!html || typeof html !== 'string') return '';
    if (!/<[a-z][\s\S]*>/i.test(html)) return html;
    try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        return (doc.body.textContent || '').trim();
    } catch (e) {
        return html.replace(/<[^>]*>/g, '').trim();
    }
}

function setText(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = (val !== null && val !== undefined && val !== '') ? val : '-';
}

function setRichTextOrCleanHtml(elOrId, htmlContent, fallbackText = 'No description provided.', enableShowMore = false) {
    const el = typeof elOrId === 'string' ? document.getElementById(elOrId) : elOrId;
    if (!el) return;

    if (el.nextElementSibling && el.nextElementSibling.classList.contains('pf-desc-toggle-btn')) {
        el.nextElementSibling.remove();
    }
    el.classList.remove('pf-item-desc-clamped', 'pf-item-desc-expanded');

    if (!htmlContent || typeof htmlContent !== 'string' || !htmlContent.trim()) {
        el.textContent = fallbackText;
        return;
    }

    let raw = htmlContent.trim();

    // If it doesn't contain HTML tags, render as clean text
    if (!/<[a-z][\s\S]*>/i.test(raw)) {
        el.textContent = raw;
    } else {
        // Parse HTML safely using DOMParser
        try {
            const parser = new DOMParser();
            const doc = parser.parseFromString(raw, 'text/html');

            // Remove Quill editor wrapper classes if present so styling is clean
            doc.querySelectorAll('.ql-editor').forEach(q => {
                q.classList.remove('ql-editor', 'read-mode');
            });

            // Strip dangerous scripts or event handlers if any
            doc.querySelectorAll('script, style, iframe, object, embed').forEach(s => s.remove());
            doc.querySelectorAll('*').forEach(node => {
                for (let i = node.attributes.length - 1; i >= 0; i--) {
                    const attr = node.attributes[i];
                    if (attr.name.startsWith('on') || attr.value.toLowerCase().startsWith('javascript:')) {
                        node.removeAttribute(attr.name);
                    }
                }
            });

            // Set clean, safe innerHTML from parsed body
            el.replaceChildren();
            Array.from(doc.body.childNodes).forEach(node => {
                el.appendChild(node.cloneNode(true));
            });
        } catch (e) {
            el.textContent = raw;
        }
    }

    if (enableShowMore) {
        const plainText = stripHtmlTags(raw).trim();
        if (plainText && plainText !== '-' && plainText !== 'No description provided.' && plainText !== 'No description text provided for this ticket.') {
            const blockCount = (raw.match(/<\/p>|<br\s*\/?>|\n/gi) || []).length;
            const isLong = plainText.length > 100 || (blockCount > 1 && plainText.length > 60);

            if (isLong) {
                el.classList.add('pf-item-desc-clamped');

                const toggleBtn = cel('button', {
                    type: 'button',
                    class: 'pf-desc-toggle-btn',
                    style: 'margin-top: 6px;',
                    'aria-expanded': 'false'
                }, [
                    cel('span', { class: 'pf-desc-toggle-text', textContent: 'Show more' }),
                    cel('i', { class: 'ti ti-chevron-down' })
                ]);

                toggleBtn.addEventListener('click', function (e) {
                    e.preventDefault();
                    e.stopPropagation();
                    const isClamped = el.classList.contains('pf-item-desc-clamped');
                    const btnText = toggleBtn.querySelector('.pf-desc-toggle-text');
                    const btnIcon = toggleBtn.querySelector('i');

                    if (isClamped) {
                        el.classList.remove('pf-item-desc-clamped');
                        el.classList.add('pf-item-desc-expanded');
                        if (btnText) btnText.textContent = 'Show less';
                        if (btnIcon) btnIcon.className = 'ti ti-chevron-up';
                        toggleBtn.setAttribute('aria-expanded', 'true');
                    } else {
                        el.classList.remove('pf-item-desc-expanded');
                        el.classList.add('pf-item-desc-clamped');
                        if (btnText) btnText.textContent = 'Show more';
                        if (btnIcon) btnIcon.className = 'ti ti-chevron-down';
                        toggleBtn.setAttribute('aria-expanded', 'false');
                    }
                });

                el.parentNode.appendChild(toggleBtn);
            }
        }
    }
}

function createItemDescNode(rawDesc) {
    if (!rawDesc || typeof rawDesc !== 'string' || !rawDesc.trim()) return null;

    const plainText = stripHtmlTags(rawDesc).trim();
    if (!plainText || plainText === '-' || plainText === 'No description provided.' || plainText === 'No description text provided for this ticket.') {
        return null;
    }

    const wrapper = cel('div', { class: 'pf-item-desc-wrapper' });
    const descDiv = cel('div', { class: 'pf-item-desc' });
    setRichTextOrCleanHtml(descDiv, rawDesc, '');
    wrapper.appendChild(descDiv);

    const blockCount = (rawDesc.match(/<\/p>|<br\s*\/?>|\n/gi) || []).length;
    const isLong = plainText.length > 100 || (blockCount > 1 && plainText.length > 60);

    if (isLong) {
        descDiv.classList.add('pf-item-desc-clamped');

        const toggleBtn = cel('button', {
            type: 'button',
            class: 'pf-desc-toggle-btn',
            'aria-expanded': 'false'
        }, [
            cel('span', { class: 'pf-desc-toggle-text', textContent: 'Show more' }),
            cel('i', { class: 'ti ti-chevron-down' })
        ]);

        toggleBtn.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            const isClamped = descDiv.classList.contains('pf-item-desc-clamped');
            const btnText = toggleBtn.querySelector('.pf-desc-toggle-text');
            const btnIcon = toggleBtn.querySelector('i');

            if (isClamped) {
                descDiv.classList.remove('pf-item-desc-clamped');
                descDiv.classList.add('pf-item-desc-expanded');
                if (btnText) btnText.textContent = 'Show less';
                if (btnIcon) btnIcon.className = 'ti ti-chevron-up';
                toggleBtn.setAttribute('aria-expanded', 'true');
            } else {
                descDiv.classList.remove('pf-item-desc-expanded');
                descDiv.classList.add('pf-item-desc-clamped');
                if (btnText) btnText.textContent = 'Show more';
                if (btnIcon) btnIcon.className = 'ti ti-chevron-down';
                toggleBtn.setAttribute('aria-expanded', 'false');
            }
        });

        wrapper.appendChild(toggleBtn);
    }

    return wrapper;
}

const DETAIL_TO_TAB_MAP = {
    'renewal-detail': 'renewals',
    'invoice-detail': 'invoices',
    'order-detail': 'orders',
    'support-detail': 'support',
    'support-new': 'support',
    'contact-detail': 'contacts'
};

// Tab switching & Clean Path URL Routing
function pfGo(name, el, skipHash) {
    document.querySelectorAll('.pf-page').forEach(p => p.classList.remove('on'));
    const targetPage = document.getElementById('page-' + name);
    if (targetPage) {
        targetPage.classList.add('on');
    }

    // Highlight matching sidebar nav link
    const mainTabName = DETAIL_TO_TAB_MAP[name] || name;
    document.querySelectorAll('.pf-nav a').forEach(a => a.classList.remove('on'));

    const matchingLink = Array.from(document.querySelectorAll('.pf-nav a')).find(a => {
        const onclickAttr = a.getAttribute('onclick') || '';
        return onclickAttr.includes("'" + mainTabName + "'");
    });

    if (matchingLink) {
        matchingLink.classList.add('on');
    } else if (el) {
        el.classList.add('on');
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Automatically close mobile sidebar menu drawer on navigation
    toggleMobileSidebar(false);

    // Update clean URL path if not skipped
    if (!skipHash) {
        updateUrlPath(mainTabName);
    }

    const titleMap = {
        overview: 'Overview',
        renewals: 'Renewals',
        'renewal-detail': 'Renewal Details',
        invoices: 'Invoices',
        'invoice-detail': 'Invoice Details',
        orders: 'Orders',
        'order-detail': 'Order Details',
        support: 'Support Tickets',
        'support-detail': 'Ticket Details',
        'support-new': 'Raise Ticket',
        contacts: 'Account & Contacts',
        'contact-detail': 'Contact Details'
    };
    const tabTitle = titleMap[name] || 'Customer Portal';
    document.title = `${tabTitle} - 64 NSPL`;
}

function pfGoByName(name, skipHash) {
    const link = Array.from(document.querySelectorAll('.pf-nav a')).find(a => a.getAttribute('onclick').includes("'" + name + "'"));
    pfGo(name, link, skipHash);
}

function populateStatusDropdown(selectId, metaStatusList, datasetItems, getStatusFn) {
    const select = document.getElementById(selectId);
    if (!select) return;

    select.replaceChildren(cel('option', { value: 'All', textContent: 'All' }));

    const uniqueFromData = [...new Set((datasetItems || []).map(getStatusFn).filter(Boolean))];

    const allStatuses = [];
    if (Array.isArray(metaStatusList)) {
        metaStatusList.forEach(st => {
            if (st && !allStatuses.includes(st)) {
                allStatuses.push(st);
            }
        });
    }

    uniqueFromData.forEach(st => {
        if (st && !allStatuses.includes(st)) {
            allStatuses.push(st);
        }
    });

    allStatuses.forEach(st => {
        select.appendChild(cel('option', { value: st, textContent: st }));
    });
}

function goToPageWithFilter(pageName, statusVal) {
    pfGoByName(pageName);

    if (pageName === 'renewals') {
        const renStatusSelect = document.getElementById('renewal-status-filter');
        if (renStatusSelect) {
            renStatusSelect.value = statusVal;
            filterRenewals();
        }
    } else if (pageName === 'invoices') {
        const invStatusSelect = document.getElementById('invoice-status-filter');
        if (invStatusSelect) {
            const hasOpt = Array.from(invStatusSelect.options).some(opt => opt.value === statusVal);
            if (hasOpt) {
                invStatusSelect.value = statusVal;
            } else if (statusVal === 'Overdue' && Array.from(invStatusSelect.options).some(opt => opt.value === 'Overdue')) {
                invStatusSelect.value = 'Overdue';
            } else {
                invStatusSelect.value = 'All';
            }
            filterInvoices();
        }
    } else if (pageName === 'support') {
        const ticketStatusSelect = document.getElementById('ticket-status-filter');
        if (ticketStatusSelect) {
            const hasOpt = Array.from(ticketStatusSelect.options).some(opt => opt.value === statusVal);
            if (hasOpt) {
                ticketStatusSelect.value = statusVal;
            } else {
                ticketStatusSelect.value = 'All';
            }
            filterTickets();
        }
    }
}

function updateUrlPath(pathSegment) {
    let cleanPath = '/customer-portal-view';
    if (pathSegment && pathSegment !== 'overview') {
        cleanPath += '/' + pathSegment;
    }
    if (window.location.pathname + window.location.hash !== cleanPath) {
        if (history.pushState) {
            history.pushState(null, null, cleanPath);
        } else {
            window.location.hash = '#' + pathSegment;
        }
    }
}

// Helper to construct secure elements using browser document APIs (No innerHTML, strictly XSS safe)
function cel(tag, attrs = {}, children = []) {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
        if (k === 'textContent' || k === 'innerText') {
            el.textContent = v;
        } else if (k === 'innerHTML') {
            el.innerHTML = v;
        } else if (k === 'checked' || k === 'disabled' || k === 'selected' || k === 'readOnly') {
            el[k] = Boolean(v);
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
/* ==========================================================================
   UNIVERSAL GLOBAL MODAL POPUP & ERROR INTERCEPTION SYSTEM
   ========================================================================== */

function showPortalModalPopup(message, title, type = 'error') {
    if (!message) return;

    let cleanMsg = message;
    if (typeof cleanMsg === 'object') {
        cleanMsg = cleanMsg.message || cleanMsg.error || JSON.stringify(cleanMsg);
    }

    if (typeof cleanMsg === 'string') {
        if (cleanMsg.startsWith('[')) {
            try {
                const arr = JSON.parse(cleanMsg);
                cleanMsg = arr.map(item => {
                    const parsed = typeof item === 'string' ? JSON.parse(item) : item;
                    return parsed.message || item;
                }).join('<br>');
            } catch (e) { }
        }
        cleanMsg = cleanMsg.replace(/^<(p|div)>/i, '').replace(/<\/(p|div)>$/i, '');
    }

    let overlay = document.getElementById('pf-global-modal-overlay');
    if (!overlay) {
        overlay = cel('div', { class: 'pf-modal-overlay', id: 'pf-global-modal-overlay' }, [
            cel('div', { class: 'pf-modal-box' }, [
                cel('button', { class: 'pf-modal-close-btn', onclick: closePortalModalPopup }, ['×']),
                cel('div', { class: 'pf-modal-header', id: 'pf-global-modal-header' }, [
                    cel('div', { class: 'pf-modal-icon-wrap error', id: 'pf-global-modal-icon-wrap' }, [
                        cel('i', { class: 'ti ti-alert-triangle', id: 'pf-global-modal-icon' })
                    ]),
                    cel('h3', { class: 'pf-modal-title', id: 'pf-global-modal-title' }, ['Error'])
                ]),
                cel('div', { class: 'pf-modal-body', id: 'pf-global-modal-body' }),
                cel('div', { class: 'pf-modal-footer' }, [
                    cel('button', { class: 'pf-modal-btn primary', id: 'pf-global-modal-ok-btn', onclick: closePortalModalPopup }, ['OK'])
                ])
            ])
        ]);
        document.body.appendChild(overlay);

        overlay.addEventListener('click', function (e) {
            if (e.target === overlay) closePortalModalPopup();
        });
        document.addEventListener('keydown', function (e) {
            if (overlay.classList.contains('pf-modal-show') && (e.key === 'Escape' || e.key === 'Enter')) {
                closePortalModalPopup();
            }
        });
    }

    const defaultTitle = type === 'success' ? 'Success' : (type === 'info' ? 'Notification' : 'Validation Error');
    const titleEl = document.getElementById('pf-global-modal-title');
    const bodyEl = document.getElementById('pf-global-modal-body');
    const iconWrap = document.getElementById('pf-global-modal-icon-wrap');
    const iconEl = document.getElementById('pf-global-modal-icon');

    if (titleEl) titleEl.textContent = title || defaultTitle;
    if (bodyEl) bodyEl.innerHTML = cleanMsg;

    if (iconWrap && iconEl) {
        iconWrap.className = 'pf-modal-icon-wrap ' + (type === 'success' ? 'success' : (type === 'info' ? 'info' : 'error'));
        iconEl.className = type === 'success' ? 'ti ti-circle-check' : (type === 'info' ? 'ti ti-info-circle' : 'ti ti-alert-triangle');
    }

    overlay.style.display = 'flex';
    overlay.offsetHeight; // force reflow
    overlay.classList.add('pf-modal-show');

    const okBtn = document.getElementById('pf-global-modal-ok-btn');
    if (okBtn) setTimeout(() => okBtn.focus(), 100);
}

function closePortalModalPopup() {
    const overlay = document.getElementById('pf-global-modal-overlay');
    if (overlay) {
        overlay.classList.remove('pf-modal-show');
        setTimeout(() => {
            overlay.style.display = 'none';
        }, 250);
    }
}

// Also support toast for non-blocking mini notifications
function showPortalToast(message, type = 'error') {
    const title = type === 'success' ? 'Success' : (type === 'info' ? 'Notification' : 'Validation Error');
    showPortalModalPopup(message, title, type);
}

function extractFrappeErrorMessage(r) {
    if (!r) return "An unexpected error occurred.";
    let msg = "";

    const serverMsgs = r._server_messages || (r.responseJSON && r.responseJSON._server_messages);
    if (serverMsgs) {
        try {
            const parsedArray = typeof serverMsgs === 'string' ? JSON.parse(serverMsgs) : serverMsgs;
            if (Array.isArray(parsedArray)) {
                parsedArray.forEach(m => {
                    const item = typeof m === 'string' ? JSON.parse(m) : m;
                    if (item && item.message) {
                        const cleanMsg = item.message.replace(/<[^>]*>/g, '').trim();
                        if (cleanMsg) msg += (msg ? "\n<br>" : "") + cleanMsg;
                    }
                });
            }
        } catch (e) { }
    }

    if (!msg && r.exc) {
        try {
            const excArray = typeof r.exc === 'string' ? JSON.parse(r.exc) : r.exc;
            if (Array.isArray(excArray) && excArray.length > 0) {
                const lines = excArray[0].split('\n');
                msg = lines[lines.length - 1] || excArray[0];
            }
        } catch (e) { }
    }

    if (!msg && typeof r.message === 'string') {
        msg = r.message;
    } else if (!msg && r.message && typeof r.message.error === 'string') {
        msg = r.message.error;
    }

    if (!msg && r.responseText) {
        try {
            const resp = JSON.parse(r.responseText);
            return extractFrappeErrorMessage(resp);
        } catch (e) { }
    }

    return msg || "An error occurred while processing your request.";
}

// Reset any buttons showing 'Saving...', 'Submitting...', or disabled states
function resetPortalLoadingButtons() {
    document.querySelectorAll('button:disabled, .pf-btn:disabled').forEach(btn => {
        btn.disabled = false;
        if (btn.dataset && btn.dataset.origText) {
            btn.innerHTML = btn.dataset.origText;
        } else if (btn.innerHTML.includes('spin') || btn.textContent.includes('Saving') || btn.textContent.includes('Submitting')) {
            btn.innerHTML = btn.innerHTML.replace(/<i class="ti ti-loader spin"><\/i>\s*/, '').replace('Saving...', 'Save Changes').replace('Submitting...', 'Submit');
        }
    });
}

// Override window.alert globally across all portal tabs
window.alert = function (msg) {
    if (!msg) return;
    const isSuccess = typeof msg === 'string' && (msg.toLowerCase().includes('success') || msg.toLowerCase().includes('saved'));
    showPortalModalPopup(msg, isSuccess ? 'Success' : 'Validation Notice', isSuccess ? 'success' : 'error');
};

// Override frappe.msgprint & frappe.show_alert globally
if (typeof window.frappe === 'undefined') window.frappe = {};

window.frappe.msgprint = function (msg, title) {
    resetPortalLoadingButtons();
    let cleanMsg = extractFrappeErrorMessage({ _server_messages: msg }) || msg;
    showPortalModalPopup(cleanMsg, title || 'Validation Error', 'error');
};

window.frappe.show_alert = function (msg) {
    let text = typeof msg === 'object' ? (msg.message || JSON.stringify(msg)) : msg;
    showPortalModalPopup(text, 'Notification', 'info');
};

// Global pending request set to prevent double-click / duplicate submission
window.cpPendingCalls = window.cpPendingCalls || new Set();

// Override / Intercept frappe.call globally
if (typeof window.frappe !== 'undefined' && typeof window.frappe.call === 'function') {
    const _origFrappeCall = window.frappe.call;
    window.frappe.call = function (opts) {
        if (!opts) return _origFrappeCall.apply(this, arguments);

        // Compute request key to debounce rapid duplicate calls
        const reqKey = opts.method ? `${opts.method}:${JSON.stringify(opts.args || {})}` : null;
        if (reqKey && window.cpPendingCalls.has(reqKey)) {
            console.warn("Duplicate frappe.call request debounced:", opts.method);
            return;
        }
        if (reqKey) window.cpPendingCalls.add(reqKey);

        const origCallback = opts.callback;
        const origError = opts.error;

        opts.callback = function (r) {
            if (reqKey) window.cpPendingCalls.delete(reqKey);
            // Remove any bottom-injected msgprint elements
            document.querySelectorAll('#page-container > .msgprint, body > .msgprint, div.msgprint').forEach(el => el.remove());

            if (r && r._server_messages) {
                resetPortalLoadingButtons();
                const errMsg = extractFrappeErrorMessage(r);
                showPortalModalPopup(errMsg, 'Validation Error', 'error');
                return;
            }
            if (origCallback) origCallback.apply(this, arguments);
        };

        opts.error = function (r) {
            if (reqKey) window.cpPendingCalls.delete(reqKey);
            resetPortalLoadingButtons();
            document.querySelectorAll('#page-container > .msgprint, body > .msgprint, div.msgprint').forEach(el => el.remove());

            const errMsg = extractFrappeErrorMessage(r);
            showPortalModalPopup(errMsg || 'An error occurred while processing your request.', 'Error', 'error');
            if (origError) origError.apply(this, arguments);
        };

        return _origFrappeCall.call(this, opts);
    };
}

// Observe and delete any legacy msgprint elements injected at the bottom of the page
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', function () {
        const observer = new MutationObserver(mutations => {
            mutations.forEach(m => {
                m.addedNodes.forEach(node => {
                    if (node.nodeType === 1) {
                        if (node.classList.contains('msgprint') || node.classList.contains('web-error') || node.id === 'msgprint-dialog' || (node.classList.contains('alert') && node.classList.contains('alert-danger'))) {
                            const text = node.textContent.trim();
                            node.remove(); // Remove element from bottom of page
                            if (text) {
                                resetPortalLoadingButtons();
                                showPortalModalPopup(text, 'Validation Error', 'error');
                            }
                        }
                    }
                });
            });
        });
        observer.observe(document.body, { childList: true, subtree: true });
    });
}

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

function fetchPortalData(onComplete) {
    frappe.call({
        method: "customer_portal.api-customer-portal-view.get_portal_data",
        callback: function (r) {
            if (r.message) {
                if (r.message.error) {
                    console.error(r.message.error);
                    alert(r.message.error);
                    return;
                }
                portalData = r.message;
                if (portalData && portalData.support && portalData.support.tickets) {
                    portalData.tickets = portalData.support.tickets;
                }
                renderPortal();
                if (typeof onComplete === 'function') {
                    onComplete();
                }
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
    const row = cel('div', { class: 'pf-row pf-row-clickable' }, [
        cel('div', { class: 'pf-row-icon' }, [cel('i', { class: 'ti ti-file-invoice' })]),
        cel('div', { class: 'pf-row-body' }, [
            cel('div', { class: 'pf-row-title', textContent: inv.name }),
            cel('div', { class: 'pf-row-sub', textContent: `Issued ${formatDate(inv.posting_date)} · Due ${formatDate(inv.due_date)}` })
        ]),
        cel('div', { class: 'pf-row-right' }, [
            cel('div', { class: 'pf-row-amt', textContent: formatCurrency(inv.grand_total) }),
            cel('span', { class: `pf-pill ${statusClass}`, textContent: inv.status }),
            cel('span', { class: 'pf-row-chevron' }, [cel('i', { class: 'ti ti-chevron-right' })])
        ])
    ]);

    row.addEventListener('click', (e) => {
        // Prevent opening detail view if clicked directly on download button
        if (e.target.closest('.pf-invoice-dl-btn')) return;
        openInvoiceDetail(inv);
    });
    return row;
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
    const row = cel('div', { class: 'pf-row pf-row-clickable' }, [
        cel('div', { class: 'pf-row-icon' }, [cel('i', { class: 'ti ti-headset' })]),
        cel('div', { class: 'pf-row-body' }, [
            cel('div', { class: 'pf-row-title', textContent: ticket.subject }),
            cel('div', { class: 'pf-row-sub', textContent: `Ticket #${ticket.name} · Raised by ${ticket.raised_by || 'system'}` })
        ]),
        cel('div', { class: 'pf-row-right' }, [
            cel('span', { class: `pf-pill ${statusClass}`, textContent: ticket.status }),
            cel('span', { class: 'pf-row-chevron' }, [cel('i', { class: 'ti ti-chevron-right' })])
        ])
    ]);

    row.addEventListener('click', () => openTicketDetail(ticket));
    return row;
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
    const today = new Date();
    const endDate = ren.end_date ? new Date(ren.end_date) : null;
    const daysLeft = endDate ? Math.ceil((endDate - today) / (1000 * 60 * 60 * 24)) : null;

    // Days-left badge
    let badgeEl = null;
    if (daysLeft !== null) {
        let badgeClass = 'pf-days-badge';
        let badgeText = `${daysLeft}d left`;
        if (daysLeft < 0) { badgeClass += ' expired'; badgeText = 'Expired'; }
        else if (daysLeft <= 30) { badgeClass += ' urgent'; }
        else if (daysLeft <= 90) { badgeClass += ' soon'; }
        else { badgeClass += ' ok'; }
        badgeEl = cel('span', { class: badgeClass, textContent: badgeText });
    }

    const row = cel('div', { class: 'pf-row pf-row-clickable' }, [
        cel('div', { class: 'pf-row-icon pf-row-icon-renewal' }, [cel('i', { class: 'ti ti-refresh' })]),
        cel('div', { class: 'pf-row-body' }, [
            cel('div', { class: 'pf-row-title' }, [
                document.createTextNode(ren.product_name || 'Unnamed Product'),
                cel('span', { class: 'pf-renewal-id-tag', textContent: ren.name })
            ]),
            cel('div', { class: 'pf-row-sub' }, [
                document.createTextNode(
                    `${ren.total_quantity || 0} qty · ${formatDate(ren.start_date)} → ${formatDate(ren.end_date)}`
                    + (ren.sales_user ? ` · ${ren.sales_user}` : '')
                )
            ])
        ]),
        cel('div', { class: 'pf-row-right' }, [
            badgeEl,
            cel('div', { class: 'pf-row-amt', textContent: formatCurrency(ren.total_amount) }),
            cel('span', { class: `pf-pill ${statusClass}`, textContent: ren.status || '-' }),
            cel('span', { class: 'pf-row-chevron' }, [cel('i', { class: 'ti ti-chevron-right' })])
        ])
    ]);

    row.addEventListener('click', () => openRenewalDetail(ren));
    return row;
}

function getRenewalStatusClass(status) {
    if (!status) return 'closed';
    status = status.toLowerCase();
    if (status === 'active') return 'paid';
    if (status === 'draft') return 'due';
    if (status === 'lost') return 'overdue';
    return 'closed';
}

function openRenewalDetail(ren, skipHash) {
    const statusClass = getRenewalStatusClass(ren.status);
    const setText = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.textContent = val || '-';
    };

    // Header
    setText('rd-name', ren.name);
    setText('rd-product', ren.product_name);

    // Status pill + amount (top-right)
    const pill = document.getElementById('rd-status-pill');
    if (pill) { pill.textContent = ren.status || '-'; pill.className = `pf-pill ${statusClass}`; }
    setText('rd-amount', formatCurrency(ren.total_amount));
    setText('rd-amount-hero', formatCurrency(ren.total_amount));

    // Hero cards
    setText('rd-start', formatDate(ren.start_date));
    setText('rd-end', formatDate(ren.end_date));
    setText('rd-qty', ren.total_quantity ? `${ren.total_quantity} qty` : '-');

    // Detail grid
    setText('rd-id', ren.name);
    setText('rd-invoice', ren.invoice_no);
    setText('rd-rate', ren.rate ? formatCurrency(ren.rate) + ' / seat' : '-');
    setText('rd-company', ren.company);
    setText('rd-sales-user', ren.sales_user || ren.renewal_owner);
    setText('rd-owner', ren.renewal_owner);

    // Optional fields — hide entire row if empty
    const showOptional = (wrapId, valId, val) => {
        const wrap = document.getElementById(wrapId);
        if (wrap) wrap.style.display = val ? '' : 'none';
        setText(valId, val);
    };
    showOptional('rd-domain-wrap', 'rd-domain', ren.domain_name);
    showOptional('rd-opp-wrap', 'rd-opp', ren.opportunity_id);
    showOptional('rd-sla-wrap', 'rd-sla', ren.sla_type || ren.sla_product || ren.sla);

    // Description / Notes
    const showSection = (wrapId, bodyId, val) => {
        const wrap = document.getElementById(wrapId);
        const body = document.getElementById(bodyId);
        if (wrap) wrap.style.display = val ? '' : 'none';
        if (body) setRichTextOrCleanHtml(body, val, '', true);
    };
    showSection('rd-desc-wrap', 'rd-desc', ren.description);
    showSection('rd-note-wrap', 'rd-note', ren.note);

    // Items Table
    const itemsTbody = document.getElementById('rd-items-tbody');
    const itemsCountEl = document.getElementById('rd-items-count');
    if (itemsTbody) {
        itemsTbody.replaceChildren();
        let itemsToRender = ren.items || [];

        // Fallback: If child table empty, construct item row from header
        if (itemsToRender.length === 0 && (ren.product_name || ren.rate || ren.total_amount || ren.description)) {
            itemsToRender = [{
                item_code: ren.name || 'RENEWAL',
                item_name: ren.product_name || 'Renewal Product',
                description: ren.description || '',
                qty: ren.total_quantity || 1,
                rate: ren.rate || (ren.total_amount && ren.total_quantity ? ren.total_amount / ren.total_quantity : ren.total_amount),
                amount: ren.total_amount || 0,
                start_date: ren.start_date,
                end_date: ren.end_date,
                status: ren.status
            }];
        }

        if (itemsCountEl) itemsCountEl.textContent = itemsToRender.length;

        if (itemsToRender.length === 0) {
            const tr = cel('tr', {}, [
                cel('td', { colspan: '5', style: 'text-align:center;color:var(--ink-soft);padding:18px;' }, ['No items listed for this renewal.'])
            ]);
            itemsTbody.appendChild(tr);
        } else {
            itemsToRender.forEach(it => {
                const periodStr = (it.start_date || it.end_date)
                    ? `${formatDate(it.start_date)} → ${formatDate(it.end_date)}`
                    : '-';

                const itemDesc = it.description || ren.description || '';

                const tr = cel('tr', {}, [
                    cel('td', {}, [
                        cel('div', { class: 'pf-item-title', textContent: it.item_name || it.item_code || 'Product Item' }),
                        it.item_code ? cel('span', { class: 'pf-item-code-tag', textContent: it.item_code }) : null,
                        createItemDescNode(itemDesc)
                    ]),
                    cel('td', { style: 'text-align:center;font-weight:600;' }, [String(it.qty || 1)]),
                    cel('td', { style: 'text-align:right;font-weight:600;font-variant-numeric:tabular-nums;' }, [formatCurrency(it.rate)]),
                    cel('td', { style: 'text-align:right;font-weight:700;color:var(--ink);font-variant-numeric:tabular-nums;' }, [formatCurrency(it.amount)]),
                    cel('td', { style: 'text-align:center;font-size:12px;color:var(--ink-soft);' }, [periodStr])
                ]);
                itemsTbody.appendChild(tr);
            });
        }
    }

    // Renewal countdown progress bar
    const today = new Date();
    const startDate = ren.start_date ? new Date(ren.start_date) : null;
    const endDate = ren.end_date ? new Date(ren.end_date) : null;
    const daysLeft = endDate ? Math.ceil((endDate - today) / (1000 * 60 * 60 * 24)) : null;
    const totalDays = (startDate && endDate)
        ? Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) : null;

    const daysLeftEl = document.getElementById('rd-days-left');
    const daysLabelEl = document.getElementById('rd-days-label');
    const barEl = document.getElementById('rd-progress-bar');

    if (daysLeft !== null && daysLeftEl) {
        if (daysLeft < 0) {
            daysLeftEl.textContent = 'Expired';
            daysLeftEl.style.color = 'var(--red)';
            if (daysLabelEl) daysLabelEl.textContent = `${Math.abs(daysLeft)} days ago`;
        } else {
            daysLeftEl.textContent = daysLeft;
            daysLeftEl.style.color = daysLeft <= 30 ? 'var(--red)' : daysLeft <= 90 ? 'var(--amber)' : 'var(--green)';
            if (daysLabelEl) daysLabelEl.textContent = 'days until renewal';
        }
    }

    if (barEl && totalDays && totalDays > 0) {
        const elapsed = totalDays - (daysLeft || 0);
        const pct = Math.min(100, Math.max(0, (elapsed / totalDays) * 100));
        barEl.style.width = pct + '%';
        barEl.style.background = daysLeft <= 30 ? 'var(--red)' : daysLeft <= 90 ? 'var(--amber)' : 'var(--indigo)';
    }

    setText('rd-tl-start', formatDate(ren.start_date));
    setText('rd-tl-end', formatDate(ren.end_date));

    // Navigate to detail page & update hash
    pfGo('renewal-detail', null, true);
    if (!skipHash && ren && ren.name) {
        updateUrlPath('renewals/' + encodeURIComponent(ren.name));
    }
}


function renderContactRow(contact) {
    const fullName = `${contact.first_name || ''} ${contact.last_name || ''}`.trim() || contact.name;
    const designation = contact.designation || 'Contact';
    const detailText = `${contact.email_id || '-'} · ${contact.mobile_no || contact.phone || '-'}`;
    const isTpoc = (contact.tpoc || contact.custom_tpoc) ? true : false;

    const editBtn = cel('button', {
        type: 'button',
        class: 'pf-btn btn-sm',
        style: 'margin-right:8px;padding:4px 10px;font-size:12px;background:var(--surface-2, #f8fafc);color:var(--indigo, #4f46e5);border:1px solid var(--line, #cbd5e1);',
        title: 'Edit Contact',
        onclick: (e) => {
            e.stopPropagation();
            openContactWizModal(contact.name || contact.id);
        }
    }, [
        cel('i', { class: 'ti ti-pencil', style: 'margin-right:4px;' }),
        document.createTextNode("Edit")
    ]);

    const row = cel('div', { class: 'pf-row pf-row-clickable' }, [
        cel('div', { class: 'pf-row-icon' }, [cel('i', { class: 'ti ti-user' })]),
        cel('div', { class: 'pf-row-body' }, [
            cel('div', { class: 'pf-row-title', textContent: fullName }),
            cel('div', { class: 'pf-row-sub', textContent: `${detailText} · ${designation}` })
        ]),
        cel('div', { class: 'pf-row-right', style: 'display:flex;align-items:center;' }, [
            isTpoc ? cel('span', { class: 'pf-pill paid', style: 'margin-right:6px;background:#dcfce7;color:#15803d;', textContent: 'TPOC' }) : null,
            contact.is_primary_contact ? cel('span', { class: 'pf-pill paid', style: 'margin-right:6px;', textContent: 'Primary' }) : null,
            editBtn,
            cel('span', { class: 'pf-row-chevron' }, [cel('i', { class: 'ti ti-chevron-right' })])
        ])
    ]);

    row.addEventListener('click', () => openContactDetail(contact));
    return row;
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

    const sec = cel('div', { class: 'pf-section pf-row-clickable' }, [
        cel('div', { class: 'pf-section-head' }, [
            cel('h3', { textContent: `Order #${order.name}` }),
            cel('div', { style: 'display:flex;align-items:center;gap:10px;' }, [
                statusPill,
                cel('a', { textContent: 'View details' })
            ])
        ]),
        trackDiv,
        cel('div', { style: 'padding:6px 18px 16px;font-size:12px;color:var(--ink-soft);', textContent: estText })
    ]);

    sec.addEventListener('click', () => openOrderDetail(order));
    return sec;
}

// ==========================================
// DETAIL PAGE OPENER FUNCTIONS
// ==========================================

function openInvoiceDetail(inv, skipHash) {
    const statusClass = getInvoiceStatusClass(inv.status);
    const setText = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.textContent = val || '-';
    };

    const netTotal = inv.net_total != null ? inv.net_total : ((inv.grand_total || 0) - (inv.total_taxes_and_charges || 0));
    const totalTaxes = inv.total_taxes_and_charges != null ? inv.total_taxes_and_charges : ((inv.taxes || []).reduce((acc, t) => acc + (t.tax_amount || 0), 0));

    setText('id-name', inv.name);
    setText('id-sub', `Issued ${formatDate(inv.posting_date)} · Due ${formatDate(inv.due_date)}`);

    const pill = document.getElementById('id-status-pill');
    if (pill) { pill.textContent = inv.status || '-'; pill.className = `pf-pill ${statusClass}`; }

    setText('id-amount', formatCurrency(inv.grand_total));
    setText('id-posting-date', formatDate(inv.posting_date));
    setText('id-due-date', formatDate(inv.due_date));
    setText('id-grand-total', formatCurrency(inv.grand_total));
    setText('id-outstanding', formatCurrency(inv.outstanding_amount));

    setText('id-number', inv.name);
    setText('id-net-total', formatCurrency(netTotal));
    setText('id-taxes-total', formatCurrency(totalTaxes));
    setText('id-company', inv.company || '-');
    setText('id-currency', inv.currency || 'INR');

    const remarksWrap = document.getElementById('id-remarks-wrap');
    const remarksEl = document.getElementById('id-remarks');
    if (remarksWrap && remarksEl) {
        remarksWrap.style.display = inv.remarks ? '' : 'none';
        setRichTextOrCleanHtml(remarksEl, inv.remarks, '');
    }

    // Attach Download PDF listener
    const dlBtn = document.getElementById('id-download-btn');
    if (dlBtn) {
        dlBtn.onclick = (e) => {
            e.stopPropagation();
            dlBtn.disabled = true;
            dlBtn.querySelector('i').className = 'ti ti-loader-2';
            dlBtn.style.animation = 'spin 1s linear infinite';
            frappe.call({
                method: 'customer_portal.api-customer-portal-view.download_invoice_pdf',
                args: { invoice_name: inv.name },
                callback: function (r) {
                    dlBtn.disabled = false;
                    dlBtn.querySelector('i').className = 'ti ti-printer';
                    dlBtn.style.animation = '';
                    if (r.message && r.message.pdf_b64) {
                        const b64 = r.message.pdf_b64;
                        const binary = atob(b64);
                        const bytes = new Uint8Array(binary.length);
                        for (let i = 0; i < binary.length; i++) { bytes[i] = binary.charCodeAt(i); }
                        const blob = new Blob([bytes], { type: 'application/pdf' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = r.message.filename || (inv.name + '.pdf');
                        a.target = '_blank';
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        setTimeout(() => URL.revokeObjectURL(url), 5000);
                    } else {
                        frappe.msgprint('Could not generate invoice PDF. Please try again.');
                    }
                },
                error: function () {
                    dlBtn.disabled = false;
                    dlBtn.querySelector('i').className = 'ti ti-printer';
                    dlBtn.style.animation = '';
                    frappe.msgprint('Failed to download invoice PDF.');
                }
            });
        };
    }

    // Render Invoice Items
    const itemsTbody = document.getElementById('id-items-tbody');
    const itemsCountEl = document.getElementById('id-items-count');
    if (itemsTbody) {
        itemsTbody.replaceChildren();
        const items = inv.items || [];
        if (itemsCountEl) itemsCountEl.textContent = items.length;

        if (items.length === 0) {
            itemsTbody.appendChild(cel('tr', {}, [
                cel('td', { colspan: '4', style: 'text-align:center;color:var(--ink-soft);padding:18px;' }, ['No item details listed for this invoice.'])
            ]));
        } else {
            items.forEach(it => {
                itemsTbody.appendChild(cel('tr', {}, [
                    cel('td', {}, [
                        cel('div', { class: 'pf-item-title', textContent: it.item_name || it.item_code }),
                        it.item_code ? cel('span', { class: 'pf-item-code-tag', textContent: it.item_code }) : null,
                        createItemDescNode(it.description)
                    ]),
                    cel('td', { style: 'text-align:center;font-weight:600;' }, [String(it.qty || 1)]),
                    cel('td', { style: 'text-align:right;font-weight:600;font-variant-numeric:tabular-nums;' }, [formatCurrency(it.rate)]),
                    cel('td', { style: 'text-align:right;font-weight:700;color:var(--ink);font-variant-numeric:tabular-nums;' }, [formatCurrency(it.amount)])
                ]));
            });
        }
    }

    // Render Taxes Breakdown
    const taxesSection = document.getElementById('id-taxes-section');
    const taxesTbody = document.getElementById('id-taxes-tbody');
    if (taxesTbody) {
        taxesTbody.replaceChildren();
        const taxes = inv.taxes || [];
        if (taxesSection) taxesSection.style.display = taxes.length > 0 ? 'block' : 'none';
        if (taxes.length === 0) {
            taxesTbody.appendChild(cel('tr', {}, [
                cel('td', { colspan: '3', style: 'text-align:center;color:var(--ink-soft);padding:18px;' }, ['No additional taxes and charges recorded.'])
            ]));
        } else {
            taxes.forEach(tx => {
                const taxName = tx.description || tx.account_head || 'Tax';
                const taxRate = tx.rate != null && tx.rate !== 0 ? `${tx.rate}%` : '-';
                taxesTbody.appendChild(cel('tr', {}, [
                    cel('td', { style: 'font-weight:600;' }, [taxName]),
                    cel('td', { style: 'text-align:center;font-weight:500;' }, [taxRate]),
                    cel('td', { style: 'text-align:right;font-weight:600;font-variant-numeric:tabular-nums;' }, [formatCurrency(tx.tax_amount)])
                ]));
            });
        }
    }

    pfGo('invoice-detail', null, true);
    if (!skipHash && inv && inv.name) {
        updateUrlPath('invoices/' + encodeURIComponent(inv.name));
    }
}

function openOrderDetail(order, skipHash) {
    const setText = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.textContent = val || '-';
    };

    setText('od-name', `Order #${order.name}`);
    setText('od-sub', `Placed on ${formatDate(order.transaction_date)}`);

    const pill = document.getElementById('od-status-pill');
    if (pill) { pill.textContent = order.status || '-'; pill.className = 'pf-pill open'; }

    setText('od-amount', formatCurrency(order.grand_total));
    setText('od-date', formatDate(order.transaction_date));
    setText('od-delivery-date', formatDate(order.delivery_date) || 'Soon');
    setText('od-total', formatCurrency(order.grand_total));
    setText('od-deliv-status', order.delivery_status || order.status);

    setText('od-number', order.name);
    setText('od-company', order.company || '-');
    setText('od-status-val', order.status || '-');

    // Render Order Tracker
    const trackDiv = document.getElementById('od-track');
    const trackFooter = document.getElementById('od-track-footer');
    if (trackDiv) {
        trackDiv.replaceChildren();
        const steps = ["Placed", "Confirmed", "Processing", "Shipped", "Delivered"];
        let currentStepIndex = 1;
        if (order.status === "To Deliver and Bill" || order.status === "To Deliver") currentStepIndex = 2;
        else if (order.delivery_status === "Partially Delivered") currentStepIndex = 3;
        else if (order.delivery_status === "Fully Delivered") currentStepIndex = 4;
        else if (order.status === "Completed") currentStepIndex = 5;

        steps.forEach((step, idx) => {
            const stepClass = idx < currentStepIndex ? "pf-step done" : (idx === currentStepIndex ? "pf-step now" : "pf-step");
            const dotContent = idx < currentStepIndex ? cel('i', { class: 'ti ti-check' }) : document.createTextNode(String(idx + 1));
            trackDiv.appendChild(cel('div', { class: stepClass }, [
                cel('div', { class: 'pf-dot' }, [dotContent]),
                cel('div', { class: 'l', textContent: step })
            ]));
        });

        if (trackFooter) {
            trackFooter.textContent = order.status === "Completed"
                ? `Delivered ${formatDate(order.delivery_date || order.modified)}`
                : `Expected to ship by ${formatDate(order.delivery_date) || 'soon'}`;
        }
    }

    // Render Ordered Items
    const itemsTbody = document.getElementById('od-items-tbody');
    const itemsCountEl = document.getElementById('od-items-count');
    if (itemsTbody) {
        itemsTbody.replaceChildren();
        const items = order.items || [];
        if (itemsCountEl) itemsCountEl.textContent = items.length;

        if (items.length === 0) {
            itemsTbody.appendChild(cel('tr', {}, [
                cel('td', { colspan: '5', style: 'text-align:center;color:var(--ink-soft);padding:18px;' }, ['No items listed for this order.'])
            ]));
        } else {
            items.forEach(it => {
                itemsTbody.appendChild(cel('tr', {}, [
                    cel('td', {}, [
                        cel('div', { class: 'pf-item-title', textContent: it.item_name || it.item_code }),
                        it.item_code ? cel('span', { class: 'pf-item-code-tag', textContent: it.item_code }) : null,
                        createItemDescNode(it.description)
                    ]),
                    cel('td', { style: 'text-align:center;font-weight:600;' }, [String(it.qty || 1)]),
                    cel('td', { style: 'text-align:center;color:var(--green);font-weight:600;' }, [String(it.delivered_qty || 0)]),
                    cel('td', { style: 'text-align:right;font-weight:600;font-variant-numeric:tabular-nums;' }, [formatCurrency(it.rate)]),
                    cel('td', { style: 'text-align:right;font-weight:700;color:var(--ink);font-variant-numeric:tabular-nums;' }, [formatCurrency(it.amount)])
                ]));
            });
        }
    }

    pfGo('order-detail', null, true);
    if (!skipHash && order && order.name) {
        updateUrlPath('orders/' + encodeURIComponent(order.name));
    }
}

let currentPortalTicketName = null;

function openTicketDetail(ticket, skipHash) {
    if (!ticket) return;
    window.currentPortalTicketName = ticket.name;

    // Clear stale cached version in Frappe client framework memory
    if (window.frappe && frappe.model && ticket.name) {
        if (typeof frappe.model.clear_doc === 'function') {
            frappe.model.clear_doc("Issue", ticket.name);
        }
        if (window.locals && locals["Issue"] && locals["Issue"][ticket.name]) {
            delete locals["Issue"][ticket.name];
        }
    }

    pfGo('support-detail', null, true);
    if (!skipHash && ticket && ticket.name) {
        updateUrlPath('support/' + encodeURIComponent(ticket.name));
    }

    setText('sd-subject', ticket.subject || 'Support Ticket');

    // Status & Header Badges
    const statusPill = document.getElementById('sd-status-pill');
    if (statusPill) {
        statusPill.textContent = ticket.status || 'Open';
        statusPill.className = 'pf-badge p-status ' + (ticket.status || '').toLowerCase().replace(/\s+/g, '-');
    }

    const priorityPill = document.getElementById('sd-priority-pill');
    if (priorityPill) {
        if (ticket.priority) {
            priorityPill.textContent = ticket.priority;
            priorityPill.style.display = 'inline-flex';
        } else {
            priorityPill.style.display = 'none';
        }
    }

    const categoryPill = document.getElementById('sd-category-pill');
    if (categoryPill) {
        const catVal = ticket.custom_query_type || ticket.category || '';
        if (catVal && String(catVal).trim()) {
            categoryPill.textContent = String(catVal).trim();
            categoryPill.style.display = 'inline-flex';
        } else {
            categoryPill.style.display = 'none';
        }
    }

    const suppTypePill = document.getElementById('sd-support-type-pill');
    if (suppTypePill) {
        const suppVal = ticket.custom_support_type || ticket.support_type;
        if (suppVal && String(suppVal).trim()) {
            suppTypePill.textContent = String(suppVal).trim();
            suppTypePill.style.display = 'inline-flex';
        } else {
            suppTypePill.style.display = 'none';
        }
    }

    const techVisitPill = document.getElementById('sd-tech-visit-pill');
    if (techVisitPill) {
        const hasVisit = (ticket.technician_visits && ticket.technician_visits.length > 0) || (ticket.custom_support_type || ticket.support_type) === 'Physical Support';
        if (hasVisit) {
            techVisitPill.style.display = 'inline-flex';
            techVisitPill.textContent = 'Technician Visit: Scheduled';
        } else {
            techVisitPill.style.display = 'none';
        }
    }

    // Header Meta Line
    setText('sd-created', formatDate(ticket.creation));
    setText('sd-customer', ticket.customer || ticket.customer_name || '-');
    const locWrap = document.getElementById('sd-location-wrap');
    if (ticket.location) {
        setText('sd-location', ticket.location);
        if (locWrap) locWrap.style.display = 'inline';
    } else if (locWrap) {
        locWrap.style.display = 'none';
    }

    setRichTextOrCleanHtml('sd-description', ticket.description, 'No description text provided for this ticket.');

    // Resolution Details
    const resSec = document.getElementById('sd-resolution-section');
    const resDetails = ticket.resolution_details || ticket.resolution || '';
    if (resDetails && resDetails.trim() && resDetails !== '-') {
        if (resSec) resSec.style.display = '';
        setRichTextOrCleanHtml('sd-resolution-text', resDetails, 'Resolution details available.');
        setText('sd-resolution-date', formatDate(ticket.resolution_by || ticket.modified));
    } else if (ticket.status === 'Resolved' || ticket.status === 'Closed') {
        if (resSec) resSec.style.display = '';
        setRichTextOrCleanHtml('sd-resolution-text', 'Ticket status marked as ' + ticket.status + '.', '');
        setText('sd-resolution-date', formatDate(ticket.modified));
    } else {
        if (resSec) resSec.style.display = 'none';
    }

    // Attachments, Renewals, Activity & Checklist rendering
    renderTicketAttachments(ticket.attachments || []);
    renderTicketActivity(ticket.activity || []);
    renderTicketRenewals(ticket.active_renewals || []);
    renderTicketScopeOfWork(ticket.scope_of_work || '');
    renderTicketChecklist(ticket.checklist_items || [], ticket.checklist_state || ticket.custom_checklist_state || '');
    renderSlaTiers(ticket);
    renderStakeholderCards(ticket);
    renderTicketAssignments(ticket.assignees_details || ticket.assignees || []);
    renderContactDetails(ticket.customer_contacts || [], ticket.person_name, ticket.contact_email);

    pfGo('support-detail', null, true);
    if (!skipHash && ticket && ticket.name) {
        updateUrlPath('support/' + encodeURIComponent(ticket.name));
    }

    // Fetch live ticket details from server
    if (ticket && ticket.name) {
        frappe.call({
            method: 'customer_portal.api-customer-portal-view.get_ticket_details',
            args: { ticket_name: ticket.name },
            callback: function (r) {
                if (r && r.message && !r.message.error) {
                    const d = r.message;

                    if (d.priority && priorityPill) {
                        priorityPill.textContent = d.priority;
                        priorityPill.style.display = 'inline-flex';
                    }
                    if (categoryPill) {
                        const catVal = d.custom_query_type || d.category || '';
                        if (catVal && String(catVal).trim()) {
                            categoryPill.textContent = String(catVal).trim();
                            categoryPill.style.display = 'inline-flex';
                        } else {
                            categoryPill.style.display = 'none';
                        }
                    }
                    if (suppTypePill) {
                        const suppVal = d.custom_support_type || d.support_type;
                        if (suppVal && String(suppVal).trim()) {
                            suppTypePill.textContent = String(suppVal).trim();
                            suppTypePill.style.display = 'inline-flex';
                        } else {
                            suppTypePill.style.display = 'none';
                        }
                    }

                    if (d.customer) setText('sd-customer', d.customer);
                    if (d.location && locWrap) {
                        setText('sd-location', d.location);
                        locWrap.style.display = 'inline';
                    }

                    if (d.resolution_details && d.resolution_details.trim()) {
                        if (resSec) resSec.style.display = '';
                        setRichTextOrCleanHtml('sd-resolution-text', d.resolution_details, '');
                        setText('sd-resolution-date', formatDate(d.resolution_by || d.modified));
                    }

                    renderTicketAttachments(d.attachments || []);
                    renderTicketActivity(d.activity || []);
                    renderTicketRenewals(d.active_renewals || []);
                    renderTicketScopeOfWork(d.scope_of_work || '');
                    renderTicketChecklist(d.checklist_items || [], d.checklist_state || d.custom_checklist_state || '');
                    renderSlaTiers(d);
                    renderStakeholderCards(d);
                    renderTicketAssignments(d.assignees_details || d.assignees || []);
                    renderContactDetails(d.customer_contacts || [], d.person_name, d.contact_email);
                }
            }
        });
    }
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
        l1Status.className = 'pf-sla-t-status claimed';
    }
    if (l1Meta) {
        const target = ticket.sla_t1 || ticket.response_by || ticket.sla_resolution_by;
        l1Meta.textContent = 'Deadline: ' + (target ? formatDate(target) : 'N/A');
    }

    if (l2Status) l2Status.textContent = 'Unassigned';
    if (l2Meta) l2Meta.textContent = 'Deadline: ' + (ticket.sla_t2 ? formatDate(ticket.sla_t2) : 'N/A (Stopped)');

    if (l3Status) l3Status.textContent = 'Unassigned';
    if (l3Meta) l3Meta.textContent = 'Deadline: ' + (ticket.sla_t3 ? formatDate(ticket.sla_t3) : 'N/A (Stopped)');

    // 1. Resolution SLA
    const resSlaDateEl = document.getElementById('sd-resolution-sla-date');
    const resSlaStatusEl = document.getElementById('sd-resolution-sla-status');
    const resSlaBarWrap = document.getElementById('sd-resolution-sla-bar-wrap');
    const resSlaBar = document.getElementById('sd-resolution-sla-bar');

    const slaResolutionBy = ticket.sla_resolution_by || ticket.resolution_by;
    const isResolvedOrClosed = ticket.status === 'Resolved' || ticket.status === 'Closed';

    if (resSlaDateEl) {
        if (slaResolutionBy) {
            resSlaDateEl.textContent = formatDateTime(slaResolutionBy);

            const sla = calculatePortalSla(slaResolutionBy, ticket.creation, isResolvedOrClosed, ticket.agreement_status);
            if (sla && resSlaStatusEl) {
                resSlaStatusEl.textContent = sla.timeText;
                resSlaStatusEl.style.color = sla.textColor;
                resSlaStatusEl.style.background = sla.bgColor;

                if (resSlaBarWrap && resSlaBar) {
                    resSlaBarWrap.style.display = 'block';
                    resSlaBar.style.width = `${sla.percentElapsed}%`;
                    resSlaBar.style.background = sla.barColor;
                }
            } else if (resSlaStatusEl) {
                resSlaStatusEl.textContent = isResolvedOrClosed ? 'Fulfilled' : 'Active';
                resSlaStatusEl.style.color = 'var(--ink-soft)';
                resSlaStatusEl.style.background = 'rgba(0,0,0,0.05)';
                if (resSlaBarWrap) resSlaBarWrap.style.display = 'none';
            }
        } else {
            resSlaDateEl.textContent = 'No SLA';
            if (resSlaStatusEl) {
                resSlaStatusEl.textContent = 'Not Set';
                resSlaStatusEl.style.color = 'var(--ink-soft)';
                resSlaStatusEl.style.background = 'rgba(0,0,0,0.05)';
            }
            if (resSlaBarWrap) resSlaBarWrap.style.display = 'none';
        }
    }

    // 2. Created On & Last Update On
    const createdEl = document.getElementById('sd-sla-created-on');
    const updatedEl = document.getElementById('sd-sla-updated-on');

    if (createdEl) {
        createdEl.textContent = ticket.creation ? formatDate(ticket.creation) : '-';
    }
    if (updatedEl) {
        updatedEl.textContent = ticket.modified ? formatDate(ticket.modified) : '-';
    }
}

/**
 * Calculates resolution SLA progress percentage, remaining time or breach status for Customer Portal.
 */
function calculatePortalSla(slaResolutionBy, creationDateStr, isResolvedOrClosed, agreementStatus) {
    if (!slaResolutionBy) return null;
    const slaDate = new Date(slaResolutionBy);
    const creationDate = creationDateStr ? new Date(creationDateStr) : new Date();
    if (isNaN(slaDate.getTime())) return null;
    const now = new Date();

    let timeDiffMs = slaDate - now;
    let totalMs = slaDate - creationDate;
    if (totalMs <= 0) totalMs = 1;

    let percentElapsed = ((now - creationDate) / totalMs) * 100;
    if (percentElapsed < 0) percentElapsed = 0;
    if (percentElapsed > 100) percentElapsed = 100;

    let timeText = "";
    let barColor = "#10b981"; // green
    let textColor = "#059669";
    let bgColor = "rgba(16, 185, 129, 0.1)";

    if (isResolvedOrClosed) {
        percentElapsed = 100;
        if (agreementStatus === "Failed") {
            timeText = "Fulfilled (Late)";
            barColor = "#ef4444";
            textColor = "#dc2626";
            bgColor = "rgba(239, 68, 68, 0.1)";
        } else {
            timeText = "Fulfilled (On Time)";
            barColor = "#10b981";
            textColor = "#059669";
            bgColor = "rgba(16, 185, 129, 0.1)";
        }
    } else if (agreementStatus === "Failed" || timeDiffMs < 0) {
        const overrunMs = Math.abs(timeDiffMs);
        const hoursOverrun = overrunMs / (1000 * 60 * 60);
        let overrunText = "";
        if (hoursOverrun > 24) {
            overrunText = `-${Math.round(hoursOverrun / 24)}d`;
        } else if (hoursOverrun > 1) {
            overrunText = `-${Math.round(hoursOverrun)}h`;
        } else {
            const minsOverrun = Math.round(overrunMs / (1000 * 60));
            overrunText = `-${minsOverrun}m`;
        }
        timeText = `Breached (${overrunText})`;
        barColor = "#ef4444";
        textColor = "#dc2626";
        bgColor = "rgba(239, 68, 68, 0.1)";
    } else {
        const hoursLeft = timeDiffMs / (1000 * 60 * 60);
        if (hoursLeft > 24) {
            timeText = `~${Math.round(hoursLeft / 24)}d left`;
        } else if (hoursLeft > 1) {
            timeText = `~${Math.round(hoursLeft)}h left`;
        } else {
            const minsLeft = Math.round(timeDiffMs / (1000 * 60));
            timeText = `${minsLeft}m left`;
        }

        if (hoursLeft < 2) {
            barColor = "#ef4444";
            textColor = "#dc2626";
            bgColor = "rgba(239, 68, 68, 0.1)";
        } else if (hoursLeft < 6) {
            barColor = "#f59e0b";
            textColor = "#d97706";
            bgColor = "rgba(245, 158, 11, 0.1)";
        }
    }

    return { percentElapsed, timeText, barColor, textColor, bgColor };
}

function renderStakeholderCards(ticket) {
    // 1. Assigned To (Working Agent)
    const assignedCard = document.getElementById('sd-assignedto-card');
    const agentMeta = ticket.working_agent_details || {};
    const agentName = agentMeta.full_name || ticket.working_agent;
    const agentRole = agentMeta.designation || agentMeta.role_profile || 'Support Technician';

    if (agentName && assignedCard) {
        assignedCard.style.display = '';
        setText('sd-assignedto-av', getInitials(agentName));
        setText('sd-assignedto-name', agentName);
        setText('sd-assignedto-role', agentRole);
    } else if (assignedCard) {
        assignedCard.style.display = 'none';
    }

    // 2. Raised By
    const raisedName = ticket.person_name || (ticket.raised_by_details && ticket.raised_by_details.full_name) || ticket.raised_by || 'Customer';
    const raisedRole = (ticket.raised_by_details && ticket.raised_by_details.designation) || ticket.contact_email || 'Customer User';
    const initials = getInitials(raisedName);

    setText('sd-raised-by-av', initials);
    setText('sd-raised-by-name', raisedName);
    setText('sd-raised-by-role', raisedRole);

    // 3. Sales Person
    const salesCard = document.getElementById('sd-salesperson-card');
    const salesMeta = ticket.sales_person_details || {};
    const salesName = salesMeta.full_name || ticket.sales_person;

    if (salesName && salesCard) {
        salesCard.style.display = '';
        setText('sd-salesperson-av', getInitials(salesName));
        setText('sd-salesperson-name', salesName);
        setText('sd-salesperson-role', salesMeta.designation || 'Sales Manager');
    } else if (salesCard) {
        salesCard.style.display = 'none';
    }
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

    function safeEscape(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    const userDocs = list.map(u => {
        const name = typeof u === 'string' ? u : (u.full_name || u.name || u.email || 'User');
        const email = typeof u === 'object' ? (u.email || u.name || '') : '';
        const userImg = typeof u === 'object' ? (u.user_image || '') : '';
        const initials = getInitials(name);
        return { name, email, userImg, initials };
    });

    const maxVisible = 4;
    const visibleUsers = userDocs.slice(0, maxVisible);
    const extraCount = userDocs.length - visibleUsers.length;

    const avatarsRow = cel('div', {
        style: 'display: inline-flex; align-items: center; padding: 4px 2px;'
    });

    visibleUsers.forEach((u, idx) => {
        const tooltipTitle = u.email ? `${u.name} (${u.email})` : u.name;

        const avDiv = cel('div', {
            style: `width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(135deg, #4f46e5, #6366f1); color: #ffffff; font-size: 11px; font-weight: 700; display: grid; place-items: center; overflow: hidden; flex-shrink: 0; border: 2px solid #ffffff; box-shadow: 0 1px 3px rgba(0,0,0,0.12); cursor: pointer; position: relative; transition: all 0.2s ease; ${idx > 0 ? 'margin-left: -10px;' : ''}`,
            title: safeEscape(tooltipTitle)
        });

        avDiv.addEventListener('mouseenter', () => {
            avDiv.style.transform = 'scale(1.2) translateY(-2px)';
            avDiv.style.zIndex = '10';
            avDiv.style.boxShadow = '0 4px 12px rgba(79, 70, 229, 0.35)';
        });
        avDiv.addEventListener('mouseleave', () => {
            avDiv.style.transform = 'none';
            avDiv.style.zIndex = '1';
            avDiv.style.boxShadow = '0 1px 3px rgba(0,0,0,0.12)';
        });

        if (u.userImg) {
            avDiv.innerHTML = `<img src="${safeEscape(u.userImg)}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" onerror="this.onerror=null;this.parentElement.textContent='${safeEscape(u.initials)}';">`;
        } else {
            avDiv.textContent = u.initials;
        }

        avatarsRow.appendChild(avDiv);
    });

    if (extraCount > 0) {
        const extraNames = userDocs.slice(maxVisible).map(u => u.name).join(', ');
        const extraDiv = cel('div', {
            style: 'width: 32px; height: 32px; border-radius: 50%; background: #64748b; color: #ffffff; font-size: 11px; font-weight: 700; display: grid; place-items: center; overflow: hidden; flex-shrink: 0; border: 2px solid #ffffff; box-shadow: 0 1px 3px rgba(0,0,0,0.12); cursor: pointer; position: relative; margin-left: -10px; transition: all 0.2s ease;',
            title: safeEscape(extraNames),
            textContent: `+${extraCount}`
        });

        extraDiv.addEventListener('mouseenter', () => {
            extraDiv.style.transform = 'scale(1.2) translateY(-2px)';
            extraDiv.style.zIndex = '10';
            extraDiv.style.boxShadow = '0 4px 12px rgba(100, 116, 139, 0.35)';
        });
        extraDiv.addEventListener('mouseleave', () => {
            extraDiv.style.transform = 'none';
            extraDiv.style.zIndex = '1';
            extraDiv.style.boxShadow = '0 1px 3px rgba(0,0,0,0.12)';
        });

        avatarsRow.appendChild(extraDiv);
    }

    container.appendChild(avatarsRow);
}

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
        const initials = getInitials(cName);

        const card = cel('div', { class: 'pf-contact-card' }, [
            cel('div', { class: 'pf-contact-av' }, [initials]),
            cel('div', { class: 'pf-contact-body' }, [
                cel('div', { class: 'pf-contact-name', textContent: displayName }),
                c.designation ? cel('div', { class: 'pf-contact-desig', textContent: c.designation }) : null,
                c.email_id ? cel('div', { class: 'pf-contact-meta' }, [
                    cel('i', { class: 'ti ti-mail' }),
                    cel('span', { textContent: c.email_id })
                ]) : null,
                c.mobile_no ? cel('div', { class: 'pf-contact-meta' }, [
                    cel('i', { class: 'ti ti-phone' }),
                    cel('span', { textContent: c.mobile_no })
                ]) : null,
                c.is_primary ? cel('div', { style: 'margin-top:4px;' }, [
                    cel('span', { class: 'tpoc-badge', textContent: 'TPOC' })
                ]) : null
            ])
        ]);
        listEl.appendChild(card);
    });
}

function getInitials(name) {
    if (!name) return 'U';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return parts[0].substring(0, 2).toUpperCase();
}

// Holds the current ticket's raw scope_of_work HTML for the view modal
let _portalCurrentScopeHtml = '';

function renderTicketScopeOfWork(scopeText) {
    const secEl = document.getElementById('sd-scope-section');
    const previewEl = document.getElementById('sd-scope-preview');
    const emptyEl = document.getElementById('sd-scope-empty');
    const viewBtn = document.getElementById('sd-scope-view-btn');
    const viewTextEl = document.getElementById('sd-scope-view-text');
    const viewIconEl = document.getElementById('sd-scope-view-icon');
    if (!secEl) return;

    // Reset expanded state on load
    if (previewEl) previewEl.classList.remove('expanded');
    if (viewTextEl) viewTextEl.textContent = 'View More';
    if (viewIconEl) viewIconEl.className = 'ti ti-chevron-down';

    // Normalize to detect real content (strip empty HTML tags)
    const cleanText = (scopeText || '')
        .replace(/<p><\/p>/gi, '')
        .replace(/<p><br\s*\/?><\/p>/gi, '')
        .replace(/<br\s*\/?>/gi, '')
        .replace(/<[^>]*>/g, '')
        .trim();

    const hasContent = !!(scopeText && scopeText.trim() && scopeText.trim() !== '-' && cleanText);

    // Store globally
    _portalCurrentScopeHtml = hasContent ? scopeText : '';

    if (hasContent) {
        // Show section with content
        secEl.style.display = '';
        if (previewEl) {
            setRichTextOrCleanHtml(previewEl, scopeText, '');
            previewEl.style.display = 'block';
        }
        if (emptyEl) emptyEl.style.display = 'none';

        // Check if content length warrants a View More button (or show by default if has HTML/multiple lines)
        if (viewBtn) {
            const isLongContent = cleanText.length > 100 || (scopeText.includes('<p>') && scopeText.split('</p>').length > 2);
            viewBtn.style.display = isLongContent ? 'inline-flex' : 'none';
        }
    } else {
        // Hide the entire section when no scope of work data
        secEl.style.display = 'none';
        _portalCurrentScopeHtml = '';
    }
}

/**
 * Toggles inline expansion of the Scope of Work section (View More <-> Show Less).
 */
function togglePortalScopeExpand() {
    const previewEl = document.getElementById('sd-scope-preview');
    const viewTextEl = document.getElementById('sd-scope-view-text');
    const viewIconEl = document.getElementById('sd-scope-view-icon');
    if (!previewEl) return;

    const isExpanded = previewEl.classList.contains('expanded');

    if (isExpanded) {
        previewEl.classList.remove('expanded');
        if (viewTextEl) viewTextEl.textContent = 'View More';
        if (viewIconEl) viewIconEl.className = 'ti ti-chevron-down';
    } else {
        previewEl.classList.add('expanded');
        if (viewTextEl) viewTextEl.textContent = 'Show Less';
        if (viewIconEl) viewIconEl.className = 'ti ti-chevron-up';
    }
}

function renderTicketChecklist(checklistItems, checklistStateStr) {
    const secEl = document.getElementById('sd-checklist-section');
    const listEl = document.getElementById('sd-checklist-container');
    if (!secEl || !listEl) return;

    listEl.innerHTML = '';
    let itemsMap = {};
    let checkedStates = {};

    // 1. Safely parse checklistStateStr (String or Object)
    if (checklistStateStr) {
        if (typeof checklistStateStr === 'object' && checklistStateStr !== null) {
            checkedStates = checklistStateStr;
        } else if (typeof checklistStateStr === 'string' && checklistStateStr.trim() !== '' && checklistStateStr.trim() !== '{}') {
            try {
                checkedStates = JSON.parse(checklistStateStr);
            } catch (e) { }
        }
    }

    // 2. Load base items from checklistItems array
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

    // 3. Extract items from _selected_items in checkedStates
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

    // 4. Update or add items from checkedStates keys
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

    // 5. Filter by _selected_items if available in checkedStates
    let items = allItems;
    if (checkedStates && Array.isArray(checkedStates._selected_items)) {
        const selectedList = checkedStates._selected_items;
        if (selectedList.length === 0) {
            secEl.style.display = 'none';
            return;
        }

        const filtered = allItems.filter(itemObj => {
            const cleanTitle = itemObj.item.trim();
            if (itemObj.status === 'completed' || itemObj.status === 'not_required' || itemObj.status === 'transferred') {
                return true;
            }
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

        items = filtered;
    }

    if (!items || items.length === 0) {
        secEl.style.display = 'none';
        return;
    }

    secEl.style.display = '';

    // Calculate progress statistics
    const doneCount = items.filter(i => i.status === 'completed' || i.status === 1).length;
    const escCount = items.filter(i => i.status === 'transferred' || i.status === 'escalated').length;
    const naCount = items.filter(i => i.status === 'not_required').length;
    const pendingCount = Math.max(0, items.length - (doneCount + escCount + naCount));
    const pct = items.length > 0 ? Math.round((doneCount / items.length) * 100) : 0;

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

        // 1. Left Check Circle (Image 2: Solid Green Circle with Checkmark for completed, empty for pending/NA)
        const circleDiv = cel('div', {
            style: `width: 24px; height: 24px; border-radius: 50%; display: grid; place-items: center; flex-shrink: 0; margin-top: 2px; ${isDone
                ? 'background: #16a34a; border: none; color: #ffffff;'
                : 'background: #ffffff; border: 2px solid #cbd5e1; color: transparent;'
                }`
        });
        circleDiv.innerHTML = isDone
            ? '<i class="ti ti-check" style="font-size: 14px; font-weight: 800;"></i>'
            : '';

        // 2. Middle Content Column
        const mainDiv = cel('div', { style: 'flex: 1; display: flex; flex-direction: column; gap: 4px;' });

        // Title + Pill Row
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

        // Note Line (e.g. "☑ completed issues" or "✕ Already completed externally")
        const noteText = chk.note || (isDone ? 'completed issues' : isNA ? 'Already completed externally' : '');
        if (noteText) {
            const noteDiv = cel('div', {
                style: `font-size: 12.5px; margin-top: 1px; display: flex; align-items: center; gap: 4px; ${isDone ? 'color: #16a34a; font-weight: 500;' : isNA ? 'color: #94a3b8; font-style: italic;' : 'color: #64748b;'
                    }`
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

        // Meta Line: User & Clock Timestamp (Formatted like 12-08-26 12:01)
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

        // 3. Right Status Button Column (Image 2 Right Badges)
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

        // Row container
        const itemRow = cel('div', {
            style: `display: flex; align-items: flex-start; gap: 14px; padding: 16px 20px; border-bottom: 1px solid #f1f5f9; ${isDone ? 'background: rgba(34, 197, 94, 0.02);' : 'background: #ffffff;'
                }`
        }, [circleDiv, mainDiv, rightDiv]);

        listEl.appendChild(itemRow);
    });
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

function renderTicketRenewals(renewals) {
    const secEl = document.getElementById('sd-renewals-section');
    const listEl = document.getElementById('sd-renewals-list');
    if (!secEl || !listEl) return;

    listEl.innerHTML = '';
    if (!renewals || !renewals.length) {
        secEl.style.display = 'none';
        return;
    }

    secEl.style.display = '';
    renewals.forEach(ren => {
        const title = ren.item || ren.item_name || ren.product_name || ren.renewal_id || 'Renewal Item';
        const subParts = [];
        if (ren.renewal_id) subParts.push(`ID: ${ren.renewal_id}`);
        if (ren.quantity) subParts.push(`Qty: ${ren.quantity}`);
        if (ren.end_date) subParts.push(`End Date: ${formatDate(ren.end_date)}`);

        const item = cel('div', { class: 'pf-asset-card' }, [
            cel('div', { class: 'pf-asset-icon' }, [
                cel('i', { class: 'ti ti-device-desktop' })
            ]),
            cel('div', { style: 'flex:1;min-width:0;' }, [
                cel('div', { class: 'pf-asset-title' }, [
                    cel('span', { style: 'color:var(--ink-soft,#64748b);font-weight:500;margin-right:4px;', textContent: 'Item:' }),
                    document.createTextNode(title)
                ]),
                cel('div', { class: 'pf-asset-sub', textContent: subParts.join(' · ') || 'Active Asset' })
            ])
        ]);
        listEl.appendChild(item);
    });
}

let sdReplyUploadedFiles = [];

function handleReplyFileUpload(e) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const ticketName = window.currentPortalTicketName;

    files.forEach(file => {
        frappe.call({
            method: "customer_portal.api-customer-portal-view.upload_portal_attachment",
            args: {
                attached_to_doctype: "Issue",
                attached_to_name: ticketName || ""
            },
            files: { file: file },
            callback: function (r) {
                if (r.message && r.message.status === "success") {
                    sdReplyUploadedFiles.push({
                        file_url: r.message.file_url,
                        name: r.message.name,
                        file_name: r.message.file_name || file.name
                    });
                    renderSdReplyAttachmentsPreview();
                } else {
                    const reader = new FileReader();
                    reader.onload = function (evt) {
                        frappe.call({
                            method: "customer_portal.api-customer-portal-view.upload_portal_attachment",
                            args: {
                                filename: file.name,
                                filedata: evt.target.result,
                                attached_to_doctype: "Issue",
                                attached_to_name: ticketName || ""
                            },
                            callback: function (res) {
                                if (res.message && res.message.status === "success") {
                                    sdReplyUploadedFiles.push({
                                        file_url: res.message.file_url,
                                        name: res.message.name,
                                        file_name: res.message.file_name || file.name
                                    });
                                    renderSdReplyAttachmentsPreview();
                                } else {
                                    alert("Failed to upload " + file.name);
                                }
                            }
                        });
                    };
                    reader.readAsDataURL(file);
                }
            }
        });
    });
    e.target.value = '';
}

function removeSdReplyFile(idx) {
    sdReplyUploadedFiles.splice(idx, 1);
    renderSdReplyAttachmentsPreview();
}

function renderSdReplyAttachmentsPreview() {
    const wrap = document.getElementById('sd-reply-attachments-preview');
    if (!wrap) return;
    wrap.replaceChildren();

    sdReplyUploadedFiles.forEach((file, idx) => {
        const item = cel('div', {
            style: 'display:inline-flex;align-items:center;gap:6px;padding:4px 10px;background:var(--surface);border:1px solid var(--line);border-radius:16px;font-size:12px;color:var(--ink);'
        }, [
            cel('i', { class: 'ti ti-paperclip', style: 'color:var(--indigo);' }),
            cel('span', { textContent: file.file_name, style: 'max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;' }),
            cel('button', {
                type: 'button',
                style: 'border:none;background:none;cursor:pointer;color:var(--ink-soft);padding:0 2px;display:flex;align-items:center;',
                onclick: () => removeSdReplyFile(idx)
            }, [
                cel('i', { class: 'ti ti-x', style: 'font-size:14px;' })
            ])
        ]);
        wrap.appendChild(item);
    });
}

function handleDirectAttachmentUpload(e) {
    const files = Array.from(e.target.files || []);
    const ticketName = window.currentPortalTicketName;
    if (!files.length || !ticketName) {
        if (!ticketName) alert("No active ticket selected.");
        return;
    }

    let completed = 0;
    const total = files.length;

    const onComplete = () => {
        completed++;
        if (completed === total) {
            frappe.call({
                method: 'customer_portal.api-customer-portal-view.get_ticket_details',
                args: { ticket_name: ticketName },
                callback: function (r) {
                    if (r && r.message && !r.message.error) {
                        const d = r.message;
                        renderTicketAttachments(d.attachments || []);
                        renderTicketActivity(d.activity || []);
                    }
                }
            });
        }
    };

    files.forEach(file => {
        frappe.call({
            method: "customer_portal.api-customer-portal-view.upload_portal_attachment",
            args: {
                attached_to_doctype: "Issue",
                attached_to_name: ticketName
            },
            files: { file: file },
            callback: function (r) {
                if (r.message && r.message.status === "success") {
                    onComplete();
                } else {
                    const reader = new FileReader();
                    reader.onload = function (evt) {
                        frappe.call({
                            method: "customer_portal.api-customer-portal-view.upload_portal_attachment",
                            args: {
                                filename: file.name,
                                filedata: evt.target.result,
                                attached_to_doctype: "Issue",
                                attached_to_name: ticketName
                            },
                            callback: function (res) {
                                if (res.message && res.message.status === "success") {
                                    onComplete();
                                } else {
                                    alert("Failed to upload " + file.name);
                                    onComplete();
                                }
                            }
                        });
                    };
                    reader.readAsDataURL(file);
                }
            }
        });
    });

    e.target.value = '';
}

function submitPortalTicketReply() {
    const ticketName = window.currentPortalTicketName;
    const inputEl = document.getElementById('sd-reply-input');
    const btnEl = document.getElementById('sd-reply-submit-btn');
    if (!ticketName) return;
    if (btnEl && btnEl.disabled) return;

    const replyText = inputEl ? inputEl.value.trim() : '';
    if (!replyText && !sdReplyUploadedFiles.length) {
        alert('Please type a message or attach a file before sending your reply.');
        return;
    }

    if (btnEl) {
        btnEl.disabled = true;
        btnEl.innerHTML = '<i class="ti ti-loader spin"></i> Sending...';
    }

    frappe.call({
        method: 'customer_portal.api-customer-portal-view.add_ticket_reply',
        args: {
            ticket_name: ticketName,
            comment_text: replyText || 'Attached file(s)',
            attachments: JSON.stringify(sdReplyUploadedFiles)
        },
        callback: function (r) {
            if (btnEl) {
                btnEl.disabled = false;
                btnEl.innerHTML = '<i class="ti ti-send"></i> Send Reply';
            }
            if (r && r.message && !r.message.error) {
                if (inputEl) inputEl.value = '';
                sdReplyUploadedFiles = [];
                renderSdReplyAttachmentsPreview();
                const d = r.message;
                renderTicketActivity(d.activity || []);
                renderTicketAttachments(d.attachments || []);
                const pill = document.getElementById('sd-status-pill');
                if (pill && d.status) {
                    pill.textContent = d.status;
                    pill.className = `pf-pill ${getTicketStatusClass(d.status)}`;
                }
            } else if (r && r.message && r.message.error) {
                alert(r.message.error);
            }
        },
        error: function (err) {
            if (btnEl) {
                btnEl.disabled = false;
                btnEl.innerHTML = '<i class="ti ti-send"></i> Send Reply';
            }
        }
    });
}

function renderTicketAttachments(attachments) {
    const listEl = document.getElementById('sd-attachments-list');

    if (!listEl) return;
    listEl.innerHTML = '';
    if (!attachments || !attachments.length) {
        listEl.innerHTML = '<div style="padding:12px;text-align:center;color:var(--ink-soft);font-size:13px;">No attachments for this ticket.</div>';
        return;
    }
    attachments.forEach(att => {
        const item = cel('a', {
            class: 'pf-attachment-chip',
            href: att.file_url,
            target: '_blank',
            style: 'display:flex;align-items:center;gap:10px;padding:10px 12px;background:var(--surface);border:1px solid var(--line);border-radius:8px;text-decoration:none;color:var(--ink);font-size:13px;transition:all .2s ease;'
        }, [
            cel('i', { class: 'ti ti-file-text', style: 'font-size:18px;color:var(--indigo);' }),
            cel('div', { style: 'flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;' }, [
                cel('div', { style: 'font-weight:600;', textContent: att.file_name || 'Attachment' }),
                cel('div', { style: 'font-size:11px;color:var(--ink-soft);', textContent: att.creation ? formatDate(att.creation) : '' })
            ]),
            cel('i', { class: 'ti ti-download', style: 'color:var(--ink-soft);' })
        ]);
        listEl.appendChild(item);
    });
}

function _buildTimelineHTML(items) {
    if (!items || !items.length) {
        return '<div class="tl-empty"><p style="color:var(--ink-soft);font-size:13px;margin:0;padding:16px;text-align:center;">No activity found.</p></div>';
    }

    const getActivityIcon = (type) => {
        const icons = {
            "Comment": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" /></svg>',
            "Communication": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="2" y="4" width="20" height="16" rx="2"/><polyline points="2,4 12,13 22,4"/></svg>',
            "Notification": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>',
            "Status Change": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></svg>',
            "Created": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>',
            "Document Created": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>',
            "Assigned": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
            "File Attached": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/></svg>',
            "Info Added": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',
            "Time Log": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
        };
        return icons[type] || icons["Status Change"];
    };

    const getActivityColor = (type) => {
        const colors = {
            "Comment": "td-comment",
            "Communication": "td-comment",
            "Notification": "td-comment",
            "Status Change": "td-status",
            "Created": "td-create",
            "Document Created": "td-create",
            "Assigned": "td-assign",
            "Assignment Completed": "td-assign",
            "File Attached": "td-vendor",
            "Attachment": "td-vendor",
            "Info Added": "td-assign",
            "Info": "td-assign",
            "Time Log": "td-status",
        };
        return colors[type] || "td-status";
    };

    const formatRelativeTime = (timestamp) => {
        if (!timestamp) return "";
        const now = new Date();
        const date = new Date(timestamp);
        if (isNaN(date.getTime())) return timestamp;
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);
        if (diffMins < 1) return "now";
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return formatDate(timestamp);
    };

    const escapeHtml = (str) => {
        return String(str || "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    };

    const itemsForStatus = [...items].reverse();
    let _trackedStatus = 'Created';
    itemsForStatus.forEach(item => {
        if (item.type === 'Status Change' && item.description) {
            const m = item.description.match(/from\s+(.+?)\s+to\s+(.+?)\.?$/i);
            if (m) {
                item._statusAtTime = m[2].replace(/\.$/, '').trim();
                _trackedStatus = item._statusAtTime;
                return;
            }
        }
        item._statusAtTime = _trackedStatus;
    });

    return items.map((row, idx) => {
        const dotClass = getActivityColor(row.type);
        const icon = getActivityIcon(row.type);
        const connector = idx < items.length - 1 ? '<div class="tl-connector"></div>' : '';
        const title = escapeHtml(row.title || row.type || "Activity");
        const by = escapeHtml(row.by || "System");
        const stamp = row.timestamp || "";
        const displayStamp = row.display ? escapeHtml(row.display) : escapeHtml(formatDate(stamp));
        const relativeTime = formatRelativeTime(stamp);

        const statusAtTime = row._statusAtTime || '';
        const statusSlug = statusAtTime.toLowerCase().replace(/\s+/g, '-');
        const statusBadgeHtml = statusAtTime
            ? `<span class="tl-cur-status tl-status-badge tl-status-${statusSlug}" title="Ticket status at this point">${escapeHtml(statusAtTime)}</span>`
            : '';

        let contentHtml = '';
        if (row.description) {
            const desc = row.description;
            const t = row.type || '';
            const isHtmlContent = row.is_html || t === 'File Attached' || t === 'Attachment' || (typeof desc === 'string' && (desc.includes('<a ') || desc.includes('📎')));

            if (isHtmlContent && t !== 'Comment') {
                let emailMetaHtml = '';
                if (t === 'Communication') {
                    const toVal = escapeHtml(row.recipients || '');
                    const ccVal = escapeHtml(row.cc || '');
                    const subjVal = escapeHtml(row.subject || '');
                    const toRows = toVal ? `<div class="tl-email-meta-row"><span class="tl-email-meta-label">To</span><span class="tl-email-meta-value">${toVal}</span></div>` : '';
                    const ccRows = ccVal ? `<div class="tl-email-meta-row"><span class="tl-email-meta-label">CC</span><span class="tl-email-meta-value">${ccVal}</span></div>` : '';
                    const subjRow = subjVal ? `<div class="tl-email-meta-row tl-email-meta-subject"><span class="tl-email-meta-label">Subject</span><span class="tl-email-meta-value">${subjVal}</span></div>` : '';
                    if (toRows || ccRows || subjRow) {
                        emailMetaHtml = `<div class="tl-email-meta">${toRows}${ccRows}${subjRow}</div>`;
                    }
                }

                const plainText = desc.replace(/<[^>]*>/g, '').trim();
                if (plainText.length > 150 || desc.length > 300) {
                    contentHtml = `
                        ${emailMetaHtml}
                        <div class="tl-content-html collapsed">${desc}</div>
                        <button type="button" class="btn-toggle-email" onclick="window.toggleEmailExpand(this)">
                            <span>Show More</span>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
                        </button>
                    `;
                } else {
                    contentHtml = `${emailMetaHtml}<div class="tl-content-html">${desc}</div>`;
                }
            } else if (t === 'Comment') {
                const hasHtmlLinks = (typeof desc === 'string' && (desc.includes('<a ') || desc.includes('📎')));
                const safe = hasHtmlLinks ? desc : escapeHtml(desc).replace(/\n/g, '<br>');
                contentHtml = `<div class="tl-comment-bubble">${safe}</div>`;
            } else if (t === 'Status Change') {
                const statusBadge = (s) => {
                    const slug = s.toLowerCase().replace(/\s+/g, '-');
                    return `<span class="tl-status-badge tl-status-${slug}">${escapeHtml(s)}</span>`;
                };
                const m = desc.match(/from\s+(.+?)\s+to\s+(.+?)\.?$/i);
                let safe;
                if (m) {
                    const fromStatus = m[1].trim();
                    const toStatus = m[2].replace(/\.$/, '').trim();
                    safe = `${statusBadge(fromStatus)}<span class="tl-status-arrow">→</span>${statusBadge(toStatus)}`;
                } else {
                    safe = escapeHtml(desc);
                }
                contentHtml = `<div class="tl-desc-line tl-status-change-line">${safe}</div>`;
            } else if (t.includes('Info') || t === 'Label' || t === 'Label Added') {
                const safe = escapeHtml(desc).replace(/\n/g, '<br>');
                contentHtml = `<div class="tl-info-box"><span class="info-label">ℹ️ Info</span><p>${safe}</p></div>`;
            } else {
                const safe = escapeHtml(desc).replace(/\n/g, '<br>');
                contentHtml = `<div class="tl-desc-line">${safe}</div>`;
            }
        }

        return `
            <div class="tl-item">
                <div class="tl-dot-col">
                    <div class="tl-dot ${dotClass}">
                        ${icon}
                    </div>
                    ${connector}
                </div>
                <div class="tl-body">
                    <div class="tl-hd">
                        <div class="tl-hd-left">
                            <span class="tl-author">${by}</span>
                            <span class="tl-action">${title}</span>
                            ${statusBadgeHtml}
                        </div>
                        <span class="tl-time" title="${displayStamp}">${relativeTime || displayStamp}</span>
                    </div>
                    ${contentHtml}
                </div>
            </div>
        `;
    }).join("");
}

window.toggleEmailExpand = function (btn) {
    const wrapper = btn.previousElementSibling;
    if (!wrapper) return;
    const isCollapsed = wrapper.classList.contains("collapsed");
    if (isCollapsed) {
        wrapper.classList.remove("collapsed");
        btn.classList.add("expanded");
        btn.querySelector("span").textContent = "Show Less";
    } else {
        wrapper.classList.add("collapsed");
        btn.classList.remove("expanded");
        btn.querySelector("span").textContent = "Show More";
        wrapper.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
};

function renderTicketActivity(activity) {
    const listEl = document.getElementById('sd-timeline-list');
    if (!listEl) return;
    if (!activity || !activity.length) {
        listEl.innerHTML = '<div class="tl-empty" style="padding:16px;text-align:center;color:var(--ink-soft);font-size:13px;">No activity found.</div>';
        return;
    }
    listEl.innerHTML = _buildTimelineHTML(activity);
}

function openContactDetail(contact, skipHash) {
    const fullName = `${contact.first_name} ${contact.last_name || ''}`.trim();
    const setText = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.textContent = val || '-';
    };

    setText('cd-fullname', fullName);
    setText('cd-designation-sub', contact.designation || 'Contact');

    const primaryPill = document.getElementById('cd-primary-pill');
    if (primaryPill) { primaryPill.style.display = contact.is_primary_contact ? '' : 'none'; }

    setText('cd-name-hero', fullName);
    setText('cd-email-hero', contact.email_id || '-');
    setText('cd-phone-hero', contact.mobile_no || contact.phone || '-');
    setText('cd-designation-hero', contact.designation || '-');

    setText('cd-first-name', contact.first_name);
    setText('cd-last-name', contact.last_name || '-');
    setText('cd-email', contact.email_id);
    setText('cd-mobile', contact.mobile_no || '-');
    setText('cd-phone', contact.phone || '-');
    setText('cd-designation', contact.designation || '-');

    pfGo('contact-detail', null, true);
    if (!skipHash && contact) {
        const identifier = contact.name || contact.first_name;
        if (identifier) {
            updateUrlPath('contacts/' + encodeURIComponent(identifier));
        }
    }
}

function handleUrlRoute() {
    if (!portalData) return;

    let routeStr = '';

    // Check pathname first
    const currentPath = window.location.pathname;
    if (currentPath.includes('/customer-portal-view')) {
        routeStr = currentPath.replace(/^.*\/customer-portal-view\/?/, '');
    }

    // Fallback to hash if pathname clean
    if (!routeStr && window.location.hash) {
        routeStr = window.location.hash.replace('#', '').trim();
    }

    if (!routeStr) {
        routeStr = 'overview';
    }

    const parts = routeStr.split('/');
    const mainTab = parts[0].toLowerCase();
    const detailId = parts.length > 1 ? decodeURIComponent(parts.slice(1).join('/')) : null;

    const validTabs = ['overview', 'renewals', 'invoices', 'orders', 'support', 'contacts', 'settings'];

    if (!validTabs.includes(mainTab)) {
        pfGoByName('overview', true);
        return;
    }

    if (detailId) {
        if (mainTab === 'support' && detailId === 'new') {
            openNewTicketPage(true);
            return;
        }

        let found = false;
        if (mainTab === 'renewals' && portalData.renewals) {
            const rec = portalData.renewals.find(r => r.name === detailId);
            if (rec) { openRenewalDetail(rec, true); found = true; }
        } else if (mainTab === 'invoices' && portalData.invoices) {
            const rec = portalData.invoices.find(inv => inv.name === detailId);
            if (rec) { openInvoiceDetail(rec, true); found = true; }
        } else if (mainTab === 'orders' && portalData.orders) {
            const rec = portalData.orders.find(o => o.name === detailId);
            if (rec) { openOrderDetail(rec, true); found = true; }
        } else if (mainTab === 'support') {
            const ticketsList = (portalData && portalData.tickets) ? portalData.tickets : (portalData && portalData.support ? portalData.support.tickets : []);
            let rec = ticketsList ? ticketsList.find(t => t.name === detailId) : null;
            if (!rec && detailId && detailId !== 'new') {
                rec = { name: detailId, subject: 'Support Ticket', status: 'Open' };
            }
            if (rec) { openTicketDetail(rec, true); found = true; }
        } else if (mainTab === 'contacts' && portalData.contacts) {
            const rec = portalData.contacts.find(c => c.name === detailId || c.first_name === detailId || (c.first_name + ' ' + (c.last_name || '')).trim() === detailId);
            if (rec) { openContactDetail(rec, true); found = true; }
        }

        if (!found) {
            pfGoByName(mainTab, true);
        }
    } else {
        pfGoByName(mainTab, true);
    }
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
            class: 'pf-invoice-dl-btn',
            title: 'View / Download Invoice'
        }, [cel('i', { class: 'ti ti-printer' })]);

        btn.addEventListener('click', function (e) {
            e.stopPropagation();
            // Show loading state
            btn.disabled = true;
            btn.querySelector('i').className = 'ti ti-loader-2';
            btn.style.animation = 'spin 1s linear infinite';

            frappe.call({
                method: 'customer_portal.api-customer-portal-view.download_invoice_pdf',
                args: { invoice_name: inv.name },
                callback: function (r) {
                    btn.disabled = false;
                    btn.querySelector('i').className = 'ti ti-printer';
                    btn.style.animation = '';

                    if (r.message && r.message.pdf_b64) {
                        // Decode base64 → binary → Blob → blob URL → open in new tab
                        const b64 = r.message.pdf_b64;
                        const binary = atob(b64);
                        const bytes = new Uint8Array(binary.length);
                        for (let i = 0; i < binary.length; i++) {
                            bytes[i] = binary.charCodeAt(i);
                        }
                        const blob = new Blob([bytes], { type: 'application/pdf' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = r.message.filename || (inv.name + '.pdf');
                        a.target = '_blank';
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        // Revoke after short delay
                        setTimeout(() => URL.revokeObjectURL(url), 5000);
                    } else {
                        frappe.msgprint('Could not generate invoice PDF. Please try again.');
                    }
                },
                error: function (r) {
                    btn.disabled = false;
                    btn.querySelector('i').className = 'ti ti-printer';
                    btn.style.animation = '';
                    const msg = (r && r.exc_type === 'PermissionError')
                        ? 'You do not have permission to download this invoice.'
                        : 'Failed to download invoice. Please try again.';
                    frappe.msgprint(msg);
                }
            });
        });

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

function filterRenewals(resetLimit = true) {
    if (!portalData) return;

    const state = paginationState['renewals'];
    if (resetLimit) {
        const sizeSelect = document.getElementById(state.sizeId);
        state.limit = sizeSelect ? parseInt(sizeSelect.value, 10) : 10;
    }

    const queryInput = document.getElementById('renewal-search-input');
    const query = queryInput ? queryInput.value.toLowerCase().trim() : '';
    const statusSelect = document.getElementById('renewal-status-filter');
    const status = statusSelect ? statusSelect.value : 'All';

    let filtered = portalData.renewals || [];
    if (status !== 'All') {
        filtered = filtered.filter(ren => ren.status === status);
    }
    if (query) {
        filtered = filtered.filter(ren =>
            (ren.name && ren.name.toLowerCase().includes(query)) ||
            (ren.product_name && ren.product_name.toLowerCase().includes(query)) ||
            (ren.invoice_no && ren.invoice_no.toLowerCase().includes(query)) ||
            (ren.domain_name && ren.domain_name.toLowerCase().includes(query))
        );
    }

    state.data = filtered;
    renderPaginatedList('renewals');
}

function filterOrders(resetLimit = true) {
    if (!portalData) return;

    const state = paginationState['orders'];
    if (resetLimit) {
        const sizeSelect = document.getElementById(state.sizeId);
        state.limit = sizeSelect ? parseInt(sizeSelect.value, 10) : 10;
    }

    const queryInput = document.getElementById('order-search-input');
    const query = queryInput ? queryInput.value.toLowerCase().trim() : '';
    const statusSelect = document.getElementById('order-status-filter');
    const status = statusSelect ? statusSelect.value : 'All';

    let filtered = portalData.orders || [];
    if (status !== 'All') {
        filtered = filtered.filter(o => o.status === status);
    }
    if (query) {
        filtered = filtered.filter(o => o.name && o.name.toLowerCase().includes(query));
    }

    state.data = filtered;
    renderPaginatedList('orders');
}

function filterInvoices(resetLimit = true) {
    if (!portalData) return;

    const state = paginationState['invoices'];
    if (resetLimit) {
        const sizeSelect = document.getElementById(state.sizeId);
        state.limit = sizeSelect ? parseInt(sizeSelect.value, 10) : 10;
    }

    const queryInput = document.getElementById('invoice-search-input');
    const query = queryInput ? queryInput.value.toLowerCase().trim() : '';
    const statusSelect = document.getElementById('invoice-status-filter');
    const status = statusSelect ? statusSelect.value : 'All';

    let filtered = portalData.invoices || [];
    if (status === 'Open') {
        filtered = filtered.filter(inv => inv.outstanding_amount > 0 || (inv.status && inv.status !== 'Paid'));
    } else if (status !== 'All') {
        filtered = filtered.filter(inv => inv.status === status);
    }
    if (query) {
        filtered = filtered.filter(inv => inv.name.toLowerCase().includes(query));
    }

    state.data = filtered;
    renderPaginatedList('invoices');
}

function filterTickets() {
    const queryInput = document.getElementById('ticket-search-input');
    const query = queryInput ? queryInput.value.toLowerCase().trim() : '';
    const statusSelect = document.getElementById('ticket-status-filter');
    const status = statusSelect ? statusSelect.value : 'All';
    const state = paginationState.support;

    let filtered = portalData.support.tickets || [];
    if (status === 'Open') {
        filtered = filtered.filter(t => t.status && t.status !== 'Closed' && t.status !== 'Resolved');
    } else if (status !== 'All') {
        filtered = filtered.filter(t => t.status === status);
    }
    if (query) {
        filtered = filtered.filter(t =>
            t.name.toLowerCase().includes(query) ||
            (t.subject && t.subject.toLowerCase().includes(query)) ||
            (t.raised_by && t.raised_by.toLowerCase().includes(query))
        );
    }

    state.data = filtered;
    renderPaginatedList('support');
}

function openNewTicketPage(skipHash) {
    pfGo('support-new', null, true);
    if (!skipHash) {
        updateUrlPath('support/new');
    }
    initCustomerPortalWizard();
    const subjectInput = document.getElementById('ticket-subject');
    if (subjectInput) {
        setTimeout(() => subjectInput.focus(), 250);
    }
}

/* ─── CUSTOMER PORTAL SUPPORT TICKET WIZARD ─── */
let cpWizStep = 1;
let cpSelectedContacts = [];
let cpSelectedDept = "";
let cpSelectedSub = null;
let cpSelectedQuery = "";
let cpSelectedPriority = "Medium";
let cpUploadedFiles = [];
let cpActiveQueryTypes = null;

const CP_DEPARTMENTS = [
    { id: "Technical", name: "Technical", desc: "", icon: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>', color: "#2563eb", bg: "rgba(37, 99, 235, 0.1)" },
    { id: "Accounts Team & Billing", name: "Accounts & Billing", desc: "", icon: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>', color: "#0f766e", bg: "rgba(15, 118, 110, 0.1)" },
    { id: "Sales", name: "Sales", desc: "", icon: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>', color: "#8b5cf6", bg: "rgba(139, 92, 246, 0.1)" },
    { id: "Demo", name: "Demo", desc: "", icon: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>', color: "#d97706", bg: "rgba(217, 119, 6, 0.1)" },
    { id: "Licence Activation", name: "Licence Activation", desc: "", icon: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>', color: "#ea580c", bg: "rgba(234, 88, 12, 0.1)" },
    { id: "Other", name: "Other", desc: "", icon: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>', color: "#64748b", bg: "rgba(100, 116, 139, 0.1)" }
];

function initCustomerPortalWizard() {
    if (!portalData) return;

    // Customer & Sales Person auto display
    const custName = (portalData.customer_info && portalData.customer_info.customer_name) ? portalData.customer_info.customer_name : "-";
    const salesPerson = (portalData.customer_info && portalData.customer_info.sales_person) ? portalData.customer_info.sales_person : "Default Account Manager";

    const custEl = document.getElementById('cp-wiz-customer-name');
    if (custEl) custEl.textContent = custName;

    const salesEl = document.getElementById('cp-wiz-sales-person');
    if (salesEl) salesEl.textContent = salesPerson;

    // Set Default Contact Person to customer's TPOC contact or logged-in user contact
    const userEmail = (window.userEmail || "").toLowerCase().trim();
    let defaultContact = null;

    if (portalData.contacts && portalData.contacts.length > 0) {
        // Priority 1: Check for explicit TPOC contact in portalData.contacts (matching ticket_list.js)
        defaultContact = portalData.contacts.find(c => c.tpoc || c.custom_tpoc);

        // Priority 2: Check for logged-in user email match
        if (!defaultContact && userEmail) {
            defaultContact = portalData.contacts.find(c => c.email_id && c.email_id.toLowerCase().trim() === userEmail);
        }

        // Priority 3: Check for primary contact
        if (!defaultContact) {
            defaultContact = portalData.contacts.find(c => c.is_primary_contact || c.is_primary) || portalData.contacts[0];
        }
    }

    if (defaultContact) {
        defaultContact = { ...defaultContact, tpoc: 1, custom_tpoc: 1 };
        // Sync to portalData.contacts so modal check is true as well
        const pContact = portalData.contacts.find(c => c.name === defaultContact.name || (c.email_id && c.email_id === defaultContact.email_id));
        if (pContact) {
            pContact.tpoc = 1;
            pContact.custom_tpoc = 1;
        }
    } else {
        defaultContact = {
            first_name: window.userEmail ? window.userEmail.split('@')[0] : "Customer",
            last_name: "",
            email_id: window.userEmail || "customer@example.com",
            phone: "",
            designation: "Contact Person",
            tpoc: 1,
            custom_tpoc: 1,
            is_primary: true
        };
    }

    cpSelectedContacts = [defaultContact];
    cpRenderContactCard();

    // Department & Active Subscription & Query Cards (NO default department)
    cpSelectedDept = "";
    cpRenderSelectedDept();

    cpSelectedSub = null;
    cpActiveQueryTypes = null;
    cpRenderSelectedSub();

    cpSelectedQuery = "";
    cpRenderSelectedQuery();

    // Priority Grid selection default
    cpSelectPriority(cpSelectedPriority);

    // Reset step
    cpGoToStep(1);
}

/* ─── CONTACT PERSON MODEL & MULTI-SELECTION ─── */
function cpRenderContactCard() {
    const wrap = document.getElementById("cp-wizard-contacts-list");
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
        const firstName = c.first_name || "";
        const lastName = c.last_name || "";
        const nameStr = `${firstName} ${lastName}`.trim() || c.name || c.email_id || "Customer Contact";

        let initials = "US";
        if (firstName && lastName) {
            initials = (firstName[0] + lastName[0]).toUpperCase();
        } else if (firstName) {
            initials = firstName.substring(0, 2).toUpperCase();
        } else if (nameStr) {
            initials = nameStr.substring(0, 2).toUpperCase();
        }

        const subDetails = [
            c.email_id ? `📧 ${c.email_id}` : '',
            (c.phone || c.mobile_no) ? `📱 ${c.phone || c.mobile_no}` : '',
            c.designation ? `· ${c.designation}` : ''
        ].filter(Boolean).join('  ');

        const isTpoc = (c.tpoc || c.custom_tpoc) ? 1 : 0;

        const card = cel('div', { class: 'cp-contact-card', style: 'margin-bottom:8px;' }, [
            cel('div', { class: 'cp-cc-avatar', textContent: initials }),
            cel('div', { class: 'cp-cc-body' }, [
                cel('div', { class: 'cp-cc-top' }, [
                    cel('div', { class: 'cp-cc-name', textContent: nameStr }),
                    isTpoc ? cel('span', { class: 'tpoc-badge-green', title: 'Technical Point of Contact', textContent: '✓ TPOC' }) : null
                ].filter(Boolean)),
                cel('div', { class: 'cp-cc-sub', textContent: subDetails || 'Contact Details' })
            ]),
            cel('button', {
                type: 'button',
                class: 'cp-cc-remove-btn',
                title: 'Remove contact',
                onclick: () => cpRemoveContact(idx)
            }, [
                cel('i', { class: 'ti ti-x' })
            ])
        ]);

        wrap.appendChild(card);
    });
}

function cpRemoveContact(idx) {
    cpSelectedContacts.splice(idx, 1);
    cpRenderContactCard();
}

/* ─── SUPPORT TICKET CONTACT PICKER MODAL ─── */
let cpContactModalMode = 'wizard'; // 'wizard' (for ticket creation) or 'detail' (for ticket detail view)

function cpOpenContactModal() {
    cpContactModalMode = 'wizard';
    const modal = document.getElementById("cp-contact-modal");
    if (modal) modal.style.display = "flex";
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
    const modal = document.getElementById("cp-contact-modal");
    if (modal) modal.style.display = "none";
}

function cpSwitchContactTab(tabName) {
    if (tabName === 'manual') {
        cpCloseContactModal();
        openContactWizModal(null);
        return;
    }
    const tabExisting = document.getElementById("cp-ctab-existing");
    const tabManual = document.getElementById("cp-ctab-manual");
    const paneExisting = document.getElementById("cp-cpane-existing");

    if (tabExisting) tabExisting.classList.add("active");
    if (tabManual) tabManual.classList.remove("active");
    if (paneExisting) paneExisting.classList.add("active");
    cpRenderContactModalList();
}

function cpRenderContactModalList() {
    const list = document.getElementById("cp-contacts-modal-list");
    if (!list) return;
    list.replaceChildren();

    const contacts = (portalData && portalData.contacts) ? portalData.contacts : [];
    if (!contacts.length) {
        list.appendChild(cel('div', { style: 'padding:16px;text-align:center;color:var(--ink-soft);' }, [
            document.createTextNode("No existing contacts found for this account. Click 'Add New Contact' to create one.")
        ]));
        return;
    }

    contacts.forEach(c => {
        const nameStr = `${c.first_name || ''} ${c.last_name || ''}`.trim() || c.name || c.email_id;
        const isSel = cpSelectedContacts.some(sc => sc.name === c.name || (sc.email_id && sc.email_id === c.email_id));
        const selObj = cpSelectedContacts.find(sc => sc.name === c.name || (sc.email_id && sc.email_id === c.email_id));
        const isTpoc = selObj ? Boolean(selObj.tpoc || selObj.is_primary) : Boolean(c.tpoc || c.custom_tpoc);

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
                    const val = e.target.checked ? 1 : 0;
                    c.tpoc = val;
                    c.custom_tpoc = val;
                    if (selObj) {
                        selObj.tpoc = val;
                        selObj.is_primary = val;
                        selObj.custom_tpoc = val;
                    }
                    if (cpContactModalMode === 'detail' && window.currentPortalTicketName) {
                        cpSaveTicketDetailContacts();
                    } else {
                        cpRenderContactCard();
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
    } else {
        const tpocChk = document.getElementById(`cp-existing-tpoc-${c.name || c.email_id}`);
        const hasTpoc = cpSelectedContacts.some(sc => sc.tpoc);
        const isTpoc = tpocChk ? (tpocChk.checked ? 1 : (!hasTpoc ? 1 : 0)) : (c.tpoc || c.custom_tpoc || !hasTpoc ? 1 : 0);
        cpSelectedContacts.push({ ...c, tpoc: isTpoc });
    }

    if (cpContactModalMode === 'detail' && window.currentPortalTicketName) {
        cpSaveTicketDetailContacts();
    } else {
        cpCloseContactModal();
        cpRenderContactCard();
        cpRenderContactModalList();
    }
}

function cpSaveTicketDetailContacts() {
    if (!window.currentPortalTicketName) return;
    if (window.cpIsSavingTicketContacts) return;
    window.cpIsSavingTicketContacts = true;

    frappe.call({
        method: "customer_portal.api-customer-portal-view.update_ticket_contacts",
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
                cpRenderContactModalList();
            }
        },
        error: function (err) {
            window.cpIsSavingTicketContacts = false;
            showPortalToast((err && err.message) || "Failed to update ticket contacts.", "error");
        }
    });
}

/* ─── 5-STEP CONTACT WIZARD MODAL CONTROLLER (Matching customer_list) ─── */
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
            method: "customer_portal.api-customer-portal-view.get_contact_detail",
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
                    class: 'pf-btn btn-sm',
                    style: 'font-size:10px;padding:2px 8px;',
                    onclick: () => {
                        cpWizContactEmails.forEach((e, i) => e.is_primary = (i === idx ? 1 : 0));
                        cpRenderModalEmails();
                    }
                }, [document.createTextNode("Set Primary")]) : null,
                cel('button', {
                    type: 'button',
                    class: 'pf-btn btn-sm',
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
                class: 'pf-btn btn-sm',
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
        method: "customer_portal.api-customer-portal-view.save_contact",
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
                    const idx = portalData.contacts.findIndex(c => c.name === updatedContact.name || c.id === updatedContact.name);
                    if (idx >= 0) {
                        portalData.contacts[idx] = { ...portalData.contacts[idx], ...updatedContact };
                    } else {
                        portalData.contacts.unshift(updatedContact);
                    }
                }

                updateContactsCountUI();
                showPortalToast(docId ? "Contact updated successfully!" : "Contact created successfully!", "success");
                cpCloseContactWizModal();

                if (cpContactModalMode === 'detail' && window.currentPortalTicketName) {
                    const selIdx = cpSelectedContacts.findIndex(c => c.name === updatedContact.name || (c.email_id && c.email_id === updatedContact.email_id));
                    if (selIdx >= 0) {
                        cpSelectedContacts[selIdx] = { ...cpSelectedContacts[selIdx], ...updatedContact };
                    } else {
                        cpSelectedContacts.push({ ...updatedContact, tpoc: isTpoc });
                    }
                    cpSaveTicketDetailContacts();
                }
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



function updateContactsCountUI() {
    const total = (portalData && portalData.contacts) ? portalData.contacts.length : 0;
    const subTitle = document.getElementById("contacts-sub-title");
    if (subTitle) subTitle.textContent = `${total} people on this account`;

    const qaDesc = document.getElementById("qa-contact-desc");
    if (qaDesc) qaDesc.textContent = `${total} on this account`;

    if (typeof renderPaginatedList === 'function') {
        renderPaginatedList('contacts');
    }
}

/* ─── DEPARTMENT MODEL CARD & MODAL ─── */
function cpRenderSelectedDept() {
    const card = document.getElementById("cp-selected-dept-card");
    if (!card) return;
    card.replaceChildren();

    if (!cpSelectedDept) {
        card.className = "selected-model-card placeholder-state";
        card.style.borderStyle = "dashed";
        card.appendChild(cel('div', { class: 'smc-left' }, [
            cel('div', { class: 'smc-ico placeholder', innerHTML: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>' }),
            cel('div', { class: 'smc-info' }, [
                cel('div', { class: 'smc-title placeholder', textContent: "Select Department" })
            ])
        ]));
        cpUpdateDeptVisibility();
        return;
    }

    card.className = "selected-model-card";
    card.style.borderStyle = "solid";

    const d = CP_DEPARTMENTS.find(dept => dept.id === cpSelectedDept) || CP_DEPARTMENTS[0];

    const leftWrap = cel('div', { class: 'smc-left' }, [
        cel('div', {
            class: 'smc-ico',
            style: `background: ${d.bg}; color: ${d.color};`,
            innerHTML: d.icon
        }),
        cel('div', { class: 'smc-info' }, [
            cel('div', { class: 'smc-title', textContent: d.name }),
            cel('div', { class: 'smc-sub', textContent: d.desc })
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
    const modal = document.getElementById("cp-dept-modal");
    if (modal) modal.style.display = "flex";
    cpRenderDeptModalGrid();
}

function cpCloseDeptModal() {
    const modal = document.getElementById("cp-dept-modal");
    if (modal) modal.style.display = "none";
}

function cpRenderDeptModalGrid() {
    const grid = document.getElementById("cp-dept-modal-grid");
    if (!grid) return;
    grid.className = "cp-dept-grid";
    grid.replaceChildren();

    CP_DEPARTMENTS.forEach(d => {
        const isSel = cpSelectedDept === d.id;
        const tile = cel('div', {
            class: 'cp-dept-tile model-tile ' + (isSel ? 'selected' : ''),
            onclick: () => cpSelectDept(d.id)
        }, [
            cel('div', {
                class: 'cp-dept-icon model-tile-ico',
                style: `background: ${d.bg}; color: ${d.color};`,
                innerHTML: d.icon
            }),
            cel('div', { class: 'cp-dept-info' }, [
                cel('div', { class: 'cp-dept-title model-tile-title', textContent: d.name }),
                cel('div', { class: 'cp-dept-desc model-tile-sub', textContent: d.desc || "" })
            ]),
            cel('div', { class: 'cp-dept-chk model-tile-chk', innerHTML: '<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>' })
        ]);
        grid.appendChild(tile);
    });
}

function cpSelectDept(deptId) {
    cpSelectedDept = deptId;
    cpRenderSelectedDept();
    cpCloseDeptModal();
}

function cpUpdateDeptVisibility() {
    const isTech = cpSelectedDept === "Technical";

    // Active Subscription field: only visible for Technical department
    const subGrp = document.getElementById("cp-sub-grp");
    if (subGrp) {
        subGrp.style.display = isTech ? "block" : "none";
    }

    // Category / Query Type field: only visible for Technical department
    const queryGrp = document.getElementById("cp-query-type-grp");
    if (queryGrp) {
        queryGrp.style.display = isTech ? "block" : "none";
    }

    if (!isTech) {
        cpSelectedSub = null;
        cpSelectedQuery = "";
        cpActiveQueryTypes = null;
    }
}

/* ─── ACTIVE SUBSCRIPTION MODEL CARD & MODAL (FILTERED TO ACTIVE & DYNAMIC QUERY TYPES) ─── */
function cpRenderSelectedSub() {
    const card = document.getElementById("cp-selected-sub-card");
    if (!card) return;
    card.replaceChildren();

    if (!cpSelectedSub) {
        card.className = "selected-model-card placeholder-state";
        card.style.borderStyle = "dashed";
        card.appendChild(cel('div', { class: 'smc-left' }, [
            cel('div', { class: 'smc-ico placeholder', innerHTML: '<i class="ti ti-plus"></i>' }),
            cel('div', { class: 'smc-info' }, [
                cel('div', { class: 'smc-title placeholder', textContent: "Select Active Subscription / Asset" })
            ])
        ]));
        return;
    }

    card.className = "selected-model-card";
    card.style.borderStyle = "solid";

    const leftWrap = cel('div', { class: 'smc-left' }, [
        cel('div', { class: 'smc-ico sub-icon', innerHTML: '<i class="ti ti-box"></i>' }),
        cel('div', { class: 'smc-info' }, [
            cel('div', { class: 'smc-title', textContent: cpSelectedSub.product_name || cpSelectedSub.name }),
            cel('div', { class: 'smc-sub', textContent: `Ref: ${cpSelectedSub.name} · Qty: ${cpSelectedSub.total_quantity || 1} · End Date: ${formatDate(cpSelectedSub.end_date)}` })
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
    const modal = document.getElementById("cp-sub-modal");
    if (modal) modal.style.display = "flex";
    cpRenderSubModalList();
}

function cpCloseSubModal() {
    const modal = document.getElementById("cp-sub-modal");
    if (modal) modal.style.display = "none";
}

function cpFilterSubscriptions(query) {
    cpRenderSubModalList(query);
}

function cpRenderSubModalList(filterQuery = "") {
    const list = document.getElementById("cp-sub-modal-list");
    if (!list) return;
    list.replaceChildren();

    // Filter to ONLY ACTIVE subscriptions (status === 'Active' or end_date in future)
    let items = (portalData && portalData.renewals) ? portalData.renewals : [];
    items = items.filter(s => {
        if (!s) return false;
        const status = (s.status || '').toLowerCase();
        if (status === 'cancelled' || status === 'expired') return false;
        if (s.end_date) {
            const days = Math.ceil((new Date(s.end_date) - new Date()) / (1000 * 60 * 60 * 24));
            if (days < -30) return false; // hide subscriptions expired over 30 days ago
        }
        return true;
    });

    if (filterQuery.trim()) {
        const q = filterQuery.toLowerCase().trim();
        items = items.filter(s =>
            (s.product_name || "").toLowerCase().includes(q) ||
            (s.name || "").toLowerCase().includes(q) ||
            (s.domain_name || "").toLowerCase().includes(q)
        );
    }

    if (!items.length) {
        list.appendChild(cel('div', { style: 'padding:20px;text-align:center;color:var(--ink-soft);font-size:13px;' }, [
            document.createTextNode(filterQuery ? "No matching active subscriptions found." : "No active subscriptions or assets found for this customer.")
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
    cpRenderSelectedSub();
    cpCloseSubModal();

    // Fetch dynamic SLA Tasks / custom_query_type for the selected subscription from Python backend
    if (subItem && subItem.name) {
        frappe.call({
            method: "renewal_module.custom_module.page.ticket_list.ticket_list.get_sla_tasks_for_subscription",
            args: {
                subscription_name: subItem.name
            },
            callback: function (r) {
                const tasks = r.message || [];
                if (tasks.length) {
                    const taskSvg = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>';
                    cpActiveQueryTypes = tasks.map(t => ({
                        id: t.task_name,
                        name: t.task_name,
                        desc: t.description,
                        icon: taskSvg
                    }));
                    // Do NOT auto-select the first option; keep empty so user manually selects in modal
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
    cpActiveQueryTypes = null;
    cpRenderSelectedSub();
    cpRenderSelectedQuery();
}

/* ─── CATEGORY / QUERY TYPE MODEL CARD & MODAL ─── */
function cpRenderSelectedQuery() {
    const card = document.getElementById("cp-selected-query-card");
    if (!card) return;
    card.replaceChildren();

    // If Technical department and no subscription selected yet, show placeholder state matching ticket_list.js
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

    const queryList = (cpActiveQueryTypes && cpActiveQueryTypes.length > 0) ? cpActiveQueryTypes : "";
    const defaultSvg = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>';
    const q = queryList.find(item => item.id === cpSelectedQuery || item.name === cpSelectedQuery) || queryList[0] || {
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
    const modal = document.getElementById("cp-query-modal");
    if (modal) modal.style.display = "flex";
    cpRenderQueryModalGrid();
}

function cpCloseQueryModal() {
    const modal = document.getElementById("cp-query-modal");
    if (modal) modal.style.display = "none";
}

function cpRenderQueryModalGrid() {
    const grid = document.getElementById("cp-query-modal-grid");
    if (!grid) return;
    grid.replaceChildren();

    // If Technical department and no sub selected, show empty state matching ticket_list.js
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
    const typesToRender = [...cpActiveQueryTypes];

    typesToRender.forEach(q => {
        const isSel = cpSelectedQuery === q.id || cpSelectedQuery === q.name;
        const defaultSvg = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>';
        const chkSvg = '<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>';

        const tile = cel('div', {
            class: 'cp-dept-tile model-tile ' + (isSel ? 'selected' : ''),
            onclick: () => cpSelectQuery(q.id || q.name)
        }, [
            cel('div', { class: 'cp-dept-icon model-tile-ico query-icon', innerHTML: q.icon || defaultSvg }),
            cel('div', { class: 'cp-dept-info' }, [
                cel('div', { class: 'cp-dept-title model-tile-title', textContent: q.name }),
                cel('div', { class: 'cp-dept-desc model-tile-sub', textContent: q.desc })
            ]),
            cel('div', { class: 'cp-dept-chk model-tile-chk', innerHTML: chkSvg })
        ]);
        grid.appendChild(tile);
    });
}

function cpSelectQuery(queryName) {
    cpSelectedQuery = queryName;
    cpRenderSelectedQuery();
    cpCloseQueryModal();
}

function cpSelectPriority(priority) {
    cpSelectedPriority = priority;
    const cards = document.querySelectorAll('#cp-prio-grid .cp-prio-card');
    cards.forEach(card => {
        if (card.dataset.priority === priority) {
            card.classList.add('sel');
        } else {
            card.classList.remove('sel');
        }
    });

    const hiddenSelect = document.getElementById('ticket-priority');
    if (hiddenSelect) hiddenSelect.value = priority;
}

/* ─── 4-STEP WIZARD STEPPER NAVIGATION ─── */
function cpGoToStep(step) {
    cpWizStep = step;

    for (let i = 1; i <= 4; i++) {
        const ind = document.getElementById(`cp-step-indicator-${i}`);
        const pnl = document.getElementById(`cp-step-panel-${i}`);
        if (ind) {
            if (i === step) {
                ind.className = 'cp-step-item active';
            } else if (i < step) {
                ind.className = 'cp-step-item done';
            } else {
                ind.className = 'cp-step-item';
            }
        }
        if (pnl) {
            pnl.className = 'cp-step-panel ' + (i === step ? 'active' : '');
        }
    }

    if (step === 4) {
        cpUpdateSummary();
    }
}

function cpGoNextStep(currentStep) {
    if (currentStep === 1) {
        const subj = (document.getElementById('ticket-subject').value || '').trim();
        if (!subj) {
            alert("Please enter a subject for your ticket.");
            document.getElementById('ticket-subject').focus();
            return;
        }
        if (!cpSelectedContacts || cpSelectedContacts.length === 0) {
            alert("Please select or add at least one Contact Person.");
            return;
        }
    } else if (currentStep === 2) {
        if (!cpSelectedDept) {
            alert("Please select a Department.");
            return;
        }
        if (cpSelectedDept === "Technical" && !cpSelectedQuery) {
            alert("Please select a Category / Query Type.");
            return;
        }
    } else if (currentStep === 3) {
        const details = (document.getElementById('ticket-details').value || '').trim();
        if (!details) {
            alert("Please enter a detailed description of the issue.");
            document.getElementById('ticket-details').focus();
            return;
        }
    }
    cpGoToStep(currentStep + 1);
}

function cpGoPrevStep(currentStep) {
    cpGoToStep(currentStep - 1);
}

function cpUpdateSummary() {
    const custName = (portalData.customer_info && portalData.customer_info.customer_name) ? portalData.customer_info.customer_name : "-";
    const salesPerson = (portalData.customer_info && portalData.customer_info.sales_person) ? portalData.customer_info.sales_person : "Not Assigned";
    const subj = document.getElementById('ticket-subject').value.trim() || "-";

    let contactStr = "-";
    if (cpSelectedContacts && cpSelectedContacts.length > 0) {
        contactStr = cpSelectedContacts.map(c => {
            return `${c.first_name || ''} ${c.last_name || ''}`.trim() || c.name || c.email_id;
        }).join(", ");
    }

    const activeSubStr = cpSelectedSub ? (cpSelectedSub.product_name || cpSelectedSub.name) : "None";

    setText('cp-sum-customer', custName);
    setText('cp-sum-sales-person', salesPerson);
    setText('cp-sum-subject', subj);
    setText('cp-sum-contact', contactStr);
    setText('cp-sum-dept', cpSelectedDept);
    setText('cp-sum-sub', activeSubStr);
    setText('cp-sum-category', cpSelectedQuery);
    setText('cp-sum-priority', cpSelectedPriority);
    setText('cp-sum-files', `${cpUploadedFiles.length} file(s) attached`);
}

function cpHandleFiles(files) {
    if (!files || !files.length) return;
    Array.from(files).forEach(file => {
        frappe.call({
            method: "customer_portal.api-customer-portal-view.upload_portal_attachment",
            args: {},
            files: { file: file },
            callback: function (r) {
                if (r.message && r.message.status === "success") {
                    cpUploadedFiles.push({
                        file_url: r.message.file_url,
                        name: r.message.name,
                        file_name: r.message.file_name || file.name
                    });
                    cpRenderAttachmentsList();
                } else {
                    const reader = new FileReader();
                    reader.onload = function (e) {
                        const base64Data = e.target.result;
                        frappe.call({
                            method: "customer_portal.api-customer-portal-view.upload_portal_attachment",
                            args: {
                                filename: file.name,
                                filedata: base64Data
                            },
                            callback: function (res) {
                                if (res.message && res.message.status === "success") {
                                    cpUploadedFiles.push({
                                        file_url: res.message.file_url,
                                        name: res.message.name,
                                        file_name: res.message.file_name || file.name
                                    });
                                    cpRenderAttachmentsList();
                                } else {
                                    alert("Failed to upload " + file.name);
                                }
                            }
                        });
                    };
                    reader.readAsDataURL(file);
                }
            }
        });
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
            cel('div', { class: 'cp-att-name' }, [
                cel('i', { class: 'ti ti-paperclip', style: 'margin-right:6px;color:var(--indigo)' }),
                document.createTextNode(file.file_name)
            ]),
            cel('button', {
                type: 'button',
                class: 'cp-att-remove',
                onclick: () => cpRemoveFile(idx)
            }, [
                cel('i', { class: 'ti ti-x' })
            ])
        ]);
        wrap.appendChild(item);
    });
}

function submitTicket() {
    const btn = document.getElementById('cp-submit-btn');
    if (btn && btn.disabled) return;

    const subject = document.getElementById('ticket-subject').value.trim();
    const details = document.getElementById('ticket-details').value.trim();

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
        is_primary: c.is_primary ? 1 : 0
    }));

    const activeSubStr = cpSelectedSub ? (cpSelectedSub.product_name || cpSelectedSub.name) : "";

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
        method: "customer_portal.api-customer-portal-view.create_support_ticket",
        args: {
            subject: subject,
            description: details,
            priority: cpSelectedPriority,
            category: cpSelectedQuery,
            department: cpSelectedDept,
            active_subscription: activeSubStr,
            contact_person: contactPersonStr,
            contacts: JSON.stringify(contactsPayload),
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

                // Clear wizard fields
                document.getElementById('ticket-subject').value = '';
                document.getElementById('ticket-details').value = '';
                cpUploadedFiles = [];
                cpRenderAttachmentsList();
                cpGoToStep(1);

                // Fetch latest portal data and open ticket detail view support/<newTicketId> directly
                fetchPortalData(function () {
                    let newTicket = (portalData && portalData.tickets) ? portalData.tickets.find(t => t.name === newTicketId) : null;
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

function openEditCompanyModal() {
    toggleInlineCompanyGstin(true);
}

function closeEditCompanyModal() {
    toggleInlineCompanyGstin(false);
}

function saveCompanyDetails() {
    const inlineInput = document.getElementById('settings-gstin-inline-input');
    const modalInput = document.getElementById('modal-company-gstin');
    const settingsInput = document.getElementById('settings-gstin');

    let gstinInput = null;
    if (inlineInput && inlineInput.offsetParent !== null) {
        gstinInput = inlineInput;
    } else if (modalInput && modalInput.offsetParent !== null) {
        gstinInput = modalInput;
    } else {
        gstinInput = modalInput || inlineInput || settingsInput;
    }

    const gstin = gstinInput ? gstinInput.value.trim().toUpperCase() : '';

    if (gstinInput) gstinInput.classList.remove('input-field-error');

    if (gstin) {
        const gstinRegex = /^[0-9]{2}[A-Za-z]{5}[0-9]{4}[A-Za-z]{1}[0-9A-Za-z]{1}[Zz0-9A-Za-z]{1}[0-9A-Za-z]{1}$/;
        if (!gstinRegex.test(gstin) && gstin.length !== 15) {
            if (gstinInput) {
                gstinInput.classList.add('input-field-error');
                gstinInput.focus();
            }
            showPortalModalPopup("Invalid GSTIN number! GSTIN must be 15 characters (e.g. 37AABCA9106B1Z5).", "Validation Error", "error");
            return;
        }
    }

    const saveBtn = document.querySelector('#pf-company-modal-overlay .pf-btn.primary') ||
        document.querySelector('#settings-gstin-edit-wrapper .pf-btn.primary') ||
        document.querySelector('#page-settings .pf-btn.primary');
    let origHtml = '';
    if (saveBtn) {
        saveBtn.disabled = true;
        origHtml = saveBtn.innerHTML;
        saveBtn.innerHTML = '<i class="ti ti-loader spin"></i> Saving...';
    }

    frappe.call({
        method: "customer_portal.api-customer-portal-view.save_account_settings",
        args: {
            gstin: gstin
        },
        callback: function (r) {
            if (saveBtn) {
                saveBtn.disabled = false;
                saveBtn.innerHTML = origHtml || '<i class="ti ti-check"></i> Save Details';
            }
            if (r.message && r.message.status === "success") {
                closeEditCompanyModal();
                toggleInlineCompanyGstin(false);
                showPortalModalPopup("Company details successfully updated!", "Success", "success");
                fetchPortalData();
            } else {
                const errMsg = extractFrappeErrorMessage(r);
                showPortalModalPopup(errMsg || "An error occurred while saving company details.", "Error", "error");
            }
        },
        error: function (r) {
            if (saveBtn) {
                saveBtn.disabled = false;
                saveBtn.innerHTML = origHtml || '<i class="ti ti-check"></i> Save Details';
            }
            const errMsg = extractFrappeErrorMessage(r);
            showPortalModalPopup(errMsg || "Failed to save company details.", "Error", "error");
        }
    });
}

function toggleInlineCompanyGstin(show) {
    const wrapper = document.getElementById('settings-gstin-edit-wrapper');
    const display = document.getElementById('settings-gstin-val-wrapper');
    const input = document.getElementById('settings-gstin-inline-input');
    if (!wrapper || !display) return;
    if (show) {
        if (input) input.value = (portalData.customer_info && portalData.customer_info.gstin) || '';
        display.style.display = 'none';
        wrapper.style.display = 'flex';
        if (input) input.focus();
    } else {
        display.style.display = 'block';
        wrapper.style.display = 'none';
    }
}

function saveInlineCompanyGstin() {
    saveCompanyDetails();
}

function saveSettings() {
    saveCompanyDetails();
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
    formData.append("cmd", "customer_portal.api-customer-portal-view.upload_company_logo");

    const iconCircle = document.getElementById('pf-company-icon-circle');
    let origContent = '';
    if (iconCircle) {
        origContent = iconCircle.innerHTML;
        iconCircle.innerHTML = '<i class="ti ti-loader spin" style="font-size:24px; color:#7c3aed;"></i>';
    }

    fetch('/api/method/customer_portal.api-customer-portal-view.upload_company_logo', {
        method: 'POST',
        headers: {
            'X-Frappe-CSRF-Token': (window.frappe && window.frappe.csrf_token) || frappe.csrf_token || ''
        },
        body: formData
    })
        .then(r => r.json())
        .then(data => {
            if (data.message && data.message.status === 'success') {
                showPortalModalPopup("Company logo successfully updated!", "Success", "success");
                fetchPortalData();
            } else {
                if (iconCircle) iconCircle.innerHTML = origContent;
                const errMsg = extractFrappeErrorMessage(data);
                showPortalModalPopup(errMsg || "Failed to upload company logo.", "Error", "error");
            }
        })
        .catch(err => {
            if (iconCircle) iconCircle.innerHTML = origContent;
            showPortalModalPopup("Error uploading company logo file.", "Error", "error");
        });
}

/* ─── ADDRESS MANAGEMENT & MODAL ─── */

function populateAddressMetaOptions() {
    const typeSelect = document.getElementById('pam-type');
    if (typeSelect && portalData.address_type_options && portalData.address_type_options.length > 0) {
        const curVal = typeSelect.value || 'Billing';
        typeSelect.replaceChildren();
        portalData.address_type_options.forEach(opt => {
            typeSelect.appendChild(cel('option', { value: opt, textContent: opt }));
        });
        if (Array.from(typeSelect.options).some(o => o.value === curVal)) {
            typeSelect.value = curVal;
        }
    }

    const gstSelect = document.getElementById('pam-gst-category');
    if (gstSelect && portalData.gst_category_options && portalData.gst_category_options.length > 0) {
        const curVal = gstSelect.value || '';
        gstSelect.replaceChildren(cel('option', { value: '', textContent: '-- Select GST Category --' }));
        portalData.gst_category_options.forEach(opt => {
            gstSelect.appendChild(cel('option', { value: opt, textContent: opt }));
        });
        if (Array.from(gstSelect.options).some(o => o.value === curVal)) {
            gstSelect.value = curVal;
        }
    }
}

function renderAddressesList() {
    const container = document.getElementById('settings-addresses-list');
    if (!container) return;
    container.replaceChildren();

    const addresses = portalData.addresses || [];

    // Construct fallback billing address if backend has billing_address in customer_info
    if (addresses.length === 0 && portalData.customer_info && portalData.customer_info.billing_address) {
        const fallbackAddr = {
            name: '',
            address_title: portalData.customer_info.customer_name || 'Primary Address',
            address_type: 'Billing',
            address_line1: portalData.customer_info.billing_address,
            gstin: portalData.customer_info.gstin || '',
            is_primary_address: 1
        };
        addresses.push(fallbackAddr);
    }

    if (addresses.length === 0) {
        container.appendChild(renderEmptyState("No addresses found. Click '+ Add new address' to create one."));
        return;
    }

    let billingList = addresses.filter(a => a.address_type === "Billing" || a.is_primary_address);
    let shippingList = addresses.filter(a => a.address_type === "Shipping" || a.is_shipping_address);
    let otherList = addresses.filter(a => a.address_type !== "Billing" && !a.is_primary_address && a.address_type !== "Shipping" && !a.is_shipping_address);

    if (billingList.length === 0 && addresses.length > 0) {
        billingList = [addresses[0]];
    }

    let isShippingFallback = false;
    if (shippingList.length === 0 && billingList.length > 0) {
        shippingList = [billingList[0]];
        isShippingFallback = true;
    }

    function createAddressCardV2(a, type, isFallback = false, idx = 0) {
        const isBilling = type === 'Billing';
        const isShipping = type === 'Shipping';
        const cardClass = isBilling ? 'billing-card' : 'shipping-card';
        const iconClass = isBilling ? 'billing' : 'shipping';
        const iconName = isBilling ? 'ti ti-file-text' : 'ti ti-truck';
        const typeLabel = isBilling ? 'Billing address' : 'Shipping address';
        const companyTitle = (portalData.customer_info && portalData.customer_info.customer_name) || a.address_title || (type + ' Address');

        const line1 = a.address_line1 || '';
        const line2 = a.address_line2 || '';
        const cityState = [a.city, a.state, a.pincode].filter(Boolean).join(', ');
        const country = a.country || '';
        const addressLines = [line1, line2, cityState, country].filter(Boolean);

        const card = cel('div', { class: `pf-card-address-v2 ${cardClass}` }, [
            // Top Row
            cel('div', { class: 'pf-card-address-top' }, [
                cel('div', { class: 'pf-card-address-type-badge' }, [
                    cel('div', { class: `pf-type-icon-box ${iconClass}` }, [
                        cel('i', { class: iconName })
                    ]),
                    cel('span', { class: `pf-type-label ${iconClass}`, textContent: typeLabel })
                ]),
                cel('div', { class: 'pf-card-address-top-right' }, [
                    (a.is_primary_address || a.is_shipping_address || !isFallback) ? cel('span', { class: `pf-badge-primary ${iconClass}`, textContent: 'PRIMARY' }) : null,
                    isFallback ? cel('span', { class: 'pf-badge-primary shipping', textContent: 'SAME AS BILLING' }) : null,
                    cel('button', {
                        class: 'pf-card-dots-btn',
                        title: 'Edit Address',
                        onclick: (e) => { e.stopPropagation(); openAddressEditModal(a.name || null, isFallback ? type : null); }
                    }, [
                        cel('i', { class: 'ti ti-pencil' })
                    ])
                ])
            ]),

            // Company Name
            companyTitle ? cel('div', { class: 'pf-card-address-company', textContent: companyTitle }) : null,

            // Location Pin & Address Lines
            cel('div', { class: 'pf-card-address-location' }, [
                cel('i', { class: 'ti ti-map-pin' }),
                cel('div', { class: 'pf-card-address-lines' }, addressLines.map(l => cel('div', { textContent: l })))
            ]),

            // GSTIN Pill Tag
            a.gstin ? cel('div', { class: `pf-gstin-pill-tag ${iconClass}` }, [
                cel('i', { class: 'ti ti-receipt-tax' }),
                document.createTextNode(`GSTIN: ${a.gstin}`)
            ]) : null
        ]);

        return card;
    }

    // 2-Column Grid Container matching Image 2
    const gridDiv = cel('div', { class: 'pf-address-grid-v2' });

    // --- COLUMN 1: BILLING ADDRESS ---
    const billingCol = cel('div', { class: 'pf-address-column' });
    billingList.forEach((addr, idx) => {
        billingCol.appendChild(createAddressCardV2(addr, 'Billing', false, idx));
    });
    gridDiv.appendChild(billingCol);

    // --- COLUMN 2: SHIPPING ADDRESS ---
    const shippingCol = cel('div', { class: 'pf-address-column' });
    shippingList.forEach((addr, idx) => {
        shippingCol.appendChild(createAddressCardV2(addr, 'Shipping', isShippingFallback, idx));
    });
    gridDiv.appendChild(shippingCol);

    container.appendChild(gridDiv);

    // --- OTHER ADDRESSES (IF ANY) ---
    if (otherList.length > 0) {
        const otherGroup = cel('div', { class: 'pf-address-column full-width mt-4' });
        otherList.forEach((addr, idx) => {
            otherGroup.appendChild(createAddressCardV2(addr, 'Other', false, idx));
        });
        container.appendChild(otherGroup);
    }
}

/* ─── ADDRESS WIZARD MODAL ─── */

let currentAddressWizardStep = 1;

function goToAddressWizardStep(step) {
    if (step < 1 || step > 4) return;

    // Validate inputs when advancing to future steps
    if (step > currentAddressWizardStep) {
        if (currentAddressWizardStep === 1) {
            const title = document.getElementById('pam-title').value.trim();
            if (!title) {
                showPortalModalPopup("Please enter an Address Title to proceed.", "Validation Notice", "error");
                return;
            }
        } else if (currentAddressWizardStep === 2) {
            const line1 = document.getElementById('pam-line1').value.trim();
            const city = document.getElementById('pam-city').value.trim();
            if (!line1 || !city) {
                showPortalModalPopup("Please fill in required fields: Address Line 1 and City.", "Validation Notice", "error");
                return;
            }
        }
    }

    currentAddressWizardStep = step;

    // Switch step panels
    for (let i = 1; i <= 4; i++) {
        const panel = document.getElementById('pam-panel-' + i);
        if (panel) panel.style.display = (i === step) ? 'block' : 'none';

        const circle = document.getElementById('pam-step-circle-' + i);
        if (circle) {
            if (i < step) {
                circle.style.background = '#10b981';
                circle.style.borderColor = '#10b981';
                circle.style.color = '#ffffff';
                circle.innerHTML = '<i class="ti ti-check" style="font-size:12px;"></i>';
            } else if (i === step) {
                circle.style.background = 'var(--indigo, #4f46e5)';
                circle.style.borderColor = 'var(--indigo, #4f46e5)';
                circle.style.color = '#ffffff';
                circle.textContent = i;
            } else {
                circle.style.background = '#f1f5f9';
                circle.style.borderColor = '#cbd5e1';
                circle.style.color = '#64748b';
                circle.textContent = i;
            }
        }
    }

    // Toggle navigation buttons
    const backBtn = document.getElementById('pam-back-btn');
    const nextBtn = document.getElementById('pam-next-btn');
    const saveBtn = document.getElementById('pam-save-btn');

    if (backBtn) backBtn.style.display = (step > 1) ? 'inline-flex' : 'none';
    if (nextBtn) nextBtn.style.display = (step < 4) ? 'inline-flex' : 'none';
    if (saveBtn) saveBtn.style.display = (step === 4) ? 'inline-flex' : 'none';

    if (step === 4) {
        renderAddressReviewSummary();
    }
}

function nextAddressWizardStep() {
    goToAddressWizardStep(currentAddressWizardStep + 1);
}

function prevAddressWizardStep() {
    goToAddressWizardStep(currentAddressWizardStep - 1);
}

function renderAddressReviewSummary() {
    const summaryContainer = document.getElementById('pam-review-summary');
    if (!summaryContainer) return;

    const title = document.getElementById('pam-title').value.trim() || '--';
    const type = document.getElementById('pam-type').value || 'Billing';
    const line1 = document.getElementById('pam-line1').value.trim() || '--';
    const line2 = document.getElementById('pam-line2').value.trim();
    const city = document.getElementById('pam-city').value.trim() || '--';
    const state = document.getElementById('pam-state').value.trim();
    const country = document.getElementById('pam-country').value.trim() || 'India';
    const pincode = document.getElementById('pam-pincode').value.trim();
    const gstin = document.getElementById('pam-gstin').value.trim();
    const gstCategory = document.getElementById('pam-gst-category').value;
    const isBilling = document.getElementById('pam-is-primary-billing').checked;
    const isShipping = document.getElementById('pam-is-primary-shipping').checked;

    const fullLocation = [line1, line2, [city, state, pincode].filter(Boolean).join(', '), country].filter(Boolean).join(', ');

    summaryContainer.replaceChildren(
        cel('div', { style: 'display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #e2e8f0; padding-bottom:8px; margin-bottom:10px;' }, [
            cel('div', {}, [
                cel('div', { style: 'font-size:15px; font-weight:700; color:var(--ink);', textContent: title }),
                cel('div', { style: 'font-size:11px; font-weight:600; color:var(--indigo); text-transform:uppercase; margin-top:2px;', textContent: type + ' Address' })
            ]),
            cel('div', { style: 'display:flex; gap:4px;' }, [
                isBilling ? cel('span', { class: 'pf-badge p-purple', textContent: 'Billing' }) : null,
                isShipping ? cel('span', { class: 'pf-badge p-cyan', textContent: 'Shipping' }) : null
            ].filter(Boolean))
        ]),
        cel('div', { style: 'margin-bottom:10px;' }, [
            cel('div', { style: 'font-size:11px; font-weight:600; color:#64748b; text-transform:uppercase; margin-bottom:2px;', textContent: 'Location Address' }),
            cel('div', { style: 'color:#334155; line-height:1.5;', textContent: fullLocation })
        ]),
        gstin ? cel('div', { style: 'background:#ffffff; border:1px solid #e2e8f0; border-radius:6px; padding:8px 12px; display:flex; justify-content:space-between; align-items:center;' }, [
            cel('span', { style: 'font-size:12px; font-weight:600; color:var(--indigo);' }, ['GSTIN: ' + gstin]),
            gstCategory ? cel('span', { style: 'font-size:11px; color:#64748b;' }, ['Category: ' + gstCategory]) : null
        ]) : null
    );
}

function openAddressEditModal(docname = null, defaultType = 'Billing') {
    const modal = document.getElementById('pf-address-modal-overlay');
    if (!modal) return;

    populateAddressMetaOptions();

    const headingEl = document.getElementById('pam-modal-heading');
    const docnameInput = document.getElementById('pam-docname');

    docnameInput.value = docname || '';

    if (docname) {
        if (headingEl) headingEl.textContent = "Edit Address";
        const addr = (portalData.addresses || []).find(a => a.name === docname);
        if (addr) {
            document.getElementById('pam-title').value = addr.address_title || '';
            const typeSelect = document.getElementById('pam-type');
            if (typeSelect) typeSelect.value = addr.address_type || defaultType;
            document.getElementById('pam-line1').value = addr.address_line1 || '';
            document.getElementById('pam-line2').value = addr.address_line2 || '';
            document.getElementById('pam-city').value = addr.city || '';
            document.getElementById('pam-state').value = addr.state || '';
            document.getElementById('pam-country').value = addr.country || 'India';
            document.getElementById('pam-pincode').value = addr.pincode || '';
            document.getElementById('pam-gstin').value = addr.gstin || '';
            const gstSelect = document.getElementById('pam-gst-category');
            if (gstSelect) gstSelect.value = addr.gst_category || '';
            document.getElementById('pam-is-primary-billing').checked = Boolean(addr.is_primary_address);
            document.getElementById('pam-is-primary-shipping').checked = Boolean(addr.is_shipping_address);
        }
    } else {
        if (headingEl) headingEl.textContent = "New Address";
        document.getElementById('pam-title').value = '';
        const typeSelect = document.getElementById('pam-type');
        if (typeSelect) typeSelect.value = defaultType || 'Billing';
        document.getElementById('pam-line1').value = '';
        document.getElementById('pam-line2').value = '';
        document.getElementById('pam-city').value = '';
        document.getElementById('pam-state').value = '';
        document.getElementById('pam-country').value = 'India';
        document.getElementById('pam-pincode').value = '';
        document.getElementById('pam-gstin').value = (portalData.customer_info && portalData.customer_info.gstin) || '';
        const gstSelect = document.getElementById('pam-gst-category');
        if (gstSelect) gstSelect.value = '';
        document.getElementById('pam-is-primary-billing').checked = (defaultType === 'Billing');
        document.getElementById('pam-is-primary-shipping').checked = (defaultType === 'Shipping');
    }

    goToAddressWizardStep(1);

    modal.style.display = 'flex';
    modal.offsetHeight;
    modal.classList.add('pf-modal-show');
}

function closeAddressEditModal() {
    const modal = document.getElementById('pf-address-modal-overlay');
    if (modal) {
        modal.classList.remove('pf-modal-show');
        setTimeout(() => {
            modal.style.display = 'none';
        }, 250);
    }
}

// Global ESC key listener to close active modals
document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' || e.key === 'Esc') {
        const compModal = document.getElementById('pf-company-modal-overlay');
        if (compModal && compModal.classList.contains('pf-modal-show')) {
            closeEditCompanyModal();
        }
        const addrModal = document.getElementById('pf-address-modal-overlay');
        if (addrModal && addrModal.style.display !== 'none') {
            closeAddressEditModal();
        }
        const globalModal = document.getElementById('pf-global-modal-overlay');
        if (globalModal && globalModal.style.display !== 'none') {
            closePortalModalPopup();
        }
    }
});

function savePortalAddress() {
    const saveBtn = document.getElementById('pam-save-btn');
    if (saveBtn && saveBtn.disabled) return;

    const docname = document.getElementById('pam-docname').value;
    const title = document.getElementById('pam-title').value.trim();
    const type = document.getElementById('pam-type').value;
    const line1 = document.getElementById('pam-line1').value.trim();
    const line2 = document.getElementById('pam-line2').value.trim();
    const city = document.getElementById('pam-city').value.trim();
    const state = document.getElementById('pam-state').value.trim();
    const country = document.getElementById('pam-country').value.trim() || 'India';
    const pincode = document.getElementById('pam-pincode').value.trim();
    const gstin = document.getElementById('pam-gstin').value.trim();
    const gstCategory = document.getElementById('pam-gst-category').value;
    const isPrimaryBilling = document.getElementById('pam-is-primary-billing').checked ? 1 : 0;
    const isPrimaryShipping = document.getElementById('pam-is-primary-shipping').checked ? 1 : 0;

    if (!line1 || !city) {
        showPortalModalPopup("Please fill in required fields: Address Line 1 and City.", "Validation Notice", "error");
        return;
    }

    if (gstin) {
        const gstinRegex = /^[0-9]{2}[A-Za-z]{5}[0-9]{4}[A-Za-z]{1}[1-9A-Za-z]{1}Z[0-9A-Za-z]{1}$/;
        if (!gstinRegex.test(gstin)) {
            showPortalModalPopup("Invalid GSTIN format! Please enter a valid 15-character GSTIN (e.g. 22AAAAA0000A1Z5).", "Validation Error", "error");
            return;
        }
    }

    let origHtml = '';
    if (saveBtn) {
        saveBtn.disabled = true;
        origHtml = saveBtn.innerHTML;
        saveBtn.innerHTML = '<i class="ti ti-loader spin"></i> Saving...';
    }

    frappe.call({
        method: "customer_portal.api-customer-portal-view.save_portal_address",
        args: {
            docname: docname || null,
            address_title: title,
            address_type: type,
            address_line1: line1,
            address_line2: line2,
            city: city,
            state: state,
            country: country,
            pincode: pincode,
            gstin: gstin,
            gst_category: gstCategory,
            is_primary_billing: isPrimaryBilling,
            is_primary_shipping: isPrimaryShipping
        },
        callback: function (r) {
            if (saveBtn) {
                saveBtn.disabled = false;
                saveBtn.innerHTML = origHtml || 'Save Address';
            }
            if (r.message && r.message.status === "success") {
                closeAddressEditModal();
                showPortalModalPopup(docname ? "Address updated successfully!" : "Address saved successfully!", "Success", "success");
                fetchPortalData();
            } else {
                const errMsg = extractFrappeErrorMessage(r);
                showPortalModalPopup(errMsg || "An error occurred while saving address.", "Error", "error");
            }
        },
        error: function (r) {
            if (saveBtn) {
                saveBtn.disabled = false;
                saveBtn.innerHTML = origHtml || 'Save Address';
            }
            const errMsg = extractFrappeErrorMessage(r);
            showPortalModalPopup(errMsg || "Failed to save address.", "Error", "error");
        }
    });
}

function renderPortal() {
    const companyName = portalData.customer_info.customer_name;
    // userEmail will be populated dynamically or loaded from local global
    const emailToUse = window.userEmail || '';

    const userEmailLower = emailToUse.toLowerCase().trim();
    let userContact = null;
    if (userEmailLower && portalData.contacts && portalData.contacts.length > 0) {
        userContact = portalData.contacts.find(c => c.email_id && c.email_id.toLowerCase().trim() === userEmailLower);
    }
    if (!userContact && portalData.contacts && portalData.contacts.length > 0) {
        userContact = portalData.contacts.find(c => c.is_primary_contact) || portalData.contacts[0];
    }

    let contactFirstName = "User";
    let userDisplayName = emailToUse;
    let avatarWord = "--";

    if (userContact) {
        contactFirstName = userContact.first_name || "User";
        const lastName = userContact.last_name ? userContact.last_name.trim() : "";
        userDisplayName = (contactFirstName + (lastName ? " " + lastName : "")).trim();

        if (contactFirstName && lastName) {
            avatarWord = (contactFirstName[0] + lastName[0]).toUpperCase();
        } else if (contactFirstName) {
            avatarWord = contactFirstName.substring(0, 2).toUpperCase();
        }
    } else if (emailToUse) {
        contactFirstName = emailToUse.split('@')[0];
        userDisplayName = emailToUse;
        const cleanEmail = emailToUse.replace(/[^a-zA-Z]/g, '');
        avatarWord = cleanEmail.substring(0, 2).toUpperCase() || "US";
    } else if (companyName) {
        avatarWord = companyName.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
    }

    const sidebarCompanyEl = document.getElementById('sidebar-company');
    if (sidebarCompanyEl) {
        sidebarCompanyEl.textContent = companyName || '';
        sidebarCompanyEl.title = companyName || '';
    }
    const sidebarUserEl = document.getElementById('sidebar-user');
    if (sidebarUserEl) {
        sidebarUserEl.textContent = userDisplayName || '';
        sidebarUserEl.title = userDisplayName || '';
    }
    document.getElementById('sidebar-avatar').textContent = avatarWord;
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
            document.getElementById('overview-banner-subtitle').textContent = `${bannerRen.total_quantity} Qty · ${formatCurrency(bannerRen.total_amount)} · Auto-renew is on`;
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

    const metaStatuses = portalData.status_options || {};

    document.getElementById('renewals-sub-title').textContent = `${portalData.renewals.length} licenses on this account`;
    populateStatusDropdown('renewal-status-filter', metaStatuses.renewals, portalData.renewals, r => r.status);
    paginationState.renewals.data = portalData.renewals || [];
    paginationState.renewals.limit = 10;
    const renSelect = document.getElementById(paginationState.renewals.sizeId);
    if (renSelect) renSelect.value = "10";
    renderPaginatedList('renewals');

    document.getElementById('invoices-sub-title').textContent = `${portalData.invoices.length} invoices on this account`;
    populateStatusDropdown('invoice-status-filter', metaStatuses.invoices, portalData.invoices, inv => inv.status);
    paginationState.invoices.data = portalData.invoices || [];
    paginationState.invoices.limit = 10;
    const invSelect = document.getElementById(paginationState.invoices.sizeId);
    if (invSelect) invSelect.value = "10";
    renderPaginatedList('invoices');

    document.getElementById('orders-sub-title').textContent = `${portalData.orders.length} orders on this account`;
    populateStatusDropdown('order-status-filter', metaStatuses.orders, portalData.orders, o => o.status);
    paginationState.orders.data = portalData.orders || [];
    paginationState.orders.limit = 10;
    const ordSelect = document.getElementById(paginationState.orders.sizeId);
    if (ordSelect) ordSelect.value = "10";
    renderPaginatedList('orders');

    document.getElementById('support-sub-title').textContent = `${(portalData.support.tickets || []).length} tickets on this account`;
    populateStatusDropdown('ticket-status-filter', metaStatuses.support, portalData.support.tickets, t => t.status);

    paginationState.support.data = portalData.support.tickets || [];
    paginationState.support.limit = 10;
    const supSelect = document.getElementById(paginationState.support.sizeId);
    if (supSelect) supSelect.value = "10";
    renderPaginatedList('support');

    // ticket-category is now a model card picker (no <select>); sync issue_types to CP_QUERY_TYPES if needed
    const categorySelect = document.getElementById('ticket-category');
    if (categorySelect) {
        categorySelect.replaceChildren();
        portalData.support.issue_types.forEach(cat => {
            categorySelect.appendChild(cel('option', { value: cat, textContent: cat }));
        });
        if (portalData.support.issue_types.includes("Other")) {
            categorySelect.value = "Other";
        }
    }

    const prioritySelect = document.getElementById('ticket-priority');
    if (prioritySelect) {
        prioritySelect.replaceChildren();
        const orderedPriorities = ["Medium", "High", "Low"].filter(p => portalData.support.priorities.includes(p));
        portalData.support.priorities.forEach(pr => {
            if (!orderedPriorities.includes(pr)) orderedPriorities.push(pr);
        });
        orderedPriorities.forEach(pr => {
            prioritySelect.appendChild(cel('option', { value: pr, textContent: pr }));
        });
    }

    document.getElementById('contacts-sub-title').textContent = `${portalData.contacts.length} people on this account`;
    paginationState.contacts.data = portalData.contacts || [];
    paginationState.contacts.limit = 10;
    const conSelect = document.getElementById(paginationState.contacts.sizeId);
    if (conSelect) conSelect.value = "10";
    renderPaginatedList('contacts');

    const custName = (portalData.customer_info && portalData.customer_info.customer_name) || '';
    const imgUrl = portalData.customer_info && portalData.customer_info.image;

    const legalVal = document.getElementById('settings-legal-name-val');
    if (legalVal) legalVal.textContent = custName || '-';

    const gstinVal = document.getElementById('settings-gstin-val');
    if (gstinVal) gstinVal.textContent = (portalData.customer_info && portalData.customer_info.gstin) || '-';

    const iconCircle = document.getElementById('pf-company-icon-circle');
    if (iconCircle) {
        iconCircle.replaceChildren();
        if (imgUrl && imgUrl.trim()) {
            const imgEl = cel('img', {
                src: imgUrl.trim(),
                alt: custName,
                class: 'pf-company-avatar-img',
                onerror: function () {
                    const initials = getCompanyInitials(custName);
                    this.replaceWith(cel('span', { class: 'pf-company-initials', textContent: initials }));
                }
            });
            iconCircle.appendChild(imgEl);
        } else {
            const initials = getCompanyInitials(custName);
            iconCircle.appendChild(cel('span', { class: 'pf-company-initials', textContent: initials }));
        }
    }

    renderAddressesList();

    // Restore active tab or detail sub-page based on URL path or hash
    handleUrlRoute();
}

function getCompanyInitials(name) {
    if (!name || typeof name !== 'string') return 'CO';
    const cleanStr = name.replace(/[\(\)\[\]]/g, ' ').trim();
    const words = cleanStr.split(/\s+/).filter(w => w.length > 0);
    if (words.length >= 2) {
        return (words[0][0] + words[1][0]).toUpperCase();
    } else if (words.length === 1) {
        return words[0].substring(0, 2).toUpperCase();
    }
    return 'CO';
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

window.addEventListener('popstate', () => handleUrlRoute());
window.addEventListener('hashchange', () => handleUrlRoute());

function toggleAccountDropdown(e) {
    if (e) e.stopPropagation();
    const drop = document.getElementById('pf-account-dropdown');
    if (!drop) return;
    const isOpen = drop.classList.contains('show');
    closeAccountDropdown();
    if (!isOpen) {
        drop.classList.add('show');
    }
}

function closeAccountDropdown() {
    const drop = document.getElementById('pf-account-dropdown');
    if (drop) drop.classList.remove('show');
}

document.addEventListener('click', function (e) {
    const btn = document.getElementById('pf-account-btn');
    if (btn && !btn.contains(e.target)) {
        closeAccountDropdown();
    }
});

function handleLogout() {
    if (typeof frappe !== 'undefined' && typeof frappe.call === 'function') {
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

window.addEventListener('DOMContentLoaded', (event) => {
    initMobileMenuToggles();
    fetchPortalData();

    // Close Scope of Work modal when clicking the backdrop (outside the dialog)
    const scopeModal = document.getElementById('sd-scope-modal');
    if (scopeModal) {
        scopeModal.addEventListener('click', function (e) {
            if (e.target === this) {
                closePortalScopeModal();
            }
        });
    }
});
