"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useVault } from "@/components/VaultProvider";
import { VaultConfig } from "@/lib/types";
import { Button, Input } from "@/components/ui";
import { Lock, Shield, FolderOpen, GitBranch, Sparkles, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { MagicSync } from "@/components/MagicSync";

function SetupContent() {
  const { saveConfig, config } = useVault();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isImporting, setIsImporting] = useState(false);
  const [formData, setFormData] = useState<VaultConfig>({
    owner: config?.owner || "",
    repo: config?.repo || "",
    branch: config?.branch || "main",
    token: config?.token || "",
  });

  // Redirect if already configured, unless forced
  useEffect(() => {
    const importData = searchParams.get("import");
    const force = searchParams.get("force");
    if (config && !importData && force !== "true") {
      router.push("/");
    }
  }, [config, router, searchParams]);

  // 偵測自動匯入參數
  useEffect(() => {
    const importData = searchParams.get("import");
    if (importData) {
      try {
        setIsImporting(true);
        // 解碼 Base64 並解析 JSON
        const decoded = decodeURIComponent(atob(importData).split('').map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        const importedConfig = JSON.parse(decoded) as VaultConfig;
        
        // 驗證必要欄位
        if (importedConfig.owner && importedConfig.repo && importedConfig.token) {
          saveConfig(importedConfig);
          // 給使用者一點回饋感，延遲轉跳
          setTimeout(() => {
            router.push("/");
          }, 1500);
        } else {
          setIsImporting(false);
        }
      } catch (err) {
        console.error("匯入配置失敗:", err);
        setIsImporting(false);
      }
    }
  }, [searchParams, saveConfig, router]);

  const [isValidating, setIsValidating] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsValidating(true);
    setAuthError(null);

    try {
      // 現場驗證 Token 有效性
      const { Octokit } = await import("octokit");
      const testOctokit = new Octokit({ auth: formData.token });
      await testOctokit.rest.users.getAuthenticated();
      
      // 驗證成功，儲存並轉跳
      saveConfig(formData);
      router.push("/");
    } catch (err: any) {
      console.error("Token verification failed:", err);
      if (err.status === 401) {
        setAuthError("❌ Token 無效 (401 Bad Credentials)。請確認字串是否複製完整，或試著重新產生一個 Token。");
      } else {
        setAuthError("❌ 驗證失敗：" + (err.message || "未知錯誤"));
      }
    } finally {
      setIsValidating(false);
    }
  };

  if (isImporting) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center space-y-4">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          <Sparkles size={48} className="text-purple-500" />
        </motion.div>
        <h2 className="text-2xl font-bold text-white">正在同步您的配置...</h2>
        <p className="text-gray-400">魔法生效中，即將為您開啟 Vault</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-white mb-2">Obsidian Web PARA</h1>
        <p className="text-gray-400">設定您的 GitHub Repository 以啟動同步</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
            <Shield size={16} /> GitHub 帳號 (Owner)
          </label>
          <Input
            type="text"
            required
            placeholder="例如: ZacHBT"
            value={formData.owner}
            onChange={(e) => {
              const cleaned = e.target.value.replace(/[^\x20-\x7E]/g, "").trim();
              setFormData({ ...formData, owner: cleaned });
            }}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
            <FolderOpen size={16} /> Repository 名稱
          </label>
          <Input
            type="text"
            required
            placeholder="例如: zac_vault"
            value={formData.repo}
            onChange={(e) => {
              const cleaned = e.target.value.replace(/[^\x20-\x7E]/g, "").trim();
              setFormData({ ...formData, repo: cleaned });
            }}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
            <GitBranch size={16} /> 分支 (Branch)
          </label>
          <Input
            type="text"
            required
            value={formData.branch}
            onChange={(e) => {
              const cleaned = e.target.value.replace(/[^\x20-\x7E]/g, "").trim();
              setFormData({ ...formData, branch: cleaned });
            }}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
            <Lock size={16} /> GitHub Personal Access Token
          </label>
          <Input
            type="password"
            required
            placeholder="ghp_xxxxxxxxxxxx"
            value={formData.token}
            onChange={(e) => {
              // 只保留 ASCII 字元與基本符號，過濾掉零寬空格或其他非法字元
              const cleaned = e.target.value.replace(/[^\x20-\x7E]/g, "").trim();
              setFormData({ ...formData, token: cleaned });
            }}
          />
        </div>

        {authError && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-4 rounded-xl bg-red-900/40 border border-red-500/50 text-red-200 text-sm font-medium"
          >
            {authError}
          </motion.div>
        )}

        <div className="flex flex-col gap-3 pt-4">
          <button
            type="submit"
            disabled={isValidating}
            className="w-full py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 text-white font-bold rounded-lg shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2"
          >
            {isValidating && <Loader2 className="animate-spin" size={20} />}
            {isValidating ? "正在驗證 Token..." : "完成設定 並 開始同步"}
          </button>
          
          <button
            type="button"
            onClick={() => {
              localStorage.removeItem("obsidian_vault_config");
              window.location.reload();
            }}
            className="w-full py-2 bg-gray-800 hover:bg-gray-700 text-gray-400 text-xs rounded-lg transition-colors border border-gray-700"
          >
            清除所有舊設定 並 重新開始 (Reset)
          </button>
          
          {(formData.owner && formData.repo && formData.token) && (
            <MagicSync config={formData} />
          )}
        </div>
      </form>

      <p className="mt-6 text-sm text-gray-500 text-center uppercase tracking-widest">
        Privacy First | No Database | Client-Side Only
      </p>
    </div>
  );
}

export default function SetupPage() {
  return (
    <div className="flex-1 flex items-center justify-center p-4 bg-[#1e1e1e]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md flex justify-center"
      >
        <Suspense fallback={<div className="text-white">載入中...</div>}>
          <SetupContent />
        </Suspense>
      </motion.div>
    </div>
  );
}
