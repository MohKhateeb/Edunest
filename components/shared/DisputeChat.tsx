'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { sendDisputeMessage, resolveDispute } from '@/lib/actions/disputes';
import { UserType, DisputeStatus } from '@prisma/client';

type Message = {
  id: string;
  senderId: string;
  sender: { name: string; userType: string };
  message: string;
  createdAt: Date;
};

type DisputeChatProps = {
  disputeId: string;
  status: DisputeStatus;
  messages: Message[];
  currentUserId: string;
  currentUserType: UserType;
};

export function DisputeChat({ disputeId, status, messages, currentUserId, currentUserType }: DisputeChatProps) {
  const [msgText, setMsgText] = useState('');
  const [loading, setLoading] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const router = useRouter();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!msgText.trim()) return;

    setLoading(true);
    const res = await sendDisputeMessage({ disputeId, message: msgText });
    if (res.success) {
      setMsgText('');
      router.refresh();
    } else {
      alert(res.error);
    }
    setLoading(false);
  };

  const handleResolve = async (decision: 'RESOLVED_IN_FAVOR_OF_PARENT' | 'RESOLVED_IN_FAVOR_OF_TEACHER') => {
    if (!confirm('هل أنت متأكد من قرارك؟ لا يمكن التراجع بعد الإغلاق.')) return;

    setResolving(true);
    const res = await resolveDispute({ disputeId, decision, adminNotes });
    if (res.success) {
      router.refresh();
    } else {
      alert(res.error);
    }
    setResolving(false);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col h-[70vh]">
      {/* Chat Header */}
      <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-900/80 flex justify-between items-center shrink-0">
        <div>
          <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
            محادثة النزاع
            {status === 'OPEN' ? (
              <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">مفتوح</span>
            ) : (
              <span className="text-xs bg-gray-200 text-gray-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                مغلق (للقراءة فقط)
              </span>
            )}
          </h3>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/30 dark:bg-gray-900/30">
        {messages.map((msg) => {
          const isMe = msg.senderId === currentUserId;
          const isAdminMsg = msg.message.startsWith('[رسالة إدارية') || msg.message.startsWith('[رسالة النظام');
          
          return (
            <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} ${isAdminMsg ? 'items-center' : ''}`}>
              {!isAdminMsg && (
                <span className="text-xs text-gray-500 mb-1 mx-1">
                  {msg.sender.name} {msg.sender.userType === 'ADMIN' ? '(الإدارة)' : msg.sender.userType === 'TEACHER' ? '(المعلم)' : '(ولي الأمر)'}
                </span>
              )}
              <div className={`max-w-[80%] p-3 rounded-2xl ${
                isAdminMsg 
                  ? 'bg-yellow-50 border border-yellow-200 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200 text-sm w-full text-center' 
                  : isMe 
                    ? 'bg-blue-600 text-white rounded-tr-none' 
                    : 'bg-white dark:bg-gray-700 border border-gray-100 dark:border-gray-600 text-gray-800 dark:text-gray-100 rounded-tl-none shadow-sm'
              }`}>
                <p className="whitespace-pre-wrap">{msg.message}</p>
                {!isAdminMsg && (
                  <div className={`text-[10px] mt-2 text-right ${isMe ? 'text-blue-200' : 'text-gray-400'}`}>
                    {new Date(msg.createdAt).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef}></div>
      </div>

      {/* Input Area */}
      {status === 'OPEN' && (
        <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 shrink-0">
          <form onSubmit={handleSend} className="flex gap-2">
            <input
              type="text"
              value={msgText}
              onChange={(e) => setMsgText(e.target.value)}
              placeholder="اكتب رسالتك هنا..."
              className="flex-1 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !msgText.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl transition-colors disabled:opacity-50"
            >
              {loading ? '...' : 'إرسال'}
            </button>
          </form>

          {/* Admin Resolution Controls */}
          {currentUserType === 'ADMIN' && (
            <div className="mt-4 p-4 border border-red-200 bg-red-50 dark:bg-red-900/10 rounded-xl">
              <h4 className="font-bold text-red-800 dark:text-red-400 mb-2">قرار الإدارة (حسم النزاع)</h4>
              <input
                type="text"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="ملاحظات الإدارة (تظهر للطرفين عند الإغلاق)"
                className="w-full bg-white dark:bg-gray-900 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2 text-sm mb-3"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleResolve('RESOLVED_IN_FAVOR_OF_PARENT')}
                  disabled={resolving}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white text-sm py-2 rounded-lg transition-colors disabled:opacity-50"
                >
                  استرداد المبلغ لولي الأمر
                </button>
                <button
                  type="button"
                  onClick={() => handleResolve('RESOLVED_IN_FAVOR_OF_TEACHER')}
                  disabled={resolving}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-sm py-2 rounded-lg transition-colors disabled:opacity-50"
                >
                  رفض الاعتراض والدفع للمعلم
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
