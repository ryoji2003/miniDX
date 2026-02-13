// src/components/StaffForm.jsx
import React, { useState, useEffect } from 'react';
import { Card, Button } from './ui/Layouts';
import { X } from 'lucide-react';

const LICENSE_OPTIONS = [
  { value: 0, label: 'なし' },
  { value: 1, label: '普通免許' },
  { value: 2, label: '普通免許 + ワゴン' },
];

export default function StaffForm({ staff, onSave, onClose }) {
  const [formData, setFormData] = useState({
    name: '',
    work_limit: 20,
    license_type: 0,
    is_part_time: false,
    can_only_train: false,
    is_nurse: false,
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (staff?._backend) {
      // Editing existing staff
      setFormData({
        name: staff._backend.name,
        work_limit: staff._backend.work_limit,
        license_type: staff._backend.license_type,
        is_part_time: staff._backend.is_part_time,
        can_only_train: staff._backend.can_only_train,
        is_nurse: staff._backend.is_nurse,
      });
    }
  }, [staff]);

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = '名前を入力してください';
    }
    if (formData.work_limit < 1 || formData.work_limit > 200) {
      newErrors.work_limit = '1〜200の範囲で入力してください';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      onSave(formData);
    }
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md p-6 bg-white">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">
            {staff ? 'スタッフを編集' : 'スタッフを追加'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 名前 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              名前 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 ${
                errors.name ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="山田 太郎"
            />
            {errors.name && (
              <p className="text-red-500 text-xs mt-1">{errors.name}</p>
            )}
          </div>

          {/* 月間上限時間 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              月間上限時間
            </label>
            <input
              type="number"
              value={formData.work_limit}
              onChange={(e) => handleChange('work_limit', parseInt(e.target.value) || 0)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 ${
                errors.work_limit ? 'border-red-500' : 'border-gray-300'
              }`}
              min="1"
              max="200"
            />
            {errors.work_limit && (
              <p className="text-red-500 text-xs mt-1">{errors.work_limit}</p>
            )}
          </div>

          {/* 免許種別 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              免許種別
            </label>
            <select
              value={formData.license_type}
              onChange={(e) => handleChange('license_type', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              {LICENSE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* チェックボックス */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_part_time}
                onChange={(e) => handleChange('is_part_time', e.target.checked)}
                className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
              />
              <span className="text-sm text-gray-700">パート勤務</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_nurse}
                onChange={(e) => handleChange('is_nurse', e.target.checked)}
                className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
              />
              <span className="text-sm text-gray-700">看護師</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.can_only_train}
                onChange={(e) => handleChange('can_only_train', e.target.checked)}
                className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
              />
              <span className="text-sm text-gray-700">訓練限定スタッフ</span>
            </label>
          </div>

          {/* ボタン */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="flex-1"
            >
              キャンセル
            </Button>
            <Button type="submit" className="flex-1">
              {staff ? '更新' : '追加'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
