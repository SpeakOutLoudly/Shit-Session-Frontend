#!/usr/bin/env python3
"""
conftest.py — pytest 全局配置与 fixtures

用法：
    pytest -v                      # 启用 mock（默认）
    pytest -v --no-mock            # 关掉 mock，连真实后端
"""
import pytest
from playwright.sync_api import Page, expect
from mock_data import *

BASE_URL = "http://localhost:3000"


def pytest_addoption(parser):
    parser.addoption(
        "--no-mock",
        action="store_true",
        default=False,
        help="关掉 mock，连真实后端"
    )


@pytest.fixture(scope="session")
def use_mock(request):
    """是否使用 mock"""
    return not request.config.getoption("--no-mock")


@pytest.fixture(autouse=True)
def mock_or_real(request, page: Page, use_mock: bool):
    """自动拦截 API 请求（mock 模式下）"""
    if not use_mock:
        return

    def handle_route(route):
        url = route.request.url
        method = route.request.method
        path = url.split("?")[0]  # 去掉查询参数

        # ===== 会议 — 优先匹配具体路径 =====
        if "/api/v1/meetings/" in path:
            if path.endswith("/minutes/generate") and method == "POST":
                route.fulfill(json={"code": 200, "data": MOCK_MINUTES})
            elif path.endswith("/minutes") and method == "GET":
                route.fulfill(json={"code": 200, "data": MOCK_MINUTES})
            elif path.endswith("/start") and method == "POST":
                route.fulfill(json={"code": 200, "data": MOCK_MEETING_RECORDING})
            elif path.endswith("/finish") and method == "POST":
                route.fulfill(json={"code": 200, "data": MOCK_MEETING_FINISHED})
            elif path.endswith("/cancel") and method == "POST":
                route.fulfill(json={"code": 200, "data": MOCK_MEETING_DETAIL})
            elif method == "GET":
                route.fulfill(json={"code": 200, "data": MOCK_MEETING_DETAIL})
            elif method == "PUT":
                route.fulfill(json={"code": 200, "data": MOCK_MEETING_DETAIL})
            elif method == "DELETE":
                route.fulfill(json={"code": 200, "data": True})
            else:
                route.continue_()

        elif "/api/v1/meetings" in path:
            # 列表查询或创建
            if method == "GET":
                route.fulfill(json={"code": 200, "data": MOCK_MEETINGS})
            elif method == "POST":
                route.fulfill(json={"code": 200, "data": MOCK_MEETING_DETAIL})
            elif method == "PUT":
                route.fulfill(json={"code": 200, "data": MOCK_MEETING_DETAIL})
            else:
                route.continue_()

        # ===== 字幕（不在 /api 下，特殊处理）=====
        elif "/subtitles/stream" in path:
            route.fulfill(body="", status=200)
        elif "/subtitles" in path and method == "GET":
            route.fulfill(json={"code": 200, "data": MOCK_SUBTITLES})

        # ===== 任务 =====
        elif "/api/v1/tasks" in path:
            if method == "GET":
                route.fulfill(json={"code": 200, "data": {"records": MOCK_TASKS, "total": 2}})
            elif method == "POST":
                route.fulfill(json={"code": 200, "data": MOCK_TASKS[0]})
            elif "/status" in path and method == "PATCH":
                route.fulfill(json={"code": 200, "data": {**MOCK_TASKS[0], "status": "DONE"}})
            elif method == "PUT":
                route.fulfill(json={"code": 200, "data": MOCK_TASKS[0]})
            elif method == "DELETE":
                route.fulfill(json={"code": 200, "data": True})
            else:
                route.continue_()

        # ===== 纪要 =====
        elif "/api/v1/minutes" in path:
            if "/exports" in path and method == "POST":
                route.fulfill(json={"code": 200, "data": MOCK_EXPORT_RESULT})
            elif "/sync/feishu" in path and method == "POST":
                route.fulfill(json={"code": 200, "data": MOCK_SYNC_RESULT})
            elif "/notifications/feishu" in path and method == "POST":
                route.fulfill(json={"code": 200, "data": MOCK_NOTIFY_RESULT})
            elif "/tasks/generate" in path and method == "POST":
                route.fulfill(json={"code": 200, "data": MOCK_TASKS})
            elif method == "GET":
                route.fulfill(json={"code": 200, "data": MOCK_MINUTES})
            elif method == "PUT":
                route.fulfill(json={"code": 200, "data": MOCK_MINUTES})
            elif method == "DELETE":
                route.fulfill(json={"code": 200, "data": True})
            else:
                route.continue_()

        # ===== 飞书 =====
        elif "/api/v1/feishu/oauth/authorize-url" in path:
            route.fulfill(json={"code": 200, "data": {"authorizeUrl": "https://example.com/oauth?code=mock"}})
        elif "/api/v1/feishu/oauth/token" in path:
            route.fulfill(json={"code": 200, "data": MOCK_FEISHU_USER})
        elif "/api/v1/feishu/oauth/users" in path and "/refresh" in path:
            route.fulfill(json={"code": 200, "data": MOCK_FEISHU_USER})
        elif "/api/v1/feishu/oauth/users" in path:
            route.fulfill(json={"code": 200, "data": MOCK_FEISHU_USERS})
        elif "/api/v1/feishu/drive/folders" in path and method == "GET":
            route.fulfill(json={"code": 200, "data": MOCK_FEISHU_FOLDERS})
        elif "/api/v1/feishu/drive/folders" in path and method == "POST":
            route.fulfill(json={"code": 200, "data": {"token": "fld_mock_new", "name": "新建文件夹"}})
        elif "/api/v1/feishu/im/chats" in path:
            route.fulfill(json={"code": 200, "data": MOCK_FEISHU_CHATS})
        else:
            route.continue_()

    page.route("**/api/v1/**", handle_route)


@pytest.fixture
def login_setup(page: Page, use_mock: bool):
    """已登录的前置条件"""
    page.goto(f"{BASE_URL}/login")
    page.fill("input", "测试用户")
    page.click("button:has-text('进入会议室')")
    page.wait_for_url("**/dashboard")
    yield


@pytest.fixture
def login_and_feishu_setup(page: Page, login_setup):
    """已登录 + 飞书已授权的前置条件"""
    page.evaluate("""
        localStorage.setItem('feishu_oauth_user', JSON.stringify({
            userKey: 'ou_mock_user',
            openId: 'ou_mock_user_123456',
            name: '测试用户'
        }))
    """)
    yield
