<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <title>Ticket Details</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/tabler-icons/2.44.0/iconfont/tabler-icons.min.css">
    <style>
        :root {

            --blue: #2f6fed;

            --blue-bg: #e9f0fe;

            --bg: #f4f6fa;

            --card: #ffffff;

            --line: #e7eaf0;

            --text: #1c2431;

            --text-dim: #6b7280;

            --text-faint: #9aa2b1;

            --green: #16a34a;

            --green-bg: #e8f8ee;

            --amber: #d97706;

            --amber-bg: #fdf1de;

            --red: #dc2626;

            --red-bg: #fdeaea;

            --purple-bg: #efeafd;

            --purple: #7c5cf0;

        }

        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        body {
            background: var(--bg);
            color: var(--text);
            font-family: 'Inter', sans-serif;
            font-size: 13.5px;
            line-height: 1.6;
        }

        .tk-shell {
            max-width: 1180px;
            margin: 0 auto;
            padding: 20px 24px 60px;
        }

        .tk-topbar {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
        }

        .tk-topbar h1 {
            font-size: 20px;
            font-weight: 700;
        }

        .tk-back {
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 12.5px;
            font-weight: 500;
            color: var(--text);
            border: 1px solid var(--line);
            background: var(--card);
            padding: 7px 14px;
            border-radius: 8px;
            margin-left: 14px;
        }

        .tk-top-left {
            display: flex;
            align-items: center;
        }

        .tk-grid {
            display: grid;
            grid-template-columns: 1.7fr 1fr;
            gap: 18px;
            align-items: start;
        }

        .tk-card {
            background: var(--card);
            border: 1px solid var(--line);
            border-radius: 12px;
            padding: 20px 22px;
            margin-bottom: 18px;
        }

        .tk-card:last-child {
            margin-bottom: 0;
        }

        .tk-card-title {
            display: flex;
            align-items: center;
            gap: 7px;
            font-size: 12px;
            font-weight: 600;
            color: var(--text-dim);
            text-transform: uppercase;
            letter-spacing: .4px;
            margin-bottom: 14px;
        }

        .tk-card-title i {
            font-size: 15px;
            color: var(--blue);
        }

        /* Header card */

        .tk-idrow {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 6px;
        }

        .tk-id {
            font-size: 15px;
            font-weight: 700;
        }

        .tk-pill {
            font-size: 10.5px;
            font-weight: 700;
            padding: 3px 10px;
            border-radius: 5px;
            letter-spacing: .3px;
        }

        .tk-pill.created {
            background: var(--blue-bg);
            color: var(--blue);
        }

        .tk-pill.medium {
            background: var(--amber-bg);
            color: var(--amber);
        }

        .tk-pill.sla {
            background: var(--red-bg);
            color: var(--red);
            display: flex;
            align-items: center;
            gap: 5px;
            padding: 6px 12px;
            font-size: 11.5px;
        }

        .tk-title {
            font-size: 21px;
            font-weight: 700;
            margin-bottom: 10px;
        }

        .tk-metarow {
            display: flex;
            align-items: center;
            gap: 22px;
            flex-wrap: wrap;
        }

        .tk-meta {
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 12px;
            color: var(--text-dim);
        }

        .tk-meta i {
            font-size: 14px;
            color: var(--text-faint);
        }

        .tk-meta b {
            color: var(--text);
            font-weight: 500;
        }

        .tk-assignee {
            display: flex;
            align-items: center;
            gap: 9px;
            margin-left: auto;
        }

        .tk-assignee-avatar {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            background: var(--blue);
            color: #fff;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 13px;
            font-weight: 600;
        }

        .tk-assignee-label {
            font-size: 11px;
            color: var(--text-faint);
        }

        .tk-assignee-name {
            font-size: 12.5px;
            font-weight: 500;
        }

        /* Description */

        .tk-desc-box {
            background: var(--bg);
            border: 1px solid var(--line);
            border-radius: 8px;
            padding: 12px 14px;
            font-size: 13px;
            color: var(--text);
        }

        /* Timeline */

        .tk-tl-row {
            display: flex;
            gap: 14px;
            margin-bottom: 20px;
        }

        .tk-tl-row:last-child {
            margin-bottom: 0;
        }

        .tk-tl-icon {
            width: 36px;
            height: 36px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 16px;
            flex-shrink: 0;
        }

        .tk-tl-icon.blue {
            background: var(--blue-bg);
            color: var(--blue);
        }

        .tk-tl-icon.green {
            background: var(--green-bg);
            color: var(--green);
        }

        .tk-tl-icon.purple {
            background: var(--purple-bg);
            color: var(--purple);
        }

        .tk-tl-icon.amber {
            background: var(--amber-bg);
            color: var(--amber);
        }

        .tk-tl-body {
            flex: 1;
            display: flex;
            justify-content: space-between;
        }

        .tk-tl-title {
            font-size: 13.5px;
            font-weight: 600;
        }

        .tk-tl-sub {
            font-size: 12px;
            color: var(--text-dim);
            margin-top: 2px;
        }

        .tk-tl-time {
            font-size: 12px;
            color: var(--text-faint);
            text-align: right;
            white-space: nowrap;
        }

        /* Emails */

        .tk-email {
            border: 1px solid var(--line);
            border-radius: 8px;
            padding: 12px 14px;
            margin-bottom: 10px;
        }

        .tk-email:last-child {
            margin-bottom: 0;
        }

        .tk-email-head {
            display: flex;
            justify-content: space-between;
            font-size: 11.5px;
            color: var(--text-faint);
            margin-bottom: 5px;
        }

        .tk-email-dir {
            font-size: 9.5px;
            font-weight: 700;
            padding: 2px 7px;
            border-radius: 4px;
            text-transform: uppercase;
        }

        .tk-email-dir.in {
            background: var(--green-bg);
            color: var(--green);
        }

        .tk-email-dir.out {
            background: var(--blue-bg);
            color: var(--blue);
        }

        .tk-email-subj {
            font-size: 13px;
            font-weight: 600;
            margin-bottom: 3px;
        }

        .tk-email-snip {
            font-size: 12px;
            color: var(--text-dim);
        }

        /* Reply */

        .tk-reply-box {
            border: 1px solid var(--line);
            border-radius: 10px;
            padding: 14px 16px;
        }

        .tk-reply-box textarea {
            width: 100%;
            border: none;
            resize: none;
            font-family: inherit;
            font-size: 13px;
            outline: none;
            height: 70px;
            color: var(--text);
        }

        .tk-reply-tools {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-top: 10px;
            padding-top: 10px;
            border-top: 1px solid var(--line);
        }

        .tk-reply-icons {
            display: flex;
            gap: 14px;
            color: var(--text-faint);
            font-size: 17px;
        }

        .tk-send-btn {
            background: var(--blue);
            color: #fff;
            border: none;
            font-size: 13px;
            font-weight: 600;
            padding: 9px 18px;
            border-radius: 8px;
            display: flex;
            align-items: center;
            gap: 7px;
            cursor: pointer;
        }

        /* Sidebar */

        .tk-field {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid var(--line);
        }

        .tk-field:last-child {
            border-bottom: none;
            padding-bottom: 0;
        }

        .tk-field:first-child {
            padding-top: 0;
        }

        .tk-field .lbl {
            font-size: 12.5px;
            color: var(--text-dim);
        }

        .tk-field .val {
            font-size: 12.5px;
            font-weight: 500;
        }

        .tk-status-dot {
            width: 7px;
            height: 7px;
            border-radius: 50%;
            display: inline-block;
            margin-right: 6px;
        }

        .tk-status-dot.amber {
            background: var(--amber);
        }

        .tk-status-dot.blue {
            background: var(--blue);
        }

        /* Sidebar cards — shared header treatment */

        .tk-side-card {
            padding: 0;
            overflow: hidden;
        }

        .tk-side-head {
            display: flex;
            align-items: center;
            gap: 9px;
            padding: 15px 20px;
            border-bottom: 1px solid var(--line);
        }

        .tk-side-head i {
            font-size: 15px;
            color: var(--blue);
        }

        .tk-side-head .t {
            font-size: 12px;
            font-weight: 600;
            color: var(--text-dim);
            text-transform: uppercase;
            letter-spacing: .4px;
        }

        .tk-side-body {
            padding: 4px 20px 14px;
        }

        /* Ticket information — redesigned, single-tone icons, no column divider */

        .tk-info-item {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 12px 0;
            border-bottom: 1px solid var(--line);
            position: relative;
        }

        .tk-info-item:last-of-type {
            border-bottom: none;
        }

        .tk-info-icon {
            width: 30px;
            height: 30px;
            border-radius: 8px;
            background: var(--blue-bg);
            color: var(--blue);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 14px;
            flex-shrink: 0;
        }

        .tk-info-label {
            font-size: 11px;
            color: var(--text-faint);
            margin-bottom: 2px;
        }

        .tk-info-value {
            font-size: 13px;
            font-weight: 600;
        }

        .tk-info-value.mono {
            font-family: 'DM Mono', ui-monospace, monospace;
            font-size: 12px;
            color: var(--blue);
        }

        .tk-info-right {
            margin-left: auto;
        }

        .tk-info-badge {
            display: inline-flex;
            align-items: center;
            gap: 5px;
            font-size: 11.5px;
            font-weight: 600;
            padding: 4px 11px;
            border-radius: 20px;
        }

        .tk-info-badge::before {
            content: '';
            width: 6px;
            height: 6px;
            border-radius: 50%;
        }

        .tk-info-badge.amber {
            background: var(--amber-bg);
            color: var(--amber);
        }

        .tk-info-badge.amber::before {
            background: var(--amber);
        }

        .tk-info-badge.blue {
            background: var(--blue-bg);
            color: var(--blue);
        }

        .tk-info-badge.blue::before {
            background: var(--blue);
        }

        .tk-info-person {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 13px 0 3px;
        }

        .tk-info-person-avatar {
            width: 28px;
            height: 28px;
            border-radius: 50%;
            background: var(--blue);
            color: #fff;
            font-size: 11px;
            font-weight: 600;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
        }

        /* Contact */

        .tk-contact-top {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 14px 0 12px;
            border-bottom: 1px solid var(--line);
        }

        .tk-contact-avatar {
            width: 36px;
            height: 36px;
            border-radius: 50%;
            background: var(--blue);
            color: #fff;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 14px;
            font-weight: 600;
            flex-shrink: 0;
        }

        .tk-contact-name {
            font-size: 13.5px;
            font-weight: 600;
        }

        .tk-contact-role {
            font-size: 11.5px;
            color: var(--text-faint);
        }

        .tk-contact-badge {
            margin-left: auto;
            font-size: 10.5px;
            font-weight: 600;
            background: var(--green-bg);
            color: var(--green);
            padding: 3px 9px;
            border-radius: 20px;
            white-space: nowrap;
        }

        .tk-contact-line {
            display: flex;
            align-items: center;
            gap: 10px;
            font-size: 12.5px;
            padding: 11px 0;
            border-bottom: 1px solid var(--line);
        }

        .tk-contact-line:last-child {
            border-bottom: none;
            padding-bottom: 3px;
        }

        .tk-contact-line i {
            width: 30px;
            height: 30px;
            border-radius: 8px;
            background: var(--blue-bg);
            color: var(--blue);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 14px;
            flex-shrink: 0;
        }

        .tk-contact-line a {
            color: var(--blue);
            text-decoration: none;
            font-weight: 500;
        }

        /* SLA */

        .tk-sla-main {
            display: flex;
            gap: 12px;
            align-items: flex-start;
            background: var(--red-bg);
            border-radius: 10px;
            padding: 14px 16px;
            margin: 14px 0 12px;
        }

        .tk-sla-main .icn {
            width: 32px;
            height: 32px;
            border-radius: 8px;
            background: #fff;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
        }

        .tk-sla-main .icn i {
            font-size: 16px;
            color: var(--red);
        }

        .tk-sla-main .lbl {
            font-size: 12px;
            color: var(--text-dim);
        }

        .tk-sla-main .val {
            font-size: 14px;
            font-weight: 700;
            color: var(--red);
            margin: 2px 0;
        }

        .tk-sla-main .right {
            margin-left: auto;
            text-align: right;
        }

        .tk-sla-pair {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
            padding-bottom: 14px;
        }

        .tk-sla-box {
            border: 1px solid var(--line);
            border-radius: 10px;
            padding: 12px 13px;
        }

        .tk-sla-box .top {
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 11.5px;
            color: var(--text-dim);
            margin-bottom: 6px;
        }

        .tk-sla-box .top i {
            font-size: 14px;
        }

        .tk-sla-box.ok .top i {
            color: var(--green);
        }

        .tk-sla-box.bad .top i {
            color: var(--red);
        }

        .tk-sla-box .status {
            font-size: 12.5px;
            font-weight: 700;
            margin-bottom: 2px;
        }

        .tk-sla-box.ok .status {
            color: var(--green);
        }

        .tk-sla-box.bad .status {
            color: var(--red);
        }

        .tk-sla-box .ts {
            font-size: 10.5px;
            color: var(--text-faint);
        }

        /* Attachments */

        .tk-attach-drop {
            border: 1.5px dashed var(--line);
            border-radius: 10px;
            padding: 22px 14px;
            text-align: center;
            margin: 14px 0 14px;
        }

        .tk-attach-drop i {
            font-size: 20px;
            color: var(--text-faint);
            margin-bottom: 8px;
        }

        .tk-attach-drop .t1 {
            font-size: 12.5px;
            color: var(--text-dim);
        }

        .tk-attach-drop .t2 {
            font-size: 11.5px;
            color: var(--text-faint);
            margin-top: 2px;
        }

        .tk-attach-drop a {
            color: var(--blue);
            text-decoration: none;
            font-weight: 500;
        }
    </style>
</head>

<body>
    <div class="tk-shell">

        <div class="tk-topbar">
            <div class="tk-top-left">
                <h1>Ticket Details</h1>
                <div class="tk-back"><i class="ti ti-arrow-left"></i>Back to my tickets</div>
            </div>
        </div>

        <div class="tk-grid">
            <div>
                <!-- Header -->
                <div class="tk-card">
                    <div class="tk-idrow">
                        <span class="tk-id">ISS260121</span>
                        <i class="ti ti-copy" style="font-size:14px; color:var(--text-faint)"></i>
                        <span class="tk-pill created">CREATED</span>
                        <span class="tk-pill medium">MEDIUM</span>
                    </div>
                    <div class="tk-title">Testing – Sonicwall Troubleshooting</div>
                    <div class="tk-metarow">
                        <div class="tk-meta"><i class="ti ti-calendar"></i>Created <b>29 Aug 2026 · 10:30 AM</b></div>
                        <div class="tk-meta"><i class="ti ti-refresh"></i>Updated <b>29 Aug 2026 · 04:15 PM</b></div>
                        <div class="tk-assignee">
                            <div class="tk-assignee-avatar">M</div>
                            <div>
                                <div class="tk-assignee-label">Assignee</div>
                                <div class="tk-assignee-name">L1 Support</div>
                            </div>
                        </div>
                        <div class="tk-pill sla"><i class="ti ti-alert-triangle"></i>SLA BREACHED</div>
                    </div>
                </div>

                <!-- Description -->
                <div class="tk-card">
                    <div class="tk-card-title"><i class="ti ti-file-text"></i>issue description</div>
                    <div class="tk-desc-box">Sonicwall is not working.</div>
                </div>

                <!-- Timeline -->
                <div class="tk-card">
                    <div class="tk-card-title"><i class="ti ti-history"></i>activity timeline</div>

                    <div class="tk-tl-row">
                        <div class="tk-tl-icon blue"><i class="ti ti-file-text"></i></div>
                        <div class="tk-tl-body">
                            <div>
                                <div class="tk-tl-title">Ticket created</div>
                                <div class="tk-tl-sub">Ticket created by geetha.p@64network.com</div>
                            </div>
                            <div class="tk-tl-time">29 Aug 2026<br>10:30 AM</div>
                        </div>
                    </div>
                    <div class="tk-tl-row">
                        <div class="tk-tl-icon green"><i class="ti ti-user"></i></div>
                        <div class="tk-tl-body">
                            <div>
                                <div class="tk-tl-title">Assigned to L1 Support</div>
                                <div class="tk-tl-sub">Manual assignment by administrator</div>
                            </div>
                            <div class="tk-tl-time">29 Aug 2026<br>10:35 AM</div>
                        </div>
                    </div>
                    <div class="tk-tl-row">
                        <div class="tk-tl-icon purple"><i class="ti ti-mail"></i></div>
                        <div class="tk-tl-body">
                            <div>
                                <div class="tk-tl-title">Email sent to customer</div>
                                <div class="tk-tl-sub">Regarding the issue details and next steps</div>
                            </div>
                            <div class="tk-tl-time">30 Aug 2026<br>11:20 AM</div>
                        </div>
                    </div>
                    <div class="tk-tl-row">
                        <div class="tk-tl-icon blue"><i class="ti ti-message-circle"></i></div>
                        <div class="tk-tl-body">
                            <div>
                                <div class="tk-tl-title">Customer replied</div>
                                <div class="tk-tl-sub">Customer provided additional information</div>
                            </div>
                            <div class="tk-tl-time">31 Aug 2026<br>09:15 AM</div>
                        </div>
                    </div>
                    <div class="tk-tl-row">
                        <div class="tk-tl-icon amber"><i class="ti ti-paperclip"></i></div>
                        <div class="tk-tl-body">
                            <div>
                                <div class="tk-tl-title">Attachment added</div>
                                <div class="tk-tl-sub">Screenshot.png added by customer</div>
                            </div>
                            <div class="tk-tl-time">31 Aug 2026<br>09:16 AM</div>
                        </div>
                    </div>
                </div>

                <!-- Emails -->
                <div class="tk-card">
                    <div class="tk-card-title"><i class="ti ti-mail"></i>emails</div>
                    <div class="tk-email">
                        <div class="tk-email-head"><span>geetha.p@64network.com → projects@apsfc.com</span><span
                                class="tk-email-dir out">outbound</span></div>
                        <div class="tk-email-subj">Re: Testing – Sonicwall Troubleshooting</div>
                        <div class="tk-email-snip">Regarding the issue details and next steps — could you confirm the
                            device model and firmware version...</div>
                    </div>
                    <div class="tk-email">
                        <div class="tk-email-head"><span>projects@apsfc.com → geetha.p@64network.com</span><span
                                class="tk-email-dir in">inbound</span></div>
                        <div class="tk-email-subj">Re: Testing – Sonicwall Troubleshooting</div>
                        <div class="tk-email-snip">Attached a screenshot of the error we're seeing on the admin console.
                            Model is TZ370, firmware attached too...</div>
                    </div>
                </div>

                <!-- Reply -->
                <div class="tk-card">
                    <div class="tk-card-title"><i class="ti ti-send"></i>reply to customer</div>
                    <div class="tk-reply-box">
                        <textarea placeholder="Write a reply to support team..."></textarea>
                        <div class="tk-reply-tools">
                            <div class="tk-reply-icons">
                                <i class="ti ti-paperclip"></i>
                                <i class="ti ti-mood-smile"></i>
                                <i class="ti ti-typography"></i>
                            </div>
                            <button class="tk-send-btn"><i class="ti ti-send"></i>Send reply</button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Sidebar -->
            <div>
                <div class="tk-card tk-side-card">
                    <div class="tk-side-head"><i class="ti ti-info-circle"></i><span class="t">ticket information</span>
                    </div>
                    <div class="tk-side-body">
                        <div class="tk-info-item">
                            <div class="tk-info-icon"><i class="ti ti-headset"></i></div>
                            <div>
                                <div class="tk-info-label">Support type</div>
                                <div class="tk-info-value">Remote support</div>
                            </div>
                        </div>
                        <div class="tk-info-item">
                            <div class="tk-info-icon"><i class="ti ti-tool"></i></div>
                            <div>
                                <div class="tk-info-label">Query type</div>
                                <div class="tk-info-value">Troubleshooting</div>
                            </div>
                        </div>
                        <div class="tk-info-item">
                            <div class="tk-info-icon"><i class="ti ti-flag"></i></div>
                            <div>
                                <div class="tk-info-label">Priority</div>
                            </div>
                            <div class="tk-info-right"><span class="tk-info-badge amber">Medium</span></div>
                        </div>
                        <div class="tk-info-item">
                            <div class="tk-info-icon"><i class="ti ti-circle-dot"></i></div>
                            <div>
                                <div class="tk-info-label">Status</div>
                            </div>
                            <div class="tk-info-right"><span class="tk-info-badge blue">Created</span></div>
                        </div>
                        <div class="tk-info-item">
                            <div class="tk-info-icon"><i class="ti ti-hash"></i></div>
                            <div>
                                <div class="tk-info-label">Ticket ID</div>
                                <div class="tk-info-value mono">ISS260121</div>
                            </div>
                        </div>
                        <div class="tk-info-person">
                            <div class="tk-info-person-avatar">G</div>
                            <div>
                                <div class="tk-info-label">Sales person</div>
                                <div class="tk-info-value" style="font-size:12.5px;">geetha.p@64network.com</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="tk-card tk-side-card">
                    <div class="tk-side-head"><i class="ti ti-users"></i><span class="t">contact details</span></div>
                    <div class="tk-side-body">
                        <div class="tk-contact-top">
                            <div class="tk-contact-avatar">M</div>
                            <div>
                                <div class="tk-contact-name">Manjulatha N</div>
                                <div class="tk-contact-role">Senior manager</div>
                            </div>
                            <div class="tk-contact-badge">✓ TPOC</div>
                        </div>
                        <div class="tk-contact-line"><i class="ti ti-mail"></i><a href="#">projects@apsfc.com</a></div>
                        <div class="tk-contact-line"><i class="ti ti-phone"></i>9866512501</div>
                    </div>
                </div>

                <div class="tk-card tk-side-card">
                    <div class="tk-side-head"><i class="ti ti-clock"></i><span class="t">sla status</span></div>
                    <div class="tk-side-body">
                        <div class="tk-sla-main">
                            <div class="icn"><i class="ti ti-alert-triangle"></i></div>
                            <div>
                                <div class="lbl">Resolution SLA</div>
                                <div class="val">Overdue by 2 days</div>
                            </div>
                            <div class="right">
                                <div class="lbl">Due on</div>
                                <div style="font-size:12.5px; font-weight:600;">31 Aug 2026<br>03:30 PM</div>
                            </div>
                        </div>
                        <div class="tk-sla-pair">
                            <div class="tk-sla-box ok">
                                <div class="top"><i class="ti ti-circle-check"></i>Response SLA</div>
                                <div class="status">Completed</div>
                                <div class="ts">29 Aug 2026 · 11:20 AM</div>
                            </div>
                            <div class="tk-sla-box bad">
                                <div class="top"><i class="ti ti-alert-triangle"></i>Resolution SLA</div>
                                <div class="status">Breached</div>
                                <div class="ts">31 Aug 2026 · 03:30 PM</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="tk-card tk-side-card">
                    <div class="tk-side-head"><i class="ti ti-paperclip"></i><span class="t">attachments (0)</span>
                    </div>
                    <div class="tk-side-body">
                        <div class="tk-attach-drop">
                            <i class="ti ti-upload"></i>
                            <div class="t1">No attachments yet</div>
                            <div class="t2">Drag and drop files here or <a href="#">Browse</a></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

    </div>
</body>

</html>