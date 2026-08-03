import frappe
from frappe import _
from frappe.utils import today, date_diff, getdate
import base64

def get_customer_for_user(user_email):
    if user_email == "Guest":
        return None
        
    contacts = frappe.get_all("Contact", filters={"email_id": user_email}, fields=["name"])
    if not contacts:
        return None
    
    links = frappe.get_all("Dynamic Link", filters={
        "parenttype": "Contact",
        "parent": ["in", [c.name for c in contacts]],
        "link_doctype": "Customer"
    }, fields=["link_name"])
    
    if links:
        return links[0].link_name
    return None

def get_website_user_home_page(user):
    if not user or user == "Guest":
        return None
    roles = frappe.get_roles(user)
    if "Customer" in roles and "System Manager" not in roles and "Administrator" not in roles:
        return "customer-portal"
    return None

@frappe.whitelist(allow_guest=True)
def get_portal_data():
    user = frappe.session.user
    if user == "Guest":
        # Load support meta options: Priorities and Types
        priorities = [p.name for p in frappe.get_all("Issue Priority", fields=["name"])]
        issue_types = [t.name for t in frappe.get_all("Issue Type", fields=["name"])]
        return {
            "customer_info": {
                "name": "",
                "customer_name": "Guest",
                "gstin": "",
                "billing_address": ""
            },
            "stats": {
                "active_licenses": 0,
                "open_invoices_count": 0,
                "open_invoices_amount": 0,
                "open_tickets": 0,
                "next_renewal_days": None
            },
            "renewals": [],
            "invoices": [],
            "orders": [],
            "support": {
                "tickets": [],
                "priorities": priorities,
                "issue_types": issue_types
            },
            "contacts": []
        }
        
    customer_name = get_customer_for_user(user)
    if not customer_name:
        return {"error": _("No Customer linked to user {0}").format(user)}
        
    # Fetch customer details
    customer_doc = frappe.get_doc("Customer", customer_name)
    
    # Fetch billing address and GSTIN
    addresses = frappe.get_all("Address", 
        filters=[["Dynamic Link", "link_doctype", "=", "Customer"], ["Dynamic Link", "link_name", "=", customer_name]], 
        fields=["*"])
    
    billing_address = ""
    gstin = customer_doc.get("gstin") or ""
    if addresses:
        # Find primary or billing address
        addr = next((a for a in addresses if a.address_type == "Billing"), addresses[0])
        gstin = addr.get("gstin") or gstin
        parts = [addr.address_line1, addr.address_line2, addr.city, addr.state, addr.pincode, addr.country]
        billing_address = ", ".join([p for p in parts if p])
    else:
        billing_address = customer_doc.get("primary_address") or ""
        
    # Fetch Contacts
    contacts = frappe.get_all("Contact", 
        filters=[["Dynamic Link", "link_doctype", "=", "Customer"], ["Dynamic Link", "link_name", "=", customer_name]], 
        fields=["name", "first_name", "last_name", "email_id", "phone", "mobile_no", "is_primary_contact", "designation"])
        
    # Fetch Invoices (Sales Invoice)
    invoices = frappe.get_all("Sales Invoice", 
        filters={"customer": customer_name, "docstatus": 1}, 
        fields=["name", "posting_date", "due_date", "grand_total", "outstanding_amount", "status", "currency", "remarks", "company"],
        order_by="posting_date desc")
        
    if invoices:
        inv_names = [inv.name for inv in invoices]
        inv_items = frappe.get_all("Sales Invoice Item",
            filters={"parent": ["in", inv_names]},
            fields=["parent", "item_code", "item_name", "description", "qty", "rate", "amount"])
        inv_items_map = {}
        for item in inv_items:
            inv_items_map.setdefault(item.parent, []).append(item)
        for inv in invoices:
            inv["items"] = inv_items_map.get(inv.name, [])

    # Fetch Orders (Sales Order)
    orders = frappe.get_all("Sales Order", 
        filters={"customer": customer_name, "docstatus": 1}, 
        fields=["name", "transaction_date", "delivery_date", "grand_total", "status", "delivery_status", "company", "currency"],
        order_by="transaction_date desc")
        
    if orders:
        ord_names = [so.name for so in orders]
        ord_items = frappe.get_all("Sales Order Item",
            filters={"parent": ["in", ord_names]},
            fields=["parent", "item_code", "item_name", "description", "qty", "rate", "amount", "delivered_qty"])
        ord_items_map = {}
        for item in ord_items:
            ord_items_map.setdefault(item.parent, []).append(item)
        for so in orders:
            so["items"] = ord_items_map.get(so.name, [])

    # Fetch Issues (Support)
    issues = frappe.get_all("Issue", 
        filters={"customer": customer_name}, 
        fields=[
            "name", "subject", "status", "creation", "modified", "raised_by", 
            "priority", "description", "issue_type", "contact_email",
            "resolution_details", "resolution_by", "sla_resolution_by", "agreement_status",
            "working_agent", "response_by"
        ],
        order_by="creation desc")
        
    user_map = {}
    for iss in issues:
        agent = iss.get("working_agent")
        if agent:
            if agent not in user_map:
                user_map[agent] = frappe.db.get_value("User", agent, "full_name") or agent
            iss["working_agent_name"] = user_map[agent]
        else:
            iss["working_agent_name"] = "-"
        
    # Fetch Renewals (from Renewal List)
    renewals = frappe.get_all("Renewal List", 
        filters={"customer_name": customer_name}, 
        fields=[
            "name", "product_name", "invoice_no", "total_quantity",
            "start_date", "end_date", "status", "total_amount",
            "renewal_owner", "sales_user", "sales_team", "company",
            "rate", "domain_name", "description", "note",
            "serial_nos", "opportunity_id", "sla", "sla_product", "sla_type"
        ],
        order_by="end_date asc")
        
    # Fetch Renewal Item child records
    if renewals:
        ren_names = [r.name for r in renewals]
        items_list = frappe.get_all("Renewal Item",
            filters={"parent": ["in", ren_names]},
            fields=["parent", "item_code", "item_name", "qty", "rate", "amount", "start_date", "end_date", "description", "status"])
        items_map = {}
        for item in items_list:
            items_map.setdefault(item.parent, []).append(item)
        for r in renewals:
            r["items"] = items_map.get(r.name, [])
        
    # Compute metrics/stats
    active_licenses = sum(1 for r in renewals if r.status == "Active")
    
    open_invoices = [inv for inv in invoices if inv.outstanding_amount > 0]
    open_invoices_count = len(open_invoices)
    open_invoices_amount = sum(inv.outstanding_amount for inv in open_invoices)
    
    open_tickets = sum(1 for iss in issues if iss.status not in ("Closed", "Resolved"))
    
    next_renewal_days = None
    upcoming_renewals = [r for r in renewals if r.status in ("Active", "Draft") and r.end_date and getdate(r.end_date) >= getdate(today())]
    if upcoming_renewals:
        upcoming_renewals.sort(key=lambda x: getdate(x.end_date))
        next_renewal_days = date_diff(upcoming_renewals[0].end_date, today())
        
    # Load support meta options: Priorities and Types
    priorities = [p.name for p in frappe.get_all("Issue Priority", fields=["name"])]
    issue_types = [t.name for t in frappe.get_all("Issue Type", fields=["name"])]

    return {
        "customer_info": {
            "name": customer_doc.name,
            "customer_name": customer_doc.customer_name,
            "gstin": gstin,
            "billing_address": billing_address
        },
        "stats": {
            "active_licenses": active_licenses,
            "open_invoices_count": open_invoices_count,
            "open_invoices_amount": open_invoices_amount,
            "open_tickets": open_tickets,
            "next_renewal_days": next_renewal_days
        },
        "renewals": renewals,
        "invoices": invoices,
        "orders": orders,
        "support": {
            "tickets": issues,
            "priorities": priorities,
            "issue_types": issue_types
        },
        "contacts": contacts
    }

@frappe.whitelist(allow_guest=True)
def create_support_ticket(subject, description, priority, category):
    user = frappe.session.user
    if user == "Guest":
        frappe.throw(_("Please log in to submit a support ticket."))
        
    customer_name = get_customer_for_user(user)
    if not customer_name:
        frappe.throw(_("No Customer linked to this user."))
        
    contact_email = user
    contact_name = None
    contacts = frappe.get_all("Contact", filters={"email_id": user}, fields=["name", "first_name", "last_name"])
    if contacts:
        contact_name = contacts[0].name
        person_name = f"{contacts[0].first_name} {contacts[0].last_name or ''}".strip()
    else:
        person_name = user.split("@")[0]
        
    issue = frappe.new_doc("Issue")
    issue.subject = subject
    issue.description = description
    issue.customer = customer_name
    issue.customer_name = customer_name
    issue.raised_by = user
    issue.contact_email = contact_email
    if contact_name:
        issue.contact = contact_name
    issue.person_name = person_name
    
    # Priority handling
    db_priority = "Medium"
    if priority == "Urgent":
        db_priority = "High"
    elif priority == "Normal":
        db_priority = "Medium"
    else:
        db_priority = priority
    issue.priority = db_priority
    
    if frappe.db.exists("Issue Type", category):
        issue.issue_type = category
    else:
        issue.issue_type = "Other"
        
    issue.raised_via_channel = "Customer Portal"
    issue.via_customer_portal = 1
    issue.insert(ignore_permissions=True)
    frappe.db.commit()
    
    return {"status": "success", "name": issue.name}

@frappe.whitelist(allow_guest=True)
def save_account_settings(legal_name, gstin, billing_address):
    user = frappe.session.user
    if user == "Guest":
        frappe.throw(_("Please log in to save account settings."))
        
    customer_name = get_customer_for_user(user)
    if not customer_name:
        frappe.throw(_("No Customer linked to this user."))
        
    # Update customer name
    frappe.db.set_value("Customer", customer_name, "customer_name", legal_name)
    
    addresses = frappe.get_all("Address", 
        filters=[["Dynamic Link", "link_doctype", "=", "Customer"], ["Dynamic Link", "link_name", "=", customer_name]], 
        fields=["name", "address_type"])
    
    if addresses:
        addr_name = next((a.name for a in addresses if a.address_type == "Billing"), addresses[0].name)
        addr_doc = frappe.get_doc("Address", addr_name)
        addr_doc.address_line1 = billing_address
        addr_doc.gstin = gstin
        addr_doc.save(ignore_permissions=True)
    else:
        addr_doc = frappe.new_doc("Address")
        addr_doc.address_title = legal_name
        addr_doc.address_type = "Billing"
        addr_doc.address_line1 = billing_address
        addr_doc.gstin = gstin
        addr_doc.append("links", {
            "link_doctype": "Customer",
            "link_name": customer_name
        })
        addr_doc.insert(ignore_permissions=True)
        
    frappe.db.commit()
    return {"status": "success"}


@frappe.whitelist(allow_guest=False)
def download_invoice_pdf(invoice_name, print_format=None):
    """
    Securely generate a Sales Invoice PDF and return it as base64.
    Validates the invoice belongs to the session user's customer,
    then bypasses DocType print-permission using ignore_print_permissions flag.
    """
    user = frappe.session.user
    if user == "Guest":
        frappe.throw(_("Please log in to download invoices."), frappe.PermissionError)

    customer_name = get_customer_for_user(user)
    if not customer_name:
        frappe.throw(_("No Customer linked to this user."), frappe.PermissionError)

    # Security check: verify invoice belongs to this customer
    owner_check = frappe.db.get_value(
        "Sales Invoice",
        {"name": invoice_name, "customer": customer_name, "docstatus": 1},
        "name"
    )
    if not owner_check:
        frappe.throw(
            _("Invoice not found or access denied."),
            frappe.PermissionError
        )

    # Resolve print format – use "GST Tax Invoice" if available, else first available
    if not print_format:
        preferred = frappe.db.exists("Print Format", {"name": "GST Tax Invoice", "doc_type": "Sales Invoice", "disabled": 0})
        if preferred:
            print_format = "GST Tax Invoice"
        else:
            formats = frappe.get_all(
                "Print Format",
                filters={"doc_type": "Sales Invoice", "disabled": 0},
                fields=["name"],
                order_by="creation asc",
                limit=1
            )
            print_format = formats[0].name if formats else "Standard"

    # Set flag so get_rendered_template skips its own permission check
    # (ownership was already validated above using the DB check)
    frappe.flags.ignore_print_permissions = True
    try:
        from frappe.www.printview import get_rendered_template, get_print_format_doc
        from frappe.utils.pdf import get_pdf

        doc = frappe.get_doc("Sales Invoice", invoice_name)
        print_format_doc = get_print_format_doc(print_format, meta=doc.meta)

        html = get_rendered_template(
            doc=doc,
            print_format=print_format_doc,
            meta=doc.meta,
            no_letterhead=0,
            letterhead=None,
        )
        pdf_content = get_pdf(html)
    except Exception:
        frappe.log_error(frappe.get_traceback(), "Portal Invoice PDF Error")
        frappe.throw(_("Failed to generate invoice PDF. Please contact support."))
    finally:
        frappe.flags.ignore_print_permissions = False

    pdf_b64 = base64.b64encode(pdf_content).decode("utf-8")
    return {
        "pdf_b64": pdf_b64,
        "filename": f"{invoice_name}.pdf"
    }

@frappe.whitelist(allow_guest=True)
def get_ticket_details(ticket_name):
    user = frappe.session.user
    if not ticket_name:
        return {"error": _("Ticket name is required")}
        
    if not frappe.db.exists("Issue", ticket_name):
        return {"error": _("Ticket not found")}
        
    issue = frappe.get_doc("Issue", ticket_name)
    
    # Permission check: guest or user must be linked to customer or raised by
    if user != "Guest":
        customer_name = get_customer_for_user(user)
        if issue.customer and issue.customer != customer_name and issue.raised_by != user:
            frappe.throw(_("Not permitted"), frappe.PermissionError)
            
    working_agent_name = "-"
    if issue.working_agent:
        working_agent_name = frappe.db.get_value("User", issue.working_agent, "full_name") or issue.working_agent
        
    attachments = frappe.get_all("File",
        filters={"attached_to_doctype": "Issue", "attached_to_name": ticket_name},
        fields=["name", "file_name", "file_url", "file_size", "creation"],
        order_by="creation desc"
    )
    
    activity = []
    try:
        from renewal_module.custom_module.page.ticket_list.ticket_list import get_issue_activity
        activity = get_issue_activity(ticket_name)
    except Exception as e:
        frappe.log_error(f"Error fetching issue activity: {e}", "Portal Ticket Details")
        activity = []
    
    res_details = issue.get("resolution_details") or issue.get("resolution") or ""
    
    return {
        "name": issue.name,
        "subject": issue.subject,
        "status": issue.status,
        "creation": str(issue.creation),
        "modified": str(issue.modified),
        "raised_by": issue.raised_by,
        "priority": issue.priority,
        "description": issue.description,
        "issue_type": issue.issue_type,
        "contact_email": issue.contact_email,
        "person_name": issue.person_name,
        "resolution_details": res_details,
        "resolution_by": str(issue.resolution_by) if issue.resolution_by else None,
        "sla_resolution_by": str(issue.sla_resolution_by) if issue.sla_resolution_by else None,
        "agreement_status": issue.agreement_status or "-",
        "working_agent": issue.working_agent,
        "working_agent_name": working_agent_name,
        "attachments": attachments,
        "activity": activity
    }


