#!/usr/bin/env python3
"""
MOCK 数据 — 模拟后端 API 响应
"""
from datetime import datetime, timedelta

NOW = datetime.now().isoformat()

# ===== 会议 =====
MOCK_MEETINGS = {
    "records": [
        {
            "id": 1,
            "meetingNo": "M20260713001",
            "title": "产品需求评审会",
            "status": "FINISHED",
            "summaryStatus": "DONE",
            "location": "3楼会议室",
            "organizerName": "张三",
            "participantCount": 6,
            "startTime": (datetime.now() - timedelta(hours=2)).isoformat(),
            "endTime": (datetime.now() - timedelta(hours=1)).isoformat(),
            "createdAt": (datetime.now() - timedelta(days=1)).isoformat()
        },
        {
            "id": 2,
            "meetingNo": "M20260713002",
            "title": "课设联调演示会议",
            "status": "RECORDING",
            "summaryStatus": "NONE",
            "location": "线上腾讯会议",
            "organizerName": "李四",
            "participantCount": 4,
            "startTime": datetime.now().isoformat(),
            "endTime": None,
            "createdAt": datetime.now().isoformat()
        },
        {
            "id": 3,
            "meetingNo": "M20260712001",
            "title": "周例会",
            "status": "NOT_STARTED",
            "summaryStatus": "NONE",
            "location": "办公室",
            "organizerName": "王五",
            "participantCount": 10,
            "startTime": (datetime.now() + timedelta(hours=1)).isoformat(),
            "endTime": None,
            "createdAt": (datetime.now() - timedelta(days=2)).isoformat()
        },
        {
            "id": 4,
            "meetingNo": "M20260711001",
            "title": "技术方案评审",
            "status": "FINISHED",
            "summaryStatus": "DONE",
            "location": "线上",
            "organizerName": "张三",
            "participantCount": 5,
            "startTime": (datetime.now() - timedelta(days=1)).isoformat(),
            "endTime": (datetime.now() - timedelta(days=1, hours=-1)).isoformat(),
            "createdAt": (datetime.now() - timedelta(days=3)).isoformat()
        }
    ],
    "total": 4,
    "size": 20,
    "current": 1,
    "pages": 1
}

MOCK_MEETING_DETAIL = {
    "id": 1,
    "meetingNo": "M20260713001",
    "title": "产品需求评审会",
    "status": "NOT_STARTED",
    "summaryStatus": "NONE",
    "location": "3楼会议室",
    "organizerName": "张三",
    "participantCount": 6,
    "startTime": (datetime.now() - timedelta(hours=2)).isoformat(),
    "endTime": None,
    "createdAt": (datetime.now() - timedelta(days=1)).isoformat()
}

MOCK_MEETING_RECORDING = {**MOCK_MEETING_DETAIL, "status": "RECORDING"}
MOCK_MEETING_FINISHED = {**MOCK_MEETING_DETAIL, "status": "FINISHED", "endTime": datetime.now().isoformat()}

# ===== 字幕 =====
MOCK_SUBTITLES = [
    {
        "segmentId": "rec-1",
        "sequence": 1,
        "subtitle": "我们先确认一下本次会议的主要目标。",
        "speaker": "张三",
        "recognitionMode": "OFFLINE",
        "isFinal": True,
        "startMs": 1200,
        "endMs": 4300,
        "occurredAt": datetime.now().isoformat()
    },
    {
        "segmentId": "rec-2",
        "sequence": 2,
        "subtitle": "好的，我来记录一下。",
        "speaker": "李四",
        "recognitionMode": "OFFLINE",
        "isFinal": True,
        "startMs": 4500,
        "endMs": 6200,
        "occurredAt": datetime.now().isoformat()
    }
]

# ===== 纪要 =====
MOCK_MINUTES = {
    "id": 1,
    "meetingId": 1,
    "title": "产品需求评审会纪要",
    "summary": "本次会议主要讨论了产品需求的范围和优先级，确认了第一阶段需要完成的3个核心功能。",
    "content": "## 会议纪要\n\n本次会议主要讨论了以下内容...",
    "keyPoints": ["确认了第一阶段3个核心功能", "UI设计稿下周完成", "后端接口本周出文档"],
    "decisions": ["采用微服务架构", "使用 MySQL 作为主数据库"],
    "generateStatus": "DONE",
    "modelName": "deepseek-v4-pro",
    "version": 1,
    "generatedAt": (datetime.now() - timedelta(minutes=30)).isoformat()
}

# ===== 任务 =====
MOCK_TASKS = [
    {
        "id": 1,
        "meetingId": 1,
        "title": "完成UI设计稿",
        "description": "根据会议确定的需求完成界面设计",
        "assigneeName": "张三",
        "priority": "HIGH",
        "status": "DOING",
        "dueTime": (datetime.now() + timedelta(days=7)).isoformat(),
        "createdFrom": "AUTO",
        "createdAt": (datetime.now() - timedelta(hours=1)).isoformat()
    },
    {
        "id": 2,
        "meetingId": 1,
        "title": "编写接口文档",
        "description": "输出所有 REST API 接口文档",
        "assigneeName": "李四",
        "priority": "MEDIUM",
        "status": "TODO",
        "dueTime": (datetime.now() + timedelta(days=14)).isoformat(),
        "createdFrom": "MANUAL",
        "createdAt": (datetime.now() - timedelta(hours=2)).isoformat()
    }
]

# ===== 飞书 =====
MOCK_FEISHU_USER = {
    "userKey": "ou_mock_user",
    "openId": "ou_mock_user_123456",
    "name": "测试用户",
    "enName": "Test User"
}

MOCK_FEISHU_USERS = [MOCK_FEISHU_USER]

MOCK_FEISHU_CHATS = [
    {"chatId": "oc_mock_chat_1", "name": "项目组群聊", "chatStatus": "normal"},
    {"chatId": "oc_mock_chat_2", "name": "技术讨论群", "chatStatus": "normal"}
]

MOCK_FEISHU_FOLDERS = [
    {"token": "fld_mock_1", "name": "会议纪要"},
    {"token": "fld_mock_2", "name": "产品文档"},
    {"token": "fld_mock_3", "name": "技术方案"}
]

MOCK_SYNC_RESULT = {
    "syncStatus": "SUCCESS",
    "docUrl": "https://feishu.cn/doc/mock_doc",
    "taskResults": [],
    "syncedAt": datetime.now().isoformat()
}

MOCK_EXPORT_RESULT = {
    "exportId": "exp_mock_001",
    "minutesId": 1,
    "format": "WORD",
    "fileName": "产品需求评审会纪要.docx",
    "contentType": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "createdAt": datetime.now().isoformat(),
    "expiresAt": (datetime.now() + timedelta(hours=24)).isoformat()
}

MOCK_NOTIFY_RESULT = {
    "messageId": "om_mock_message_123",
    "receiveIdType": "open_id",
    "receiveId": "ou_mock_user_123456",
    "chatId": "oc_mock_chat_1",
    "msgType": "interactive",
    "createTime": datetime.now().isoformat()
}
