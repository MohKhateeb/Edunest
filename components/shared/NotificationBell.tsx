'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell, Check, Trash2, CheckCircle2 } from 'lucide-react';
import { getUserNotifications, markNotificationAsRead, markAllNotificationsAsRead } from '@/lib/actions/notification';
import { Notification } from '@prisma/client';
import { formatLocalTime } from '@/lib/utils';
import { cn } from '@/lib/utils';

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const fetchNotifications = async () => {
    const res = await getUserNotifications();
    if (res.success && res.data) {
      setNotifications(res.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchNotifications();
    
    // Optional: Set up polling or Realtime subscription here
    const interval = setInterval(fetchNotifications, 60000); // Poll every minute
    return () => clearInterval(interval);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, isRead: true } : n)
    );
    await markNotificationAsRead(id);
  };

  const handleMarkAllAsRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    await markAllNotificationsAsRead();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-full transition-colors cursor-pointer"
        aria-label="الإشعارات"
      >
        <Bell className="h-5.5 w-5.5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 end-1.5 h-2.5 w-2.5 bg-red-500 rounded-full border-2 border-background animate-pulse" />
        )}
      </button>

      {isOpen && (
        <div className="absolute end-0 mt-2 w-80 sm:w-96 bg-card border border-border shadow-xl rounded-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
          <div className="p-4 border-b border-border flex justify-between items-center bg-muted/20">
            <h3 className="font-extrabold text-sm flex items-center gap-2">
              الإشعارات
              {unreadCount > 0 && (
                <span className="bg-primary text-primary-foreground text-[10px] px-2 py-0.5 rounded-full">
                  {unreadCount} جديد
                </span>
              )}
            </h3>
            {unreadCount > 0 && (
               <button 
                onClick={handleMarkAllAsRead}
                className="text-xs text-primary hover:underline font-semibold"
              >
                تحديد الكل كمقروء
              </button>
            )}
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-6 text-center text-sm text-muted-foreground animate-pulse">
                جاري التحميل...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 flex flex-col items-center justify-center text-center text-muted-foreground">
                <div className="bg-accent/50 p-3 rounded-full mb-3">
                  <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                </div>
                <p className="text-sm font-semibold">لا توجد إشعارات جديدة</p>
                <p className="text-xs mt-1">أنت على إطلاع بكل جديد!</p>
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {notifications.map(notification => (
                  <li 
                    key={notification.id}
                    className={cn(
                      "p-4 hover:bg-accent/50 transition-colors relative group",
                      !notification.isRead && "bg-primary/5"
                    )}
                  >
                    {!notification.isRead && (
                      <div className="absolute end-2 top-4 w-1.5 h-1.5 rounded-full bg-primary" />
                    )}
                    <div className="pe-4">
                      <p className={cn("text-sm mb-1", !notification.isRead ? "font-bold text-foreground" : "font-medium text-foreground/80")}>
                        {notification.title}
                      </p>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {notification.message}
                      </p>
                      <div className="flex justify-between items-center mt-3">
                        <span className="text-[10px] text-muted-foreground font-medium">
                          {formatLocalTime(notification.createdAt)}
                        </span>
                        
                        {!notification.isRead && (
                          <button 
                            onClick={() => handleMarkAsRead(notification.id)}
                            className="text-[10px] flex items-center gap-1 text-primary hover:text-primary/80 font-semibold opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Check className="h-3 w-3" />
                            تحديد كمقروء
                          </button>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
