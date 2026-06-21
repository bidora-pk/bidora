"""
alert_sender.py  —  BIDORA Tender Intelligence
Reads users + their niches from Supabase.
Sends email alerts for new niche matches and saved tender deadlines.
"""
import os, smtplib, html
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from datetime import datetime, timedelta, timezone
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY")
GMAIL_USER   = os.getenv("GMAIL_USER")   # bidorapk@gmail.com
GMAIL_PASS   = os.getenv("GMAIL_APP_PASSWORD")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
now = datetime.now(timezone.utc).replace(tzinfo=None)

def send_email(to_email: str, subject: str, html_body: str):
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"]    = f"BIDORA Tender Intelligence <{GMAIL_USER}>"
    msg["To"]      = to_email
    msg.attach(MIMEText(html_body, "html"))
    with smtplib.SMTP_SSL("smtp.gmail.com", 465) as s:
        s.login(GMAIL_USER, GMAIL_PASS)
        s.sendmail(GMAIL_USER, to_email, msg.as_string())

def tender_row_html(t: dict) -> str:
    title    = html.escape(t.get("title", "")[:100])
    agency   = html.escape(t.get("procuring_agency", "")[:80])
    cat      = html.escape(t.get("industry_category", ""))
    deadline = t.get("time_left", "")
    link     = t.get("view_link", "#")
    pdf      = t.get("direct_pdf_link", "N/A")
    pdf_btn  = f'<a href="{pdf}" style="color:#10b981;">📄 PDF</a>' if pdf != "N/A" else ""
    return f"""
    <tr style="border-bottom:1px solid #1e2d45;">
      <td style="padding:12px 8px;">
        <strong style="color:#f1f5f9;">{title}</strong><br>
        <span style="color:#64748b;font-size:12px;">{agency}</span>
      </td>
      <td style="padding:12px 8px;white-space:nowrap;">
        <span style="background:#1e3a5f;color:#93c5fd;padding:2px 8px;border-radius:12px;font-size:11px;">{cat}</span>
      </td>
      <td style="padding:12px 8px;color:#f59e0b;white-space:nowrap;font-size:13px;">{html.escape(deadline)}</td>
      <td style="padding:12px 8px;">
        <a href="{link}" style="color:#3b82f6;">🔗 View</a> &nbsp; {pdf_btn}
      </td>
    </tr>"""

def email_wrapper(user_name: str, content: str) -> str:
    return f"""
<!DOCTYPE html><html><body style="margin:0;padding:0;background:#0b0f1a;font-family:Inter,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0b0f1a;padding:32px 16px;">
<tr><td align="center">
<table width="640" cellpadding="0" cellspacing="0" style="background:#111827;border-radius:16px;border:1px solid #1e2d45;overflow:hidden;">
  <tr style="background:linear-gradient(135deg,#1d4ed8,#0ea5e9);">
    <td style="padding:24px 32px;">
      <div style="display:flex;align-items:center;gap:10px;">
        <div style="width:36px;height:36px;background:rgba(255,255,255,0.2);border-radius:8px;display:inline-flex;align-items:center;justify-content:center;">
          <span style="font-size:18px;font-weight:900;color:white;font-family:Arial Black;">B</span>
        </div>
        <span style="font-size:22px;font-weight:900;color:white;letter-spacing:-0.5px;font-family:Arial Black;">BIDORA</span>
      </div>
      <p style="color:rgba(255,255,255,0.8);margin:6px 0 0;font-size:13px;">Pakistan Federal Tender Intelligence</p>
    </td>
  </tr>
  <tr><td style="padding:28px 32px;">
    <p style="color:#94a3b8;margin:0 0 20px;">Hi <strong style="color:#f1f5f9;">{html.escape(user_name or 'there')}</strong>,</p>
    {content}
    <hr style="border:none;border-top:1px solid #1e2d45;margin:28px 0;">
    <p style="color:#475569;font-size:12px;margin:0;">
      You're receiving this because you have alert preferences set on BIDORA.<br>
      <a href="mailto:bidorapk@gmail.com" style="color:#3b82f6;">Contact us</a> ·
      Questions? Reply to this email.
    </p>
  </td></tr>
</table>
</td></tr></table>
</body></html>"""

def run_alerts():
    print("BIDORA Alert Sender — fetching users...")
    niche_rows = supabase.table("user_niches").select("user_id, category, keywords").execute().data
    if not niche_rows:
        print("No users with niches found.")
        return

    from collections import defaultdict
    user_niches: dict[str, list] = defaultdict(list)
    for row in niche_rows:
        user_niches[row["user_id"]].append(row)

    profile_rows = supabase.table("profiles").select("id, full_name, company_name").execute().data
    profiles = {p["id"]: p for p in profile_rows}

    auth_users = supabase.auth.admin.list_users()
    email_map = {u.id: u.email for u in auth_users}

    cutoff_new = now - timedelta(hours=25)
    cutoff_24h = now + timedelta(hours=24)
    cutoff_3d  = now + timedelta(days=3)

    for user_id, niches in user_niches.items():
        email = email_map.get(user_id)
        if not email:
            continue

        profile   = profiles.get(user_id, {})
        user_name = profile.get("full_name") or profile.get("company_name") or "there"
        categories = [n["category"] for n in niches]

        # ── Alert 1: New tenders matching niche ──────────────────────────────
        new_tenders = []
        for category in categories:
            rows = supabase.table("tenders").select("*") \
                .eq("tracker_status", "Active") \
                .eq("industry_category", category) \
                .gte("first_seen_at", cutoff_new.isoformat()) \
                .execute().data
            for r in rows:
                existing = supabase.table("alert_log") \
                    .select("id").eq("user_id", user_id) \
                    .eq("tender_id", r["tender_id"]).eq("alert_type", "new_match") \
                    .execute().data
                if not existing:
                    new_tenders.append(r)
                    supabase.table("alert_log").insert({
                        "user_id": user_id, "tender_id": r["tender_id"], "alert_type": "new_match"
                    }).execute()

        if new_tenders:
            rows_html = "".join(tender_row_html(t) for t in new_tenders[:20])
            content = f"""
            <p style="color:#94a3b8;margin:0 0 16px;">
              <strong style="color:#10b981;">{len(new_tenders)} new tender{'s' if len(new_tenders)>1 else ''}</strong>
              matching your niche{'s' if len(categories)>1 else ''}
              (<strong style="color:#93c5fd;">{', '.join(categories)}</strong>) appeared today:
            </p>
            <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #1e2d45;border-radius:10px;overflow:hidden;">
              <tr style="background:#1a2236;">
                <th align="left" style="padding:10px 8px;color:#64748b;font-size:11px;font-weight:600;text-transform:uppercase;">Tender</th>
                <th align="left" style="padding:10px 8px;color:#64748b;font-size:11px;font-weight:600;text-transform:uppercase;">Category</th>
                <th align="left" style="padding:10px 8px;color:#64748b;font-size:11px;font-weight:600;text-transform:uppercase;">Deadline</th>
                <th align="left" style="padding:10px 8px;color:#64748b;font-size:11px;font-weight:600;text-transform:uppercase;">Links</th>
              </tr>
              {rows_html}
            </table>"""
            try:
                send_email(email, f"🚨 {len(new_tenders)} New Tender{'s' if len(new_tenders)>1 else ''} Match Your Niche — BIDORA", email_wrapper(user_name, content))
                print(f"  ✉️  New match alert → {email} ({len(new_tenders)} tenders)")
            except Exception as e:
                print(f"  ❌ Failed: {email}: {e}")

        # ── Alert 2: Saved tenders closing soon ──────────────────────────────
        saved = supabase.table("saved_tenders").select("tender_id").eq("user_id", user_id).execute().data
        saved_ids = [s["tender_id"] for s in saved]

        for tid in saved_ids:
            tender_res = supabase.table("tenders").select("*").eq("tender_id", tid).execute().data
            if not tender_res:
                continue
            t = tender_res[0]
            ending = t.get("calculated_ending_date")
            if not ending:
                continue
            deadline = datetime.fromisoformat(ending.replace("Z",""))

            for alert_type, threshold, label in [
                ("deadline_24h", cutoff_24h, "⚠️ Closing in 24 hours"),
                ("deadline_3d",  cutoff_3d,  "⏳ Closing in 3 days"),
            ]:
                if deadline <= threshold:
                    existing = supabase.table("alert_log").select("id") \
                        .eq("user_id", user_id).eq("tender_id", tid).eq("alert_type", alert_type) \
                        .execute().data
                    if not existing:
                        content = f"""
                        <p style="color:#94a3b8;margin:0 0 16px;">
                          A tender you saved on BIDORA is <strong style="color:#f59e0b;">{label.lower()}</strong>:
                        </p>
                        <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #1e2d45;border-radius:10px;overflow:hidden;">
                          <tr style="background:#1a2236;">{tender_row_html(t)}</tr>
                        </table>
                        <p style="color:#94a3b8;margin:16px 0 0;font-size:13px;">
                          Don't miss this opportunity — submit your bid before the deadline.
                        </p>"""
                        try:
                            send_email(email, f"{label} — {t.get('title','')[:60]} | BIDORA", email_wrapper(user_name, content))
                            supabase.table("alert_log").insert({
                                "user_id": user_id, "tender_id": tid, "alert_type": alert_type
                            }).execute()
                            print(f"  ✉️  {alert_type} → {email} for {tid}")
                        except Exception as e:
                            print(f"  ❌ Failed: {e}")

    print("✅ BIDORA alert sending complete.")

if __name__ == "__main__":
    run_alerts()