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
    <div className="bg-[#1a1a1a] rounded-3xl p-4 border border-white/5 shadow-2xl">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-white tracking-tight">
          {format(currentDate, "yyyy年 MM月")}
        </h3>
        <div className="flex gap-1">
          <button 
            onClick={() => onMonthChange(subMonths(currentDate, 1))}
            className="p-1.5 hover:bg-gray-800 rounded-full transition-colors text-gray-400"
          >
            <ChevronLeft size={16} />
          </button>
          <button 
            onClick={() => onMonthChange(addMonths(currentDate, 1))}
            className="p-1.5 hover:bg-gray-800 rounded-full transition-colors text-gray-400"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-0.5 mb-1">
        {daysOfWeek.map(d => (
          <div key={d} className="text-center text-[9px] font-bold text-gray-600 uppercase tracking-tighter py-1">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
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
              className={`relative aspect-square rounded-lg flex flex-col items-center justify-center transition-all hover:bg-white/10 group ${
                isToday ? 'bg-purple-600/30 ring-1 ring-purple-500/50 scale-105 z-10' : 'bg-gray-800/10'
              }`}
            >
              <span className={`text-[10px] font-bold ${isToday ? 'text-white' : 'text-gray-500 group-hover:text-white'}`}>
                {format(day, "d")}
              </span>
              
              {dayTasks && dayTasks.total > 0 && (
                <div className="mt-0.5 flex gap-0.5">
                  <div className={`w-0.5 h-0.5 rounded-full ${dayTasks.completed === dayTasks.total ? 'bg-green-400' : 'bg-purple-400'}`} />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
