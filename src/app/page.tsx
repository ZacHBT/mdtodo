"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useVault } from "@/components/VaultProvider";
import { ObsidianTask } from "@/lib/types";
import { CheckCircle2, Circle, Clock, LayoutGrid, ListTodo, Settings, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";

export default function Dashboard() {
  const { config, service, isLoading } = useVault();
  const router = useRouter();
  const [tasks, setTasks] = useState<ObsidianTask[]>([]);
  const [isFetching, setIsFetching] = useState(false);

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
    try {
      // 取得 2_Task 資料夾下的檔案
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
    } catch (error) {
      console.error("Failed to load tasks:", error);
    } finally {
      setIsFetching(false);
    }
  };

  if (isLoading || !config) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#1e1e1e]">
        <Loader2 className="animate-spin text-purple-500" size={32} />
      </div>
    );
  }

  return (
    <div className="flex-1 bg-[#1e1e1e] pb-20">
      {/* Header */}
      <header className="p-6 pt-12">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">今日專注</h1>
            <p className="text-gray-400">{format(new Date(), "yyyy年MM月dd日 EEEE")}</p>
          </div>
          <button 
            onClick={() => router.push("/setup")}
            className="p-2 bg-gray-800 rounded-full text-gray-400 hover:text-white"
          >
            <Settings size={20} />
          </button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="glass-dark p-4 rounded-2xl">
            <div className="text-purple-400 mb-1">
              <ListTodo size={20} />
            </div>
            <div className="text-2xl font-bold text-white">{tasks.length}</div>
            <div className="text-xs text-gray-500 uppercase">待辦任務</div>
          </div>
          <div className="glass-dark p-4 rounded-2xl">
            <div className="text-blue-400 mb-1">
              <LayoutGrid size={20} />
            </div>
            <div className="text-2xl font-bold text-white">7</div>
            <div className="text-xs text-gray-500 uppercase">進行中專案</div>
          </div>
        </div>

        {/* Task List */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-2">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-widest">任務清單</h2>
            {isFetching && <Loader2 className="animate-spin text-gray-500" size={14} />}
          </div>
          
          <AnimatePresence>
            {tasks.length > 0 ? (
              tasks.map((task) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="glass-dark p-4 rounded-2xl flex items-start gap-4 active:scale-[0.98] transition-all"
                  onClick={() => router.push(`/view/2_Task/${task.id}`)}
                >
                  <button className="mt-1 text-gray-500">
                    <Circle size={24} />
                  </button>
                  <div className="flex-1">
                    <h3 className="text-white font-medium mb-1">{task.title}</h3>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="px-2 py-0.5 bg-purple-900/40 text-purple-300 rounded-full border border-purple-500/30">
                        {task.project?.replace(/\[\[|\]\]/g, "") || "無專案"}
                      </span>
                      <span className="text-gray-500 flex items-center gap-1">
                        <Clock size={12} /> {task.date}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              !isFetching && (
                <div className="text-center py-12 text-gray-600">
                  今天沒有待辦任務，休息一下吧！
                </div>
              )
            )}
          </AnimatePresence>
        </div>
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
