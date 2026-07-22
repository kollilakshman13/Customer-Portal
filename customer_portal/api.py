import frappe
from frappe import _
from frappe.utils import today, date_diff, getdate

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
        fields=["name", "posting_date", "due_date", "grand_total", "outstanding_amount", "status"],
        order_by="posting_date desc")
        
    # Fetch Orders (Sales Order)
    orders = frappe.get_all("Sales Order", 
        filters={"customer": customer_name, "docstatus": 1}, 
        fields=["name", "transaction_date", "delivery_date", "grand_total", "status", "delivery_status"],
        order_by="transaction_date desc")
        
    # Fetch Issues
    issues = frappe.get_all("Issue", 
        filters={"customer": customer_name}, 
        fields=["name", "subject", "status", "creation", "modified", "raised_by", "priority"],
        order_by="creation desc")
        
    # Fetch Renewals (from Renewal List)
    renewals = frappe.get_all("Renewal List", 
        filters={"customer_name": customer_name}, 
        fields=["name", "product_name", "invoice_no", "total_quantity", "start_date", "end_date", "status", "total_amount", "renewal_owner"],
        order_by="end_date asc")
        
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
