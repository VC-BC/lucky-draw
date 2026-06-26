import React, { useState } from "react";
import { Users, Shuffle, Clipboard, Layers, RefreshCw, Download, Check } from "lucide-react";
import { Participant, Group } from "../types";

interface AutoGroupingProps {
  participants: Participant[];
}

// Pre-defined group naming packages for fun options
const NAMING_THEMES = {
  numbers: ["第 1 組", "第 2 組", "第 3 組", "第 4 組", "第 5 組", "第 6 組", "第 7 組", "第 8 組", "第 9 組", "第 10 組", "第 11 組", "第 12 組", "第 13 組", "第 14 組", "第 15 組"],
  animals: ["🌪️ 狂暴猛虎隊", "🦅 傲天巨鷹隊", "🦁 霸王金獅隊", "🐆 閃電獵豹隊", "🐲 翱翔飛龍隊", "🐺 戰神孤狼隊", "🦈 海域狂鯊隊", "🐼 神龍熊貓隊", "🐴 奔騰野馬隊", "🦉 智慧神鷹隊"],
  party: ["🍺 千杯不醉先鋒", "💰 營收破億突擊隊", "🍀 尾牙超級歐皇", "🎤 派對歌神分隊", "🍗 吃貨大飽口福", "🚀 業績直衝雲霄", "💎 全勤高光閃耀", "🔥 活力四射熱舞", "🥂 乾杯喝爆天團", "🎪 狂歡嘉年華部"],
  tech: ["🤖 智慧 AI 核心組", "☁️ 雲端代碼先鋒隊", "🔐 資訊安全神盾局", "🚀 敏捷研發特攻隊", "🕶️ 未來元宇宙分部", "⚡ 超導晶片先鋒", "🧬 高速區塊鏈隊", "🎨 極致像素美學", "📊 大數據探針部", "🧪 核心黑科技組"]
};

export default function AutoGrouping({ participants }: AutoGroupingProps) {
  const [groupType, setGroupType] = useState<"size" | "count">("size");
  const [sizeValue, setSizeValue] = useState<number>(5); // Default 5 members per group
  const [countValue, setCountValue] = useState<number>(4); // Default 4 groups in total
  const [namingTheme, setNamingTheme] = useState<keyof typeof NAMING_THEMES>("party");
  const [groups, setGroups] = useState<Group[]>([]);
  const [isCopied, setIsCopied] = useState<boolean>(false);

  // Perform random grouping
  const handleGrouping = () => {
    if (participants.length === 0) {
      alert("請先導入至少一位名單成員！");
      return;
    }

    // Clone and shuffle original list
    const shuffled = [...participants].sort(() => Math.random() - 0.5);
    const totalCount = shuffled.length;

    let targetGroupCount = 0;
    if (groupType === "size") {
      // Size: how many members per group
      const perGroup = Math.max(1, sizeValue);
      targetGroupCount = Math.ceil(totalCount / perGroup);
    } else {
      // Count: exact total groups
      targetGroupCount = Math.min(totalCount, Math.max(1, countValue));
    }

    if (targetGroupCount <= 0) return;

    // Create containers for groups
    const newGroups: Group[] = Array.from({ length: targetGroupCount }, (_, i) => {
      // Pick team name from active theme packages
      const selectedNames = NAMING_THEMES[namingTheme];
      const fallbackName = `第 ${i + 1} 組`;
      const name = selectedNames[i % selectedNames.length] || fallbackName;
      
      return {
        id: `group-${Date.now()}-${i}`,
        name,
        members: []
      };
    });

    // Strategy 1: Distribute evenly to prevent massive disparity (e.g., last group having just 1 person)
    shuffled.forEach((person, index) => {
      const targetIndex = index % targetGroupCount;
      newGroups[targetIndex].members.push(person);
    });

    setGroups(newGroups);
  };

  const copyResults = () => {
    if (groups.length === 0) return;

    let text = "🎉 公司派對 - 智能分組結果 🎉\n";
    text += "=============================\n\n";

    groups.forEach((g) => {
      text += `📍 【${g.name}】(${g.members.length} 人):\n`;
      text += `   ${g.members.map((m) => `${m.name} (${m.department || "無部門"})`).join("、")}\n\n`;
    });

    navigator.clipboard.writeText(text).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  };

  const exportGroupsCSV = () => {
    if (groups.length === 0) return;
    let csvContent = "\uFEFF"; // UTF-8 BOM
    csvContent += "分組名稱,成員姓名,成員部門\n";

    groups.forEach((g) => {
      g.members.forEach((m) => {
        csvContent += `"${g.name}","${m.name}","${m.department || "無部門"}"\n`;
      });
    });

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `公司Party分組名單_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      
      {/* Parameter Settings Grid (Bento Box 1) */}
      <div className="bg-white border-2 border-zinc-900 rounded-[2rem] p-6 sm:p-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-6">
        <div className="pb-3 border-b-2 border-zinc-150 flex items-center gap-2">
          <Users className="w-5 h-5 text-indigo-600" />
          <h3 className="text-xl font-black text-zinc-900 uppercase tracking-tight">
            分組規則 Board
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Box 1: Decide Mechanism (Bento Style Sub-block) */}
          <div className="bg-zinc-50 p-5 rounded-2xl border-2 border-zinc-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between space-y-4">
            <div>
              <label className="text-xs font-extrabold text-zinc-500 uppercase tracking-wider block">1. 選擇分組模式</label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setGroupType("size")}
                  className={`py-2 px-3 text-xs font-black rounded-lg border-2 transition-all cursor-pointer ${
                    groupType === "size"
                      ? "bg-amber-400 border-zinc-900 text-zinc-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                      : "bg-white border-zinc-300 text-zinc-400"
                  }`}
                >
                  按每組人數
                </button>
                <button
                  type="button"
                  onClick={() => setGroupType("count")}
                  className={`py-2 px-3 text-xs font-black rounded-lg border-2 transition-all cursor-pointer ${
                    groupType === "count"
                      ? "bg-amber-400 border-zinc-900 text-zinc-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                      : "bg-white border-zinc-300 text-zinc-400"
                  }`}
                >
                  按總共組數
                </button>
              </div>
            </div>
            
            <p className="text-[10px] text-zinc-400 leading-relaxed font-bold">
              {groupType === "size"
                ? "💡 按「每組湊足幾人」進行分配。最後由系統進行自動除算，確保不會有多餘零碎的人員落單。"
                : "💡 按「希望均分成幾組」進行分配。每組職工的數量將分配至最均等比例。"}
            </p>
          </div>

          {/* Box 2: Numerical Parameter Adjust (Bento Style Sub-block) */}
          <div className="bg-zinc-50 p-5 rounded-2xl border-2 border-zinc-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between space-y-4">
            <div>
              <label className="text-xs font-extrabold text-zinc-500 uppercase tracking-wider block">2. 設定限制參數</label>
              
              {groupType === "size" ? (
                <div className="space-y-3 mt-2">
                  <div className="flex justify-between font-extrabold text-xs">
                    <span className="text-zinc-600">單組配置上限：</span>
                    <span className="text-indigo-600 font-mono text-sm">{sizeValue} 人 / 組</span>
                  </div>
                  <input
                    type="range"
                    min="2"
                    max={Math.min(30, Math.max(3, participants.length))}
                    value={sizeValue}
                    onChange={(e) => setSizeValue(Number(e.target.value))}
                    disabled={participants.length < 2}
                    className="w-full accent-indigo-600 bg-zinc-200 h-1.5 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-[9px] text-zinc-400 font-bold">
                    <span>2 人</span>
                    <span>30 人上限</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 mt-2">
                  <div className="flex justify-between font-extrabold text-xs">
                    <span className="text-zinc-600">全場目標組數：</span>
                    <span className="text-indigo-600 font-mono text-sm">{countValue} 個小組</span>
                  </div>
                  <input
                    type="range"
                    min="2"
                    max={Math.min(15, Math.max(3, participants.length))}
                    value={countValue}
                    onChange={(e) => setCountValue(Number(e.target.value))}
                    disabled={participants.length < 2}
                    className="w-full accent-indigo-600 bg-zinc-200 h-1.5 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-[9px] text-zinc-400 font-bold">
                    <span>2 組</span>
                    <span>15 組上限</span>
                  </div>
                </div>
              )}
            </div>

            <div className="text-[10px] text-indigo-600 font-bold pt-2 border-t border-zinc-900/5">
              當前池中名單成員：<span className="font-mono text-zinc-900 font-extrabold">{participants.length} 人</span> 
            </div>
          </div>

          {/* Box 3: Select Team Names Themes (Bento Style Sub-block) */}
          <div className="bg-zinc-50 p-5 rounded-2xl border-2 border-zinc-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between space-y-4">
            <div>
              <label className="text-xs font-extrabold text-zinc-500 uppercase tracking-wider block">3. 隨機風格隊名</label>
              <div className="grid grid-cols-2 gap-1.5 mt-2">
                {(Object.keys(NAMING_THEMES) as Array<keyof typeof NAMING_THEMES>).map((theme) => {
                  const labelMap = {
                    numbers: "普通數字",
                    animals: "猛獸圖騰",
                    party: "派對熱血",
                    tech: "極致硬核"
                  };
                  return (
                    <button
                      key={theme}
                      type="button"
                      onClick={() => setNamingTheme(theme)}
                      className={`py-1.5 px-2 text-[10px] font-black rounded-lg border-2 text-center transition cursor-pointer ${
                        namingTheme === theme
                          ? "bg-amber-400 border-zinc-900 text-zinc-900 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                          : "bg-white border-zinc-200 text-zinc-400"
                      }`}
                    >
                      {labelMap[theme]}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              onClick={handleGrouping}
              disabled={participants.length < 2}
              className="w-full bg-zinc-900 hover:bg-zinc-800 disabled:bg-zinc-300 disabled:text-zinc-500 text-white text-xs font-black py-2.5 px-4 rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 active:translate-y-0.5 transition duration-200 flex items-center justify-center gap-1.5 cursor-pointer mt-2"
            >
              <Shuffle className="w-3.5 h-3.5" />
              立即隨機平衡洗牌分組
            </button>
          </div>
        </div>
      </div>

      {/* Group Preview Board Area (Bento Row 2) */}
      {groups.length === 0 ? (
        <div className="bg-white border-2 border-zinc-900 rounded-[2rem] p-12 text-center text-zinc-400 space-y-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <Layers className="w-12 h-12 mx-auto opacity-20 text-indigo-600" />
          <p className="text-sm font-black uppercase tracking-wider text-zinc-700">尚未建立任何分組數據</p>
          <p className="text-xs font-bold text-zinc-400">請設定上方規則，並點選「立即隨機平衡洗牌分組」！</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="bg-emerald-400 text-zinc-900 text-[10px] px-2.5 py-1 rounded-full border-2 border-zinc-900 font-extrabold font-mono shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                SUCCESSFUL
              </span>
              <h3 className="text-lg font-black text-zinc-900 uppercase tracking-tight">
                自動分組名單一覽 (共分配為 {groups.length} 組)
              </h3>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={copyResults}
                className="bg-white hover:bg-zinc-50 text-zinc-900 border-2 border-zinc-900 text-xs px-3 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] font-extrabold"
              >
                <Clipboard className="w-3.5 h-3.5" />
                {isCopied ? "複製成功！" : "複製隊形名冊"}
              </button>
              <button
                onClick={exportGroupsCSV}
                className="bg-white hover:bg-zinc-50 text-zinc-900 border-2 border-zinc-900 text-xs px-3 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] font-extrabold"
              >
                <Download className="w-3.5 h-3.5" />
                匯出 CSV 資料表
              </button>
              <button
                onClick={handleGrouping}
                className="bg-amber-400 hover:bg-amber-300 text-zinc-900 border-2 border-zinc-900 text-xs px-3 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] font-extrabold"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                重新洗牌分組
              </button>
            </div>
          </div>

          {/* Cards Flex Grid of Group Blocks */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {groups.map((group, groupIdx) => (
              <div
                key={group.id}
                className="bg-white border-2 border-zinc-900 rounded-[2rem] p-5 space-y-4 overflow-hidden relative shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all duration-200"
              >
                {/* Board Group Header */}
                <div className="flex items-center justify-between border-b-2 border-zinc-150 pb-3">
                  <div className="space-y-0.5 truncate pr-2">
                    <p className="text-[9px] text-zinc-400 font-extrabold uppercase font-mono tracking-widest">GROUP 0{groupIdx + 1}</p>
                    <h4 className="text-base font-black text-zinc-900 truncate">
                      {group.name}
                    </h4>
                  </div>
                  <span className="text-xs bg-indigo-50 border-2 border-zinc-950 px-2.5 py-1 rounded-xl text-indigo-700 font-mono font-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                    {group.members.length} 人
                  </span>
                </div>

                {/* Team member rosters list */}
                <div className="space-y-2 min-h-[140px] max-h-[220px] overflow-y-auto pr-1">
                  {group.members.map((member, mIdx) => (
                    <div
                      key={member.id}
                      className="bg-zinc-50 border border-zinc-200 p-2.5 rounded-xl flex items-center justify-between text-xs font-bold"
                    >
                      <div className="space-y-0.5 truncate">
                        <p className="text-zinc-800 truncate">
                          <span className="text-indigo-600 font-mono mr-1 font-black">{(mIdx + 1).toString().padStart(2, "0")}</span> {member.name}
                        </p>
                        <p className="text-[10px] text-zinc-400 truncate pl-5">
                          {member.department || "無部門"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
