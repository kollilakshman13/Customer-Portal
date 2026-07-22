<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Customer Portal — AssetIQ</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,700&display=swap%22 rel="stylesheet">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/tabler-icons/2.44.0/iconfont/tabler-icons.min.css">
<style>

  :root{

    --ink:#14161f; --ink-soft:#5b5f70; --line:#e6e8f0;

    --surface:#ffffff; --canvas:#f6f7fb;

    --indigo:#3b7ef8; --indigo-deep:#2f4de0; --indigo-wash:#eef3fe;

    --amber:#eaa100; --amber-wash:#fdf3de;

    --green:#1c9b6b; --green-wash:#e7f7f0;

    --red:#e0453f; --red-wash:#fdeceb;

  }

  *{box-sizing:border-box;}

  body{margin:0;background:var(--canvas);color:var(--ink);font-family:'DM Sans',sans-serif;font-size:14px;}
 
  .pf-shell{display:grid;grid-template-columns:230px 1fr;min-height:100vh;}

  .pf-side{background:var(--surface);border-right:1px solid var(--line);padding:22px 16px;display:flex;flex-direction:column;gap:4px;position:sticky;top:0;height:100vh;}

  .pf-brand{display:flex;align-items:center;gap:9px;padding:4px 8px 22px;}

  .pf-brand .mark{width:30px;height:30px;border-radius:8px;background:linear-gradient(135deg,var(--indigo),var(--indigo-deep));display:flex;align-items:center;justify-content:center;color:#fff;font-family:'Syne';font-weight:800;font-size:13px;}

  .pf-brand .name{font-family:'Syne';font-weight:700;font-size:15px;}

  .pf-nav a{display:flex;align-items:center;gap:10px;padding:9px 10px;border-radius:8px;color:var(--ink-soft);text-decoration:none;font-size:13.5px;font-weight:500;cursor:pointer;}

  .pf-nav a i{font-size:16px;width:18px;text-align:center;}

  .pf-nav a.on{background:var(--indigo-wash);color:var(--indigo-deep);font-weight:600;}

  .pf-nav a:hover:not(.on){background:var(--canvas);}

  .pf-side-footer{margin-top:auto;padding:10px 8px;border-top:1px solid var(--line);}

  .pf-account{display:flex;align-items:center;gap:9px;padding:8px 2px;}

  .pf-account .av{width:32px;height:32px;border-radius:50%;background:var(--indigo-wash);color:var(--indigo-deep);display:flex;align-items:center;justify-content:center;font-family:'Syne';font-weight:700;font-size:12px;}

  .pf-account .who{font-size:12.5px;line-height:1.3;}

  .pf-account .who b{display:block;font-size:13px;}
 
  .pf-main{padding:26px 34px 60px;max-width:1080px;}

  .pf-page{display:none;}

  .pf-page.on{display:block;}
 
  .pf-top{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:22px;flex-wrap:wrap;gap:12px;}

  .pf-h1{font-family:'Syne';font-weight:800;font-size:24px;margin:0 0 4px;letter-spacing:-.01em;}

  .pf-sub{color:var(--ink-soft);font-size:13px;}

  .pf-btn{display:inline-flex;align-items:center;gap:6px;border:1px solid var(--line);background:var(--surface);padding:9px 15px;border-radius:9px;font-size:13.5px;font-weight:600;color:var(--ink);cursor:pointer;}

  .pf-btn.primary{background:var(--indigo);border-color:var(--indigo);color:#fff;}

  .pf-btn.primary:hover{background:var(--indigo-deep);}

  .pf-btn.sm{padding:6px 11px;font-size:12.5px;}
 
  .pf-banner{display:flex;align-items:center;gap:14px;background:var(--amber-wash);border:1px solid #f3ddaa;border-radius:12px;padding:14px 18px;margin-bottom:20px;}

  .pf-banner i{font-size:20px;color:var(--amber);}

  .pf-banner .t{font-weight:700;font-size:13.5px;}

  .pf-banner .d{font-size:12.5px;color:var(--ink-soft);margin-top:1px;}

  .pf-banner .act{margin-left:auto;}
 
  .pf-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:22px;}

  .pf-stat{background:var(--surface);border:1px solid var(--line);border-radius:12px;padding:16px 18px;}

  .pf-stat .l{font-size:11.5px;color:var(--ink-soft);text-transform:uppercase;letter-spacing:.03em;margin-bottom:8px;}

  .pf-stat .n{font-family:'Syne';font-weight:800;font-size:22px;}

  .pf-stat .n small{font-family:'DM Sans';font-weight:500;font-size:12px;color:var(--ink-soft);}
 
  .pf-section{background:var(--surface);border:1px solid var(--line);border-radius:12px;margin-bottom:20px;overflow:hidden;}

  .pf-section-head{display:flex;justify-content:space-between;align-items:center;padding:16px 18px;border-bottom:1px solid var(--line);}

  .pf-section-head h3{font-family:'Syne';font-size:14.5px;margin:0;}

  .pf-section-head a{font-size:12.5px;font-weight:600;color:var(--indigo-deep);text-decoration:none;cursor:pointer;}
 
  .pf-row{display:flex;align-items:center;gap:14px;padding:14px 18px;border-bottom:1px solid var(--line);}

  .pf-row:last-child{border-bottom:none;}

  .pf-row-icon{width:36px;height:36px;border-radius:9px;background:var(--indigo-wash);color:var(--indigo-deep);display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0;}

  .pf-row-body{flex:1;min-width:0;}

  .pf-row-title{font-weight:600;font-size:13.5px;}

  .pf-row-sub{font-size:12px;color:var(--ink-soft);margin-top:1px;}

  .pf-row-right{text-align:right;flex-shrink:0;display:flex;align-items:center;gap:10px;}

  .pf-row-amt{font-weight:700;font-family:'DM Sans';font-variant-numeric:tabular-nums;font-size:13.5px;}

  .pf-pill{display:inline-flex;align-items:center;gap:5px;font-size:11px;font-weight:700;letter-spacing:.02em;text-transform:uppercase;padding:3px 9px;border-radius:100px;}

  .pf-pill.due{background:var(--amber-wash);color:var(--amber);}

  .pf-pill.paid{background:var(--green-wash);color:var(--green);}

  .pf-pill.open{background:var(--indigo-wash);color:var(--indigo-deep);}

  .pf-pill.closed{background:#eef0f3;color:var(--ink-soft);}

  .pf-pill.overdue{background:var(--red-wash);color:var(--red);}
 
  .pf-track{display:flex;align-items:center;padding:20px 18px 6px;}

  .pf-step{flex:1;text-align:center;position:relative;}

  .pf-step:not(:last-child)::after{content:'';position:absolute;top:11px;left:calc(50% + 16px);right:calc(-50% + 16px);height:2px;background:var(--line);}

  .pf-step.done:not(:last-child)::after{background:var(--indigo);}

  .pf-dot{width:22px;height:22px;border-radius:50%;background:var(--surface);border:2px solid var(--line);display:flex;align-items:center;justify-content:center;margin:0 auto 8px;font-size:11px;color:var(--ink-soft);position:relative;z-index:1;}

  .pf-step.done .pf-dot{background:var(--indigo);border-color:var(--indigo);color:#fff;}

  .pf-step.now .pf-dot{border-color:var(--indigo);color:var(--indigo-deep);font-weight:700;}

  .pf-step .l{font-size:11.5px;color:var(--ink-soft);font-weight:500;}

  .pf-step.done .l, .pf-step.now .l{color:var(--ink);font-weight:600;}
 
  .pf-quick{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:22px;}

  .pf-qa{background:var(--surface);border:1px solid var(--line);border-radius:12px;padding:16px;display:flex;flex-direction:column;gap:10px;cursor:pointer;transition:.15s;}

  .pf-qa:hover{border-color:var(--indigo);}

  .pf-qa i{font-size:20px;color:var(--indigo-deep);}

  .pf-qa .t{font-weight:600;font-size:13px;}

  .pf-qa .d{font-size:11.5px;color:var(--ink-soft);}
 
  /* toolbar for list pages */

  .pf-toolbar{display:flex;align-items:center;gap:10px;background:var(--surface);border:1px solid var(--line);border-radius:12px;padding:12px 14px;margin-bottom:16px;}

  .pf-search{flex:1;display:flex;align-items:center;gap:8px;border:1px solid var(--line);border-radius:8px;padding:8px 12px;color:var(--ink-soft);}

  .pf-search input{border:none;outline:none;background:transparent;font-family:'DM Sans';font-size:13.5px;flex:1;color:var(--ink);}

  .pf-filterchip{display:flex;align-items:center;gap:6px;border:1px solid var(--line);border-radius:8px;padding:8px 12px;font-size:13px;color:var(--ink-soft);white-space:nowrap;}
 
  /* form (support / settings) */

  .pf-form{padding:18px;}

  .pf-field{margin-bottom:14px;}

  .pf-field label{display:block;font-size:12.5px;font-weight:600;color:var(--ink-soft);margin-bottom:6px;}

  .pf-field input, .pf-field select, .pf-field textarea{

    width:100%;border:1px solid var(--line);border-radius:8px;padding:9px 12px;font-family:'DM Sans';font-size:13.5px;color:var(--ink);background:var(--canvas);

  }

  .pf-field textarea{resize:vertical;min-height:80px;}

  .pf-formrow{display:grid;grid-template-columns:1fr 1fr;gap:14px;}
 
  .pf-empty{text-align:center;padding:44px 20px;color:var(--ink-soft);}

  .pf-empty i{font-size:26px;color:var(--line);display:block;margin-bottom:10px;}

  .pf-empty .t{font-weight:600;color:var(--ink);font-size:13.5px;margin-bottom:3px;}
 
  @media (max-width:900px){

    .pf-shell{grid-template-columns:1fr;}

    .pf-side{display:none;}

    .pf-stats,.pf-quick,.pf-formrow{grid-template-columns:1fr 1fr;}

  }
</style>
</head>
<body>
<div class="pf-shell">
 
  <!-- Sidebar -->
<div class="pf-side">
<div class="pf-brand"><div class="mark">A</div><div class="name">AssetIQ</div></div>
<nav class="pf-nav">
<a class="on" onclick="pfGo('overview',this)"><i class="ti ti-layout-dashboard"></i> Overview</a>
<a onclick="pfGo('renewals',this)"><i class="ti ti-refresh"></i> Renewals</a>
<a onclick="pfGo('invoices',this)"><i class="ti ti-file-invoice"></i> Invoices</a>
<a onclick="pfGo('orders',this)"><i class="ti ti-package"></i> Orders</a>
<a onclick="pfGo('support',this)"><i class="ti ti-headset"></i> Support</a>
<a onclick="pfGo('contacts',this)"><i class="ti ti-users"></i> Contacts</a>
<a onclick="pfGo('settings',this)"><i class="ti ti-settings"></i> Account settings</a>
</nav>
<div class="pf-side-footer">
<div class="pf-account"><div class="av">AC</div><div class="who"><b>Acme Industries</b>rahul@acme.in</div></div>
</div>
</div>
 
  <!-- Main -->
<div class="pf-main">
 
    <!-- ===== OVERVIEW ===== -->
<div class="pf-page on" id="page-overview">
<div class="pf-top">
<div><h1 class="pf-h1">Welcome back, Rahul</h1><div class="pf-sub">Here's what's happening with your account</div></div>
<div style="display:flex;gap:8px;">
<button class="pf-btn" onclick="pfGoByName('support')"><i class="ti ti-headset"></i> Contact support</button>
<button class="pf-btn primary" onclick="pfGoByName('renewals')"><i class="ti ti-refresh"></i> Renew now</button>
</div>
</div>
 
      <div class="pf-banner">
<i class="ti ti-alert-triangle"></i>
<div><div class="t">Your AssetIQ Pro license renews in 12 days</div><div class="d">50 seats · ₹4,20,000 · Auto-renew is off</div></div>
<button class="pf-btn primary act" onclick="pfGoByName('renewals')">Renew now</button>
</div>
 
      <div class="pf-stats">
<div class="pf-stat"><div class="l">Active licenses</div><div class="n">3</div></div>
<div class="pf-stat"><div class="l">Open invoices</div><div class="n">₹1.2L <small>· 1 due</small></div></div>
<div class="pf-stat"><div class="l">Open support tickets</div><div class="n">1</div></div>
<div class="pf-stat"><div class="l">Next renewal</div><div class="n">12 <small>days</small></div></div>
</div>
 
      <div class="pf-quick">
<div class="pf-qa" onclick="pfGoByName('invoices')"><i class="ti ti-download"></i><div class="t">Download invoice</div><div class="d">Latest: INV-3311</div></div>
<div class="pf-qa" onclick="pfGoByName('support')"><i class="ti ti-ticket"></i><div class="t">Raise a ticket</div><div class="d">Avg. reply in 4h</div></div>
<div class="pf-qa" onclick="pfGoByName('contacts')"><i class="ti ti-user-plus"></i><div class="t">Add a contact</div><div class="d">6 on this account</div></div>
<div class="pf-qa" onclick="pfGoByName('settings')"><i class="ti ti-file-text"></i><div class="t">View contract</div><div class="d">Expires Aug 2027</div></div>
</div>
 
      <div class="pf-section">
<div class="pf-section-head"><h3>Order #48213 — in progress</h3><a onclick="pfGoByName('orders')">View details</a></div>
<div class="pf-track">
<div class="pf-step done"><div class="pf-dot"><i class="ti ti-check"></i></div><div class="l">Placed</div></div>
<div class="pf-step done"><div class="pf-dot"><i class="ti ti-check"></i></div><div class="l">Confirmed</div></div>
<div class="pf-step now"><div class="pf-dot">3</div><div class="l">Processing</div></div>
<div class="pf-step"><div class="pf-dot">4</div><div class="l">Shipped</div></div>
<div class="pf-step"><div class="pf-dot">5</div><div class="l">Delivered</div></div>
</div>
<div style="padding:6px 18px 16px;font-size:12px;color:var(--ink-soft);">Expected to ship by 24 Jul 2026</div>
</div>
 
      <div class="pf-section">
<div class="pf-section-head"><h3>Recent invoices</h3><a onclick="pfGoByName('invoices')">View all</a></div>
<div class="pf-row"><div class="pf-row-icon"><i class="ti ti-file-invoice"></i></div><div class="pf-row-body"><div class="pf-row-title">INV-3311</div><div class="pf-row-sub">Issued 5 Jul 2026 · Due 20 Jul 2026</div></div><div class="pf-row-right"><div class="pf-row-amt">₹1,20,000</div><span class="pf-pill due">Due</span></div></div>
<div class="pf-row"><div class="pf-row-icon"><i class="ti ti-file-invoice"></i></div><div class="pf-row-body"><div class="pf-row-title">INV-3298</div><div class="pf-row-sub">Issued 12 Jun 2026</div></div><div class="pf-row-right"><div class="pf-row-amt">₹4,20,000</div><span class="pf-pill paid">Paid</span></div></div>
</div>
 
      <div class="pf-section">
<div class="pf-section-head"><h3>Support tickets</h3><a onclick="pfGoByName('support')">Raise new</a></div>
<div class="pf-row"><div class="pf-row-icon"><i class="ti ti-headset"></i></div><div class="pf-row-body"><div class="pf-row-title">Unable to activate seat #48</div><div class="pf-row-sub">Ticket #4021 · Updated 3h ago</div></div><div class="pf-row-right"><span class="pf-pill open">In progress</span></div></div>
</div>
</div>
 
    <!-- ===== RENEWALS ===== -->
<div class="pf-page" id="page-renewals">
<div class="pf-top"><div><h1 class="pf-h1">Renewals</h1><div class="pf-sub">3 licenses on this account</div></div></div>
<div class="pf-section">
<div class="pf-row"><div class="pf-row-icon"><i class="ti ti-refresh"></i></div>
<div class="pf-row-body"><div class="pf-row-title">AssetIQ Pro — 50 seats</div><div class="pf-row-sub">Renews 14 Aug 2026 · Auto-renew off</div></div>
<div class="pf-row-right"><div class="pf-row-amt">₹4,20,000</div><span class="pf-pill due">Due soon</span><button class="pf-btn primary sm">Renew</button></div></div>
<div class="pf-row"><div class="pf-row-icon"><i class="ti ti-refresh"></i></div>
<div class="pf-row-body"><div class="pf-row-title">SaleIQ Add-on</div><div class="pf-row-sub">Renews 02 Nov 2026 · Auto-renew on</div></div>
<div class="pf-row-right"><div class="pf-row-amt">₹85,000</div><span class="pf-pill paid">On track</span><button class="pf-btn sm">Manage</button></div></div>
<div class="pf-row"><div class="pf-row-icon"><i class="ti ti-refresh"></i></div>
<div class="pf-row-body"><div class="pf-row-title">Priority Support Plan</div><div class="pf-row-sub">Renews 18 Jan 2027 · Auto-renew on</div></div>
<div class="pf-row-right"><div class="pf-row-amt">₹60,000</div><span class="pf-pill paid">On track</span><button class="pf-btn sm">Manage</button></div></div>
</div>
</div>
 
    <!-- ===== INVOICES ===== -->
<div class="pf-page" id="page-invoices">
<div class="pf-top"><div><h1 class="pf-h1">Invoices</h1><div class="pf-sub">12 invoices on this account</div></div></div>
<div class="pf-toolbar">
<div class="pf-search"><i class="ti ti-search"></i><input placeholder="Search by invoice number…"></div>
<div class="pf-filterchip"><i class="ti ti-filter"></i> Status: All</div>
</div>
<div class="pf-section">
<div class="pf-row"><div class="pf-row-icon"><i class="ti ti-file-invoice"></i></div><div class="pf-row-body"><div class="pf-row-title">INV-3311</div><div class="pf-row-sub">Issued 5 Jul 2026 · Due 20 Jul 2026</div></div><div class="pf-row-right"><div class="pf-row-amt">₹1,20,000</div><span class="pf-pill due">Due</span><button class="pf-btn sm"><i class="ti ti-download"></i></button></div></div>
<div class="pf-row"><div class="pf-row-icon"><i class="ti ti-file-invoice"></i></div><div class="pf-row-body"><div class="pf-row-title">INV-3298</div><div class="pf-row-sub">Issued 12 Jun 2026</div></div><div class="pf-row-right"><div class="pf-row-amt">₹4,20,000</div><span class="pf-pill paid">Paid</span><button class="pf-btn sm"><i class="ti ti-download"></i></button></div></div>
<div class="pf-row"><div class="pf-row-icon"><i class="ti ti-file-invoice"></i></div><div class="pf-row-body"><div class="pf-row-title">INV-3260</div><div class="pf-row-sub">Issued 3 May 2026</div></div><div class="pf-row-right"><div class="pf-row-amt">₹85,000</div><span class="pf-pill paid">Paid</span><button class="pf-btn sm"><i class="ti ti-download"></i></button></div></div>
<div class="pf-row"><div class="pf-row-icon"><i class="ti ti-file-invoice"></i></div><div class="pf-row-body"><div class="pf-row-title">INV-3199</div><div class="pf-row-sub">Issued 2 Feb 2026</div></div><div class="pf-row-right"><div class="pf-row-amt">₹60,000</div><span class="pf-pill overdue">Overdue</span><button class="pf-btn sm"><i class="ti ti-download"></i></button></div></div>
</div>
</div>
 
    <!-- ===== ORDERS ===== -->
<div class="pf-page" id="page-orders">
<div class="pf-top"><div><h1 class="pf-h1">Orders</h1><div class="pf-sub">2 orders on this account</div></div></div>
<div class="pf-section">
<div class="pf-section-head"><h3>Order #48213 — in progress</h3><span class="pf-pill open">Processing</span></div>
<div class="pf-track">
<div class="pf-step done"><div class="pf-dot"><i class="ti ti-check"></i></div><div class="l">Placed</div></div>
<div class="pf-step done"><div class="pf-dot"><i class="ti ti-check"></i></div><div class="l">Confirmed</div></div>
<div class="pf-step now"><div class="pf-dot">3</div><div class="l">Processing</div></div>
<div class="pf-step"><div class="pf-dot">4</div><div class="l">Shipped</div></div>
<div class="pf-step"><div class="pf-dot">5</div><div class="l">Delivered</div></div>
</div>
<div style="padding:6px 18px 16px;font-size:12px;color:var(--ink-soft);">50 additional AssetIQ Pro seats · Expected to ship by 24 Jul 2026</div>
</div>
<div class="pf-section">
<div class="pf-section-head"><h3>Order #47960 — delivered</h3><span class="pf-pill paid">Delivered</span></div>
<div class="pf-track">
<div class="pf-step done"><div class="pf-dot"><i class="ti ti-check"></i></div><div class="l">Placed</div></div>
<div class="pf-step done"><div class="pf-dot"><i class="ti ti-check"></i></div><div class="l">Confirmed</div></div>
<div class="pf-step done"><div class="pf-dot"><i class="ti ti-check"></i></div><div class="l">Processing</div></div>
<div class="pf-step done"><div class="pf-dot"><i class="ti ti-check"></i></div><div class="l">Shipped</div></div>
<div class="pf-step done"><div class="pf-dot"><i class="ti ti-check"></i></div><div class="l">Delivered</div></div>
</div>
<div style="padding:6px 18px 16px;font-size:12px;color:var(--ink-soft);">Priority Support Plan · Delivered 18 Jun 2026</div>
</div>
</div>
 
    <!-- ===== SUPPORT ===== -->
<div class="pf-page" id="page-support">
<div class="pf-top"><div><h1 class="pf-h1">Support</h1><div class="pf-sub">Raise a ticket or check on an existing one</div></div></div>
<div class="pf-section">
<div class="pf-section-head"><h3>Open tickets</h3></div>
<div class="pf-row"><div class="pf-row-icon"><i class="ti ti-headset"></i></div><div class="pf-row-body"><div class="pf-row-title">Unable to activate seat #48</div><div class="pf-row-sub">Ticket #4021 · Updated 3h ago</div></div><div class="pf-row-right"><span class="pf-pill open">In progress</span></div></div>
<div class="pf-row"><div class="pf-row-icon"><i class="ti ti-headset"></i></div><div class="pf-row-body"><div class="pf-row-title">Question about invoice INV-3199</div><div class="pf-row-sub">Ticket #3987 · Closed 14 days ago</div></div><div class="pf-row-right"><span class="pf-pill closed">Closed</span></div></div>
</div>
<div class="pf-section">
<div class="pf-section-head"><h3>Raise a new ticket</h3></div>
<div class="pf-form">
<div class="pf-formrow">
<div class="pf-field"><label>Category</label><select><option>Billing</option><option>Technical issue</option><option>Renewal question</option><option>Other</option></select></div>
<div class="pf-field"><label>Priority</label><select><option>Normal</option><option>Urgent</option></select></div>
</div>
<div class="pf-field"><label>Subject</label><input placeholder="Brief summary of the issue"></div>
<div class="pf-field"><label>Details</label><textarea placeholder="What's happening, and what have you already tried?"></textarea></div>
<button class="pf-btn primary"><i class="ti ti-send"></i> Submit ticket</button>
</div>
</div>
</div>
 
    <!-- ===== CONTACTS ===== -->
<div class="pf-page" id="page-contacts">
<div class="pf-top"><div><h1 class="pf-h1">Contacts</h1><div class="pf-sub">6 people on this account</div></div><button class="pf-btn primary"><i class="ti ti-user-plus"></i> Add contact</button></div>
<div class="pf-section">
<div class="pf-row"><div class="pf-row-icon"><i class="ti ti-user"></i></div><div class="pf-row-body"><div class="pf-row-title">Rahul Mehta</div><div class="pf-row-sub">rahul@acme.in · Procurement</div></div><span class="pf-pill open">Primary</span></div>
<div class="pf-row"><div class="pf-row-icon"><i class="ti ti-user"></i></div><div class="pf-row-body"><div class="pf-row-title">Priya Nair</div><div class="pf-row-sub">priya@acme.in · Finance</div></div><span class="pf-pill closed">Billing contact</span></div>
<div class="pf-row"><div class="pf-row-icon"><i class="ti ti-user"></i></div><div class="pf-row-body"><div class="pf-row-title">Arjun Rao</div><div class="pf-row-sub">arjun@acme.in · IT Admin</div></div><span class="pf-pill closed">Technical contact</span></div>
</div>
</div>
 
    <!-- ===== SETTINGS ===== -->
<div class="pf-page" id="page-settings">
<div class="pf-top"><div><h1 class="pf-h1">Account settings</h1><div class="pf-sub">Manage your company details and preferences</div></div></div>
<div class="pf-section">
<div class="pf-section-head"><h3>Company details</h3></div>
<div class="pf-form">
<div class="pf-formrow">
<div class="pf-field"><label>Legal name</label><input value="Acme Industries Pvt. Ltd."></div>
<div class="pf-field"><label>GSTIN</label><input value="36AACCA1234B1Z5"></div>
</div>
<div class="pf-field"><label>Billing address</label><input value="Plot 14, HITEC City, Hyderabad, TG 500081"></div>
<button class="pf-btn primary">Save changes</button>
</div>
</div>
<div class="pf-section">
<div class="pf-section-head"><h3>Notifications</h3></div>
<div class="pf-row"><div class="pf-row-body"><div class="pf-row-title">Renewal reminders</div><div class="pf-row-sub">Email 14 days before a license renews</div></div><input type="checkbox" checked></div>
<div class="pf-row"><div class="pf-row-body"><div class="pf-row-title">Invoice alerts</div><div class="pf-row-sub">Email when a new invoice is issued</div></div><input type="checkbox" checked></div>
<div class="pf-row"><div class="pf-row-body"><div class="pf-row-title">Order updates</div><div class="pf-row-sub">Email on every status change</div></div><input type="checkbox"></div>
</div>
</div>
 
  </div>
</div>
 
<script>

function pfGo(name, el){

  document.querySelectorAll('.pf-page').forEach(p=>p.classList.remove('on'));

  document.getElementById('page-'+name).classList.add('on');

  document.querySelectorAll('.pf-nav a').forEach(a=>a.classList.remove('on'));

  el.classList.add('on');

  window.scrollTo({top:0,behavior:'smooth'});

}

function pfGoByName(name){

  const link = Array.from(document.querySelectorAll('.pf-nav a')).find(a=>a.getAttribute('onclick').includes("'"+name+"'"));

  pfGo(name, link);

}
</script>
</body>
</html>
 