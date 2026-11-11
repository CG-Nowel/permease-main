import React, { useState, useMemo } from 'react';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  X,
  Inbox,
} from 'lucide-react';
import { Skeleton } from './Skeleton.tsx';
import { cn } from '../../lib/utils.ts';

export interface Column<T> {
  header: string;
  accessorKey?: keyof T;
  id?: string;
  cell?: (item: T, index: number) => React.ReactNode;
  className?: string;
  headerClassName?: string;
  width?: string;
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
}

export interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (item: T) => string | number;
  isLoading?: boolean;
  emptyMessage?: string;
  // Toolbar features
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  searchable?: boolean;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (val: string) => void;
  filterFn?: (item: T, search: string) => boolean;
  // Layout & fixed size
  minWidth?: string;
  minHeight?: string;
  fixedLayout?: boolean;
  // Pagination
  pagination?: boolean;
  pageSize?: number;
  pageSizeOptions?: number[];
  pageSizePosition?: 'header' | 'footer' | 'none';
  className?: string;
}

export function DataTable<T>({
  data,
  columns,
  keyExtractor,
  isLoading = false,
  emptyMessage = 'No matching records found.',
  title,
  subtitle,
  actions,
  searchable = false,
  searchPlaceholder = 'Search records...',
  searchValue,
  onSearchChange,
  filterFn,
  minWidth = 'min-w-full',
  minHeight = 'min-h-[580px]',
  fixedLayout = true,
  pagination = true,
  pageSize: initialPageSize = 10,
  pageSizeOptions = [10, 25, 50],
  pageSizePosition = 'header',
  className = '',
}: DataTableProps<T>) {
  // Local search state if not externally controlled
  const [internalSearch, setInternalSearch] = useState('');
  const search = searchValue !== undefined ? searchValue : internalSearch;

  const handleSearchChange = (val: string) => {
    if (onSearchChange) {
      onSearchChange(val);
    } else {
      setInternalSearch(val);
    }
  };

  // Sorting
  const [sortKey, setSortKey] = useState<keyof T | string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  // Filter data
  const filteredData = useMemo(() => {
    if (!search.trim()) return data;

    if (filterFn) {
      return data.filter((item) => filterFn(item, search.trim().toLowerCase()));
    }

    // Default search over all string or number fields in item
    const query = search.trim().toLowerCase();
    return data.filter((item) =>
      Object.values(item as Record<string, unknown>).some((val) => {
        if (val === null || val === undefined) return false;
        if (typeof val === 'string' || typeof val === 'number') {
          return String(val).toLowerCase().includes(query);
        }
        return false;
      })
    );
  }, [data, search, filterFn]);

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortKey) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aVal = (a as Record<string, unknown>)[sortKey as string];
      const bVal = (b as Record<string, unknown>)[sortKey as string];

      if (aVal === bVal) return 0;
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      }

      const strA = String(aVal).toLowerCase();
      const strB = String(bVal).toLowerCase();

      return sortDirection === 'asc' ? strA.localeCompare(strB) : strB.localeCompare(strA);
    });
  }, [filteredData, sortKey, sortDirection]);

  // Paginated slice
  const totalItems = sortedData.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const paginatedData = useMemo(() => {
    if (!pagination) return sortedData;
    const start = (safeCurrentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, safeCurrentPage, pageSize, pagination]);

  const handleSort = (column: Column<T>) => {
    const key = (column.accessorKey as string) || column.id;
    if (!key || column.sortable === false) return;

    if (sortKey === key) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else {
        setSortKey(null);
        setSortDirection('asc');
      }
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  const startRecord = totalItems === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1;
  const endRecord = Math.min(safeCurrentPage * pageSize, totalItems);

  return (
    <div
      className={cn(
        'w-full bg-white rounded-none border border-slate-200/90 shadow-xs flex flex-col justify-between overflow-hidden',
        minHeight,
        className
      )}
    >
      {/* Table Toolbar Header (if title, search, or actions provided) */}
      {(title || searchable || actions) && (
        <div className="p-4 sm:px-6 border-b border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white">
          {title ? (
            <div className="flex items-center gap-3">
              {pageSizePosition === 'header' && pagination && (
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <span className="text-slate-500 text-xs font-medium">Rows:</span>
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="py-1 px-2 text-xs bg-slate-50 border border-slate-200 rounded-xs outline-none text-slate-700 focus:ring-1 focus:ring-[#1E40AF] cursor-pointer shadow-2xs font-medium"
                  >
                    {pageSizeOptions.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div className="flex flex-col">
                <div className="flex items-center gap-2.5">
                  <span className="text-base font-bold text-[#0B1B3D] tracking-tight">{title}</span>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-none bg-slate-100 text-slate-600 border border-slate-200/70">
                    {totalItems} total
                  </span>
                </div>
                {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
              </div>
            </div>
          ) : (
            <div />
          )}

          <div className="flex flex-wrap items-center gap-2.5">
            {searchable && (
              <div className="relative w-full sm:w-72">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                />
                <input
                  type="text"
                  placeholder={searchPlaceholder}
                  value={search}
                  onChange={(e) => {
                    handleSearchChange(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full pl-8 pr-7 py-2 text-xs bg-slate-50/70 focus:bg-white rounded-xs border border-slate-200 focus:border-[#1E40AF] focus:ring-1 focus:ring-[#1E40AF]/20 outline-none transition-all placeholder:text-slate-400 text-slate-800"
                />
                {search && (
                  <button
                    onClick={() => {
                      handleSearchChange('');
                      setCurrentPage(1);
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>
            )}

            {actions && <div className="flex items-center gap-2">{actions}</div>}
          </div>
        </div>
      )}

      {/* Main Table Container with Fixed Layout & Consistent Spacious Cell Sizing */}
      <div className="overflow-x-auto w-full flex-1 flex flex-col justify-start">
        <table
          className={cn(
            'w-full text-left text-xs min-w-full',
            fixedLayout && 'table-fixed',
            minWidth
          )}
        >
          <thead className="border-b border-slate-200/90 bg-slate-50/90 text-slate-600 uppercase font-semibold text-[11px] tracking-wider select-none sticky top-0 z-10">
            <tr className="h-12">
              {columns.map((col, idx) => {
                const key = (col.accessorKey as string) || col.id || String(idx);
                const isSorted = sortKey === key;
                const canSort = col.sortable !== false && (col.accessorKey || col.id);

                return (
                  <th
                    key={key}
                    style={col.width ? { width: col.width } : undefined}
                    onClick={() => canSort && handleSort(col)}
                    className={cn(
                      'py-3.5 px-5 font-semibold transition-colors',
                      col.width,
                      col.align === 'center' && 'text-center',
                      col.align === 'right' && 'text-right',
                      canSort && 'cursor-pointer hover:bg-slate-100 hover:text-slate-900',
                      col.headerClassName
                    )}
                  >
                    <div
                      className={cn(
                        'flex items-center gap-1.5',
                        col.align === 'center' && 'justify-center',
                        col.align === 'right' && 'justify-end'
                      )}
                    >
                      <span>{col.header}</span>
                      {canSort && (
                        <span className="text-slate-400 shrink-0">
                          {isSorted ? (
                            sortDirection === 'asc' ? (
                              <ArrowUp size={12} className="text-[#1E40AF]" />
                            ) : (
                              <ArrowDown size={12} className="text-[#1E40AF]" />
                            )
                          ) : (
                            <ArrowUpDown size={11} className="opacity-40 hover:opacity-100" />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 font-medium text-slate-700 bg-white">
            {isLoading ? (
              Array.from({ length: pageSize }).map((_, r) => (
                <tr key={`loading-row-${r}`} className="h-[58px]">
                  {columns.map((_, c) => (
                    <td key={`loading-cell-${r}-${c}`} className="py-4 px-5">
                      <Skeleton className="h-4 w-3/4 rounded-xs" />
                    </td>
                  ))}
                </tr>
              ))
            ) : paginatedData.length > 0 ? (
              paginatedData.map((item, index) => {
                const key = keyExtractor(item);
                const isEven = index % 2 === 1;

                return (
                  <tr
                    key={key}
                    className={cn(
                      'h-[58px] transition-colors hover:bg-slate-50/80',
                      isEven ? 'bg-slate-50/30' : 'bg-white'
                    )}
                  >
                    {columns.map((col, cIdx) => {
                      const cellContent = col.cell
                        ? col.cell(item, index)
                        : col.accessorKey
                        ? (item[col.accessorKey] as React.ReactNode)
                        : null;

                      return (
                        <td
                          key={`cell-${key}-${cIdx}`}
                          className={cn(
                            'py-3.5 px-5 align-middle text-slate-700 overflow-hidden text-ellipsis',
                            col.align === 'center' && 'text-center',
                            col.align === 'right' && 'text-right',
                            col.className
                          )}
                        >
                          {cellContent}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={columns.length} className="py-16 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <div className="w-10 h-10 rounded-md bg-slate-100 flex items-center justify-center text-slate-400 border border-slate-200/60">
                      <Inbox size={20} />
                    </div>
                    <p className="text-xs font-semibold text-slate-600">{emptyMessage}</p>
                    {search && (
                      <p className="text-[11px] text-slate-400">
                        Try searching with a different keyword or clearing filters.
                      </p>
                    )}
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Fixed Pagination Footer */}
      {pagination && (
        <div className="p-3.5 sm:px-6 border-t border-slate-200/80 bg-white flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span>
              Showing <strong className="font-semibold text-slate-800">{startRecord}</strong> to{' '}
              <strong className="font-semibold text-slate-800">{endRecord}</strong> of{' '}
              <strong className="font-semibold text-slate-800">{totalItems}</strong> entries
            </span>

            {/* Page Size Selector */}
            {pageSizePosition !== 'header' && pageSizePosition !== 'none' && (
              <div className="hidden sm:flex items-center gap-1.5 ml-3 pl-3 border-l border-slate-200">
                <span className="text-slate-400 text-[11px]">Rows:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="py-1 px-1.5 text-xs bg-slate-50 border border-slate-200 rounded-none outline-none text-slate-700 focus:ring-1 focus:ring-[#1E40AF]"
                >
                  {pageSizeOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={safeCurrentPage <= 1}
              className="p-1.5 rounded-none border border-slate-200 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer text-slate-600"
              title="First Page"
            >
              <ChevronsLeft size={14} />
            </button>
            <button
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={safeCurrentPage <= 1}
              className="p-1.5 rounded-none border border-slate-200 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer text-slate-600"
              title="Previous Page"
            >
              <ChevronLeft size={14} />
            </button>

            <span className="px-3 py-1 font-semibold text-slate-700 select-none">
              Page {safeCurrentPage} of {Math.max(1, totalPages)}
            </span>

            <button
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={safeCurrentPage >= totalPages}
              className="p-1.5 rounded-none border border-slate-200 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer text-slate-600"
              title="Next Page"
            >
              <ChevronRight size={14} />
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={safeCurrentPage >= totalPages}
              className="p-1.5 rounded-none border border-slate-200 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer text-slate-600"
              title="Last Page"
            >
              <ChevronsRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
