'use client';

import { useState, Fragment } from 'react';
import { useRouter } from 'next/navigation';
import { toggleUserActive } from '@/lib/actions/admin';
import { toast } from 'sonner';
import DataTable from '@/components/shared/DataTable';
import { 
  Search, 
  UserCheck, 
  UserX, 
  Users, 
  GraduationCap, 
  ChevronDown, 
  ChevronUp, 
  Phone, 
  Mail, 
  Calendar,
  Loader2,
  Shield,
  AlertCircle
} from 'lucide-react';

type StudentRow = {
  id: string;
  name: string;
  grade: number;
  school: string | null;
};

type UserRow = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  userType: 'PARENT' | 'TEACHER' | 'ADMIN';
  isActive: boolean;
  createdAt: Date;
  students: StudentRow[];
  teacher?: {
    id: string;
    subjects?: { subject: { name: string } }[];
  } | null;
};

type AdminUsersListProps = {
  users: UserRow[];
};

export default function AdminUsersList({ users }: AdminUsersListProps) {
  const router = useRouter();
  const [loadingUserId, setLoadingUserId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);

  const handleToggleStatus = async (userId: string, currentActive: boolean) => {
    if (confirm(`هل أنت متأكد من رغبتك في ${currentActive ? 'حظر' : 'تفعيل'} هذا المستخدم؟`)) {
      setLoadingUserId(userId);
      const res = await toggleUserActive(userId, !currentActive);
      setLoadingUserId(null);
      
      if (res.success) {
        toast.success(currentActive ? 'تم حظر المستخدم بنجاح' : 'تم تفعيل حساب المستخدم بنجاح');
        router.refresh();
      } else {
        toast.error(res.error || 'حدث خطأ ما');
      }
    }
  };

  const toggleExpand = (userId: string) => {
    setExpandedUserId(expandedUserId === userId ? null : userId);
  };

  // Filter and Search Logic
  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = 
      u.name.toLowerCase().includes(q) || 
      u.email.toLowerCase().includes(q) || 
      (u.phone && u.phone.includes(q));

    const matchesType = filterType === 'ALL' || u.userType === filterType;
    
    let matchesStatus = true;
    if (filterStatus === 'ACTIVE') matchesStatus = u.isActive === true;
    if (filterStatus === 'BANNED') matchesStatus = u.isActive === false;

    return matchesSearch && matchesType && matchesStatus;
  });

  return (
    <div className="space-y-4" dir="rtl">
      <DataTable
        data={filteredUsers}
        headers={['', 'المستخدم', 'البريد ورقم الهاتف', 'نوع الحساب', 'حالة الحساب', 'التحكم والعمليات']}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        searchPlaceholder="ابحث باسم المستخدم، البريد أو الهاتف..."
        toolbarChildren={
          <>
            <select 
              className="premium-input text-xs sm:text-sm w-36 cursor-pointer"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="ALL">جميع الأنواع</option>
              <option value="PARENT">أولياء الأمور</option>
              <option value="TEACHER">المعلمون</option>
              <option value="ADMIN">المدراء</option>
            </select>

            <select 
              className="premium-input text-xs sm:text-sm w-36 cursor-pointer"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="ALL">جميع الحالات</option>
              <option value="ACTIVE">النشطين فقط</option>
              <option value="BANNED">المحظورين فقط</option>
            </select>
          </>
        }
        emptyMessage="لا يوجد مستخدمين مطابقين لمعايير البحث الحالية."
        renderRow={(u) => {
          const typeDetails = {
            ADMIN: {
              label: 'مدير النظام',
              badgeClass: 'bg-violet-100 text-violet-700 dark:bg-violet-950/45 dark:text-violet-300'
            },
            TEACHER: {
              label: 'معلم',
              badgeClass: 'bg-blue-100 text-blue-700 dark:bg-blue-950/45 dark:text-blue-300'
            },
            PARENT: {
              label: 'ولي أمر',
              badgeClass: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/45 dark:text-emerald-300'
            }
          }[u.userType] || { label: u.userType, badgeClass: 'bg-slate-100 text-slate-700' };

          const isExpanded = expandedUserId === u.id;

          return (
            <Fragment key={u.id}>
              <tr 
                className={`border-b border-border hover:bg-accent/10 transition-colors ${
                  !u.isActive ? 'bg-rose-500/5 dark:bg-rose-950/5' : ''
                } ${isExpanded ? 'bg-accent/5' : ''}`}
              >
                <td className="p-4 text-center">
                  {u.userType === 'PARENT' || u.userType === 'TEACHER' ? (
                    <button
                      onClick={() => toggleExpand(u.id)}
                      className="p-1 rounded-lg hover:bg-accent text-muted-foreground transition-colors cursor-pointer"
                      title="عرض تفاصيل إضافية"
                    >
                      {isExpanded ? (
                        <ChevronUp className="h-4.5 w-4.5 text-primary" />
                      ) : (
                        <ChevronDown className="h-4.5 w-4.5" />
                      )}
                    </button>
                  ) : null}
                </td>

                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full overflow-hidden bg-primary/10 border border-primary/20 flex-shrink-0 flex items-center justify-center text-primary font-bold">
                      {u.name.charAt(0)}
                    </div>
                    <div>
                      <span className={`font-bold block text-foreground/80 ${!u.isActive ? 'line-through text-muted-foreground/80' : ''}`}>
                        {u.name}
                      </span>
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Calendar className="h-3 w-3" />
                        انضم في {new Date(u.createdAt).toLocaleDateString('ar-PS', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  </div>
                </td>

                <td className="p-4">
                  <div className="space-y-0.5">
                    <span className="text-xs text-foreground/75 flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5 text-muted-foreground/60" />
                      {u.email}
                    </span>
                    {u.phone ? (
                      <span className="text-xs text-foreground/75 flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5 text-muted-foreground/60" />
                        {u.phone}
                      </span>
                    ) : (
                      <span className="text-[10px] text-muted-foreground/40 italic block pe-5">لا يوجد هاتف</span>
                    )}
                  </div>
                </td>

                <td className="p-4">
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${typeDetails.badgeClass}`}>
                    {typeDetails.label}
                  </span>
                </td>

                <td className="p-4">
                  {u.isActive ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                      نشط
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300">
                      <span className="h-1.5 w-1.5 rounded-full bg-rose-600"></span>
                      محظور
                    </span>
                  )}
                </td>

                <td className="p-4 text-left">
                  {loadingUserId === u.id ? (
                    <Loader2 className="h-5 w-5 animate-spin ms-4 text-primary inline-block" />
                  ) : (
                    <div className="inline-flex items-center gap-2">
                      {u.isActive ? (
                        <button
                          onClick={() => handleToggleStatus(u.id, u.isActive)}
                          className="text-xs font-bold text-rose-600 hover:text-white border border-rose-600/20 hover:bg-rose-600 px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                          title="حظر الحساب ومنع تسجيل الدخول"
                        >
                          <UserX className="h-4 w-4" />
                          حظر الحساب
                        </button>
                      ) : (
                        <button
                          onClick={() => handleToggleStatus(u.id, u.isActive)}
                          className="text-xs font-bold text-emerald-600 hover:text-white border border-emerald-600/20 hover:bg-emerald-600 px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                          title="تفعيل وتنشيط الحساب"
                        >
                          <UserCheck className="h-4 w-4" />
                          تفعيل الحساب
                        </button>
                      )}
                    </div>
                  )}
                </td>
              </tr>

              {/* Inline Details Row */}
              {isExpanded && (
                <tr className="bg-muted/30 border-b border-border">
                  <td colSpan={6} className="p-0">
                    <div 
                      className="p-5 animate-fade-in-up space-y-4"
                      style={{ animationDuration: '200ms' }}
                    >
                      <div className="flex items-center justify-between border-b border-border/60 pb-3">
                        <h4 className="font-extrabold text-sm flex items-center gap-2 text-primary">
                          {u.userType === 'PARENT' ? (
                            <>
                              <Users className="h-4.5 w-4.5" />
                              قائمة الطلاب المسجلين ({u.students.length})
                            </>
                          ) : (
                            <>
                              <GraduationCap className="h-4.5 w-4.5" />
                              معلومات المعلم المهنية
                            </>
                          )}
                        </h4>
                      </div>

                      {/* Parent Role - List Students */}
                      {u.userType === 'PARENT' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                          {u.students.length === 0 ? (
                            <p className="text-xs text-muted-foreground italic col-span-full">لا يوجد طلاب مضافين لهذا الحساب بعد.</p>
                          ) : (
                            u.students.map((student) => (
                              <div key={student.id} className="p-3 bg-white dark:bg-slate-900 border border-border/80 rounded-3xl flex items-center gap-3">
                                <div className="h-8 w-8 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold text-xs">
                                  {student.name.charAt(0)}
                                </div>
                                <div className="space-y-0.5">
                                  <p className="text-xs font-bold text-foreground/80">{student.name}</p>
                                  <p className="text-[10px] text-muted-foreground">الصف {student.grade} - {student.school || 'مدرسة غير محددة'}</p>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      )}

                      {/* Teacher Role - List Specialization */}
                      {u.userType === 'TEACHER' && (
                        <div className="p-4 bg-white dark:bg-slate-900 border border-border/80 rounded-3xl space-y-2 max-w-md">
                          <div className="text-xs flex justify-between border-b border-border/40 pb-2">
                            <span className="text-muted-foreground font-semibold">التخصص الأساسي:</span>
                            <span className="font-bold text-foreground">{u.teacher?.subjects?.map(s => s.subject.name).join(', ') || 'غير محدد'}</span>
                          </div>
                          <div className="text-xs flex justify-between">
                            <span className="text-muted-foreground font-semibold">الملف التعريفي:</span>
                            <span className="font-bold text-primary">
                              حساب مسجل نشط في نظام المعلمين
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </Fragment>
          );
        }}
      />
    </div>
  );
}
