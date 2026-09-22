import frappe
import frappe.www.login

no_cache = True

def get_context(context):
	# Call standard Frappe login context to get all variables (logo, app_name, social login options, etc.)
	frappe.www.login.get_context(context)
	
	# Add any custom context if needed
	context.title = frappe._("Portal Login")
	return context
