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

function setRichTextOrCleanHtml(elOrId, htmlContent, fallbackText = 'No description provided.') {
    const el = typeof elOrId === 'string' ? document.getElementById(elOrId) : elOrId;
    if (!el) return;
    
    if (!htmlContent || typeof htmlContent !== 'string' || !htmlContent.trim()) {
        el.textContent = fallbackText;
        return;
    }
    
    let raw = htmlContent.trim();
    
    // If it doesn't contain HTML tags, render as clean text
    if (!/<[a-z][\s\S]*>/i.test(raw)) {
        el.textContent = raw;
        return;
    }
    
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

function createItemDescNode(rawDesc) {
    if (!rawDesc || typeof rawDesc !== 'string' || !rawDesc.trim()) return null;
    const div = cel('div', { class: 'pf-item-desc' });
    setRichTextOrCleanHtml(div, rawDesc, '');
    return div;
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
}

function pfGoByName(name, skipHash) {
    const link = Array.from(document.querySelectorAll('.pf-nav a')).find(a => a.getAttribute('onclick').includes("'" + name + "'"));
    pfGo(name, link, skipHash);
}

function updateUrlPath(pathSegment) {
    let cleanPath = '/customer-portal';
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
                    `${ren.total_quantity || 0} seats · ${formatDate(ren.start_date)} → ${formatDate(ren.end_date)}`
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
    setText('rd-name',    ren.name);
    setText('rd-product', ren.product_name);

    // Status pill + amount (top-right)
    const pill = document.getElementById('rd-status-pill');
    if (pill) { pill.textContent = ren.status || '-'; pill.className = `pf-pill ${statusClass}`; }
    setText('rd-amount',       formatCurrency(ren.total_amount));
    setText('rd-amount-hero',  formatCurrency(ren.total_amount));

    // Hero cards
    setText('rd-start', formatDate(ren.start_date));
    setText('rd-end',   formatDate(ren.end_date));
    setText('rd-qty',   ren.total_quantity ? `${ren.total_quantity} seats` : '-');

    // Detail grid
    setText('rd-id',         ren.name);
    setText('rd-invoice',    ren.invoice_no);
    setText('rd-rate',       ren.rate ? formatCurrency(ren.rate) + ' / seat' : '-');
    setText('rd-company',    ren.company);
    setText('rd-sales-user', ren.sales_user || ren.renewal_owner);
    setText('rd-owner',      ren.renewal_owner);

    // Optional fields — hide entire row if empty
    const showOptional = (wrapId, valId, val) => {
        const wrap = document.getElementById(wrapId);
        if (wrap) wrap.style.display = val ? '' : 'none';
        setText(valId, val);
    };
    showOptional('rd-domain-wrap', 'rd-domain', ren.domain_name);
    showOptional('rd-opp-wrap',    'rd-opp',    ren.opportunity_id);
    showOptional('rd-sla-wrap',    'rd-sla',    ren.sla_type || ren.sla_product || ren.sla);

    // Description / Notes
    const showSection = (wrapId, bodyId, val) => {
        const wrap = document.getElementById(wrapId);
        const body = document.getElementById(bodyId);
        if (wrap) wrap.style.display = val ? '' : 'none';
        if (body) setRichTextOrCleanHtml(body, val, '');
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
        if (itemsToRender.length === 0 && (ren.product_name || ren.rate || ren.total_amount)) {
            itemsToRender = [{
                item_code: ren.name || 'RENEWAL',
                item_name: ren.product_name || 'Renewal Product',
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
                
                const tr = cel('tr', {}, [
                    cel('td', {}, [
                        cel('div', { class: 'pf-item-title', textContent: it.item_name || it.item_code || 'Product Item' }),
                        it.item_code ? cel('span', { class: 'pf-item-code-tag', textContent: it.item_code }) : null,
                        createItemDescNode(it.description)
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
    const today     = new Date();
    const startDate = ren.start_date ? new Date(ren.start_date) : null;
    const endDate   = ren.end_date   ? new Date(ren.end_date)   : null;
    const daysLeft  = endDate ? Math.ceil((endDate - today) / (1000 * 60 * 60 * 24)) : null;
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
    setText('rd-tl-end',   formatDate(ren.end_date));

    // Navigate to detail page & update hash
    pfGo('renewal-detail', null, true);
    if (!skipHash && ren && ren.name) {
        updateUrlHash('#renewals/' + encodeURIComponent(ren.name));
    }
}


function renderContactRow(contact) {
    const fullName = `${contact.first_name} ${contact.last_name || ''}`.trim();
    const designation = contact.designation || 'Contact';
    const detailText = `${contact.email_id || '-'} · ${contact.mobile_no || contact.phone || '-'}`;
    
    const row = cel('div', { class: 'pf-row pf-row-clickable' }, [
        cel('div', { class: 'pf-row-icon' }, [cel('i', { class: 'ti ti-user' })]),
        cel('div', { class: 'pf-row-body' }, [
            cel('div', { class: 'pf-row-title', textContent: fullName }),
            cel('div', { class: 'pf-row-sub', textContent: `${detailText} · ${designation}` })
        ]),
        cel('div', { class: 'pf-row-right' }, [
            contact.is_primary_contact ? cel('span', { class: 'pf-pill paid', textContent: 'Primary' }) : null,
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
                method: 'customer_portal.api.download_invoice_pdf',
                args: { invoice_name: inv.name },
                callback: function(r) {
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
                error: function() {
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

function openTicketDetail(ticket, skipHash) {
    const statusClass = getTicketStatusClass(ticket.status);
    const setText = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.textContent = val || '-';
    };

    setText('sd-subject', ticket.subject || 'Ticket Details');
    setText('sd-ticket-id', `Ticket #${ticket.name}`);
    
    const pill = document.getElementById('sd-status-pill');
    if (pill) { pill.textContent = ticket.status || '-'; pill.className = `pf-pill ${statusClass}`; }
    
    setText('sd-created', formatDate(ticket.creation));
    setText('sd-priority-hero', ticket.priority || '');
    setText('sd-category', ticket.issue_type || '');
    setText('sd-raised-by', ticket.raised_by || '');
    setRichTextOrCleanHtml('sd-description', ticket.description, 'No description text provided for this ticket.');
    setText('sd-id', ticket.name);
    setText('sd-email', ticket.contact_email || ticket.raised_by || '-');
    setText('sd-modified', formatDate(ticket.modified));

    // Assigned Agent
    const agentName = ticket.working_agent_name || ticket.working_agent || 'Unassigned';
    setText('sd-agent-hero', agentName);
    setText('sd-agent-val', agentName);

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

    // SLA Details
    const slaTarget = ticket.sla_resolution_by || ticket.resolution_by;
    setText('sd-sla-target', slaTarget ? formatDate(slaTarget) : 'N/A');
    setText('sd-sla-status', ticket.agreement_status || (ticket.status === 'Closed' || ticket.status === 'Resolved' ? 'Fulfilled' : 'In Progress'));

    // Attachments & Activity timeline rendering
    renderTicketAttachments(ticket.attachments || []);
    renderTicketActivity(ticket.activity || []);

    pfGo('support-detail', null, true);
    if (!skipHash && ticket && ticket.name) {
        updateUrlPath('support/' + encodeURIComponent(ticket.name));
    }

    // Fetch live ticket details from server (for activity timeline and attachments)
    if (ticket && ticket.name) {
        frappe.call({
            method: 'customer_portal.api.get_ticket_details',
            args: { ticket_name: ticket.name },
            callback: function(r) {
                if (r && r.message && !r.message.error) {
                    const d = r.message;
                    const updatedAgent = d.working_agent_name || d.working_agent || 'Unassigned';
                    setText('sd-agent-hero', updatedAgent);
                    setText('sd-agent-val', updatedAgent);

                    if (d.resolution_details && d.resolution_details.trim()) {
                        if (resSec) resSec.style.display = '';
                        setRichTextOrCleanHtml('sd-resolution-text', d.resolution_details, '');
                        setText('sd-resolution-date', formatDate(d.resolution_by || d.modified));
                    }

                    const freshSlaTarget = d.sla_resolution_by || d.resolution_by;
                    setText('sd-sla-target', freshSlaTarget ? formatDate(freshSlaTarget) : 'N/A');
                    setText('sd-sla-status', d.agreement_status || (d.status === 'Closed' || d.status === 'Resolved' ? 'Fulfilled' : 'In Progress'));

                    renderTicketAttachments(d.attachments || []);
                    renderTicketActivity(d.activity || []);
                }
            }
        });
    }
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
        const statusSlug   = statusAtTime.toLowerCase().replace(/\s+/g, '-');
        const statusBadgeHtml = statusAtTime
            ? `<span class="tl-cur-status tl-status-badge tl-status-${statusSlug}" title="Ticket status at this point">${escapeHtml(statusAtTime)}</span>`
            : '';

        let contentHtml = '';
        if (row.description) {
            const desc = row.description;
            const t = row.type || '';

            if (row.is_html) {
                let emailMetaHtml = '';
                if (t === 'Communication') {
                    const toVal     = escapeHtml(row.recipients || '');
                    const ccVal     = escapeHtml(row.cc || '');
                    const subjVal   = escapeHtml(row.subject || '');
                    const toRows    = toVal ? `<div class="tl-email-meta-row"><span class="tl-email-meta-label">To</span><span class="tl-email-meta-value">${toVal}</span></div>` : '';
                    const ccRows    = ccVal ? `<div class="tl-email-meta-row"><span class="tl-email-meta-label">CC</span><span class="tl-email-meta-value">${ccVal}</span></div>` : '';
                    const subjRow   = subjVal ? `<div class="tl-email-meta-row tl-email-meta-subject"><span class="tl-email-meta-label">Subject</span><span class="tl-email-meta-value">${subjVal}</span></div>` : '';
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
                const safe = escapeHtml(desc).replace(/\n/g, '<br>');
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
                    const toStatus   = m[2].replace(/\.$/, '').trim();
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
    if (currentPath.includes('/customer-portal')) {
        routeStr = currentPath.replace(/^.*\/customer-portal\/?/, '');
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
        } else if (mainTab === 'support' && portalData.support && portalData.support.tickets) {
            const rec = portalData.support.tickets.find(t => t.name === detailId);
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

        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            // Show loading state
            btn.disabled = true;
            btn.querySelector('i').className = 'ti ti-loader-2';
            btn.style.animation = 'spin 1s linear infinite';

            frappe.call({
                method: 'customer_portal.api.download_invoice_pdf',
                args: { invoice_name: inv.name },
                callback: function(r) {
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
                error: function(r) {
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
    state.limit = parseInt(document.getElementById(state.sizeId).value) || 10;
    renderPaginatedList('invoices');
}

function filterTickets() {
    const query = document.getElementById('ticket-search-input').value.toLowerCase().trim();
    const statusSelect = document.getElementById('ticket-status-filter');
    const status = statusSelect ? statusSelect.value : 'All';
    const state = paginationState.support;
    
    let filtered = portalData.support.tickets || [];
    if (status !== 'All') {
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
    state.limit = parseInt(document.getElementById(state.sizeId).value) || 10;
    renderPaginatedList('support');
}

function openNewTicketPage(skipHash) {
    pfGo('support-new', null, true);
    if (!skipHash) {
        updateUrlPath('support/new');
    }
    const subjectInput = document.getElementById('ticket-subject');
    if (subjectInput) {
        setTimeout(() => subjectInput.focus(), 250);
    }
}

function submitTicket() {
    const subject = document.getElementById('ticket-subject').value.trim();
    const details = document.getElementById('ticket-details').value.trim();
    const categorySelect = document.getElementById('ticket-category');
    const prioritySelect = document.getElementById('ticket-priority');
    const category = categorySelect ? categorySelect.value : '';
    const priority = prioritySelect ? prioritySelect.value : '';

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
                pfGoByName('support');
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

    document.getElementById('support-sub-title').textContent = `${(portalData.support.tickets || []).length} tickets on this account`;
    
    const ticketStatusSelect = document.getElementById('ticket-status-filter');
    if (ticketStatusSelect) {
        ticketStatusSelect.replaceChildren(cel('option', { value: 'All', textContent: 'All' }));
        const uniqueTicketStatuses = [...new Set((portalData.support.tickets || []).map(t => t.status))];
        uniqueTicketStatuses.forEach(st => {
            if (st) ticketStatusSelect.appendChild(cel('option', { value: st, textContent: st }));
        });
    }

    paginationState.support.data = portalData.support.tickets || [];
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

    // Restore active tab or detail sub-page based on URL path or hash
    handleUrlRoute();
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

document.addEventListener('click', function(e) {
    const btn = document.getElementById('pf-account-btn');
    if (btn && !btn.contains(e.target)) {
        closeAccountDropdown();
    }
});

function handleLogout() {
    if (typeof frappe !== 'undefined' && typeof frappe.call === 'function') {
        frappe.call({
            method: 'logout',
            callback: function() {
                window.location.href = '/login';
            },
            error: function() {
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
});
