import React, { useState, useEffect } from "react";
import { Users, Gift, Layers, Sparkles, Info } from "lucide-react";
import ParticipantManager from "./components/ParticipantManager";
import RaffleDraw from "./components/RaffleDraw";
import AutoGrouping from "./components/AutoGrouping";
import { Participant, WinnerRecord } from "./types";

export default function App() {
  const [activeTab, setActiveTab] = useState<"roster" | "raffle" | "grouping">("roster");
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [winners, setWinners] = useState<WinnerRecord[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load persistence from local storage safely on mount
  useEffect(() => {
    try {
      const savedParticipants = localStorage.getItem("gala_party_draw_participants_v1");
      const savedWinners = localStorage.getItem("gala_party_draw_winners_v1");
      
      if (savedParticipants) {
        setParticipants(JSON.parse(savedParticipants));
      }
      if (savedWinners) {
        setWinners(JSON.parse(savedWinners));
      }
    } catch (e) {
      console.error("Failed to load local storage data", e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Save changes to local storage when state drifts
  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem("gala_party_draw_participants_v1", JSON.stringify(participants));
    } catch (e) {
      console.error("Failed to save data", e);
    }
  }, [participants, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem("gala_party_draw_winners_v1", JSON.stringify(winners));
    } catch (e) {
      console.error("Failed to save data", e);
    }
  }, [winners, isLoaded]);

  const handleUpdateParticipants = (newList: Participant[]) => {
    setParticipants(newList);
  };

  const handleUpdateWinners = (newWinners: WinnerRecord[]) => {
    setWinners(newWinners);
  };

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 antialiased font-sans relative pb-16 selection:bg-amber-350 selection:text-zinc-900">
      
      {/* Decorative Brand Accent Borders */}
      <div className="h-2 bg-indigo-600 border-b-2 border-zinc-900" />

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        
        {/* Bento Styled Header */}
        <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 border-b-4 border-zinc-900 pb-8">
          <div className="space-y-1">
            <h1 className="text-4xl sm:text-5xl font-black text-zinc-900 tracking-tighter uppercase">
              LuckyDraw <span className="text-indigo-600 bg-indigo-100 border-2 border-zinc-950 px-2.5 py-0.5 rounded-2xl text-2xl font-black align-middle ml-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">v2.0</span>
            </h1>
            <p className="text-zinc-500 font-bold text-sm tracking-wide">
              Company Annual Party 2026 • 尾牙派對抽獎與分組系統
            </p>
          </div>

          {/* Quick status pill with Neo-Brutalism Shadow style */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-white border-2 border-zinc-900 px-4 py-2 rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center gap-2">
              <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse border border-zinc-900"></div>
              <span className="text-xs font-black uppercase tracking-wider text-zinc-800">隨機演算法已啟動</span>
            </div>
            
            <div className="bg-amber-100 border-2 border-zinc-900 px-4 py-2 rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center gap-2 font-mono">
              <span className="text-xs font-black uppercase text-zinc-505">活動成員: </span>
              <span className="text-xs font-black text-indigo-600">{participants.length} 人</span>
            </div>
          </div>
        </header>

        {/* Tab Selection (Neo-Bruter Flat Buttons with offsets) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-1" id="nav-tabs-wrapper">
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setActiveTab("roster")}
              className={`px-5 py-3 rounded-xl text-xs sm:text-sm font-black transition-all neo-btn-pressable border-2 border-zinc-900 flex items-center gap-2 cursor-pointer ${
                activeTab === "roster"
                  ? "bg-amber-400 text-zinc-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] translate-x-[2px] translate-y-[2px]"
                  : "bg-white text-zinc-700 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-zinc-50"
              }`}
            >
              <Users className="w-4 h-4 text-zinc-900" />
              1. 匯入員工名單 ({participants.length})
            </button>
            <button
              onClick={() => setActiveTab("raffle")}
              className={`px-5 py-3 rounded-xl text-xs sm:text-sm font-black transition-all neo-btn-pressable border-2 border-zinc-900 flex items-center gap-2 cursor-pointer ${
                activeTab === "raffle"
                  ? "bg-amber-400 text-zinc-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] translate-x-[2px] translate-y-[2px]"
                  : "bg-white text-zinc-700 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-zinc-50"
              }`}
            >
              <Gift className="w-4 h-4 text-zinc-900" />
              2. 尾牙幸運抽獎
            </button>
            <button
              onClick={() => setActiveTab("grouping")}
              className={`px-5 py-3 rounded-xl text-xs sm:text-sm font-black transition-all neo-btn-pressable border-2 border-zinc-900 flex items-center gap-2 cursor-pointer ${
                activeTab === "grouping"
                  ? "bg-amber-400 text-zinc-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] translate-x-[2px] translate-y-[2px]"
                  : "bg-white text-zinc-700 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-zinc-50"
              }`}
            >
              <Layers className="w-4 h-4 text-zinc-900" />
              3. 自動分組
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs font-bold text-zinc-650 bg-white border-2 border-zinc-900/10 px-4 py-2.5 rounded-xl">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping"></span>
            <span>本地端快取保存技術：重整、斷網也絕不遺失任何紀錄</span>
          </div>
        </div>

        {/* Dynamic Canvas Container with Bento shadow style */}
        <main className="min-h-[480px]" id="main-content-canvas">
          {activeTab === "roster" && (
            <ParticipantManager 
              participants={participants} 
              onChange={handleUpdateParticipants} 
            />
          )}

          {activeTab === "raffle" && (
            <RaffleDraw
              participants={participants}
              onUpdateParticipants={handleUpdateParticipants}
              winners={winners}
              onUpdateWinners={handleUpdateWinners}
            />
          )}

          {activeTab === "grouping" && (
            <AutoGrouping 
              participants={participants} 
            />
          )}
        </main>

        {/* Bento Footer Details */}
        <footer className="pt-8 border-t-2 border-zinc-900 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm font-bold text-zinc-500">
          <div>
            <p className="text-zinc-900 font-extrabold uppercase tracking-tight">LuckyDraw v2.0 • 尾牙籌備專屬系統</p>
            <p className="text-xs text-zinc-400 mt-1">✓ 純 JavaScript 離線算力，全數碼在本地瀏覽器保護密隱。</p>
          </div>
          <div className="flex flex-wrap md:justify-end gap-x-4 gap-y-1 text-xs font-black uppercase text-zinc-700">
            <span className="bg-zinc-200 border border-zinc-900 px-2 py-1 rounded">100% Free Plan 零付費運作</span>
            <span className="bg-amber-100 border border-zinc-900 px-2 py-1 rounded">支援 CSV 一鍵導出存檔</span>
          </div>
        </footer>

      </div>
    </div>
  );
}
