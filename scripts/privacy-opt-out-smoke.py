"""Read-only production smoke test for the Shopify data sharing opt-out page.

The current PR has no Oxygen Preview URL. This script tests the live site's
existing behavior, never clicks an opt-out/consent submit button, and does
not assert the unreleased branch's browser behavior.
"""
import json
import os
from pathlib import Path
from playwright.sync_api import sync_playwright

URL = "https://render-lab.org/pages/data-sharing-opt-out"
HOME = "https://render-lab.org/"
report = {"target": URL, "checks": {}, "warnings": []}

def check_page(page, label, navigate):
    messages = []
    errors = []
    failed_requests = []
    responses = []
    page.on("console", lambda msg: messages.append(msg.text) if msg.type == "error" else None)
    page.on("pageerror", lambda error: errors.append(str(error)))
    page.on("requestfailed", lambda req: failed_requests.append({
        "url": req.url.split("?")[0], "failure": req.failure
    }))
    page.on("response", lambda resp: responses.append({
        "url": resp.url.split("?")[0], "status": resp.status
    }) if "hcaptcha" in resp.url or "data-sale-opt-out" in resp.url else None)
    response = navigate()
    page.wait_for_timeout(7000)
    data = page.evaluate("""() => {
      const formContainer = document.querySelector('#pc--optOutFormContainer');
      const scripts = Array.from(document.scripts)
        .map(s => s.src)
        .filter(src => src.includes('data-sale-opt-out') || src.includes('hcaptcha'));
      return {
        url: location.href,
        title: document.title,
        containerPresent: !!formContainer,
        containerChildElements: formContainer?.children.length ?? -1,
        containerText: (formContainer?.innerText || '').slice(0, 600),
        formElementCount: formContainer?.querySelectorAll('form').length || 0,
        inputCount: formContainer?.querySelectorAll('input').length || 0,
        buttonCount: formContainer?.querySelectorAll('button').length || 0,
        scripts,
        bodyHasNotApplicable: document.body.innerText.includes('not applicable')
      };
    }""")
    data.update({
        "initialHttpStatus": response.status if response else None,
        "csp": response.headers.get("content-security-policy", "") if response else "",
        "consoleErrors": messages[:12], "pageErrors": errors[:12],
        "failedRequests": failed_requests[:15], "targetScriptResponses": responses[:12],
    })
    report["checks"][label] = data
    page.screenshot(path=f"privacy-{label}.png", full_page=True)

def simulate_scoped_hcaptcha_allowlist(route):
    """Browser-only CSP simulation; does not change the live HTTP server."""
    response = route.fetch()
    headers = dict(response.headers)
    csp = headers.get("content-security-policy", "")
    origins = "https://hcaptcha.com https://*.hcaptcha.com"
    for directive in ("default-src", "style-src", "connect-src"):
        csp = csp.replace(directive + " ", directive + " " + origins + " ", 1)
    headers["content-security-policy"] = csp
    route.fulfill(response=response, headers=headers)

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    for label in ("direct-load", "footer-navigation", "direct-load-csp-simulation"):
        context = browser.new_context(viewport={"width": 1280, "height": 900}, locale="en-US")
        page = context.new_page()
        try:
            if label == "direct-load-csp-simulation":
                # Simulate the proposed narrow allowlist on this one document.
                # This is not a real PR Preview deployment.
                page.route(URL, simulate_scoped_hcaptcha_allowlist)
                check_page(page, label, lambda: page.goto(URL, wait_until="domcontentloaded", timeout=40000))
            elif label == "direct-load":
                check_page(page, label, lambda: page.goto(URL, wait_until="domcontentloaded", timeout=40000))
            else:
                home_response = page.goto(HOME, wait_until="domcontentloaded", timeout=40000)
                page.locator('a[href*="/pages/data-sharing-opt-out"]').first.wait_for(timeout=25000)
                page.locator('a[href*="/pages/data-sharing-opt-out"]').first.click(timeout=25000)
                page.wait_for_url("**/pages/data-sharing-opt-out", timeout=30000)
                check_page(page, label, lambda: None)
                report["checks"][label]["homeHttpStatus"] = home_response.status if home_response else None
        except Exception as exc:
            report["checks"][label] = {"error": type(exc).__name__ + ": " + str(exc)[:650]}
            report["warnings"].append(f"{label}: navigation or inspection failed")
        finally:
            context.close()
    browser.close()

Path("privacy-smoke-results.json").write_text(json.dumps(report, indent=2))
print(json.dumps(report, indent=2))
if "error" in report["checks"].get("direct-load", {}):
    raise SystemExit("Direct-load browser check failed")
if not report["checks"]["direct-load"].get("containerPresent"):
    raise SystemExit("Direct-load privacy opt-out container missing")

simulation = report["checks"].get("direct-load-csp-simulation", {})
if simulation.get("error"):
    raise SystemExit("The CSP allowlist simulation could not be tested")
if not simulation.get("containerPresent") or simulation.get("formElementCount", 0) < 1:
    raise SystemExit("Simulated CSP browser visit did not initialize the form")
if any("hcaptcha" in m.lower() and "content security policy" in m.lower()
       for m in simulation.get("consoleErrors", [])):
    raise SystemExit("hCaptcha CSP violations persist with simulated allowlist")

# On a successful Oxygen Production deployment, assert that the actual live
# response has the changes. PR runs intentionally observe the old baseline.
if os.environ.get("EXPECT_DEPLOYED_FIX") == "true":
    direct = report["checks"].get("direct-load", {})
    footer = report["checks"].get("footer-navigation", {})
    if footer.get("formElementCount", 0) < 1:
        raise SystemExit("Production footer navigation still leaves opt-out form empty")
    if any("hcaptcha" in m.lower() and "content security policy" in m.lower()
           for m in direct.get("consoleErrors", [])):
        raise SystemExit("Production still blocks hCaptcha via CSP")
    if not any("js.hcaptcha.com" in r.get("url", "") and r.get("status") == 200
               for r in direct.get("targetScriptResponses", [])):
        raise SystemExit("Production hCaptcha script did not return HTTP 200")
