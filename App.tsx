
import React, { useState, useEffect } from 'react';
import { Trophy, RefreshCw, QrCode, MessageCircle, Star, Sparkles, CheckCircle2, X, Share2, Info, Copy, Check } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { TOTAL_STAMPS, STAMP_NAMES } from './constants';
import { StampRecord, UserProgress } from './types';
import { getStampMotivation } from './services/geminiService';

const App: React.FC = () => {
  const [progress, setProgress] = useState<UserProgress>({ stamps: [], rewardClaimed: false });
  const [aiMessage, setAiMessage] = useState<{ message: string; encouragement: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showDemoLinks, setShowDemoLinks] = useState(false);
  const [lastAdded, setLastAdded] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  
  // Modals State
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [qrPoint, setQrPoint] = useState<number>(1);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('digital_stamp_progress');
    if (saved) {
      setProgress(JSON.parse(saved));
    }
  }, []);

  // Save to localStorage when state changes
  useEffect(() => {
    localStorage.setItem('digital_stamp_progress', JSON.stringify(progress));
  }, [progress]);

  // Handle URL Parameter Logic
  useEffect(() => {
    const handleUrlParams = async () => {
      const params = new URLSearchParams(window.location.search);
      const pointStr = params.get('point');
      
      if (pointStr) {
        const pointId = parseInt(pointStr, 10);
        if (pointId >= 1 && pointId <= TOTAL_STAMPS) {
          const exists = progress.stamps.some(s => s.id === pointId);
          if (!exists) {
            setIsLoading(true);
            const newStamp: StampRecord = {
              id: pointId,
              timestamp: new Date().toISOString(),
              name: STAMP_NAMES[pointId - 1]
            };
            
            setProgress(prev => ({
              ...prev,
              stamps: [...prev.stamps, newStamp].sort((a, b) => a.id - b.id)
            }));
            setLastAdded(pointId);

            // Fetch AI Message
            const msg = await getStampMotivation(pointId - 1, TOTAL_STAMPS);
            setAiMessage(msg);
            setIsLoading(false);

            // Clear URL param without refreshing
            const newUrl = window.location.origin + window.location.pathname;
            window.history.replaceState({}, '', newUrl);
          }
        }
      }
    };

    handleUrlParams();
  }, [progress.stamps]);

  const resetProgress = () => {
    if (confirm("確定要重置所有集章紀錄嗎？")) {
      setProgress({ stamps: [], rewardClaimed: false });
      setAiMessage(null);
      setLastAdded(null);
    }
  };

  const copyToClipboard = () => {
    const url = window.location.origin + window.location.pathname;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const claimReward = () => {
    if (progress.stamps.length === TOTAL_STAMPS) {
      setProgress(prev => ({ ...prev, rewardClaimed: true }));
    }
  };

  const getQRUrl = (point: number) => {
    const url = new URL(window.location.origin + window.location.pathname);
    url.searchParams.set('point', point.toString());
    return url.toString();
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center py-10 px-4">
      {/* Header */}
      <header className="max-w-md w-full mb-8 flex flex-col items-center">
        <div className="w-full flex justify-between items-center mb-6">
           <button 
            onClick={() => setIsInfoModalOpen(true)}
            className="p-3 bg-white rounded-xl shadow-sm border border-slate-200 text-slate-400 hover:text-indigo-600 transition-colors"
          >
            <Info className="w-5 h-5" />
          </button>
          <div className="relative">
             <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>
             <div className="inline-flex items-center justify-center p-3 bg-indigo-600 rounded-2xl shadow-lg">
                <Sparkles className="text-white w-6 h-6" />
             </div>
          </div>
          <button 
            onClick={copyToClipboard}
            className="p-3 bg-white rounded-xl shadow-sm border border-slate-200 text-slate-400 hover:text-indigo-600 transition-colors flex items-center gap-2"
          >
            {copied ? <Check className="w-5 h-5 text-green-500" /> : <Share2 className="w-5 h-5" />}
          </button>
        </div>
        
        <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight text-center">
          集章大師 <span className="text-indigo-600">Digital</span>
        </h1>
        <p className="text-slate-500 mt-2 font-medium">收集 6 枚印章解鎖限定獎勵！</p>
      </header>

      {/* Main Card */}
      <main className="max-w-md w-full bg-white rounded-3xl shadow-xl shadow-slate-200/60 p-6 border border-slate-100 relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-50 rounded-full blur-3xl opacity-60"></div>
        
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-bold text-slate-700">完成進度</span>
            <span className="text-sm font-black text-indigo-600">{progress.stamps.length} / {TOTAL_STAMPS}</span>
          </div>
          <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-indigo-500 transition-all duration-700 ease-out rounded-full"
              style={{ width: `${(progress.stamps.length / TOTAL_STAMPS) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Stamp Grid */}
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: TOTAL_STAMPS }).map((_, i) => {
            const stampId = i + 1;
            const collected = progress.stamps.find(s => s.id === stampId);
            const isNew = lastAdded === stampId;

            return (
              <div 
                key={stampId}
                className={`
                  aspect-square rounded-2xl border-2 flex flex-col items-center justify-center relative transition-all duration-300
                  ${collected 
                    ? 'border-indigo-100 bg-indigo-50/30' 
                    : 'border-dashed border-slate-200 bg-slate-50/50'}
                `}
              >
                {collected ? (
                  <div className={`flex flex-col items-center ${isNew ? 'stamp-reveal' : ''}`}>
                    <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center shadow-lg shadow-indigo-200">
                      <Star className="text-white w-6 h-6 fill-current" />
                    </div>
                    <span className="text-[10px] mt-2 font-bold text-indigo-700 uppercase tracking-tighter">
                      {STAMP_NAMES[i].split(' ')[0]}
                    </span>
                  </div>
                ) : (
                  <span className="text-slate-300 font-black text-2xl">{stampId}</span>
                )}
                
                {collected && (
                  <div className="absolute -top-1 -right-1 bg-white rounded-full">
                    <CheckCircle2 className="w-5 h-5 text-green-500 fill-white" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* AI & Interaction Panel */}
        <div className="mt-8 space-y-4">
          {aiMessage && (
            <div className="bg-indigo-50/80 border border-indigo-100 p-4 rounded-2xl animate-in fade-in slide-in-from-bottom-2 duration-500">
              <div className="flex gap-3">
                <div className="mt-1">
                  <div className="w-8 h-8 bg-indigo-200 rounded-lg flex items-center justify-center">
                    <MessageCircle className="w-5 h-5 text-indigo-600" />
                  </div>
                </div>
                <div>
                  <p className="text-slate-800 font-semibold text-sm leading-tight mb-1">{aiMessage.message}</p>
                  <p className="text-slate-500 text-xs italic">{aiMessage.encouragement}</p>
                </div>
              </div>
            </div>
          )}

          {progress.stamps.length === TOTAL_STAMPS && !progress.rewardClaimed && (
            <button 
              onClick={claimReward}
              className="w-full py-4 bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded-2xl font-black text-lg shadow-xl shadow-orange-200 hover:scale-[1.02] transition-transform active:scale-95 flex items-center justify-center gap-2"
            >
              <Trophy className="w-6 h-6" />
              領取終極獎勵
            </button>
          )}

          {progress.rewardClaimed && (
            <div className="text-center p-6 border-4 border-amber-400 rounded-3xl bg-amber-50">
              <div className="inline-block p-4 bg-amber-400 rounded-full mb-3">
                <Trophy className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-black text-amber-800">恭喜完成！</h2>
              <p className="text-amber-700/80 font-medium">您已成為集章大師，請向店員出示此畫面。</p>
            </div>
          )}
        </div>
      </main>

      {/* Tools & Demo */}
      <div className="max-w-md w-full mt-6 flex flex-col gap-4">
        <div className="flex gap-3">
          <button 
            onClick={() => setShowDemoLinks(!showDemoLinks)}
            className="flex-1 py-3 bg-white rounded-xl border border-slate-200 text-slate-600 font-bold text-sm flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors"
          >
            <QrCode className="w-4 h-4" />
            模擬掃描 & QR 產生 (Demo)
          </button>
          <button 
            onClick={resetProgress}
            className="px-4 py-3 bg-white rounded-xl border border-slate-200 text-rose-500 font-bold text-sm flex items-center justify-center gap-2 hover:bg-rose-50 hover:border-rose-100 transition-colors"
            title="Reset All Progress"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {showDemoLinks && (
          <div className="bg-slate-200/50 p-4 rounded-2xl border border-slate-300/50 space-y-3 animate-in zoom-in-95 duration-300">
             <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest text-center">模擬測試與 QR 碼導出</p>
            <div className="grid grid-cols-3 gap-2">
              {Array.from({ length: TOTAL_STAMPS }).map((_, i) => (
                <a 
                  key={i}
                  href={`?point=${i + 1}`}
                  className="py-2 px-1 bg-white border border-slate-300 rounded-lg text-[10px] font-black text-center hover:bg-indigo-600 hover:text-white transition-colors uppercase"
                >
                  測試章 #{i + 1}
                </a>
              ))}
            </div>
            
            <button 
              onClick={() => setIsQRModalOpen(true)}
              className="w-full py-2 bg-indigo-600 text-white rounded-lg text-xs font-black flex items-center justify-center gap-2 shadow-lg shadow-indigo-100 hover:bg-indigo-700 active:scale-[0.98] transition-all"
            >
              <QrCode className="w-3.5 h-3.5" />
              產生實體集點 QR Code
            </button>
          </div>
        )}
      </div>

      <footer className="mt-12 text-slate-400 text-xs font-medium uppercase tracking-widest">
        &copy; 2024 Digital Stamp System v1.1
      </footer>

      {/* Info Modal */}
      {isInfoModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[70] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] w-full max-w-md p-8 relative shadow-2xl animate-in fade-in zoom-in duration-300">
            <button onClick={() => setIsInfoModalOpen(false)} className="absolute top-4 right-4 p-2 bg-slate-100 rounded-full text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-xl font-black text-slate-800 mb-4">如何讓集章冊上線？</h3>
            <div className="space-y-4 text-slate-600 text-sm leading-relaxed">
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold">1</div>
                <p>將此網頁部署到 <strong>GitHub Pages</strong> 或 <strong>Vercel</strong>。</p>
              </div>
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold">2</div>
                <p>在 Demo 工具中產生對應 6 個點位的 QR Code 並<strong>列印出來</strong>。</p>
              </div>
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold">3</div>
                <p>將 QR Code 貼在店內不同位置。當顧客掃描時，系統會自動在他們的手機瀏覽器中「蓋章」。</p>
              </div>
              <div className="bg-amber-50 p-3 rounded-xl border border-amber-100 text-amber-700 text-xs italic">
                提示：紀錄儲存在顧客的手機 (LocalStorage)，無需後端資料庫。
              </div>
            </div>
            <button 
              onClick={() => setIsInfoModalOpen(false)}
              className="mt-6 w-full py-3 bg-slate-800 text-white rounded-xl font-bold"
            >
              知道了
            </button>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {isQRModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] w-full max-w-xs p-8 relative shadow-2xl animate-in fade-in zoom-in duration-300 text-center">
            <button onClick={() => setIsQRModalOpen(false)} className="absolute top-4 right-4 p-2 bg-slate-100 rounded-full text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>
            
            <h3 className="text-xl font-black text-slate-800 mb-1">下載 QR Code</h3>
            <p className="text-xs text-slate-500 mb-6 font-medium">請列印此圖供顧客掃描</p>

            <div className="bg-slate-50 p-6 rounded-2xl flex items-center justify-center mb-6 border-2 border-slate-100 relative group">
              <QRCodeCanvas 
                value={getQRUrl(qrPoint)} 
                size={180}
                level={"H"}
                includeMargin={true}
                className="rounded-lg shadow-inner"
                id={`qr-canvas-${qrPoint}`}
              />
            </div>

            <div className="grid grid-cols-3 gap-2 mb-6">
              {Array.from({ length: TOTAL_STAMPS }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setQrPoint(i + 1)}
                  className={`
                    py-2 rounded-xl text-sm font-bold border-2 transition-all
                    ${qrPoint === i + 1 
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200' 
                      : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300'}
                  `}
                >
                  {i + 1}
                </button>
              ))}
            </div>

            <div className="p-3 bg-slate-50 rounded-xl text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-4 truncate">
              {getQRUrl(qrPoint)}
            </div>

            <p className="text-xs text-slate-400 italic">長按 QR Code 圖片即可儲存</p>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-white/60 backdrop-blur-sm z-50 flex flex-col items-center justify-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-indigo-600 font-black animate-pulse">蓋章中，請稍候...</p>
        </div>
      )}
    </div>
  );
};

export default App;
