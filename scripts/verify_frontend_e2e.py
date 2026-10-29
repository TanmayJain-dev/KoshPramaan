import sys
import os
import time
import json
import urllib.request
from playwright.sync_api import sync_playwright

BASE_URL = "http://127.0.0.1:5173"
API_URL = "http://127.0.0.1:8000"
SCREENSHOTS_DIR = os.path.abspath("screenshots")
os.makedirs(SCREENSHOTS_DIR, exist_ok=True)


def get_admin_jwt() -> str:
    login_data = json.dumps({"username": "aicte_admin"}).encode("utf-8")
    req = urllib.request.Request(
        f"{API_URL}/auth/login",
        data=login_data,
        headers={"Content-Type": "application/json"},
        method="POST"
    )
    with urllib.request.urlopen(req) as resp:
        body = json.loads(resp.read().decode("utf-8"))
        return body["access_token"]


def reset_db_via_api():
    token = get_admin_jwt()
    req = urllib.request.Request(
        f"{API_URL}/api/demo/reset",
        data=b"",
        headers={"Authorization": f"Bearer {token}"},
        method="POST"
    )
    with urllib.request.urlopen(req) as resp:
        assert resp.status == 200, f"Failed to reset demo DB: status {resp.status}"
    print("[+] Database reset to clean Day 0 baseline via API with valid JWT.")


def run():
    print(f"[*] Starting Strict Frontend E2E & Browser Verification on {BASE_URL}")
    console_errors = []
    failed_requests = []

    # Reset DB at start
    reset_db_via_api()

    with sync_playwright() as p:
        browser = p.chromium.launch(
            headless=True,
            args=["--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu"]
        )
        context = browser.new_context(
            viewport={"width": 1366, "height": 768},
            user_agent="Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        )
        page = context.new_page()
        page.set_default_navigation_timeout(60000)
        page.set_default_timeout(30000)

        # Listen for console messages
        def on_console(msg):
            if msg.type == "error":
                text = msg.text
                if "favicon.ico" not in text and "ERR_NETWORK_CHANGED" not in text:
                    console_errors.append(text)
                    print(f"[-] Console Error: {text}")

        # Listen for failed HTTP requests
        def on_response(res):
            if res.status >= 400:
                if "/api/" in res.url:
                    failed_requests.append(f"{res.status} {res.url}")
                    print(f"[-] HTTP Error: {res.status} on {res.url}")

        page.on("console", on_console)
        page.on("response", on_response)

        # -------------------------------------------------------------
        # STEP 1: Verify Login Page
        # -------------------------------------------------------------
        print("\n=== STEP 1: Verifying Login Page & Compliance Footers ===")
        page.goto(BASE_URL, wait_until="load", timeout=60000)
        time.sleep(1)

        # Clear stored tokens to display Login Screen cleanly
        page.evaluate("() => { localStorage.clear(); sessionStorage.clear(); }")
        page.goto(BASE_URL, wait_until="domcontentloaded")
        time.sleep(1)

        # Assert Login Page Content
        page.wait_for_selector("text=KoshPramaan (कोष-प्रमाण)", state="visible", timeout=10000)
        content = page.content()
        assert "Demo authentication (no real credentials)" in content, "Login page must display demo note"
        assert "Demo data, mocked integrations" in content, "Footer honesty badge must display on Login page"

        login_screenshot = os.path.join(SCREENSHOTS_DIR, "page_login.png")
        page.screenshot(path=login_screenshot, full_page=True)
        print(f"[+] Login screen captured: {login_screenshot}")

        # -------------------------------------------------------------
        # STEP 2: Visit Every Persona and Take Screenshots
        # -------------------------------------------------------------
        print("\n=== STEP 2: Visiting and Capturing All 6 Personas ===")
        personas = [
            ("maker_apex", "Aakash Verma", "INSTITUTION_MAKER"),
            ("checker_apex", "Dr. Sunita Rao", "INSTITUTION_CHECKER"),
            ("ro_north", "Dr. Vikram Seth", "REGIONAL_OFFICER"),
            ("bank_sbi", "Rajiv Sharma", "BANK_VERIFIER"),
            ("scrutiny_officer", "Arjun Nair", "SCRUTINY_OFFICER"),
            ("aicte_admin", "Prof. Anil Sahasrabudhe", "AICTE_ADMIN")
        ]

        def switch_to_persona(display_name, role_code, username=None):
            # Check if switch role button is present in header
            switch_btn = page.locator("[data-testid='switch-role-btn']")
            if switch_btn.count() > 0 and switch_btn.first.is_visible():
                switch_btn.first.click()
                time.sleep(0.3)
                if username and page.locator(f"[data-testid='persona-btn-{username}']").count() > 0:
                    modal_card = page.locator(f"[data-testid='persona-btn-{username}']").first
                else:
                    modal_card = page.locator(f".fixed >> button:has-text('{display_name}')").first
                modal_card.wait_for(state="visible", timeout=10000)
                modal_card.click()
            else:
                if username and page.locator(f"[data-testid='login-persona-{username}']").count() > 0:
                    card = page.locator(f"[data-testid='login-persona-{username}']").first
                else:
                    card = page.locator(f"button:has-text('{display_name}')").first
                card.wait_for(state="visible", timeout=10000)
                card.click()

            # Strict single-wait on unique user name & role in header (no retry loop)
            page.locator("[data-testid='header-user-name']").filter(has_text=display_name).wait_for(state="visible", timeout=10000)
            page.locator("[data-testid='header-user-role']").filter(has_text=role_code).wait_for(state="visible", timeout=10000)
            time.sleep(0.5)

        for username, display_name, role_code in personas:
            print(f"[*] Switching to Persona: {display_name} ({role_code})")
            switch_to_persona(display_name, role_code, username)

            # Capture role screenshot
            role_screenshot = os.path.join(SCREENSHOTS_DIR, f"role_{username}.png")
            page.screenshot(path=role_screenshot, full_page=True)
            print(f"[+] Role screenshot saved: {role_screenshot}")

        # -------------------------------------------------------------
        # STEP 3: Automated Full Demo Flow (docs/DEMO_SCRIPT.md)
        # -------------------------------------------------------------
        print("\n=== STEP 3: Executing Full End-to-End Demo Flow ===")

        # --- 3.1: Maker: Create Draft FDR and Submit to Checker ---
        print("\n[3.1] Maker: Creating draft claim and submitting to Checker")
        switch_to_persona("Aakash Verma", "INSTITUTION_MAKER", "maker_apex")
        time.sleep(1)

        # Click 'New FDR Claim' using data-testid
        new_claim_btn = page.locator("[data-testid='new-fdr-claim-btn']").first
        new_claim_btn.wait_for(state="visible", timeout=10000)
        new_claim_btn.click()
        time.sleep(1)

        # Receipt Number
        receipt_input = page.locator("input[placeholder='e.g. SBI-DEL-2026-9999']").first
        receipt_input.wait_for(state="visible", timeout=10000)
        receipt_input.fill("SBI-DEL-2026-9999")

        # Save Draft Claim
        save_btn = page.locator("button:has-text('Save Draft Claim')").first
        save_btn.wait_for(state="visible", timeout=10000)
        save_btn.click()
        time.sleep(2)

        # Assert new draft row is visible
        page.locator("text=SBI-DEL-2026-9999").first.wait_for(state="visible", timeout=10000)
        maker_row = page.locator("tr:has-text('SBI-DEL-2026-9999')").first
        maker_row.wait_for(state="visible", timeout=10000)

        # Submit to Checker
        submit_btn = maker_row.locator("button:has-text('Submit to Checker')").first
        submit_btn.wait_for(state="visible", timeout=10000)
        submit_btn.click()
        page.locator("text=Under Checker Review").first.wait_for(state="visible", timeout=10000)

        demo_1_screenshot = os.path.join(SCREENSHOTS_DIR, "demo_01_maker_submitted.png")
        page.screenshot(path=demo_1_screenshot, full_page=True)
        print(f"[+] Demo Step 1 screenshot: {demo_1_screenshot}")

        # --- 3.2: Checker: Review & Approve (Maker != Checker) ---
        print("\n[3.2] Checker: Verifying Maker submission with segregation check")
        switch_to_persona("Dr. Sunita Rao", "INSTITUTION_CHECKER", "checker_apex")
        time.sleep(1)

        # Verify claim in Pending Verification Inbox
        page.locator("text=SBI-DEL-2026-9999").first.wait_for(state="visible", timeout=10000)

        # Click Review & Verify
        review_btn = page.locator("button:has-text('Review & Verify')").first
        review_btn.wait_for(state="visible", timeout=10000)
        review_btn.click()
        time.sleep(1)

        # Assert segregation check passed indicator
        page.locator("text=Segregation Check Passed").first.wait_for(state="visible", timeout=10000)

        # Fill remarks & approve using data-testid
        textarea = page.locator("textarea").first
        textarea.wait_for(state="visible", timeout=10000)
        textarea.fill("Verified lien clause and bank certificate.")
        approve_btn = page.locator("[data-testid='approve-submission-btn']").first
        approve_btn.wait_for(state="visible", timeout=10000)
        approve_btn.click()
        time.sleep(2)

        demo_2_screenshot = os.path.join(SCREENSHOTS_DIR, "demo_02_checker_approved.png")
        page.screenshot(path=demo_2_screenshot, full_page=True)
        print(f"[+] Demo Step 2 screenshot: {demo_2_screenshot}")

        # --- 3.3: Regional Officer: Review & Sanction ---
        print("\n[3.3] Regional Officer: Sanctioning claim and viewing decay watchlist")
        switch_to_persona("Dr. Vikram Seth", "REGIONAL_OFFICER", "ro_north")
        time.sleep(1)

        # Locate claim in queue and Sanction strictly
        claim_card = page.locator("text=SBI-DEL-2026-9999").first
        claim_card.wait_for(state="visible", timeout=10000)
        sanction_btn = page.locator("button:has-text('Sanction')").first
        sanction_btn.wait_for(state="visible", timeout=10000)
        sanction_btn.click()
        time.sleep(1)
        confirm_btn = page.locator("[data-testid='confirm-decision-btn']").first
        confirm_btn.wait_for(state="visible", timeout=10000)
        confirm_btn.click()
        confirm_btn.wait_for(state="hidden", timeout=10000)
        time.sleep(1)

        # Click Proof-Score Decay Watchlist Tab
        watchlist_tab = page.locator("[data-testid='decay-watchlist-tab']").first
        watchlist_tab.wait_for(state="visible", timeout=10000)
        watchlist_tab.click()
        page.locator("text=Regional Proof-Score Decay Watchlist").first.wait_for(state="visible", timeout=10000)

        demo_3_screenshot = os.path.join(SCREENSHOTS_DIR, "demo_03_ro_sanctioned.png")
        page.screenshot(path=demo_3_screenshot, full_page=True)
        print(f"[+] Demo Step 3 screenshot: {demo_3_screenshot}")

        # --- 3.4: Bank Verifier: CBS Attestation ---
        print("\n[3.4] Bank Verifier: Confirming CBS match")
        switch_to_persona("Rajiv Sharma", "BANK_VERIFIER", "bank_sbi")
        time.sleep(1)

        page.locator("text=State Bank of India — CBS Attestation Desk").first.wait_for(state="visible", timeout=10000)
        cbs_btn = page.locator("button:has-text('Confirm Match (CBS)')").first
        cbs_btn.wait_for(state="visible", timeout=10000)
        cbs_btn.click()
        time.sleep(2)

        # Strong assertion: bank step must show FDR status change to CBS Confirmed
        cbs_confirmed_badge = page.locator("text=CBS Confirmed").first
        cbs_confirmed_badge.wait_for(state="visible", timeout=10000)
        print("[+] Strong assertion PASSED: Bank step shows status 'CBS Confirmed'")

        demo_4_screenshot = os.path.join(SCREENSHOTS_DIR, "demo_04_bank_confirmed.png")
        page.screenshot(path=demo_4_screenshot, full_page=True)
        print(f"[+] Demo Step 4 screenshot: {demo_4_screenshot}")

        # --- 3.5: Scrutiny Officer: Possible Duplicate Risk Signals & Liabilities ---
        print("\n[3.5] Scrutiny Officer: Possible Duplicate Detector and Liabilities")
        switch_to_persona("Arjun Nair", "SCRUTINY_OFFICER", "scrutiny_officer")
        time.sleep(1)

        # Assert Possible Duplicate Risk Signal
        page.locator("[data-testid='duplicate-signals-tab']").first.click()
        page.locator("text=POSSIBLE_DUPLICATE_RISK_SIGNAL").first.wait_for(state="visible", timeout=10000)
        page.locator("text=Risk signal, needs officer review").first.wait_for(state="visible", timeout=10000)
        page.locator("text=Apex Institute of Technology").first.wait_for(state="visible", timeout=10000)
        page.locator("text=Bharati Polytechnic").first.wait_for(state="visible", timeout=10000)

        # Click Grievance & Liabilities Ledger tab using data-testid
        page.locator("[data-testid='liabilities-ledger-tab']").first.click()
        page.locator("text=LIAB-001").first.wait_for(state="visible", timeout=10000)

        demo_5_screenshot = os.path.join(SCREENSHOTS_DIR, "demo_05_scrutiny_signals.png")
        page.screenshot(path=demo_5_screenshot, full_page=True)
        print(f"[+] Demo Step 5 screenshot: {demo_5_screenshot}")

        # --- 3.6: AICTE HQ Admin: Tamper simulation & Reset ---
        print("\n[3.6] AICTE Admin: Tamper demonstration and full reset")
        switch_to_persona("Prof. Anil Sahasrabudhe", "AICTE_ADMIN", "aicte_admin")
        time.sleep(1)

        # Trigger Malicious Tamper using data-testid
        tamper_btn = page.locator("[data-testid='simulate-tamper-btn']").first
        tamper_btn.wait_for(state="visible", timeout=10000)
        tamper_btn.click()
        page.locator("text=TAMPER DETECTED!").first.wait_for(state="visible", timeout=10000)

        # Reset Entire Demo Database using data-testid
        reset_btn = page.locator("[data-testid='reset-database-btn']").first
        reset_btn.wait_for(state="visible", timeout=15000)
        reset_btn.click()
        page.locator("text=Chain Intact").first.wait_for(state="visible", timeout=30000)

        demo_6_screenshot = os.path.join(SCREENSHOTS_DIR, "demo_06_admin_tamper_and_reset.png")
        page.screenshot(path=demo_6_screenshot, full_page=True)
        print(f"[+] Demo Step 6 screenshot: {demo_6_screenshot}")

        # -------------------------------------------------------------
        # STEP 4: Day 200 Scenario Verification
        # -------------------------------------------------------------
        print("\n=== STEP 4: Executing Day 200 Advanced Lifecycle Scenario ===")

        # Advance clock to Day 200 via API using Admin JWT
        admin_jwt = get_admin_jwt()
        adv_req = urllib.request.Request(
            f"{API_URL}/api/clock/advance",
            data=json.dumps({"days": 200}).encode("utf-8"),
            headers={"Authorization": f"Bearer {admin_jwt}", "Content-Type": "application/json"},
            method="POST"
        )
        with urllib.request.urlopen(adv_req) as adv_resp:
            adv_data = json.loads(adv_resp.read().decode("utf-8"))
            print(f"[+] Clock advanced to Day {adv_data['days_elapsed']} ({adv_data['current_time_iso']})")

        # Reload page to refresh query cache
        page.reload(wait_until="domcontentloaded")
        time.sleep(1.5)

        # 4.1: Regional Officer Day 200: FDR-APEX-003 early closure appears on Decay Watchlist with dropped score
        print("\n[4.1] Regional Officer: Checking Day 200 Decay Watchlist for FDR-APEX-003")
        switch_to_persona("Dr. Vikram Seth", "REGIONAL_OFFICER", "ro_north")
        time.sleep(1)
        ro_watchlist_tab = page.locator("[data-testid='decay-watchlist-tab']").first
        ro_watchlist_tab.wait_for(state="visible", timeout=10000)
        ro_watchlist_tab.click()
        time.sleep(1)

        # Assert FDR-APEX-003 appears with dropped score / Closed Early
        page.locator("text=FDR-APEX-003").first.wait_for(state="visible", timeout=10000)
        page.locator("text=Closed Early").first.wait_for(state="visible", timeout=10000)
        print("[+] RO assertion PASSED: FDR-APEX-003 early closure visible in Regional Decay Watchlist")

        # 4.2: Bank Verifier (PNB) Day 200: FDR-APEX-003 is Closed Early, FDR-APEX-002 is Discrepancy Locked
        print("\n[4.2] Bank Verifier (PNB): Checking Day 200 status on FDR-APEX-003 and FDR-APEX-002")
        switch_to_persona("Priya Patel", "BANK_VERIFIER", "bank_pnb")
        time.sleep(1)
        page.locator("text=Punjab National Bank — CBS Attestation Desk").first.wait_for(state="visible", timeout=10000)
        
        # FDR-APEX-003 appears with Closed Early
        fdr3_pnb = page.locator("div:has-text('FDR-APEX-003')").first
        fdr3_pnb.wait_for(state="visible", timeout=10000)
        page.locator("text=Closed Early").first.wait_for(state="visible", timeout=10000)

        # FDR-APEX-002 discrepancy lock is visible
        fdr2_pnb = page.locator("div:has-text('FDR-APEX-002')").first
        fdr2_pnb.wait_for(state="visible", timeout=10000)
        page.locator("text=Discrepancy Locked").first.wait_for(state="visible", timeout=10000)
        print("[+] Bank Verifier assertion PASSED: FDR-APEX-003 is Closed Early, FDR-APEX-002 is Discrepancy Locked")

        # 4.3: Scrutiny Officer Day 200: FDR-APEX-003 appears in Decay & Early-Closure Watchlist
        print("\n[4.3] Scrutiny Officer: Checking Day 200 Early Closure on National Watchlist")
        switch_to_persona("Arjun Nair", "SCRUTINY_OFFICER", "scrutiny_officer")
        time.sleep(1)
        scrutiny_watchlist_tab = page.locator("button:has-text('Decay & Early-Closure Watchlist')").first
        scrutiny_watchlist_tab.wait_for(state="visible", timeout=10000)
        scrutiny_watchlist_tab.click()
        time.sleep(1)

        page.locator("text=FDR-APEX-003").first.wait_for(state="visible", timeout=10000)
        page.locator("text=Closed Early").first.wait_for(state="visible", timeout=10000)
        print("[+] Scrutiny Officer assertion PASSED: FDR-APEX-003 visible as Closed Early on National Watchlist")

        # 4.4: Maker (Apex) Day 200: FDR-APEX-002 discrepancy lock visible; CANNOT see FDR-BHARATI-001
        print("\n[4.4] Institution Maker: Checking Discrepancy Lock and strict institutional isolation")
        switch_to_persona("Aakash Verma", "INSTITUTION_MAKER", "maker_apex")
        time.sleep(1)
        
        # FDR-APEX-002 discrepancy lock is visible
        page.locator("text=ATTENTION: Bank Discrepancy Lock Active").first.wait_for(state="visible", timeout=10000)
        page.locator("text=FDR-APEX-002").first.wait_for(state="visible", timeout=10000)
        
        # Maker CANNOT see FDR-BHARATI-001 (cross-institution data isolation)
        bharati_fdr_count = page.locator("text=FDR-BHARATI-001").count()
        assert bharati_fdr_count == 0, f"Scope leak: Maker from Apex can see FDR-BHARATI-001! (count={bharati_fdr_count})"
        print("[+] Maker assertion PASSED: Discrepancy lock banner visible, FDR-BHARATI-001 strictly isolated (count=0)")

        # -------------------------------------------------------------
        # STEP 5: Final Result & Console / HTTP Error Assertions
        # -------------------------------------------------------------
        print("\n=== VERIFICATION RESULTS SUMMARY ===")
        print(f"Total Console Errors Recorded: {len(console_errors)}")
        for err in console_errors:
            print(f"  - {err}")
        print(f"Total Failed HTTP API Requests: {len(failed_requests)}")
        for req_err in failed_requests:
            print(f"  - {req_err}")

        assert len(console_errors) == 0, f"Expected 0 console errors, got {len(console_errors)}"
        assert len(failed_requests) == 0, f"Expected 0 HTTP API failures, got {len(failed_requests)}"

        browser.close()
        print("\n[✓] STRICT E2E WITH DAY 200 SCENARIO COMPLETED SUCCESSFULLY!")


if __name__ == "__main__":
    run()
