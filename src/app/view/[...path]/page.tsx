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

  const fullPath = Array.isArray(params.path) ? params.path.join("/") : params.path;

  useEffect(() => {
    if (service && fullPath) {
      loadContent();
    }
  }, [service, fullPath]);

  const loadContent = async () => {
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
    <div className="flex-1 flex flex-col bg-[#1e1e1e]">
      {/* Top Bar */}
      <div className="sticky top-0 z-10 glass p-4 flex items-center gap-4">
        <button onClick={() => router.back()} className="text-gray-400 p-1">
          <ArrowLeft size={24} />
        </button>
        <h2 className="flex-1 font-bold text-white truncate">{task.title}</h2>
        <button 
          onClick={toggleStatus}
          disabled={isSaving}
          className={`p-2 rounded-full transition-colors ${task.status ? 'bg-green-900/40 text-green-400' : 'bg-gray-800 text-gray-400'}`}
        >
          {isSaving ? <Loader2 className="animate-spin" size={20} /> : (task.status ? <CheckCircle2 size={20} /> : <Circle size={20} />)}
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 overflow-y-auto">
        {/* Metadata Banner */}
        <div className="mb-8 p-4 rounded-xl bg-purple-900/20 border border-purple-500/20">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-semibold text-purple-400 uppercase tracking-widest">Metadata</span>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-gray-500 text-xs">專案</div>
              <div className="text-white wikilink">{task.project?.replace(/\[\[|\]\]/g, "")}</div>
            </div>
            <div>
              <div className="text-gray-500 text-xs">日期</div>
              <div className="text-white">{task.date}</div>
            </div>
          </div>
        </div>

        {/* Markdown Render */}
        <div className="prose prose-invert prose-purple max-w-none prose-p:text-gray-300 prose-headings:text-white">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {task.content}
          </ReactMarkdown>
        </div>
      </div>

      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6 flex flex-col gap-4">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="p-4 bg-purple-600 rounded-full shadow-2xl text-white"
        >
          <Edit3 size={24} />
        </motion.button>
      </div>
    </div>
  );
}
