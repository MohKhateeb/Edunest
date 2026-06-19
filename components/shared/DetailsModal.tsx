'use client';

import { useState, useEffect } from 'react';
import { getEntityDetails, type EntityType } from '@/lib/actions/details';
import { 
  X, GraduationCap, Calendar, DollarSign, Briefcase, AlertCircle 
} from 'lucide-react';
import Image from 'next/image';

import StudentDetails from './details/StudentDetails';
import TeacherDetails from './details/TeacherDetails';
import BookingDetails from './details/BookingDetails';
import PayoutDetails from './details/PayoutDetails';
import Portal from './Portal';

interface DetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  entityType: EntityType | null;
  entityId: string | null;
}

export default function DetailsModal({ isOpen, onClose, entityType, entityId }: DetailsModalProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'info' | 'history' | 'services' | 'reviews'>('info');
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !entityType || !entityId) {
      setData(null);
      setError(null);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await getEntityDetails(entityType, entityId);
        if (res.success) {
          setData(res.data);
          // Set default tabs based on entity type
          if (entityType === 'student') setActiveTab('info');
          if (entityType === 'teacher') setActiveTab('info');
        } else {
          setError(res.error || 'فشل تحميل البيانات.');
        }
      } catch (err) {
        setError('حدث خطأ غير متوقع أثناء الاتصال بالخادم.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isOpen, entityType, entityId]);

  if (!isOpen) return null;

  return (
    <Portal>
      <div className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-black/75 overflow-y-auto animate-in fade-in duration-200">
        <div 
          className="relative w-full max-w-3xl my-8 flex flex-col bg-card/85 dark:bg-slate-900/90 text-foreground border border-white/20 dark:border-slate-800/80 shadow-2xl rounded-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300"
          dir="rtl"
        >
          {/* Top Header */}
          <div className="flex justify-between items-center px-6 py-4 border-b border-border bg-muted/30">
            <h2 className="text-base font-extrabold flex items-center gap-2">
              <span className="p-1.5 bg-primary/10 rounded-lg text-primary">
                {entityType === 'student' && <GraduationCap className="h-5 w-5" />}
                {entityType === 'teacher' && <Briefcase className="h-5 w-5" />}
                {entityType === 'booking' && <Calendar className="h-5 w-5" />}
                {entityType === 'payout' && <DollarSign className="h-5 w-5" />}
              </span>
              <span>
                {entityType === 'student' && 'تفاصيل الطالب'}
                {entityType === 'teacher' && 'الملف التعريفي للمعلم'}
                {entityType === 'booking' && 'تفاصيل حجز الجلسة'}
                {entityType === 'payout' && 'تفاصيل التسوية المالية'}
              </span>
            </h2>
            <button 
              onClick={onClose}
              className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Body Content */}
          <div className="p-6 space-y-6">
            {loading && (
              <div className="space-y-4 py-8">
                <div className="h-8 bg-muted animate-pulse rounded-md w-1/3"></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="h-24 bg-muted animate-pulse rounded-xl"></div>
                  <div className="h-24 bg-muted animate-pulse rounded-xl"></div>
                </div>
                <div className="h-40 bg-muted animate-pulse rounded-xl"></div>
              </div>
            )}

            {error && (
              <div className="flex flex-col items-center justify-center py-12 text-center space-y-3">
                <AlertCircle className="h-12 w-12 text-destructive animate-bounce" />
                <h3 className="font-bold text-base">عذراً، فشل تحميل التفاصيل</h3>
                <p className="text-xs text-muted-foreground max-w-sm">{error}</p>
                <button 
                  onClick={onClose}
                  className="mt-2 text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-lg"
                >
                  إغلاق النافذة
                </button>
              </div>
            )}

            {!loading && !error && data && (
              <>
                {/* 1. STUDENT DETAILS RENDER */}
                {entityType === 'student' && (
                  <StudentDetails
                    student={data}
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                  />
                )}

                {/* 2. TEACHER DETAILS RENDER */}
                {entityType === 'teacher' && (
                  <TeacherDetails
                    teacher={data}
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                  />
                )}

                {/* 3. BOOKING DETAILS RENDER */}
                {entityType === 'booking' && (
                  <BookingDetails
                    booking={data}
                    setPreviewImage={setPreviewImage}
                  />
                )}

                {/* 4. PAYOUT DETAILS RENDER */}
                {entityType === 'payout' && (
                  <PayoutDetails
                    payout={data}
                  />
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-border bg-muted/20 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-2.5 rounded-lg transition-colors cursor-pointer"
            >
              إغلاق
            </button>
          </div>
        </div>
      </div>

      {/* Image Preview Overlay */}
      {previewImage && (
        <div className="fixed inset-0 z-55 flex items-start justify-center p-4 bg-black/85 overflow-y-auto animate-in fade-in duration-200">
          <div className="relative max-w-2xl w-full my-8 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
            <button 
              onClick={() => setPreviewImage(null)}
              className="absolute top-3 end-3 z-10 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="p-4 flex justify-center items-center bg-black/40">
              <Image 
                src={previewImage} 
                alt="Fullscreen Proof Preview" 
                width={1200}
                height={800}
                className="max-h-[75vh] w-auto object-contain rounded-lg"
              />
            </div>
          </div>
        </div>
      )}
    </Portal>
  );
}
