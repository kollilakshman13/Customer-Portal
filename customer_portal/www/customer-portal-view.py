import frappe
from customer_portal.api import get_customer_for_user

no_cache = 1

def get_context(context):
    user = frappe.session.user
    if not user or user == "Guest":
        frappe.local.flags.redirect_location = "/login"
        raise frappe.Redirect

    context.no_cache = 1
    context.user_email = user
    context.customer_name = get_customer_for_user(user)
    context.title = "Overview - 64 NSPL"
    context.full_width = True

