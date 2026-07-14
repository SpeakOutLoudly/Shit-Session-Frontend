#!/usr/bin/env python3
"""
模块八：导航与路由守卫
"""
import re
from playwright.sync_api import Page, expect

BASE_URL = "http://localhost:3000"


class TestNavigation:

    def test_unauthenticated_redirect(self, page: Page):
        """#33 — 未登录时直接访问页面跳转到 /login"""
        page.goto(f"{BASE_URL}/dashboard")
        page.wait_for_url("**/login")
        expect(page).to_have_url(re.compile(r"/login"))

    def test_root_redirect(self, page: Page, login_setup):
        """#34 — 已登录访问 / 重定向到 /dashboard"""
        page.goto(f"{BASE_URL}/")
        page.wait_for_url("**/dashboard")
        expect(page).to_have_url(re.compile(r"/dashboard"))
