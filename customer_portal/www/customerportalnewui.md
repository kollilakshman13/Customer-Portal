<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Customer Portal — Web</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@500;600;700;800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/tabler-icons/2.44.0/iconfont/tabler-icons.min.css">
<style>
  :root{
    --blue:#00A7FF; --navy:#0A1B3D; --navy-2:#132a54; --cyan:#00CCFF;
    --green:#15C26B; --green-wash:#e5f9ef;
    --orange:#FF9B1C; --orange-wash:#fff2e2;
    --red:#FF5A5F; --red-wash:#ffe9ea;
    --purple:#8b5cf6; --purple-wash:#f1ecff;
    --bg:#F4F6FB; --white:#fff; --line:#e7ebf3; --ink:#101828; --ink-soft:#6b7280;
  }
  *{box-sizing:border-box;}
  body{margin:0;background:var(--bg);color:var(--ink);font-family:'Inter',sans-serif;font-size:14px;}
  h1,h2,h3{font-family:'Poppins',sans-serif;margin:0;}

  .shell{display:grid;grid-template-columns:240px 1fr;min-height:100vh;}

  /* ---------- sidebar ---------- */
  .side{background:var(--navy);color:#fff;padding:20px 14px;display:flex;flex-direction:column;gap:4px;position:sticky;top:0;height:100vh;}
  .side-brand{display:flex;align-items:center;gap:10px;padding:6px 8px 24px;}
  .side-brand .mark{width:32px;height:32px;border-radius:9px;background:linear-gradient(135deg,var(--blue),var(--cyan));display:flex;align-items:center;justify-content:center;font-family:'Poppins';font-weight:800;font-size:14px;}
  .side-brand .name{font-family:'Poppins';font-weight:700;font-size:15px;line-height:1.2;}
  .side-brand .sub{font-size:9.5px;color:#8ea0c9;letter-spacing:.05em;}
  .side-nav a{display:flex;align-items:center;gap:11px;padding:10px 12px;border-radius:9px;color:#b9c3dd;text-decoration:none;font-size:13.5px;font-weight:500;cursor:pointer;}
  .side-nav a i{font-size:17px;width:18px;text-align:center;}
  .side-nav a.on{background:rgba(255,255,255,.1);color:#fff;font-weight:600;}
  .side-nav a:hover:not(.on){background:rgba(255,255,255,.05);}
  .side-foot{margin-top:auto;border-top:1px solid rgba(255,255,255,.12);padding-top:12px;}
  .side-acct{display:flex;align-items:center;gap:10px;padding:6px 8px;}
  .side-acct .av{width:32px;height:32px;border-radius:50%;background:var(--blue);display:flex;align-items:center;justify-content:center;font-family:'Poppins';font-weight:700;font-size:12px;}
  .side-acct .who{font-size:12px;line-height:1.3;}
  .side-acct .who b{display:block;font-size:13px;color:#fff;}

  /* ---------- main ---------- */
  .main{padding:0;}
  .topbar{background:#fff;border-bottom:1px solid var(--line);padding:16px 32px;display:flex;justify-content:space-between;align-items:center;}
  .topbar h1{font-size:19px;}
  .topbar .sub{font-size:12px;color:var(--ink-soft);margin-top:2px;}
  .topbar-right{display:flex;align-items:center;gap:16px;}
  .search-box{display:flex;align-items:center;gap:8px;border:1px solid var(--line);border-radius:9px;padding:8px 12px;color:var(--ink-soft);width:220px;}
  .search-box input{border:none;outline:none;background:transparent;font-size:12.5px;flex:1;font-family:'Inter';}
  .bell{position:relative;font-size:19px;color:var(--ink-soft);cursor:pointer;}
  .bell::after{content:'3';position:absolute;top:-6px;right:-7px;background:var(--red);color:#fff;font-size:9px;font-weight:700;border-radius:50%;width:15px;height:15px;display:flex;align-items:center;justify-content:center;}
  .avatar{width:34px;height:34px;border-radius:50%;background:var(--blue);color:#fff;display:flex;align-items:center;justify-content:center;font-family:'Poppins';font-weight:700;font-size:13px;}

  .content{padding:28px 32px 60px;max-width:1280px;}
  .page{display:none;}
  .page.on{display:block;}

  .btn{display:inline-flex;align-items:center;gap:7px;border:1px solid var(--line);background:#fff;padding:10px 16px;border-radius:10px;font-size:13.5px;font-weight:600;color:var(--ink);cursor:pointer;}
  .btn.primary{background:var(--blue);border-color:var(--blue);color:#fff;}
  .btn.primary:hover{background:#0090dd;}
  .btn.sm{padding:6px 12px;font-size:12.5px;}

  /* dashboard hero */
  .hero{background:linear-gradient(160deg,var(--navy),var(--navy-2));border-radius:16px;color:#fff;padding:24px 26px;margin-bottom:20px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:16px;}
  .hero .greet-t{color:#b9c3dd;font-size:13px;}
  .hero .greet-name{font-family:'Poppins';font-weight:700;font-size:22px;margin-top:3px;}
  .hero .greet-sub{color:#8ea0c9;font-size:12.5px;margin-top:4px;}

  .grid4{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:20px;}
  .grid2{display:grid;grid-template-columns:1.2fr 1fr;gap:16px;margin-bottom:20px;}
  .grid3{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-bottom:20px;}

  .card{background:#fff;border:1px solid var(--line);border-radius:14px;padding:18px 20px;}
  .card h3{font-size:14.5px;}
  .card-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;}
  .card-head a{font-size:12px;color:var(--blue);font-weight:600;text-decoration:none;cursor:pointer;}

  .stat{display:flex;align-items:center;gap:12px;}
  .stat .ic{width:42px;height:42px;border-radius:11px;display:flex;align-items:center;justify-content:center;font-size:19px;color:#fff;flex-shrink:0;}
  .stat .n{font-family:'Poppins';font-weight:700;font-size:19px;}
  .stat .l{font-size:11px;color:var(--ink-soft);}

  .gauge-wrap{display:flex;align-items:center;gap:20px;}
  .gauge{width:110px;height:110px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;background:conic-gradient(var(--blue) 0turn, var(--cyan) 0.86turn, #eef1f7 0.86turn);}
  .gauge-inner{width:88px;height:88px;border-radius:50%;background:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;}
  .gauge-inner b{font-family:'Poppins';font-size:25px;line-height:1;}
  .gauge-inner span{font-size:10.5px;color:var(--ink-soft);}
  .factor-list{flex:1;display:flex;flex-direction:column;gap:9px;}
  .factor{display:flex;justify-content:space-between;font-size:12.5px;color:var(--ink-soft);}
  .factor b{color:var(--ink);font-weight:600;}

  .donut{width:120px;height:120px;border-radius:50%;margin:0 auto;flex-shrink:0;}
  .legend{display:flex;flex-direction:column;gap:8px;flex:1;}
  .legend .li{display:flex;align-items:center;gap:8px;font-size:12px;}
  .legend .dot{width:9px;height:9px;border-radius:50%;flex-shrink:0;}
  .legend .li span:last-child{margin-left:auto;font-weight:600;}

  table.tbl{width:100%;border-collapse:collapse;}
  table.tbl thead th{text-align:left;font-size:11px;font-weight:700;letter-spacing:.03em;text-transform:uppercase;color:var(--ink-soft);padding:10px 6px;border-bottom:1px solid var(--line);}
  table.tbl td{padding:12px 6px;border-bottom:1px solid var(--line);font-size:13px;}
  table.tbl tbody tr{cursor:pointer;}
  table.tbl tbody tr:hover{background:#f7f9fd;}
  table.tbl tbody tr:last-child td{border-bottom:none;}

  .pill{display:inline-flex;align-items:center;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.02em;padding:4px 10px;border-radius:100px;}
  .pill.green{background:var(--green-wash);color:var(--green);}
  .pill.orange{background:var(--orange-wash);color:var(--orange);}
  .pill.red{background:var(--red-wash);color:var(--red);}
  .pill.blue{background:#eaf3ff;color:var(--blue);}

  .row-icon{width:34px;height:34px;border-radius:9px;display:inline-flex;align-items:center;justify-content:center;font-size:15px;margin-right:10px;vertical-align:middle;}

  .activity-row{display:flex;align-items:center;gap:12px;padding:12px 0;border-bottom:1px solid var(--line);}
  .activity-row:last-child{border-bottom:none;}
  .activity-row .ic{width:32px;height:32px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0;}
  .activity-row .t{font-weight:600;font-size:12.5px;}
  .activity-row .s{font-size:11px;color:var(--ink-soft);}

  /* detail pages */
  .back{display:inline-flex;align-items:center;gap:6px;color:var(--ink-soft);font-size:13px;margin-bottom:16px;cursor:pointer;text-decoration:none;}
  .back:hover{color:var(--blue);}
  .detail-head{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:20px;flex-wrap:wrap;gap:12px;}
  .field-row{display:flex;justify-content:space-between;padding:11px 0;border-bottom:1px solid var(--line);font-size:13px;}
  .field-row:last-child{border-bottom:none;}
  .field-row .l{color:var(--ink-soft);}
  .field-row .v{font-weight:600;}

  .ring-big{width:150px;height:150px;border-radius:50%;margin:6px auto;display:flex;align-items:center;justify-content:center;background:conic-gradient(var(--blue) 0turn, var(--cyan) 0.3turn, #eef1f7 0.3turn);}
  .ring-big-inner{width:120px;height:120px;border-radius:50%;background:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;}
  .ring-big-inner b{font-family:'Poppins';font-size:28px;}
  .ring-big-inner span{font-size:11px;color:var(--ink-soft);}

  .msg{border-radius:12px;padding:12px 14px;margin-bottom:10px;font-size:13px;background:#f4f6fb;max-width:80%;}
  .msg.us{background:var(--navy);color:#fff;margin-left:auto;}
  .msg .h{font-size:11px;color:var(--ink-soft);margin-bottom:5px;font-weight:600;}
  .msg.us .h{color:#b9c3dd;}

  .toolbar{display:flex;align-items:center;gap:10px;margin-bottom:16px;}
  .tabs-row{display:flex;gap:20px;border-bottom:1px solid var(--line);margin-bottom:18px;}
  .tabs-row .tab{font-size:13px;font-weight:600;color:var(--ink-soft);padding-bottom:10px;cursor:pointer;}
  .tabs-row .tab.on{color:var(--blue);border-bottom:2px solid var(--blue);}

  @media (max-width:1000px){
    .shell{grid-template-columns:1fr;}
    .side{display:none;}
    .grid4{grid-template-columns:1fr 1fr;}
    .grid2,.grid3{grid-template-columns:1fr;}
  }
</style>
</head>
<body>
<div class="shell">

  <!-- ============ SIDEBAR ============ -->
  <div class="side">
    <div class="side-brand">
      <div class="mark">64</div>
      <div><div class="name">NETWORK SECURITY</div><div class="sub">CUSTOMER PORTAL</div></div>
    </div>
    <nav class="side-nav">
      <a class="on" onclick="go('dashboard',this)"><i class="ti ti-layout-dashboard"></i> Dashboard</a>
      <a onclick="go('renewals',this)"><i class="ti ti-refresh"></i> Renewals</a>
      <a onclick="go('invoices',this)"><i class="ti ti-file-invoice"></i> Invoices</a>
      <a onclick="go('tickets',this)"><i class="ti ti-ticket"></i> Tickets</a>
      <a onclick="go('account',this)"><i class="ti ti-user"></i> Account</a>
    </nav>
    <div class="side-foot">
      <div class="side-acct"><div class="av">R</div><div class="who"><b>Rahul Mehta</b>Acme Industries</div></div>
    </div>
  </div>

  <!-- ============ MAIN ============ -->
  <div class="main">
    <div class="topbar">
      <div id="topbar-title"><h1>Dashboard</h1><div class="sub">Real-time overview of your security, services &amp; spend</div></div>
      <div class="topbar-right">
        <div class="search-box"><i class="ti ti-search"></i><input placeholder="Search…"></div>
        <i class="ti ti-bell bell"></i>
        <div class="avatar">R</div>
      </div>
    </div>

    <div class="content">

      <!-- ===== DASHBOARD ===== -->
      <div class="page on" id="page-dashboard">
        <div class="hero">
          <div><div class="greet-t">Good Morning,</div><div class="greet-name">Rahul 👋</div><div class="greet-sub">Here's what's happening with Acme Industries' account</div></div>
          <div style="display:flex;gap:10px;">
            <button class="btn" onclick="go('tickets')" style="background:rgba(255,255,255,.08);border-color:rgba(255,255,255,.18);color:#fff;"><i class="ti ti-headset"></i> Contact support</button>
            <button class="btn primary" onclick="go('renewals')"><i class="ti ti-refresh"></i> Renew now</button>
          </div>
        </div>

        <div class="grid4">
          <div class="card stat"><div class="ic" style="background:var(--blue)"><i class="ti ti-shield-check"></i></div><div><div class="n">72</div><div class="l">Active Services</div></div></div>
          <div class="card stat"><div class="ic" style="background:var(--orange)"><i class="ti ti-ticket"></i></div><div><div class="n">03</div><div class="l">Open Tickets</div></div></div>
          <div class="card stat"><div class="ic" style="background:var(--red)"><i class="ti ti-file-invoice"></i></div><div><div class="n">₹2,45,000</div><div class="l">Outstanding Invoices</div></div></div>
          <div class="card stat"><div class="ic" style="background:var(--green)"><i class="ti ti-calendar-due"></i></div><div><div class="n">08</div><div class="l">Upcoming Renewals</div></div></div>
        </div>

        <div class="grid2">
          <div class="card">
            <div class="card-head"><h3>Security Health Score</h3><i class="ti ti-info-circle" style="color:var(--ink-soft)"></i></div>
            <div class="gauge-wrap">
              <div class="gauge"><div class="gauge-inner"><b>86</b><span>/100 Good</span></div></div>
              <div class="factor-list">
                <div class="factor">AV Coverage<b>90/100</b></div>
                <div class="factor">Licence Compliance<b>85/100</b></div>
                <div class="factor">Patch Compliance<b>80/100</b></div>
                <div class="factor">MFA Adoption<b>90/100</b></div>
              </div>
            </div>
          </div>
          <div class="card">
            <div class="card-head"><h3>Renewals Overview</h3><a onclick="go('renewals')">View All</a></div>
            <div style="display:flex;align-items:center;gap:18px;">
              <svg class="donut" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#eef1f7" stroke-width="4"></circle>
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="var(--red)" stroke-width="4" stroke-dasharray="42 100" stroke-dashoffset="25"></circle>
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="var(--orange)" stroke-width="4" stroke-dasharray="33 100" stroke-dashoffset="-17"></circle>
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="var(--blue)" stroke-width="4" stroke-dasharray="17 100" stroke-dashoffset="-50"></circle>
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="var(--green)" stroke-width="4" stroke-dasharray="8 100" stroke-dashoffset="-67"></circle>
                <text x="18" y="17" text-anchor="middle" font-family="Poppins" font-weight="700" font-size="7">12</text>
                <text x="18" y="23" text-anchor="middle" font-family="Inter" font-size="3.4" fill="#6b7280">Total</text>
              </svg>
              <div class="legend">
                <div class="li"><span class="dot" style="background:var(--red)"></span>Due in 0–30 Days<span>5</span></div>
                <div class="li"><span class="dot" style="background:var(--orange)"></span>Due in 31–60 Days<span>4</span></div>
                <div class="li"><span class="dot" style="background:var(--blue)"></span>Due in 61–90 Days<span>2</span></div>
                <div class="li"><span class="dot" style="background:var(--green)"></span>Due in 90+ Days<span>1</span></div>
              </div>
            </div>
          </div>
        </div>

        <div class="grid2">
          <div class="card">
            <div class="card-head"><h3>Upcoming Renewals</h3><a onclick="go('renewals')">View All</a></div>
            <table class="tbl">
              <tbody>
                <tr onclick="go('renewal-detail')"><td><span class="row-icon" style="background:#eaf3ff;color:var(--blue)"><i class="ti ti-brand-windows"></i></span>Microsoft 365 Business Premium</td><td>25 Sep 2026</td><td>₹85,000</td><td><span class="pill green">Active</span></td></tr>
                <tr onclick="go('renewal-detail')"><td><span class="row-icon" style="background:#e7f0ff;color:#1c3fae"><i class="ti ti-shield-lock"></i></span>Sophos XGS Firewall Support</td><td>01 Sep 2026</td><td>₹41,000</td><td><span class="pill orange">Due Soon</span></td></tr>
                <tr onclick="go('renewal-detail')"><td><span class="row-icon" style="background:var(--purple-wash);color:var(--purple)"><i class="ti ti-bug"></i></span>SentinelOne Complete Protection</td><td>18 Nov 2026</td><td>₹62,500</td><td><span class="pill green">Active</span></td></tr>
              </tbody>
            </table>
          </div>
          <div class="card">
            <div class="card-head"><h3>Recent Activity</h3></div>
            <div class="activity-row"><div class="ic" style="background:var(--green-wash);color:var(--green)"><i class="ti ti-check"></i></div><div><div class="t">Invoice Paid</div><div class="s">INV-240012 for ₹85,000 · Today, 10:30 AM</div></div></div>
            <div class="activity-row"><div class="ic" style="background:var(--orange-wash);color:var(--orange)"><i class="ti ti-calendar"></i></div><div><div class="t">Renewal Due Soon</div><div class="s">Microsoft 365 Business Premium · Due in 15 days</div></div></div>
            <div class="activity-row"><div class="ic" style="background:#eaf3ff;color:var(--blue)"><i class="ti ti-message"></i></div><div><div class="t">Ticket Updated</div><div class="s">TK-10023 Microsoft Defender Issue · Today, 09:15 AM</div></div></div>
            <div class="activity-row"><div class="ic" style="background:var(--purple-wash);color:var(--purple)"><i class="ti ti-file-text"></i></div><div><div class="t">Quote Approved</div><div class="s">Q-240015 for ₹72,033 · Yesterday, 04:45 PM</div></div></div>
          </div>
        </div>
      </div>

      <!-- ===== RENEWALS ===== -->
      <div class="page" id="page-renewals">
        <div class="toolbar">
          <div class="search-box" style="width:280px;"><i class="ti ti-search"></i><input placeholder="Search renewals…"></div>
          <button class="btn sm"><i class="ti ti-filter"></i> Filter</button>
        </div>
        <div class="tabs-row"><div class="tab on">All (10)</div><div class="tab">Due Soon (3)</div><div class="tab">Upcoming (5)</div><div class="tab">Renewed (2)</div></div>
        <div class="card" style="padding:6px 20px;">
          <table class="tbl">
            <thead><tr><th>Service</th><th>Renewal Date</th><th>Days Left</th><th>Amount</th><th>Status</th></tr></thead>
            <tbody>
              <tr onclick="go('renewal-detail')"><td><span class="row-icon" style="background:#eaf3ff;color:var(--blue)"><i class="ti ti-brand-windows"></i></span>Microsoft 365 Business Premium</td><td>25 Sep 2026</td><td><b style="color:var(--blue)">42</b></td><td>₹85,000</td><td><span class="pill green">Active</span></td></tr>
              <tr onclick="go('renewal-detail')"><td><span class="row-icon" style="background:#e7f0ff;color:#1c3fae"><i class="ti ti-shield-lock"></i></span>Sophos XGS Firewall Support</td><td>01 Sep 2026</td><td><b style="color:var(--orange)">18</b></td><td>₹41,000</td><td><span class="pill orange">Due Soon</span></td></tr>
              <tr onclick="go('renewal-detail')"><td><span class="row-icon" style="background:var(--purple-wash);color:var(--purple)"><i class="ti ti-bug"></i></span>SentinelOne Complete Protection</td><td>18 Nov 2026</td><td><b style="color:var(--blue)">65</b></td><td>₹62,500</td><td><span class="pill green">Active</span></td></tr>
              <tr onclick="go('renewal-detail')"><td><span class="row-icon" style="background:var(--green-wash);color:var(--green)"><i class="ti ti-mail"></i></span>Proofpoint Email Protection</td><td>18 Jan 2027</td><td><b style="color:var(--blue)">95</b></td><td>₹28,000</td><td><span class="pill green">Active</span></td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- ===== RENEWAL DETAIL ===== -->
      <div class="page" id="page-renewal-detail">
        <a class="back" onclick="go('renewals')"><i class="ti ti-arrow-left"></i> Back to Renewals</a>
        <div class="detail-head">
          <div><h1 style="font-size:22px;">Microsoft 365 Business Premium</h1><div class="sub" style="color:var(--ink-soft);font-size:13px;margin-top:4px;">Renewal ID RNL-2208</div></div>
          <div style="display:flex;gap:8px;"><button class="btn"><i class="ti ti-toggle-left"></i> Turn on auto-renew</button><button class="btn primary"><i class="ti ti-refresh"></i> Renew Now</button></div>
        </div>
        <div class="grid2">
          <div class="card">
            <h3 style="margin-bottom:14px;">Renewal Details</h3>
            <div class="field-row"><span class="l">Renewal Date</span><span class="v">25 Sep 2026</span></div>
            <div class="field-row"><span class="l">Amount</span><span class="v">₹85,000</span></div>
            <div class="field-row"><span class="l">Billing Frequency</span><span class="v">Yearly</span></div>
            <div class="field-row"><span class="l">Quantity</span><span class="v">25 Users</span></div>
            <div class="field-row"><span class="l">Support</span><span class="v">Standard</span></div>
            <div class="field-row"><span class="l">Status</span><span class="v" style="color:var(--green)">Active</span></div>
            <div style="display:flex;gap:10px;margin-top:16px;">
              <button class="btn" style="flex:1;justify-content:center;"><i class="ti ti-download"></i> Download Quote</button>
              <button class="btn" style="flex:1;justify-content:center;"><i class="ti ti-user"></i> Contact Manager</button>
            </div>
          </div>
          <div class="card" style="text-align:center;">
            <h3 style="margin-bottom:8px;">Time Remaining</h3>
            <div class="ring-big"><div class="ring-big-inner"><b>42</b><span>Days Left</span></div></div>
            <span class="pill green">Active</span>
          </div>
        </div>
      </div>

      <!-- ===== INVOICES ===== -->
      <div class="page" id="page-invoices">
        <div class="toolbar">
          <div class="search-box" style="width:280px;"><i class="ti ti-search"></i><input placeholder="Search invoices…"></div>
          <button class="btn sm"><i class="ti ti-filter"></i> Filter</button>
        </div>
        <div class="tabs-row"><div class="tab on">All (12)</div><div class="tab">Unpaid (4)</div><div class="tab">Paid (6)</div><div class="tab">Overdue (2)</div></div>
        <div class="card" style="padding:6px 20px;">
          <table class="tbl">
            <thead><tr><th>Invoice</th><th>Issued</th><th>Amount</th><th>Status</th><th></th></tr></thead>
            <tbody>
              <tr onclick="go('invoice-detail')"><td><span class="row-icon" style="background:#eaf3ff;color:var(--blue)"><i class="ti ti-calendar"></i></span>INV-240012</td><td>24 May 2024</td><td>₹85,000</td><td><span class="pill red">Unpaid · Due in 7 Days</span></td><td><i class="ti ti-download"></i></td></tr>
              <tr onclick="go('invoice-detail')"><td><span class="row-icon" style="background:#eaf3ff;color:var(--blue)"><i class="ti ti-calendar"></i></span>INV-240011</td><td>10 May 2024</td><td>₹41,000</td><td><span class="pill orange">Due Soon · 3 Days</span></td><td><i class="ti ti-download"></i></td></tr>
              <tr onclick="go('invoice-detail')"><td><span class="row-icon" style="background:#eaf3ff;color:var(--blue)"><i class="ti ti-calendar"></i></span>INV-240010</td><td>25 Apr 2024</td><td>₹62,500</td><td><span class="pill green">Paid</span></td><td><i class="ti ti-download"></i></td></tr>
              <tr onclick="go('invoice-detail')"><td><span class="row-icon" style="background:#eaf3ff;color:var(--blue)"><i class="ti ti-calendar"></i></span>INV-240009</td><td>12 Apr 2024</td><td>₹28,000</td><td><span class="pill red">Overdue · 6 Days</span></td><td><i class="ti ti-download"></i></td></tr>
              <tr onclick="go('invoice-detail')"><td><span class="row-icon" style="background:#eaf3ff;color:var(--blue)"><i class="ti ti-calendar"></i></span>INV-240008</td><td>01 Apr 2024</td><td>₹15,300</td><td><span class="pill green">Paid</span></td><td><i class="ti ti-download"></i></td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- ===== INVOICE DETAIL ===== -->
      <div class="page" id="page-invoice-detail">
        <a class="back" onclick="go('invoices')"><i class="ti ti-arrow-left"></i> Back to Invoices</a>
        <div class="detail-head">
          <div><h1 style="font-size:22px;">INV-240012</h1><div class="sub" style="color:var(--ink-soft);font-size:13px;margin-top:4px;">Issued 24 May 2024 · Due 31 May 2024</div></div>
          <div style="display:flex;gap:8px;"><button class="btn"><i class="ti ti-file-text"></i> View PDF</button><button class="btn primary"><i class="ti ti-credit-card"></i> Pay Now</button></div>
        </div>
        <div class="grid2">
          <div class="card">
            <h3 style="margin-bottom:14px;">Invoice Summary</h3>
            <div class="field-row"><span class="l">Subtotal</span><span class="v">₹72,033</span></div>
            <div class="field-row"><span class="l">CGST (9%)</span><span class="v">₹6,482</span></div>
            <div class="field-row"><span class="l">SGST (9%)</span><span class="v">₹6,482</span></div>
            <div class="field-row" style="font-size:15px;"><span class="l" style="color:var(--ink);font-weight:700;">Total</span><span class="v">₹85,000</span></div>
            <div class="field-row"><span class="l">Amount Due</span><span class="v" style="color:var(--red)">₹85,000</span></div>
          </div>
          <div class="card">
            <h3 style="margin-bottom:14px;">Bill To</h3>
            <div style="font-weight:600;font-size:13.5px;">Rahul Mehta</div>
            <div style="font-size:12.5px;color:var(--ink-soft);margin-top:4px;">Acme Industries Pvt Ltd<br>Plot 14, HITEC City, Hyderabad 500081</div>
            <div class="field-row" style="margin-top:12px;"><span class="l">GSTIN</span><span class="v">36AACCA1234B1Z5</span></div>
            <div class="field-row"><span class="l">Payment Method</span><span class="v">Bank transfer</span></div>
          </div>
        </div>
      </div>

      <!-- ===== TICKETS ===== -->
      <div class="page" id="page-tickets">
        <div class="toolbar">
          <div class="search-box" style="width:280px;"><i class="ti ti-search"></i><input placeholder="Search tickets…"></div>
          <button class="btn primary sm"><i class="ti ti-plus"></i> New Ticket</button>
        </div>
        <div class="tabs-row"><div class="tab on">All (7)</div><div class="tab">Open (3)</div><div class="tab">In Progress (2)</div><div class="tab">Closed (2)</div></div>
        <div class="card" style="padding:6px 20px;">
          <table class="tbl">
            <thead><tr><th>Ticket</th><th>Category</th><th>Updated</th><th>Status</th></tr></thead>
            <tbody>
              <tr onclick="go('ticket-detail')"><td><span class="row-icon" style="background:var(--red-wash);color:var(--red)"><i class="ti ti-alert-circle"></i></span>TK-10023 — Microsoft Defender Issue</td><td>High</td><td>2h ago</td><td><span class="pill orange">In Progress</span></td></tr>
              <tr onclick="go('ticket-detail')"><td><span class="row-icon" style="background:var(--orange-wash);color:var(--orange)"><i class="ti ti-mail"></i></span>TK-10022 — Email Delivery Failing</td><td>Medium</td><td>5h ago</td><td><span class="pill orange">Open</span></td></tr>
              <tr onclick="go('ticket-detail')"><td><span class="row-icon" style="background:var(--red-wash);color:var(--red)"><i class="ti ti-plug-connected"></i></span>TK-10021 — VPN Connection Issue</td><td>High</td><td>1d ago</td><td><span class="pill red">Open</span></td></tr>
              <tr onclick="go('ticket-detail')"><td><span class="row-icon" style="background:var(--green-wash);color:var(--green)"><i class="ti ti-key"></i></span>TK-10020 — Licence Activation Error</td><td>Low</td><td>2d ago</td><td><span class="pill green">Closed</span></td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- ===== TICKET DETAIL ===== -->
      <div class="page" id="page-ticket-detail">
        <a class="back" onclick="go('tickets')"><i class="ti ti-arrow-left"></i> Back to Tickets</a>
        <div class="detail-head">
          <div><h1 style="font-size:22px;">TK-10023 — Microsoft Defender Issue</h1><div class="sub" style="color:var(--ink-soft);font-size:13px;margin-top:4px;">Created 24 May 2024, 10:30 AM</div></div>
          <span class="pill orange">In Progress</span>
        </div>
        <div class="grid2">
          <div class="card">
            <div class="tabs-row" style="margin-bottom:12px;"><div class="tab on">Conversation</div><div class="tab">Timeline</div></div>
            <div class="msg"><div class="h">Rahul Mehta · 10:30 AM</div>Defender keeps flagging a false positive on our finance app — can someone take a look?</div>
            <div class="msg us"><div class="h">Naveen Kumar · 11:15 AM</div>We are checking the logs now, will update shortly.</div>
            <div class="msg"><div class="h">Rahul Mehta · 11:20 AM</div>Thanks, it's blocking our team from opening the app.</div>
            <div class="msg us"><div class="h">Naveen Kumar · 1:40 PM</div>Issue identified — pushing an exclusion rule, fix in progress.</div>
            <textarea placeholder="Reply to this ticket…" style="width:100%;min-height:70px;border:1px solid var(--line);border-radius:9px;padding:10px 12px;font-family:'Inter';font-size:13px;margin-top:10px;"></textarea>
            <button class="btn primary" style="margin-top:10px;"><i class="ti ti-send"></i> Send Reply</button>
          </div>
          <div class="card">
            <h3 style="margin-bottom:14px;">Details</h3>
            <div class="field-row"><span class="l">Category</span><span class="v">Technical Issue</span></div>
            <div class="field-row"><span class="l">Priority</span><span class="v">High</span></div>
            <div class="field-row"><span class="l">Raised By</span><span class="v">Rahul Mehta</span></div>
            <div class="field-row"><span class="l">Assigned To</span><span class="v">Naveen Kumar</span></div>
            <button class="btn" style="width:100%;justify-content:center;margin-top:14px;">Close Ticket</button>
          </div>
        </div>
      </div>

      <!-- ===== ACCOUNT ===== -->
      <div class="page" id="page-account">
        <div class="detail-head">
          <div><h1 style="font-size:22px;">Profile &amp; Settings</h1></div>
        </div>
        <div class="grid2">
          <div class="card" style="display:flex;align-items:center;gap:14px;background:var(--navy);color:#fff;border:none;">
            <div class="avatar" style="width:52px;height:52px;font-size:18px;">R</div>
            <div><b style="font-family:'Poppins';font-size:15px;">Rahul Mehta</b><div style="font-size:12px;color:#b9c3dd;margin-top:2px;">Procurement Lead · Acme Industries</div></div>
          </div>
          <div class="card">
            <h3 style="margin-bottom:14px;">Your Account Team</h3>
            <div class="field-row"><span class="l">Account Manager</span><span class="v">Rohit Sharma</span></div>
            <div class="field-row"><span class="l">Technical Lead</span><span class="v">Naveen Kumar</span></div>
            <div class="field-row"><span class="l">Billing Contact</span><span class="v">Priya Nair</span></div>
          </div>
        </div>
        <div class="grid2">
          <div class="card">
            <h3 style="margin-bottom:6px;">Account Information</h3>
            <div class="field-row"><span class="l">Company Profile</span><i class="ti ti-chevron-right"></i></div>
            <div class="field-row"><span class="l">Billing Address</span><i class="ti ti-chevron-right"></i></div>
            <div class="field-row"><span class="l">Users &amp; Access</span><i class="ti ti-chevron-right"></i></div>
          </div>
          <div class="card">
            <h3 style="margin-bottom:6px;">Preferences</h3>
            <div class="field-row"><span class="l">Notification Preferences</span><i class="ti ti-chevron-right"></i></div>
            <div class="field-row"><span class="l">Language</span><span class="v">English</span></div>
            <div class="field-row"><span class="l">Change Password</span><i class="ti ti-chevron-right"></i></div>
            <div class="field-row" style="color:var(--red);"><span class="l" style="color:var(--red);">Log Out</span><i class="ti ti-logout" style="color:var(--red);"></i></div>
          </div>
        </div>
      </div>

    </div>
  </div>
</div>

<script>
const titles = {
  dashboard:['Dashboard','Real-time overview of your security, services & spend'],
  renewals:['Renewals','Track and manage every license renewal'],
  'renewal-detail':['Renewal Details',''],
  invoices:['Invoices','View, download and pay your invoices'],
  'invoice-detail':['Invoice Details',''],
  tickets:['Support Tickets','Raise a ticket or check on an existing one'],
  'ticket-detail':['Ticket Details',''],
  account:['Profile & Settings','']
};
function go(name, el){
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('on'));
  document.getElementById('page-'+name).classList.add('on');
  document.querySelectorAll('.side-nav a').forEach(a=>a.classList.remove('on'));
  if(el) el.classList.add('on');
  else {
    const parent = {'renewal-detail':'renewals','invoice-detail':'invoices','ticket-detail':'tickets'}[name];
    const target = parent || name;
    const link = Array.from(document.querySelectorAll('.side-nav a')).find(a=>a.getAttribute('onclick').includes("'"+target+"'"));
    if(link) link.classList.add('on');
  }
  const t = titles[name];
  if(t) document.getElementById('topbar-title').innerHTML = '<h1>'+t[0]+'</h1>' + (t[1] ? '<div class="sub">'+t[1]+'</div>' : '');
  document.querySelector('.content').scrollTop = 0;
  window.scrollTo({top:0,behavior:'smooth'});
}
</script>
</body>
</html>