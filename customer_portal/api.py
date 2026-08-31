import frappe
from frappe import _
from frappe.utils import today, date_diff, getdate
import base64

def get_customer_for_user(user_email):
    if not user_email or user_email == "Guest":
        return None
        
    contacts = frappe.get_all("Contact", filters={"email_id": user_email}, fields=["name"])
    contact_names = [c.name for c in contacts] if contacts else []
    
    links = []
    if contact_names:
        links = frappe.get_all("Dynamic Link", filters={
            "parenttype": "Contact",
            "parent": ["in", contact_names],
            "link_doctype": "Customer"
        }, fields=["link_name"])
    
    if links:
        return links[0].link_name
        
    if frappe.get_meta("User").has_field("customer"):
        usr_cust = frappe.db.get_value("User", user_email, "customer") or ""
        if usr_cust:
            return usr_cust

    return None

def check_is_system_user(user=None):
    user = user or frappe.session.user
    if not user or user == "Guest":
        return False
    user_type = frappe.db.get_value("User", user, "user_type") or "Website User"
    roles = frappe.get_roles(user)
    return user_type == "System User" or any(r in roles for r in ["System Manager", "Administrator", "Sales User", "Sales Manager", "Support Team", "Maintenance User"])

def get_website_user_home_page(user):
    if not user or user == "Guest":
        return None
    roles = frappe.get_roles(user)
    if "Customer" in roles and "System Manager" not in roles and "Administrator" not in roles:
        return "customer-portal"
    return None

def get_portal_company_info(target_customer=None):
    try:
        import re
        comp_name = None
        if target_customer and frappe.db.exists("Customer", target_customer):
            cust_meta = frappe.get_meta("Customer")
            if cust_meta.has_field("default_company"):
                comp_name = frappe.db.get_value("Customer", target_customer, "default_company")
            elif cust_meta.has_field("company"):
                comp_name = frappe.db.get_value("Customer", target_customer, "company")

        if not comp_name:
            comp_name = frappe.db.get_single_value("Global Defaults", "default_company") or frappe.defaults.get_user_default("Company")

        raw_company_name = ""
        abbr = ""
        logo = ""

        if not comp_name:
            companies = frappe.get_all("Company", fields=["name", "company_name", "abbr"], limit=1)
            if companies:
                raw_company_name = companies[0].company_name or companies[0].name
                abbr = companies[0].abbr or "NSPL"
        elif frappe.db.exists("Company", comp_name):
            comp = frappe.db.get_value("Company", comp_name, ["name", "company_name", "abbr", "company_logo"], as_dict=True)
            if comp:
                raw_company_name = comp.company_name or comp.name
                abbr = comp.abbr or "NSPL"
                logo = comp.company_logo or ""

        if not raw_company_name:
            raw_company_name = "64 Network Security Pvt Ltd"
            abbr = "64 NSPL"

        clean_name = re.sub(r'\s*-\s*[A-Za-z0-9\s]+$', '', raw_company_name).strip() or raw_company_name

        # Calculate clean mark (max 2-3 chars, e.g. '64', 'VC', 'NS')
        clean_abbr = re.sub(r'[^a-zA-Z0-9]', '', abbr or '')
        mark = ""
        if clean_abbr:
            num_match = re.match(r'^\d+', clean_abbr)
            if num_match:
                mark = num_match.group(0)[:3]
            else:
                mark = clean_abbr[:2].upper()
        if not mark:
            words = [w for w in clean_name.split() if w.lower() not in ('pvt', 'ltd', 'private', 'limited', 'inc', 'corp', 'llp', '-')]
            if len(words) >= 2:
                mark = (words[0][0] + words[1][0]).upper()
            else:
                mark = clean_name[:2].upper()

        return {
            "name": comp_name or raw_company_name,
            "company_name": raw_company_name,
            "display_name": clean_name,
            "abbr": abbr,
            "mark": mark or "64",
            "logo": logo
        }
    except Exception as e:
        frappe.log_error(f"Error resolving company info: {e}", "Portal Company Info")

    return {
        "name": "64 Network Security",
        "company_name": "64 Network Security",
        "display_name": "64 Network Security",
        "abbr": "64 NSPL",
        "mark": "64",
        "logo": ""
    }

@frappe.whitelist()
def get_permitted_customers(search_term=None, limit=20):
    user = frappe.session.user
    if user == "Guest":
        return []
    
    try:
        limit = int(limit) if limit else 20
    except Exception:
        limit = 20

    if search_term and str(search_term).strip():
        term = str(search_term).strip()
        st = f"%{term}%"
        customers = frappe.get_list("Customer", 
            filters=[["disabled", "=", 0]],
            or_filters=[
                ["customer_name", "like", st],
                ["name", "like", st],
                ["customer_group", "like", st],
                ["territory", "like", st]
            ],
            fields=["name", "customer_name", "customer_group", "territory", "image", "customer_logo"],
            order_by="customer_name asc",
            limit=50
        )
    else:
        customers = frappe.get_list("Customer", 
            filters=[["disabled", "=", 0]], 
            fields=["name", "customer_name", "customer_group", "territory", "image", "customer_logo"],
            order_by="customer_name asc",
            limit=limit
        )
    return customers

@frappe.whitelist(allow_guest=True)
def get_portal_data(customer_name=None):
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
                "billing_address": "",
                "shipping_address": "",
                "is_system_user": False
            },
            "is_system_user": False,
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
            "contacts": [],
            "company_info": get_portal_company_info()
        }
        
    user_type = frappe.db.get_value("User", user, "user_type") or "Website User"
    roles = frappe.get_roles(user)
    is_system_user = user_type == "System User" or any(r in roles for r in ["System Manager", "Administrator", "Sales User", "Sales Manager", "Support Team", "Maintenance User"])
    
    linked_customer = get_customer_for_user(user)

    target_customer = None
    if customer_name and str(customer_name).strip():
        req_cust = str(customer_name).strip()
        if is_system_user:
            if not frappe.has_permission("Customer", "read", req_cust):
                return {
                    "error": _("Permission Denied: You do not have permission to view {0}.").format(req_cust),
                    "permission_denied": True,
                    "is_system_user": True,
                    "permitted_customers": get_permitted_customers()
                }
            target_customer = req_cust
        elif linked_customer and linked_customer == req_cust:
            target_customer = linked_customer
        else:
            return {
                "error": _("Permission Denied: You do not have permission to view this customer."),
                "permission_denied": True,
                "is_system_user": False
            }
    elif linked_customer:
        target_customer = linked_customer
    elif is_system_user:
        permitted_customers = get_permitted_customers()
        if not permitted_customers:
            return {
                "error": _("Permission Denied: No Customer records are accessible for your account."),
                "permission_denied": True,
                "is_system_user": True
            }
        return {
            "is_system_user": True,
            "needs_customer_selection": True,
            "permitted_customers": permitted_customers,
            "user_email": user
        }
    else:
        return {"error": _("No Customer linked to user {0}").format(user)}

    customer_name = target_customer
        
    # Fetch customer details
    customer_doc = frappe.get_doc("Customer", customer_name)
    
    # Fetch billing address and GSTIN
    addresses = frappe.get_all("Address", 
        filters=[["Dynamic Link", "link_doctype", "=", "Customer"], ["Dynamic Link", "link_name", "=", customer_name]], 
        fields=["*"])
    
    billing_address = ""
    shipping_address = ""
    gstin = customer_doc.get("gstin") or ""
    shipping_gstin = gstin
    if addresses:
        # Find primary or billing address
        addr = next((a for a in addresses if a.address_type == "Billing"), addresses[0])
        gstin = addr.get("gstin") or gstin
        parts = [addr.address_line1, addr.address_line2, addr.city, addr.state, addr.pincode, addr.country]
        billing_address = ", ".join([p for p in parts if p])

        # Find shipping address
        ship_addr = next((a for a in addresses if a.address_type == "Shipping" or getattr(a, "is_shipping_address", 0)), None)
        if ship_addr:
            ship_parts = [ship_addr.address_line1, ship_addr.address_line2, ship_addr.city, ship_addr.state, ship_addr.pincode, ship_addr.country]
            shipping_address = ", ".join([p for p in ship_parts if p])
            shipping_gstin = ship_addr.get("gstin") or gstin
        else:
            shipping_address = billing_address
            shipping_gstin = gstin
    else:
        billing_address = customer_doc.get("primary_address") or ""
        shipping_address = billing_address
        shipping_gstin = gstin
        
    # Fetch Contacts with TPOC & Image fields
    contact_fields = ["name", "first_name", "last_name", "email_id", "phone", "mobile_no", "is_primary_contact", "designation"]
    contact_meta = frappe.get_meta("Contact")
    if contact_meta.has_field("tpoc"):
        contact_fields.append("tpoc")
    if contact_meta.has_field("custom_tpoc"):
        contact_fields.append("custom_tpoc")
    if contact_meta.has_field("image"):
        contact_fields.append("image")
    if contact_meta.has_field("custom_image"):
        contact_fields.append("custom_image")
    if contact_meta.has_field("user_image"):
        contact_fields.append("user_image")

    contacts = frappe.get_all("Contact", 
        filters=[["Dynamic Link", "link_doctype", "=", "Customer"], ["Dynamic Link", "link_name", "=", customer_name]], 
        fields=contact_fields)

    for c in contacts:
        if c.get("custom_tpoc") and not c.get("tpoc"):
            c["tpoc"] = c["custom_tpoc"]
        if not c.get("image") and c.get("email_id"):
            u_img = frappe.db.get_value("User", c["email_id"], "user_image")
            if u_img:
                c["image"] = u_img
        
    # Fetch Invoices (Sales Invoice)
    invoices = frappe.get_all("Sales Invoice", 
        filters={"customer": customer_name, "docstatus": 1}, 
        fields=[
            "name", "posting_date", "due_date", "net_total", "total_taxes_and_charges", "grand_total",
            "outstanding_amount", "status", "currency", "remarks", "company",
            "customer_address", "address_display", "shipping_address_name", "shipping_address",
            "billing_address_gstin", "custom_zoho_invoice"
        ],
        order_by="posting_date desc")
        
    if invoices:
        inv_names = [inv.name for inv in invoices]
        inv_items = frappe.get_all("Sales Invoice Item",
            filters={"parent": ["in", inv_names]},
            fields=["parent", "item_code", "item_name", "description", "qty", "rate", "amount"])
        inv_items_map = {}
        for item in inv_items:
            inv_items_map.setdefault(item.parent, []).append(item)

        inv_taxes = frappe.get_all("Sales Taxes and Charges",
            filters={"parent": ["in", inv_names]},
            fields=["parent", "description", "account_head", "rate", "tax_amount", "total"],
            order_by="idx asc")
        inv_taxes_map = {}
        for tax in inv_taxes:
            inv_taxes_map.setdefault(tax.parent, []).append(tax)

        addr_gstin_map = {a.name: a.get("gstin") for a in (addresses or []) if a.get("gstin")}
        for inv in invoices:
            inv["items"] = inv_items_map.get(inv.name, [])
            inv["taxes"] = inv_taxes_map.get(inv.name, [])
            if inv.get("shipping_address_name") and inv["shipping_address_name"] in addr_gstin_map:
                inv["shipping_address_gstin"] = addr_gstin_map[inv["shipping_address_name"]]

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
            "name", "subject", "status", "creation", "modified", "raised_by", "sales_person",
            "priority", "description", "issue_type", "custom_query_type", "custom_support_type", "contact_email",
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
            "serial_nos", "opportunity_id",
        ],
        order_by="end_date desc")
        
    # Fetch Renewal Item child records & linked Brand image / Item Group lookup
    if renewals:
        ren_names = [r.name for r in renewals]
        items_list = frappe.get_all("Renewal Item",
            filters={"parent": ["in", ren_names]},
            fields=["parent", "item_code", "item_name", "item_brand", "brand", "item_group", "image", "qty", "rate", "amount", "start_date", "end_date", "description", "status"])
        
        item_codes = list(set([i.item_code for i in items_list if i.get("item_code")]))
        item_meta_map = {}
        if item_codes:
            item_records = frappe.get_all("Item", filters={"name": ["in", item_codes]}, fields=["name", "item_code", "brand", "item_group", "image"])
            for ir in item_records:
                item_meta_map[ir.name] = ir
                item_meta_map[ir.item_code] = ir

        brand_image_map = {}
        try:
            if frappe.db.exists("DocType", "Brand"):
                all_brands = frappe.get_all("Brand", fields=["name", "brand", "image"])
                for b in all_brands:
                    b_name = (b.get("brand") or b.get("name") or "").strip()
                    if b_name:
                        brand_image_map[b_name.lower()] = b.get("image") or ""
                        brand_image_map[b.get("name").lower()] = b.get("image") or ""
        except Exception:
            pass

        items_map = {}
        for item in items_list:
            items_map.setdefault(item.parent, []).append(item)
            
        for r in renewals:
            r["items"] = items_map.get(r.name, [])
            
            ren_brand = None
            ren_brand_logo = None
            ren_item_group = None
            
            for it in r["items"]:
                it_code = it.get("item_code")
                it_meta = item_meta_map.get(it_code, {})
                b_name = it.get("item_brand") or it.get("brand") or it_meta.get("brand")
                ig = it.get("item_group") or it_meta.get("item_group")
                if ig and not ren_item_group:
                    ren_item_group = ig
                if b_name and not ren_brand:
                    ren_brand = b_name
                    ren_brand_logo = it.get("image") or it_meta.get("image") or brand_image_map.get(str(b_name).lower())
            
            if not ren_brand:
                prod_name = (r.get("product_name") or "").strip()
                if prod_name and prod_name.lower() in brand_image_map:
                    ren_brand = prod_name
                    ren_brand_logo = brand_image_map.get(prod_name.lower())
                else:
                    for b_k, b_img in brand_image_map.items():
                        if b_k and (b_k in prod_name.lower() or prod_name.lower() in b_k):
                            ren_brand = b_k.title()
                            ren_brand_logo = b_img
                            break
            
            if not ren_brand_logo and ren_brand:
                ren_brand_logo = brand_image_map.get(str(ren_brand).lower())
                
            r["brand"] = ren_brand or ""
            r["brand_logo"] = ren_brand_logo or ""
            r["item_group"] = ren_item_group or r.get("item_group") or r.get("category") or "General"
        
    # Fetch Opportunities
    opportunities = []
    try:
        if frappe.db.exists("DocType", "Opportunity"):
            opportunities = frappe.get_all("Opportunity",
                filters=[["party_name", "=", customer_name]],
                fields=["name", "title", "opportunity_from", "party_name", "status", "opportunity_amount", "creation"],
                order_by="creation desc", limit=10)
    except Exception as e:
        frappe.log_error(f"Error fetching Opportunities: {e}", "Portal API")

    # Fetch Quotations
    quotations = []
    try:
        if frappe.db.exists("DocType", "Quotation"):
            quotations = frappe.get_all("Quotation",
                filters=[["party_name", "=", customer_name]],
                fields=["name", "transaction_date", "valid_till", "grand_total", "status", "creation"],
                order_by="creation desc", limit=10)
    except Exception as e:
        frappe.log_error(f"Error fetching Quotations: {e}", "Portal API")

    # Fetch Communications / Call Logs
    communications = []
    try:
        if frappe.db.exists("DocType", "Communication"):
            communications = frappe.get_all("Communication",
                filters=[["timeline_doctype", "=", "Customer"], ["timeline_name", "=", customer_name]],
                fields=["name", "subject", "communication_type", "communication_medium", "content", "creation", "sender_full_name"],
                order_by="creation desc", limit=10)
    except Exception as e:
        frappe.log_error(f"Error fetching Communications: {e}", "Portal API")

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

    # Load DocType status metadata options dynamically
    def get_field_status_options(doctype_name, fieldname="status"):
        try:
            meta = frappe.get_meta(doctype_name)
            field = meta.get_field(fieldname)
            if field and field.options:
                return [s.strip() for s in field.options.split("\n") if s.strip()]
        except Exception:
            pass
        return []

    status_options = {
        "renewals": get_field_status_options("Renewal List"),
        "invoices": get_field_status_options("Sales Invoice"),
        "orders": get_field_status_options("Sales Order"),
        "support": get_field_status_options("Issue")
    }

    address_type_options = get_field_status_options("Address", "address_type")
    if not address_type_options:
        address_type_options = ["Billing", "Shipping", "Office", "Plant", "Warehouse", "Personal", "Postal", "Sub-contracting", "Subsidiary", "Others"]

    gst_category_options = get_field_status_options("Address", "gst_category")
    if not gst_category_options:
        gst_category_options = ["Registered Regular", "Registered Composition", "Unregistered", "SEZ", "Overseas", "Deemed Export", "UIN Holders", "Tax Deductor"]

    # Dynamic Security Health Score calculation based strictly on live customer database records
    lic_comp = min(100, int((active_licenses / len(renewals)) * 100)) if renewals else 100
    inv_comp = min(100, int(((len(invoices) - open_invoices_count) / len(invoices)) * 100)) if invoices else 100
    tkt_comp = min(100, int(((len(issues) - open_tickets) / len(issues)) * 100)) if issues else 100
    av_comp = int(customer_doc.get("av_coverage") or customer_doc.get("custom_av_coverage") or 0)

    overall_health = int((lic_comp * 0.35) + (inv_comp * 0.25) + (tkt_comp * 0.20) + (av_comp * 0.20))
    health_label = "Excellent" if overall_health >= 85 else ("Good" if overall_health >= 70 else "Needs Attention")

    security_health = {
        "score": overall_health,
        "label": health_label,
        "factors": [
            {"name": "AV Coverage", "score": av_comp},
            {"name": "Licence Compliance", "score": lic_comp},
            {"name": "Patch & Billing Compliance", "score": inv_comp},
            {"name": "Support Resolution SLA", "score": tkt_comp}
        ]
    }

    def resolve_person_meta(pname):
        if not pname:
            return {"name": "", "image": "", "email": ""}
        pname_str = str(pname).strip()
        img = ""
        email = pname_str if "@" in pname_str else ""
        full_name = pname_str

        if frappe.db.exists("User", pname_str):
            u_doc = frappe.db.get_value("User", pname_str, ["full_name", "user_image", "email"], as_dict=True)
            if u_doc:
                full_name = u_doc.full_name or pname_str
                img = u_doc.user_image or ""
                email = u_doc.email or email
        elif frappe.db.exists("Sales Person", pname_str):
            sp_doc = frappe.get_doc("Sales Person", pname_str)
            if hasattr(sp_doc, "email_id") and sp_doc.get("email_id"):
                email = sp_doc.get("email_id")
            emp = sp_doc.get("employee")
            if emp and frappe.db.exists("Employee", emp):
                e_doc = frappe.db.get_value("Employee", emp, ["employee_name", "image", "user_id", "company_email", "personal_email"], as_dict=True)
                if e_doc:
                    full_name = e_doc.employee_name or pname_str
                    img = e_doc.image or (frappe.db.get_value("User", e_doc.user_id, "user_image") if e_doc.user_id else "")
                    email = e_doc.company_email or e_doc.personal_email or e_doc.user_id or email
        elif frappe.db.exists("Employee", pname_str):
            e_doc = frappe.db.get_value("Employee", pname_str, ["employee_name", "image", "user_id", "company_email", "personal_email"], as_dict=True)
            if e_doc:
                full_name = e_doc.employee_name or pname_str
                img = e_doc.image or (frappe.db.get_value("User", e_doc.user_id, "user_image") if e_doc.user_id else "")
                email = e_doc.company_email or e_doc.personal_email or e_doc.user_id or email
        elif frappe.db.exists("Contact", pname_str):
            c_doc = frappe.db.get_value("Contact", pname_str, ["first_name", "last_name", "email_id", "image", "user_image"], as_dict=True)
            if c_doc:
                full_name = f"{c_doc.first_name or ''} {c_doc.last_name or ''}".strip() or pname_str
                img = c_doc.image or c_doc.user_image or ""
                email = c_doc.email_id or email

        return {"name": full_name, "image": img or "", "email": email or ""}

    sp_raw = customer_doc.get("account_manager") or customer_doc.get("sales_person") or ""
    tl_raw = customer_doc.get("technical_lead") or ""
    bc_raw = customer_doc.get("billing_contact") or ""

    sp_meta = resolve_person_meta(sp_raw)
    tl_meta = resolve_person_meta(tl_raw)
    bc_meta = resolve_person_meta(bc_raw)

    return {
        "customer_info": {
            "name": customer_doc.name,
            "customer_name": customer_doc.customer_name,
            "user_fullname": frappe.db.get_value("User", user, "full_name") or customer_doc.customer_name or user,
            "user_email": user,
            "image": customer_doc.get("image") or customer_doc.get("customer_logo") or "",
            "gstin": gstin,
            "shipping_gstin": shipping_gstin,
            "billing_address": billing_address,
            "shipping_address": shipping_address,
            "sales_person": sp_meta["name"] or sp_raw,
            "sales_person_image": sp_meta["image"],
            "sales_person_email": sp_meta["email"],
            "technical_lead": tl_meta["name"] or tl_raw,
            "technical_lead_image": tl_meta["image"],
            "technical_lead_email": tl_meta["email"],
            "billing_contact": bc_meta["name"] or bc_raw,
            "billing_contact_image": bc_meta["image"],
            "billing_contact_email": bc_meta["email"],
            "is_system_user": is_system_user
        },
        "is_system_user": is_system_user,
        "stats": {
            "active_licenses": active_licenses,
            "open_invoices_count": open_invoices_count,
            "open_invoices_amount": open_invoices_amount,
            "open_tickets": open_tickets,
            "next_renewal_days": next_renewal_days
        },
        "security_health": security_health,
        "renewals": renewals,
        "invoices": invoices,
        "orders": orders,
        "opportunities": opportunities,
        "quotations": quotations,
        "communications": communications,
        "support": {
            "tickets": issues,
            "priorities": priorities,
            "issue_types": issue_types
        },
        "contacts": contacts,
        "addresses": addresses,
        "address_type_options": address_type_options,
        "gst_category_options": gst_category_options,
        "status_options": status_options,
        "company_info": get_portal_company_info(target_customer)
    }

@frappe.whitelist(allow_guest=True)
def upload_portal_attachment():
    user = frappe.session.user
    if user == "Guest":
        frappe.throw(_("Please log in to upload files."))

    dt = frappe.form_dict.get("attached_to_doctype") or frappe.form_dict.get("dt") or None
    dn = frappe.form_dict.get("attached_to_name") or frappe.form_dict.get("dn") or None

    if dt == "Issue" and dn:
        if not frappe.db.exists("Issue", dn):
            frappe.throw(_("Ticket not found."))
        if user != "Guest":
            if not check_is_system_user(user):
                customer_name = get_customer_for_user(user)
                issue = frappe.get_doc("Issue", dn)
                if issue.customer and issue.customer != customer_name and issue.raised_by != user:
                    frappe.throw(_("Not permitted to attach files to this ticket."), frappe.PermissionError)
            else:
                if not frappe.has_permission("Issue", "write", dn):
                    frappe.throw(_("Not permitted to attach files to this ticket."), frappe.PermissionError)

    file = None
    if frappe.request and hasattr(frappe.request, "files") and frappe.request.files:
        for k in frappe.request.files:
            file = frappe.request.files.get(k)
            if file:
                break

    if not file and frappe.form_dict.get("filename") and frappe.form_dict.get("filedata"):
        try:
            from frappe.utils.file_manager import save_file
            import base64
            fname = frappe.form_dict.get("filename")
            content = frappe.form_dict.get("filedata")
            if "," in content:
                content = content.split(",", 1)[1]
            decoded = base64.b64decode(content)
            frappe.flags.ignore_permissions = True
            file_doc = save_file(fname, decoded, dt, dn, is_private=0)
            frappe.flags.ignore_permissions = False
            return {"status": "success", "file_url": file_doc.file_url, "name": file_doc.name, "file_name": fname}
        except Exception as ex:
            frappe.log_error(f"Error saving base64 attachment: {ex}")

    if not file:
        file = getattr(frappe, "uploaded_file", None)

    if not file:
        return {"status": "error", "message": "No file provided for upload"}

    try:
        from frappe.utils.file_manager import save_file
        fname = getattr(file, "filename", "attachment")
        content = file.read() if hasattr(file, "read") else file
        frappe.flags.ignore_permissions = True
        file_doc = save_file(fname, content, dt, dn, is_private=0)
        frappe.flags.ignore_permissions = False
        return {"status": "success", "file_url": file_doc.file_url, "name": file_doc.name, "file_name": fname}
    except Exception as ex:
        frappe.log_error(f"Error saving uploaded attachment: {ex}")
        return {"status": "error", "message": str(ex)}

@frappe.whitelist(allow_guest=False)
def create_support_ticket(
    subject,
    description,
    priority="Medium",
    category=None,
    query_type=None,
    custom_query_type=None,
    department=None,
    product_association_type=None,
    active_subscription=None,
    active_renewals=None,
    contact_email=None,
    contact_person=None,
    contacts=None,
    attachments=None,
    customer=None
):
    import json
    user = frappe.session.user
    if user == "Guest":
        frappe.throw(_("Please log in to submit a support ticket."))
        
    customer_name = get_customer_for_user(user)
    if not customer_name and check_is_system_user(user):
        customer_name = customer or frappe.form_dict.get("customer") or frappe.form_dict.get("customer_name")
        if not customer_name:
            perms = get_permitted_customers(limit=1)
            if perms:
                customer_name = perms[0]["name"]
                
    if not customer_name:
        frappe.throw(_("No Customer linked to this user."))
        
    customer_doc = frappe.get_doc("Customer", customer_name)
    sales_person = customer_doc.get("account_manager") or customer_doc.get("sales_person") or ""

    # Process contacts list
    contacts_list = []
    if contacts:
        if isinstance(contacts, str):
            try:
                contacts_list = json.loads(contacts)
            except Exception:
                contacts_list = []
        elif isinstance(contacts, list):
            contacts_list = contacts

    if not contact_email:
        if contacts_list and isinstance(contacts_list[0], dict) and contacts_list[0].get("email_id"):
            contact_email = contacts_list[0].get("email_id")
        else:
            contact_email = user

    contact_name = None
    if contact_person:
        person_name = contact_person
    elif contacts_list and isinstance(contacts_list[0], dict):
        c0 = contacts_list[0]
        person_name = c0.get("user_name") or f"{c0.get('first_name', '')} {c0.get('last_name', '')}".strip() or c0.get("email_id") or user
    else:
        db_contacts = frappe.get_all("Contact", filters={"email_id": user}, fields=["name", "first_name", "last_name"])
        if db_contacts:
            contact_name = db_contacts[0].name
            person_name = f"{db_contacts[0].first_name} {db_contacts[0].last_name or ''}".strip()
        else:
            person_name = user.split("@")[0]
        
    issue = frappe.new_doc("Issue")
    issue.status = "Created"
    issue.ticket_type = "External"
    issue.subject = subject
    issue.description = description
    issue.customer = customer_name
    issue.customer_name = customer_doc.customer_name
    issue.sales_person = sales_person
    issue.raised_by = user

    if department:
        issue.department = department

    if product_association_type:
        if issue.meta.has_field("product_association_type"):
            issue.product_association_type = product_association_type
        elif issue.meta.has_field("custom_product_association_type"):
            issue.custom_product_association_type = product_association_type

    if active_subscription:
        issue.active_subscription = active_subscription

    # Append active_renewals if passed
    renewals_list = []
    if active_renewals:
        if isinstance(active_renewals, str):
            try:
                renewals_list = json.loads(active_renewals)
            except Exception:
                renewals_list = []
        elif isinstance(active_renewals, list):
            renewals_list = active_renewals

    if renewals_list:
        for r in renewals_list:
            if isinstance(r, dict):
                issue.append("active_renewals", {
                    "item": r.get("item"),
                    "start_date": r.get("start_date"),
                    "end_date": r.get("end_date"),
                    "quantity": r.get("quantity"),
                    "amount": r.get("amount"),
                    "renewal_id": r.get("renewal_id")
                })

    # Append multiple contacts into issue_contact_list child table with resolved Contact link names
    if contacts_list:
        for c in contacts_list:
            if isinstance(c, dict):
                raw_name = c.get("name") or c.get("user_name") or ""
                email_id = (c.get("email_id") or "").strip()
                phone_no = (c.get("mobile_no") or c.get("phone") or "").strip()
                first_name = (c.get("first_name") or "").strip()
                last_name = (c.get("last_name") or "").strip()
                designation = (c.get("designation") or "").strip()
                
                # Resolve valid Contact Link name in Frappe DB
                contact_link = None
                if raw_name and frappe.db.exists("Contact", raw_name):
                    contact_link = raw_name
                elif email_id:
                    contact_link = frappe.db.get_value("Contact", {"email_id": email_id}, "name")
                
                if not contact_link and customer_name:
                    fname = first_name or (raw_name.split()[0] if raw_name else "")
                    if fname:
                        contact_link = frappe.db.get_value("Contact", {"first_name": fname, "company_name": customer_name}, "name")
                        if not contact_link:
                            contact_link = frappe.db.get_value("Contact", {"first_name": fname}, "name")

                # If contact doc does not exist yet (manual entry), create it dynamically to bypass LinkValidationError
                if not contact_link and (first_name or raw_name or email_id):
                    try:
                        new_c = frappe.get_doc({
                            "doctype": "Contact",
                            "first_name": first_name or raw_name or "Contact",
                            "last_name": last_name,
                            "email_id": email_id,
                            "phone": phone_no,
                            "mobile_no": phone_no,
                            "designation": designation,
                            "company_name": customer_name or "",
                            "links": [{"link_doctype": "Customer", "link_name": customer_name}] if customer_name and frappe.db.exists("Customer", customer_name) else []
                        })
                        new_c.insert(ignore_permissions=True)
                        contact_link = new_c.name
                    except Exception as ex:
                        frappe.log_error(f"Failed to auto-create contact: {ex}")

                if contact_link:
                    issue.append("issue_contact_list", {
                        "user_name": contact_link,
                        "email_id": email_id,
                        "mobile_no": phone_no,
                        "designation": designation,
                        "company_name": customer_name,
                        "tpoc": 1 if (c.get("is_primary") or c.get("is_primary_contact") or c.get("tpoc") or c.get("custom_tpoc")) else 0
                    })
    
    # Priority handling
    db_priority = "Medium"
    if priority == "Urgent":
        db_priority = "High"
    elif priority == "Normal":
        db_priority = "Medium"
    else:
        db_priority = priority or "Medium"
    issue.priority = db_priority
    
    # Query Type strictly mapped to custom_query_type
    resolved_query_type = custom_query_type or query_type or category or ""
    if resolved_query_type:
        if issue.meta.has_field("custom_query_type"):
            issue.custom_query_type = resolved_query_type
        elif issue.meta.has_field("query_type"):
            issue.query_type = resolved_query_type
        
    issue.raised_via_channel = "Customer Portal"
    issue.via_customer_portal = 1
    issue.flags.mute_emails = True
    issue.flags.ignore_notifications = True
    issue.flags.create_communication = False
    issue.flags.ignore_permissions = True
    issue.flags.ignore_version = True
    issue.flags.ignore_links = True

    prev_mute_emails = getattr(frappe.flags, "mute_emails", False)
    try:
        frappe.flags.mute_emails = True
        issue.insert(ignore_permissions=True)
    except frappe.exceptions.TimestampMismatchError:
        pass
    except Exception as e:
        frappe.log_error(f"Error inserting ticket: {e}")
        try:
            issue.insert(ignore_permissions=True)
        except Exception:
            pass
    finally:
        frappe.flags.mute_emails = prev_mute_emails

    # Explicitly sync contact fields directly to DB after insertion (prevents triggering on_insert notification hooks)
    fields_to_sync = {
        "person_name": person_name,
        "contact_email": contact_email,
        "contact": contact_name
    }
    for fld, val in fields_to_sync.items():
        if val and str(val).strip():
            try:
                frappe.db.set_value("Issue", issue.name, fld, str(val).strip(), update_modified=False)
                setattr(issue, fld, str(val).strip())
            except Exception as ex:
                frappe.log_error(f"Error setting field {fld}: {ex}")

    # Safety check: ensure no email queue or automated communication was created for this portal ticket
    frappe.db.sql("DELETE FROM `tabEmail Queue` WHERE reference_doctype = 'Issue' AND reference_name = %s", issue.name)
    frappe.db.sql("DELETE FROM `tabCommunication` WHERE reference_doctype = 'Issue' AND reference_name = %s AND communication_type = 'Automated Message'", issue.name)

    frappe.db.commit()
    
    # Handle attachments with ignored permissions
    if attachments:
        if isinstance(attachments, str):
            import json
            try:
                attachments = json.loads(attachments)
            except Exception:
                attachments = []
        if isinstance(attachments, list):
            frappe.flags.ignore_permissions = True
            for file_url in attachments:
                if file_url and isinstance(file_url, str):
                    file_names = frappe.get_all("File", filters={"file_url": file_url}, fields=["name"], ignore_permissions=True)
                    if not file_names:
                        fname = file_url.split('/')[-1]
                        file_names = frappe.get_all("File", filters=[["File", "file_name", "like", f"%{fname}%"]], fields=["name"], ignore_permissions=True)
                    for f in file_names:
                        try:
                            frappe.db.set_value("File", f["name"], {
                                "attached_to_doctype": "Issue",
                                "attached_to_name": issue.name,
                                "is_private": 0
                            }, update_modified=False)
                        except Exception as ex:
                            frappe.log_error(f"Failed to update file {f['name']}: {ex}")
            frappe.flags.ignore_permissions = False

    frappe.db.commit()
    frappe.clear_messages()
    frappe.clear_document_cache("Issue", issue.name)
    fresh_doc = frappe.get_doc("Issue", issue.name)
    return {
        "status": "success",
        "name": issue.name,
        "ticket_id": issue.name,
        "modified": str(fresh_doc.modified)
    }

@frappe.whitelist(allow_guest=True)
def save_account_settings(legal_name=None, gstin=None, billing_address=None):
    user = frappe.session.user
    if user == "Guest":
        frappe.throw(_("Please log in to save account settings."))
        
    customer_name = get_customer_for_user(user)
    if not customer_name:
        frappe.throw(_("No Customer linked to this user."))
        
    cleaned_gstin = (gstin or "").strip().upper()
    if cleaned_gstin:
        import re
        gstin_regex = r"^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[0-9A-Z]{1}[Z0-9A-Z]{1}[0-9A-Z]{1}$"
        if not re.match(gstin_regex, cleaned_gstin) and len(cleaned_gstin) != 15:
            frappe.throw(_("Invalid GSTIN format! GSTIN must be 15 characters (e.g. 37AABCA9106B1Z5)."))

    customer_meta = frappe.get_meta("Customer")
    update_dict = {}
    if customer_meta.has_field("gstin"):
        update_dict["gstin"] = cleaned_gstin
    if customer_meta.has_field("tax_id"):
        update_dict["tax_id"] = cleaned_gstin

    if update_dict:
        frappe.db.set_value("Customer", customer_name, update_dict)

    # Also update GSTIN on linked Address records for this Customer
    address_names = frappe.get_all("Dynamic Link", 
        filters={"link_doctype": "Customer", "link_name": customer_name, "parenttype": "Address"}, 
        pluck="parent")
    
    address_meta = frappe.get_meta("Address")
    if address_names and address_meta.has_field("gstin"):
        for addr_name in address_names:
            frappe.db.set_value("Address", addr_name, "gstin", cleaned_gstin)
    elif not address_names:
        try:
            customer_doc = frappe.get_doc("Customer", customer_name)
            new_addr = frappe.new_doc("Address")
            new_addr.address_title = f"{customer_doc.customer_name or customer_name} (Billing)"
            new_addr.address_type = "Billing"
            new_addr.address_line1 = customer_doc.customer_name or customer_name
            new_addr.city = "Primary"
            new_addr.country = "India"
            new_addr.gstin = cleaned_gstin
            new_addr.is_primary_address = 1
            new_addr.append("links", {
                "link_doctype": "Customer",
                "link_name": customer_name
            })
            new_addr.save(ignore_permissions=True)
        except Exception:
            pass
    
    frappe.db.commit()
    return {"status": "success"}


@frappe.whitelist(allow_guest=True)
def upload_company_logo():
    user = frappe.session.user
    if user == "Guest":
        frappe.throw(_("Please log in to update company logo."))
        
    customer_name = get_customer_for_user(user)
    if not customer_name:
        frappe.throw(_("No Customer linked to this user."))
        
    file_url = None
    if "file" in frappe.request.files:
        file_obj = frappe.request.files["file"]
        saved_file = frappe.get_doc({
            "doctype": "File",
            "file_name": file_obj.filename,
            "attached_to_doctype": "Customer",
            "attached_to_name": customer_name,
            "is_private": 0,
            "content": file_obj.read()
        })
        saved_file.save(ignore_permissions=True)
        file_url = saved_file.file_url
    else:
        file_url = frappe.form_dict.get("file_url")

    if not file_url:
        frappe.throw(_("No file uploaded."))

    customer_meta = frappe.get_meta("Customer")
    if customer_meta.has_field("image"):
        frappe.db.set_value("Customer", customer_name, "image", file_url)
    if customer_meta.has_field("customer_logo"):
        frappe.db.set_value("Customer", customer_name, "customer_logo", file_url)
        
    frappe.db.commit()
    return {"status": "success", "file_url": file_url}


@frappe.whitelist(allow_guest=False)
def save_portal_address(docname=None, address_title=None, address_type="Billing", address_line1=None, address_line2=None, city=None, state=None, country="India", pincode=None, gstin=None, gst_category=None, is_primary_billing=0, is_primary_shipping=0):
    user = frappe.session.user
    if user == "Guest":
        frappe.throw(_("Please log in to save address."))
        
    customer_name = get_customer_for_user(user)
    if not customer_name:
        frappe.throw(_("No Customer linked to this user."))
        
    if not address_line1 or not address_line1.strip():
        frappe.throw(_("Address Line 1 is required."))
    if not city or not city.strip():
        frappe.throw(_("City is required."))
        
    # Clean GSTIN if provided
    cleaned_gstin = (gstin or "").strip().upper()
    if cleaned_gstin:
        import re
        gstin_regex = r"^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$"
        if not re.match(gstin_regex, cleaned_gstin):
            frappe.throw(_("Invalid GSTIN format! GSTIN must be 15 characters (e.g. 22AAAAA0000A1Z5)."))

    is_primary_billing = 1 if is_primary_billing in (1, "1", True, "true") else 0
    is_primary_shipping = 1 if is_primary_shipping in (1, "1", True, "true") else 0

    address_links = frappe.get_all("Dynamic Link", filters={"link_doctype": "Customer", "link_name": customer_name, "parenttype": "Address"}, fields=["parent"])
    existing_parents = [d.parent for d in address_links] if address_links else []

    if is_primary_billing == 1 and existing_parents:
        frappe.db.sql("""UPDATE `tabAddress` SET is_primary_address = 0 WHERE name IN %s""", (tuple(existing_parents),))

    if is_primary_shipping == 1 and existing_parents:
        frappe.db.sql("""UPDATE `tabAddress` SET is_shipping_address = 0 WHERE name IN %s""", (tuple(existing_parents),))

    if docname:
        address = frappe.get_doc("Address", docname)
        has_link = any(l.link_doctype == "Customer" and l.link_name == customer_name for l in address.links)
        if not has_link:
            frappe.throw(_("Permission denied for this Address record."))
    else:
        address = frappe.new_doc("Address")
        address.append("links", {
            "link_doctype": "Customer",
            "link_name": customer_name
        })

    address.address_title = address_title or f"{customer_name} - {address_type or 'Billing'}"
    address.address_type = address_type or "Billing"
    address.address_line1 = address_line1.strip()
    address.address_line2 = (address_line2 or "").strip()
    address.city = city.strip()
    address.state = (state or "").strip()
    address.country = (country or "India").strip()
    address.pincode = (pincode or "").strip()
    address.gstin = cleaned_gstin
    if gst_category:
        address.gst_category = gst_category
    address.is_primary_address = is_primary_billing
    address.is_shipping_address = is_primary_shipping

    address.save(ignore_permissions=True)
    frappe.db.commit()
    return {"status": "success", "name": address.name}


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

    doc = frappe.get_doc("Sales Invoice", invoice_name)
    if doc.get("custom_zoho_invoice"):
        from frappe.utils.file_manager import get_file
        try:
            fname, content = get_file(doc.custom_zoho_invoice)
            if isinstance(content, str):
                content = content.encode("utf-8")
            pdf_b64 = base64.b64encode(content).decode("utf-8")
            return {
                "pdf_b64": pdf_b64,
                "filename": fname or f"{invoice_name}.pdf"
            }
        except Exception as e:
            frappe.log_error(f"Error loading custom zoho invoice for {invoice_name}: {e}", "Portal Invoice Zoho File Error")

    # Set flag so get_rendered_template skips its own permission check
    # (ownership was already validated above using the DB check)
    frappe.flags.ignore_print_permissions = True
    try:
        from frappe.www.printview import get_rendered_template, get_print_format_doc
        from frappe.utils.pdf import get_pdf

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
        
    frappe.clear_document_cache("Issue", ticket_name)
    issue = frappe.get_doc("Issue", ticket_name)
    
    # Permission check: guest or user must be linked to customer or raised by OR have permission on Issue
    if user != "Guest":
        if check_is_system_user(user):
            if not frappe.has_permission("Issue", "read", issue):
                frappe.throw(_("Not permitted"), frappe.PermissionError)
        else:
            customer_name = get_customer_for_user(user)
            if issue.customer and issue.customer != customer_name and issue.raised_by != user:
                frappe.throw(_("Not permitted"), frappe.PermissionError)
            
    # Helper for user details
    def resolve_user_meta(uid):
        if not uid:
            return {"full_name": "", "user_image": "", "role_profile": "", "designation": ""}
        if not frappe.db.exists("User", uid):
            return {"full_name": uid, "user_image": "", "role_profile": "", "designation": ""}
        udata = frappe.db.get_value("User", uid, ["full_name", "user_image", "role_profile_name"], as_dict=True)
        if udata:
            return {
                "full_name": udata.full_name or uid,
                "user_image": udata.user_image or "",
                "role_profile": udata.role_profile_name or "",
                "designation": udata.role_profile_name or ""
            }
        return {"full_name": uid, "user_image": "", "role_profile": "", "designation": ""}

    working_agent_name = "-"
    if issue.working_agent:
        working_agent_name = frappe.db.get_value("User", issue.working_agent, "full_name") or issue.working_agent

    attachments = frappe.get_all("File",
        filters={"attached_to_doctype": "Issue", "attached_to_name": ticket_name},
        fields=["name", "file_name", "file_url", "file_size", "creation"],
        order_by="creation desc",
        ignore_permissions=True
    )

    try:
        comment_names = frappe.get_all("Comment", filters={"reference_doctype": "Issue", "reference_name": ticket_name}, pluck="name", ignore_permissions=True) or []
        comm_names = frappe.get_all("Communication", filters={"reference_doctype": "Issue", "reference_name": ticket_name}, pluck="name", ignore_permissions=True) or []

        extra_files = []
        if comment_names:
            extra_files.extend(frappe.get_all("File", filters=[["attached_to_doctype", "=", "Comment"], ["attached_to_name", "in", comment_names]], fields=["name", "file_name", "file_url", "file_size", "creation"], ignore_permissions=True))
        if comm_names:
            extra_files.extend(frappe.get_all("File", filters=[["attached_to_doctype", "=", "Communication"], ["attached_to_name", "in", comm_names]], fields=["name", "file_name", "file_url", "file_size", "creation"], ignore_permissions=True))

        for ef in extra_files:
            if not any(a.get("name") == ef.get("name") or a.get("file_url") == ef.get("file_url") for a in attachments):
                attachments.append(ef)

        attachments.sort(key=lambda x: str(x.get("creation") or ""), reverse=True)
    except Exception as ex:
        frappe.log_error(f"Error fetching extra attachments for {ticket_name}: {ex}")

    working_agent_details = resolve_user_meta(issue.working_agent)
    raised_by_details = resolve_user_meta(issue.raised_by)
    
    sales_person_name = issue.get("sales_person") or ""
    sales_person_details = {"full_name": sales_person_name, "user_image": "", "role_profile": "", "designation": ""}
    if sales_person_name:
        if frappe.db.exists("User", sales_person_name):
            sales_person_details = resolve_user_meta(sales_person_name)
        else:
            emp = frappe.db.get_value("Sales Person", sales_person_name, "employee")
            emp_user = frappe.db.get_value("Employee", emp, "user_id") if emp else None
            if emp_user:
                sales_person_details = resolve_user_meta(emp_user)

    technician_visits = []
    if frappe.db.table_exists("Technician Visit"):
        technician_visits = frappe.get_all(
            "Technician Visit",
            filters={"issue": ticket_name},
            fields=[
                "name", "status", "visit_type", "visit_date", "visit_priority", "time_slot",
                "assigned_technician", "customer_contact", "location"
            ],
            order_by="creation desc"
        )

    customer_contacts = []
    # 1. Fetch issue-specific contacts from issue_contact_list child table
    for row in (issue.get("issue_contact_list") or issue.get("contact_list") or issue.get("custom_contacts") or []):
        person_name = row.get("user_name") or row.get("contact_name") or row.get("person_name") or row.get("name") or ""
        if person_name or row.get("email_id"):
            customer_contacts.append({
                "name": row.get("name") or person_name,
                "person_name": person_name,
                "user_name": row.get("user_name") or "",
                "designation": row.get("designation") or "Contact",
                "email_id": row.get("email_id") or "",
                "mobile_no": row.get("mobile_no") or "",
                "is_primary": row.get("tpoc") or row.get("is_primary_contact") or 0
            })

    # 2. Fallback to customer linked contacts if issue_contact_list is empty
    if not customer_contacts and issue.customer:
        c_list = frappe.get_all("Contact",
            filters=[["Dynamic Link", "link_doctype", "=", "Customer"], ["Dynamic Link", "link_name", "=", issue.customer]],
            fields=["name", "first_name", "last_name", "email_id", "phone", "mobile_no", "designation", "is_primary_contact"]
        )
        for c in c_list:
            full_c_name = f"{c.first_name or ''} {c.last_name or ''}".strip() or c.name
            customer_contacts.append({
                "name": c.name,
                "person_name": full_c_name,
                "designation": c.designation or "Contact",
                "email_id": c.email_id or "",
                "mobile_no": c.mobile_no or c.phone or "",
                "is_primary": c.is_primary_contact or 0
            })

    # Fetch scope of work and checklist details
    scope_of_work = (issue.get("scope_of_work") or issue.get("custom_scope_of_work") or "").strip()
    checklist_state = issue.get("custom_checklist_state") or ""
    checklist_items = []

    # 1. Fetch SLA Task checklist (matching ticket_list.py logic)
    query_type = issue.get("custom_query_type") or issue.get("issue_type")
    active_sub = issue.get("active_subscription")
    if query_type:
        item_group = None
        if active_sub:
            item_group = frappe.db.get_value("Renewal Item", {"parent": active_sub}, "item_group")
            if not item_group:
                product_name = frappe.db.get_value("Renewal List", active_sub, "product_name")
                if product_name:
                    item_group = frappe.db.get_value("Item", {"item_code": product_name}, "item_group")
                    if not item_group:
                        item_group = frappe.db.get_value("Item", {"item_name": product_name}, "item_group")

        sla_task_name = None
        if item_group:
            sla_task_name = frappe.db.get_value("SLA Task", {"task_name": query_type, "item_group": item_group, "status": "Active"}, "name")
        if not sla_task_name:
            sla_task_name = frappe.db.get_value("SLA Task", {"task_name": query_type, "status": "Active"}, "name")
        if not sla_task_name:
            sla_task_name = frappe.db.get_value("SLA Task", {"name": query_type, "status": "Active"}, "name")

        if sla_task_name:
            raw_checklist = frappe.get_all(
                "SLA Checklist",
                filters={"parent": sla_task_name, "parenttype": "SLA Task"},
                fields=["support_level", "activity", "sequence"],
                order_by="sequence asc",
                ignore_permissions=True
            )
            for row in raw_checklist:
                title = (row.get("activity") or row.get("item") or row.get("title") or "").strip()
                if title:
                    checklist_items.append({
                        "item": title,
                        "activity": title,
                        "support_level": row.get("support_level") or "",
                        "level": row.get("support_level") or "",
                        "sequence": row.get("sequence") or 0
                    })

    # 2. Fallback: Parse custom_checklist_state if checklist_items is empty
    if not checklist_items and checklist_state:
        try:
            import json
            parsed_state = json.loads(checklist_state) if isinstance(checklist_state, str) else checklist_state
            if isinstance(parsed_state, dict):
                selected = parsed_state.get("_selected_items")
                if isinstance(selected, list):
                    for st in selected:
                        title = st.split("::")[-1].strip() if isinstance(st, str) and "::" in st else str(st)
                        lvl = st.split("::")[0].strip() if isinstance(st, str) and "::" in st else ""
                        if title:
                            checklist_items.append({
                                "item": title,
                                "activity": title,
                                "support_level": lvl,
                                "level": lvl
                            })
                for k, v in parsed_state.items():
                    if k.startswith("_"):
                        continue
                    title = k.split("::")[-1].strip() if "::" in k else k.strip()
                    lvl = k.split("::")[0].strip() if "::" in k else ""
                    if title and not any(ci["item"] == title for ci in checklist_items):
                        checklist_items.append({
                            "item": title,
                            "activity": title,
                            "support_level": lvl,
                            "level": lvl
                        })
        except Exception:
            pass

    raw_activity = []
    try:
        from renewal_module.custom_module.page.ticket_list.ticket_list import get_issue_activity
        raw_activity = get_issue_activity(ticket_name)
    except Exception as e:
        frappe.log_error(f"Error fetching issue activity: {e}", "Portal Ticket Details")
        raw_activity = []
    
    # Map attachments by file name for link enrichment
    att_map = {}
    for att in attachments:
        fname = att.get("file_name")
        furl = att.get("file_url")
        if fname and furl:
            att_map[fname] = furl

    # Filter activity for customer portal visibility (exclude internal notes, internal agent system logs, and redundant initial description)
    customer_activity = []
    issue_desc_clean = frappe.utils.strip_html_tags(issue.get("description") or "").strip()
    allowed_types = {"Comment", "Communication", "Status Change", "Created", "Document Created", "File Attached", "Attachment", "Info Added", "Resolution"}
    
    for act in raw_activity:
        act_type = act.get("type") or ""
        desc = (act.get("description") or "").strip()
        desc_clean = frappe.utils.strip_html_tags(desc).strip()
        
        # Exclude internal notes or hidden internal activity
        if act_type in allowed_types or "Status" in act_type:
            if "[Internal" in desc or "[Private]" in desc or act_type == "Internal Note":
                continue

            # Exclude initial ticket description from activity feed (since it's already shown in Overview)
            if act_type in ("Communication", "Customer Message") and act.get("sent_or_received") != "Sent":
                if desc_clean == issue_desc_clean or not act.get("recipients"):
                    continue

            # Enrich plain text file references with clickable HTML links
            if att_map and desc:
                for fname, furl in att_map.items():
                    if fname in desc and f'href="{furl}"' not in desc and f"href='{furl}'" not in desc:
                        pattern = f"📎 {fname}" if f"📎 {fname}" in desc else fname
                        link_html = f'<a href="{furl}" target="_blank" style="color:var(--indigo);font-weight:600;text-decoration:underline;">📎 {fname}</a>'
                        desc = desc.replace(pattern, link_html)
                        act["description"] = desc
                        act["is_html"] = True

            if "<a " in desc or "<div" in desc or "📎" in desc or act_type in ("File Attached", "Attachment"):
                act["is_html"] = True
            customer_activity.append(act)

    # Ensure any file attachment without an existing timeline event is added (avoiding duplicates)
    for att in attachments:
        file_url = att.get("file_url")
        file_name = att.get("file_name") or "Attachment"
        if not file_url:
            continue
        already_present = any(
            (file_url and file_url in str(act.get("description") or "")) or
            (file_name and file_name in str(act.get("description") or "")) or
            (file_url and file_url in str(act.get("content") or "")) or
            (file_name and file_name in str(act.get("content") or ""))
            for act in customer_activity
        )
        if not already_present:
            owner_id = att.get("owner")
            uploader = resolve_user_meta(owner_id).get("full_name") or owner_id or "User"
            creation_stamp = str(att.get("creation")) if att.get("creation") else ""
            customer_activity.append({
                "type": "File Attached",
                "title": f"{uploader} File Attached",
                "description": f'Added <a href="{file_url}" target="_blank" style="color:var(--indigo);font-weight:600;text-decoration:underline;">📎 {file_name}</a>',
                "timestamp": creation_stamp,
                "display": frappe.utils.format_datetime(creation_stamp, "medium") if creation_stamp else "",
                "by": uploader,
                "color": "info",
                "is_html": True
            })

    customer_activity.sort(key=lambda x: str(x.get("timestamp") or ""), reverse=True)

    # Fetch ticket-specific renewal details from Issue's active_renewals child table
    active_renewals = []
    for row in issue.get("active_renewals") or []:
        active_renewals.append({
            "item": row.get("item") or row.get("item_name") or "",
            "renewal_id": row.get("renewal_id") or "",
            "start_date": str(row.get("start_date")) if row.get("start_date") else "",
            "end_date": str(row.get("end_date")) if row.get("end_date") else "",
            "quantity": row.get("quantity") or row.get("qty") or "",
            "amount": row.get("amount") or ""
        })
    
    # Fetch assignees
    assignees = []
    raw_assign = issue.get("_assign")
    if raw_assign:
        try:
            import json
            assignees = json.loads(raw_assign) if isinstance(raw_assign, str) else raw_assign
        except Exception:
            assignees = []

    assignees_details = []
    for u_id in assignees:
        if u_id:
            u_info = frappe.db.get_value("User", u_id, ["name", "full_name", "user_image", "email"], as_dict=True)
            if u_info:
                assignees_details.append({
                    "name": u_info.name,
                    "full_name": u_info.full_name or u_info.name,
                    "user_image": u_info.user_image or "",
                    "email": u_info.email or u_info.name
                })

    res_details = issue.get("resolution_details") or issue.get("resolution") or ""
    
    cust_val = issue.customer or getattr(issue, "customer_name", "") or getattr(issue, "custom_customer", "") or ""
    
    email_logs = []
    try:
        if frappe.db.exists("DocType", "Communication"):
            comms = frappe.get_all("Communication",
                filters=[
                    ["reference_doctype", "=", "Issue"],
                    ["reference_name", "=", ticket_name],
                    ["communication_type", "in", ["Communication", "Automated Message"]],
                    ["sent_or_received", "=", "Sent"]
                ],
                fields=["name", "subject", "recipients", "cc", "bcc", "creation", "delivery_status", "sender", "content", "sent_or_received"],
                order_by="creation desc",
                ignore_permissions=True
            )
            for c in comms:
                if c.get("recipients") and c.get("recipients") != "N/A":
                    st = (c.get("delivery_status") or "Sent").capitalize()
                    is_sent = st in ("Sent", "Delivered", "Read", "Completed")
                    email_logs.append({
                        "name": c.name,
                        "subject": c.subject or f"Ticket No: {ticket_name}",
                        "status": "sent" if is_sent else "fail",
                        "status_text": st if st else "Sent",
                        "creation": str(c.creation),
                        "recipients": c.recipients or "N/A",
                        "sender": c.sender or "",
                        "cc": c.get("cc") or "",
                        "bcc": c.get("bcc") or "",
                        "content": c.content or ""
                    })
    except Exception as e:
        frappe.log_error(f"Error fetching email logs for issue {ticket_name}: {e}", "Portal Ticket Details")

    def is_internal_or_system_comment(text, sender=""):
        if not text:
            return True
        lower_text = text.lower()
        if "[internal" in lower_text or "[private]" in lower_text or "[system]" in lower_text:
            return True
        if "escalated to" in lower_text and ("sla" in lower_text or "threshold" in lower_text or "assigned:" in lower_text or "support" in lower_text):
            return True
        if "sla response breach" in lower_text or "sla resolution breach" in lower_text or "breach threshold" in lower_text:
            return True
        if "initial assignment to creator" in lower_text or "assigned to creator" in lower_text:
            return True
        if sender == "Administrator" and ("escalated" in lower_text or "assigned" in lower_text or "sla" in lower_text):
            return True
        return False

    comments_list = []
    try:
        # 1. Fetch from Comment doctype (Public user comments)
        if frappe.db.exists("DocType", "Comment"):
            raw_comments = frappe.get_all("Comment",
                filters={"reference_doctype": "Issue", "reference_name": ticket_name, "comment_type": "Comment"},
                fields=["name", "comment_by", "comment_email", "content", "creation"],
                order_by="creation asc",
                ignore_permissions=True
            )
            for cm in raw_comments:
                content_str = (cm.content or "").strip()
                sender_val = cm.comment_email or cm.comment_by or ""
                if is_internal_or_system_comment(content_str, sender_val):
                    continue
                user_meta = resolve_user_meta(sender_val)
                comments_list.append({
                    "name": cm.name,
                    "sender": sender_val,
                    "sender_full_name": user_meta.get("full_name") or cm.comment_by or "User",
                    "content": content_str,
                    "creation": str(cm.creation),
                    "timestamp": str(cm.creation)
                })

        # 2. Fetch from Communication doctype (System user & Agent replies)
        if frappe.db.exists("DocType", "Communication"):
            raw_comms = frappe.get_all("Communication",
                filters={
                    "reference_doctype": "Issue",
                    "reference_name": ticket_name,
                    "communication_type": ["in", ["Communication", "Comment", "Feedback"]]
                },
                fields=["name", "sender", "sender_full_name", "content", "creation", "subject", "sent_or_received"],
                order_by="creation asc",
                ignore_permissions=True
            )
            for cm in raw_comms:
                content_str = (cm.content or "").strip()
                if is_internal_or_system_comment(content_str, cm.sender):
                    continue
                # Exclude automated system email notification templates
                subj = (cm.get("subject") or "").lower()
                if "your ticket has been created" in subj or "notification sent to" in subj:
                    continue
                if "<table" in content_str or "<!doctype" in content_str.lower() or "<html" in content_str.lower():
                    continue

                content_clean = frappe.utils.strip_html_tags(content_str).strip()
                if content_clean == issue_desc_clean and cm.get("sent_or_received") != "Sent":
                    continue
                if any(existing.get("name") == cm.name or existing.get("content") == content_str for existing in comments_list):
                    continue

                user_meta = resolve_user_meta(cm.sender)
                sender_name = cm.sender_full_name or user_meta.get("full_name") or cm.sender or "Support Team"
                comments_list.append({
                    "name": cm.name,
                    "sender": cm.sender,
                    "sender_full_name": sender_name,
                    "content": content_str,
                    "creation": str(cm.creation),
                    "timestamp": str(cm.creation)
                })

        # Sort all conversation messages chronologically
        comments_list.sort(key=lambda x: str(x.get("creation") or ""))
    except Exception as e:
        frappe.log_error(f"Error fetching comments for issue {ticket_name}: {e}", "Portal Ticket Details")

    return {
        "comments": comments_list,
        "assignees": assignees,
        "assignees_details": assignees_details,
        "name": issue.name,
        "subject": issue.subject,
        "status": issue.status,
        "creation": str(issue.creation),
        "modified": str(issue.modified),
        "customer": cust_val,
        "customer_name": cust_val,
        "raised_by_details": raised_by_details,
        "working_agent": issue.working_agent,
        "working_agent_name": working_agent_details.get("full_name") or working_agent_name,
        "working_agent_details": working_agent_details,
        "sales_person": sales_person_name,
        "sales_person_details": sales_person_details,
        "priority": issue.priority,
        "description": issue.description,
        "issue_type": issue.issue_type,
        "custom_query_type": issue.get("custom_query_type") or issue.issue_type or "",
        "category": issue.get("custom_query_type") or issue.issue_type or issue.get("category") or "",
        "custom_support_type": issue.get("custom_support_type") or issue.get("support_type") or "",
        "ticket_type": issue.get("ticket_type") or "External",
        "location": issue.get("location") or issue.get("custom_location") or issue.get("customer_territory") or "",
        "contact_email": issue.contact_email,
        "person_name": issue.person_name,
        "scope_of_work": scope_of_work,
        "checklist_state": checklist_state,
        "custom_checklist_state": checklist_state,
        "checklist_items": checklist_items,
        "resolution_details": res_details,
        "resolution_by": str(issue.resolution_by) if issue.resolution_by else None,
        "sla_resolution_by": str(issue.sla_resolution_by) if issue.sla_resolution_by else None,
        "response_by": str(issue.response_by) if issue.get("response_by") else None,
        "first_responded_on": str(issue.first_responded_on) if issue.get("first_responded_on") else None,
        "resolution_date": str(issue.resolution_date) if issue.get("resolution_date") else None,
        "sla_t1": str(issue.get("sla_t1")) if issue.get("sla_t1") else None,
        "sla_t2": str(issue.get("sla_t2")) if issue.get("sla_t2") else None,
        "sla_t3": str(issue.get("sla_t3")) if issue.get("sla_t3") else None,
        "agreement_status": issue.agreement_status or "-",
        "customer": issue.customer,
        "customer_name": issue.customer_name,
        "technician_visits": technician_visits,
        "customer_contacts": customer_contacts,
        "active_renewals": active_renewals,
        "attachments": attachments,
        "activity": customer_activity,
        "emails": email_logs
    }

@frappe.whitelist(allow_guest=False)
def add_ticket_reply(ticket_name, comment_text, attachments=None):
    user = frappe.session.user
    if user == "Guest":
        frappe.throw(_("Please log in to reply to tickets."), frappe.PermissionError)
        
    if not ticket_name or not comment_text or not comment_text.strip():
        frappe.throw(_("Reply content cannot be empty."))
        
    if not frappe.db.exists("Issue", ticket_name):
        frappe.throw(_("Ticket not found."))
        
    issue = frappe.get_doc("Issue", ticket_name)
    if not check_is_system_user(user):
        customer_name = get_customer_for_user(user)
        if issue.customer and issue.customer != customer_name and issue.raised_by != user:
            frappe.throw(_("Not permitted to modify this ticket."), frappe.PermissionError)
    else:
        if not frappe.has_permission("Issue", "write", issue):
            frappe.throw(_("Not permitted to modify this ticket."), frappe.PermissionError)
        
    reply_html = comment_text.strip()
    
    # Process attached files if present
    parsed_attachments = []
    if attachments:
        import json
        if isinstance(attachments, str):
            try:
                parsed_attachments = json.loads(attachments)
            except Exception:
                parsed_attachments = []
        elif isinstance(attachments, list):
            parsed_attachments = attachments

    if parsed_attachments:
        attachment_links = []
        for att in parsed_attachments:
            if isinstance(att, dict):
                f_name = att.get("name")
                f_url = att.get("file_url")
                display_name = att.get("file_name") or f_name or "Attachment"
            else:
                f_url = str(att)
                f_name = None
                display_name = "Attachment"

            # Ensure file document is attached to the Issue
            if f_name and frappe.db.exists("File", f_name):
                frappe.db.set_value("File", f_name, {
                    "attached_to_doctype": "Issue",
                    "attached_to_name": ticket_name
                }, update_modified=False)
            elif f_url:
                file_docs = frappe.get_all("File", filters={"file_url": f_url}, fields=["name"])
                for fd in file_docs:
                    frappe.db.set_value("File", fd.name, {
                        "attached_to_doctype": "Issue",
                        "attached_to_name": ticket_name
                    }, update_modified=False)

            if f_url:
                attachment_links.append(f'<div style="margin-top:4px;"><a href="{f_url}" target="_blank" style="color:var(--indigo);font-weight:500;">📎 {display_name}</a></div>')
        
        if attachment_links:
            reply_html += '<div style="margin-top:10px;padding-top:8px;border-top:1px dashed #e2e8f0;font-size:12px;color:var(--ink-soft);">' + ''.join(attachment_links) + '</div>'

    # Post comment to issue
    user_name = frappe.db.get_value("User", user, "full_name") or user
    issue.add_comment("Comment", text=reply_html, comment_email=user, comment_by=user_name)
    
    # If ticket was Client Input Pending, transition back to Open
    if issue.status == "Client Input Pending":
        issue.status = "Open"
        issue.save(ignore_permissions=True)
        
    frappe.db.commit()
    
    return get_ticket_details(ticket_name)


@frappe.whitelist(allow_guest=False)
def get_contact_detail(contact_id):
    user = frappe.session.user
    if user == "Guest":
        frappe.throw(_("Authentication required."))

    if not frappe.db.exists("Contact", contact_id):
        frappe.throw(_("Contact not found."))

    if check_is_system_user(user):
        if not frappe.has_permission("Contact", "read", contact_id):
            frappe.throw(_("Permission denied to view this contact."))
    else:
        customer_name = get_customer_for_user(user)
        if not customer_name:
            frappe.throw(_("No Customer linked to user."))

        links = frappe.get_all("Dynamic Link", filters={
            "parenttype": "Contact",
            "parent": contact_id,
            "link_doctype": "Customer",
            "link_name": customer_name
        })
        comp = frappe.db.get_value("Contact", contact_id, "company_name")
        if not links and comp != customer_name:
            frappe.throw(_("Permission denied to view this contact."))

    doc = frappe.get_doc("Contact", contact_id)
    contact_dict = doc.as_dict()
    
    contact_dict["email_ids"] = [
        {"email_id": e.email_id, "is_primary": e.is_primary}
        for e in doc.get("email_ids", [])
    ]
    contact_dict["phone_nos"] = [
        {"phone": p.phone, "is_primary_phone": p.is_primary_phone, "is_primary_mobile_no": p.is_primary_mobile_no}
        for p in doc.get("phone_nos", [])
    ]
    contact_dict["tpoc"] = doc.get("tpoc") or doc.get("custom_tpoc") or 0

    return contact_dict


@frappe.whitelist(allow_guest=False)
def save_contact(docname=None, first_name=None, last_name=None, designation=None, department=None, status=None, gender=None, is_primary=0, emails=None, phones=None, custom_linked_in=None, date_of_birth=None, address=None, tpoc=0):
    user = frappe.session.user
    if user == "Guest":
        frappe.throw(_("Authentication required."))

    customer_name = get_customer_for_user(user)
    if not customer_name:
        frappe.throw(_("No Customer linked to user {0}").format(user))

    if not first_name or not first_name.strip():
        frappe.throw(_("First Name is required."))

    first_name = first_name.strip()
    last_name = (last_name or "").strip()
    designation = (designation or "").strip()
    department = (department or "").strip()
    status = status or "Open"
    gender = gender or ""
    custom_linked_in = (custom_linked_in or "").strip()
    date_of_birth = date_of_birth or None
    address = (address or "").strip()

    is_primary_val = 1 if frappe.parse_json(is_primary) else 0
    tpoc_val = 1 if frappe.parse_json(tpoc) else 0

    if docname:
        links = frappe.get_all("Dynamic Link", filters={
            "parenttype": "Contact",
            "parent": docname,
            "link_doctype": "Customer",
            "link_name": customer_name
        })
        comp = frappe.db.get_value("Contact", docname, "company_name")
        if not links and comp != customer_name:
            frappe.throw(_("Permission denied to update this contact."))
        contact = frappe.get_doc("Contact", docname)
    else:
        contact = frappe.new_doc("Contact")
        contact.append("links", {
            "link_doctype": "Customer",
            "link_name": customer_name
        })

    contact.first_name = first_name
    contact.last_name = last_name
    contact.designation = designation
    contact.department = department
    contact.status = status
    contact.gender = gender
    contact.is_primary_contact = is_primary_val
    contact.custom_linked_in = custom_linked_in
    contact.date_of_birth = date_of_birth
    contact.company_name = customer_name
    if address:
        contact.address = address

    contact_meta = frappe.get_meta("Contact")
    if contact_meta.has_field("tpoc"):
        contact.tpoc = tpoc_val
    if contact_meta.has_field("custom_tpoc"):
        contact.custom_tpoc = tpoc_val

    contact.email_ids = []
    primary_email = ""
    if emails:
        import json
        if isinstance(emails, str):
            email_list = json.loads(emails)
        else:
            email_list = emails
        for em in email_list:
            e_str = (em.get("email_id") or "").strip()
            if e_str:
                is_p = 1 if em.get("is_primary") else 0
                if is_p and not primary_email:
                    primary_email = e_str
                contact.append("email_ids", {
                    "email_id": e_str,
                    "is_primary": is_p
                })

    if not primary_email and contact.email_ids:
        primary_email = contact.email_ids[0].email_id
    if primary_email:
        contact.email_id = primary_email

    contact.phone_nos = []
    primary_phone = ""
    if phones:
        import json
        if isinstance(phones, str):
            phone_list = json.loads(phones)
        else:
            phone_list = phones
        for ph in phone_list:
            p_str = (ph.get("phone") or "").strip()
            if p_str:
                is_pp = 1 if ph.get("is_primary_phone") else 0
                is_pm = 1 if ph.get("is_primary_mobile_no") else 0
                if (is_pp or is_pm) and not primary_phone:
                    primary_phone = p_str
                contact.append("phone_nos", {
                    "phone": p_str,
                    "is_primary_phone": is_pp,
                    "is_primary_mobile_no": is_pm
                })

    if not primary_phone and contact.phone_nos:
        primary_phone = contact.phone_nos[0].phone
    if primary_phone:
        contact.mobile_no = primary_phone
        contact.phone = primary_phone

    contact.save(ignore_permissions=True)
    frappe.db.commit()

    return {
        "name": contact.name,
        "first_name": contact.first_name,
        "last_name": contact.last_name,
        "email_id": contact.email_id,
        "phone": contact.phone,
        "mobile_no": contact.mobile_no,
        "designation": contact.designation,
        "department": contact.department,
        "status": contact.status,
        "gender": contact.gender,
        "is_primary_contact": contact.is_primary_contact,
        "tpoc": contact.get("tpoc") or contact.get("custom_tpoc") or tpoc_val
    }


@frappe.whitelist(allow_guest=False)
def update_ticket_contacts(ticket_name, contacts):
    if not frappe.session.user or frappe.session.user == "Guest":
        frappe.throw(_("Please log in to update contacts."), frappe.PermissionError)

    if not ticket_name:
        frappe.throw(_("Ticket name is required."))

    if not frappe.db.exists("Issue", ticket_name):
        frappe.throw(_("Ticket not found."))

    issue = frappe.get_doc("Issue", ticket_name)
    user_cust = get_customer_for_user(frappe.session.user)
    if user_cust and issue.customer and issue.customer != user_cust:
        frappe.throw(_("Not permitted to modify this ticket."), frappe.PermissionError)

    if isinstance(contacts, str):
        import json
        contacts = json.loads(contacts)

    issue.set("issue_contact_list", [])

    customer_name = issue.customer
    if contacts and isinstance(contacts, list):
        for c in contacts:
            if isinstance(c, dict):
                raw_name = c.get("name") or c.get("user_name") or c.get("person_name") or ""
                email_id = (c.get("email_id") or "").strip()
                phone_no = (c.get("mobile_no") or c.get("phone") or "").strip()
                first_name = (c.get("first_name") or "").strip()
                last_name = (c.get("last_name") or "").strip()
                designation = (c.get("designation") or "").strip()

                contact_link = None
                if raw_name and frappe.db.exists("Contact", raw_name):
                    contact_link = raw_name
                elif email_id:
                    contact_link = frappe.db.get_value("Contact", {"email_id": email_id}, "name")

                if not contact_link and customer_name:
                    fname = first_name or (raw_name.split()[0] if raw_name else "")
                    if fname:
                        contact_link = frappe.db.get_value("Contact", {"first_name": fname, "company_name": customer_name}, "name")
                        if not contact_link:
                            contact_link = frappe.db.get_value("Contact", {"first_name": fname}, "name")

                if not contact_link and (first_name or raw_name or email_id):
                    try:
                        new_c = frappe.get_doc({
                            "doctype": "Contact",
                            "first_name": first_name or raw_name or "Contact",
                            "last_name": last_name,
                            "email_id": email_id,
                            "phone": phone_no,
                            "mobile_no": phone_no,
                            "designation": designation,
                            "company_name": customer_name or "",
                            "links": [{"link_doctype": "Customer", "link_name": customer_name}] if customer_name and frappe.db.exists("Customer", customer_name) else []
                        })
                        new_c.insert(ignore_permissions=True)
                        contact_link = new_c.name
                    except Exception as ex:
                        frappe.log_error(f"Failed to auto-create contact: {ex}")

                if contact_link:
                    issue.append("issue_contact_list", {
                        "user_name": contact_link,
                        "email_id": email_id,
                        "mobile_no": phone_no,
                        "designation": designation,
                        "company_name": customer_name,
                        "tpoc": 1 if (c.get("is_primary") or c.get("is_primary_contact") or c.get("tpoc")) else 0
                    })

    issue.save(ignore_permissions=True)
    frappe.db.commit()
    return get_ticket_details(ticket_name)


