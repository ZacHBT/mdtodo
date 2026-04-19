"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useVault } from "@/components/VaultProvider";
import { ObsidianTask } from "@/lib/types";
import { CheckCircle2, Circle, Clock, LayoutGrid, ListTodo, Settings, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";

export default function Dashboard() {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !config) {
      router.push("/setup");
    }
  }, [config, isLoading, router]);

  useEffect(() => {
    if (service) {
      loadTodayTasks();
    }
  }, [service]);

  const loadTodayTasks = async () => {
    if (!service) return;
    setIsFetching(true);
    setError(null);
    try {
      const files = await service.getFiles("2_Task");
      const today = format(new Date(), "yyyy-MM-dd");
      
      const loadedTasks: ObsidianTask[] = [];
      for (const file of files) {
        if (file.name.endsWith(".md")) {
          const task = await service.readMarkdown(file.path);
          if (task && task.date === today && !task.status) {
            loadedTasks.push(task);
          }
        }
      }
      setTasks(loadedTasks);
    } catch (error: any) {
      console.error("Failed to load tasks:", error);
      if (error.status === 401) {
        setError("GitHub Token 無效或已過期，請重新設定。");
      } else if (error.status === 404) {
        setError("找不到指定的 Repository 或 '2_Task' 資料夾。");
      } else {
        setError("連線失敗，請檢查網路或 GitHub 設定。");
      }
    } finally {
      setIsFetching(false);
    }
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
    <div className="flex-1 bg-[#1e1e1e] pb-20 overflow-y-auto">
      {/* Header */}
      <header className="p-6 pt-12">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">今日專注</h1>
            <p className="text-gray-400 font-medium">{format(new Date(), "yyyy年MM月dd日 EEEE")}</p>
          </div>
          <button 
            onClick={() => router.push("/setup")}
            className="p-2.5 bg-gray-800/80 hover:bg-gray-700 rounded-xl text-gray-400 hover:text-white transition-colors border border-gray-700"
          >
            <Settings size={20} />
          </button>
        </div>

        {error ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-6 rounded-2xl bg-red-900/20 border border-red-500/30 text-center"
          >
            <div className="text-red-400 font-medium mb-3">{error}</div>
            <button 
              onClick={() => router.push("/setup")}
              className="px-6 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg text-sm transition-all"
            >
              重新前往設定頁面
            </button>
          </motion.div>
        ) : (
          <>
            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="glass-dark p-5 rounded-2xl border border-white/5">
                <div className="text-purple-400 mb-2">
                  <ListTodo size={22} />
                </div>
                <div className="text-3xl font-bold text-white">{tasks.length}</div>
                <div className="text-xs text-gray-500 font-bold uppercase tracking-wider">待辦任務</div>
              </div>
              <div className="glass-dark p-5 rounded-2xl border border-white/5">
                <div className="text-blue-400 mb-2">
                  <LayoutGrid size={22} />
                </div>
                <div className="text-3xl font-bold text-white">PARA</div>
                <div className="text-xs text-gray-500 font-bold uppercase tracking-wider">筆記系統</div>
              </div>
            </div>

            {/* Task List */}
            <div className="space-y-4">
              <div className="flex justify-between items-center px-2">
                <h2 className="text-xs font-bold text-gray-500 uppercase tracking-[0.2em]">任務清單</h2>
                {isFetching && <Loader2 className="animate-spin text-gray-500" size={14} />}
              </div>
              
              <AnimatePresence>
                {tasks.length > 0 ? (
                  tasks.map((task) => (
                    <motion.div
                      key={task.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="glass-dark p-5 rounded-2xl flex items-start gap-4 active:scale-[0.98] transition-all border border-white/5 hover:border-white/10"
                      onClick={() => router.push(`/view/2_Task/${task.id}`)}
                    >
                      <div className="mt-1 text-gray-600">
                        <Circle size={24} strokeWidth={1.5} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-white font-semibold mb-1 truncate">{task.title}</h3>
                        <div className="flex items-center gap-2 text-[10px]">
                          <span className="px-2 py-0.5 bg-purple-900/40 text-purple-300 rounded-md border border-purple-500/20 font-bold">
                            {task.project?.replace(/\[\[|\]\]/g, "") || "Inbox"}
                          </span>
                          <span className="text-gray-500 flex items-center gap-1 font-medium">
                            <Clock size={10} /> {task.date}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  !isFetching && (
                    <div className="glass-dark rounded-2xl p-12 text-center border border-dashed border-white/5">
                      <div className="text-gray-500 font-medium italic">今天沒有待辦任務</div>
                    </div>
                  )
                )}
              </AnimatePresence>
            </div>
          </>
        )}
      </header>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 h-16 bg-[#161616]/80 backdrop-blur-lg border-t border-gray-800 flex items-center justify-around px-4">
        <button className="flex flex-col items-center gap-1 text-purple-500">
          <ListTodo size={24} />
          <span className="text-[10px]">任務</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-gray-500 hover:text-white">
          <LayoutGrid size={24} />
          <span className="text-[10px]">專案</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-gray-500 hover:text-white">
          <Settings size={24} />
          <span className="text-[10px]">設定</span>
        </button>
      </nav>
    </div>
  );
}
