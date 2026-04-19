import React, { useMemo } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, getDay, addMonths, subMonths } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface CalendarViewProps {
  tasks: { date: string; status: boolean }[];
  currentDate: Date;
  onDateClick?: (date: Date) => void;
  onMonthChange: (date: Date) => void;
}

export function CalendarView({ tasks, currentDate, onDateClick, onMonthChange }: CalendarViewProps) {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  const daysOfWeek = ["日", "一", "二", "三", "四", "五", "六"];

  // 取得該月第一天是星期幾
  const startDay = getDay(monthStart);
  const blanks = Array(startDay).fill(null);

  const taskMap = useMemo(() => {
    const map: Record<string, { total: number; completed: number }> = {};
    tasks.forEach(t => {
      if (!t.date) return;
      if (!map[t.date]) map[t.date] = { total: 0, completed: 0 };
      map[t.date].total++;
      if (t.status) map[t.date].completed++;
    });
    return map;
  }, [tasks]);

  return (
    <div className="bg-[#1a1a1a] rounded-3xl p-6 border border-white/5 shadow-2xl">
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-xl font-bold text-white tracking-tight">
          {format(currentDate, "yyyy年 MM月")}
        </h3>
        <div className="flex gap-2">
          <button 
            onClick={() => onMonthChange(subMonths(currentDate, 1))}
            className="p-2 hover:bg-gray-800 rounded-full transition-colors text-gray-400"
          >
            <ChevronLeft size={20} />
          </button>
          <button 
            onClick={() => onMonthChange(addMonths(currentDate, 1))}
            className="p-2 hover:bg-gray-800 rounded-full transition-colors text-gray-400"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {daysOfWeek.map(d => (
          <div key={d} className="text-center text-[10px] font-bold text-gray-500 uppercase tracking-widest py-2">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2">
        {blanks.map((_, i) => (
          <div key={`blank-${i}`} className="aspect-square" />
        ))}
        {days.map(day => {
          const dateStr = format(day, "yyyy-MM-dd");
          const dayTasks = taskMap[dateStr];
          const isToday = isSameDay(day, new Date());
          
          return (
            <button
              key={dateStr}
              onClick={() => onDateClick?.(day)}
              className={`relative aspect-square rounded-xl flex flex-col items-center justify-center transition-all hover:bg-white/10 group ${
                isToday ? 'bg-purple-600/20 ring-1 ring-purple-500/50' : 'bg-gray-800/20'
              }`}
            >
              <span className={`text-xs font-semibold ${isToday ? 'text-purple-400' : 'text-gray-400 group-hover:text-white'}`}>
                {format(day, "d")}
              </span>
              
              {dayTasks && (
                <div className="mt-1 flex gap-0.5">
                  {dayTasks.total > 0 && (
                    <div className={`w-1 h-1 rounded-full ${dayTasks.completed === dayTasks.total ? 'bg-green-500' : 'bg-purple-500'}`} />
                  )}
                </div>
              )}

              {dayTasks && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-purple-600 rounded-full text-[8px] flex items-center justify-center text-white scale-0 group-hover:scale-100 transition-transform">
                  {dayTasks.total}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
