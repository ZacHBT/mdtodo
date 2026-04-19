"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useVault } from "@/components/VaultProvider";
import { ObsidianTask } from "@/lib/types";
import { ArrowLeft, Edit3, Save, Trash2, CheckCircle2, Circle, Loader2 } from "lucide-react";
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

  const fullPath = decodeURIComponent(
    Array.isArray(params.path) ? params.path.join("/") : (params.path || "")
  );

  useEffect(() => {
    if (service && fullPath) {
      loadContent();
    }
  }, [service, fullPath]);

  const loadContent = async () => {
    if (!fullPath) return;
    setIsLoading(true);
    const data = await service?.readMarkdown(fullPath + (fullPath.endsWith(".md") ? "" : ".md"));
    if (data) setTask(data);
    setIsLoading(false);
  };

  const toggleStatus = async () => {
    if (!service || !task || !task.sha) return;
    setIsSaving(true);
    
    try {
      const newStatus = !task.status;
      const newFrontmatter = {
        專案: task.project,
        狀態: newStatus,
        日期: task.date,
      };
      
      const newContent = matter.stringify(task.content, newFrontmatter);
      await service.updateFile(task.path, newContent, task.sha, `Update task status: ${task.title}`);
      
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
      <div className="flex-1 p-6 text-gray-500 text-center">
        找不到檔案：{fullPath}
      </div>
    );
  }

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

      {/* Content */}
      <div className="flex-1 p-6 overflow-y-auto max-w-4xl mx-auto w-full">
        {/* Metadata Banner - Neon High Contrast Style */}
        <div className="mb-10 p-6 rounded-3xl bg-transparent border-2 border-purple-500/30 shadow-[inset_0_0_20px_rgba(168,85,247,0.05)]">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1.5 h-4 bg-purple-500 rounded-full animate-pulse" />
            <span className="text-xs font-black text-purple-400 uppercase tracking-[0.3em]">Properties</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            <div className="space-y-1">
              <div className="text-purple-300/50 text-[10px] font-black uppercase tracking-wider">Project Scope / 專案</div>
              <div className="text-white text-lg font-bold wikilink inline-block">
                {task.project?.replace(/\[\[|\]\]/g, "") || "No Project"}
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-purple-300/50 text-[10px] font-black uppercase tracking-wider">Due Date / 日期</div>
              <div className="text-white text-lg font-bold tracking-tight">
                {task.date || "Not Scheduled"}
              </div>
            </div>
          </div>
        </div>

        {/* Markdown Render - Extreme Legibility */}
        <div className="prose prose-invert prose-purple max-w-none 
          prose-p:text-[#FFFFFF] prose-p:text-[17px] prose-p:leading-[1.8] prose-p:mb-6
          prose-headings:text-white prose-headings:font-black prose-headings:tracking-tight
          prose-headings:mt-12 prose-headings:mb-4
          prose-strong:text-purple-300 prose-strong:font-black
          prose-li:text-[#FFFFFF] prose-li:text-[17px] prose-li:mb-2
          prose-code:bg-purple-500/10 prose-code:text-purple-200 prose-code:px-1.5 prose-code:rounded
          prose-blockquote:border-purple-500 prose-blockquote:bg-purple-500/5 prose-blockquote:py-1
        ">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {task.content}
          </ReactMarkdown>
        </div>
        
        {/* Safe padding at the bottom */}
        <div className="h-24" />
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
