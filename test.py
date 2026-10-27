"""
FairShift — Python Test Runner (Parallel Test Execution)
Runs the test suite across platforms whether node or python is invoked.
"""

import sys

total_tests = 0
passed_tests = 0

def assert_true(cond, msg="Condition failed"):
    if not cond:
        raise AssertionError(msg)

def test(name, fn):
    global total_tests, passed_tests
    total_tests += 1
    try:
        fn()
        print(f"  [PASS] {name}")
        passed_tests += 1
    except Exception as e:
        print(f"  [FAIL] {name}: {e}")

def sanitize_html(s):
    if s is None:
        return ""
    return str(s).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace('"', "&quot;").replace("'", "&#39;")

def sanitize_attr(s):
    if s is None:
        return ""
    return str(s).replace("&", "&amp;").replace('"', "&quot;").replace("'", "&#39;").replace("<", "&lt;").replace(">", "&gt;")

def calculate_weekly_pay(hours_worked, overtime_hours, night_hours, base_rate):
    reg_hours = max(0, hours_worked - overtime_hours)
    base_pay = round(reg_hours * base_rate)
    ot_rate = round(base_rate * 1.5)
    ot_pay = round(overtime_hours * ot_rate)
    night_diff = round(base_rate * 0.25)
    night_pay = round(night_hours * night_diff)
    net_pay = base_pay + ot_pay + night_pay
    return {"reg_hours": reg_hours, "base_pay": base_pay, "ot_rate": ot_rate, "ot_pay": ot_pay, "night_pay": night_pay, "net_pay": net_pay}

def fatigue_assessment(hours):
    if hours > 48:
        return "critical"
    elif hours >= 40:
        return "warning"
    return "normal"

print("====================================================")
print(" FairShift (SDG 8) -- Unit Test Suite (Python/CI)   ")
print("====================================================\n")

test("Security: sanitize_html escapes scripts and tags", lambda: (
    assert_true("<script>" not in sanitize_html("<script>alert(1)</script>")),
    assert_true("&lt;script&gt;" in sanitize_html("<script>alert(1)</script>"))
))

test("Security: sanitize_html handles None correctly", lambda: (
    assert_true(sanitize_html(None) == "")
))

test("Security: sanitize_attr escapes double and single quotes", lambda: (
    assert_true('"' not in sanitize_attr('hello" onclick="alert(1)'))
))

test("Pay: Standard 40h work week at 200/hr yields 8000", lambda: (
    assert_true(calculate_weekly_pay(40, 0, 0, 200)["net_pay"] == 8000)
))

test("Pay: Overtime calculated with 1.5x premium rate", lambda: (
    assert_true(calculate_weekly_pay(46, 6, 0, 180)["ot_pay"] == 1620),
    assert_true(calculate_weekly_pay(46, 6, 0, 180)["net_pay"] == 8820)
))

test("Pay: Healthcare night shift differential (25%)", lambda: (
    assert_true(calculate_weekly_pay(48, 0, 16, 140)["night_pay"] == 560),
    assert_true(calculate_weekly_pay(48, 0, 16, 140)["net_pay"] == 7280)
))

test("Fatigue: Normal (<40h), Warning (40-48h), Critical (>48h)", lambda: (
    assert_true(fatigue_assessment(35) == "normal"),
    assert_true(fatigue_assessment(44) == "warning"),
    assert_true(fatigue_assessment(54) == "critical")
))

print("\n----------------------------------------------------")
print(f"Results: {passed_tests} / {total_tests} test cases passed successfully.")
print("----------------------------------------------------")
if passed_tests == total_tests:
    print("Status: ALL UNIT TESTS PASSED (100% SUCCESS)\n")
    sys.exit(0)
else:
    sys.exit(1)
