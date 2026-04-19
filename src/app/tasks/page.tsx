"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useVault } from "@/components/VaultProvider";
import { ListTodo, Search, Filter, Loader2, Calendar as CalendarIcon, ArrowLeft, CheckCircle2, Circle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";

export default function TasksPage() {
  const { config, service, isLoading } = useVault();
  const router = useRouter();
  const [tasks, setTasks] = useState<any[]>([]);
  const [isFetching, setIsFetching] = useState(false);
  const [search, setSearch] = useState("");
  const [filterProject, setFilterProject] = useState("all");

  useEffect(() => {
    if (!isLoading && !config) {
      router.push("/setup");
    }
  }, [config, isLoading, router]);

  useEffect(() => {
    if (service) {
      fetchAllTasks();
    }
  }, [service]);

  const fetchAllTasks = async () => {
    if (!service) return;
    setIsFetching(true);
    try {
      const taskPath = await service.findPathWithPrefix("2_") || "2_Task";
      const files = await service.getFiles(taskPath);
      const mdFiles = files.filter(f => f.name.endsWith(".md"));
      
      const loadedTasks = [];
      for (const file of mdFiles) {
        const t = await service.readMarkdown(file.path);
        if (t) loadedTasks.push(t);
      }
      setTasks(loadedTasks);
    } catch (error) {
      console.error("Failed to fetch all tasks:", error);
    } finally {
      setIsFetching(false);
    }
  };

  const filteredTasks = tasks.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(search.toLowerCase()) || 
                          (t.project && t.project.toLowerCase().includes(search.toLowerCase()));
    const matchesProject = filterProject === "all" || t.project === filterProject;
    return matchesSearch && matchesProject;
  });

  const projects = Array.from(new Set(tasks.map(t => t.project).filter(Boolean)));

  if (isLoading || isFetching && tasks.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#1e1e1e]">
        <div className="text-center">
          <Loader2 className="animate-spin text-purple-500 mx-auto mb-4" size={32} />
          <p className="text-gray-400">正在同步所有任務...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-[#1e1e1e] pb-20 overflow-y-auto">
      <header className="p-6 pt-12">
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => router.push("/")} className="p-2 bg-gray-800 rounded-full text-gray-400">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-3xl font-bold text-white tracking-tight">所有任務</h1>
        </div>

        {/* Filters */}
        <div className="space-y-4 mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
            <input 
              type="text"
              placeholder="搜尋任務或專案..."
              className="w-full bg-[#252525] border-none rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-gray-600 focus:ring-2 focus:ring-purple-500 transition-all font-medium"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
            <button 
              onClick={() => setFilterProject("all")}
              className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${filterProject === 'all' ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-400'}`}
            >
              全部
            </button>
            {projects.map(p => (
              <button 
                key={p}
                onClick={() => setFilterProject(p)}
                className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${filterProject === p ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-400'}`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Task List */}
        <div className="grid grid-cols-1 gap-4">
          <AnimatePresence>
            {filteredTasks.map((t, index) => (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.02 }}
                onClick={() => router.push(`/view/${t.path}`)}
                className="glass-dark p-5 rounded-2xl flex items-center gap-4 border border-white/5 active:scale-[0.98] transition-all cursor-pointer"
              >
                <div className={`p-2 rounded-full ${t.status ? 'text-green-400' : 'text-gray-600'}`}>
                  {t.status ? <CheckCircle2 size={24} /> : <Circle size={24} />}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className={`font-semibold truncate ${t.status ? 'text-gray-500 line-through' : 'text-white'}`}>
                    {t.title}
                  </h3>
                  <div className="flex items-center gap-3 mt-1">
                    {t.project && (
                      <span className="text-[10px] font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-md uppercase tracking-wide">
                        {t.project}
                      </span>
                    )}
                    <span className="text-[10px] text-gray-500 flex items-center gap-1">
                      <CalendarIcon size={12} /> {t.date}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {filteredTasks.length === 0 && !isFetching && (
            <div className="text-center py-20 text-gray-600">
              <ListTodo size={48} className="mx-auto mb-4 opacity-20" />
              <p>找不到匹配的任務</p>
            </div>
          )}
        </div>
      </header>
    </div>
  );
}
