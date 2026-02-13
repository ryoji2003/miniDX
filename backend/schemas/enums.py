from enum import Enum


class TaskCategory(str, Enum):
    """業務カテゴリ: タスク名に含まれるキーワードで分類"""
    NURSING = "看護"
    TRAINING = "訓練"


# 1日に必要な最低ドライバー数
DRIVER_MIN_COUNT = 6
