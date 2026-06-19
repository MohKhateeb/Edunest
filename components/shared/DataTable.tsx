import { ReactNode } from 'react';
import { Search } from 'lucide-react';

interface DataTableProps<T> {
  data: T[];
  headers: string[];
  searchQuery?: string;
  setSearchQuery?: (val: string) => void;
  searchPlaceholder?: string;
  toolbarChildren?: ReactNode;
  renderRow: (item: T, index: number) => ReactNode;
  emptyMessage?: string;
  
  // Pagination
  currentPage?: number;
  totalPages?: number;
  totalItems?: number;
  itemsPerPage?: number;
  onPageChange?: (page: number) => void;
  paginationLabel?: string;
}

export default function DataTable<T>({
  data,
  headers,
  searchQuery,
  setSearchQuery,
  searchPlaceholder = 'بحث...',
  toolbarChildren,
  renderRow,
  emptyMessage = 'لا توجد نتائج مطابقة للبحث.',
  currentPage = 1,
  totalPages = 1,
  totalItems = 0,
  itemsPerPage = 10,
  onPageChange,
  paginationLabel = 'عنصر'
}: DataTableProps<T>) {
  return (
    <div className="space-y-4" dir="rtl">
      {/* Search & Filters Toolbar */}
      {(setSearchQuery !== undefined || toolbarChildren) && (
        <div className="flex flex-col sm:flex-row gap-4 bg-card border border-border p-4 rounded-xl shadow-sm">
          {setSearchQuery !== undefined && (
            <div className="relative flex-1">
              <Search className="absolute end-3 top-3 h-4 w-4 text-muted-foreground/60" />
              <input
                type="text"
                placeholder={searchPlaceholder}
                className="premium-input w-full pe-9 text-xs sm:text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          )}
          {toolbarChildren && <div className="flex gap-2">{toolbarChildren}</div>}
        </div>
      )}

      {/* Table Content */}
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-muted/55 text-muted-foreground font-semibold border-b border-border">
                {headers.map((h, i) => (
                  <th key={i} className={`p-4 ${i === headers.length - 1 ? 'text-left' : ''}`}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.length === 0 ? (
                <tr>
                  <td colSpan={headers.length} className="p-10 text-center text-xs text-muted-foreground">
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                data.map((item, index) => renderRow(item, index))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {onPageChange && totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-muted/20">
            <div className="text-xs text-muted-foreground">
              عرض {((currentPage - 1) * itemsPerPage) + 1} إلى {Math.min(currentPage * itemsPerPage, totalItems)} من {totalItems} {paginationLabel}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1.5 border border-border text-xs rounded-lg hover:bg-muted disabled:opacity-50 transition-colors cursor-pointer"
              >
                السابق
              </button>
              <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 border border-border text-xs rounded-lg hover:bg-muted disabled:opacity-50 transition-colors cursor-pointer"
              >
                التالي
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
