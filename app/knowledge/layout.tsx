import React from 'react';

export default function KnowledgeLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f7f3ec] text-[#2F2A26] font-sans selection:bg-[#e8e2d5]">
      <style dangerouslySetInnerHTML={{ __html: `
        .text-\\[\\#2A241F\\] { color: #2A241F !important; opacity: 1 !important; }
        .text-\\[\\#3A322B\\] { color: #3A322B !important; opacity: 1 !important; }
        .text-\\[\\#241F1B\\] { color: #241F1B !important; opacity: 1 !important; }
        .text-\\[\\#2F2A26\\] { color: #2F2A26 !important; opacity: 1 !important; }
        .text-\\[\\#776B60\\] { color: #776B60 !important; opacity: 1 !important; }
        .text-\\[\\#5F554D\\] { color: #5F554D !important; opacity: 1 !important; }
        .bg-\\[\\#2A241F\\] { background-color: #2A241F !important; }
        .bg-\\[\\#1f1a17\\] { background-color: #2A241F !important; }
        .bg-\\[\\#faf7f2\\] { background-color: #faf7f2 !important; }
        .bg-\\[\\#f7f3ec\\] { background-color: #f7f3ec !important; }
        .bg-\\[\\#e8e2d5\\] { background-color: #e8e2d5 !important; }
        .border-\\[\\#d8d2c6\\] { border-color: #d8d2c6 !important; }
        .border-\\[\\#e8e2d5\\] { border-color: #e8e2d5 !important; }
        .border-\\[\\#1f1a17\\] { border-color: #2A241F !important; }
      `}} />
      {children}
    </div>
  );
}
