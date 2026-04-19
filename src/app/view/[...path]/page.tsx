"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useVault } from "@/components/VaultProvider";
import { ObsidianTask } from "@/lib/types";
import { ArrowLeft, Edit3, Save, Trash2, CheckCircle2, Circle, Loader2, Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { motion } from "framer-motion";
import matter from "gray-matter";

export default function ViewPage() {
  const params = useParams();
  const router = useRouter();
  const { service } = useVault();
  const [task, setTask] = useState<ObsidianTask | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fullPath = Array.isArray(params.path) 
    ? params.path.map(p => decodeURIComponent(p)).join("/") 
    : (params.path ? decodeURIComponent(params.path) : "");

  useEffect(() => {
    if (service && fullPath) {
      loadContent();
    }
  }, [service, fullPath]);

  const loadContent = async () => {
    if (!fullPath) return;
    setIsLoading(true);
    // 確保路徑以 .md 結尾
    const targetPath = fullPath.endsWith(".md") ? fullPath : `${fullPath}.md`;
    const data = await service?.readMarkdown(targetPath);
    if (data) setTask(data);
    setIsLoading(false);
  };

  const toggleStatus = async () => {
    if (!service || !task || !task.sha) return;
    setIsSaving(true);
    
    try {
      const newStatus = !task.status;
      const meta: any = (task as any).metadata || {};
      
      let newFrontmatter: any = {};
      
      if (meta.isProject) {
        newFrontmatter = {
          專案狀態: newStatus ? "已完成" : "進行中",
          類型: task.project, // 在 Project 中我們存放在 project 欄位
          建立日期: task.date,
        };
      } else {
        newFrontmatter = {
          專案: task.project,
          狀態: newStatus,
          日期: task.date,
        };
      }
      
      const newContent = matter.stringify(task.content, newFrontmatter);
      await service.updateFile(task.path, newContent, task.sha, `Update status: ${task.title}`);
      
      setTask({ ...task, status: newStatus });
      router.refresh();
    } catch (error) {
      console.error("Failed to update status:", error);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#1e1e1e]">
        <Loader2 className="animate-spin text-purple-500" size={32} />
      </div>
    );
  }

  if (!task) {
    return (
      <div className="flex-1 p-6 text-gray-500 text-center bg-[#1e1e1e]">
        <h2 className="text-xl font-bold text-white mb-2">找不到檔案</h2>
        <p className="mb-6 opacity-60">{fullPath}</p>
        <Button onClick={() => router.back()}>返回上一頁</Button>
      </div>
    );
  }

  const meta: any = (task as any).metadata || {};

  return (
    <div className="flex-1 flex flex-col bg-[#121212]">
      {/* Top Bar - High Contrast Solid Black */}
      <div className="sticky top-0 z-10 bg-[#000000] border-b border-white/10 p-5 flex items-center gap-4">
        <button onClick={() => router.back()} className="text-gray-400 p-1 hover:text-white transition-colors">
          <ArrowLeft size={24} />
        </button>
        <h2 className="flex-1 font-bold text-white text-xl truncate tracking-tight">{task.title}</h2>
        <button 
          onClick={toggleStatus}
          disabled={isSaving}
          className={`p-2 rounded-full transition-all ${task.status ? 'bg-green-600 text-white shadow-[0_0_15px_rgba(34,197,94,0.4)]' : 'bg-gray-800 text-gray-400'}`}
        >
          {isSaving ? <Loader2 className="animate-spin" size={20} /> : (task.status ? <CheckCircle2 size={22} /> : <Circle size={22} />)}
        </button>
      </div>

      {/* Content Area - Pure Black Background */}
      <div className="flex-1 p-6 overflow-y-auto w-full bg-[#000000]">
        <style dangerouslySetInnerHTML={{ __html: `
          .markdown-content p, 
          .markdown-content li, 
          .markdown-content h1, 
          .markdown-content h2, 
          .markdown-content h3, 
          .markdown-content h4, 
          .markdown-content h5, 
          .markdown-content h6,
          .markdown-content strong,
          .markdown-content blockquote {
            color: #FFFFFF !important;
            opacity: 1 !important;
          }
          .markdown-content a { color: #A855F7 !important; text-decoration: underline; }
          .markdown-content code { background: rgba(168, 85, 247, 0.2); color: #E9D5FF !important; padding: 2px 4px; border-radius: 4px; }
          .markdown-content pre { background: #1a1a1a !important; padding: 1rem; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1); overflow-x: auto; }
          .markdown-content ul, .markdown-content ol { padding-left: 1.5rem; margin-bottom: 1rem; }
          .markdown-content li { margin-bottom: 0.5rem; }
          .markdown-content h1, .markdown-content h2 { margin-top: 2rem; margin-bottom: 1rem; font-weight: 900; }
        `}} />

        <div className="max-w-4xl mx-auto">
          {/* Metadata Banner - Ultra High Contrast */}
          <div className="mb-10 p-6 rounded-3xl bg-[#1a1a1a] border-2 border-white/20 shadow-2xl">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-2 h-5 bg-purple-500 rounded-full" />
              <span className="text-sm font-black text-white uppercase tracking-[0.2em]">筆記屬性 / Properties</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
              <div className="space-y-2">
                <div className="text-gray-400 text-xs font-bold uppercase tracking-widest">
                  {meta.isProject ? "Project Status / 專案狀態" : "Project / 專案"}
                </div>
                <div className="text-white text-xl font-black bg-purple-900/30 px-3 py-1 rounded-lg border border-purple-500/30 inline-block">
                  {meta.isProject 
                    ? (meta.projectStatus || "進行中") 
                    : (task.project?.replace(/\[\[|\]\]/g, "") || "未分類")}
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-gray-400 text-xs font-bold uppercase tracking-widest">
                  {meta.isProject ? "Created Date / 建立日期" : "Due Date / 日期"}
                </div>
                <div className="text-white text-xl font-black tracking-tight flex items-center gap-2">
                  <CalendarIcon className="text-purple-400" size={20} />
                  {task.date || "未排程"}
                </div>
              </div>
            </div>
          </div>

          {/* Markdown Render Area */}
          <div className="markdown-content text-[18px] leading-[1.8]">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {task.content}
            </ReactMarkdown>
          </div>
          
          <div className="h-32" />
        </div>
      </div>

      {/* Floating Action Button */}
      <div className="fixed bottom-8 right-8 flex flex-col gap-4">
        <motion.button
          whileHover={{ scale: 1.1, rotate: 5 }}
          whileTap={{ scale: 0.9 }}
          className="p-5 bg-purple-600 rounded-2xl shadow-[0_10px_40px_rgba(147,51,234,0.4)] text-white"
        >
          <Edit3 size={28} />
        </motion.button>
      </div>
    </div>
  );
}
