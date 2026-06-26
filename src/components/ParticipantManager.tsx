import React, { useState, useRef } from "react";
import { Upload, Trash2, Plus, Users, Search, FileSpreadsheet, Sparkles, ClipboardPaste } from "lucide-react";
import { Participant } from "../types";
import CustomModal from "./CustomModal";

interface ParticipantManagerProps {
  participants: Participant[];
  onChange: (list: Participant[]) => void;
}

export default function ParticipantManager({ participants, onChange }: ParticipantManagerProps) {
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

  const [inputText, setInputText] = useState("");
  const [manualName, setManualName] = useState("");
  const [manualDept, setManualDept] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 計算重複姓名
  const nameCounts = React.useMemo(() => {
    const counts: Record<string, number> = {};
    participants.forEach((p) => {
      const name = p.name.trim();
      counts[name] = (counts[name] || 0) + 1;
    });
    return counts;
  }, [participants]);

  const hasDuplicates = React.useMemo(() => {
    return Object.keys(nameCounts).some((name) => nameCounts[name] > 1);
  }, [nameCounts]);

  const isDuplicateName = (name: string) => {
    return (nameCounts[name.trim()] || 0) > 1;
  };

  const removeAllDuplicates = () => {
    showModal(
      "confirm",
      "一次移除重複姓名",
      "確定要移除重複姓名嗎？系統將自動保留每位重複人員的第一筆資料，並將其餘重複的名單移除，以確保名冊內每人姓名皆為唯一。",
      () => {
        const seen = new Set<string>();
        const uniqueParticipants = participants.filter((p) => {
          const trimmed = p.name.trim();
          if (seen.has(trimmed)) {
            return false;
          }
          seen.add(trimmed);
          return true;
        });
        onChange(uniqueParticipants);
      }
    );
  };

  // Load standard mock company names for immediate demonstration
  const handleLoadMockData = () => {
    const mockNames = [
      { name: "陳智捷", dept: "技術研發部" },
      { name: "林雅婷", dept: "技術研發部" },
      { name: "張家豪", dept: "技術研發部" },
      { name: "黃千芳", dept: "技術研發部" },
      { name: "李佳穎", dept: "技術研發部" },
      { name: "王俊傑", dept: "市場行銷部" },
      { name: "張雅惠", dept: "市場行銷部" },
      { name: "劉冠廷", dept: "市場行銷部" },
      { name: "陳郁婷", dept: "市場行銷部" },
      { name: "江詩雅", dept: "市場行銷部" },
      { name: "楊安迪", dept: "產品設計部" },
      { name: "葉名揚", dept: "產品設計部" },
      { name: "謝欣妤", dept: "產品設計部" },
      { name: "高志宏", dept: "產品設計部" },
      { name: "蘇宇軒", dept: "產品營運部" },
      { name: "戴美玲", dept: "產品營運部" },
      { name: "蔡秉勳", dept: "人力資源部" },
      { name: "胡若涵", dept: "人力資源部" },
      { name: "郭士豪", dept: "財務管理部" },
      { name: "彭詩晴", dept: "財務管理部" },
      { name: "簡立群", dept: "客戶服務部" },
      { name: "周智勇", dept: "客戶服務部" },
      { name: "沈美惠", dept: "行政總務部" },
      { name: "徐佳霖", dept: "行政總務部" },
      { name: "馮翊綱", dept: "公共關係部" },
      { name: "羅大衛", dept: "海外銷售部" },
      { name: "莊小青", dept: "董事長室" },
      { name: "韋禮信", dept: "海外銷售部" },
      { name: "龔美華", dept: "客戶服務部" },
      { name: "施淑芬", dept: "行政總務部" }
    ];

    const parsed: Participant[] = mockNames.map((item, index) => ({
      id: `p-${Date.now()}-${index}`,
      name: item.name,
      department: item.dept,
      isDrawn: false
    }));

    onChange(parsed);
  };

  // Paste raw text processing
  const handlePasteProcess = () => {
    if (!inputText.trim()) return;
    const lines = inputText.split("\n");
    const parsed: Participant[] = [];

    lines.forEach((line, index) => {
      const cleanLine = line.trim();
      if (!cleanLine) return;

      // Detect common separators: comma, tab, space
      let name = cleanLine;
      let dept = "";

      if (cleanLine.includes(",") || cleanLine.includes("，")) {
        const parts = cleanLine.split(/[,，]/);
        name = parts[0].trim();
        dept = parts[1] ? parts[1].trim() : "";
      } else if (cleanLine.includes("\t")) {
        const parts = cleanLine.split("\t");
        name = parts[0].trim();
        dept = parts[1] ? parts[1].trim() : "";
      } else if (cleanLine.includes(" ") || cleanLine.includes("　")) {
        const parts = cleanLine.split(/[ 　]+/);
        name = parts[0].trim();
        dept = parts[1] ? parts[1].trim() : "";
      }

      if (name && name !== "姓名" && name !== "Name") {
        parsed.push({
          id: `p-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 4)}`,
          name,
          department: dept || "無部門",
          isDrawn: false
        });
      }
    });

    if (parsed.length > 0) {
      onChange([...participants, ...parsed]);
      setInputText("");
    }
  };

  // Reusable parser
  const parseAndLoadFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      const lines = text.split(/\r?\n/);
      const parsed: Participant[] = [];

      lines.forEach((line, index) => {
        const cleanLine = line.trim();
        if (!cleanLine) return;

        let name = cleanLine;
        let dept = "";

        // Parse CSV columns
        if (cleanLine.includes(",")) {
          const parts = cleanLine.split(",");
          name = parts[0].replace(/^["']|["']$/g, "").trim();
          dept = parts[1] ? parts[1].replace(/^["']|["']$/g, "").trim() : "";
        } else if (cleanLine.includes("\t")) {
          const parts = cleanLine.split("\t");
          name = parts[0].trim();
          dept = parts[1] ? parts[1].trim() : "";
        }

        // Filter standard CSV headers like 'name', '姓名', 'department'
        if (
          name &&
          name !== "姓名" &&
          name !== "name" &&
          name !== "Name" &&
          name !== "ID" &&
          name !== "id"
        ) {
          parsed.push({
            id: `p-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 4)}`,
            name,
            department: dept || "無部門",
            isDrawn: false
          });
        }
      });

      if (parsed.length > 0) {
        onChange([...participants, ...parsed]);
      }
    };
    reader.readAsText(file);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    parseAndLoadFile(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      parseAndLoadFile(file);
    }
  };

  // Individual manual adds
  const handleAddSingle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualName.trim()) return;

    const newParticipant: Participant = {
      id: `p-${Date.now()}`,
      name: manualName.trim(),
      department: manualDept.trim() || "海外銷售部",
      isDrawn: false
    };

    onChange([...participants, newParticipant]);
    setManualName("");
    setManualDept("");
  };

  // Deletions
  const deleteParticipant = (id: string) => {
    onChange(participants.filter((p) => p.id !== id));
  };

  const clearAll = () => {
    showModal(
      "confirm",
      "重設名單與抽籤狀態",
      "確定要清空所有名單嗎？此操作將同時重置所有抽籤及分組紀錄。",
      () => {
        onChange([]);
      }
    );
  };

  // Search filter
  const filteredParticipants = participants.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.department && p.department.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Group by department statistics
  const deptCount = participants.reduce((acc: { [key: string]: number }, cur) => {
    const d = cur.department || "無部門";
    acc[d] = (acc[d] || 0) + 1;
    return acc;
  }, {});

  return (
    <div id="participant-manager-section" className="space-y-8 animate-fadeIn">
      {/* Bento Layout Grid for Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Data Input Source Card (Bento Box 1) */}
        <div className="lg:col-span-8 bg-white border-2 border-zinc-900 rounded-[2rem] p-6 sm:p-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b-2 border-zinc-100">
            <div>
              <h3 className="text-xl font-black text-zinc-900 uppercase tracking-tight flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-600" />
                匯入名單 Data Import
              </h3>
              <p className="text-xs text-zinc-400 font-bold mt-0.5">匯入 CSV 檔案或直接貼上員工名單</p>
            </div>
            
            <button
              onClick={handleLoadMockData}
              className="text-xs bg-amber-400 font-black text-zinc-900 border-2 border-zinc-900 px-4 py-2 rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 active:translate-y-0.5 transition-all duration-200 flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-zinc-900" />
              載入測試範例名單 (30人)
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Sub-Box: Text Paste Container */}
            <div className="space-y-3">
              <label className="text-xs font-extrabold text-zinc-700 uppercase tracking-wider flex items-center gap-1.5">
                <ClipboardPaste className="w-4 h-4 text-zinc-500" />
                大量貼上 (每行一人)
              </label>
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="基本格式: 姓名&#10;進階格式 1: 黃千芳, 行政部&#10;進階格式 2: 陳智捷 研發部"
                rows={6}
                className="w-full text-xs bg-zinc-50 border-2 border-zinc-900 rounded-xl p-3 text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-indigo-600 font-mono resize-none shadow-inner"
              />
              <button
                type="button"
                onClick={handlePasteProcess}
                disabled={!inputText.trim()}
                className="w-full bg-zinc-900 hover:bg-zinc-800 text-white font-black py-2.5 px-3 rounded-lg border-2 border-zinc-900 transition-all disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center gap-1.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
              >
                確認批次解析貼上
              </button>
            </div>

            {/* Sub-Box: Drag / Upload */}
            <div className="flex flex-col justify-between space-y-3">
              <div className="space-y-3">
                <label className="text-xs font-extrabold text-zinc-700 uppercase tracking-wider flex items-center gap-1.5">
                  <FileSpreadsheet className="w-4 h-4 text-zinc-500" />
                  上傳資料檔 CSV / TXT
                </label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2 rounded-xl p-5 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all duration-200 ${
                    isDragOver
                      ? "border-indigo-600 bg-indigo-50/50 scale-[1.02] shadow-[4px_4px_0px_0px_rgba(79,70,229,1)] border-solid"
                      : "border-dashed border-zinc-300 hover:border-zinc-900 hover:bg-zinc-100/50 bg-zinc-50"
                  }`}
                >
                  <div className={`p-2 rounded-full border transition-all duration-200 ${
                    isDragOver ? "bg-indigo-100 border-indigo-400 text-indigo-600" : "bg-zinc-100 border-zinc-300 text-zinc-600"
                  }`}>
                    <Upload className="w-6 h-6 animate-pulse" />
                  </div>
                  <span className={`text-xs font-bold text-center transition-all duration-200 ${
                    isDragOver ? "text-indigo-700 font-black" : "text-zinc-700"
                  }`}>
                    {isDragOver ? "放開滑鼠即可匯入名冊！" : "點擊或拖曳檔案上傳"}
                  </span>
                  <span className="text-[10px] text-zinc-400 text-center font-bold">
                    支援逗號或 Tab 分隔，格式簡單
                  </span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.txt"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>
              </div>

              <div className="text-[11px] text-zinc-500 bg-zinc-100 p-3 rounded-xl border border-zinc-200 leading-relaxed font-medium">
                <p className="font-extrabold text-zinc-800 mb-1">💡 Excel 製作小撇步：</p>
                <p>將 Excel 另存為 .CSV (UTF-8) 格式，直接拖至上方，即可全自動將表格灌入系統。</p>
              </div>
            </div>
          </div>

          {/* Form: Add Individual Member manually */}
          <form onSubmit={handleAddSingle} className="pt-4 border-t-2 border-zinc-100 grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
            <div className="space-y-1">
              <label className="text-[10px] font-extrabold text-zinc-500 uppercase tracking-wider">員工姓名</label>
              <input
                type="text"
                required
                value={manualName}
                onChange={(e) => setManualName(e.target.value)}
                placeholder="例如：陳大文"
                className="w-full text-xs bg-zinc-50 border-2 border-zinc-900 rounded-lg p-2.5 text-zinc-900 focus:outline-none focus:border-indigo-600 font-bold"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-extrabold text-zinc-500 uppercase tracking-wider">部門類別 (選填)</label>
              <input
                type="text"
                value={manualDept}
                onChange={(e) => setManualDept(e.target.value)}
                placeholder="例如：技術研發部"
                className="w-full text-xs bg-zinc-50 border-2 border-zinc-900 rounded-lg p-2.5 text-zinc-900 focus:outline-none focus:border-indigo-600 font-bold"
              />
            </div>
            <button
              type="submit"
              disabled={!manualName.trim()}
              className="bg-zinc-900 hover:bg-zinc-800 text-white font-extrabold text-xs py-3 px-4 rounded-lg flex items-center justify-center gap-1.5 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              手動新增一員
            </button>
          </form>
        </div>

        {/* Right Column: Statistics Bento Sidebar (Bento Box 2) */}
        <div className="lg:col-span-4 bg-amber-50 border-2 border-zinc-900 rounded-[2rem] p-6 flex flex-col justify-between shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <div className="space-y-4">
            <h3 className="text-lg font-black text-zinc-900 uppercase tracking-tight pb-2 border-b border-zinc-900/10 italic">
              Overview
            </h3>
            
            <div className="bg-white border-2 border-zinc-900 p-4 rounded-2xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <p className="text-xs text-zinc-400 font-bold uppercase tracking-wider">當前總人數</p>
              <p className="text-4xl font-extrabold text-indigo-600 font-mono tracking-tighter mt-1">
                {participants.length} <span className="text-xs font-black text-zinc-900">人</span>
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white border text-zinc-900 border-zinc-900/30 p-2.5 rounded-xl text-center">
                <span className="text-[10px] text-zinc-400 font-bold block uppercase">部門總數</span>
                <span className="text-lg font-black font-mono text-zinc-800">{Object.keys(deptCount).length} 個</span>
              </div>
              <div className="bg-white border text-zinc-900 border-zinc-900/30 p-2.5 rounded-xl text-center">
                <span className="text-[10px] text-zinc-400 font-bold block uppercase">已抽免控</span>
                <span className="text-lg font-black font-mono text-emerald-600">
                  {participants.filter((p) => p.isDrawn).length} 人
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-black text-zinc-650 uppercase tracking-wide">部門成員組成分布：</p>
              <div className="max-h-[140px] overflow-y-auto pr-1 space-y-1 text-xs">
                {Object.keys(deptCount).length === 0 ? (
                  <p className="text-xs text-zinc-401 italic">尚未匯入任何資料名冊</p>
                ) : (
                  Object.entries(deptCount).map(([dept, count]) => (
                    <div key={dept} className="flex items-center justify-between py-1 border-b border-zinc-900/5 font-bold text-zinc-700">
                      <span className="truncate max-w-[130px]">{dept}</span>
                      <span className="font-mono bg-zinc-200/50 px-2 py-0.5 rounded text-[11px] text-zinc-900">{count} 人</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-zinc-900/10 flex justify-end">
            <button
              onClick={clearAll}
              disabled={participants.length === 0}
              className="text-xs font-black text-rose-600 hover:bg-rose-50 border-2 border-zinc-900/20 hover:border-rose-600 px-4 py-2.5 rounded-xl transition-all duration-200 flex items-center gap-1.5 cursor-pointer disabled:opacity-35 disabled:pointer-events-none"
            >
              <Trash2 className="w-4 h-4" />
              清空全體名冊
            </button>
          </div>
        </div>
      </div>

      {/* Roster list preview (Bento Box 3 - Wide bottom) */}
      <div className="bg-white border-2 border-zinc-900 rounded-[2rem] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
        <div className="p-5 border-b-2 border-zinc-150 bg-zinc-50/50 flex flex-col lg:flex-row gap-4 items-center justify-between">
          <div>
            <h3 className="text-lg font-black text-zinc-900 uppercase tracking-tight flex flex-wrap items-center gap-2">
              預覽匯入名單 ({filteredParticipants.length} 人)
              {hasDuplicates && (
                <span className="text-xs bg-rose-100 text-rose-700 border border-rose-300 px-2 py-0.5 rounded-full font-extrabold animate-pulse">
                  ⚠️ 發現重複姓名！
                </span>
              )}
            </h3>
            <p className="text-xs text-zinc-400 font-bold mt-0.5">預覽所有已讀入派對現場的職工，支援在此修正刪改</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto items-stretch sm:items-center">
            {hasDuplicates && (
              <button
                type="button"
                onClick={removeAllDuplicates}
                className="text-xs font-black bg-rose-500 hover:bg-rose-600 text-white border-2 border-zinc-900 px-4 py-2.5 rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 active:translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap neo-btn-pressable"
              >
                <Trash2 className="w-3.5 h-3.5" />
                一次移除重複姓名
              </button>
            )}

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="搜尋姓名或所屬組織部門..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs font-bold bg-white border-2 border-zinc-900 rounded-xl pl-9 pr-3 py-2 text-zinc-900 focus:outline-none focus:border-indigo-600"
              />
            </div>
          </div>
        </div>

        <div className="max-h-[340px] overflow-y-auto p-6 bg-zinc-50/20">
          {filteredParticipants.length === 0 ? (
            <div className="py-12 text-center text-zinc-400 space-y-2">
              <Users className="w-12 h-12 mx-auto opacity-20 text-indigo-600" />
              <p className="text-sm font-black uppercase">池中一片虛無 空空如也</p>
              <p className="text-xs font-bold">請向上拉，利用貼上名冊、或上傳 csv 資料檔載入員工數據</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredParticipants.map((p) => {
                const isDup = isDuplicateName(p.name);
                return (
                  <div
                    key={p.id}
                    className={`border-2 p-4 rounded-xl flex items-center justify-between hover:bg-zinc-50/80 transition-all group hover:translate-x-[-1px] hover:translate-y-[-1px] ${
                      isDup
                        ? "bg-rose-50/70 border-rose-600 shadow-[2px_2px_0px_0px_rgba(225,29,72,1)] hover:shadow-[3px_3px_0px_0px_rgba(225,29,72,1)]"
                        : "bg-white border-zinc-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
                    }`}
                  >
                    <div className="space-y-1 truncate pr-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <p className={`text-sm font-extrabold truncate ${isDup ? "text-rose-700" : "text-zinc-900"}`}>
                          {p.name}
                        </p>
                        {isDup && (
                          <span className="text-[9px] bg-rose-600 text-white font-black px-1.5 py-0.5 rounded-md uppercase tracking-tighter shrink-0">
                            重複
                          </span>
                        )}
                      </div>
                      <p className={`text-[10px] font-black truncate uppercase tracking-wider ${isDup ? "text-rose-500" : "text-zinc-450"}`}>
                        {p.department || "一般成員"}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => deleteParticipant(p.id)}
                      className={`p-1.5 rounded-lg group-hover:opacity-100 transition duration-200 border border-transparent cursor-pointer ${
                        isDup
                          ? "text-rose-500 hover:text-rose-800 hover:bg-rose-100/50 hover:border-rose-300"
                          : "text-zinc-400 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200"
                      }`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
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
