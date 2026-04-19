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
  const [error, setError] = useState<string | null>(null);
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
    setError(null);
    
    try {
      // 尋找路徑邏輯優化
      let taskPath = "";
      try {
        taskPath = await service.findPathWithPrefix("2_") || "2_Task";
      } catch (e) {
        console.warn("Path detection failed, defaulting to 2_Task");
        taskPath = "2_Task";
      }

      const files = await service.getFiles(taskPath);
      if (!files || files.length === 0) {
        setTasks([]);
        setIsFetching(false);
        return;
      }

      const mdFiles = files.filter(f => f.name.endsWith(".md"));
      const allLoadedTasks: any[] = [];
      const batchSize = 8; // 稍微調小每批次數量以提高穩定性
      const targetFiles = mdFiles.slice(0, 150);

      for (let i = 0; i < targetFiles.length; i += batchSize) {
        const batch = targetFiles.slice(i, i + batchSize);
        const batchResults = await Promise.all(
          batch.map(async (file) => {
            try {
              return await service.readMarkdown(file.path);
            } catch (e) {
              console.warn(`Error loading task ${file.path}:`, e);
              return null;
            }
          })
        );
        
        const validResults = batchResults.filter(Boolean);
        allLoadedTasks.push(...validResults);
        
        // 立即更新 UI
        setTasks([...allLoadedTasks]);
      }
    } catch (err: any) {
      console.error("Critical failure during task fetch:", err);
      // 詳細錯誤訊息幫助除錯
      setError(err?.message || "無法從 GitHub 抓取資料，請檢查 Token 與網路連線。");
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

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#1e1e1e]">
        <Loader2 className="animate-spin text-purple-500" size={32} />
      </div>
    );
  }

  // 錯誤處理 UI
  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#1e1e1e] p-6 text-center">
        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
          <ListTodo className="text-red-500" size={32} />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">同步失敗</h2>
        <p className="text-gray-400 mb-8 max-w-sm">{error}</p>
        <div className="flex gap-4">
          <button 
            onClick={() => router.push("/setup")}
            className="px-6 py-3 bg-gray-800 text-white rounded-2xl font-bold"
          >
            檢查設定
          </button>
          <button 
            onClick={() => fetchAllTasks()}
            className="px-6 py-3 bg-purple-600 text-white rounded-2xl font-bold"
          >
            點此重試
          </button>
        </div>
      </div>
    );
  }

  if (isFetching && tasks.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#1e1e1e]">
        <div className="text-center">
          <Loader2 className="animate-spin text-purple-500 mx-auto mb-4" size={32} />
          <p className="text-gray-400 font-bold">正在讀取 Obsidian 檔案...</p>
          <p className="text-gray-600 text-xs mt-2 italic">這需要一點時間，請保持連線</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-[#1e1e1e] pb-20 overflow-y-auto w-full">
      <header className="p-6 pt-12 max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => router.push("/")} className="p-3 bg-gray-800 rounded-2xl text-white hover:bg-gray-700 transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight">所有任務</h1>
            <p className="text-gray-500 text-sm font-bold uppercase tracking-widest">{tasks.length} 個同步項目</p>
          </div>
        </div>

        {/* Filters */}
        <div className="space-y-4 mb-10">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-purple-500 transition-colors" size={20} />
            <input 
              type="text"
              placeholder="搜尋任務名稱、專案關鍵字..."
              className="w-full bg-[#2a2a2a] border-2 border-white/5 rounded-2xl py-5 pl-12 pr-4 text-white placeholder:text-gray-600 focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 transition-all font-bold text-lg"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-none">
            <button 
              onClick={() => setFilterProject("all")}
              className={`px-6 py-2.5 rounded-xl text-sm font-black whitespace-nowrap transition-all border-2 ${filterProject === 'all' ? 'bg-purple-600 border-purple-400 text-white' : 'bg-[#2a2a2a] border-white/5 text-gray-400'}`}
            >
              全部顯示
            </button>
            {projects.map(p => (
              <button 
                key={p}
                onClick={() => setFilterProject(p)}
                className={`px-6 py-2.5 rounded-xl text-sm font-black whitespace-nowrap transition-all border-2 ${filterProject === p ? 'bg-purple-600 border-purple-400 text-white' : 'bg-[#2a2a2a] border-white/5 text-gray-400'}`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Task List */}
        <div className="grid grid-cols-1 gap-5">
          <AnimatePresence mode="popLayout">
            {filteredTasks.map((t, index) => (
              <motion.div
                key={t.id || t.path}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                onClick={() => router.push(`/view/${encodeURIComponent(t.path)}`)}
                className="bg-[#2a2a2a] p-6 rounded-3xl flex items-center gap-5 border-2 border-white/5 hover:border-purple-500/50 active:scale-[0.98] transition-all cursor-pointer group shadow-xl"
              >
                <div className={`p-1 rounded-full transition-colors ${t.status ? 'text-green-400' : 'text-gray-600 group-hover:text-purple-400'}`}>
                  {t.status ? <CheckCircle2 size={30} strokeWidth={2.5} /> : <Circle size={30} strokeWidth={2.5} />}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className={`text-xl font-bold truncate leading-tight ${t.status ? 'text-gray-500 line-through' : 'text-white'}`}>
                    {t.title}
                  </h3>
                  <div className="flex flex-wrap items-center gap-3 mt-3">
                    {t.project && (
                      <span className="text-[11px] font-black text-white bg-purple-600 px-3 py-1 rounded-lg uppercase tracking-wider">
                        {t.project}
                      </span>
                    )}
                    <span className="text-xs font-bold text-gray-500 flex items-center gap-1.5 bg-black/30 px-3 py-1 rounded-lg">
                      <CalendarIcon size={14} className="text-purple-400" /> 
                      {t.date || "未排程"}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {!isFetching && filteredTasks.length === 0 && (
            <div className="text-center py-24 bg-[#2a2a2a]/30 rounded-3xl border-2 border-dashed border-white/5">
              <ListTodo size={64} className="mx-auto mb-6 text-gray-700 opacity-50" />
              <p className="text-xl font-bold text-gray-500">找不到任何符合條件的任務</p>
              <button 
                onClick={() => {setSearch(""); setFilterProject("all");}}
                className="mt-6 text-purple-400 font-bold hover:underline"
              >
                清除所有過濾條件
              </button>
            </div>
          )}
          
          {isFetching && tasks.length > 0 && (
            <div className="flex justify-center py-10">
              <div className="px-6 py-3 bg-purple-500/10 border border-purple-500/20 rounded-2xl flex items-center gap-3">
                <Loader2 className="animate-spin text-purple-400" size={20} />
                <span className="text-purple-400 font-black text-sm uppercase tracking-widest">載入更多中...</span>
              </div>
            </div>
          )}
        </div>
        
        {/* Footer spacing */}
        <div className="h-20" />
      </header>
    </div>
  );
}
