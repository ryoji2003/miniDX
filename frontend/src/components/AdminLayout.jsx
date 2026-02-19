// src/components/AdminLayout.jsx
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Users, Calendar as CalendarIcon, LayoutDashboard, ClipboardList, CalendarDays, CalendarPlus, Home } from 'lucide-react';
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

          <Link to="/admin/requirements">
            <Button
              variant={isActive('/admin/requirements') ? "default" : "ghost"}
              className={`w-full justify-start ${isActive('/admin/requirements') ? "bg-primary/10 text-primary hover:bg-primary/20" : "text-gray-500"}`}
            >
              <ClipboardList className="mr-2 h-4 w-4" />
              日次要件設定
            </Button>
          </Link>

          <Link to="/admin/day-off-requests">
            <Button
              variant={isActive('/admin/day-off-requests') ? "default" : "ghost"}
              className={`w-full justify-start ${isActive('/admin/day-off-requests') ? "bg-primary/10 text-primary hover:bg-primary/20" : "text-gray-500"}`}
            >
              <CalendarDays className="mr-2 h-4 w-4" />
              休暇申請管理
            </Button>
          </Link>

          <div className="pt-4 mt-4 border-t">
            <Link to="/">
              <Button
                variant="ghost"
                className="w-full justify-start text-gray-500"
              >
                <Home className="mr-2 h-4 w-4" />
                トップページ
              </Button>
            </Link>
          </div>
        </nav>
      </aside>

      {/* メインコンテンツエリア（ページごとに中身が変わる） */}
      <main className="flex-1 p-8 overflow-auto ml-64">
        {children}
      </main>
    </div>
  );
}