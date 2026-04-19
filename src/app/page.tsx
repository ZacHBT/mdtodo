"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useVault } from "@/components/VaultProvider";
import { ObsidianTask } from "@/lib/types";
import { CheckCircle2, Circle, Clock, LayoutGrid, ListTodo, Settings, Loader2, Calendar as CalendarIcon, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { CalendarView } from "@/components/CalendarView";

export default function Dashboard() {
  const { config, service, isLoading } = useVault();
  const router = useRouter();
  const [tasks, setTasks] = useState<ObsidianTask[]>([]);
  const [allTasks, setAllTasks] = useState<ObsidianTask[]>([]);
  const [projectCount, setProjectCount] = useState(0);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !config) {
      router.push("/setup");
    }
  }, [config, isLoading, router]);

  useEffect(() => {
    if (service) {
      loadDashboardData();
    }
  }, [service, currentMonth]);

  const loadDashboardData = async () => {
    if (!service) return;
    setIsFetching(true);
    setError(null);
    try {
      // 0. Auto-discover paths
      const projectPath = await service.findPathWithPrefix("1_") || "1_Project";
      const taskPath = await service.findPathWithPrefix("2_") || "2_Task";

      // 1. Fetch ALL tasks for the calendar (needed for distribution)
      const taskFiles = await service.getFiles(taskPath);
      const todayStr = format(selectedDate, "yyyy-MM-dd");
      
      const dayTasks: ObsidianTask[] = [];
      const allLoadedTasks: ObsidianTask[] = [];

      for (const file of taskFiles) {
        if (file.name.endsWith(".md")) {
          const task = await service.readMarkdown(file.path);
          if (task) {
            allLoadedTasks.push(task);
            if (task.date === todayStr && !task.status) {
              dayTasks.push(task);
            }
          }
        }
      }
      setTasks(dayTasks);
      setAllTasks(allLoadedTasks);

      // 2. Count Projects
      const projFiles = await service.getFiles(projectPath);
      setProjectCount(projFiles.filter(f => f.name.endsWith(".md") && !f.name.includes("專案總覽")).length);

    } catch (error: any) {
      console.error("Failed to load data:", error);
      setError("無法同步數據，請檢查您的 Token 與 Repository。");
    } finally {
      setIsFetching(false);
    }
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    // 快速過濾已載入的任務
    const todayStr = format(date, "yyyy-MM-dd");
    const filtered = allTasks.filter(t => t.date === todayStr && !t.status);
    setTasks(filtered);
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#1e1e1e]">
        <Loader2 className="animate-spin text-purple-500" size={32} />
      </div>
    );
  }

  if (!config) return null;

  return (
    <div className="flex-1 bg-[#1e1e1e] pb-24 overflow-y-auto overflow-x-hidden">
      {/* Header */}
      <header className="p-6 pt-12 flex items-center justify-between">
        <div>
          <h2 className="text-gray-500 font-bold uppercase tracking-widest text-[10px] mb-1">Obsidian Web PARA</h2>
          <h1 className="text-3xl font-bold text-white tracking-tight">你好, Zac</h1>
        </div>
        <button 
          onClick={() => router.push("/setup")}
          className="p-3 bg-gray-800 rounded-2xl text-gray-400 hover:text-white transition-colors"
        >
          <Settings size={20} />
        </button>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 px-6 mb-8 mt-2">
        <motion.div 
          whileHover={{ y: -4 }}
          onClick={() => router.push("/tasks")}
          className="glass-purple p-5 rounded-3xl cursor-pointer"
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 bg-purple-500/20 rounded-lg text-purple-300">
              <ListTodo size={18} />
            </div>
          </div>
          <div className="text-3xl font-bold text-white mb-1">{allTasks.filter(t => !t.status).length}</div>
          <div className="text-purple-300/60 text-[10px] font-bold uppercase tracking-wider">待辦任務</div>
        </motion.div>

        <motion.div 
          whileHover={{ y: -4 }}
          onClick={() => router.push("/projects")}
          className="glass-dark p-5 rounded-3xl cursor-pointer"
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 bg-blue-500/20 rounded-lg text-blue-300">
              <LayoutGrid size={18} />
            </div>
          </div>
          <div className="text-3xl font-bold text-white mb-1">{projectCount}</div>
          <div className="text-blue-300/60 text-[10px] font-bold uppercase tracking-wider">活躍專案</div>
        </motion.div>
      </div>

      {/* Calendar Section */}
      <div className="px-6 mb-8">
        <CalendarView 
          tasks={allTasks.map(t => ({ date: t.date, status: t.status }))}
          currentDate={currentMonth}
          onMonthChange={setCurrentMonth}
          onDateClick={handleDateClick}
        />
      </div>

      {/* Task List Section */}
      <div className="px-6 space-y-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <CalendarIcon size={18} className="text-purple-500" />
            {format(selectedDate, "MM月dd日")} 的任務
          </h3>
          <button 
            onClick={() => router.push("/tasks")}
            className="text-[10px] font-bold text-gray-500 uppercase tracking-widest hover:text-purple-400"
          >
            查看全部
          </button>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-900/20 border border-red-500/30 text-red-400 text-xs text-center">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-3">
          <AnimatePresence>
            {tasks.length > 0 ? (
              tasks.map((task, index) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => router.push(`/view/${task.path}`)}
                  className="glass-dark p-4 rounded-2xl flex items-center gap-4 border border-white/5 active:scale-[0.98] transition-all cursor-pointer"
                >
                  <div className="w-1.5 h-10 bg-purple-500 rounded-full" />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-white font-semibold text-sm truncate">{task.title}</h4>
                    {task.project && (
                      <span className="text-[10px] font-bold text-purple-400/60 uppercase tracking-widest">
                        {task.project.replace(/\[\[|\]\]/g, "")}
                      </span>
                    )}
                  </div>
                </motion.div>
              ))
            ) : (
              !isFetching && (
                <div className="text-center py-12 rounded-3xl bg-gray-800/20 border border-dashed border-gray-700">
                  <div className="text-gray-600 mb-2">
                    <Sparkles size={32} className="mx-auto opacity-10" />
                  </div>
                  <p className="text-gray-500 text-xs text-center">這天沒有待辦任務</p>
                </div>
              )
            )}
          </AnimatePresence>
          {isFetching && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="animate-spin text-purple-500/50" size={24} />
            </div>
          )}
        </div>
      </div>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 h-16 bg-[#161616]/80 backdrop-blur-xl border-t border-white/5 flex items-center justify-around px-4 z-50">
        <button 
          className="flex flex-col items-center gap-1 text-blue-500 active:scale-90 transition-transform"
        >
          <ListTodo size={24} />
          <span className="text-[10px] font-bold">今天</span>
        </button>
        <button 
          onClick={() => router.push("/tasks")}
          className="flex flex-col items-center gap-1 text-gray-500 hover:text-white active:scale-90 transition-transform"
        >
          <CalendarIcon size={24} />
          <span className="text-[10px] font-bold">所有任務</span>
        </button>
        <button 
          onClick={() => router.push("/projects")}
          className="flex flex-col items-center gap-1 text-gray-500 hover:text-white active:scale-90 transition-transform"
        >
          <LayoutGrid size={24} />
          <span className="text-[10px] font-bold">專案</span>
        </button>
      </nav>
    </div>
  );
}
