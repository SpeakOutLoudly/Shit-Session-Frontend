#!/usr/bin/env python3
"""
模块一：登录/开始页
"""
import re
import pytest
from playwright.sync_api import Page, expect

BASE_URL = "http://localhost:3000"


class TestLogin:

    def test_normal_login(self, page: Page):
        """#1 — 正常登录：输入姓名后跳转到工作台"""
        page.goto(f"{BASE_URL}/login")
        page.fill("input", "张三")
        page.click("button:has-text('进入会议室')")
        page.wait_for_url("**/dashboard")
        # 顶栏显示用户名
        expect(page.locator("text=张三").first).to_be_visible()

    def test_empty_name_disabled(self, page: Page):
        """#2 — 空姓名时按钮禁用"""
        page.goto(f"{BASE_URL}/login")
        btn = page.locator("button:has-text('进入会议室')")
        expect(btn).to_be_disabled()

    def test_enter_key_login(self, page: Page):
        """#3 — 回车键登录"""
        page.goto(f"{BASE_URL}/login")
        page.fill("input", "李四")
        page.press("input", "Enter")
        page.wait_for_url("**/dashboard")
        expect(page.locator("text=李四").first).to_be_visible()
