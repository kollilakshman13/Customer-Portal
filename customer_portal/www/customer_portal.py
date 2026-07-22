import frappe
from customer_portal.api import get_customer_for_user

def get_context(context):
    user = frappe.session.user
    context.user_email = user
    if user == "Guest":
        context.customer_name = "Guest"
    else:
        context.customer_name = get_customer_for_user(user)
    context.full_width = True
