"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useVault } from "@/components/VaultProvider";
import { LayoutGrid, ListTodo, Settings, Loader2, Folder, Clock, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function ProjectsPage() {
  const { config, service, isLoading } = useVault();
  const router = useRouter();
  const [projects, setProjects] = useState<any[]>([]);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !config) {
      router.push("/setup");
    }
  }, [config, isLoading, router]);

  useEffect(() => {
    if (service) {
      loadProjects();
    }
  }, [service]);

  const loadProjects = async () => {
    if (!service) return;
    setIsFetching(true);
    setError(null);
    try {
      const files = await service.getFiles("1_Project");
      const mdFiles = files.filter(f => f.name.endsWith(".md"));
      setProjects(mdFiles);
    } catch (error: any) {
      console.error("Failed to load projects:", error);
      setError("無法讀取專案列表，請檢查您的目錄名稱是否為 '1_Project'。");
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
        <div className="flex items-center gap-4 mb-8">
          <button 
            onClick={() => router.push("/")}
            className="p-2 bg-gray-800 rounded-full text-gray-400 hover:text-white"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">專案清單</h1>
            <p className="text-gray-400 font-medium">1_Project 目錄下共有 {projects.length} 個專案</p>
          </div>
        </div>

        {error ? (
          <div className="p-6 rounded-2xl bg-red-900/20 border border-red-500/30 text-center">
            <div className="text-red-400 font-medium mb-3">{error}</div>
            <button 
              onClick={() => router.push("/setup")}
              className="px-6 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg text-sm"
            >
              檢查設定
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            <AnimatePresence>
              {projects.length > 0 ? (
                projects.map((proj, index) => (
                  <motion.div
                    key={proj.path}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="glass-dark p-5 rounded-2xl flex items-center gap-4 border border-white/5 active:scale-[0.98] transition-all"
                  >
                    <div className="p-3 bg-blue-500/10 rounded-xl text-blue-400">
                      <Folder size={24} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-semibold truncate">
                        {proj.name.replace(".md", "")}
                      </h3>
                      <p className="text-gray-500 text-xs mt-1">
                        路徑: {proj.path}
                      </p>
                    </div>
                  </motion.div>
                ))
              ) : (
                !isFetching && (
                  <div className="text-center py-20 text-gray-600">
                    <LayoutGrid size={48} className="mx-auto mb-4 opacity-20" />
                    <p>尚未偵測到任何專案檔案</p>
                  </div>
                )
              )}
            </AnimatePresence>
          </div>
        )}
      </header>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 h-16 bg-[#161616]/80 backdrop-blur-lg border-t border-gray-800 flex items-center justify-around px-4">
        <button 
          onClick={() => router.push("/")}
          className="flex flex-col items-center gap-1 text-gray-500 hover:text-white active:scale-90 transition-transform"
        >
          <ListTodo size={24} />
          <span className="text-[10px] font-bold">任務</span>
        </button>
        <button 
          className="flex flex-col items-center gap-1 text-blue-500 active:scale-90 transition-transform"
        >
          <LayoutGrid size={24} />
          <span className="text-[10px] font-bold">專案</span>
        </button>
        <button 
          onClick={() => router.push("/setup")}
          className="flex flex-col items-center gap-1 text-gray-500 hover:text-white active:scale-90 transition-transform"
        >
          <Settings size={24} />
          <span className="text-[10px] font-bold">設定</span>
        </button>
      </nav>
    </div>
  );
}
