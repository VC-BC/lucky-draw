import React, { useState, useEffect, useRef } from "react";
import { Gift, Play, RotateCcw, Award, Trash2, Check, Flame, Download, Users, Crown, Plus } from "lucide-react";
import { Participant, Prize, WinnerRecord } from "../types";
import confetti from "canvas-confetti";
import CustomModal from "./CustomModal";

interface RaffleDrawProps {
  participants: Participant[];
  onUpdateParticipants: (list: Participant[]) => void;
  winners: WinnerRecord[];
  onUpdateWinners: (records: WinnerRecord[]) => void;
}

export default function RaffleDraw({
  participants,
  onUpdateParticipants,
  winners,
  onUpdateWinners
}: RaffleDrawProps) {
  // Custom Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"alert" | "confirm">("confirm");
  const [modalTitle, setModalTitle] = useState("");
  const [modalDescription, setModalDescription] = useState("");
  const [modalConfirmAction, setModalConfirmAction] = useState<(() => void) | null>(null);

  const showModal = (type: "alert" | "confirm", title: string, description: string, onConfirm: () => void) => {
    setModalType(type);
    setModalTitle(title);
    setModalDescription(description);
    setModalConfirmAction(() => onConfirm);
    setModalOpen(true);
  };

  // Default common prizes
  const [prizes, setPrizes] = useState<Prize[]>([
    { id: "pr1", name: "🏆 特等獎 - 日本東京來回奢華雙人遊機票", amount: 1 },
    { id: "pr2", name: "📱 一等獎 - 最新款 iPhone Pro Max 512GB", amount: 2 },
    { id: "pr3", name: "💻 二等獎 - Apple iPad Air + Apple Pencil", amount: 3 },
    { id: "pr4", name: "🎟️ 三等獎 - 五星級寒舍艾美酒店雙人下午茶餐券", amount: 5 },
    { id: "pr5", name: "🧧 普大喜奔獎 - 新春開運紅包 $3,000 元", amount: 10 }
  ]);

  const [activePrizeId, setActivePrizeId] = useState<string>("pr1");
  const [drawCount, setDrawCount] = useState<number>(1);
  const [allowRepeat, setAllowRepeat] = useState<boolean>(false); // false = Non-repeating / unique winners
  
  // Custom Prize adding
  const [customPrizeName, setCustomPrizeName] = useState("");
  const [customPrizeAmount, setCustomPrizeAmount] = useState<number>(1);

  // Drawing state
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [rollingNames, setRollingNames] = useState<string[]>([]);
  const [currentRoundWinners, setCurrentRoundWinners] = useState<Participant[]>([]);
  const [showCelebration, setShowCelebration] = useState<boolean>(false);

  const rollIntervalRefs = useRef<number[]>([]);

  // Add customized prize
  const handleAddPrize = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customPrizeName.trim()) return;
    const newPrize: Prize = {
      id: `pr-${Date.now()}`,
      name: customPrizeName.trim(),
      amount: Math.max(1, customPrizeAmount)
    };
    setPrizes([...prizes, newPrize]);
    setCustomPrizeName("");
    setCustomPrizeAmount(1);
    setActivePrizeId(newPrize.id);
  };

  const handleDeletePrize = (id: string) => {
    if (prizes.length <= 1) {
      showModal("alert", "無法刪除獎項", "必須保留至少一個獎項類型喔。", () => {});
      return;
    }
    const filtered = prizes.filter((p) => p.id !== id);
    setPrizes(filtered);
    if (activePrizeId === id) {
      setActivePrizeId(filtered[0].id);
    }
  };

  // Trigger celebration explosion confetti
  const triggerConfetti = () => {
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 100 };

    const randomInRange = (min: number, max: number) => {
      return Math.random() * (max - min) + min;
    };

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      // Confetti bursts from left and right corners
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
    }, 250);
  };

  // Get eligible participants based on repeating configs
  const getEligiblePool = (): Participant[] => {
    if (allowRepeat) {
      return participants;
    } else {
      const previousWinnerIds = winners.map((w) => w.participantId);
      return participants.filter((p) => !previousWinnerIds.includes(p.id));
    }
  };

  // Core drawing execution
  const startDraw = () => {
    if (isDrawing) return;
    
    const pool = getEligiblePool();
    if (pool.length === 0) {
      showModal("alert", "候選名冊空白", "池中已無符合抽籤條件的候選名單！請確認是否名單為空，或啟用「可重複抽籤」選項。", () => {});
      return;
    }

    if (pool.length < drawCount) {
      showModal(
        "alert",
        "剩餘抽獎人數不足",
        `符合抽籤資格的候補人數（${pool.length} 人）不足本次欲抽選的人數（${drawCount} 人）！請先調整單次抽出人數，或至「匯入員工名單」增加成員名冊。`,
        () => {}
      );
      return;
    }

    const prize = prizes.find((p) => p.id === activePrizeId);
    if (!prize) return;

    const actualCount = drawCount;

    setIsDrawing(true);
    setShowCelebration(false);
    setCurrentRoundWinners([]);

    // Initialize temporary rolling text values
    const tempRolling = Array(actualCount).fill("⚡ 抽取中...");
    setRollingNames(tempRolling);

    // Dynamic tick rate loop
    const subIntervals: number[] = [];
    
    for (let i = 0; i < actualCount; i++) {
      let speed = 40 + Math.random() * 50; // Super fast responsive roulette roll
      const setRoll = () => {
        const intervalId = window.setInterval(() => {
          const randomIndex = Math.floor(Math.random() * pool.length);
          const rollName = `${pool[randomIndex].name} (${pool[randomIndex].department || "無部門"})`;
          setRollingNames((prev) => {
            const next = [...prev];
            next[i] = rollName;
            return next;
          });
        }, speed);
        subIntervals.push(intervalId);
      };
      setRoll();
    }
    rollIntervalRefs.current = subIntervals;

    // Deceleration & stoppage timeline
    setTimeout(() => {
      // Clear rolling intervals
      rollIntervalRefs.current.forEach((id) => clearInterval(id));
      rollIntervalRefs.current = [];

      // Select real winners mathematically from pool randomly
      const shuffled = [...pool].sort(() => Math.random() - 0.5);
      const chosenWinners = shuffled.slice(0, actualCount);

      const newRecords: WinnerRecord[] = chosenWinners.map((p, index) => ({
        id: `win-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 4)}`,
        participantId: p.id,
        participantName: p.name,
        participantDepartment: p.department || "無部門",
        prizeId: prize.id,
        prizeName: prize.name,
        drawnTime: new Date().toLocaleTimeString("zh-TW", { hour12: false })
      }));

      // Commit states
      setRollingNames(chosenWinners.map((p) => `${p.name} (${p.department || "無部門"})`));
      setCurrentRoundWinners(chosenWinners);
      onUpdateWinners([...newRecords, ...winners]);
      setIsDrawing(false);
      setShowCelebration(true);
      triggerConfetti();
    }, 2500); // 2.5s duration
  };

  const resetDrawnState = () => {
    showModal(
      "confirm",
      "重新開始抽獎",
      "確定要清除所有的得獎紀錄，重新開始抽籤嗎？",
      () => {
        onUpdateWinners([]);
        setCurrentRoundWinners([]);
        setShowCelebration(false);
      }
    );
  };

  const removeWinnerRecord = (id: string) => {
    showModal(
      "confirm",
      "刪除中獎紀錄",
      "確定要刪除這筆得獎紀錄嗎？此動作將會將該中獎人員移除金榜。",
      () => {
        onUpdateWinners(winners.filter((w) => w.id !== id));
      }
    );
  };

  const exportWinnersToCSV = () => {
    if (winners.length === 0) return;
    let csvContent = "\uFEFF"; // UTF-8 BOM
    csvContent += "得獎時間,獎項名稱,得獎者姓名,所屬部門\n";

    winners.forEach((w) => {
      csvContent += `"${w.drawnTime}","${w.prizeName}","${w.participantName}","${w.participantDepartment || "無部門"}"\n`;
    });

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `公司Party抽獎結果_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const activePrize = prizes.find((p) => p.id === activePrizeId) || prizes[0];
  const eligiblePoolCount = getEligiblePool().length;

  return (
    <div className="space-y-8 animate-fadeIn">
      
      {/* 1. MAIN STAGE REGION: BENTO ROW GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Left Bento: Parameters Config (Bento Style: White with dark thick border and shadow) */}
        <div className="lg:col-span-4 bg-white border-2 border-zinc-900 rounded-[2rem] p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-center gap-1.5 pb-3 border-b-2 border-zinc-100">
              <span className="w-2.5 h-2.5 bg-indigo-600 rounded-full"></span>
              <h4 className="text-sm font-black text-zinc-900 uppercase tracking-widest">
                抽籤控制 Board
              </h4>
            </div>

            <div className="space-y-4 mt-4">
              {/* Select Prize */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-zinc-450 uppercase tracking-wider block">1. 選擇當前抽取獎項</label>
                <select
                  value={activePrizeId}
                  onChange={(e) => {
                    setActivePrizeId(e.target.value);
                    setCurrentRoundWinners([]);
                    setShowCelebration(false);
                  }}
                  disabled={isDrawing}
                  className="w-full text-xs bg-zinc-50 border-2 border-zinc-900 rounded-lg p-2.5 text-zinc-900 font-extrabold cursor-pointer focus:outline-none focus:border-indigo-600"
                >
                  {prizes.map((p) => (
                    <option key={p.id} value={p.id} className="text-zinc-900 font-bold">
                      {p.name} (名額: {p.amount}人)
                    </option>
                  ))}
                </select>
              </div>

              {/* Draw size count range slider */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-extrabold text-zinc-450 uppercase tracking-wider">2. 單次抽出人數</label>
                  <span className="text-xs font-black text-indigo-600 font-mono tracking-tighter bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md">
                    {drawCount} 人
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max={Math.min(20, Math.max(1, eligiblePoolCount))}
                  value={drawCount}
                  onChange={(e) => setDrawCount(Number(e.target.value))}
                  disabled={isDrawing || eligiblePoolCount === 0}
                  className="w-full accent-indigo-600 bg-zinc-200 h-1.5 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-[9px] text-zinc-400 font-bold">
                  <span>1名</span>
                  <span>每次最高 20名 (視名單上限)</span>
                </div>
              </div>

              {/* Repeat Draw Toggles (Hard Bruter Look) */}
              <div className="space-y-2 pt-2 border-t border-zinc-100">
                <label className="text-[10px] font-extrabold text-zinc-450 uppercase tracking-wider block">3. 排他得獎機制</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAllowRepeat(false)}
                    disabled={isDrawing}
                    className={`text-xs py-2 px-3 rounded-lg border-2 font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      !allowRepeat
                        ? "bg-emerald-50 border-zinc-900 text-zinc-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] translate-x-[1px] translate-y-[1px]"
                        : "bg-white border-zinc-300 text-zinc-400 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:text-zinc-650"
                    }`}
                  >
                    <Check className={`w-3.5 h-3.5 ${!allowRepeat ? "text-emerald-600" : "text-transparent"}`} />
                    不可重覆中獎
                  </button>
                  <button
                    type="button"
                    onClick={() => setAllowRepeat(true)}
                    disabled={isDrawing}
                    className={`text-xs py-2 px-3 rounded-lg border-2 font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      allowRepeat
                        ? "bg-rose-50 border-zinc-900 text-zinc-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] translate-x-[1px] translate-y-[1px]"
                        : "bg-white border-zinc-300 text-zinc-400 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:text-zinc-650"
                    }`}
                  >
                    <Flame className={`w-3.5 h-3.5 ${allowRepeat ? "text-rose-500" : "text-transparent"}`} />
                    可重複得獎
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-zinc-100 p-4 rounded-2xl border border-zinc-200 text-xs text-zinc-600 font-bold space-y-1">
            <div className="flex justify-between">
              <span>全體總人數:</span>
              <span className="text-zinc-900 font-mono">{participants.length} 人</span>
            </div>
            <div className="flex justify-between font-extrabold text-indigo-650">
              <span>本輪符合候選池:</span>
              <span className="font-mono">{eligiblePoolCount} 人</span>
            </div>
          </div>
        </div>

        {/* Center/Right Bento: Active Spin Stage (Bento Style: Solid Deep Indigo / Blue panel) */}
        <div className="lg:col-span-8 bg-indigo-600 border-2 border-zinc-900 rounded-[2.5rem] p-6 sm:p-10 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden flex flex-col justify-between items-center text-center">
          
          {/* Top Stage Header Label */}
          <div className="w-full flex items-center justify-between text-white/80 z-10">
            <span className="bg-white/20 backdrop-blur-sm text-white text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-widest border border-white/10">
              Live Stage Spotlight
            </span>
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 bg-amber-400 rounded-full animate-ping"></div>
              <div className="w-2.5 h-2.5 bg-emerald-400 rounded-full"></div>
            </div>
          </div>

          {/* Large dynamic display slot */}
          <div className="my-8 w-full z-10">
            <span className="text-amber-300 text-xs sm:text-sm font-extrabold uppercase tracking-widest block mb-2 font-display italic">
              🏆 Current Prize Category:
            </span>
            <h2 className="text-white text-2xl sm:text-3xl font-black tracking-tight uppercase leading-none drop-shadow-md mb-6">
              {activePrize?.name || "尚未選擇獎項類別"}
            </h2>

            {/* Simulated Neon Light box roller */}
            <div className="bg-zinc-950 border-4 border-zinc-900 rounded-3xl p-6 min-h-[160px] flex items-center justify-center shadow-inner relative">
              
              {eligiblePoolCount === 0 ? (
                <p className="text-zinc-500 font-bold text-sm">
                  ⚠️ 請先去「一、匯入員工名冊」載入尾牙名單數據
                </p>
              ) : isDrawing ? (
                // Rapidly changing rosters slots with gorgeous border tags
                <div className="flex flex-wrap items-center justify-center gap-4 w-full">
                  {rollingNames.map((name, idx) => (
                    <div
                      key={idx}
                      className="bg-white border-2 border-zinc-900 rounded-xl px-4 py-3 min-w-[150px] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] animate-pulse"
                    >
                      <p className="text-[9px] text-zinc-400 font-extrabold uppercase mb-0.5">SLOT 0{idx + 1}</p>
                      <p className="text-sm font-black text-indigo-700 truncate">{name.split(" ")[0]}</p>
                      <p className="text-[10px] font-bold text-zinc-500 truncate">{name.split(" ")[1] || "..."}</p>
                    </div>
                  ))}
                </div>
              ) : showCelebration && currentRoundWinners.length > 0 ? (
                // Celebration Reveal Mode
                <div className="w-full space-y-4">
                  <div className="flex items-center justify-center gap-2 text-amber-400 text-xs font-black uppercase tracking-widest animate-bounce">
                    <Crown className="w-4 h-4 fill-current text-amber-300" />
                    中獎名冊出爐 CONGRATULATIONS 🎉
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-4">
                    {currentRoundWinners.map((w) => (
                      <div
                        key={w.id}
                        className="bg-amber-100 border-2 border-zinc-900 rounded-xl px-5 py-3.5 min-w-[160px] text-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] border-t-amber-400 transform hover:scale-105 duration-200"
                      >
                        <p className="text-base font-black text-zinc-900">{w.name}</p>
                        <p className="text-[10px] font-bold text-zinc-500">{w.department || "一級幹部"}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                // Standby Idle Status Mode
                <div className="text-center space-y-1">
                  <div className="w-12 h-12 bg-zinc-900 text-white rounded-full flex items-center justify-center mx-auto border-2 border-zinc-800 shadow-md">
                    <Gift className="w-5 h-5 text-amber-400" />
                  </div>
                  <p className="text-zinc-300 font-black text-sm mt-2">尾牙抽籤機已備妥</p>
                  <p className="text-zinc-500 text-[11px] font-semibold">本輪即將抽出 {drawCount} 位幸運兒！</p>
                </div>
              )}
            </div>
          </div>

          {/* Action Trigger Button */}
          <div className="z-10">
            <button
              onClick={startDraw}
              disabled={isDrawing || eligiblePoolCount === 0}
              className="bg-amber-400 hover:bg-amber-300 disabled:bg-zinc-800 disabled:text-zinc-500 border-4 border-zinc-900 text-zinc-900 px-14 py-4.5 rounded-full font-black text-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all uppercase italic cursor-pointer tracking-wider"
            >
              {isDrawing ? "⚡ 正在飛速計算中..." : "👉 抽獎"}
            </button>
          </div>

        </div>

      </div>

      {/* 2. BOTTOM BENTO REGION: PRIZE REGISTERED & WINNERS CHART WALLS */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        
        {/* Left Bottom Bento: Prize custom configurations (Bento Box 4) */}
        <div className="md:col-span-5 bg-white border-2 border-zinc-900 rounded-[2rem] p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col space-y-4">
          <div className="pb-3 border-b-2 border-zinc-100">
            <h3 className="text-base font-black text-zinc-900 uppercase tracking-tight flex items-center gap-2">
              <Award className="w-5 h-5 text-indigo-600" />
              抽籤獎項 Prizes
            </h3>
            <p className="text-xs text-zinc-400 font-semibold mt-0.5">自訂公司派對獎品的品目及預定中獎配額量</p>
          </div>

          {/* Form adding category */}
          <form onSubmit={handleAddPrize} className="grid grid-cols-12 gap-3 items-end bg-zinc-50 p-3 rounded-xl border border-zinc-200">
            <div className="col-span-8 space-y-1">
              <label className="text-[9px] font-extrabold text-zinc-500 uppercase tracking-wider">自訂獎品名稱</label>
              <input
                type="text"
                required
                value={customPrizeName}
                onChange={(e) => setCustomPrizeName(e.target.value)}
                placeholder="例如: 肆等獎 - 高級膠囊咖啡機"
                className="w-full text-xs bg-white border-2 border-zinc-900 rounded-lg p-2 text-zinc-900"
              />
            </div>
            
            <div className="col-span-4 space-y-1">
              <label className="text-[9px] font-extrabold text-zinc-500 uppercase tracking-wider">配額量</label>
              <div className="flex gap-1.5">
                <input
                  type="number"
                  min="1"
                  required
                  value={customPrizeAmount}
                  onChange={(e) => setCustomPrizeAmount(Number(e.target.value))}
                  className="w-full text-xs bg-white border-2 border-zinc-900 rounded-lg p-2 text-zinc-900 font-mono text-center"
                />
                <button
                  type="submit"
                  disabled={!customPrizeName.trim()}
                  className="bg-zinc-900 text-white hover:bg-zinc-800 text-xs font-black px-2.5 rounded-lg flex items-center justify-center cursor-pointer border border-zinc-900 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </form>

          {/* Prize catalog table lists */}
          <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
            {prizes.map((p) => {
              const countWon = winners.filter((w) => w.prizeId === p.id || w.prizeName === p.name).length;
              const isSelected = activePrizeId === p.id;
              
              return (
                <div
                  key={p.id}
                  onClick={() => setActivePrizeId(p.id)}
                  className={`p-3 rounded-xl border-2 flex items-center justify-between cursor-pointer transition-all duration-200 ${
                    isSelected
                      ? "bg-amber-100 border-zinc-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                      : "bg-white border-zinc-200 hover:border-zinc-900"
                  }`}
                >
                  <div className="space-y-1 truncate pr-2">
                    <p className="text-xs font-black text-zinc-900 truncate">
                      {p.name}
                    </p>
                    <div className="flex items-center gap-2 text-[10px] text-zinc-550 font-bold">
                      <span>配額: <span className="text-zinc-900 font-mono">{p.amount}名</span></span>
                      <span>•</span>
                      <span>已抽中: <span className="text-indigo-600 font-mono font-black">{countWon}名</span></span>
                    </div>
                  </div>

                  <div onClick={(e) => e.stopPropagation()}>
                    {prizes.length > 1 && (
                      <button
                        onClick={() => handleDeletePrize(p.id)}
                        className="text-zinc-400 hover:text-rose-600 p-1.5 hover:bg-rose-50 rounded-lg transition border border-transparent hover:border-rose-200 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Bottom Bento: Winner Wall Boards (Bento Box 5) */}
        <div className="md:col-span-7 bg-amber-50 border-2 border-zinc-900 rounded-[2rem] p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b-2 border-zinc-900/10">
              <div>
                <h3 className="text-base font-black text-zinc-900 uppercase tracking-tight flex items-center gap-2 italic">
                  👑 Winner Wall / 得獎金榜
                </h3>
                <p className="text-xs text-zinc-500 font-bold mt-0.5">尾牙現場中獎一覽表，支援刪除與匯出</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={exportWinnersToCSV}
                  disabled={winners.length === 0}
                  className="bg-white hover:bg-zinc-50 text-zinc-900 border-2 border-zinc-900 text-xs px-2.5 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer transition-all shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] font-extrabold"
                >
                  <Download className="w-3.5 h-3.5" />
                  匯出 CSV
                </button>
                <button
                  onClick={resetDrawnState}
                  disabled={winners.length === 0}
                  className="bg-white hover:bg-rose-50 text-rose-650 border-2 border-zinc-900 text-xs px-2.5 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer transition-all shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] font-extrabold"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  重新開始
                </button>
              </div>
            </div>

            {/* List Winners logs */}
            <div className="max-h-[220px] overflow-y-auto pr-1">
              {winners.length === 0 ? (
                <div className="text-center py-12 text-zinc-400 italic text-xs space-y-1 font-bold">
                  <p>🧧 目前得獎公布板空無一人</p>
                  <p className="text-[11px] font-medium">按下上方抽籤鈕，讓現場氣氛嗨起來！</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {winners.map((record, index) => (
                    <div
                      key={record.id}
                      className="bg-white border-2 border-zinc-900 p-3 rounded-xl flex items-center justify-between hover:bg-zinc-50 transition shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-[9px] font-black text-zinc-500 bg-zinc-100 border border-zinc-300 px-1.5 py-0.5 rounded">
                          NO.{winners.length - index}
                        </span>
                        <div>
                          <p className="text-xs font-black text-zinc-900">
                            {record.participantName} <span className="font-bold text-zinc-400 text-[10px]">({record.participantDepartment})</span>
                          </p>
                          <p className="text-[10px] text-indigo-700 font-extrabold">{record.prizeName}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-zinc-400 font-mono">{record.drawnTime}</span>
                        <button
                          onClick={() => removeWinnerRecord(record.id)}
                          className="text-zinc-400 hover:text-rose-600 p-1.5 hover:bg-rose-50 rounded-lg transition border border-transparent hover:border-rose-200 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="text-[10px] text-zinc-500 bg-white/60 p-2.5 rounded-lg border border-zinc-200 font-medium mt-4">
            📌 本防偽機制由瀏覽器本地端 LocalStorage 維持，即使中途重新整理網頁，得獎名單與剩餘候選人也絕對不會遺失。放心使用！
          </div>
        </div>

      </div>

      <CustomModal
        isOpen={modalOpen}
        type={modalType}
        title={modalTitle}
        description={modalDescription}
        onConfirm={() => {
          if (modalConfirmAction) modalConfirmAction();
          setModalOpen(false);
        }}
        onCancel={() => setModalOpen(false)}
      />

    </div>
  );
}
