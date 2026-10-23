'use client';

import { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import {
  getUnreadNotifications,
  markNotificationRead,
} from '@/lib/notifications';
import { getDeviceToken } from '@/lib/auth';

interface NotificationItem {
  id: number;
  content: string;
  created_at: string;
  target_bottle_id: number;
}

export default function NotificationBell({
  onReplyClick,
}: {
  onReplyClick: (bottleId: number) => void;
}) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [deviceToken, setDeviceToken] = useState<string | null>(null);

  useEffect(() => {
    const token = getDeviceToken();
    if (!token) return;
    setDeviceToken(token);
    loadNotifications(token);
  }, []);

  async function loadNotifications(token: string) {
    const list = await getUnreadNotifications(token);
    setNotifications(list);
    setUnreadCount(list.length);
  }

  async function handleRead(id: number) {
    await markNotificationRead(id);
    if (deviceToken) await loadNotifications(deviceToken);
  }

  function handlePanelToggle() {
    setIsPanelOpen((prev) => !prev);
  }

  return (
    <div className="relative inline-block">
      {/* Tombol lonceng */}
      <button
        type="button"
        onClick={handlePanelToggle}
        aria-label={`Notifikasi (${unreadCount} belum dibaca)`}
        className="relative p-2 text-slate-600 hover:text-slate-900 transition-colors focus:outline-none"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white shadow-sm border border-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Panel notifikasi */}
      {isPanelOpen && (
        <div
          className="absolute right-0 mt-2 w-80 rounded-xl border border-slate-200 bg-[#fdfbf7] p-4 shadow-2xl z-50 animate-fade-in"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-serif text-lg font-bold text-slate-900">Notifikasi Balasan</h3>
            <button
              type="button"
              onClick={() => setIsPanelOpen(false)}
              className="text-xs text-slate-500 hover:text-slate-900"
            >
              Tutup
            </button>
          </div>

          {notifications.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-4">
              Belum ada notifikasi balasan.
            </p>
          ) : (
            <ul className="space-y-2 max-h-[400px] overflow-y-auto">
              {notifications.map((n) => (
                <li
                  key={n.id}
                  onClick={() => {
                    handleRead(n.id);
                    setIsPanelOpen(false);
                    onReplyClick(n.target_bottle_id);
                  }}
                  className="cursor-pointer p-2 rounded-lg border border-slate-100 bg-white hover:bg-amber-50 transition-colors"
                >
                  <p className="text-xs text-slate-700">{n.content}</p>
                  <p className="text-[10px] text-slate-400 mt-1">
                    {new Date(n.created_at).toLocaleString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
