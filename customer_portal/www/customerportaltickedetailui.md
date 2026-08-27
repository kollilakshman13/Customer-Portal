<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Ticket Details — Tabbed</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=IBM+Plex+Mono:wght@400;500;600;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/tabler-icons/2.44.0/iconfont/tabler-icons.min.css">
<style>
  :root{
    --bg:#ffffff;
    --surface:#ffffff;
    --surface-2:#f4f6fb;
    --line:#e2e6f0;
    --text:#161b2c;
    --muted:#6b7290;
    --faint:#9aa0b8;
    --green:#149a5c;
    --green-dim:#e7f7ef;
    --amber:#c96f0a;
    --amber-dim:#fdf1e0;
    --cyan:#0f7fb8;
    --cyan-dim:#e8f6fd;
    --red:#d13a58;
    --red-dim:#fdecf0;
    --radius:10px;
  }
  *{box-sizing:border-box;}
  body{
    margin:0;background:var(--bg);color:var(--text);
    font-family:'Inter',sans-serif;font-size:13px;-webkit-font-smoothing:antialiased;
  }
  .mono{font-family:'IBM Plex Mono', monospace;}
  h1,h2,h3,.display{font-family:'Space Grotesk', sans-serif;}

  /* Topbar */
  .tb{
    display:flex;align-items:center;justify-content:space-between;
    padding:12px 24px;background:var(--surface);border-bottom:1px solid var(--line);
    position:sticky;top:0;z-index:30;
  }
  .tb-left{display:flex;align-items:center;gap:10px;}
  .tb-left i{font-size:18px;color:var(--cyan);}
  .tb-left span{font-family:'Space Grotesk',sans-serif;font-weight:700;font-size:15px;letter-spacing:.2px;}
  .tb-left .dot{width:6px;height:6px;border-radius:50%;background:var(--green);box-shadow:0 0 0 3px var(--green-dim);}
  .tb-right{display:flex;align-items:center;gap:16px;color:var(--muted);font-size:16px;}
  .tb-search{
    display:flex;align-items:center;gap:8px;background:var(--surface-2);border:1px solid var(--line);
    border-radius:8px;padding:7px 12px;color:var(--faint);font-size:12px;width:220px;
  }
  .avatar{
    width:28px;height:28px;border-radius:6px;background:linear-gradient(135deg,var(--cyan),var(--green));
    color:#ffffff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:11px;
    font-family:'Space Grotesk',sans-serif;
  }

  .shell{max-width:1160px;margin:0 auto;padding:20px 24px 56px;}
  .back{
    display:inline-flex;align-items:center;gap:6px;color:var(--muted);text-decoration:none;
    font-size:12px;font-weight:600;margin-bottom:14px;
  }
  .back:hover{color:var(--cyan);}

  /* Header */
  .header{
    background:var(--surface);border:1px solid var(--line);border-radius:var(--radius);
    padding:18px 20px;margin-bottom:0;
    box-shadow:0 1px 2px rgba(22,27,44,.03), 0 6px 18px -10px rgba(22,27,44,.08);
  }
  .header-top{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;flex-wrap:wrap;}
  .status-line{display:flex;align-items:center;gap:9px;margin-bottom:10px;}
  .led{
    width:9px;height:9px;border-radius:50%;background:var(--amber);
    box-shadow:0 0 0 4px var(--amber-dim);position:relative;flex-shrink:0;
  }
  .led::after{
    content:'';position:absolute;inset:-4px;border-radius:50%;border:1px solid var(--amber);
    animation:pulse 2s ease-out infinite;
  }
  @keyframes pulse{0%{opacity:.6;transform:scale(.6);}100%{opacity:0;transform:scale(1.9);}}
  .tid{font-size:12px;font-weight:600;letter-spacing:.5px;color:var(--cyan);}
  .sep{color:var(--faint);}
  .status-tag{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.6px;color:var(--amber);}
  .prio-tag{
    font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;
    padding:2px 8px;border-radius:4px;background:var(--amber-dim);color:var(--amber);border:1px solid rgba(201,111,10,.25);
  }
  .title{font-size:22px;font-weight:700;margin:2px 0 8px;letter-spacing:-.2px;}
  .meta{display:flex;gap:16px;color:var(--faint);font-size:11.5px;flex-wrap:wrap;}
  .meta i{margin-right:4px;}

  .actions{display:flex;gap:8px;flex-wrap:wrap;}
  .btn{
    display:inline-flex;align-items:center;gap:6px;padding:8px 14px;border-radius:7px;
    font-size:12px;font-weight:600;border:1px solid var(--line);background:var(--surface-2);color:var(--text);
    cursor:pointer;transition:.15s;
  }
  .btn:hover{border-color:var(--cyan);color:var(--cyan);}
  .btn-primary{background:var(--cyan);border-color:var(--cyan);color:#fff;}
  .btn-primary:hover{background:#0d6fa1;color:#fff;}
  .btn i{font-size:14px;}

  /* Page-level tab nav — sits attached under header, full width */
  .page-tabs{
    display:flex;gap:2px;background:var(--surface);border:1px solid var(--line);border-top:none;
    border-radius:0 0 var(--radius) var(--radius);padding:0 8px;margin-bottom:16px;
    box-shadow:0 1px 2px rgba(22,27,44,.03), 0 6px 18px -10px rgba(22,27,44,.08);
    overflow-x:auto;
  }
  .page-tab{
    display:flex;align-items:center;gap:7px;padding:13px 16px;font-size:12.5px;font-weight:700;
    color:var(--muted);cursor:pointer;border-bottom:2px solid transparent;white-space:nowrap;
  }
  .page-tab:hover{color:var(--text);}
  .page-tab.active{color:var(--cyan);border-color:var(--cyan);}
  .page-tab .count{
    background:var(--surface-2);color:var(--muted);font-size:10px;font-weight:700;
    padding:1px 7px;border-radius:100px;font-family:'IBM Plex Mono',monospace;
  }
  .page-tab.active .count{background:var(--cyan-dim);color:var(--cyan);}
  .page-tab .flag{
    width:6px;height:6px;border-radius:50%;background:var(--red);margin-left:2px;
  }

  .page-panel{display:none;}
  .page-panel.active{display:block;animation:fadein .15s ease;}
  @keyframes fadein{from{opacity:0;transform:translateY(3px);}to{opacity:1;transform:none;}}

  /* Grid used inside Overview */
  .grid{display:grid;grid-template-columns:1fr 280px;gap:14px;align-items:start;}
  @media(max-width:900px){.grid{grid-template-columns:1fr;}}

  .card{
    background:var(--surface);border:1px solid var(--line);border-radius:var(--radius);
    padding:18px 20px;margin-bottom:14px;
    box-shadow:0 1px 2px rgba(22,27,44,.03), 0 6px 18px -10px rgba(22,27,44,.08);
  }
  .card-title{
    display:flex;align-items:center;gap:7px;font-size:11px;font-weight:700;
    text-transform:uppercase;letter-spacing:.7px;color:var(--muted);margin:0 0 14px;
  }
  .card-title i{color:var(--cyan);font-size:14px;}

  .issue-text{font-size:13px;line-height:1.7;color:#3d4560;}

  /* Attachments — grid (Files tab) and compact list (Overview preview) */
  .attach-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:12px;}
  .attach-card{border:1px solid var(--line);border-radius:10px;overflow:hidden;cursor:pointer;transition:.15s;}
  .attach-card:hover{border-color:var(--cyan);transform:translateY(-2px);}
  .attach-thumb{
    height:100px;background:linear-gradient(135deg,var(--cyan-dim),var(--green-dim));
    display:flex;align-items:center;justify-content:center;color:var(--cyan);font-size:26px;
  }
  .attach-meta{padding:9px 10px;}
  .attach-name{font-size:11.5px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
  .attach-sub{font-size:10.5px;color:var(--faint);margin-top:3px;display:flex;justify-content:space-between;}

  .attach-list{display:flex;flex-direction:column;gap:8px;}
  .attach-row{
    display:flex;align-items:center;gap:10px;padding:9px 12px;background:var(--surface-2);
    border:1px solid var(--line);border-radius:7px;
  }
  .attach-row .ext{
    font-family:'IBM Plex Mono',monospace;font-size:9.5px;font-weight:700;color:var(--cyan);
    background:var(--cyan-dim);padding:3px 6px;border-radius:4px;flex-shrink:0;
  }
  .attach-row .name{flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:12px;font-weight:500;}
  .attach-row .sz{color:var(--faint);font-size:10.5px;font-family:'IBM Plex Mono',monospace;}
  .attach-row i.dl{color:var(--muted);cursor:pointer;font-size:15px;}
  .attach-row i.dl:hover{color:var(--cyan);}

  /* Log-feed timeline (Activity tab) */
  .log-feed{display:flex;flex-direction:column;}
  .log-day{
    font-family:'IBM Plex Mono',monospace;font-size:10px;font-weight:600;color:var(--faint);
    text-transform:uppercase;letter-spacing:.6px;margin:14px 0 8px;
  }
  .log-day:first-child{margin-top:0;}
  .log-row{
    display:flex;gap:11px;padding:10px 0 10px 14px;border-left:2px solid var(--line);position:relative;
  }
  .log-row::before{
    content:'';position:absolute;left:-5px;top:15px;width:8px;height:8px;border-radius:50%;background:var(--surface);
    border:2px solid var(--line);
  }
  .log-row.comment::before{border-color:var(--cyan);}
  .log-row.created::before{border-color:var(--green);}
  .log-row.file::before{border-color:var(--amber);}
  .log-icon{
    width:26px;height:26px;border-radius:6px;display:flex;align-items:center;justify-content:center;
    font-size:13px;flex-shrink:0;
  }
  .log-icon.comment{background:var(--cyan-dim);color:var(--cyan);}
  .log-icon.created{background:var(--green-dim);color:var(--green);}
  .log-icon.file{background:var(--amber-dim);color:var(--amber);}
  .log-body{flex:1;min-width:0;}
  .log-row-top{display:flex;align-items:baseline;gap:7px;flex-wrap:wrap;}
  .log-name{font-weight:700;font-size:13px;}
  .log-tag{font-size:11px;color:var(--faint);}
  .log-time{font-family:'IBM Plex Mono',monospace;font-size:10.5px;color:var(--faint);margin-left:auto;}
  .log-content{font-size:13px;color:#454c68;margin-top:3px;line-height:1.6;}

  /* Email logs (Emails tab) */
  .elog-row{display:flex;align-items:flex-start;gap:12px;padding:13px 0;border-bottom:1px solid var(--line);}
  .elog-row:last-child{border-bottom:none;}
  .elog-icon{
    width:26px;height:26px;border-radius:6px;background:var(--cyan-dim);color:var(--cyan);
    display:flex;align-items:center;justify-content:center;font-size:13px;flex-shrink:0;
  }
  .elog-body{flex:1;min-width:0;}
  .elog-top{display:flex;align-items:baseline;gap:8px;flex-wrap:wrap;}
  .elog-subject{font-weight:700;font-size:13px;}
  .elog-status{
    font-size:9.5px;font-weight:700;padding:2px 7px;border-radius:4px;text-transform:uppercase;
    letter-spacing:.4px;font-family:'IBM Plex Mono',monospace;
  }
  .elog-status.sent{background:var(--green-dim);color:var(--green);border:1px solid rgba(20,154,92,.25);}
  .elog-status.fail{background:var(--red-dim);color:var(--red);border:1px solid rgba(209,58,88,.25);}
  .elog-time{font-family:'IBM Plex Mono',monospace;font-size:10.5px;color:var(--faint);margin-left:auto;}
  .elog-to{font-size:11.5px;color:var(--muted);margin-top:4px;}
  .elog-to b{color:var(--faint);font-weight:600;}

  /* Sidebar */
  .kv{display:flex;justify-content:space-between;gap:10px;padding:9px 0;border-bottom:1px solid var(--line);}
  .kv:last-child{border-bottom:none;padding-bottom:0;}
  .kv:first-child{padding-top:0;}
  .kv .k{color:var(--faint);font-size:11px;}
  .kv .v{font-weight:600;font-size:12px;text-align:right;}
  .kv .v.link{color:var(--cyan);}
  .kv .v.mono{font-family:'IBM Plex Mono',monospace;font-size:10.5px;}

  .sla-top{display:flex;justify-content:space-between;align-items:center;}
  .sla-badge{
    font-family:'IBM Plex Mono',monospace;background:var(--green-dim);color:var(--green);
    font-size:10px;font-weight:700;padding:3px 9px;border-radius:100px;border:1px solid rgba(20,154,92,.25);
  }
  .gauge-wrap{display:flex;align-items:center;gap:16px;margin:18px 0;}
  .gauge{position:relative;width:76px;height:76px;flex-shrink:0;}
  .gauge svg{transform:rotate(-90deg);}
  .gauge-label{
    position:absolute;inset:0;display:flex;align-items:center;justify-content:center;
    font-family:'IBM Plex Mono',monospace;font-weight:700;font-size:16px;color:var(--cyan);
  }
  .sla-due{font-size:10.5px;color:var(--faint);margin-bottom:2px;text-transform:uppercase;letter-spacing:.4px;}
  .sla-date{font-family:'Space Grotesk',sans-serif;font-weight:700;font-size:15px;}
  .sla-split{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-top:16px;}
  .sla-box{background:var(--surface-2);border:1px solid var(--line);border-radius:8px;padding:10px 11px;}
  .sla-box .k{font-size:9.5px;color:var(--faint);text-transform:uppercase;letter-spacing:.4px;margin-bottom:5px;}
  .sla-box .v{font-size:12px;font-weight:700;display:flex;align-items:center;gap:5px;}
  .sla-box .v.done{color:var(--green);}
  .sla-box .v.pending{color:var(--amber);}

  /* Reply */
  .reply-tabs{display:flex;gap:16px;border-bottom:1px solid var(--line);margin-bottom:12px;}
  .reply-tab{padding-bottom:9px;font-size:11.5px;font-weight:700;color:var(--faint);cursor:pointer;border-bottom:2px solid transparent;text-transform:uppercase;letter-spacing:.4px;}
  .reply-tab.active{color:var(--cyan);border-color:var(--cyan);}
  .reply-box{border:1px solid var(--line);border-radius:9px;padding:13px 14px;background:var(--surface-2);}
  .reply-box textarea{
    width:100%;border:none;background:none;resize:none;min-height:58px;font-family:'Inter',sans-serif;
    font-size:12.5px;color:var(--text);outline:none;
  }
  .reply-box textarea::placeholder{color:var(--faint);}
  .reply-foot{display:flex;justify-content:space-between;align-items:center;margin-top:8px;}
  .reply-icons{display:flex;gap:13px;color:var(--muted);font-size:17px;}
  .reply-icons i{cursor:pointer;}
  .reply-icons i:hover{color:var(--cyan);}

  ::-webkit-scrollbar{width:8px;}
  ::-webkit-scrollbar-thumb{background:var(--line);border-radius:8px;}
</style>
</head>
<body>

<div class="tb">
  <div class="tb-left">
    <span class="dot"></span>
    <i class="ti ti-shield-lock"></i>
    <span>64 Support Console</span>
  </div>
  <div class="tb-right">
    <div class="tb-search"><i class="ti ti-search"></i> Search tickets…</div>
    <i class="ti ti-bell"></i>
    <div class="avatar">M</div>
  </div>
</div>

<div class="shell">
  <a class="back" href="#"><i class="ti ti-arrow-left"></i> Back to My Tickets</a>

  <!-- Header (persistent across all tabs) -->
  <div class="header">
    <div class="header-top">
      <div>
        <div class="status-line">
          <span class="led"></span>
          <span class="tid mono">ISS260103</span>
          <span class="sep">/</span>
          <span class="status-tag">Created</span>
          <span class="sep">/</span>
          <span class="prio-tag">Medium Priority</span>
        </div>
        <h1 class="title">Screen flickering during remote installation</h1>
        <div class="meta">
          <span><i class="ti ti-calendar-plus"></i>Created 17 Aug 2026</span>
          <span><i class="ti ti-refresh"></i>Updated 17 Aug 2026</span>
          <span><i class="ti ti-user"></i>Manjulatha N</span>
        </div>
      </div>
      <div class="actions">
        <button class="btn"><i class="ti ti-arrow-up-circle"></i> Escalate</button>
        <button class="btn"><i class="ti ti-circle-check"></i> Resolve</button>
        <button class="btn btn-primary"><i class="ti ti-message-circle"></i> Reply</button>
      </div>
    </div>
  </div>

  <!-- Top-level page tabs -->
  <div class="page-tabs">
    <div class="page-tab active" onclick="tdPageTab(this,'tab-overview')">
      <i class="ti ti-layout-grid"></i> Overview
    </div>
    <div class="page-tab" onclick="tdPageTab(this,'tab-activity')">
      <i class="ti ti-history"></i> Activity <span class="count">4</span>
    </div>
    <div class="page-tab" onclick="tdPageTab(this,'tab-emails')">
      <i class="ti ti-mail"></i> Emails <span class="count">2</span>
      <span class="flag" title="1 failed delivery"></span>
    </div>
    <div class="page-tab" onclick="tdPageTab(this,'tab-files')">
      <i class="ti ti-paperclip"></i> Files <span class="count">2</span>
    </div>
  </div>

  <!-- OVERVIEW -->
  <div class="page-panel active" id="tab-overview">
    <div class="grid">
      <div>
        <div class="card">
          <div class="card-title"><i class="ti ti-file-description"></i> Issue Details</div>
          <p class="issue-text">Customer reports intermittent screen flickering on the workstation during a new remote installation. Error appears briefly and the display resets. Two screenshots attached showing the error state at the time of occurrence.</p>
        </div>

        <div class="card">
          <div class="card-title"><i class="ti ti-paperclip"></i> Attachments <span style="color:var(--faint);font-weight:400;">— see Files tab for all 2</span></div>
          <div class="attach-list">
            <div class="attach-row">
              <span class="ext mono">JPG</span>
              <span class="name">WhatsApp Image 2026-08-14 (2)c79cff.jpeg</span>
              <span class="sz">214 KB</span>
              <i class="ti ti-download dl"></i>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="reply-tabs">
            <div class="reply-tab active">Reply</div>
            <div class="reply-tab">Internal Note</div>
          </div>
          <div class="reply-box">
            <textarea placeholder="Write a reply to the customer…"></textarea>
            <div class="reply-foot">
              <div class="reply-icons">
                <i class="ti ti-paperclip"></i>
                <i class="ti ti-mood-smile"></i>
                <i class="ti ti-template"></i>
              </div>
              <button class="btn btn-primary"><i class="ti ti-send"></i> Send Reply</button>
            </div>
          </div>
        </div>
      </div>

      <div>
        <div class="card">
          <div class="card-title"><i class="ti ti-info-circle"></i> Ticket Info</div>
          <div class="kv"><span class="k">Support Type</span><span class="v">Remote Support</span></div>
          <div class="kv"><span class="k">Query Type</span><span class="v">New Installation</span></div>
          <div class="kv"><span class="k">Contact</span><span class="v">lakshman k</span></div>
          <div class="kv"><span class="k">Email</span><span class="v link mono">kollilakshman07@gmail.com</span></div>
          <div class="kv"><span class="k">Team</span><span class="v" style="color:var(--faint);">Unassigned</span></div>
        </div>

        <div class="card">
          <div class="sla-top">
            <div class="card-title" style="margin:0;"><i class="ti ti-clock-check"></i> SLA Monitor</div>
            <span class="sla-badge">WITHIN SLA</span>
          </div>
          <div class="gauge-wrap">
            <div class="gauge">
              <svg width="76" height="76" viewBox="0 0 76 76">
                <circle cx="38" cy="38" r="32" fill="none" stroke="#e2e6f0" stroke-width="7"/>
                <circle cx="38" cy="38" r="32" fill="none" stroke="#0f7fb8" stroke-width="7"
                  stroke-dasharray="201" stroke-dashoffset="150.75" stroke-linecap="round"/>
              </svg>
              <div class="gauge-label">25%</div>
            </div>
            <div>
              <div class="sla-due">Expected resolution</div>
              <div class="sla-date">17 Aug 2026</div>
            </div>
          </div>
          <div class="sla-split">
            <div class="sla-box">
              <div class="k">Response</div>
              <div class="v done"><i class="ti ti-check"></i> Completed</div>
            </div>
            <div class="sla-box">
              <div class="k">Resolution</div>
              <div class="v pending"><i class="ti ti-clock"></i> Due 17 Aug</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- ACTIVITY -->
  <div class="page-panel" id="tab-activity">
    <div class="card">
      <div class="card-title"><i class="ti ti-history"></i> Full Activity Log</div>
      <div class="log-feed">
        <div class="log-day">2 days ago</div>
        <div class="log-row comment">
          <div class="log-icon comment"><i class="ti ti-message"></i></div>
          <div class="log-body">
            <div class="log-row-top">
              <span class="log-name">Manjulatha N</span>
              <span class="log-tag">commented</span>
              <span class="log-time">2d ago</span>
            </div>
            <div class="log-content">issue error screen short</div>
          </div>
        </div>
        <div class="log-row comment">
          <div class="log-icon comment"><i class="ti ti-message"></i></div>
          <div class="log-body">
            <div class="log-row-top">
              <span class="log-name">Manjulatha N</span>
              <span class="log-tag">commented</span>
              <span class="log-time">2d ago</span>
            </div>
            <div class="log-content">hi</div>
          </div>
        </div>

        <div class="log-day">6 days ago</div>
        <div class="log-row created">
          <div class="log-icon created"><i class="ti ti-circle-plus"></i></div>
          <div class="log-body">
            <div class="log-row-top">
              <span class="log-name">Manjulatha N</span>
              <span class="log-tag">ticket created</span>
              <span class="log-time">6d ago</span>
            </div>
            <div class="log-content">Ticket submitted by user.</div>
          </div>
        </div>
        <div class="log-row file">
          <div class="log-icon file"><i class="ti ti-paperclip"></i></div>
          <div class="log-body">
            <div class="log-row-top">
              <span class="log-name">User</span>
              <span class="log-tag">file attached</span>
              <span class="log-time">6d ago</span>
            </div>
            <div class="log-content">WhatsApp Image 2026-08-14 (2)c79cff.jpeg</div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- EMAILS -->
  <div class="page-panel" id="tab-emails">
    <div class="card">
      <div class="card-title"><i class="ti ti-mail"></i> Email Delivery Log</div>
      <div class="elog-row">
        <div class="elog-icon"><i class="ti ti-mail"></i></div>
        <div class="elog-body">
          <div class="elog-top">
            <span class="elog-subject">Ticket No: ISS260103</span>
            <span class="elog-status sent">Sent</span>
            <span class="elog-time">6d ago</span>
          </div>
          <div class="elog-to"><b>To</b> projects@apsfc.com, geetha.p@64network.com</div>
        </div>
      </div>
      <div class="elog-row">
        <div class="elog-icon"><i class="ti ti-mail"></i></div>
        <div class="elog-body">
          <div class="elog-top">
            <span class="elog-subject">sum</span>
            <span class="elog-status fail">No recipient</span>
            <span class="elog-time">6d ago</span>
          </div>
          <div class="elog-to"><b>To</b> None — delivery failed, recipient not set</div>
        </div>
      </div>
    </div>
  </div>

  <!-- FILES -->
  <div class="page-panel" id="tab-files">
    <div class="card">
      <div class="card-title"><i class="ti ti-paperclip"></i> All Attachments (2)</div>
      <div class="attach-grid">
        <div class="attach-card">
          <div class="attach-thumb"><i class="ti ti-photo"></i></div>
          <div class="attach-meta">
            <div class="attach-name">WhatsApp Image (2)c79cff.jpeg</div>
            <div class="attach-sub"><span>214 KB</span><i class="ti ti-download"></i></div>
          </div>
        </div>
        <div class="attach-card">
          <div class="attach-thumb"><i class="ti ti-photo"></i></div>
          <div class="attach-meta">
            <div class="attach-name">WhatsApp Image (2)772026.jpeg</div>
            <div class="attach-sub"><span>198 KB</span><i class="ti ti-download"></i></div>
          </div>
        </div>
      </div>
    </div>
  </div>

</div>

<script>
  function tdPageTab(tabEl, panelId){
    document.querySelectorAll('.page-tab').forEach(t=>t.classList.remove('active'));
    document.querySelectorAll('.page-panel').forEach(p=>p.classList.remove('active'));
    tabEl.classList.add('active');
    document.getElementById(panelId).classList.add('active');
    window.scrollTo({top:0, behavior:'smooth'});
  }
</script>

</body>
</html>