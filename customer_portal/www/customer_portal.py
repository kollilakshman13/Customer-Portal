import frappe
from customer_portal.api import get_customer_for_user, get_portal_company_info

def get_context(context):
    user = frappe.session.user
    context.user_email = user
    cust = None
    if user == "Guest":
        context.customer_name = "Guest"
    else:
        cust = get_customer_for_user(user)
        if not cust:
            req_cust = frappe.form_dict.get("customer")
            if req_cust and frappe.has_permission("Customer", "read", req_cust):
                cust = req_cust
            else:
                cust = frappe.db.get_value("User", user, "full_name") or user
        context.customer_name = cust or "Valued Customer"

    comp_info = get_portal_company_info(cust)
    context.company_info = comp_info
    context.company_name = comp_info.get("company_name") or "Network Security"
    context.company_display_name = comp_info.get("display_name") or "NETWORK SECURITY"
    context.company_abbr = comp_info.get("abbr") or "NSPL"
    context.company_mark = comp_info.get("mark") or "64"
    context.title = f"Dashboard - {context.company_abbr}"
    context.full_width = True
