'use client';

import { useState, useEffect, useRef } from 'react';
import { JitsiMeeting } from '@jitsi/react-sdk';
import { useRouter } from 'next/navigation';
import { Clock, CheckCircle2, AlertTriangle, FileText } from 'lucide-react';
import Portal from '@/components/shared/Portal';
import { submitSessionReport } from '@/lib/actions/booking';
import { toast } from 'sonner';

interface JitsiMeetingRoomProps {
  roomName: string;
  userName: string;
  bookingId: string;
  role: 'TEACHER' | 'PARENT';
  startTime: Date;
  durationMinutes: number;
}

export default function JitsiMeetingRoom({
  roomName,
  userName,
  bookingId,
  role,
  startTime,
  durationMinutes
}: JitsiMeetingRoomProps) {
  const router = useRouter();
  const [api, setApi] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [sessionEnded, setSessionEnded] = useState(false);
  
  // States for report modal
  const [showReportModal, setShowReportModal] = useState(false);
  const [submittingReport, setSubmittingReport] = useState(false);
  const [reportForm, setReportForm] = useState({
    studentAttended: true,
    topicsCovered: '',
    studentPerformance: '5',
    homeworkAssigned: '',
    teacherNotes: '',
  });

  const sessionEndMs = new Date(startTime).getTime() + durationMinutes * 60_000;

  useEffect(() => {
    if (sessionEnded) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const remaining = sessionEndMs - now;
      
      if (remaining <= 0) {
        setTimeLeft(0);
        endSession();
      } else {
        setTimeLeft(Math.floor(remaining / 1000));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [sessionEndMs, sessionEnded]);

  const endSession = () => {
    setSessionEnded(true);
    if (api) {
      api.executeCommand('hangup');
      api.dispose();
    }
    
    // If it's the teacher, show report modal
    if (role === 'TEACHER') {
      setShowReportModal(true);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportForm.topicsCovered.trim()) {
      toast.warning('بيانات ناقصة', { description: 'الرجاء تعبئة المواضيع المغطاة' });
      return;
    }
    setSubmittingReport(true);
    const res = await submitSessionReport({
      bookingId,
      studentAttended: reportForm.studentAttended,
      topicsCovered: reportForm.topicsCovered,
      studentPerformance: reportForm.studentAttended ? Number(reportForm.studentPerformance) : null,
      homeworkAssigned: reportForm.homeworkAssigned,
      teacherNotes: reportForm.teacherNotes,
    });
    setSubmittingReport(false);
    
    if (res.success) {
      toast.success('تم إرسال التقرير', { description: 'تم حفظ تقرير الجلسة بنجاح' });
      setShowReportModal(false);
      router.push('/dashboard/teacher/bookings');
    } else {
      toast.error('فشل إرسال التقرير', { description: res.error });
    }
  };

  if (sessionEnded) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center p-6 animate-in fade-in zoom-in duration-500" dir="rtl">
        <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6 shadow-lg">
          <CheckCircle2 className="w-12 h-12" />
        </div>
        <h2 className="text-3xl font-black text-slate-800 dark:text-slate-100 mb-2">
          انتهت الجلسة بنجاح!
        </h2>
        <p className="text-slate-500 mb-8 max-w-md">
          {role === 'TEACHER' 
            ? 'شكراً لجهودك، يرجى كتابة التقرير الختامي للطالب.'
            : 'شكراً لحضورك، نتمنى لك التوفيق! لا تنسَ تقييم المعلم من صفحة الحجوزات.'}
        </p>
        
        {role === 'PARENT' && (
          <button
            onClick={() => router.push('/dashboard/parent/bookings')}
            className="px-6 py-3 bg-primary hover:bg-primary/90 text-white rounded-xl font-bold shadow-md transition-all cursor-pointer"
          >
            العودة للحجوزات
          </button>
        )}
        
        {role === 'TEACHER' && !showReportModal && (
          <button
            onClick={() => setShowReportModal(true)}
            className="px-6 py-3 bg-primary hover:bg-primary/90 text-white rounded-xl font-bold shadow-md transition-all flex items-center gap-2 cursor-pointer"
          >
            <FileText className="w-5 h-5" />
            كتابة التقرير الآن
          </button>
        )}

        {/* Report Modal */}
        {showReportModal && (
          <Portal>
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-4 overflow-y-auto backdrop-blur-sm" dir="rtl">
              <form onSubmit={handleReportSubmit} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl animate-in zoom-in-95 duration-200">
                <h3 className="font-extrabold text-xl flex items-center gap-2 text-slate-800 dark:text-slate-100">
                  <FileText className="h-6 w-6 text-primary" />
                  تقرير الجلسة التعليمية
                </h3>
                <p className="text-xs text-slate-500 font-medium">يرجى تقييم الجلسة لإضافتها في سجل الطالب واحتساب أرباحك.</p>
                
                <div className="space-y-4 text-sm mt-4">
                  <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700">
                    <input
                      type="checkbox"
                      id="attended"
                      checked={reportForm.studentAttended}
                      onChange={(e) => setReportForm({ ...reportForm, studentAttended: e.target.checked })}
                      className="rounded border-slate-300 text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                    />
                    <label htmlFor="attended" className="font-bold cursor-pointer text-slate-700 dark:text-slate-300">هل حضر الطالب الجلسة بالكامل؟</label>
                  </div>

                  {reportForm.studentAttended && (
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-600 dark:text-slate-400">أداء الطالب وتفاعله (1-5)</label>
                      <select
                        value={reportForm.studentPerformance}
                        onChange={(e) => setReportForm({ ...reportForm, studentPerformance: e.target.value })}
                        className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary cursor-pointer"
                      >
                        <option value="5">ممتاز جداً (5)</option>
                        <option value="4">جيد جداً (4)</option>
                        <option value="3">متوسط (3)</option>
                        <option value="2">يحتاج تركيز (2)</option>
                        <option value="1">ضعيف التفاعل (1)</option>
                      </select>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400">المواضيع التي تم شرحها *</label>
                    <textarea
                      required
                      rows={3}
                      value={reportForm.topicsCovered}
                      onChange={(e) => setReportForm({ ...reportForm, topicsCovered: e.target.value })}
                      placeholder="اكتب الدروس أو المسائل التي تمت تغطيتها..."
                      className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400">الواجبات المقررة (اختياري)</label>
                    <textarea
                      rows={2}
                      value={reportForm.homeworkAssigned}
                      onChange={(e) => setReportForm({ ...reportForm, homeworkAssigned: e.target.value })}
                      placeholder="أي مهام لليوم القادم..."
                      className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400">ملاحظات لولي الأمر (اختياري)</label>
                    <textarea
                      rows={2}
                      value={reportForm.teacherNotes}
                      onChange={(e) => setReportForm({ ...reportForm, teacherNotes: e.target.value })}
                      placeholder="رسالة لولي الأمر بخصوص مستوى الطالب..."
                      className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-none"
                    />
                  </div>
                </div>
                
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex gap-3">
                  <button
                    type="button"
                    onClick={() => router.push('/dashboard/teacher/bookings')}
                    className="w-1/3 text-sm font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 p-3.5 rounded-xl shadow-sm cursor-pointer transition-colors"
                  >
                    تأجيل
                  </button>
                  <button
                    type="submit"
                    disabled={submittingReport}
                    className="w-2/3 text-sm font-bold bg-primary text-white hover:bg-primary/90 p-3.5 rounded-xl shadow-md cursor-pointer transition-colors flex justify-center items-center gap-2"
                  >
                    {submittingReport ? <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : 'إرسال التقرير واعتماد الجلسة'}
                  </button>
                </div>
              </form>
            </div>
          </Portal>
        )}
      </div>
    );
  }

  return (
    <div className="relative w-full h-[calc(100vh-64px)] bg-[#111] overflow-hidden flex flex-col font-sans" dir="ltr">
      {/* Top Banner with Timer */}
      <div className="absolute top-0 left-0 right-0 h-14 bg-gradient-to-b from-black/90 to-transparent z-10 flex items-center justify-between px-6 pointer-events-none">
        <div className="text-white/90 font-semibold text-sm drop-shadow-md flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
          {userName} ({role === 'TEACHER' ? 'المعلم' : 'الطالب'})
        </div>
        
        {timeLeft !== null && (
          <div className={`flex items-center gap-2 font-mono text-xl font-bold drop-shadow-lg bg-black/40 px-4 py-1.5 rounded-full border border-white/10 ${timeLeft < 300 ? 'text-rose-400 animate-pulse' : 'text-emerald-400'}`}>
            <Clock className="w-5 h-5" />
            {formatTime(timeLeft)}
            {timeLeft < 300 && <span className="text-xs ms-2 bg-rose-500/20 px-2 py-0.5 rounded text-rose-300">ينتهي قريباً</span>}
          </div>
        )}
      </div>

      <div className="flex-1 w-full h-full">
        <JitsiMeeting
          domain="meet.jit.si"
          roomName={roomName}
          configOverwrite={{
            startWithAudioMuted: false,
            disableModeratorIndicator: true,
            startScreenSharing: false,
            enableEmailInStats: false,
            prejoinPageEnabled: false,
            requireDisplayName: false,
          }}
          interfaceConfigOverwrite={{
            DISABLE_JOIN_LEAVE_NOTIFICATIONS: true,
            SHOW_PROMOTIONAL_CLOSE_PAGE: false,
            SHOW_JITSI_WATERMARK: false,
            TOOLBAR_BUTTONS: [
                'microphone', 'camera', 'closedcaptions', 'desktop', 'fullscreen',
                'fodeviceselection', 'profile', 'chat', 'recording',
                'livestreaming', 'etherpad', 'sharedvideo', 'settings', 'raisehand',
                'videoquality', 'filmstrip', 'feedback', 'stats', 'shortcuts',
                'tileview', 'videobackgroundblur', 'download', 'help', 'mute-everyone'
            ]
          }}
          userInfo={{
            displayName: userName,
            email: 'user@edunest.local' // required by TS interface
          }}
          onApiReady={(externalApi) => {
            setApi(externalApi);
          }}
          getIFrameRef={(iframeRef) => {
            iframeRef.style.height = '100%';
            iframeRef.style.width = '100%';
          }}
        />
      </div>

      {/* Manual End Button */}
      <div className="absolute bottom-6 right-6 z-10">
        <button 
          onClick={endSession}
          className="bg-rose-600 hover:bg-rose-500 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-xl flex items-center gap-2 transition-transform hover:scale-105 cursor-pointer border border-rose-400/20"
          dir="rtl"
        >
          <AlertTriangle className="w-4 h-4" />
          إنهاء الجلسة 
        </button>
      </div>
    </div>
  );
}
