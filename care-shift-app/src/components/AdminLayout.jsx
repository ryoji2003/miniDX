// src/components/AdminLayout.jsx
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Users, Calendar as CalendarIcon, LayoutDashboard } from 'lucide-react';
import { Button, Card } from './ui/Layouts';

export default function AdminLayout({ children }) {
  const location = useLocation();

  // 現在のページがアクティブかどうか判定する関数
  const isActive = (path) => location.pathname === path;

  return (
    <div className="flex h-screen bg-secondary/30">
      {/* 共通サイドバー */}
      <aside className="w-64 bg-white border-r p-6 hidden md:flex flex-col fixed h-full">
        <div className="flex items-center gap-2 mb-8 text-primary font-bold text-xl">
          <CalendarIcon />
          <span>CareShift AI</span>
        </div>
        
        <nav className="space-y-2">
          <Link to="/admin">
            <Button 
              variant={isActive('/admin') ? "default" : "ghost"} 
              className={`w-full justify-start ${isActive('/admin') ? "bg-primary/10 text-primary hover:bg-primary/20" : "text-gray-500"}`}
            >
              <LayoutDashboard className="mr-2 h-4 w-4" />
              ダッシュボード
            </Button>
          </Link>
          
          <Link to="/admin/staff">
            <Button 
              variant={isActive('/admin/staff') ? "default" : "ghost"} 
              className={`w-full justify-start ${isActive('/admin/staff') ? "bg-primary/10 text-primary hover:bg-primary/20" : "text-gray-500"}`}
            >
              <Users className="mr-2 h-4 w-4" />
              スタッフ管理
            </Button>
          </Link>
        </nav>

        <div className="mt-auto">
          <Card className="p-4 bg-primary/5 border-none">
            <p className="text-sm text-gray-600 mb-2">今月のシフト作成率</p>
            <div className="text-2xl font-bold text-primary">80%</div>
          </Card>
        </div>
      </aside>

      {/* メインコンテンツエリア（ページごとに中身が変わる） */}
      <main className="flex-1 p-8 overflow-auto ml-64">
        {children}
      </main>
    </div>
  );
}