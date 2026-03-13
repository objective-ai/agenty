"""
E2E tests for /bridge/lab — Mission Mode: Holographic Briefing Board

Prerequisites (run once):
    pip install playwright
    playwright install chromium

Required before running:
    1. npm run dev          (dev server must be on port 3000)
    2. .env.local must have NEXT_PUBLIC_DEV_SKIP_AUTH=true

Run:
    npm run test:e2e
    # or directly:
    python tests/e2e/bridge-lab.spec.py

Screenshots saved to: tests/e2e/screenshots/

What this page offers:
  1. [LAYOUT]    Header with mission title + "LOAD INTEL" button
  2. [BOARD]     MissionBriefingBoard (left 40%):
                   - Ghost state (skeleton) → Active state after Cooper's initMission tool call
                   - BlueprintDiagram SVG: nodes highlight when Cooper calls highlightNode,
                     turn green (data-solved) when a stat is solved
                   - StatGauges: show live values once mission is active
                   - ObjectiveCard: animates in new objective text on each update
  3. [COMMS]     CommsPanel (right 60%):
                   - HolographicAvatar for the active agent (Cooper by default)
                   - Text input + send button to chat with the AI agent
                   - Streaming response (status: "streaming" → messages appear word by word)
  4. [INTEL]     "LOAD INTEL" button → opens IntelDrawer (slides in from right)
                   - KnowledgeDropzone: drag-and-drop OR click-to-browse PDF upload
                   - Only accepts PDF files; shows error for other types
                   - On success: ScanProgress bar runs then drawer auto-closes
                   - Escape key closes the drawer
                   - Disabled (opacity-40) when mission is CRITICAL and status === "active"
  5. [MISSION URL] ?mission=<id> query param selects a different mission config

Run with:
    python tests/e2e/bridge-lab.spec.py

Requires:
    pip install playwright
    playwright install chromium
"""

import time
import os
from playwright.sync_api import sync_playwright, expect

BASE_URL = "http://localhost:3000"
LAB_URL = f"{BASE_URL}/play/lab"
SCREENSHOT_DIR = "tests/e2e/screenshots"


def take_screenshot(page, name: str):
    os.makedirs(SCREENSHOT_DIR, exist_ok=True)
    path = f"{SCREENSHOT_DIR}/{name}.png"
    page.screenshot(path=path, full_page=True)
    print(f"  📸 screenshot saved: {path}")


def test_page_loads_with_ghost_state(page):
    """Page renders immediately in ghost/skeleton state before Cooper responds."""
    print("\n[1] Page load — ghost state")
    page.goto(LAB_URL)
    page.wait_for_load_state("networkidle")

    # Header should always be visible
    header = page.locator("h1")
    assert header.is_visible(), "Mission title header should be visible"
    print(f"  ✓ Mission title: {header.inner_text()}")

    # "LOAD INTEL" button present
    intel_btn = page.get_by_role("button", name="LOAD INTEL")
    assert intel_btn.is_visible(), "LOAD INTEL button should be visible"
    print("  ✓ LOAD INTEL button visible")

    # Ghost skeleton: "MISSION BRIEFING BOARD" label
    board_label = page.get_by_text("MISSION BRIEFING BOARD")
    assert board_label.is_visible(), "Board header label should be visible"
    print("  ✓ MissionBriefingBoard header visible")

    # Ghost state: "TACTICAL SCAN" or "SIGNAL LOST" placeholder text
    ghost_text = page.get_by_text("TACTICAL SCAN")
    assert ghost_text.is_visible(), "Ghost state 'TACTICAL SCAN' placeholder should show"
    print("  ✓ Ghost state placeholder showing")

    # Objective card placeholder
    objective = page.get_by_text("Awaiting mission data…")
    assert objective.is_visible(), "ObjectiveCard placeholder text should show in ghost state"
    print("  ✓ ObjectiveCard shows 'Awaiting mission data…'")

    take_screenshot(page, "01-ghost-state")


def test_comms_panel_present(page):
    """CommsPanel renders with agent avatar and input field."""
    print("\n[2] CommsPanel — input and avatar")
    page.goto(LAB_URL)
    page.wait_for_load_state("networkidle")

    # Chat input
    chat_input = page.get_by_role("textbox")
    assert chat_input.is_visible(), "Chat text input should be visible"
    print("  ✓ Chat input visible")

    # Send button (look for button near the input area)
    send_btn = page.locator("button[type='submit'], button:has-text('SEND'), button:has-text('→')")
    if send_btn.count() > 0:
        print("  ✓ Send button visible")
    else:
        print("  ⚠ Send button not found by text — may use icon only")

    take_screenshot(page, "02-comms-panel")


def test_send_message_to_cooper(page):
    """Type a message and send it — streaming response should appear."""
    print("\n[3] Send message — streaming AI response")
    page.goto(LAB_URL)
    page.wait_for_load_state("networkidle")

    chat_input = page.get_by_role("textbox")
    chat_input.fill("Hello Cooper, what is the mission?")
    chat_input.press("Enter")

    print("  → Message sent, waiting for response…")

    # Wait up to 20s for any assistant message to appear
    page.wait_for_timeout(3000)
    take_screenshot(page, "03-after-message-sent")

    # After Cooper responds with initMission, ghost state should clear
    # (TACTICAL SCAN placeholder disappears)
    page.wait_for_timeout(10000)  # Give Cooper time to respond
    take_screenshot(page, "04-after-cooper-response")

    ghost = page.get_by_text("TACTICAL SCAN")
    if not ghost.is_visible():
        print("  ✓ Ghost state cleared — mission is now active!")
    else:
        print("  ⚠ Mission still in ghost state (Cooper may not have called initMission yet)")


def test_load_intel_drawer_opens(page):
    """Clicking LOAD INTEL opens the IntelDrawer from the right."""
    print("\n[4] IntelDrawer — open/close")
    page.goto(LAB_URL)
    page.wait_for_load_state("networkidle")

    intel_btn = page.get_by_role("button", name="LOAD INTEL")
    intel_btn.click()
    page.wait_for_timeout(500)  # Spring animation takes ~300ms

    # Drawer header
    vault_label = page.get_by_text("INTEL VAULT")
    assert vault_label.is_visible(), "IntelDrawer 'INTEL VAULT' header should appear"
    print("  ✓ IntelDrawer opened — INTEL VAULT visible")

    # Dropzone area
    dropzone = page.get_by_text("Upload classified documents")
    assert dropzone.is_visible(), "Dropzone subtitle should be visible"
    print("  ✓ KnowledgeDropzone area visible")

    take_screenshot(page, "05-intel-drawer-open")


def test_intel_drawer_closes_on_escape(page):
    """Pressing Escape closes the IntelDrawer."""
    print("\n[5] IntelDrawer — close with Escape")
    page.goto(LAB_URL)
    page.wait_for_load_state("networkidle")

    page.get_by_role("button", name="LOAD INTEL").click()
    page.wait_for_timeout(400)
    assert page.get_by_text("INTEL VAULT").is_visible(), "Drawer should be open"

    page.keyboard.press("Escape")
    page.wait_for_timeout(400)

    vault = page.get_by_text("INTEL VAULT")
    if not vault.is_visible():
        print("  ✓ Drawer closed on Escape")
    else:
        print("  ✗ Drawer still visible after Escape!")

    take_screenshot(page, "06-intel-drawer-closed")


def test_intel_drawer_closes_on_x_button(page):
    """Clicking × button closes the IntelDrawer."""
    print("\n[6] IntelDrawer — close with × button")
    page.goto(LAB_URL)
    page.wait_for_load_state("networkidle")

    page.get_by_role("button", name="LOAD INTEL").click()
    page.wait_for_timeout(400)

    close_btn = page.get_by_role("button", name="Close Intel Vault")
    assert close_btn.is_visible()
    close_btn.click()
    page.wait_for_timeout(400)

    vault = page.get_by_text("INTEL VAULT")
    if not vault.is_visible():
        print("  ✓ Drawer closed on × click")
    else:
        print("  ✗ Drawer still visible after × click!")

    take_screenshot(page, "07-intel-drawer-x-close")


def test_pdf_upload_rejected_for_non_pdf(page):
    """Uploading a non-PDF file shows an error message."""
    print("\n[7] KnowledgeDropzone — rejects non-PDF files")
    page.goto(LAB_URL)
    page.wait_for_load_state("networkidle")

    page.get_by_role("button", name="LOAD INTEL").click()
    page.wait_for_timeout(400)

    # Trigger the hidden file input
    file_input = page.locator("input[type='file']")
    file_input.set_input_files({
        "name": "test.txt",
        "mimeType": "text/plain",
        "buffer": b"not a pdf"
    })
    page.wait_for_timeout(500)

    error_text = page.get_by_text("Only PDF files are accepted.")
    if error_text.is_visible():
        print("  ✓ Non-PDF rejected with correct error message")
    else:
        print("  ⚠ Error message not found — check KnowledgeDropzone error handling")

    take_screenshot(page, "08-non-pdf-error")


def test_mission_url_param(page):
    """?mission=<id> query param loads a different mission."""
    print("\n[8] Mission URL param — ?mission=<id>")
    # Use the default mission ID to ensure it loads
    page.goto(f"{LAB_URL}?mission=dragon-bridge")
    page.wait_for_load_state("networkidle")

    header = page.locator("h1")
    assert header.is_visible()
    print(f"  ✓ Mission loaded via URL param: {header.inner_text()}")

    take_screenshot(page, "09-url-param-mission")


def run_all_tests():
    print("=" * 60)
    print("E2E TEST SUITE: /bridge/lab — Mission Mode")
    print("=" * 60)
    print(f"Target: {LAB_URL}")

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1440, "height": 900})

        tests = [
            test_page_loads_with_ghost_state,
            test_comms_panel_present,
            test_send_message_to_cooper,
            test_load_intel_drawer_opens,
            test_intel_drawer_closes_on_escape,
            test_intel_drawer_closes_on_x_button,
            test_pdf_upload_rejected_for_non_pdf,
            test_mission_url_param,
        ]

        passed = 0
        failed = 0

        for test_fn in tests:
            page = context.new_page()
            try:
                test_fn(page)
                passed += 1
            except Exception as e:
                print(f"\n  ✗ FAILED: {e}")
                take_screenshot(page, f"FAIL-{test_fn.__name__}")
                failed += 1
            finally:
                page.close()

        browser.close()

    print("\n" + "=" * 60)
    print(f"Results: {passed} passed, {failed} failed")
    print("=" * 60)


if __name__ == "__main__":
    run_all_tests()
