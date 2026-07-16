import React, { useState, useEffect, useRef } from "react";
import {
  LayoutDashboard,
  Search,
  MessageSquare,
  FileText,
  FileSignature,
  BarChart3,
  HelpCircle,
  History,
  Plus,
  UploadCloud,
  CheckSquare,
  Square,
  ArrowRight,
  Copy,
  FileDown,
  Printer,
  TrendingUp,
  Clock,
  ShieldCheck,
  AlertCircle,
  Trash2,
  Users,
  Settings,
  Bell,
  BookOpen,
  Sparkles,
  ExternalLink,
  Loader2,
  CheckCircle2,
  BookMarked,
  Mic,
  MicOff,
  Camera,
  X
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  Legend as ChartLegend,
  ResponsiveContainer
} from "recharts";
import { User, Regulation, SavedDocument, ChatMessage } from "./types";

// Helper to parse saved plain-text documents into structured draft blocks
function parseSavedDocument(content: string, docType: string) {
  const lines = content.split("\n");
  let senderUnit = "";
  let documentNo = "";
  let dateStr = "";
  let subject = "";
  let receiver = "";
  const paras: string[] = [];
  let signName = "";
  let signPosition = "";

  let signatureStarted = false;
  const sigLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    if (line.startsWith("ส่วนราชการ:")) {
      senderUnit = line.replace("ส่วนราชการ:", "").trim();
    } else if (line.startsWith("ที่:")) {
      documentNo = line.replace("ที่:", "").trim();
    } else if (line.startsWith("วันที่:")) {
      dateStr = line.replace("วันที่:", "").trim();
    } else if (line.startsWith("เรื่อง:")) {
      subject = line.replace("เรื่อง:", "").trim();
    } else if (line.startsWith("เรียน:")) {
      receiver = line.replace("เรียน:", "").trim();
    } else if (line.startsWith("ขอแสดงความนับถือ")) {
      signatureStarted = true;
    } else if (line.startsWith("คำสั่ง") && line.includes("ที่")) {
      // Keep it as is or parse
    } else if (
      line.startsWith("ที่ ") ||
      line.startsWith("ส่วนราชการ") ||
      line.startsWith("เรื่อง ") ||
      line.startsWith("เรียน ") ||
      line.startsWith("วันที่ ")
    ) {
      // Skip generic headers
    } else {
      if (signatureStarted) {
        sigLines.push(line);
      } else if (line.startsWith("(") && line.endsWith(")")) {
        signName = line;
        signatureStarted = true;
      } else {
        paras.push(line);
      }
    }
  }

  if (sigLines.length > 0) {
    if (!signName) {
      const bracketIdx = sigLines.findIndex(l => l.startsWith("(") && l.endsWith(")"));
      if (bracketIdx !== -1) {
        signName = sigLines[bracketIdx];
        signPosition = sigLines.slice(bracketIdx + 1).join("\n");
      } else {
        signName = sigLines[0];
        signPosition = sigLines.slice(1).join("\n");
      }
    } else {
      signPosition = sigLines.join("\n");
    }
  }

  return {
    senderUnit: senderUnit || "กองการพัสดุ กองทัพเรือ",
    documentNo: documentNo || "ที่ กพ.ทร. ๐๕๒๓/๕๘๔",
    dateStr: dateStr || "๑๔ กรกฎาคม ๒๕๖๖",
    subject: subject || "จัดสรรงบประมาณโครงการพิเศษ ทร.",
    receiver: receiver || "ผู้บัญชาการกรมอู่ทหารเรือ",
    para1: paras[0] || "",
    para2: paras[1] || "",
    para3: paras[2] || "",
    signName: signName || "(สาธิต ประชารัฐ)",
    signPosition: signPosition || "เรือเอก\nหัวหน้าฝ่ายจัดซื้อ กองการพัสดุ ทร."
  };
}

// Reusable speech-to-text (voice typing) component with Thai support
interface VoiceDictationButtonProps {
  onTranscript: (text: string) => void;
  className?: string;
  tooltipText?: string;
}

const VoiceDictationButton: React.FC<VoiceDictationButtonProps> = ({
  onTranscript,
  className = "",
  tooltipText = "พิมพ์ด้วยเสียง (ภาษาไทย)"
}) => {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = "th-TH";

      rec.onstart = () => {
        setIsListening(true);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      rec.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
      };

      rec.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          onTranscript(transcript);
        }
      };

      recognitionRef.current = rec;
    }
  }, [onTranscript]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("เบราว์เซอร์นี้ไม่รองรับระบบการพิมพ์ด้วยเสียง (แนะนำให้ใช้ Google Chrome หรือ Safari)");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.error("Failed to start speech recognition:", err);
      }
    }
  };

  return (
    <button
      type="button"
      onClick={toggleListening}
      title={tooltipText}
      className={`p-2 rounded-xl border flex items-center justify-center transition-all cursor-pointer relative shrink-0 ${
        isListening
          ? "bg-rose-50 border-rose-400 text-rose-600 shadow-md animate-pulse"
          : "bg-white border-slate-200 text-slate-500 hover:text-[#002D5B] hover:border-[#002D5B] hover:bg-slate-50"
      } ${className}`}
    >
      {isListening ? (
        <>
          <MicOff className="w-4 h-4 text-rose-600" />
          <span className="absolute -top-1 -right-1 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
          </span>
        </>
      ) : (
        <Mic className="w-4 h-4" />
      )}
    </button>
  );
};

// Reusable, bulletproof printing utility for Royal Thai Navy documents
const printDocument = (htmlContent: string, title: string) => {
  // We use a hidden iframe to ensure seamless print integration in sandboxed iframe previews
  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "none";
  iframe.style.visibility = "hidden";
  document.body.appendChild(iframe);

  const docHtml = `
    <html>
      <head>
        <title>${title}</title>
        <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;500;600;700&display=swap" rel="stylesheet">
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
          @page {
            size: A4;
            margin: 0;
          }
          body {
            font-family: 'Sarabun', sans-serif !important;
            background: white !important;
            padding: 0 !important;
            margin: 0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .doc-paper, .print-paper-container {
            width: 210mm !important;
            min-height: 297mm !important;
            padding: 25mm 20mm 20mm 30mm !important; /* Standard RTN: top 2.5cm, right 2cm, bottom 2cm, left 3cm */
            box-sizing: border-box !important;
            color: black !important;
            background: white !important;
            box-shadow: none !important;
            border: none !important;
          }
          .no-print {
            display: none !important;
          }
          @media print {
            body {
              background: white !important;
            }
            .doc-paper, .print-paper-container {
              width: 210mm !important;
              min-height: 297mm !important;
              padding: 25mm 20mm 20mm 30mm !important;
            }
          }
        </style>
      </head>
      <body>
        <div class="print-paper-container">
          ${htmlContent}
        </div>
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 300);
          }
        </script>
      </body>
    </html>
  `;

  if (iframe.contentWindow) {
    iframe.contentWindow.document.open();
    iframe.contentWindow.document.write(docHtml);
    iframe.contentWindow.document.close();
    
    // Automatically clean up the iframe after print dialog opens
    setTimeout(() => {
      if (document.body.contains(iframe)) {
        document.body.removeChild(iframe);
      }
    }, 12000);
  } else {
    // Fallback to window.open if iframe is unavailable
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(docHtml);
      printWindow.document.close();
    } else {
      alert("ไม่สามารถเปิดหน้าต่างพิมพ์ได้ กรุณาตรวจสอบตัวบล็อกป๊อปอัพ (Popup Blocker) ของเบราว์เซอร์");
    }
  }
};

// Helper to render official Royal Thai Navy style sheets
const renderOfficialPaper = (
  draft: {
    senderUnit: string;
    documentNo: string;
    dateStr: string;
    para1: string;
    para2: string;
    para3: string;
    signName: string;
    signPosition: string;
  },
  docType: string,
  subject: string,
  receiver: string
) => {
  const isMemo = docType.includes("บันทึกข้อความ") || docType.includes("ภายใน");
  const isStamp = docType.includes("ประทับตรา");
  const isOrder = docType.includes("สั่งการ") || docType.includes("คำสั่ง");
  const isNewsMessage = docType.includes("ข่าว") || docType.includes("สส.ทร.๘");

  // 1. MEMORANDUM (บันทึกข้อความ)
  if (isMemo) {
    return (
      <div 
        className="doc-paper print-paper-container w-[210mm] min-h-[297mm] pt-[2.5cm] pb-[2cm] pl-[3cm] pr-[2cm] text-slate-900 text-[16pt] font-medium leading-[1.6] select-text shadow-2xl relative flex flex-col justify-between" 
        id="printed-document" 
        style={{ fontFamily: '"Sarabun", sans-serif' }}
      >
        <div>
          {/* Memorandum Header with Garuda and title */}
          <div className="flex items-end gap-6 mb-4">
            <div className="w-[1.5cm] h-[1.5cm] shrink-0 flex items-center justify-center">
              <img
                alt="Thai Garuda crest"
                className="w-16 h-16 object-contain"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDU0dDmO8znQSHtlRpLLDgceGFArPGbMUhWQyMDG4Wb8zPb5FnmNBRSKkjVwHYdGc7L9luVuyAgv-WAHZYDWQquF32Smlmf1q_6re-hCjd9SeKh8z84FTk7ugjHAvupmNOb4hLujipxUKTRTkeJVefrO0vlPB4HdnVkbntRvs56SvyOr0vVesVO1x8iwrLJXpnS1VYYfP7qp0k9ZgAGqUrrTPQN4VJQPWBiJPjnKWpNWhkQsxrxxgr7"
              />
            </div>
            <div className="flex-1 text-left pb-1">
              <h1 className="text-[29pt] font-extrabold tracking-wide text-slate-900 leading-none">บันทึกข้อความ</h1>
            </div>
          </div>

          {/* Memorandum Metadata Block */}
          <div className="border-y-2 border-slate-900 py-3 mb-6 text-[16pt] space-y-2">
            <div className="flex items-baseline">
              <span className="font-bold shrink-0 w-[2.5cm]">ส่วนราชการ</span>
              <span className="font-semibold text-slate-800">{draft.senderUnit} โทร. ๐ ๒๔๗๕ ๕๔๗๕</span>
            </div>
            <div className="flex justify-between items-baseline gap-4">
              <div className="flex items-baseline flex-1">
                <span className="font-bold shrink-0 w-[2.5cm]">ที่</span>
                <span className="font-semibold text-slate-800">{draft.documentNo || "กพ.ทร. ๐๕๒๓/๕๘๔"}</span>
              </div>
              <div className="flex items-baseline flex-1 justify-end">
                <span className="font-bold shrink-0 w-[1.5cm] text-right">วันที่</span>
                <span className="font-semibold text-slate-800 ml-2">{draft.dateStr}</span>
              </div>
            </div>
            <div className="flex items-baseline">
              <span className="font-bold shrink-0 w-[2.5cm]">เรื่อง</span>
              <span className="font-semibold text-slate-800">{subject}</span>
            </div>
          </div>

          {/* Greeting */}
          <div className="mb-6 flex items-baseline text-[16pt]">
            <span className="font-bold shrink-0 w-[1.5cm]">เรียน</span>
            <span className="font-semibold text-slate-800">{receiver}</span>
          </div>

          {/* Paragraphs */}
          <div className="space-y-5 text-justify leading-[1.6] text-[16pt] text-slate-800">
            {draft.para1 && (
              <p style={{ textIndent: "2.5cm", textJustify: "inter-word" }}>
                {draft.para1}
              </p>
            )}
            {draft.para2 && (
              <p style={{ textIndent: "2.5cm", textJustify: "inter-word" }}>
                {draft.para2}
              </p>
            )}
            {draft.para3 && (
              <p style={{ textIndent: "2.5cm", textJustify: "inter-word" }}>
                {draft.para3}
              </p>
            )}
          </div>
        </div>

        <div>
          {/* Signature Block (Centered in right half) */}
          <div className="mt-12 flex justify-end">
            <div className="text-center w-[9cm] space-y-2 text-[16pt]">
              <div className="h-12"></div>
              <p className="font-bold">({draft.signName.replace(/^\(|\)$/g, "")})</p>
              <p className="font-semibold text-slate-600 whitespace-pre-line leading-tight text-[14pt]">{draft.signPosition}</p>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-12 border-t border-slate-100 pt-4 text-xs text-slate-400 flex justify-between items-center no-print">
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#C5A059]"></span>
              <span>เอกสารภายใน ทร. - ระบบควบคุมเอกสารสารบรรณอัจฉริยะ</span>
            </div>
            <span>หน้า ๑/๑</span>
          </div>
        </div>
      </div>
    );
  }

  // 2. NAVY NEWS MESSAGE (กระดาษเขียนข่าวราชนาวี - แบบ สส.ทร.๘)
  if (isNewsMessage) {
    return (
      <div 
        className="doc-paper print-paper-container w-[210mm] min-h-[297mm] p-[1.5cm] text-slate-900 text-[14pt] leading-[1.4] select-text shadow-2xl relative flex flex-col justify-between" 
        id="printed-document" 
        style={{ fontFamily: '"Sarabun", sans-serif' }}
      >
        <div>
          {/* Header row */}
          <div className="flex justify-between items-center mb-2 border-b-2 border-slate-900 pb-2">
            <span className="text-[11pt] font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">ข่าวราชนาวี</span>
            <span className="text-[14pt] font-bold tracking-wide text-center uppercase text-[#002D5B]">กระดาษเขียนข่าวราชนาวี</span>
            <span className="text-[11pt] font-bold text-slate-900 border border-slate-900 px-1.5 py-0.5">แบบ สส.ทร.๘</span>
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-3 border border-slate-900 text-[12pt] mb-3 divide-x divide-slate-900 divide-y divide-slate-900 bg-slate-50/50">
            <div className="p-1.5 flex flex-col justify-between">
              <span className="font-bold text-slate-500 text-[10pt] uppercase">หน่วย</span>
              <span className="font-semibold text-slate-800">{draft.senderUnit}</span>
            </div>
            <div className="p-1.5 flex flex-col justify-between">
              <span className="font-bold text-slate-500 text-[10pt] uppercase">รับจาก</span>
              <span className="font-semibold text-slate-800">สส.ทร.</span>
            </div>
            <div className="p-1.5 flex flex-col justify-between">
              <span className="font-bold text-slate-500 text-[10pt] uppercase">วันที่-เวลา</span>
              <span className="font-semibold text-slate-800">{draft.dateStr}</span>
            </div>

            <div className="p-1.5 flex flex-col justify-between">
              <span className="font-bold text-slate-500 text-[10pt] uppercase">ระบบ</span>
              <span className="font-semibold text-slate-800">วิทยุโทรพิมพ์ดิจิทัล</span>
            </div>
            <div className="p-1.5 flex flex-col justify-between">
              <span className="font-bold text-slate-500 text-[10pt] uppercase">ผู้ฝาก</span>
              <span className="font-semibold text-slate-800">{draft.signName.replace(/^\(|\)$/g, "")}</span>
            </div>
            <div className="p-1.5 flex flex-col justify-between">
              <span className="font-bold text-slate-500 text-[10pt] uppercase">ผู้รับ</span>
              <span className="font-semibold text-slate-800">เวรสื่อสาร ทร.</span>
            </div>

            <div className="p-1.5 flex flex-col justify-between">
              <span className="font-bold text-slate-500 text-[10pt] uppercase">จ่ายให้</span>
              <span className="font-semibold text-slate-800">กองบัญชาการ ทร.</span>
            </div>
            <div className="p-1.5 flex flex-col justify-between">
              <span className="font-bold text-slate-500 text-[10pt] uppercase">ส่งต่อให้</span>
              <span className="font-semibold text-slate-800">นขต.ทร. ทุกหน่วย</span>
            </div>
            <div className="p-1.5 flex flex-col justify-between">
              <span className="font-bold text-slate-500 text-[10pt] uppercase">ระบบสื่อสารหลัก</span>
              <span className="font-semibold text-slate-800">RTN-Net</span>
            </div>

            <div className="p-1.5 flex flex-col justify-between col-span-3">
              <div className="flex justify-between text-[11pt]">
                <div>
                  <span className="font-bold text-slate-500 uppercase mr-1">ผู้จ่าย:</span>
                  <span className="font-semibold text-slate-800">พ.จ.อ. เกริกเกียรติ ยศรุ่ง</span>
                </div>
                <div>
                  <span className="font-bold text-slate-500 uppercase mr-1">ผู้รับข่าว:</span>
                  <span className="font-semibold text-slate-800">ร.ท. วันชนะ บุญตา</span>
                </div>
                <div>
                  <span className="font-bold text-slate-500 uppercase mr-1">วันที่-เวลาส่ง:</span>
                  <span className="font-semibold text-slate-800">{draft.dateStr}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Urgent & DTG Grid */}
          <div className="grid grid-cols-4 border-2 border-slate-900 text-center text-[12pt] font-semibold mb-4 bg-slate-100 divide-x divide-slate-900">
            <div className="p-1.5">
              <p className="text-[10pt] text-slate-500 uppercase font-bold leading-tight">ความเร่งด่วน (ผู้ปฏิบัติ)</p>
              <p className="text-red-600 font-bold text-[14pt]">ด่วนที่สุด</p>
            </div>
            <div className="p-1.5">
              <p className="text-[10pt] text-slate-500 uppercase font-bold leading-tight">ความเร่งด่วน (ผู้ทราบ)</p>
              <p className="text-slate-800 text-[14pt]">ด่วน</p>
            </div>
            <div className="p-1.5">
              <p className="text-[10pt] text-slate-500 uppercase font-bold leading-tight">หมู่วันที่ - เวลา (DTG)</p>
              <p className="text-[#002D5B] font-bold text-[14pt] tracking-wide">๑๕๑๖๓๐ ก.ค.๖๖</p>
            </div>
            <div className="p-1.5">
              <p className="text-[10pt] text-slate-500 uppercase font-bold leading-tight">หมู่คำ</p>
              <p className="text-slate-800 font-mono text-[14pt]">{draft.documentNo || "กพ.ทร. ๐๕๒๓/๕๘๔"}</p>
            </div>
          </div>

          {/* Message Headers */}
          <div className="border border-slate-200 pb-3 mb-4 text-[14pt] space-y-1 bg-slate-50 p-3 rounded-lg">
            <div className="flex">
              <span className="font-bold shrink-0 w-[2.5cm] text-slate-600">จาก:</span>
              <span className="font-semibold text-slate-900">{draft.senderUnit}</span>
            </div>
            <div className="flex">
              <span className="font-bold shrink-0 w-[2.5cm] text-slate-600">ถึง (ปฏิบัติ):</span>
              <span className="font-semibold text-slate-900">{receiver}</span>
            </div>
            <div className="flex">
              <span className="font-bold shrink-0 w-[2.5cm] text-slate-600">ถึง (ทราบ):</span>
              <span className="text-slate-500">สน.ผบ.ทร., สน.รอง ผบ.ทร., และ นขต.ทร. ที่เกี่ยวข้อง</span>
            </div>
          </div>

          {/* Subject & Main message body */}
          <div className="mt-4 text-[14pt]">
            <div className="flex items-baseline mb-4">
              <span className="font-bold shrink-0 w-[1.5cm] text-slate-600">เรื่อง:</span>
              <span className="font-extrabold text-[#002D5B] underline decoration-[#C5A059] decoration-2 underline-offset-4">{subject}</span>
            </div>
            
            <div className="space-y-4 text-justify leading-relaxed text-slate-800">
              {draft.para1 && (
                <p style={{ textIndent: "2cm", textJustify: "inter-word" }}>
                  ๑. {draft.para1}
                </p>
              )}
              {draft.para2 && (
                <p style={{ textIndent: "2cm", textJustify: "inter-word" }}>
                  ๒. {draft.para2}
                </p>
              )}
              {draft.para3 && (
                <p style={{ textIndent: "2cm", textJustify: "inter-word" }}>
                  ๓. {draft.para3}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Metadata & News Signing */}
        <div className="mt-8 border-t-2 border-slate-900 pt-4 text-[12pt]">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="space-y-1">
              <p><span className="font-bold text-slate-500">อ้างถึงข่าว:</span> ................................................................</p>
              <div className="flex gap-4">
                <span className="font-bold text-slate-500">ชั้นความลับ:</span>
                <label className="flex items-center gap-1"><input type="checkbox" defaultChecked className="rounded text-[#002D5B]" /> ลับ</label>
                <label className="flex items-center gap-1"><input type="checkbox" className="rounded text-[#002D5B]" /> ไม่กำหนด</label>
              </div>
            </div>
            <div className="text-right space-y-1">
              <p><span className="font-bold text-slate-500">ผู้เขียนข่าว:</span> {draft.signName.replace(/^\(|\)$/g, "")}</p>
              <p><span className="font-bold text-slate-500">ตำแหน่ง:</span> {draft.signPosition.split("\n")[0] || "หัวหน้าฝ่ายจัดซื้อ"} <span className="font-bold text-slate-500">โทร:</span> ๕๔๗๕</p>
            </div>
          </div>

          <div className="grid grid-cols-2 border border-slate-900 text-center divide-x divide-slate-900 bg-slate-50">
            <div className="p-2">
              <p className="font-bold text-[10pt] text-slate-500 uppercase">ผู้รับรองข่าว</p>
              <div className="h-8"></div>
              <p className="font-semibold text-slate-700 text-[12pt]">นาวาเอก สมศักดิ์ สุขใจ ร.น.</p>
              <p className="text-[10pt] text-slate-400">ผู้อำนวยการกองการพัสดุ</p>
            </div>
            <div className="p-2">
              <p className="font-bold text-[10pt] text-slate-500 uppercase">นายทหารอนุมัติข่าว</p>
              <div className="h-8"></div>
              <p className="font-semibold text-slate-700 text-[12pt]">พลเรือตรี ยุทธนา วงศ์สุวรรณ ร.น.</p>
              <p className="text-[10pt] text-slate-400">ผู้ช่วยเจ้ากรมการเงินและพัสดุ ทร.</p>
            </div>
          </div>

          <div className="mt-3 flex justify-between items-center text-[10pt] text-slate-400 no-print">
            <span>กองการสื่อสารและเทคโนโลยีสารสนเทศ ทร. (สส.ทร.)</span>
            <span>ชั้นความลับทางทหาร - สำหรับปฏิบัติราชการใน ทร. เท่านั้น</span>
          </div>
        </div>
      </div>
    );
  }

  // 3. ORDER / DIRECTIVE (คำสั่ง / หนังสือสั่งการ)
  if (isOrder) {
    return (
      <div 
        className="doc-paper print-paper-container w-[210mm] min-h-[297mm] pt-[2.5cm] pb-[2cm] pl-[3cm] pr-[2cm] text-slate-900 text-[16pt] font-medium leading-[1.6] select-text shadow-2xl relative flex flex-col justify-between" 
        id="printed-document" 
        style={{ fontFamily: '"Sarabun", sans-serif' }}
      >
        <div>
          {/* Centered Garuda */}
          <div className="flex justify-center mb-6">
            <img
              alt="Thai Garuda crest"
              className="w-20 h-20 object-contain"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDU0dDmO8znQSHtlRpLLDgceGFArPGbMUhWQyMDG4Wb8zPb5FnmNBRSKkjVwHYdGc7L9luVuyAgv-WAHZYDWQquF32Smlmf1q_6re-hCjd9SeKh8z84FTk7ugjHAvupmNOb4hLujipxUKTRTkeJVefrO0vlPB4HdnVkbntRvs56SvyOr0vVesVO1x8iwrLJXpnS1VYYfP7qp0k9ZgAGqUrrTPQN4VJQPWBiJPjnKWpNWhkQsxrxxgr7"
            />
          </div>

          {/* Centered Order Heading */}
          <div className="text-center space-y-2 mb-8 text-[16pt]">
            <h1 className="text-[20pt] font-bold text-slate-900 leading-tight">คำสั่ง{draft.senderUnit}</h1>
            <p className="font-bold text-slate-800">{draft.documentNo || "ที่ ๔๕/๒๕๖๖"}</p>
            <p className="font-bold text-slate-800">เรื่อง {subject}</p>
          </div>

          {/* Paragraphs */}
          <div className="space-y-5 text-justify leading-[1.6] text-[16pt] text-slate-800 mb-8">
            {draft.para1 && (
              <p style={{ textIndent: "2.5cm", textJustify: "inter-word" }}>
                {draft.para1}
              </p>
            )}
            {draft.para2 && (
              <p style={{ textIndent: "2.5cm", textJustify: "inter-word" }}>
                {draft.para2}
              </p>
            )}
            {draft.para3 && (
              <p style={{ textIndent: "2.5cm", textJustify: "inter-word" }}>
                {draft.para3}
              </p>
            )}
          </div>
        </div>

        <div>
          {/* Ordering Date & Signature Block (Centered in right half) */}
          <div className="mt-12 flex flex-col items-end">
            <div className="text-center w-[9cm] space-y-2 mb-6 text-[16pt]">
              <p className="text-center">สั่ง ณ วันที่ {draft.dateStr}</p>
            </div>
            <div className="text-center w-[9cm] space-y-2 text-[16pt]">
              <div className="h-12"></div>
              <p className="font-bold">({draft.signName.replace(/^\(|\)$/g, "")})</p>
              <p className="font-semibold text-slate-600 whitespace-pre-line leading-tight text-[14pt]">{draft.signPosition}</p>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-12 border-t border-slate-100 pt-4 text-xs text-slate-400 flex justify-between items-center no-print">
            <span>แผนกสารบรรณ กองทัพเรือ</span>
            <span>เอกสาร ทร. - ประเภทคำสั่งทางการ</span>
          </div>
        </div>
      </div>
    );
  }

  // 4. STAMPED LETTER (หนังสือประทับตรา)
  if (isStamp) {
    return (
      <div 
        className="doc-paper print-paper-container w-[210mm] min-h-[297mm] pt-[2.5cm] pb-[2cm] pl-[3cm] pr-[2cm] text-slate-900 text-[16pt] font-medium leading-[1.6] select-text shadow-2xl relative flex flex-col justify-between" 
        id="printed-document" 
        style={{ fontFamily: '"Sarabun", sans-serif' }}
      >
        <div>
          {/* Centered Garuda */}
          <div className="flex justify-center mb-6">
            <img
              alt="Thai Garuda crest"
              className="w-20 h-20 object-contain"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDU0dDmO8znQSHtlRpLLDgceGFArPGbMUhWQyMDG4Wb8zPb5FnmNBRSKkjVwHYdGc7L9luVuyAgv-WAHZYDWQquF32Smlmf1q_6re-hCjd9SeKh8z84FTk7ugjHAvupmNOb4hLujipxUKTRTkeJVefrO0vlPB4HdnVkbntRvs56SvyOr0vVesVO1x8iwrLJXpnS1VYYfP7qp0k9ZgAGqUrrTPQN4VJQPWBiJPjnKWpNWhkQsxrxxgr7"
            />
          </div>

          {/* Stamped Metadata Header */}
          <div className="flex justify-between items-start mb-8 text-[16pt]">
            <div>
              <p className="font-bold">ที่ <span className="font-semibold text-slate-800">{draft.documentNo || "กพ.ทร. ๐๕๒๓/๕๘๔"}</span></p>
            </div>
            <div className="text-right">
              <p className="font-bold">ถึง <span className="font-semibold text-slate-800">{receiver.replace("เรียน ", "")}</span></p>
            </div>
          </div>

          {/* Paragraphs */}
          <div className="space-y-5 text-justify leading-[1.6] text-[16pt] text-slate-800 mb-8">
            {draft.para1 && (
              <p style={{ textIndent: "2.5cm", textJustify: "inter-word" }}>
                {draft.para1}
              </p>
            )}
            {draft.para2 && (
              <p style={{ textIndent: "2.5cm", textJustify: "inter-word" }}>
                {draft.para2}
              </p>
            )}
            {draft.para3 && (
              <p style={{ textIndent: "2.5cm", textJustify: "inter-word" }}>
                {draft.para3}
              </p>
            )}
          </div>
        </div>

        <div>
          {/* Stamping Block */}
          <div className="mt-12 flex justify-end">
            <div className="text-center w-[8cm] border-2 border-dashed border-[#C5A059]/40 p-5 rounded-2xl bg-slate-50/50 space-y-2 text-[16pt]">
              <p className="font-bold text-[14pt] text-[#002D5B]">{draft.senderUnit}</p>
              <div className="h-16 flex items-center justify-center text-slate-400 text-xs italic border border-slate-200 rounded-lg my-2 bg-white">
                (ประทับตรากลมสีแดง)
              </div>
              <p className="text-[15px] font-bold text-slate-700">{draft.dateStr}</p>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-12 border-t border-slate-100 pt-4 text-xs text-slate-400 flex justify-between items-center no-print">
            <span>ส่วนราชการเจ้าของเรื่อง: {draft.senderUnit}</span>
            <span>เอกสาร ทร. - หนังสือประทับตรา</span>
          </div>
        </div>
      </div>
    );
  }

  // 5. EXTERNAL LETTER (หนังสือภายนอก - DEFAULT)
  return (
    <div 
      className="doc-paper print-paper-container w-[210mm] min-h-[297mm] pt-[2.5cm] pb-[2cm] pl-[3cm] pr-[2cm] text-slate-900 text-[16pt] font-medium leading-[1.6] select-text shadow-2xl relative flex flex-col justify-between" 
      id="printed-document" 
      style={{ fontFamily: '"Sarabun", sans-serif' }}
    >
      <div>
        {/* Centered Garuda */}
        <div className="flex justify-center mb-6">
          <img
            alt="Thai Garuda crest"
            className="w-20 h-20 object-contain"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDU0dDmO8znQSHtlRpLLDgceGFArPGbMUhWQyMDG4Wb8zPb5FnmNBRSKkjVwHYdGc7L9luVuyAgv-WAHZYDWQquF32Smlmf1q_6re-hCjd9SeKh8z84FTk7ugjHAvupmNOb4hLujipxUKTRTkeJVefrO0vlPB4HdnVkbntRvs56SvyOr0vVesVO1x8iwrLJXpnS1VYYfP7qp0k9ZgAGqUrrTPQN4VJQPWBiJPjnKWpNWhkQsxrxxgr7"
          />
        </div>

        {/* Top metadata - left and right columns */}
        <div className="flex justify-between items-start mb-6 text-[16pt]">
          <div className="w-1/2">
            <p className="font-bold">ที่ <span className="font-semibold text-slate-800">{draft.documentNo || "กพ.ทร. ๐๕๒๓/๕๘๔"}</span></p>
          </div>
          <div className="w-1/2 text-right space-y-1">
            <p className="font-bold text-slate-900">{draft.senderUnit}</p>
            <p className="text-[12pt] text-slate-500 leading-tight">พระราชวังเดิม ถนนอรุณอมรินทร์<br />บางกอกใหญ่ กรุงเทพฯ ๑๐๖๐๐</p>
          </div>
        </div>

        {/* Date line (aligned right) */}
        <div className="text-right mb-6 pr-12 text-[16pt]">
          <span className="font-semibold text-slate-800">{draft.dateStr}</span>
        </div>

        {/* Subject and Receiver lists */}
        <div className="space-y-2 mb-8 text-[16pt]">
          <div className="flex">
            <span className="font-bold w-[3cm] shrink-0">เรื่อง</span>
            <span className="font-semibold text-slate-800">{subject}</span>
          </div>
          <div className="flex">
            <span className="font-bold w-[3cm] shrink-0">เรียน</span>
            <span className="font-semibold text-slate-800">{receiver}</span>
          </div>
          <div className="flex">
            <span className="font-bold w-[3cm] shrink-0 text-slate-400">อ้างถึง</span>
            <span className="text-slate-400">(ถ้ามี)</span>
          </div>
          <div className="flex">
            <span className="font-bold w-[3cm] shrink-0 text-slate-400">สิ่งที่ส่งมาด้วย</span>
            <span className="text-slate-400">(ถ้ามี)</span>
          </div>
        </div>

        {/* Paragraphs */}
        <div className="space-y-5 text-justify leading-[1.6] text-[16pt] text-slate-800">
          {draft.para1 && (
            <p style={{ textIndent: "2.5cm", textJustify: "inter-word" }}>
              {draft.para1}
            </p>
          )}
          {draft.para2 && (
            <p style={{ textIndent: "2.5cm", textJustify: "inter-word" }}>
              {draft.para2}
            </p>
          )}
          {draft.para3 && (
            <p style={{ textIndent: "2.5cm", textJustify: "inter-word" }}>
              {draft.para3}
            </p>
          )}
        </div>
      </div>

      <div>
        {/* Signature & Closing block */}
        <div className="mt-12 flex flex-col items-end">
          <div className="text-center w-[9cm] space-y-2 text-[16pt]">
            <p className="text-center mb-6">ขอแสดงความนับถือ</p>
            <div className="h-10"></div>
            <p className="font-bold">({draft.signName.replace(/^\(|\)$/g, "")})</p>
            <p className="font-semibold text-slate-600 whitespace-pre-line leading-tight text-[14pt]">{draft.signPosition}</p>
          </div>
        </div>

        {/* Document footer contact info */}
        <div className="mt-12 border-t border-slate-100 pt-4 text-xs text-slate-400 space-y-0.5">
          <p className="font-bold text-slate-600">กองการพัสดุ กองทัพเรือ</p>
          <p>โทรศัพท์ ๐ ๒๔๗๕ ๕๔๗๕ ต่อ ๕๔๗๕</p>
          <p>ไปรษณีย์อิเล็กทรอนิกส์ material@navy.mi.th</p>
        </div>
      </div>
    </div>
  );
};

const RTN_RANKS = [
  "พลเรือเอก", "พลเรือโท", "พลเรือตรี",
  "นาวาเอก", "นาวาโท", "นาวาตรี",
  "เรือเอก", "เรือโท", "เรือตรี",
  "พันจ่าเอก", "พันจ่าโท", "พันจ่าตรี",
  "จ่าเอก", "จ่าโท", "จ่าตรี",
  "พลทหาร"
];

const RTN_UNITS = [
  "กองการพัสดุ กองทัพเรือ",
  "กรมอู่ทหารเรือ",
  "กองเรือยุทธการ",
  "กรมส่งกำลังบำรุงทหารเรือ",
  "กรมสื่อสารและเทคโนโลยีสารสนเทศทหารเรือ",
  "สำนักงานเลขานุการกองทัพเรือ",
  "กรมกำลังพลทหารเรือ",
  "กรมข่าวทหารเรือ",
  "กรมยุทธการทหารเรือ",
  "ฐานทัพเรือสัตหีบ",
  "ฐานทัพเรือกรุงเทพ"
];

export default function App() {
  const [activeTab, setActiveTab] = useState<
    "dashboard" | "regulations" | "chatbot" | "summarizer" | "writer" | "analytics" | "profile"
  >("dashboard");

  // User details state & auth states
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isSessionLoading, setIsSessionLoading] = useState(true);
  
  // Auth inputs
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [loginName, setLoginName] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [regName, setRegName] = useState("");
  const [regRank, setRegRank] = useState("เรือเอก");
  const [regUnit, setRegUnit] = useState("กองการพัสดุ กองทัพเรือ");
  const [regPassword, setRegPassword] = useState("");
  const [regMilitaryId, setRegMilitaryId] = useState("");
  const [isAuthSubmit, setIsAuthSubmit] = useState(false);

  // Profile Edit Inputs
  const [profileName, setProfileName] = useState("");
  const [profileRank, setProfileRank] = useState("");
  const [profileUnit, setProfileUnit] = useState("");
  const [profilePassword, setProfilePassword] = useState("");
  const [profileMilitaryId, setProfileMilitaryId] = useState("");
  const [profileImage, setProfileImage] = useState("");
  const [isProfileUpdating, setIsProfileUpdating] = useState(false);

  // Populates edit states when user changes
  useEffect(() => {
    if (currentUser) {
      setProfileName(currentUser.name || "");
      setProfileRank(currentUser.rank || "เรือเอก");
      setProfileUnit(currentUser.unit || "กองการพัสดุ กองทัพเรือ");
      setProfilePassword(currentUser.password || "");
      setProfileMilitaryId(currentUser.militaryId || "");
      setProfileImage(currentUser.profileImage || "");
    }
  }, [currentUser]);

  // Global Toast State
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // Pre-load session on mount
  useEffect(() => {
    const savedUser = localStorage.getItem("rtn_user");
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser) as User;
        if (parsed && parsed.user_id) {
          setCurrentUser(parsed);
          // Verify with server in background
          fetch("/api/user", {
            headers: { "x-user-id": parsed.user_id }
          })
            .then((res) => {
              if (res.ok) return res.json();
              throw new Error("Invalid session");
            })
            .then((data) => {
              if (data && data.name) {
                setCurrentUser(data);
                localStorage.setItem("rtn_user", JSON.stringify(data));
              }
            })
            .catch(() => {
              localStorage.removeItem("rtn_user");
              setCurrentUser(null);
            })
            .finally(() => {
              setIsSessionLoading(false);
            });
          return;
        }
      } catch (e) {
        localStorage.removeItem("rtn_user");
      }
    }
    setIsSessionLoading(false);
  }, []);

  // Fetch documents and chat history when user becomes logged in
  useEffect(() => {
    if (currentUser) {
      loadRegulations();
      loadDocuments();
      loadChatHistory();
    } else {
      setSavedDocs([]);
      setChats([
        {
          chat_id: "init_welcome",
          question: "คู่มือเริ่มต้น",
          answer: "สวัสดีครับผม เรือเอก สมาร์ททหารเรือ ผู้ช่วยระเบียบกองทัพเรืออัจฉริยะ ยินดีให้บริการตอบทุกข้อซักถาม ข้อมูลการจัดซื้อจัดจ้าง วินัยทหาร หรือหนังสือคำสั่งต่างๆ ครับ สอบถามได้ทันที!",
          reference: "ศูนย์บริการปัญญาประดิษฐ์ สารบรรณทหารเรือ"
        }
      ]);
    }
  }, [currentUser]);

  // ----------------------------------------------------
  // Dashboard states & actions
  // ----------------------------------------------------
  const [globalSearchInput, setGlobalSearchInput] = useState("");

  const handleGlobalSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!globalSearchInput.trim()) return;
    setSearchQuery(globalSearchInput);
    setActiveTab("regulations");
    triggerRegulationSearch(globalSearchInput, selectedCategories);
  };

  // ----------------------------------------------------
  // Regulation Search states & actions
  // ----------------------------------------------------
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([
    "การเงิน (Finance)",
    "พัสดุ (Material)",
    "บุคลากร (Personnel)",
    "กฎหมายทั่วไป (General Law)"
  ]);
  const [regulationResults, setRegulationResults] = useState<Regulation[]>([]);
  const [isSearchingRegs, setIsSearchingRegs] = useState(false);
  const [yearFilter, setYearFilter] = useState("ทั้งหมด");
  const [selectedPdfUrl, setSelectedPdfUrl] = useState<string | null>(null);
  const [selectedPdfTitle, setSelectedPdfTitle] = useState<string>("");

  const loadRegulations = () => {
    setIsSearchingRegs(true);
    fetch("/api/regulations/search", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "x-user-id": currentUser?.user_id || ""
      },
      body: JSON.stringify({ query: searchQuery, categories: selectedCategories })
    })
      .then((res) => res.json())
      .then((data) => {
        setRegulationResults(data.results || []);
        setIsSearchingRegs(false);
      })
      .catch((err) => {
        console.error("Error searching:", err);
        setIsSearchingRegs(false);
      });
  };

  const triggerRegulationSearch = (query: string, categories: string[]) => {
    setIsSearchingRegs(true);
    fetch("/api/regulations/search", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "x-user-id": currentUser?.user_id || ""
      },
      body: JSON.stringify({ query, categories })
    })
      .then((res) => res.json())
      .then((data) => {
        setRegulationResults(data.results || []);
        setIsSearchingRegs(false);
      })
      .catch((err) => {
        console.error("Error searching:", err);
        setIsSearchingRegs(false);
      });
  };

  const toggleCategory = (cat: string) => {
    let updated = [...selectedCategories];
    if (updated.includes(cat)) {
      updated = updated.filter((item) => item !== cat);
    } else {
      updated.push(cat);
    }
    setSelectedCategories(updated);
    triggerRegulationSearch(searchQuery, updated);
  };

  // ----------------------------------------------------
  // Chatbot states & actions
  // ----------------------------------------------------
  const [chatInput, setChatInput] = useState("");
  const [chats, setChats] = useState<ChatMessage[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  const loadChatHistory = () => {
    if (!currentUser) return;
    fetch("/api/chat-history", {
      headers: { "x-user-id": currentUser.user_id }
    })
      .then((res) => res.json())
      .then((data) => {
        if (data && data.length > 0) {
          setChats(data);
        } else {
          // prefill default welcome message
          setChats([
            {
              chat_id: "init_welcome",
              question: "คู่มือเริ่มต้น",
              answer: "สวัสดีครับผม เรือเอก สมาร์ททหารเรือ ผู้ช่วยระเบียบกองทัพเรืออัจฉริยะ ยินดีให้บริการตอบทุกข้อซักถาม ข้อมูลการจัดซื้อจัดจ้าง วินัยทหาร หรือหนังสือคำสั่งต่างๆ ครับ สอบถามได้ทันที!",
              reference: "ศูนย์บริการปัญญาประดิษฐ์ สารบรรณทหารเรือ"
            }
          ]);
        }
      });
  };

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chats]);

  const handleSendChat = async (e?: React.FormEvent, customMsg?: string) => {
    if (e) e.preventDefault();
    const queryText = customMsg || chatInput;
    if (!queryText.trim()) return;

    if (!customMsg) setChatInput("");

    // Add user message to state
    const userMessage: ChatMessage = {
      chat_id: `user_${Date.now()}`,
      question: queryText,
      answer: ""
    };

    setChats((prev) => [...prev, userMessage]);

    // Set temporary AI loading state
    const aiLoadingMsg: ChatMessage = {
      chat_id: "loading_placeholder",
      question: "",
      answer: "",
      isLoading: true
    };
    setChats((prev) => [...prev, aiLoadingMsg]);
    setIsChatLoading(true);

    try {
      const response = await fetch("/api/chatbot", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-user-id": currentUser?.user_id || ""
        },
        body: JSON.stringify({ message: queryText })
      });
      const data = await response.json();

      setChats((prev) => {
        const filtered = prev.filter((c) => c.chat_id !== "loading_placeholder");
        return [
          ...filtered,
          {
            chat_id: data.chat_id || `ai_${Date.now()}`,
            question: queryText,
            answer: data.answer,
            reference: data.reference
          }
        ];
      });
    } catch (err) {
      console.error(err);
      setChats((prev) => prev.filter((c) => c.chat_id !== "loading_placeholder"));
      showToast("ไม่สามารถส่งข้อความได้เนื่องจากเกิดข้อผิดพลาดของเซิร์ฟเวอร์", "error");
    } finally {
      setIsChatLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast("คัดลอกไปยังคลิปบอร์ดสำเร็จแล้ว", "success");
  };

  // ----------------------------------------------------
  // Document Summarizer states & actions
  // ----------------------------------------------------
  const [summaryInputText, setSummaryInputText] = useState("");
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [fileName, setFileName] = useState("draft_regulation_v3.pdf");
  const [fileSize, setFileSize] = useState("4.2 MB");
  const [summaryResult, setSummaryResult] = useState<{
    title: string;
    size: string;
    type: string;
    date: string;
    summary: string;
    findings: string[];
    impact: string;
    actionItems: string[];
  } | null>(null);

  const [checkedActions, setCheckedActions] = useState<string[]>([]);

  const handleSummarizeSubmit = async () => {
    setIsSummarizing(true);
    try {
      const response = await fetch("/api/summarize", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-user-id": currentUser?.user_id || ""
        },
        body: JSON.stringify({
          text: summaryInputText || "เอกสารปรับปรุงมาตรฐานข้อมูลระเบียบกองทัพเรือไทย",
          title: fileName
        })
      });
      const data = await response.json();
      setSummaryResult(data);
      setCheckedActions([]);
      showToast("วิเคราะห์และสรุปเอกสารสำเร็จโดยระบบ AI", "success");
    } catch (err) {
      console.error(err);
      showToast("เกิดข้อผิดพลาดในการวิเคราะห์เอกสาร", "error");
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleSimulatedFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFileName(file.name);
      setFileSize(`${(file.size / (1024 * 1024)).toFixed(1)} MB`);
      showToast(`อัปโหลดไฟล์ ${file.name} เรียบร้อย พร้อมสำหรับการสรุปประเด็น`, "success");
      // Simulate reading or fill in mock
      setSummaryInputText(
        `เอกสารพัสดุและระเบียบปฏิบัติงานจริงชื่อ ${file.name} ประกอบด้วยการอนุมัติงบประมาณและข้อมูลการจัดซื้อจัดจ้าง มีความสำคัญอย่างยิ่งต่อการปฏิบัติการราชการทางทะเลของหน่วยกำลังพล`
      );
    }
  };

  const toggleActionItem = (item: string) => {
    if (checkedActions.includes(item)) {
      setCheckedActions(checkedActions.filter((i) => i !== item));
    } else {
      setCheckedActions([...checkedActions, item]);
    }
  };

  // ----------------------------------------------------
  // Letter Writer states & actions
  // ----------------------------------------------------
  const [writerDocType, setWriterDocType] = useState("หนังสือภายนอก");
  const [writerUrgency, setWriterUrgency] = useState("ปกติ");
  const [writerReceiver, setWriterReceiver] = useState("เรียน ผู้บัญชาการกรมอู่ทหารเรือ");
  const [writerSubject, setWriterSubject] = useState("ขออนุมัติจัดหาพัสดุหมึกพิมพ์และวัสดุสำนักงานเร่งด่วน");
  const [writerMainPoints, setWriterMainPoints] = useState(
    "กองการพัสดุมีความจำเป็นเร่งด่วนที่ต้องดำเนินการเบิกจ่ายเงินจัดซื้อหมึกพิมพ์และอุปกรณ์พิมพ์ เพื่อใช้ในโครงการรวบรวมระเบียบราชการ ทร. ปี ๒๕๖๖ แฟ้มข้อมูลพัสดุทั้งหมดมีขนาดใหญ่มาก"
  );
  const [isGeneratingLetter, setIsGeneratingLetter] = useState(false);
  const [letterDraft, setLetterDraft] = useState<{
    senderUnit: string;
    documentNo: string;
    dateStr: string;
    para1: string;
    para2: string;
    para3: string;
    signName: string;
    signPosition: string;
  } | null>(null);

  const handleGenerateLetter = async () => {
    setIsGeneratingLetter(true);
    try {
      const response = await fetch("/api/letter-writer", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-user-id": currentUser?.user_id || ""
        },
        body: JSON.stringify({
          docType: writerDocType,
          urgency: writerUrgency,
          receiver: writerReceiver,
          subject: writerSubject,
          mainPoints: writerMainPoints
        })
      });
      const data = await response.json();
      setLetterDraft(data.drafted);
      showToast("ร่างหนังสือราชการรูปแบบทางการสำเร็จแล้ว", "success");
      loadDocuments(); // reload saved list
    } catch (err) {
      console.error(err);
      showToast("ร่างเอกสารขัดข้อง กรุณาลองใหม่อีกครั้ง", "error");
    } finally {
      setIsGeneratingLetter(false);
    }
  };

  // ----------------------------------------------------
  // Documents list & preview modal
  // ----------------------------------------------------
  const [savedDocs, setSavedDocs] = useState<SavedDocument[]>([]);
  const [previewDoc, setPreviewDoc] = useState<SavedDocument | null>(null);
  const [modalViewMode, setModalViewMode] = useState<"visual" | "raw">("visual");

  const loadDocuments = () => {
    if (!currentUser) return;
    fetch("/api/documents", {
      headers: { "x-user-id": currentUser.user_id }
    })
      .then((res) => res.json())
      .then((data) => setSavedDocs(data || []))
      .catch((err) => console.log(err));
  };

  const handleDeleteDoc = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("คุณต้องการลบร่างหนังสือราชการนี้ใช่หรือไม่?")) return;

    try {
      await fetch(`/api/documents/${id}`, { 
        method: "DELETE",
        headers: { "x-user-id": currentUser?.user_id || "" }
      });
      showToast("ลบเอกสารสำเร็จ", "success");
      loadDocuments();
    } catch (err) {
      console.error(err);
    }
  };

  // Reset or "New Inquiry" action
  const handleNewInquiry = () => {
    setGlobalSearchInput("");
    setSearchQuery("");
    setSummaryInputText("");
    setSummaryResult(null);
    setLetterDraft(null);
    setWriterDocType("หนังสือภายนอก");
    setWriterUrgency("ปกติ");
    setWriterReceiver("เรียน ผู้บัญชาการกรมอู่ทหารเรือ");
    setWriterSubject("ขออนุมัติจัดหาพัสดุหมึกพิมพ์และวัสดุสำนักงานเร่งด่วน");
    setWriterMainPoints("");
    setActiveTab("dashboard");
    showToast("เริ่มทำรายการสอบถามใหม่", "info");
  };

  // ----------------------------------------------------
  // Analytics Data
  // ----------------------------------------------------
  const analyticsChartData = [
    { name: "ม.ค.", aiValue: 65, tradValue: 280 },
    { name: "ก.พ.", aiValue: 80, tradValue: 260 },
    { name: "มี.ค.", aiValue: 120, tradValue: 210 },
    { name: "เม.ย.", aiValue: 180, tradValue: 160 },
    { name: "พ.ค.", aiValue: 250, tradValue: 120 },
    { name: "มิ.ย.", aiValue: 320, tradValue: 90 }
  ];

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginName.trim() || !loginPassword.trim()) {
      showToast("กรุณากรอกชื่อและรหัสผ่านเข้าใช้งาน", "error");
      return;
    }

    setIsAuthSubmit(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: loginName.trim(), password: loginPassword.trim() })
      });
      const data = await response.json();
      if (!response.ok) {
        showToast(data.error || "ไม่สามารถเข้าสู่ระบบได้", "error");
        return;
      }

      localStorage.setItem("rtn_user", JSON.stringify(data.user));
      setCurrentUser(data.user);
      showToast(`ยินดีต้อนรับเข้าสู่ระบบ ${data.user.rank} ${data.user.name}`, "success");
    } catch (err) {
      showToast("เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์", "error");
    } finally {
      setIsAuthSubmit(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim() || !regPassword.trim() || !regMilitaryId.trim() || !regRank || !regUnit) {
      showToast("กรุณากรอกข้อมูลข้าราชการทหารเรือให้ครบถ้วน", "error");
      return;
    }

    if (!/^\d{10}$/.test(regMilitaryId.trim())) {
      showToast("หมายเลขประจำตัวข้าราชการ ทร. ต้องมี 10 หลักเท่านั้น", "error");
      return;
    }

    setIsAuthSubmit(true);
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: regName.trim(),
          rank: regRank,
          unit: regUnit,
          password: regPassword.trim(),
          militaryId: regMilitaryId.trim()
        })
      });
      const data = await response.json();
      if (!response.ok) {
        showToast(data.error || "การลงทะเบียนข้าราชการล้มเหลว", "error");
        return;
      }

      localStorage.setItem("rtn_user", JSON.stringify(data.user));
      setCurrentUser(data.user);
      showToast(`ลงทะเบียนข้าราชการ ทร. สำเร็จ และเข้าสู่ระบบเรียบร้อย`, "success");
    } catch (err) {
      showToast("เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์", "error");
    } finally {
      setIsAuthSubmit(false);
    }
  };

  const handleProfileUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileName.trim() || !profileRank || !profileUnit) {
      showToast("กรุณากรอกชื่อ ยศ และสังกัดให้ครบถ้วน", "error");
      return;
    }

    if (profileMilitaryId && !/^\d{10}$/.test(profileMilitaryId.trim())) {
      showToast("หมายเลขประจำตัวข้าราชการ ทร. ต้องมี 10 หลักเท่านั้น", "error");
      return;
    }

    setIsProfileUpdating(true);
    try {
      const response = await fetch("/api/user", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": currentUser?.user_id || ""
        },
        body: JSON.stringify({
          name: profileName.trim(),
          rank: profileRank,
          unit: profileUnit,
          password: profilePassword.trim(),
          militaryId: profileMilitaryId.trim(),
          profileImage
        })
      });
      const data = await response.json();
      if (!response.ok) {
        showToast(data.error || "ไม่สามารถอัปเดตโปรไฟล์ได้", "error");
        return;
      }

      localStorage.setItem("rtn_user", JSON.stringify(data.user));
      setCurrentUser(data.user);
      showToast("อัปเดตข้อมูลโปรไฟล์ข้าราชการเรียบร้อยแล้ว", "success");
    } catch (err) {
      showToast("เกิดข้อผิดพลาดในการติดต่อระบบเพื่อบันทึกข้อมูล", "error");
    } finally {
      setIsProfileUpdating(false);
    }
  };

  if (isSessionLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[#001f3f] text-white selection:bg-[#C5A059] selection:text-white">
        <div className="w-24 h-24 mb-6">
          <img
            alt="Royal Thai Navy Golden Crest"
            className="w-full h-full object-contain filter brightness-110 drop-shadow-[0_4px_10px_rgba(197,160,89,0.3)] animate-pulse"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCRxEYP6KB2-vN34v52lMOSjwaDuUN8-p_XxCR2h1z8SUdyjSgteS7aocJVcSc23c3RM017h7EAxwdz_p5x0Nu_i1QKuY3BdK7GP-cUVtlkRwJvdRGpVc77lysQpiG-Y6Klgxo_REdL-t-2wBP4VmV2HXqV1DkTmex9Hay2cJyO4ud6a64jFvyfDZnm305gbnRkH_w27m_B8-NvAZkd54K8BHMhYQqE_gY2zUZlqv1rV8em56_kYTSI"
          />
        </div>
        <div className="text-xl font-bold tracking-wider text-[#C5A059] mb-2 animate-pulse">กำลังตรวจสอบข้อมูลระบบสารบรรณ...</div>
        <div className="text-xs text-white/60 font-mono tracking-widest uppercase">ROYAL THAI NAVY INTELLIGENCE CORE</div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="flex min-h-screen bg-gradient-to-br from-[#001f3f] via-[#002D5B] to-[#0a0e17] items-center justify-center p-4 selection:bg-[#C5A059] selection:text-white">
        {/* Dynamic Toast Alerts inside Auth screen */}
        {toast && (
          <div className="fixed top-5 right-5 z-50 flex items-center gap-3 bg-[#0a0e17] text-white rounded-xl py-3 px-5 shadow-2xl transition-all animate-bounce border-l-4 border-[#C5A059]">
            <Sparkles className="w-5 h-5 text-[#C5A059] shrink-0" />
            <span className="text-sm font-medium">{toast.message}</span>
          </div>
        )}

        <div className="w-full max-w-2xl bg-white/95 backdrop-blur-md rounded-3xl border border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.4)] overflow-hidden transition-all duration-300">
          <div className="bg-gradient-to-br from-[#002D5B] to-[#001f3f] text-white py-10 px-8 text-center relative border-b-4 border-[#C5A059]">
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full blur-2xl pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#C5A059]/5 rounded-full blur-2xl pointer-events-none"></div>
            
            <img
              alt="Royal Thai Navy Crest"
              className="w-20 h-20 mx-auto mb-4 object-contain filter brightness-110 drop-shadow-[0_4px_12px_rgba(197,160,89,0.3)]"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCRxEYP6KB2-vN34v52lMOSjwaDuUN8-p_XxCR2h1z8SUdyjSgteS7aocJVcSc23c3RM017h7EAxwdz_p5x0Nu_i1QKuY3BdK7GP-cUVtlkRwJvdRGpVc77lysQpiG-Y6Klgxo_REdL-t-2wBP4VmV2HXqV1DkTmex9Hay2cJyO4ud6a64jFvyfDZnm305gbnRkH_w27m_B8-NvAZkd54K8BHMhYQqE_gY2zUZlqv1rV8em56_kYTSI"
            />
            <h2 className="text-2xl font-bold tracking-tight text-white mb-2">
              ระบบผู้ช่วยอัจฉริยะสารบรรณและพัสดุ ทร.
            </h2>
            <p className="text-[#C5A059] text-xs font-semibold uppercase tracking-widest">
              Royal Thai Navy Intelligent Document & Material Hub
            </p>
            <div className="mt-3 inline-block bg-white/10 text-white/90 text-[11px] px-3 py-1 rounded-full border border-white/10">
              🛡️ เฉพาะข้าราชการกองทัพเรือไทยเท่านั้น (RTN Personnel Only)
            </div>
          </div>

          <div className="p-8">
            <div className="flex bg-[#f3f4f6] p-1.5 rounded-2xl mb-8">
              <button
                type="button"
                onClick={() => setAuthMode("login")}
                className={`flex-1 text-center py-3 rounded-xl text-sm font-semibold transition-all duration-150 cursor-pointer ${
                  authMode === "login"
                    ? "bg-gradient-to-r from-[#002D5B] to-[#001f3f] text-white shadow-md"
                    : "text-slate-600 hover:text-slate-950 hover:bg-white/50"
                }`}
              >
                เข้าสู่ระบบ (Sign In)
              </button>
              <button
                type="button"
                onClick={() => setAuthMode("register")}
                className={`flex-1 text-center py-3 rounded-xl text-sm font-semibold transition-all duration-150 cursor-pointer ${
                  authMode === "register"
                    ? "bg-gradient-to-r from-[#002D5B] to-[#001f3f] text-white shadow-md"
                    : "text-slate-600 hover:text-slate-950 hover:bg-white/50"
                }`}
              >
                ลงทะเบียนข้าราชการ ทร. (Register)
              </button>
            </div>

            {authMode === "login" ? (
              <form onSubmit={handleLoginSubmit} className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    ชื่อ-นามสกุล ที่ทำการลงทะเบียนไว้ (โดยไม่ต้องพิมพ์ยศ)
                  </label>
                  <input
                    type="text"
                    required
                    value={loginName}
                    onChange={(e) => setLoginName(e.target.value)}
                    placeholder="ตัวอย่าง: สมหมาย สารบัญ"
                    className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#002D5B] focus:ring-1 focus:ring-[#002D5B] transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    รหัสผ่านของระบบสารบรรณ ทร.
                  </label>
                  <input
                    type="password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="กรอกรหัสผ่าน 6 หลักขึ้นไป"
                    className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#002D5B] focus:ring-1 focus:ring-[#002D5B] transition-colors"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isAuthSubmit}
                  className="w-full bg-gradient-to-r from-[#002D5B] to-[#001f3f] hover:opacity-95 text-white font-semibold text-sm py-4 rounded-xl border border-[#C5A059]/30 shadow-lg active:scale-98 transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isAuthSubmit ? (
                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  ) : (
                    <span>เข้าใช้งานระบบสารบรรณอัจฉริยะ</span>
                  )}
                </button>

                <p className="text-center text-xs text-slate-400">
                  ระบบรักษาความปลอดภัยเครือข่ายกองทัพเรือไทย พ.ศ. ๒๕๖๖
                </p>
              </form>
            ) : (
              <form onSubmit={handleRegisterSubmit} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      ชื่อ-นามสกุล จริง (ไม่ต้องใส่คำนำหน้านามหรือยศ)
                    </label>
                    <input
                      type="text"
                      required
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder="ตัวอย่าง: ดำรงฤทธิ์ พรหมรักษา"
                      className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#002D5B] focus:ring-1 focus:ring-[#002D5B] transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      หมายเลขประจำตัวข้าราชการ ทร. (10 หลัก)
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={10}
                      pattern="\d*"
                      value={regMilitaryId}
                      onChange={(e) => setRegMilitaryId(e.target.value.replace(/\D/g, ""))}
                      placeholder="เช่น 1409901234"
                      className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#002D5B] focus:ring-1 focus:ring-[#002D5B] transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      ยศทหารเรือ (Rank)
                    </label>
                    <select
                      value={regRank}
                      onChange={(e) => setRegRank(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#002D5B] focus:ring-1 focus:ring-[#002D5B] transition-colors"
                    >
                      {RTN_RANKS.map((rank) => (
                        <option key={rank} value={rank}>
                          {rank}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      สังกัดกองทัพเรือ / หน่วยงานปฏิบัติราชการ
                    </label>
                    <select
                      value={regUnit}
                      onChange={(e) => setRegUnit(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#002D5B] focus:ring-1 focus:ring-[#002D5B] transition-colors"
                    >
                      {RTN_UNITS.map((unit) => (
                        <option key={unit} value={unit}>
                          {unit}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    กำหนดรหัสผ่านเข้าใช้งาน (6 ตัวอักษรขึ้นไป)
                  </label>
                  <input
                    type="password"
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="กำหนดรหัสผ่านของท่าน"
                    className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#002D5B] focus:ring-1 focus:ring-[#002D5B] transition-colors"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isAuthSubmit}
                  className="w-full bg-gradient-to-r from-[#002D5B] to-[#001f3f] hover:opacity-95 text-white font-semibold text-sm py-4 rounded-xl border border-[#C5A059]/30 shadow-lg active:scale-98 transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isAuthSubmit ? (
                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  ) : (
                    <span>ลงทะเบียนและสร้างสิทธิ์เข้าใช้ระบบ ทร.</span>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#fdfcfb] text-[#1a1a1a] antialiased selection:bg-[#C5A059] selection:text-white">
      {/* Dynamic Toast Alerts */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-3 bg-[#001f3f] text-white rounded-xl py-3 px-5 shadow-2xl transition-all animate-bounce border-l-4 border-[#C5A059]">
          <Sparkles className="w-5 h-5 text-[#C5A059] shrink-0" />
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}

      {/* Side Navigation Bar */}
      <aside className="hidden md:flex flex-col w-64 bg-white text-slate-700 border-r border-navy shrink-0 h-full">
        {/* Navy Seal Branding Header */}
        <div className="p-6 border-b border-[#002D5B]/10 flex flex-col items-center justify-center bg-gradient-to-br from-[#002D5B] to-[#001f3f] text-white">
          <div className="w-14 h-14 rounded-full mb-3 overflow-hidden border-2 border-[#C5A059] shadow-md bg-white/10 flex items-center justify-center">
            <img
              alt="Royal Thai Navy Golden Crest"
              className="w-full h-full object-cover"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCRxEYP6KB2-vN34v52lMOSjwaDuUN8-p_XxCR2h1z8SUdyjSgteS7aocJVcSc23c3RM017h7EAxwdz_p5x0Nu_i1QKuY3BdK7GP-cUVtlkRwJvdRGpVc77lysQpiG-Y6Klgxo_REdL-t-2wBP4VmV2HXqV1DkTmex9Hay2cJyO4ud6a64jFvyfDZnm305gbnRkH_w27m_B8-NvAZkd54K8BHMhYQqE_gY2zUZlqv1rV8em56_kYTSI"
            />
          </div>
          <h1 className="font-bold text-base text-white text-center leading-tight tracking-tight">RTN AI ASSISTANT</h1>
          <p className="text-[9px] text-[#C5A059] mt-1 uppercase tracking-widest font-bold">Royal Thai Navy KB</p>
        </div>

        {/* Action Button: New Inquiry */}
        <div className="px-4 py-4">
          <button
            onClick={handleNewInquiry}
            className="w-full navy-gradient hover:opacity-95 text-white py-3 px-4 rounded-xl flex items-center justify-center gap-2 font-medium text-sm shadow-lg border border-[#C5A059]/20 active:scale-95 transition-all duration-150 cursor-pointer"
          >
            <Plus className="w-5 h-5 text-[#C5A059]" />
            <span>คำร้องใหม่ / New Inquiry</span>
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 overflow-y-auto px-3 space-y-1">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-150 cursor-pointer ${
              activeTab === "dashboard"
                ? "sidebar-item-active"
                : "sidebar-item-hover text-slate-600 hover:text-[#002D5B]"
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span>หน้าแรก (Dashboard)</span>
          </button>

          <button
            onClick={() => setActiveTab("regulations")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-150 cursor-pointer ${
              activeTab === "regulations"
                ? "sidebar-item-active"
                : "sidebar-item-hover text-slate-600 hover:text-[#002D5B]"
            }`}
          >
            <Search className="w-5 h-5" />
            <span>สืบค้นระเบียบ (Search)</span>
          </button>

          <button
            onClick={() => setActiveTab("chatbot")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-150 cursor-pointer ${
              activeTab === "chatbot"
                ? "sidebar-item-active"
                : "sidebar-item-hover text-slate-600 hover:text-[#002D5B]"
            }`}
          >
            <MessageSquare className="w-5 h-5" />
            <span>ผู้ช่วยตอบคำถาม (Chatbot)</span>
          </button>

          <button
            onClick={() => setActiveTab("summarizer")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-150 cursor-pointer ${
              activeTab === "summarizer"
                ? "sidebar-item-active"
                : "sidebar-item-hover text-slate-600 hover:text-[#002D5B]"
            }`}
          >
            <FileText className="w-5 h-5" />
            <span>สรุปเอกสาร (Summarizer)</span>
          </button>

          <button
            onClick={() => setActiveTab("writer")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-150 cursor-pointer ${
              activeTab === "writer"
                ? "sidebar-item-active"
                : "sidebar-item-hover text-slate-600 hover:text-[#002D5B]"
            }`}
          >
            <FileSignature className="w-5 h-5" />
            <span>ร่างเอกสารราชการ (Writer)</span>
          </button>

          <button
            onClick={() => setActiveTab("analytics")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-150 cursor-pointer ${
              activeTab === "analytics"
                ? "sidebar-item-active"
                : "sidebar-item-hover text-slate-600 hover:text-[#002D5B]"
            }`}
          >
            <BarChart3 className="w-5 h-5" />
            <span>รายงานวิเคราะห์ (Analytics)</span>
          </button>

          <button
            onClick={() => setActiveTab("profile")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-150 cursor-pointer ${
              activeTab === "profile"
                ? "sidebar-item-active"
                : "sidebar-item-hover text-slate-600 hover:text-[#002D5B]"
            }`}
          >
            <Settings className="w-5 h-5" />
            <span>จัดการโปรไฟล์ (Profile)</span>
          </button>
        </nav>

        {/* Bottom Utility Menu */}
        <div className="p-4 border-t border-navy flex flex-col gap-1 text-slate-500">
          <button
            onClick={() => showToast("กำลังเปิดคู่มือสอนการใช้งานระบบสารบรรณพัสดุ", "info")}
            className="w-full flex items-center gap-3 px-4 py-2 hover:bg-[#C5A059]/5 text-slate-500 hover:text-[#002D5B] rounded-xl text-sm font-medium transition-all duration-150 text-left cursor-pointer"
          >
            <HelpCircle className="w-4 h-4 text-[#C5A059]" />
            <span>ช่วยเหลือ / Support</span>
          </button>
          <div className="px-4 py-2 text-[10px] font-semibold text-slate-400 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-ping"></span>
            <span>CONNECTED TO LATEST REGULATIONS</span>
          </div>
        </div>
      </aside>

      {/* Main Container */}
      <main className="flex-1 flex flex-col overflow-hidden bg-[#fdfcfb] h-full relative">
        {/* Global Header */}
        <header className="navy-gradient px-8 py-4 flex justify-between items-center shrink-0 z-10 shadow-lg relative text-white border-b border-[#002D5B]/20">
          <div className="flex items-center gap-3">
            {/* Seal Logo */}
            <div className="w-11 h-11 bg-white/10 rounded-full flex items-center justify-center border border-white/20 shadow-inner">
              <img
                alt="Navy seal"
                className="w-8 h-8 object-contain filter brightness-110"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCRxEYP6KB2-vN34v52lMOSjwaDuUN8-p_XxCR2h1z8SUdyjSgteS7aocJVcSc23c3RM017h7EAxwdz_p5x0Nu_i1QKuY3BdK7GP-cUVtlkRwJvdRGpVc77lysQpiG-Y6Klgxo_REdL-t-2wBP4VmV2HXqV1DkTmex9Hay2cJyO4ud6a64jFvyfDZnm305gbnRkH_w27m_B8-NvAZkd54K8BHMhYQqE_gY2zUZlqv1rV8em56_kYTSI"
              />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight leading-none text-white">RTN AI ASSISTANT</h1>
              <p className="text-[10px] uppercase tracking-widest text-[#C5A059] font-bold mt-1 opacity-90">
                Royal Thai Navy Knowledge Base
              </p>
            </div>
          </div>

          <div className="hidden lg:block text-center flex-1 max-w-xl mx-auto">
            <h2 className="text-sm font-bold text-white/95">
              ระบบผู้ช่วยค้นหาระเบียบและจัดทำเอกสารราชการสำหรับกองทัพเรือ
            </h2>
            <p className="text-[10px] text-[#C5A059] font-semibold mt-0.5 tracking-widest uppercase">
              ROYAL THAI NAVY INTELLIGENCE CORE
            </p>
          </div>

          {/* User Details Area */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setActiveTab("profile")}
              className="flex items-center gap-3 hover:bg-white/10 p-1.5 rounded-2xl transition-all duration-150 text-left cursor-pointer"
              title="จัดการโปรไฟล์ของท่าน"
            >
              <div className="relative text-right hidden sm:block">
                <div className="text-sm font-bold text-white leading-tight">{currentUser.name}</div>
                <div className="text-[11px] text-[#C5A059] font-semibold mt-0.5">
                  {currentUser.rank} • {currentUser.unit}
                </div>
              </div>
              <div className="w-10 h-10 rounded-full bg-[#C5A059] border-2 border-white/20 overflow-hidden shadow-inner flex items-center justify-center text-white font-bold text-sm shrink-0">
                {currentUser.profileImage ? (
                  <img
                    src={currentUser.profileImage}
                    alt={currentUser.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  currentUser.name ? currentUser.name.split(" ").pop()?.slice(0, 2) || "วภ" : "วภ"
                )}
              </div>
            </button>
            <button
              onClick={() => {
                if (confirm("คุณต้องการออกจากระบบสารบรรณและพัสดุ ทร. ใช่หรือไม่?")) {
                  localStorage.removeItem("rtn_user");
                  setCurrentUser(null);
                  showToast("ออกจากระบบสำเร็จแล้ว", "info");
                }
              }}
              className="bg-white/10 hover:bg-rose-600/30 text-white hover:text-rose-100 text-xs px-3 py-2 rounded-xl border border-white/10 hover:border-rose-500/30 transition-all duration-150 cursor-pointer font-semibold"
            >
              ออกจากระบบ
            </button>
          </div>
        </header>

        {/* Dynamic Inner View Switcher */}
        <div className="flex-1 overflow-y-auto p-8 relative">
          
          {/* TAB 1: DASHBOARD VIEW */}
          {activeTab === "dashboard" && (
            <div className="max-w-6xl mx-auto space-y-8 animate-fadeIn">
              {/* Hero segment */}
              <div className="navy-gradient text-white p-8 rounded-2xl relative overflow-hidden shadow-xl border border-[#C5A059]/20">
                <div className="absolute right-0 top-0 w-80 h-full bg-no-repeat bg-contain opacity-20 bg-right pointer-events-none" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCRxEYP6KB2-vN34v52lMOSjwaDuUN8-p_XxCR2h1z8SUdyjSgteS7aocJVcSc23c3RM017h7EAxwdz_p5x0Nu_i1QKuY3BdK7GP-cUVtlkRwJvdRGpVc77lysQpiG-Y6Klgxo_REdL-t-2wBP4VmV2HXqV1DkTmex9Hay2cJyO4ud6a64jFvyfDZnm305gbnRkH_w27m_B8-NvAZkd54K8BHMhYQqE_gY2zUZlqv1rV8em56_kYTSI')" }} />
                <div className="relative z-10 max-w-xl space-y-2">
                  <div className="bg-[#C5A059]/20 text-[#C5A059] font-bold text-xs px-3 py-1 rounded-full w-max border border-[#C5A059]/30 uppercase tracking-widest">
                    ยินดีต้อนรับกำลังพลกองทัพเรือ
                  </div>
                  <h1 className="text-3xl font-extrabold tracking-tight">สวัสดี, {currentUser.rank} {currentUser.name}</h1>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    ระบบสารสนเทศปัญญาประดิษฐ์กลาง ยินดีต้อนรับสู่การประมวลงาน ค้นหาระเบียบราชการอย่างเป็นทางการ ร่างบันทึกข้อความราชการ และวิเคราะห์ความปลอดภัยพัสดุครบวงจร
                  </p>
                </div>
              </div>

              {/* Global search component */}
              <form onSubmit={handleGlobalSearchSubmit} className="relative w-full max-w-3xl">
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400 pointer-events-none">
                    <Search className="w-5 h-5 text-[#002D5B]" />
                  </span>
                  <input
                    type="text"
                    placeholder="พิมพ์สืบค้นระเบียบทหารเรือ, กฎหมายจัดซื้อจัดจ้าง หรือป้อนคำถามกฎหมายที่ต้องการ..."
                    value={globalSearchInput}
                    onChange={(e) => setGlobalSearchInput(e.target.value)}
                    className="w-full bg-white border-2 border-[#002D5B]/10 rounded-full py-4 pl-12 pr-[165px] text-slate-800 placeholder-slate-400 font-medium focus:outline-none focus:ring-2 focus:ring-[#C5A059] focus:border-transparent shadow-lg"
                  />
                  <div className="absolute right-[112px] inset-y-2 flex items-center">
                    <VoiceDictationButton
                      onTranscript={(text) => {
                        const newQuery = globalSearchInput ? `${globalSearchInput} ${text}` : text;
                        setGlobalSearchInput(newQuery);
                        setSearchQuery(newQuery);
                        setActiveTab("regulations");
                        triggerRegulationSearch(newQuery, selectedCategories);
                      }}
                      tooltipText="ค้นหาด้วยเสียงภาษาไทย"
                      className="h-11 w-11 border border-slate-200 bg-white hover:bg-slate-50 rounded-full flex items-center justify-center shadow-sm"
                    />
                  </div>
                  <button
                    type="submit"
                    className="absolute right-2 inset-y-2 navy-gradient hover:opacity-95 text-white px-6 rounded-full text-xs font-bold transition-all duration-150 cursor-pointer"
                  >
                    ค้นหาข้อมูล
                  </button>
                </div>
              </form>

              {/* Core Services grid with custom clickable bento cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                
                {/* Bento Card 1: Search */}
                <div
                  onClick={() => {
                    setActiveTab("regulations");
                    loadRegulations();
                  }}
                  className="bg-white rounded-2xl p-6 border border-[#002D5B]/10 shadow-md hover:shadow-xl hover:border-[#C5A059]/30 transition-all cursor-pointer group flex flex-col h-full"
                >
                  <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mb-4 group-hover:bg-[#C5A059]/10 transition-colors">
                    <Search className="w-6 h-6 text-slate-700 group-hover:text-[#C5A059] transition-colors" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-base mb-1">Regulation Search</h3>
                  <p className="text-slate-500 text-xs flex-1 leading-relaxed">
                    ค้นหาและวิเคราะห์ระเบียบข้อบังคับพัสดุราชการของกองทัพเรือได้อย่างถูกต้องและแม่นยำ
                  </p>
                  <div className="mt-4 flex items-center gap-1 text-[#002D5B] font-bold text-xs group-hover:gap-2 transition-all">
                    <span>เริ่มต้นใช้งาน</span>
                    <ArrowRight className="w-4 h-4 text-[#C5A059]" />
                  </div>
                </div>

                {/* Bento Card 2: Legal Chatbot */}
                <div
                  onClick={() => setActiveTab("chatbot")}
                  className="bg-white rounded-2xl p-6 border border-[#002D5B]/10 shadow-md hover:shadow-xl hover:border-[#C5A059]/30 transition-all cursor-pointer group flex flex-col h-full"
                >
                  <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mb-4 group-hover:bg-[#C5A059]/10 transition-colors">
                    <MessageSquare className="w-6 h-6 text-slate-700 group-hover:text-[#C5A059] transition-colors" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-base mb-1">Legal Chatbot</h3>
                  <p className="text-slate-500 text-xs flex-1 leading-relaxed">
                    ผู้ช่วยถามตอบอัจฉริยะข้อกฎหมายระเบียบวินัย ขั้นตอนจัดซื้อมติคณะกรรมการตรวจรับพัสดุ ทร.
                  </p>
                  <div className="mt-4 flex items-center gap-1 text-[#002D5B] font-bold text-xs group-hover:gap-2 transition-all">
                    <span>เปิดหน้าสนทนา</span>
                    <ArrowRight className="w-4 h-4 text-[#C5A059]" />
                  </div>
                </div>

                {/* Bento Card 3: Letter Writer */}
                <div
                  onClick={() => setActiveTab("writer")}
                  className="bg-white rounded-2xl p-6 border border-[#002D5B]/10 shadow-md hover:shadow-xl hover:border-[#C5A059]/30 transition-all cursor-pointer group flex flex-col h-full"
                >
                  <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mb-4 group-hover:bg-[#C5A059]/10 transition-colors">
                    <FileSignature className="w-6 h-6 text-slate-700 group-hover:text-[#C5A059] transition-colors" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-base mb-1">Letter Writer</h3>
                  <p className="text-slate-500 text-xs flex-1 leading-relaxed">
                    ร่างหนังสือราชการรูปแบบทางการและบันทึกข้อความภายในอัตโนมัติ สอดคล้องตามระเบียบกองทัพเรือ
                  </p>
                  <div className="mt-4 flex items-center gap-1 text-[#002D5B] font-bold text-xs group-hover:gap-2 transition-all">
                    <span>ร่างหนังสือราชการ</span>
                    <ArrowRight className="w-4 h-4 text-[#C5A059]" />
                  </div>
                </div>

                {/* Bento Card 4: Document Summarizer */}
                <div
                  onClick={() => setActiveTab("summarizer")}
                  className="bg-white rounded-2xl p-6 border border-[#002D5B]/10 shadow-md hover:shadow-xl hover:border-[#C5A059]/30 transition-all cursor-pointer group flex flex-col h-full border-l-4 border-l-[#C5A059]"
                >
                  <div className="w-12 h-12 rounded-xl bg-[#C5A059]/10 flex items-center justify-center mb-4">
                    <FileText className="w-6 h-6 text-[#C5A059] animate-pulse" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-base mb-1">Document Summarizer</h3>
                  <p className="text-slate-500 text-xs flex-1 leading-relaxed">
                    สรุปสาระสำคัญ ประเด็นหลัก และสิ่งที่ต้องจัดทำต่อจากเอกสารราชการขนาดยาวเพื่อประหยัดเวลา
                  </p>
                  <div className="mt-4 flex items-center gap-1 text-[#002D5B] font-bold text-xs group-hover:gap-2 transition-all">
                    <span>อัปโหลดเพื่อสรุป</span>
                    <ArrowRight className="w-4 h-4 text-[#C5A059]" />
                  </div>
                </div>

              </div>

              {/* Lower Section: Recent activities table & Efficiency dashboard */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Recent activity list */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-[#002D5B]/10 shadow-md overflow-hidden flex flex-col">
                  <div className="p-6 border-b border-[#002D5B]/10 flex justify-between items-center bg-[#fdfcfb]">
                    <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                      <Clock className="w-5 h-5 text-[#002D5B]" />
                      <span>ประวัติร่างและสืบค้นล่าสุด</span>
                    </h3>
                    <button onClick={() => showToast("เปิดหน้าประวัติการบันทึกเอกสารของกำลังพล", "info")} className="text-[#C5A059] font-bold text-xs hover:underline">ดูทั้งหมด</button>
                  </div>
                  <div className="overflow-x-auto flex-1">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold text-xs">
                          <th className="py-3.5 px-6">รายการเอกสาร / การสืบค้น</th>
                          <th className="py-3.5 px-6">ประเภทกิจกรรม</th>
                          <th className="py-3.5 px-6">สถานะการประมวลผล</th>
                          <th className="py-3.5 px-6 text-right">เวลาทำรายการ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700 text-sm">
                        {savedDocs.map((doc, idx) => (
                          <tr
                            key={doc.doc_id || idx}
                            onClick={() => setPreviewDoc(doc)}
                            className="hover:bg-slate-50 transition-colors cursor-pointer"
                          >
                            <td className="py-4 px-6 font-medium text-slate-900 truncate max-w-[240px]">
                              {doc.title}
                            </td>
                            <td className="py-4 px-6">
                              <span className="inline-flex items-center gap-1 text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md text-xs font-medium">
                                <FileSignature className="w-3.5 h-3.5" />
                                <span>{doc.doc_type}</span>
                              </span>
                            </td>
                            <td className="py-4 px-6">
                              <span className="text-[#002D5B] flex items-center gap-1.5 font-semibold text-xs">
                                <span className="w-2 h-2 rounded-full bg-[#C5A059]"></span>
                                <span>เสร็จสมบูรณ์</span>
                              </span>
                            </td>
                            <td className="py-4 px-6 text-right text-slate-400 text-xs">{doc.created_at}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Efficiency overview card */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-6 flex flex-col justify-between relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[#002D5B]/5 rounded-bl-full -z-10 pointer-events-none"></div>
                  
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-[#002D5B]/5 flex items-center justify-center text-[#002D5B] shadow-sm border border-[#002D5B]/10">
                      <TrendingUp className="w-5 h-5 animate-bounce" />
                    </div>
                    <h3 className="font-bold text-slate-900 text-base">ภาพรวมประสิทธิภาพ</h3>
                  </div>

                  <div className="space-y-2">
                    <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">สะสมชั่วโมงที่ประหยัดได้ในสัปดาห์นี้</p>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-5xl font-black text-slate-900 font-mono tracking-tight">14.5</span>
                      <span className="text-slate-500 font-bold text-sm">ชั่วโมง</span>
                    </div>
                    <div className="bg-[#C5A059]/10 text-[#002D5B] font-bold text-xs py-1.5 px-3 rounded-full w-max flex items-center gap-1 border border-[#C5A059]/20">
                      <Sparkles className="w-3.5 h-3.5 text-[#C5A059]" />
                      <span>เพิ่มขึ้น 12% จากสัปดาห์ที่ผ่านมา</span>
                    </div>
                  </div>

                  <div className="mt-8 pt-6 border-t border-slate-100">
                    <div className="flex justify-between items-center text-xs font-bold text-slate-500 mb-2">
                      <span>งานจัดระเบียบราชการที่ประมวลผลสำเร็จ</span>
                      <span className="text-slate-900">128 / 170 รายการ</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-3.5 overflow-hidden border border-slate-200">
                      <div className="bg-[#C5A059] h-full rounded-full transition-all duration-500" style={{ width: "75%" }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: REGULATIONS SEARCH VIEW */}
          {activeTab === "regulations" && (
            <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-8 animate-fadeIn">
              {/* Category selector column */}
              <aside className="w-full lg:w-64 shrink-0 bg-white rounded-2xl border border-slate-200 p-6 shadow-md self-start">
                <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-4">
                  <ShieldCheck className="w-5 h-5 text-[#002D5B]" />
                  <h3 className="font-bold text-slate-900 text-base">ตัวกรองระเบียบ</h3>
                </div>

                <div className="space-y-6">
                  <div>
                    <h4 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-3">หมวดหมู่หลัก</h4>
                    <div className="space-y-3">
                      {[
                        "การเงิน (Finance)",
                        "พัสดุ (Material)",
                        "บุคลากร (Personnel)",
                        "กฎหมายทั่วไป (General Law)"
                      ].map((cat) => (
                        <label key={cat} className="flex items-center gap-3 cursor-pointer group">
                          <input
                            type="checkbox"
                            checked={selectedCategories.includes(cat)}
                            onChange={() => toggleCategory(cat)}
                            className="rounded border-slate-300 text-[#002D5B] focus:ring-[#C5A059]"
                          />
                          <span className="text-sm text-slate-600 group-hover:text-slate-900 transition-colors font-medium">
                            {cat}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="h-px bg-slate-100"></div>

                  <div>
                    <h4 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-3">ช่วงปีที่ประกาศใช้</h4>
                    <select
                      value={yearFilter}
                      onChange={(e) => setYearFilter(e.target.value)}
                      className="w-full border-2 border-slate-200 rounded-xl px-4 py-2 text-slate-700 bg-white font-medium text-sm focus:outline-none focus:ring-2 focus:ring-[#C5A059] focus:border-transparent transition-all"
                    >
                      <option>ทั้งหมด</option>
                      <option>๒๕๖๕ - ๒๕๖๗</option>
                      <option>๒๕๖๐ - ๒๕๖๔</option>
                      <option>ก่อน ๒๕๖๐</option>
                    </select>
                  </div>
                </div>
              </aside>

              {/* Main search center */}
              <div className="flex-1 flex flex-col gap-6">
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-md">
                  <h1 className="text-xl font-bold text-slate-900 mb-2 flex items-center gap-2">
                    <Sparkles className="w-5.5 h-5.5 text-[#C5A059]" />
                    <span>สืบค้นและค้นหาระเบียบข้อบังคับด้วยพลัง AI</span>
                  </h1>
                  <p className="text-slate-500 text-xs mb-5 leading-relaxed">
                    ค้นหาแบบประโยคภาษาไทยทั่วไป AI จะประมวลผลข้อบังคับของกองทัพเรือ กระทรวงการคลัง หรือพัสดุส่วนกลางที่สอดคล้องอย่างสมบูรณ์
                  </p>

                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400 pointer-events-none">
                      <Search className="w-5 h-5" />
                    </span>
                    <input
                      type="text"
                      placeholder="ป้อนประเด็นที่ต้องการค้นหา เช่น 'การเบิกงบประมาณโครงการฝึกอบรม'"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl py-3.5 pl-12 pr-[165px] text-slate-800 placeholder-slate-400 font-semibold focus:outline-none focus:ring-2 focus:ring-[#C5A059] focus:bg-white focus:border-transparent transition-all"
                    />
                    <div className="absolute right-[116px] inset-y-2 flex items-center">
                      <VoiceDictationButton
                        onTranscript={(text) => {
                          const newQuery = searchQuery ? `${searchQuery} ${text}` : text;
                          setSearchQuery(newQuery);
                          triggerRegulationSearch(newQuery, selectedCategories);
                        }}
                        tooltipText="ค้นหาด้วยเสียงภาษาไทย"
                        className="h-full border border-slate-200 bg-white hover:bg-slate-50 rounded-lg flex items-center justify-center"
                      />
                    </div>
                    <button
                      onClick={loadRegulations}
                      disabled={isSearchingRegs}
                      className="absolute right-2 inset-y-2 navy-gradient text-white px-5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {isSearchingRegs ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Sparkles className="w-4 h-4 text-[#C5A059]" />
                      )}
                      <span>ค้นหา AI</span>
                    </button>
                  </div>

                  {/* Frequently search */}
                  <div className="flex flex-wrap items-center gap-2 mt-4 text-xs">
                    <span className="text-slate-400 font-bold uppercase tracking-wider">คำค้นหายอดนิยม:</span>
                    {["การลาพักผ่อน", "จัดซื้อจัดจ้าง", "เบิกค่ารักษาพยาบาล", "เบี้ยเลี้ยงทหาร"].map((keyword) => (
                      <button
                        key={keyword}
                        onClick={() => {
                          setSearchQuery(keyword);
                          triggerRegulationSearch(keyword, selectedCategories);
                        }}
                        className="px-3 py-1 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 rounded-full font-medium transition-colors cursor-pointer"
                      >
                        {keyword}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Regulation search results list */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-sm font-bold text-slate-600 px-2">
                    <span className="flex items-center gap-1">
                      <span>พบระเบียบข้อมูล</span>
                      <span className="bg-slate-200 text-slate-800 px-2 py-0.5 rounded-full text-xs font-black">
                        {regulationResults.length}
                      </span>
                      <span>รายการ</span>
                    </span>
                  </div>

                  {isSearchingRegs ? (
                    <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-md flex flex-col items-center justify-center gap-3">
                      <Loader2 className="w-8 h-8 animate-spin text-[#002D5B]" />
                      <p className="text-slate-500 text-sm font-bold animate-pulse">กำลังประมวลผลข้อบังคับราชการ...</p>
                    </div>
                  ) : regulationResults.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-md text-slate-400 flex flex-col items-center justify-center">
                      <AlertCircle className="w-12 h-12 text-slate-300 mb-2" />
                      <p className="text-sm font-bold">ไม่พบบันทึกข้อระเบียบที่ระบุ</p>
                      <p className="text-xs mt-1 text-slate-400">กรุณาลองป้อนประเด็นหรือสลับตัวกรองหมวดหมู่อื่น</p>
                    </div>
                  ) : (
                    regulationResults.map((reg) => (
                      <div
                        key={reg.regulation_id}
                        className="bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden hover:shadow-lg hover:border-[#C5A059]/30 transition-all flex flex-col md:flex-row group"
                      >
                        {/* Summary & description */}
                        <div className="flex-1 p-6 border-b md:border-b-0 md:border-r border-slate-100 flex flex-col justify-between">
                          <div>
                            <div className="flex justify-between items-center mb-3 text-xs">
                              <span className="bg-slate-100 text-slate-700 border border-slate-200 px-2.5 py-1 rounded-md font-bold uppercase tracking-wider">
                                {reg.category}
                              </span>
                              <span className="text-slate-400 font-semibold">{reg.upload_date}</span>
                            </div>
                            <h3 className="font-bold text-slate-900 text-base mb-3 leading-snug group-hover:text-[#002D5B] transition-colors">
                              {reg.title}
                            </h3>
                            <p className="text-slate-500 text-xs leading-relaxed mb-4">{reg.summary}</p>
                          </div>

                          {/* Beautiful AI specific block inside search item */}
                          <div className="bg-[#C5A059]/5 border border-[#C5A059]/10 rounded-xl p-4 flex items-start gap-3">
                            <Sparkles className="w-5 h-5 text-[#C5A059] shrink-0 mt-0.5" />
                            <div className="text-xs text-slate-600 leading-relaxed font-medium">
                              <div className="text-[#002D5B] font-bold mb-1 flex items-center gap-1">
                                <span>AI วิเคราะห์สาระสำคัญข้อบังคับ:</span>
                              </div>
                              <p className="whitespace-pre-line">{reg.aiSummary || reg.summary}</p>
                            </div>
                          </div>
                        </div>

                        {/* Card actions rail */}
                        <div className="w-full md:w-44 bg-slate-50/50 p-4 flex flex-row md:flex-col justify-center gap-3 items-center shrink-0">
                          <button
                            onClick={() => {
                              setActiveTab("chatbot");
                              handleSendChat(undefined, `ต้องการสอบถามข้อกฎหมายเกี่ยวกับเรื่องนี้: "${reg.title}"`);
                            }}
                            className="w-full flex-1 md:flex-none border-2 border-[#002D5B] text-[#002D5B] hover:bg-[#002D5B] hover:text-white px-4 py-2.5 rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-sm shadow-slate-200"
                          >
                            <MessageSquare className="w-4 h-4" />
                            <span>ถาม AI</span>
                          </button>
                          <button
                            onClick={() => {
                              setSelectedPdfUrl(reg.pdf_path);
                              setSelectedPdfTitle(reg.title);
                            }}
                            className="w-full flex-1 md:flex-none bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 px-4 py-2.5 rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                          >
                            <FileDown className="w-4 h-4" />
                            <span>ดูระเบียบ PDF</span>
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: LEGAL CHATBOT VIEW */}
          {activeTab === "chatbot" && (
            <div className="max-w-4xl mx-auto bg-white rounded-2xl border border-[#002D5B]/10 shadow-xl overflow-hidden flex flex-col h-[calc(100vh-180px)] animate-fadeIn">
              {/* Top info header */}
              <div className="navy-gradient text-white p-5 border-b border-[#002D5B]/20 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#C5A059]/20 flex items-center justify-center border border-[#C5A059]/30 text-[#C5A059] shrink-0 shadow-md">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base">ระบบสนทนาผู้ช่วยกฎหมาย ทร.</h3>
                    <p className="text-slate-300 text-xs font-semibold">Official Royal Thai Navy Legal Chatbot</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (confirm("ต้องการล้างบทสนทนาทั้งหมดหรือไม่?")) {
                      setChats([
                        {
                          chat_id: "init_welcome",
                          question: "เริ่มต้น",
                          answer: "ล้างบทสนทนาเรียบร้อยครับ ยินดีต้อนรับสู่การถามคำถามข้อกฎหมายและระเบียบทหารเรือรอบใหม่ครับ",
                          reference: "สารบรรณ ทร."
                        }
                      ]);
                    }
                  }}
                  className="p-2 text-slate-300 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                  title="Clear history"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>

              {/* Chat timeline body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#fdfcfb]">
                {chats.map((chat) => (
                  <div key={chat.chat_id} className="space-y-4">
                    {/* User Question Bubble */}
                    {chat.question && (
                      <div className="flex justify-end w-full">
                        <div className="bg-[#002D5B] text-white rounded-2xl rounded-tr-none px-5 py-3.5 max-w-[80%] shadow-lg border border-[#002D5B]/20">
                          <p className="text-sm font-medium leading-relaxed">{chat.question}</p>
                        </div>
                      </div>
                    )}

                    {/* AI Answer Bubble */}
                    {(chat.answer || chat.isLoading) && (
                      <div className="flex justify-start w-full gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#C5A059]/10 flex items-center justify-center text-[#002D5B] border border-[#C5A059]/20 shrink-0 shadow-sm">
                          <Sparkles className="w-5 h-5 text-[#C5A059]" />
                        </div>
                        <div className="bg-white text-slate-800 border border-slate-200 rounded-2xl rounded-tl-none p-6 max-w-[85%] shadow-md border-l-4 border-l-[#C5A059] space-y-4">
                          {chat.isLoading ? (
                            <div className="flex items-center gap-3 py-1 text-slate-500">
                              <Loader2 className="w-5 h-5 animate-spin text-[#002D5B]" />
                              <span className="text-xs font-bold animate-pulse font-mono uppercase tracking-wider">
                                กำลังประมวลผลวิเคราะห์ข้อมูลสารบรรณและระเบียบ ทร....
                              </span>
                            </div>
                          ) : (
                            <>
                              <div className="text-sm leading-relaxed whitespace-pre-wrap">{chat.answer}</div>

                              {/* Source Reference Metadata */}
                              {chat.reference && (
                                <div className="bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl mt-4">
                                  <div className="font-bold text-slate-700 text-xs flex items-center gap-1.5 mb-1.5">
                                    <BookOpen className="w-4 h-4 text-[#C5A059]" />
                                    <span>เอกสารอ้างอิงประกอบราชการ (References):</span>
                                  </div>
                                  <p className="text-xs text-slate-500 italic font-medium">{chat.reference}</p>
                                </div>
                              )}

                              {/* Bubble buttons actions */}
                              <div className="flex items-center gap-3 mt-4 pt-4 border-t border-slate-100">
                                <button
                                  onClick={() => copyToClipboard(chat.answer)}
                                  className="border-2 border-slate-200 text-slate-600 hover:bg-slate-50 px-3 py-1.5 rounded-full font-bold text-xs transition-colors flex items-center gap-1 cursor-pointer shadow-sm"
                                >
                                  <Copy className="w-3.5 h-3.5" />
                                  <span>คัดลอกคำตอบ</span>
                                </button>
                                <button
                                  onClick={() => {
                                    setWriterMainPoints(chat.answer);
                                    setWriterSubject(`หนังสือราชการเรื่อง ${chat.question.slice(0, 25)}...`);
                                    setActiveTab("writer");
                                    showToast("โอนย้ายข้อมูลข้อความไปยังตัวร่างหนังสือราชการแล้ว", "info");
                                  }}
                                  className="border-2 border-slate-200 text-slate-600 hover:bg-slate-50 px-3 py-1.5 rounded-full font-bold text-xs transition-colors flex items-center gap-1 cursor-pointer shadow-sm"
                                >
                                  <FileSignature className="w-3.5 h-3.5" />
                                  <span>นำไปร่างเอกสารต่อ</span>
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                <div ref={chatBottomRef} />
              </div>

              {/* Message Typing Input Bar */}
              <div className="p-4 bg-white border-t border-slate-200 shrink-0">
                <form onSubmit={handleSendChat} className="max-w-4xl mx-auto flex items-center gap-2 relative">
                  <input
                    type="text"
                    disabled={isChatLoading}
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="พิมพ์พิมพ์ซักถามข้อกฎหมาย, ระเบียบสวัสดิการพัสดุ ทร. ที่นี่..."
                    className="flex-1 bg-slate-100 border-2 border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C5A059] focus:border-transparent rounded-full px-5 py-3.5 text-slate-800 placeholder-slate-400 font-medium text-sm shadow-inner"
                  />
                  <VoiceDictationButton
                    onTranscript={(text) => setChatInput((prev) => prev ? `${prev}${text}` : text)}
                    tooltipText="พูดคำซักถามของคุณด้วยเสียงภาษาไทย"
                    className="p-3.5 rounded-full border-2 border-slate-200 h-[48px] w-[48px] bg-white flex items-center justify-center hover:bg-slate-50 shrink-0"
                  />
                  <button
                    type="submit"
                    disabled={isChatLoading || !chatInput.trim()}
                    className="navy-gradient hover:opacity-95 text-white disabled:opacity-40 transition-all p-3.5 rounded-full flex items-center justify-center shrink-0 cursor-pointer shadow-md h-[48px] w-[48px]"
                  >
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </form>
                <p className="text-center text-[10px] text-slate-400 mt-2 font-semibold uppercase tracking-wider">
                  CivicIntel AI อาจให้ข้อมูลที่ไม่ถูกต้อง โปรดตรวจสอบกับฝ่ายสารบรรณพระธรรมนูญ ทร. ทุกครั้ง
                </p>
              </div>
            </div>
          )}

          {/* TAB 4: DOCUMENT SUMMARIZER VIEW */}
          {activeTab === "summarizer" && (
            <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fadeIn">
              {/* File upload zone & meta */}
              <div className="lg:col-span-4 flex flex-col gap-6">
                <div className="bg-white rounded-2xl border-2 border-dashed border-[#002D5B]/20 p-8 flex flex-col items-center justify-center text-center hover:bg-[#C5A059]/5 transition-colors relative cursor-pointer group shadow-md">
                  <input
                    type="file"
                    onChange={handleSimulatedFileUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <UploadCloud className="w-12 h-12 text-[#C5A059] group-hover:text-[#002D5B] transition-colors mb-3" />
                  <h3 className="font-bold text-slate-900 text-base mb-1">อัปโหลดไฟล์เอกสาร</h3>
                  <p className="text-slate-500 text-xs max-w-[200px] leading-relaxed mb-4">
                    ลากและวางไฟล์ระเบียบ PDF หรือคำสั่งสวาดิการ ที่นี่เพื่อวิเคราะห์สรุปประเด็นหลัก
                  </p>
                  <button className="bg-slate-100 text-slate-700 border border-slate-200 px-4 py-2 rounded-xl text-xs font-bold transition-all">
                    เลือกไฟล์จากหน่วยพัสดุ
                  </button>
                </div>

                {/* Paste Text Directly segment */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-md space-y-4">
                  <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                    <Sparkles className="w-4.5 h-4.5 text-[#C5A059]" />
                    <span>หรือป้อนเนื้อหาเอกสารโดยตรง:</span>
                  </h4>
                  <textarea
                    value={summaryInputText}
                    onChange={(e) => setSummaryInputText(e.target.value)}
                    placeholder="พิมพ์หรือคัดลอกใจความเนื้อหาของระเบียบขนาดยาวมาวางที่นี่..."
                    className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl p-3 text-slate-700 placeholder-slate-400 font-medium text-xs focus:outline-none focus:ring-2 focus:ring-[#C5A059] focus:bg-white focus:border-transparent h-32 resize-none transition-all"
                  />
                  <button
                    onClick={handleSummarizeSubmit}
                    disabled={isSummarizing || !summaryInputText.trim()}
                    className="w-full navy-gradient text-white font-bold text-xs py-3 rounded-xl flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer disabled:opacity-45"
                  >
                    {isSummarizing ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                    <span>สรุปประเด็นด้วย AI (Summarize)</span>
                  </button>
                </div>

                {/* Document Information panel */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-md">
                  <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5 mb-4 border-b border-slate-100 pb-2">
                    <BookMarked className="w-4.5 h-4.5 text-[#C5A059]" />
                    <span>รายละเอียดไฟล์เอกสาร</span>
                  </h4>
                  <div className="space-y-3 font-medium text-xs text-slate-500">
                    <div className="flex justify-between border-b border-slate-100 pb-2">
                      <span>ชื่อเอกสาร:</span>
                      <span className="text-slate-900 font-bold truncate max-w-[140px]" title={fileName}>
                        {fileName}
                      </span>
                    </div>
                    <div className="flex justify-between border-b border-slate-100 pb-2">
                      <span>ขนาดข้อมูล:</span>
                      <span className="text-slate-900 font-bold">{fileSize}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-100 pb-2">
                      <span>ประเภทประมวลผล:</span>
                      <span className="text-slate-900 font-bold">ระเบียบปฏิบัติการสารบรรณ</span>
                    </div>
                    <div className="flex justify-between">
                      <span>ปรับปรุงเข้าสู่ระบบ:</span>
                      <span className="text-slate-900 font-bold">๑๒ กรกฎาคม ๒๕๖๖</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* AI Summary result timeline */}
              <div className="lg:col-span-8 flex flex-col h-full">
                <div className="bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden flex flex-col h-full">
                  {/* Tab header simulation */}
                  <div className="bg-[#fdfcfb] border-b border-slate-200 flex px-4">
                    <button className="px-5 py-4 font-bold text-[#002D5B] border-b-2 border-[#C5A059] text-xs uppercase tracking-wider">
                      สรุปย่อประเด็นสำคัญ (AI Short Summary)
                    </button>
                  </div>

                  {isSummarizing ? (
                    <div className="flex-1 p-16 text-center flex flex-col items-center justify-center gap-4">
                      <Loader2 className="w-10 h-10 animate-spin text-[#002D5B]" />
                      <p className="text-slate-500 text-sm font-bold animate-pulse">กำลังประมวลผลสังเคราะห์และสรุปสาระสำคัญด้วย AI...</p>
                    </div>
                  ) : !summaryResult ? (
                    <div className="flex-1 p-16 text-center text-slate-400 flex flex-col items-center justify-center">
                      <FileText className="w-16 h-16 text-slate-300 mb-3 animate-pulse" />
                      <p className="text-sm font-bold">ยังไม่ได้ประมวลผลวิเคราะห์เอกสาร</p>
                      <p className="text-xs mt-1 text-slate-400">กรุณาอัปโหลดไฟล์หรือป้อนข้อความ และกดปุ่มสรุปประเด็นด้านซ้าย</p>
                    </div>
                  ) : (
                    <div className="p-8 space-y-8 overflow-y-auto max-h-[calc(100vh-280px)] border-l-4 border-l-[#C5A059]">
                      <div className="flex items-start gap-3">
                        <Sparkles className="w-6 h-6 text-[#C5A059] shrink-0 mt-1" />
                        <div>
                          <h2 className="text-xl font-bold text-slate-900 leading-snug">Intelligence Summary</h2>
                          <p className="text-slate-600 text-sm leading-relaxed mt-2">{summaryResult.summary}</p>
                        </div>
                      </div>

                      {/* Bento grid layout inside summary */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Key Findings */}
                        <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 space-y-3 shadow-inner">
                          <h4 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                            <CheckCircle2 className="w-5 h-5 text-[#C5A059]" />
                            <span>ข้อค้นพบสำคัญ (Key Findings)</span>
                          </h4>
                          <ul className="space-y-2 text-xs text-slate-600 leading-relaxed font-medium">
                            {summaryResult.findings.map((finding, idx) => (
                              <li key={idx} className="flex items-start gap-2">
                                <span className="text-[#C5A059] font-extrabold select-none">•</span>
                                <span>{finding}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Impact details */}
                        <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 space-y-3 shadow-inner border-t-4 border-t-[#C5A059]">
                          <h4 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                            <TrendingUp className="w-5 h-5 text-[#002D5B]" />
                            <span>การวิเคราะห์ผลกระทบ (Impact)</span>
                          </h4>
                          <p className="text-xs text-slate-600 leading-relaxed font-medium">
                            {summaryResult.impact}
                          </p>
                        </div>
                      </div>

                      {/* Action items checklist */}
                      <div className="space-y-4">
                        <h4 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                          <CheckSquare className="w-5 h-5 text-[#C5A059]" />
                          <span>สิ่งที่ต้องจัดเตรียมดำเนินการต่อไป (Action Items):</span>
                        </h4>
                        <div className="space-y-3">
                          {summaryResult.actionItems.map((action, idx) => (
                            <div
                              key={idx}
                              onClick={() => toggleActionItem(action)}
                              className={`p-4 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                                checkedActions.includes(action)
                                  ? "bg-[#C5A059]/5 border-[#C5A059]/20 text-slate-500 line-through"
                                  : "bg-white border-slate-200 hover:border-slate-300 text-slate-800"
                              }`}
                            >
                              <span className="shrink-0 mt-0.5">
                                {checkedActions.includes(action) ? (
                                  <CheckCircle2 className="w-5 h-5 text-[#C5A059]" />
                                ) : (
                                  <Square className="w-5 h-5 text-slate-300" />
                                )}
                              </span>
                              <span className="text-xs font-semibold leading-relaxed">{action}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Floating actions at bottom page */}
                      <div className="pt-6 border-t border-slate-100 flex flex-wrap gap-3 justify-end">
                        <button
                          onClick={() => {
                            showToast("ระบบแปลภาษาระเบียบเป็น อังกฤษ/ไทย อัจฉริยะแล้ว", "success");
                            setSummaryResult({
                              ...summaryResult,
                              summary: `[Translated EN] This document serves as the updated standard operational protocol for personal data management within public sectors (Version 3). Specifically enforcing 256-bit encryption standards and reducing non-essential data storage limit to 5 years.`
                            });
                          }}
                          className="px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border border-slate-200 shadow-sm"
                        >
                          <Sparkles className="w-4 h-4 text-slate-600" />
                          <span>แปลภาษา (Translate)</span>
                        </button>
                        <button
                          onClick={() => showToast("การตรวจสอบทางกฎหมาย: ไม่พบความขัดแย้งของระเบียบกระทรวงกลาโหม", "success")}
                          className="px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border border-slate-200 shadow-sm"
                        >
                          <ShieldCheck className="w-4 h-4 text-emerald-600" />
                          <span>ตรวจความสอดคล้อง (Legal Check)</span>
                        </button>
                        <button
                          onClick={() => showToast("จำลองส่งออกไฟล์รายงานสรุปในรูปแบบ PDF เรียบร้อย", "success")}
                          className="px-5 py-2.5 navy-gradient text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-slate-200 animate-pulse"
                        >
                          <FileDown className="w-4 h-4" />
                          <span>ส่งออกเป็น PDF (Export)</span>
                        </button>
                      </div>

                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: LETTER WRITER VIEW */}
          {activeTab === "writer" && (
            <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-8 animate-fadeIn">
              {/* Form Input parameters */}
              <div className="w-full lg:w-1/3 bg-white rounded-2xl border border-slate-200 p-6 shadow-md flex flex-col gap-6 self-start">
                <div className="space-y-1">
                  <h3 className="font-bold text-slate-900 text-base flex items-center gap-1.5">
                    <FileSignature className="w-5.5 h-5.5 text-[#002D5B]" />
                    <span>กำหนดพารามิเตอร์หนังสือ</span>
                  </h3>
                  <p className="text-slate-500 text-xs leading-relaxed font-semibold">
                    กรอกข้อมูลหรืออ้างอิงหลักการพัสดุเพื่อให้ AI ร่างเนื้อหาหนังสือราชการถูกต้องสมบูรณ์
                  </p>
                </div>

                <div className="space-y-4 flex-1">
                  {/* Select Doc Type */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">ประเภทหนังสือ</label>
                    <select
                      value={writerDocType}
                      onChange={(e) => setWriterDocType(e.target.value)}
                      className="w-full border-2 border-slate-200 rounded-xl px-4 py-2.5 text-slate-700 font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-[#C5A059] focus:border-transparent bg-white"
                    >
                      <option>หนังสือภายนอก</option>
                      <option>หนังสือภายใน (บันทึกข้อความ)</option>
                      <option>หนังสือประทับตรา</option>
                      <option>หนังสือสั่งการ</option>
                      <option>กระดาษเขียนข่าวราชนาวี (แบบ สส.ทร.๘)</option>
                    </select>
                  </div>

                  {/* Urgency selection status card */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">ระดับความเร่งด่วน</label>
                    <div className="flex gap-2">
                      {["ปกติ", "ด่วน", "ด่วนที่สุด"].map((level) => (
                        <button
                          key={level}
                          onClick={() => setWriterUrgency(level)}
                          className={`flex-1 py-2.5 rounded-xl text-center text-xs font-bold border transition-all cursor-pointer ${
                            writerUrgency === level
                              ? level === "ด่วนที่สุด"
                                ? "bg-rose-50 border-rose-500 text-rose-600 shadow-md"
                                : level === "ด่วน"
                                ? "bg-amber-50 border-amber-500 text-amber-600 shadow-md"
                                : "bg-[#C5A059]/10 border-[#C5A059] text-[#002D5B] shadow-md"
                              : "border-slate-200 text-slate-500 hover:bg-slate-50"
                          }`}
                        >
                          {level}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Receiver */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">ผู้รับ (เรียน)</label>
                      <VoiceDictationButton
                        onTranscript={(text) => setWriterReceiver((prev) => prev ? `${prev}${text}` : text)}
                        tooltipText="พิมพ์ชื่อผู้รับด้วยเสียงภาษาไทย"
                        className="py-1 px-2 text-[10px] h-6 flex gap-1 items-center bg-slate-50 hover:bg-slate-100 border-slate-200"
                      />
                    </div>
                    <input
                      type="text"
                      value={writerReceiver}
                      onChange={(e) => setWriterReceiver(e.target.value)}
                      placeholder="เช่น เรียน ผู้บัญชาการกรมอู่ทหารเรือ"
                      className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 placeholder-slate-400 font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-[#C5A059] focus:bg-white focus:border-transparent transition-all"
                    />
                  </div>

                  {/* Subject */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">เรื่อง</label>
                      <VoiceDictationButton
                        onTranscript={(text) => setWriterSubject((prev) => prev ? `${prev}${text}` : text)}
                        tooltipText="พิมพ์หัวข้อเรื่องด้วยเสียงภาษาไทย"
                        className="py-1 px-2 text-[10px] h-6 flex gap-1 items-center bg-slate-50 hover:bg-slate-100 border-slate-200"
                      />
                    </div>
                    <input
                      type="text"
                      value={writerSubject}
                      onChange={(e) => setWriterSubject(e.target.value)}
                      placeholder="หัวข้อหนังสือราชการ..."
                      className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 placeholder-slate-400 font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-[#C5A059] focus:bg-white focus:border-transparent transition-all"
                    />
                  </div>

                  {/* Points */}
                  <div className="space-y-1.5 flex-1 flex flex-col">
                    <div className="flex justify-between items-center">
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">ประเด็นหลัก / รายละเอียดแบบย่อ</label>
                      <VoiceDictationButton
                        onTranscript={(text) => setWriterMainPoints((prev) => prev ? `${prev} ${text}` : text)}
                        tooltipText="พิมพ์ประเด็นด้วยเสียงภาษาไทย"
                        className="py-1 px-2 text-[10px] h-6 flex gap-1 items-center bg-slate-50 hover:bg-slate-100 border-slate-200"
                      />
                    </div>
                    <textarea
                      value={writerMainPoints}
                      onChange={(e) => setWriterMainPoints(e.target.value)}
                      placeholder="ป้อนประเด็นความต้องการสั้นๆ AI จะประมวลขยายความนำมาทำหนังสือทางการไทยที่สมบูรณ์..."
                      className="w-full flex-1 bg-slate-50 border-2 border-slate-200 rounded-xl p-3 text-slate-800 placeholder-slate-400 font-medium text-xs focus:outline-none focus:ring-2 focus:ring-[#C5A059] focus:bg-white focus:border-transparent h-32 resize-none transition-all"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 shrink-0 space-y-4">
                  <button
                    onClick={handleGenerateLetter}
                    disabled={isGeneratingLetter || !writerMainPoints.trim()}
                    className="w-full navy-gradient text-white font-bold text-xs py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all duration-150 cursor-pointer disabled:opacity-45"
                  >
                    {isGeneratingLetter ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Sparkles className="w-5 h-5 text-[#C5A059] animate-pulse" />
                    )}
                    <span>สร้างร่างหนังสือทางการ (Generate)</span>
                  </button>

                  {/* RTN Document Style Guidelines */}
                  <div className="p-4 rounded-xl border border-dashed border-[#C5A059]/40 bg-[#C5A059]/5 space-y-3">
                    <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5 uppercase tracking-wide">
                      <BookOpen className="w-4 h-4 text-[#C5A059]" />
                      <span>คู่มืออ้างอิงมาตรฐานงานสารบรรณ ทร.</span>
                    </h4>
                    <div className="text-[11px] text-slate-600 space-y-2 leading-relaxed font-semibold">
                      <p>• <span className="text-[#002D5B] font-bold">ฟอนท์ที่ใช้:</span> TH Sarabun PSK / Sarabun</p>
                      <p>• <span className="text-[#002D5B] font-bold">ขนาดตัวอักษร:</span> ๑๖ พอยต์ (16pt) สำหรับเนื้อความราชการทั่วไป</p>
                      <p>• <span className="text-[#002D5B] font-bold">หัวข้อบันทึกข้อความ:</span> ๒๙ พอยต์ (29pt) ตัวหนา</p>
                      <p>• <span className="text-[#002D5B] font-bold">ตราครุฑ (Garuda):</span> สูง ๓ ซม. (หนังสือภายนอก) หรือ ๑.๕ ซม. (บันทึกข้อความ)</p>
                      <p>• <span className="text-[#002D5B] font-bold">ระยะขอบกระดาษ A4:</span></p>
                      <div className="pl-3 space-y-0.5 text-[10px] text-slate-500">
                        <p>- ขอบซ้าย (สำหรับเย็บเล่ม): ๓.๐ ซม. (30mm)</p>
                        <p>- ขอบขวา: ๒.๐ ซม. (20mm)</p>
                        <p>- ขอบบน: ๒.๕ ซม. (25mm) / ขอบล่าง: ๒.๐ ซม. (20mm)</p>
                      </div>
                      <p>• <span className="text-[#002D5B] font-bold">ระยะย่อหน้าแรก (Indent):</span> ย่อหน้าเว้น ๒.๕ ซม. (2.5cm)</p>
                      <p>• <span className="text-[#002D5B] font-bold">การลงท้าย:</span> คำลงท้ายและลายชื่อวางกึ่งกลางทางขวา</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right preview paper document */}
              <div className="flex-1 bg-slate-200 p-8 rounded-2xl flex justify-center overflow-x-auto shadow-inner relative max-h-[calc(100vh-180px)] overflow-y-auto">
                {/* Floating controls in canvas */}
                {letterDraft && (
                  <div className="absolute bottom-6 right-6 z-10 bg-slate-900/90 backdrop-blur text-white px-5 py-3 rounded-full flex items-center gap-4 shadow-2xl border border-slate-800">
                    <button
                      onClick={() => showToast("AI กำลังขัดเกลาสำนวนและปรับแต่งคำอัจฉริยะ...", "info")}
                      className="text-[#C5A059] hover:text-[#C5A059]/80 font-bold text-xs flex items-center gap-1 cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>ขัดเกลาสำนวน</span>
                    </button>
                    <div className="w-px h-5 bg-slate-700"></div>
                    <button
                      onClick={() => showToast("จำลองดาวน์โหลดแบบพิมพ์ฟอร์ม ทร. เรียบร้อย", "success")}
                      className="text-slate-300 hover:text-white font-bold text-xs flex items-center gap-1 cursor-pointer"
                    >
                      <FileDown className="w-4 h-4" />
                      <span>บันทึกพัสดุ</span>
                    </button>
                    <div className="w-px h-5 bg-slate-700"></div>
                    <button
                      onClick={() => {
                        const docEl = document.getElementById("printed-document");
                        if (docEl) {
                          printDocument(docEl.innerHTML, writerSubject || "ร่างหนังสือราชการกองทัพเรือ");
                          showToast("กำลังเตรียมส่งออกเอกสารราชการไปยังระบบเครื่องพิมพ์...", "success");
                        } else {
                          showToast("ไม่พบเอกสารเพื่อพิมพ์", "error");
                        }
                      }}
                      className="text-slate-300 hover:text-white font-bold text-xs flex items-center gap-1 cursor-pointer"
                    >
                      <Printer className="w-4 h-4" />
                      <span>สั่งพิมพ์</span>
                    </button>
                  </div>
                )}

                {isGeneratingLetter ? (
                  <div className="w-[210mm] min-h-[297mm] bg-white rounded-sm shadow-xl p-16 text-center flex flex-col items-center justify-center gap-4">
                    <Loader2 className="w-10 h-10 animate-spin text-[#002D5B]" />
                    <p className="text-slate-600 text-sm font-bold animate-pulse font-semibold">กำลังประมวลผลวาดและร่างหนังสือตามกฎระเบียบกองทัพเรือไทย...</p>
                  </div>
                ) : !letterDraft ? (
                  <div className="w-[210mm] min-h-[297mm] bg-white rounded-sm shadow-xl p-16 text-center flex flex-col items-center justify-center text-slate-400">
                    <FileSignature className="w-16 h-16 text-[#C5A059] mb-3 animate-pulse" />
                    <h3 className="font-bold text-[#002D5B] text-lg">แบบฟอร์มเอกสารเปล่า</h3>
                    <p className="text-sm mt-1 max-w-[260px] leading-relaxed mx-auto font-semibold">
                      กรอกพารามิเตอร์หนังสือที่แผงควบคุมทางด้านซ้าย และคลิกสร้างร่างเพื่อแสดงตัวอย่างบนหน้ากระดาษ A4 สารบรรณ ทร.
                    </p>
                  </div>
                ) : (
                  renderOfficialPaper(letterDraft, writerDocType, writerSubject, writerReceiver)
                )}
              </div>
            </div>
          )}

          {/* TAB 6: ANALYTICS VIEW */}
          {activeTab === "analytics" && (
            <div className="max-w-6xl mx-auto space-y-8 animate-fadeIn">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-2xl font-bold text-slate-900">รายงานวิเคราะห์ประสิทธิภาพและความพึงพอใจ</h1>
                  <p className="text-slate-500 text-xs">ภาพรวมเชิงลึกการช่วยงานด้วยปัญญาประดิษฐ์ในรอบเดือนของ ทร.</p>
                </div>
                <button
                  onClick={() => showToast("จำลองส่งออกข้อมูลสถิติรูปแบบ Excel สำหรับผู้บริหาร", "success")}
                  className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  <FileDown className="w-4 h-4" />
                  <span>ส่งออกข้อมูล (Export)</span>
                </button>
              </div>

              {/* Key Metrics row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Time Saved Card */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-md flex flex-col justify-between">
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">เวลาที่ประหยัดสะสม</span>
                    <span className="p-2 rounded-xl bg-[#002D5B]/5 text-[#002D5B] border border-[#002D5B]/10">
                      <Clock className="w-5 h-5" />
                    </span>
                  </div>
                  <div>
                    <h2 className="text-4xl font-extrabold text-slate-900 font-mono tracking-tight">124 <span className="text-sm text-slate-400 font-bold">ชั่วโมง</span></h2>
                    <p className="text-[#002D5B] text-xs font-semibold flex items-center gap-1 mt-1">
                      <TrendingUp className="w-4 h-4" />
                      <span>เพิ่มขึ้น 15% จากสัปดาห์ก่อน</span>
                    </p>
                  </div>
                </div>

                {/* Accuracy Score Card */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-md flex flex-col justify-between border-l-4 border-l-[#C5A059]">
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">คะแนนความแม่นยำ AI</span>
                    <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
                      <ShieldCheck className="w-5 h-5" />
                    </span>
                  </div>
                  <div>
                    <h2 className="text-4xl font-extrabold text-slate-900 font-mono tracking-tight">96<span className="text-base text-slate-400">%</span></h2>
                    <p className="text-slate-400 text-xs font-semibold mt-1">ความสอดคล้องตามมาตรฐานศาลทหาร</p>
                  </div>
                </div>

                {/* Active cases */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-md flex flex-col justify-between">
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">คำร้องตรวจรับพัสดุค้าง</span>
                    <span className="p-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
                      <Sparkles className="w-5 h-5" />
                    </span>
                  </div>
                  <div>
                    <h2 className="text-4xl font-extrabold text-slate-900 font-mono tracking-tight">342</h2>
                    <p className="text-slate-400 text-xs font-semibold mt-1">• 120 คำร้องรอพิจารณาอนุมัติ</p>
                  </div>
                </div>
              </div>

              {/* Complex charts area & Feedback feedback list */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Recharts chart container */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-md flex flex-col">
                  <h3 className="font-bold text-slate-900 text-base mb-4 flex items-center gap-1.5">
                    <TrendingUp className="w-5 h-5 text-[#002D5B]" />
                    <span>ภาพรวมการเติบโต: ประมวลผลด้วย AI vs แบบดั้งเดิม</span>
                  </h3>
                  <div className="flex-1 w-full h-80 min-h-[320px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={analyticsChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="name" stroke="#94a3b8" style={{ fontSize: 11, fontWeight: "bold" }} />
                        <YAxis stroke="#94a3b8" style={{ fontSize: 11, fontWeight: "bold" }} />
                        <ChartTooltip contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0" }} />
                        <ChartLegend verticalAlign="top" height={36} iconType="circle" />
                        <Line
                          name="ปริมาณงานที่ประมวลผลสำเร็จด้วย AI"
                          type="monotone"
                          dataKey="aiValue"
                          stroke="#002D5B"
                          strokeWidth={3}
                          activeDot={{ r: 8 }}
                        />
                        <Line
                          name="ปริมาณการยื่นแบบวิธีดั้งเดิม"
                          type="monotone"
                          dataKey="tradValue"
                          stroke="#C5A059"
                          strokeWidth={2}
                          strokeDasharray="5 5"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Feedbacks list */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-md flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-slate-900 text-base mb-4">ข้อเสนอแนะล่าสุดจากกำลังพล</h3>
                    <div className="space-y-4">
                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1.5">
                        <div className="flex justify-between items-center">
                          <span className="text-amber-500 font-bold">★★★★★</span>
                          <span className="text-slate-400 font-semibold">2 ชม. ที่แล้ว</span>
                        </div>
                        <p className="text-slate-600 font-medium leading-relaxed">
                          "ระบบร่างจดหมายช่วยลดขั้นตอนของธุรการกลางไปได้ดีมาก ร่างเรียบร้อยและสำนวนเป็นทางการสุภาพมาก"
                        </p>
                      </div>

                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1.5">
                        <div className="flex justify-between items-center">
                          <span className="text-amber-500 font-bold">★★★★☆</span>
                          <span className="text-slate-400 font-semibold">5 ชม. ที่แล้ว</span>
                        </div>
                        <p className="text-slate-600 font-medium leading-relaxed">
                          "ค้นหาข้อระเบียบพัสดุ ทร. ได้รวดเร็ว ประทับใจวิเคราะห์ AI เพิ่มเติมประกอบท้าย"
                        </p>
                      </div>

                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1.5">
                        <div className="flex justify-between items-center">
                          <span className="text-amber-500 font-bold">★★★★★</span>
                          <span className="text-slate-400 font-semibold">1 วันก่อน</span>
                        </div>
                        <p className="text-slate-600 font-medium leading-relaxed">
                          "ช่วยผู้บริหารสรุปประเด็นระเบียบประหยัดเวลาการอ่านแฟ้มขนาดยาว แนะนำกำลังพลพัสดุทุกคนใช้"
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Comparison table before vs after AI usage */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-6">
                <h3 className="font-bold text-slate-900 text-base mb-4 border-b border-slate-100 pb-3">
                  เปรียบเทียบระยะเวลาปฏิบัติงาน: ก่อนหน้า vs หลังนำปัญญาประดิษฐ์ AI มาใช้
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 font-bold text-xs border-b border-slate-100">
                        <th className="py-3 px-4">กิจกรรมกระบวนการพัสดุ</th>
                        <th className="py-3 px-4">กระบวนการแบบดั้งเดิม (เฉลี่ย)</th>
                        <th className="py-3 px-4 text-[#002D5B]">ประมวลผลด้วย AI (เฉลี่ย)</th>
                        <th className="py-3 px-4 text-right">ร้อยละที่ประหยัดเวลาได้</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                      <tr>
                        <td className="py-4 px-4">ค้นหาและรวบรวมระเบียบข้อบังคับพัสดุ</td>
                        <td className="py-4 px-4 text-slate-400">45 นาที</td>
                        <td className="py-4 px-4 text-[#002D5B] font-bold">5 นาที</td>
                        <td className="py-4 px-4 text-right text-emerald-600 font-bold">- 88%</td>
                      </tr>
                      <tr>
                        <td className="py-4 px-4">ร่างจดหมายหนังสือชี้แจง / สัญญาแต่งตั้งคณะกรรมการ ทร.</td>
                        <td className="py-4 px-4 text-slate-400">60 นาที</td>
                        <td className="py-4 px-4 text-[#002D5B] font-bold">12 นาที</td>
                        <td className="py-4 px-4 text-right text-emerald-600 font-bold">- 80%</td>
                      </tr>
                      <tr>
                        <td className="py-4 px-4">การอ่านและสรุปย่อแฟ้มเอกสารการประชุมสวัสดิการขนาดยาว</td>
                        <td className="py-4 px-4 text-slate-400">90 นาที</td>
                        <td className="py-4 px-4 text-[#002D5B] font-bold">10 นาที</td>
                        <td className="py-4 px-4 text-right text-emerald-600 font-bold">- 88%</td>
                      </tr>
                      <tr>
                        <td className="py-4 px-4">ตรวจสอบความถูกต้องเชิงกฎหมายเบื้องต้น</td>
                        <td className="py-4 px-4 text-slate-400">30 นาที</td>
                        <td className="py-4 px-4 text-[#002D5B] font-bold">3 นาที</td>
                        <td className="py-4 px-4 text-right text-emerald-600 font-bold">- 90%</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: PROFILE MANAGEMENT VIEW */}
          {activeTab === "profile" && (
            <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn">
              {/* Profile Header Card */}
              <div className="navy-gradient text-white p-8 rounded-3xl relative overflow-hidden shadow-xl border border-[#C5A059]/20 flex flex-col md:flex-row items-center gap-6">
                <div className="absolute right-0 top-0 w-64 h-full bg-no-repeat bg-contain opacity-10 bg-right pointer-events-none" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCRxEYP6KB2-vN34v52lMOSjwaDuUN8-p_XxCR2h1z8SUdyjSgteS7aocJVcSc23c3RM017h7EAxwdz_p5x0Nu_i1QKuY3BdK7GP-cUVtlkRwJvdRGpVc77lysQpiG-Y6Klgxo_REdL-t-2wBP4VmV2HXqV1DkTmex9Hay2cJyO4ud6a64jFvyfDZnm305gbnRkH_w27m_B8-NvAZkd54K8BHMhYQqE_gY2zUZlqv1rV8em56_kYTSI')" }} />
                
                <div className="w-24 h-24 rounded-full bg-[#C5A059] border-4 border-white/20 overflow-hidden shadow-xl flex items-center justify-center text-white font-extrabold text-3xl shrink-0 select-none">
                  {currentUser.profileImage ? (
                    <img
                      src={currentUser.profileImage}
                      alt={currentUser.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    currentUser.name ? currentUser.name.split(" ").pop()?.slice(0, 2) || "วภ" : "วภ"
                  )}
                </div>

                <div className="text-center md:text-left space-y-2 flex-1">
                  <div className="bg-[#C5A059]/20 text-[#C5A059] font-bold text-[10px] px-3 py-1 rounded-full w-max mx-auto md:mx-0 border border-[#C5A059]/30 uppercase tracking-widest">
                    ข้าราชการกองทัพเรือไทย • RTN OFFICER PROFILE
                  </div>
                  <h1 className="text-3xl font-extrabold tracking-tight">
                    {currentUser.rank} {currentUser.name}
                  </h1>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    สังกัด: {currentUser.unit} | หมายเลขข้าราชการ ทร.: {currentUser.militaryId || "ยังไม่ได้กำหนด"}
                  </p>
                </div>

                <div className="shrink-0 bg-white/10 px-4 py-3 rounded-2xl border border-white/10 text-center">
                  <div className="text-xs text-[#C5A059] font-bold uppercase tracking-wider">สถานะการยืนยัน</div>
                  <div className="text-sm font-bold text-emerald-400 flex items-center gap-1 mt-1 justify-center">
                    <ShieldCheck className="w-4 h-4" />
                    <span>ACTIVE</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Edit Form */}
                <div className="md:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-md p-8">
                  <h3 className="font-bold text-slate-900 text-lg mb-6 border-b border-slate-100 pb-4 flex items-center gap-2">
                    <Settings className="w-5 h-5 text-[#C5A059]" />
                    แก้ไขข้อมูลโปรไฟล์ข้าราชการ
                  </h3>

                  <form onSubmit={handleProfileUpdateSubmit} className="space-y-6">
                    {/* PROFILE IMAGE UPLOAD & PRESET SELECTOR */}
                    <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200/80 space-y-4">
                      <div className="flex flex-col sm:flex-row items-center gap-6">
                        {/* Current selected preview */}
                        <div className="relative shrink-0">
                          <div className="w-20 h-20 rounded-full bg-[#C5A059] border-2 border-[#C5A059]/30 overflow-hidden shadow-inner flex items-center justify-center text-white font-extrabold text-2xl select-none">
                            {profileImage ? (
                              <img src={profileImage} alt="Profile Preview" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                            ) : (
                              profileName ? profileName.split(" ").pop()?.slice(0, 2) || "วภ" : "วภ"
                            )}
                          </div>
                          {profileImage && (
                            <button
                              type="button"
                              onClick={() => {
                                setProfileImage("");
                                showToast("ลบรูปภาพโปรไฟล์ชั่วคราวแล้ว (กรุณากดบันทึกเพื่อยืนยัน)", "info");
                              }}
                              className="absolute -top-1 -right-1 bg-rose-600 hover:bg-rose-700 text-white p-1 rounded-full shadow-md transition-colors cursor-pointer"
                              title="ลบรูปภาพ"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        {/* Upload Controls */}
                        <div className="flex-1 space-y-2 text-center sm:text-left">
                          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                            รูปภาพประจำตัวข้าราชการ (Profile Image)
                          </h4>
                          <p className="text-[11px] text-slate-500 leading-normal">
                            อัปโหลดรูปภาพใบหน้าของท่านเพื่อแสดงในหน้าข้อมูลข้าราชการ และมุมขวาบนของระบบ (รองรับ PNG, JPG ขนาดไม่เกิน 5MB)
                          </p>

                          {/* File input */}
                          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                            <label className="bg-white border border-slate-300 hover:border-[#002D5B] text-slate-700 hover:text-[#002D5B] px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer shadow-sm hover:shadow transition-all flex items-center gap-1.5 border-dashed">
                              <Camera className="w-3.5 h-3.5 text-[#C5A059]" />
                              <span>เลือกรูปภาพจากเครื่องท่าน</span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    if (file.size > 5 * 1024 * 1024) {
                                      showToast("ขนาดไฟล์ต้องไม่เกิน 5MB", "error");
                                      return;
                                    }
                                    const reader = new FileReader();
                                    reader.onload = (event) => {
                                      if (event.target?.result) {
                                        setProfileImage(event.target.result as string);
                                        showToast("อัปโหลดรูปภาพชั่วคราวสำเร็จแล้ว (กรุณากดบันทึกเพื่อยืนยัน)", "success");
                                      }
                                    };
                                    reader.readAsDataURL(file);
                                  }
                                }}
                              />
                            </label>
                            
                            {profileImage && (
                              <button
                                type="button"
                                onClick={() => {
                                  setProfileImage("");
                                  showToast("เปลี่ยนกลับเป็นรูปตัวอักษรเริ่มต้น (กรุณากดบันทึกเพื่อยืนยัน)", "info");
                                }}
                                className="bg-slate-200/80 hover:bg-slate-200 text-slate-600 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                              >
                                ใช้ชื่อย่อเริ่มต้น
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Preset options */}
                      <div className="border-t border-slate-200/60 pt-4">
                        <div className="text-[11px] font-bold text-slate-500 mb-2.5 uppercase tracking-wider">
                          หรือเลือกรูปภาพข้าราชการมาตรฐาน ทร.:
                        </div>
                        <div className="flex flex-wrap gap-3">
                          {[
                            {
                              name: "ตราสมอทอง ทร.",
                              url: "https://lh3.googleusercontent.com/aida-public/AB6AXuCRxEYP6KB2-vN34v52lMOSjwaDuUN8-p_XxCR2h1z8SUdyjSgteS7aocJVcSc23c3RM017h7EAxwdz_p5x0Nu_i1QKuY3BdK7GP-cUVtlkRwJvdRGpVc77lysQpiG-Y6Klgxo_REdL-t-2wBP4VmV2HXqV1DkTmex9Hay2cJyO4ud6a64jFvyfDZnm305gbnRkH_w27m_B8-NvAZkd54K8BHMhYQqE_gY2zUZlqv1rV8em56_kYTSI"
                            },
                            {
                              name: "กำลังพลข้าราชการชาย 1",
                              url: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop"
                            },
                            {
                              name: "กำลังพลข้าราชการหญิง 1",
                              url: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop"
                            },
                            {
                              name: "กำลังพลข้าราชการชาย 2",
                              url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop"
                            },
                            {
                              name: "กำลังพลข้าราชการหญิง 2",
                              url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop"
                            }
                          ].map((preset) => (
                            <button
                              key={preset.url}
                              type="button"
                              onClick={() => {
                                setProfileImage(preset.url);
                                showToast(`เลือกรูปภาพ ${preset.name} สำเร็จ (กรุณากดบันทึกเพื่อยืนยัน)`, "success");
                              }}
                              className={`group relative w-12 h-12 rounded-full overflow-hidden border-2 transition-all shadow-sm ${
                                profileImage === preset.url
                                  ? "border-[#002D5B] ring-2 ring-[#C5A059] scale-105"
                                  : "border-slate-200 hover:border-[#C5A059] hover:scale-105"
                              }`}
                              title={preset.name}
                            >
                              <img src={preset.url} alt={preset.name} className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                <Sparkles className="w-3.5 h-3.5 text-white" />
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                          ชื่อ-นามสกุล จริง (ไม่ต้องใส่คำนำหน้านามหรือยศ)
                        </label>
                        <input
                          type="text"
                          required
                          value={profileName}
                          onChange={(e) => setProfileName(e.target.value)}
                          placeholder="เช่น พรเทพ ศรีกองทัพ"
                          className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#002D5B] focus:ring-1 focus:ring-[#002D5B] transition-colors"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                          หมายเลขประจำตัวข้าราชการ ทร. (10 หลัก)
                        </label>
                        <input
                          type="text"
                          required
                          maxLength={10}
                          pattern="\d*"
                          value={profileMilitaryId}
                          onChange={(e) => setProfileMilitaryId(e.target.value.replace(/\D/g, ""))}
                          placeholder="เช่น 1409901234"
                          className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#002D5B] focus:ring-1 focus:ring-[#002D5B] transition-colors"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                          ยศทหารเรือ (Rank)
                        </label>
                        <select
                          value={profileRank}
                          onChange={(e) => setProfileRank(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#002D5B] focus:ring-1 focus:ring-[#002D5B] transition-colors"
                        >
                          {RTN_RANKS.map((rank) => (
                            <option key={rank} value={rank}>
                              {rank}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                          สังกัดกองทัพเรือ / หน่วยงานปฏิบัติราชการ
                        </label>
                        <select
                          value={profileUnit}
                          onChange={(e) => setProfileUnit(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#002D5B] focus:ring-1 focus:ring-[#002D5B] transition-colors"
                        >
                          {RTN_UNITS.map((unit) => (
                            <option key={unit} value={unit}>
                              {unit}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                        รหัสผ่านสำหรับเข้าสู่ระบบใหม่ (หากไม่ต้องการเปลี่ยน ให้ปล่อยว่างไว้)
                      </label>
                      <input
                        type="password"
                        value={profilePassword}
                        onChange={(e) => setProfilePassword(e.target.value)}
                        placeholder="ระบุรหัสผ่านใหม่ของท่าน"
                        className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#002D5B] focus:ring-1 focus:ring-[#002D5B] transition-colors"
                      />
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => {
                          setProfileName(currentUser.name || "");
                          setProfileRank(currentUser.rank || "เรือเอก");
                          setProfileUnit(currentUser.unit || "กองการพัสดุ กองทัพเรือ");
                          setProfilePassword(currentUser.password || "");
                          setProfileMilitaryId(currentUser.militaryId || "");
                          showToast("รีเซ็ตค่ากลับเป็นค่าดั้งเดิม", "info");
                        }}
                        className="px-6 py-3 border border-slate-200 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-50 hover:text-slate-900 transition-all cursor-pointer"
                      >
                        คืนค่าเดิม
                      </button>
                      <button
                        type="submit"
                        disabled={isProfileUpdating}
                        className="px-8 py-3 bg-gradient-to-r from-[#002D5B] to-[#001f3f] text-white rounded-xl text-sm font-bold border border-[#C5A059]/20 shadow-lg hover:opacity-95 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        {isProfileUpdating ? (
                          <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                        ) : (
                          <>
                            <ShieldCheck className="w-4 h-4" />
                            <span>บันทึกการแก้ไขโปรไฟล์</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>

                {/* Profile Stats & Credentials Check */}
                <div className="space-y-6">
                  {/* Security Card */}
                  <div className="bg-[#001f3f]/5 rounded-3xl border-2 border-[#002D5B]/10 p-6 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#002D5B] text-white flex items-center justify-center shadow-md">
                        <ShieldCheck className="w-5 h-5 text-[#C5A059]" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">RTN Security Center</h4>
                        <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">กองรักษาความปลอดภัยระบบ</p>
                      </div>
                    </div>
                    
                    <div className="text-xs text-slate-600 leading-relaxed space-y-3">
                      <div className="flex justify-between py-1.5 border-b border-slate-200">
                        <span className="text-slate-500">ระดับสิทธิ์เข้าใช้งาน:</span>
                        <span className="font-bold text-[#002D5B]">ข้าราชการสัญญาบัตร</span>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-slate-200">
                        <span className="text-slate-500">ประเภทบัญชีผู้ใช้:</span>
                        <span className="font-bold text-[#002D5B]">กำลังพลกองทัพเรือ</span>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-slate-200">
                        <span className="text-slate-500">การเชื่อมต่อเครือข่าย:</span>
                        <span className="font-bold text-emerald-600">RTN-INTRANET (Secure)</span>
                      </div>
                      <div className="flex justify-between py-1.5">
                        <span className="text-slate-500">รหัสยืนยันระบบ:</span>
                        <span className="font-mono text-[10px] bg-[#002D5B]/10 px-1.5 py-0.5 rounded font-bold text-slate-700">
                          MD5-RTN-SECURE
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Activity Log Cards */}
                  <div className="bg-white rounded-3xl border border-slate-200 shadow-md p-6 space-y-4">
                    <h4 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-3 flex items-center gap-2">
                      <History className="w-4 h-4 text-[#C5A059]" />
                      ประวัติการเข้าใช้งานล่าสุด
                    </h4>
                    <div className="space-y-3">
                      <div className="flex gap-3 text-xs leading-normal">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0"></div>
                        <div>
                          <p className="text-slate-700 font-semibold">อัปเดตข้อมูลรายละเอียดโปรไฟล์ข้าราชการ ทร.</p>
                          <p className="text-slate-400 text-[10px] font-medium">วันนี้ • {new Date().toLocaleTimeString("th-TH", {hour: "2-digit", minute: "2-digit"})} น.</p>
                        </div>
                      </div>
                      <div className="flex gap-3 text-xs leading-normal">
                        <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0"></div>
                        <div>
                          <p className="text-slate-700 font-semibold">เข้าสู่ระบบสารบรรณและพัสดุ ทร.</p>
                          <p className="text-slate-400 text-[10px] font-medium">วันนี้ • 10:24 น.</p>
                        </div>
                      </div>
                      <div className="flex gap-3 text-xs leading-normal">
                        <div className="w-2 h-2 rounded-full bg-purple-500 mt-1.5 shrink-0"></div>
                        <div>
                          <p className="text-slate-700 font-semibold">สืบค้นระเบียบกองทัพเรือว่าด้วยการพัสดุ พ.ศ. ๒๕๖๒</p>
                          <p className="text-slate-400 text-[10px] font-medium">เมื่อวาน • 15:43 น.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* Realistic Document Preview modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[95vh] overflow-hidden shadow-2xl flex flex-col border border-slate-200">
            <div className="bg-slate-900 text-white p-6 border-b border-slate-800 flex justify-between items-center">
              <div>
                <span className="bg-[#C5A059]/10 text-[#C5A059] border border-[#C5A059]/20 text-[10px] uppercase tracking-wider px-2 py-0.5 rounded font-bold">
                  {previewDoc.doc_type}
                </span>
                <h3 className="font-bold text-base text-white mt-1.5">{previewDoc.title}</h3>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700 shrink-0">
                  <button
                    onClick={() => setModalViewMode("visual")}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      modalViewMode === "visual"
                        ? "bg-[#C5A059] text-slate-950 shadow-md font-extrabold"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    รูปแบบจริง (A4)
                  </button>
                  <button
                    onClick={() => setModalViewMode("raw")}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      modalViewMode === "raw"
                        ? "bg-[#C5A059] text-slate-950 shadow-md font-extrabold"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    ข้อความดิบ
                  </button>
                </div>
                <button
                  onClick={() => setPreviewDoc(null)}
                  className="text-slate-400 hover:text-white rounded-xl p-2 hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            {modalViewMode === "visual" ? (
              <div className="p-4 sm:p-8 flex-1 overflow-y-auto bg-slate-200 flex justify-center items-start shadow-inner">
                <div className="max-w-full overflow-x-auto p-4 flex justify-center w-full">
                  <div className="transform scale-[0.55] sm:scale-[0.7] md:scale-[0.85] lg:scale-100 origin-top my-4 shadow-2xl rounded-sm">
                    {(() => {
                      const parsed = parseSavedDocument(previewDoc.content, previewDoc.doc_type);
                      return renderOfficialPaper(
                        parsed,
                        previewDoc.doc_type,
                        previewDoc.title,
                        parsed.receiver || "ผู้บัญชาการกรมอู่ทหารเรือ"
                      );
                    })()}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 flex-1 overflow-y-auto bg-slate-50 font-medium text-xs leading-relaxed text-slate-700 whitespace-pre-wrap">
                <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-inner font-mono max-w-[100%] overflow-x-auto text-[11px]">
                  {previewDoc.content}
                </div>
              </div>
            )}

            <div className="p-4 bg-slate-100 border-t border-slate-200 flex justify-end gap-2 shrink-0">
              <button
                onClick={() => {
                  const docEl = document.getElementById("printed-document");
                  if (docEl) {
                    printDocument(docEl.innerHTML, previewDoc.title || "เอกสารกองทัพเรือ");
                    showToast("กำลังเตรียมส่งออกเอกสารราชการไปยังระบบเครื่องพิมพ์...", "success");
                  } else {
                    showToast("ไม่พบเอกสารเพื่อพิมพ์", "error");
                  }
                }}
                className="bg-slate-900 text-white hover:bg-slate-800 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Printer className="w-4 h-4" />
                <span>สั่งพิมพ์แบบฟอร์ม ทร.</span>
              </button>
              <button
                onClick={() => copyToClipboard(previewDoc.content)}
                className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Copy className="w-4 h-4" />
                <span>คัดลอกข้อความ</span>
              </button>
              <button
                onClick={() => setPreviewDoc(null)}
                className="bg-slate-200 hover:bg-slate-300 text-slate-800 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PDF Viewer modal */}
      {selectedPdfUrl && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col border border-slate-200">
            <div className="bg-slate-900 text-white p-6 border-b border-slate-800 flex justify-between items-center">
              <div>
                <span className="bg-[#C5A059]/10 text-[#C5A059] border border-[#C5A059]/20 text-[10px] uppercase tracking-wider px-2 py-0.5 rounded font-bold">
                  เครื่องมือพรีวิว PDF ทหารเรือ
                </span>
                <h3 className="font-bold text-base text-white mt-1.5">{selectedPdfTitle}</h3>
              </div>
              <button
                onClick={() => setSelectedPdfUrl(null)}
                className="text-slate-400 hover:text-white rounded-lg p-1.5 hover:bg-slate-800 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>
            {/* Interactive simulated PDF Page */}
            <div className="p-8 flex-1 overflow-y-auto bg-slate-300 flex justify-center shadow-inner">
              <div className="doc-paper w-[210mm] min-h-[140mm] p-[15mm] text-slate-800 text-xs font-medium relative space-y-4 shadow-xl">
                {/* Garuda Crest */}
                <div className="flex justify-center mb-4">
                  <img
                    alt="Garuda"
                    className="w-16 h-16 object-contain"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuDU0dDmO8znQSHtlRpLLDgceGFArPGbMUhWQyMDG4Wb8zPb5FnmNBRSKkjVwHYdGc7L9luVuyAgv-WAHZYDWQquF32Smlmf1q_6re-hCjd9SeKh8z84FTk7ugjHAvupmNOb4hLujipxUKTRTkeJVefrO0vlPB4HdnVkbntRvs56SvyOr0vVesVO1x8iwrLJXpnS1VYYfP7qp0k9ZgAGqUrrTPQN4VJQPWBiJPjnKWpNWhkQsxrxxgr7"
                  />
                </div>
                <div className="text-center font-bold text-sm mb-4">
                  <span>ระเบียบปฏิบัติและข้อบังคับตามสิทธิและสวัสดิการของราชการ</span>
                </div>
                <p className="indent-10 leading-relaxed text-justify">
                  เอกสารฉบับนี้เป็นระเบียบที่สอดคล้องตามประมวลกฎหมายกลางและข้อกำหนดกระทรวงกลาโหม โดยกำหนดขอบเขตและวิธีปฏิบัติงานพัสดุในสังกัดกรมอู่ทหารเรือและกองการพัสดุทั้งปวง การตัดสินใจและการอนุมัติทุกฉบับจะต้องทำเป็นลายลักษณ์อักษรและอ้างอิงงบประมาณของกองทัพเรือไทย
                </p>
                <p className="indent-10 leading-relaxed text-justify">
                  อนึ่ง ในกรณีเร่งด่วนทหารทุกนายสามารถขอพิจารณาแต่งตั้งคณะกรรมการแบบพัสดุขนานกลางได้ทันที โดยให้ถือตามเกณฑ์ระดับขั้นสัญญาบัตรขั้นต้นเป็นประธานกรรมการ เพื่อความยุติธรรมและรักษาความลับของหน่วยงาน
                </p>
                <div className="pt-8 text-right text-slate-400 font-mono text-[9px]">
                  <span>SECURITY CLASSIFICATION: OFFICIAL USE ONLY</span>
                </div>
              </div>
            </div>
            <div className="p-4 bg-slate-100 border-t border-slate-200 flex justify-end gap-2 shrink-0">
              <button
                onClick={() => {
                  showToast("กำลังสั่งพิมพ์หน้าเอกสาร PDF จำลอง", "success");
                }}
                className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Printer className="w-4 h-4" />
                <span>สั่งพิมพ์</span>
              </button>
              <button
                onClick={() => setSelectedPdfUrl(null)}
                className="bg-slate-900 text-white hover:bg-slate-800 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
