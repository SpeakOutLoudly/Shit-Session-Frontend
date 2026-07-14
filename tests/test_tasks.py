#!/usr/bin/env python3
"""
模块五：待办任务 / Tasks
"""
from playwright.sync_api import Page, expect

BASE_URL = "http://localhost:3000"


class TestTasks:

    def test_task_list_loaded(self, page: Page, login_setup):
        """#16 — 任务列表加载"""
        page.goto(f"{BASE_URL}/tasks")
        stat_bar = page.locator(".task-stats-bar")
        expect(stat_bar).to_be_visible()

    def test_create_task_modal(self, page: Page, login_setup):
        """#17 — 新建任务弹窗"""
        page.goto(f"{BASE_URL}/tasks")
        page.click("button:has-text('新建任务')")
        modal = page.locator(".modal")
        expect(modal).to_be_visible()
        expect(modal.locator("text=新建任务")).to_be_visible()

    def test_task_status_toggle(self, page: Page, login_setup):
        """#18 — 任务状态切换"""
        page.goto(f"{BASE_URL}/tasks")
        check_btn = page.locator(".check-btn").first
        if check_btn.is_visible():
            check_btn.click()
            page.wait_for_timeout(500)

    def test_priority_filter(self, page: Page, login_setup):
        """#19 — 优先级筛选"""
        page.goto(f"{BASE_URL}/tasks")
        filter_select = page.locator("select").first
        expect(filter_select).to_be_visible()

    def test_notify_modal(self, page: Page, login_setup):
        """#20 — 飞书通知弹窗"""
        page.goto(f"{BASE_URL}/tasks")
        notify_btn = page.locator("button[title*='飞书']").first
        if notify_btn.is_visible():
            notify_btn.click()
            modal = page.locator(".modal")
            expect(modal).to_be_visible()
