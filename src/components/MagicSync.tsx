"use client";

import React, { useState, useEffect } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { VaultConfig } from "@/lib/types";
import { motion, AnimatePresence } from "framer-motion";
import { QrCode, X, Copy, Check, Eye, EyeOff, Smartphone, AlertTriangle } from "lucide-react";
import { Button } from "./ui";

interface MagicSyncProps {
  config: VaultConfig;
}

export const MagicSync: React.FC<MagicSyncProps> = ({ config }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const [copied, setCopied] = useState(false);
  const [syncUrl, setSyncUrl] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      // 編碼配置資訊
      const configStr = JSON.stringify(config);
      // 使用 Base64 編碼，並處理 Unicode
      const encoded = btoa(encodeURIComponent(configStr).replace(/%([0-9A-F]{2})/g, (match, p1) => {
        return String.fromCharCode(parseInt(p1, 16));
      }));
      
      const url = `${window.location.origin}/setup?import=${encoded}`;
      setSyncUrl(url);
    }
  }, [config]);

  const handleCopy = () => {
    navigator.clipboard.writeText(syncUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        className="w-full flex items-center justify-center gap-2 py-3 border-purple-500/30 text-purple-400 hover:bg-purple-500/10"
        onClick={() => setIsOpen(true)}
      >
        <QrCode size={18} /> 同步到手機 (Magic Sync)
      </Button>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-[#252525] border border-white/10 w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2 text-white font-bold">
                  <Smartphone className="text-purple-500" size={20} />
                  Magic Sync
                </div>
                <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="p-8 flex flex-col items-center">
                <p className="text-sm text-gray-400 text-center mb-6">
                  請使用手機掃描下方 QR Code，<br />自動填充設定並完成登入。
                </p>

                <div className="relative group p-4 bg-white rounded-xl shadow-inner">
                  {!showToken && (
                    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/90 rounded-xl backdrop-blur-[2px]">
                      <button 
                        onClick={() => setShowToken(true)}
                        className="bg-purple-600 text-white px-4 py-2 rounded-full flex items-center gap-2 text-sm font-bold shadow-lg hover:bg-purple-700 transition-all scale-100 active:scale-95"
                      >
                        <Eye size={16} /> 顯示 QR Code
                      </button>
                    </div>
                  )}
                  
                  <QRCodeCanvas
                    value={syncUrl}
                    size={200}
                    level="H"
                    includeMargin={false}
                    imageSettings={{
                      src: "/favicon.ico",
                      x: undefined,
                      y: undefined,
                      height: 40,
                      width: 40,
                      excavate: true,
                    }}
                  />
                </div>

                <div className="mt-8 w-full p-4 rounded-xl bg-yellow-500/5 border border-yellow-500/20">
                  <div className="flex gap-3">
                    <AlertTriangle className="text-yellow-500 shrink-0" size={18} />
                    <p className="text-xs text-yellow-200/70 leading-relaxed">
                      包含敏銳的 GitHub Token。請確保在私密環境下使用，切勿截圖分享予他人。
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-black/20 flex gap-2">
                <Button
                  variant="ghost"
                  className="flex-1 text-xs gap-2"
                  onClick={handleCopy}
                >
                  {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                  {copied ? "已複製連結" : "複製同步連結"}
                </Button>
                <Button
                  variant="ghost"
                  className="text-xs gap-2"
                  onClick={() => setShowToken(!showToken)}
                >
                  {showToken ? <EyeOff size={14} /> : <Eye size={14} />}
                  {showToken ? "隱藏內容" : "檢視碼"}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
