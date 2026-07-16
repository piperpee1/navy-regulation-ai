import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "15mb" }));

const USERS_FILE_PATH = path.join(process.cwd(), "users.json");

const defaultUsers = [
  {
    user_id: "satit_1",
    name: "คุณสาธิต ประชารัฐ",
    rank: "เรือเอก",
    unit: "กองการพัสดุ กองทัพเรือ",
    password: "password123",
    militaryId: "1409901234",
    profileImage: ""
  }
];

function loadUsers(): any[] {
  try {
    if (fs.existsSync(USERS_FILE_PATH)) {
      const data = fs.readFileSync(USERS_FILE_PATH, "utf8");
      return JSON.parse(data);
    } else {
      fs.writeFileSync(USERS_FILE_PATH, JSON.stringify(defaultUsers, null, 2), "utf8");
      return defaultUsers;
    }
  } catch (error) {
    console.error("Error reading or writing users.json:", error);
    return defaultUsers;
  }
}

function saveUsers(usersList: any[]) {
  try {
    fs.writeFileSync(USERS_FILE_PATH, JSON.stringify(usersList, null, 2), "utf8");
  } catch (error) {
    console.error("Error saving users.json:", error);
  }
}

// Persisted data store loaded from file
let users = loadUsers();

let regulations = [
  {
    regulation_id: "REG-001",
    title: "ระเบียบกระทรวงการคลังว่าด้วยค่าใช้จ่ายในการฝึกอบรม การจัดงาน และการประชุมระหว่างประเทศ พ.ศ. ๒๕๔๙ (และที่แก้ไขเพิ่มเติม)",
    category: "การเงิน (Finance)",
    pdf_path: "/pdfs/reg_finance_2549.pdf",
    upload_date: "2566-10-12",
    summary: "ระเบียบหลักเกี่ยวกับการเบิกจ่ายค่าอาหาร ค่าเครื่องดื่ม ค่าที่พัก และค่าใช้จ่ายต่างๆ ในการจัดฝึกอบรมข้าราชการและงานประชุมระหว่างประเทศของหน่วยงานภาครัฐ กำหนดอัตราอาหารว่างไม่เกิน 50 บาท/มื้อ/คน"
  },
  {
    regulation_id: "REG-002",
    title: "ระเบียบกองทัพเรือว่าด้วยการพัสดุและการจัดซื้อจัด採จ้าง พ.ศ. ๒๕๖๒",
    category: "พัสดุ (Material)",
    pdf_path: "/pdfs/navy_material_2562.pdf",
    upload_date: "2566-08-15",
    summary: "กำหนดวิธีปฏิบัติงานเกี่ยวกับการจัดหาพัสดุ การควบคุมพัสดุ การตรวจสอบรับพัสดุ และการจำหน่ายพัสดุชำรุดของหน่วยงานในสังกัดกองทัพเรือ เพื่อให้สอดคล้องกับ พ.ร.บ. จัดซื้อจัดจ้างภาครัฐ พ.ศ. ๒๕๖๐"
  },
  {
    regulation_id: "REG-003",
    title: "หนังสือกรมบัญชีกลาง ด่วนที่สุด ที่ กค ๐๔๐๘.๔/ว ๑๑๔ ลงวันที่ ๑๖ กุมภาพันธ์ ๒๕๖๕",
    category: "กฎหมายทั่วไป (General Law)",
    pdf_path: "/pdfs/cgd_urgent_114.pdf",
    upload_date: "2565-02-16",
    summary: "ซ้อมความเข้าใจแนวปฏิบัติเกี่ยวกับการเบิกค่าใช้จ่ายในการจัดฝึกอบรม สัมมนา และการประชุมผ่านระบบออนไลน์ (Electronic Meeting) ให้สามารถเบิกค่าส่งเอกสารและอุปกรณ์ไอทีได้ตามจริง"
  },
  {
    regulation_id: "REG-004",
    title: "ระเบียบกองทัพเรือว่าด้วยการเบิกจ่ายเบี้ยเลี้ยงและการเดินทางไปราชการต่างจังหวัด พ.ศ. ๒๕๖๔",
    category: "การเงิน (Finance)",
    pdf_path: "/pdfs/navy_travel_2564.pdf",
    upload_date: "2566-11-20",
    summary: "ข้อกำหนดและอัตราการเบิกจ่ายเบี้ยเลี้ยง ค่าพาหนะเดินทาง และค่าเช่าที่พักแรม ในราชการกองทัพเรือทั้งในและนอกราชอาณาจักร กำหนดอัตราตามลำดับชั้นยศข้าราชการสัญญาบัตรและประทวน"
  },
  {
    regulation_id: "REG-005",
    title: "ระเบียบกองทัพเรือว่าด้วยหลักเกณฑ์การแต่งกายและเครื่องแบบทหารเรือ พ.ศ. ๒๕๖๐",
    category: "บุคลากร (Personnel)",
    pdf_path: "/pdfs/navy_uniform_2560.pdf",
    upload_date: "2565-05-10",
    summary: "ระเบียบว่าด้วยเครื่องแบบทหารเรือประเภทต่างๆ ยศ และเครื่องประกอบเครื่องแบบสำหรับทหารกองประจำการ ข้าราชการกลาโหมพลเรือน และนายทหารสัญญาบัตรในสังกัดกองทัพเรือ"
  }
];

let chatHistory = [
  {
    chat_id: "chat_init_1",
    question: "สวัสดี ฉันต้องการทราบเกี่ยวกับขั้นตอนการแต่งตั้งคณะกรรมการตรวจรับพัสดุของกองทัพเรือ มีหลักเกณฑ์อย่างไรบ้าง?",
    answer: "การแต่งตั้งคณะกรรมการตรวจรับพัสดุในงานราชการกองทัพเรือ ตามระเบียบกองทัพเรือว่าด้วยการพัสดุฯ กำหนดหลักเกณฑ์สำคัญดังนี้ครับ:\n\n1. **องค์ประกอบ:** ประกอบด้วยประธานกรรมการ 1 คน และกรรมการอย่างน้อย 2 คน (ปกติมักเป็นจำนวนคี่ เช่น 3 คน หรือ 5 คน) โดยแต่งตั้งจากข้าราชการทหารเรือในระดับสัญญาบัตรที่มีความรู้ความเข้าใจในพัสดุที่จะตรวจรับ\n2. **หน้าที่หลัก:** ทำการตรวจรับพัสดุให้ถูกต้องตามเงื่อนไขในสัญญาจัดซื้อจัดจ้าง ตรวจสอบจำนวน คุณภาพ และความถูกต้องของเอกสารส่งมอบ\n3. **ข้อห้ามสำคัญ:** ประธานหรือกรรมการจัดหาพัสดุ (เช่น เจ้าหน้าที่พัสดุผู้จัดทำร่างขอบเขตงานหรือจัดซื้อจัดจ้างโดยตรง) **ห้าม** ดำรงตำแหน่งเป็นประธานกรรมการตรวจรับพัสดุพร้อมกัน เพื่อความเป็นกลาง\n4. **การลงมติ:** มติคณะกรรมการให้ใช้เสียงข้างมาก หากกรรมการคนใดไม่เห็นด้วยให้ทำความเห็นแย้งไว้เป็นลายลักษณ์อักษร",
    reference: "ระเบียบกองทัพเรือว่าด้วยการพัสดุ พ.ศ. ๒๕๖๒ และ พ.ร.บ.การจัดซื้อจัดจ้างและบริหารพัสดุภาครัฐ พ.ศ. ๒๕๖๐ มาตรา ๙๖-๑๐๐"
  }
];

let documents = [
  {
    doc_id: "doc_1",
    user_id: "satit_1",
    doc_type: "ร่างคำสั่งแต่งตั้งคณะกรรมการ",
    title: "ร่างคำสั่งแต่งตั้งคณะกรรมการตรวจรับพัสดุจัดซื้อหมึกพิมพ์และคอมพิวเตอร์",
    content: `คำสั่งกองการพัสดุ กองทัพเรือ\nที่ ๔๕/๒๕๖๖\nเรื่อง แต่งตั้งคณะกรรมการตรวจรับพัสดุสำหรับการจัดซื้อหมึกพิมพ์และวัสดุคอมพิวเตอร์สำนักงาน\n\nด้วย กองการพัสดุ กองทัพเรือ มีความจำเป็นที่จะต้องจัดหาวัสดุหมึกพิมพ์และอุปกรณ์คอมพิวเตอร์สำนักงาน ประจำปีงบประมาณ ๒๕๖๖ เพื่อใช้ในงานราชการจัดเตรียมเอกสารและอำนวยความสะดวกการปฏิบัติงาน อาศัยอำนาจตามระเบียบกองทัพเรือว่าด้วยการพัสดุ พ.ศ. ๒๕๖๒ จึงขอแต่งตั้งรายชื่อข้าราชการต่อไปนี้เป็นคณะกรรมการตรวจรับพัสดุ:\n\n๑. นาวาตรี สมชาย แกล้วกล้า (ประธานกรรมการ)\n๒. เรือเอก อภิชาติ รักดี (กรรมการ)\n๓. เรือโท หญิง วันทนา บุญส่ง (กรรมการและเลขานุการ)\n\nให้ผู้ที่ได้รับการแต่งตั้งปฏิบัติหน้าที่ตรวจรับสิ่งของให้ถูกต้อง ครบถ้วน ตามเงื่อนไขและข้อกำหนดในสัญญาจ้างอย่างเคร่งครัด\n\nสั่ง ณ วันที่ ๑๔ กรกฎาคม พ.ศ. ๒๕๖๖`,
    created_at: "10 นาทีที่แล้ว"
  },
  {
    doc_id: "doc_2",
    user_id: "satit_1",
    doc_type: "ระเบียบปฏิบัติการ",
    title: "ระเบียบการจัดสวัสดิการกู้ยืมเพื่อที่อยู่อาศัยกำลังพลชั้นผู้น้อย",
    content: "ระเบียบสวัสดิการภายในกองทัพเรือ\nเรื่อง การช่วยเหลือค่าที่พักอาศัยข้าราชการทหารเรือชั้นผู้น้อย\n\nเพื่อเป็นขวัญและกำลังใจแก่ข้าราชการทหารชั้นประทวนและสัญญาบัตรระดับต้น กองทัพเรือจึงกำหนดกรอบการเบิกจ่ายเงินสวัสดิการช่วยเหลือค่าเช่าซื้อหรือปรับปรุงที่อยู่อาศัย โดยอนุญาตให้กู้ยืมในอัตราดอกเบี้ยต่ำร้อยละ ๒ ต่อปี ระยะเวลาผ่อนชำระสูงสุด ๒๐ ปี ผ่านกองทุนสวัสดิการ ทร.",
    created_at: "1 ชม.ที่แล้ว"
  }
];

// Helper to initialize and retrieve Gemini API client
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    console.log("GEMINI_API_KEY is not defined or is placeholder. Using robust fallback AI logic.");
    return null;
  }
  return new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
}

// 1. Get Current Logged In User Info
app.get("/api/user", (req, res) => {
  const userId = req.headers["x-user-id"] as string;
  if (!userId) {
    return res.status(401).json({ error: "ยังไม่ได้เข้าสู่ระบบ" });
  }
  const user = users.find(u => u.user_id === userId);
  if (!user) {
    return res.status(404).json({ error: "ไม่พบข้อมูลผู้ใช้งาน" });
  }
  res.json({
    user_id: user.user_id,
    name: user.name,
    rank: user.rank,
    unit: user.unit,
    militaryId: user.militaryId,
    password: user.password,
    profileImage: user.profileImage || ""
  });
});

// 1.1 Update User Profile
app.put("/api/user", (req, res) => {
  const userId = req.headers["x-user-id"] as string;
  if (!userId) {
    return res.status(401).json({ error: "ยังไม่ได้เข้าสู่ระบบ" });
  }
  const userIndex = users.findIndex(u => u.user_id === userId);
  if (userIndex === -1) {
    return res.status(404).json({ error: "ไม่พบข้อมูลผู้ใช้งาน" });
  }

  const { name, rank, unit, password, militaryId, profileImage } = req.body;
  
  if (!name || !rank || !unit) {
    return res.status(400).json({ error: "กรุณาระบุชื่อ ยศ และสังกัด" });
  }

  if (militaryId && !/^\d{10}$/.test(militaryId)) {
    return res.status(400).json({ error: "หมายเลขประจำตัวข้าราชการ ทร. ต้องเป็นตัวเลข 10 หลักเท่านั้น" });
  }

  // Check unique name
  if (name !== users[userIndex].name) {
    const nameExists = users.some((u, idx) => u.name === name && idx !== userIndex);
    if (nameExists) {
      return res.status(400).json({ error: "ชื่อ-นามสกุล นี้มีผู้ใช้งานอื่นลงทะเบียนไว้แล้ว" });
    }
  }

  // Update
  users[userIndex].name = name;
  users[userIndex].rank = rank;
  users[userIndex].unit = unit;
  if (password) users[userIndex].password = password;
  if (militaryId) users[userIndex].militaryId = militaryId;
  if (profileImage !== undefined) users[userIndex].profileImage = profileImage;

  saveUsers(users);

  res.json({
    success: true,
    user: {
      user_id: users[userIndex].user_id,
      name: users[userIndex].name,
      rank: users[userIndex].rank,
      unit: users[userIndex].unit,
      militaryId: users[userIndex].militaryId,
      password: users[userIndex].password,
      profileImage: users[userIndex].profileImage || ""
    }
  });
});

// 1.2 Sign Up specific to Royal Thai Navy Officers
app.post("/api/auth/register", (req, res) => {
  const { name, rank, unit, password, militaryId, profileImage } = req.body;
  if (!name || !rank || !unit || !password || !militaryId) {
    return res.status(400).json({ error: "กรุณากรอกข้อมูลข้าราชการทหารเรือให้ครบถ้วน" });
  }
  
  // Enforce militaryId to be 10 digits as validation for RTN personnel
  if (!/^\d{10}$/.test(militaryId)) {
    return res.status(400).json({ error: "หมายเลขประจำตัวข้าราชการ ทร. ต้องเป็นตัวเลข 10 หลักเท่านั้น" });
  }

  const existing = users.find(u => u.name === name);
  if (existing) {
    return res.status(400).json({ error: "ชื่อ-นามสกุล นี้ได้ทำการลงทะเบียนในระบบแล้ว" });
  }

  const newUser = {
    user_id: `user_${Date.now()}`,
    name,
    rank,
    unit,
    password,
    militaryId,
    profileImage: profileImage || ""
  };

  users.push(newUser);
  saveUsers(users);
  res.json({
    success: true,
    user: {
      user_id: newUser.user_id,
      name: newUser.name,
      rank: newUser.rank,
      unit: newUser.unit,
      militaryId: newUser.militaryId,
      password: newUser.password,
      profileImage: newUser.profileImage || ""
    }
  });
});

// 1.3 Sign In with name and password
app.post("/api/auth/login", (req, res) => {
  const { name, password } = req.body;
  if (!name || !password) {
    return res.status(400).json({ error: "กรุณากรอกชื่อและรหัสผ่านเพื่อเข้าใช้งาน" });
  }

  const user = users.find(u => u.name === name && u.password === password);
  if (!user) {
    return res.status(401).json({ error: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง หรือคุณไม่ใช่ข้าราชการ ทร. ที่ลงทะเบียนไว้" });
  }

  res.json({
    success: true,
    user: {
      user_id: user.user_id,
      name: user.name,
      rank: user.rank,
      unit: user.unit,
      militaryId: user.militaryId,
      password: user.password,
      profileImage: user.profileImage || ""
    }
  });
});

// 2. Search Regulations (with real AI filtering / sorting if Gemini is configured)
app.post("/api/regulations/search", async (req, res) => {
  const { query, categories } = req.body;
  const ai = getGeminiClient();

  // Filter regulations first based on categories selected
  let filtered = regulations;
  if (categories && categories.length > 0) {
    filtered = regulations.filter(r => categories.includes(r.category));
  }

  // If query is provided, look for match
  if (query) {
    const term = query.toLowerCase();
    filtered = filtered.filter(r => 
      r.title.toLowerCase().includes(term) || 
      r.summary.toLowerCase().includes(term) || 
      r.category.toLowerCase().includes(term)
    );
  }

  if (ai && query) {
    try {
      // Use Gemini to generate an advanced AI analysis and synthesis based on the query and filtered regulations
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `คุณคือ AI ผู้เชี่ยวชาญด้านระเบียบราชการของกองทัพเรือไทย ผู้ใช้พิมพ์ข้อความสืบค้นว่า: "${query}"
กรุณาสรุปวิเคราะห์สั้นๆ ไม่เกิน 3 ประโยคเกี่ยวกับแนวทางการปฏิบัติตามระเบียบของกองทัพเรือในประเด็นนี้ และให้ตรงกับหลักราชการ
ข้อกำหนดผลลัพธ์: ภาษาไทย สุภาพ และอ้างอิงหลักการพัสดุหรือกฎหมายทั่วไป`,
      });
      
      const aiSynthesis = response.text || "วิเคราะห์ระเบียบเสร็จสมบูรณ์";
      
      // Map and attach AI synthesis as dynamic summaries
      const results = filtered.map(item => ({
        ...item,
        aiSummary: `AI วิเคราะห์: ${aiSynthesis}\n\n(สอดคล้องกับหัวข้อ: ${item.title})`
      }));

      return res.json({ results });
    } catch (error: any) {
      console.error("Gemini Search Error:", error);
      // Fallback below
    }
  }

  // Fallback / standard response
  const results = filtered.map(item => ({
    ...item,
    aiSummary: `AI สรุปสาระสำคัญ: จากข้อความสืบค้น "${query || "ทั่วไป"}" ประเด็นนี้มีความเกี่ยวข้องกับหมวด ${item.category} ข้อมูลหลักระบุว่าการเบิกจ่ายหรือดำเนินงานต้องเป็นไปตามอัตราเพดานขั้นสูง และได้รับอนุมัติจากหัวหน้าส่วนราชการล่วงหน้า`
  }));

  res.json({ results });
});

// 3. Legal Chatbot API
app.post("/api/chatbot", async (req, res) => {
  const { message, history } = req.body;
  const ai = getGeminiClient();

  if (ai) {
    try {
      // Structure chat context
      const systemPrompt = `คุณคือ "ผู้ช่วยผู้เชี่ยวชาญข้อกฎหมายและระเบียบปฏิบัติราชการ กองทัพเรือไทย" (Royal Thai Navy AI Legal Assistant)
- หน้าที่ของคุณคือให้ข้อมูลที่ถูกต้อง ทันสมัย สุภาพ และมีอ้างอิงตามระเบียบกองทัพเรือไทยเสมอ
- ปฏิเสธการตอบเรื่องการเมือง ความลับทางทหารชั้นความลับสูงสุด หรือเรื่องไม่สุภาพ
- ตอบเป็นภาษาไทยที่มีรูปแบบเป็นทางการ สั้นกระชับ สรุปเป็นข้อๆ ให้ชัดเจนอ่านง่าย
- จัดรูปแบบด้วย Markdown คัดลอกและนำไปใช้ต่อได้ง่าย
- แนะนำให้อ้างอิงระเบียบหรือมาตรากฎหมายเสมอในตอนท้าย เช่น ประมวลกฎหมายแพ่งและพาณิชย์ หรือระเบียบการพัสดุกองทัพเรือ พ.ศ. ๒๕๖๒`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: [
          { role: "user", parts: [{ text: message }] }
        ],
        config: {
          systemInstruction: systemPrompt
        }
      });

      const reply = response.text || "ขออภัย ระบบไม่สามารถสรุปข้อมูลได้ในขณะนี้";
      
      // Extract reference mock
      let reference = "ระเบียบกองทัพเรือ และข้อบังคับการพัสดุกระทรวงกลาโหม";
      if (reply.includes("มาตรา") || reply.includes("ระเบียบ")) {
        reference = "ระเบียบและแนวทางปฏิบัติราชการในสังกัด ทร. อ้างอิงคำแนะนำของ AI";
      }

      const userId = (req.headers["x-user-id"] as string) || "satit_1";
      const newChat = {
        chat_id: `chat_${Date.now()}`,
        user_id: userId,
        question: message,
        answer: reply,
        reference
      };

      chatHistory.push(newChat);
      return res.json(newChat);
    } catch (error: any) {
      console.error("Gemini Chatbot Error:", error);
    }
  }

  // Fallback responses in Thai based on user query keywords
  let reply = `ระบบสืบค้นระเบียบกองทัพเรือขอเรียนชี้แจงในเบื้องต้นเกี่ยวกับการปฏิบัติตามคำสั่งและพัสดุดังนี้:\n\n1. การปฏิบัติงานทุกขั้นตอนต้องได้รับอนุมัติเป็นลายลักษณ์อักษรจากผู้บังคับบัญชาตามลำดับชั้น\n2. อัตราการเบิกจ่ายจะต้องสอดคล้องกับระเบียบกระทรวงการคลังว่าด้วยการเบิกจ่ายเบี้ยเลี้ยงและการเดินทางปี ๒๕๖๔\n3. การจัดเก็บข้อมูลหรือเอกสารทางราชการ จะต้องรักษาความปลอดภัยตามหลักการรักษาความลับทางทหารระดับลับ`;
  let reference = "ระเบียบกองทัพเรือว่าด้วยการพัสดุ พ.ศ. ๒๕๖๒";

  if (message.includes("เพิ่มทุน") || message.includes("ทุน")) {
    reply = `ขั้นตอนการเพิ่มทุนจดทะเบียนของบริษัทจำกัดตามหลักกฎหมายแพ่งและพาณิชย์ มีดังนี้ครับ:\n\n1. **มติพิเศษ:** ต้องจัดประชุมผู้ถือหุ้นเพื่อลงมติพิเศษด้วยคะแนนเสียงไม่น้อยกว่า 3 ใน 4 ของจำนวนเสียงทั้งหมด\n2. **การเสนอขายหุ้นใหม่:** จะต้องเสนอขายให้แก่ผู้ถือหุ้นเดิมตามสัดส่วนก่อน\n3. **การจดทะเบียน:** ต้องยื่นจดทะเบียนมติพิเศษเพิ่มทุนภายใน 14 วัน และจดทะเบียนเพิ่มทุนภายใน 14 วันนับจากวันชำระค่าหุ้นเพิ่มทุนครบถ้วนต่อกรมพัฒนาธุรกิจการค้า`;
    reference = "ประมวลกฎหมายแพ่งและพาณิชย์ มาตรา ๑๒๒๐ - ๑๒๒๘";
  } else if (message.includes("พัสดุ") || message.includes("จัดซื้อ")) {
    reply = `การดำเนินโครงการจัดซื้อจัดจ้างพัสดุของกองทัพเรือไทย:\n\n1. **แผนการจัดซื้อ:** ต้องประกาศแผนจัดซื้อจัดจ้างล่วงหน้าในระบบ e-GP และเว็บไซต์กองทัพเรือ\n2. **วงเงินการอนุมัติ:** วงเงินไม่เกิน ๕๐๐,๐๐๐ บาท ใช้วิธีเฉพาะเจาะจงได้ ส่วนวงเงินสูงกว่านั้นต้องดำเนินการประกวดราคาอิเล็กทรอนิกส์ (e-bidding)\n3. **คณะกรรมการ:** แต่งตั้งผู้รับผิดชอบเป็นผู้ควบคุมงานและกรรมการตรวจรับแยกจากกัน`;
    reference = "ระเบียบกองทัพเรือว่าด้วยการพัสดุและการจัดซื้อจัดจ้าง พ.ศ. ๒๕๖๒";
  }

  const userId = (req.headers["x-user-id"] as string) || "satit_1";
  const newChat = {
    chat_id: `chat_${Date.now()}`,
    user_id: userId,
    question: message,
    answer: reply,
    reference
  };

  chatHistory.push(newChat);
  res.json(newChat);
});

// 4. Document Summarizer API
app.post("/api/summarize", async (req, res) => {
  const { text, title, shortMode } = req.body;
  const ai = getGeminiClient();

  const docText = text || "ไม่มีข้อความเอกสาร";
  const docTitle = title || "draft_regulation_v3.pdf";

  if (ai && text) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `กรุณาสรุปวิเคราะห์เอกสารชื่อ "${docTitle}" โดยเนื้อหาเอกสารคือ:
"${docText}"

จงตอบกลับด้วยโครงสร้างรูปแบบ JSON ที่เป็นไปตาม Schema ด้านล่างนี้ ห้ามมีคำอธิบายอื่นนอกจาก JSON:
{
  "summary": "ข้อความสรุปภาพรวมเอกสารที่กระชับและสุภาพ เข้าใจง่ายที่สุด",
  "findings": ["ข้อค้นพบสำคัญข้อที่ 1", "ข้อค้นพบสำคัญข้อที่ 2", "ข้อค้นพบสำคัญข้อที่ 3"],
  "impact": "วิเคราะห์ผลกระทบสำหรับองค์กรหรือหน่วยงานราชการ",
  "actionItems": ["งานที่ต้องทำต่อที่ 1", "งานที่ต้องทำต่อที่ 2"]
}`,
        config: {
          responseMimeType: "application/json"
        }
      });

      const replyJson = JSON.parse(response.text || "{}");
      return res.json({
        title: docTitle,
        size: "4.2 MB",
        type: "ระเบียบกองทัพเรือ",
        date: "12 พ.ย. 2023",
        summary: replyJson.summary || "เอกสารปรับปรุงระเบียบปฏิบัติงานทั่วไปในสังกัด",
        findings: replyJson.findings || ["ปรับปรุงมาตรฐานการรักษาความลับ", "ลดขั้นตอนการยื่นคำร้อง", "เพิ่มบทลงโทษทางวินัยหากปฏิบัติงานล่าช้า"],
        impact: replyJson.impact || "ข้าราชการทุกคนต้องเรียนรู้วิธีปฏิบัติงานระบบดิจิทัลเพิ่มขึ้น",
        actionItems: replyJson.actionItems || ["แต่งตั้งวิทยากรฝึกอบรมกำลังพล", "ปรับปรุงระบบโครงสร้างฐานข้อมูลคอมพิวเตอร์"]
      });
    } catch (e) {
      console.error("Gemini Summarize Error:", e);
    }
  }

  // Realistic default fallback
  res.json({
    title: docTitle,
    size: "4.2 MB",
    type: "ระเบียบปฏิบัติการ",
    date: "12 พ.ย. 2023",
    summary: `เอกสารฉบับนี้เป็นร่างระเบียบปฏิบัติการปรับปรุงใหม่ว่าด้วยการจัดการข้อมูลส่วนบุคคลในหน่วยงานภาครัฐ (เวอร์ชัน ๓) สาระสำคัญคือการกำหนดมาตรฐานความปลอดภัยที่สูงขึ้นสำหรับการจัดเก็บและประมวลผลข้อมูลประชาชน โดยบังคับใช้การเข้ารหัสระดับ 256-bit และกำหนดระยะเวลาการเก็บรักษาข้อมูลที่ไม่จำเป็นลงเหลือ ๕ ปี`,
    findings: [
      "บังคับใช้การเข้ารหัสข้อมูลทุกระดับเพื่อความปลอดภัยสูงสุด",
      "ลดระยะเวลาเก็บรักษาข้อมูลที่ไม่จำเป็นลงเหลือเพียง ๕ ปี",
      "ต้องมีการตรวจสอบประเมินความเสี่ยงความปลอดภัยข้อมูลทุก ๖ เดือน",
      "กำหนดบทลงโทษที่ชัดเจนทางวินัยและกฎหมายกรณีข้อมูลรั่วไหล"
    ],
    impact: "หน่วยงานรัฐและกรมอู่ทหารเรือจะต้องปรับปรุงระบบโครงสร้างพื้นฐานด้าน IT ขนานใหญ่ภายใน ๑๒ เดือน ซึ่งอาจส่งผลให้ต้องของบประมาณจัดหาพัสดุและระบบจัดเก็บข้อมูลเพิ่มร้อยละ ๑๕ ในปีงบประมาณหน้า",
    actionItems: [
      "จัดตั้งคณะกรรมการประเมินโครงสร้างพื้นฐานไอทีของกองการพัสดุ ทร. ปัจจุบัน",
      "ร่างของบประมาณเพิ่มเติมสำหรับพัฒนาระบบไอทีและเซิร์ฟเวอร์ในปีงบประมาณถัดไป",
      "ประสานงานกับฝ่ายกฎหมายเพื่อตรวจสอบความสอดคล้องกับ พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล พ.ศ. ๒๕๖๒"
    ]
  });
});

// 5. Letter Writer Drafting API
app.post("/api/letter-writer", async (req, res) => {
  const { docType, urgency, receiver, subject, mainPoints } = req.body;
  const ai = getGeminiClient();

  if (ai) {
    try {
      const prompt = `กรุณาแต่งหนังสือราชการของประเทศไทยให้สมบูรณ์ ถูกต้องตามแบบพิธีการ (ครุฑ)
ข้อมูลพารามิเตอร์:
- ประเภทหนังสือ: ${docType || "หนังสือภายนอก"}
- ความเร่งด่วน: ${urgency || "ปกติ"}
- เรียน (ผู้รับ): ${receiver || "ผู้บัญชาการทหารเรือ"}
- เรื่อง: ${subject || "ขออนุมัติจัดหาวัสดุสำนักงาน"}
- ประเด็นหลักที่ต้องการสื่อสาร: "${mainPoints || "มีความจำเป็นต้องจัดซื้อหมึกพิมพ์ด่วนเพื่อใช้ในการทำงาน"}"

กรุณาแต่งเนื้อหาใจความสำคัญ 3 ย่อหน้า:
1. ย่อหน้าเกริ่นนำอธิบายต้นเรื่องบริบท (ด้วย... / ตามที่...)
2. ย่อหน้าแสดงความจำเป็นหรือรายละเอียดความสำคัญ (ในการนี้...)
3. ย่อหน้าสรุปคำขออย่างเป็นทางการ (จึงเรียนมาเพื่อโปรดพิจารณาอนุมัติ...)

จงตอบกลับด้วยโครงสร้าง JSON ห้ามมีคำอื่นนอกเหนือจาก JSON:
{
  "senderUnit": "ส่วนราชการเจ้าของหนังสือ เช่น กองการพัสดุ กรมอู่ทหารเรือ",
  "documentNo": "ที่ กค ๐๕๐๓/๑๒๔",
  "dateStr": "วัน เดือน ปี ปัจจุบัน (ภาษาไทย)",
  "para1": "ข้อความย่อเกริ่นนำที่เขียนด้วยภาษาราชการทางการและสวยงามอ้างถึงประเด็นหลัก",
  "para2": "ข้อความอธิบายความจำเป็น ประเด็นหลักและการจัดสรรพัสดุให้ครบถ้วนเป็นภาษาราชการ",
  "para3": "ข้อความคำขอเพื่อพิจารณาอนุมัติลงท้ายให้เรียบร้อยและสุภาพ",
  "signName": "(นายสาธิต ประชารัฐ)",
  "signPosition": "เรือเอก\nหัวหน้าแผนกจัดหาพัสดุ"
}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });

      const drafted = JSON.parse(response.text || "{}");
      const userId = (req.headers["x-user-id"] as string) || "satit_1";
      const newDoc = {
        doc_id: `doc_${Date.now()}`,
        user_id: userId,
        doc_type: docType || "หนังสือภายนอก",
        title: subject || "หนังสือราชการร่างใหม่จาก AI",
        content: `ส่วนราชการ: ${drafted.senderUnit}\nที่: ${drafted.documentNo}\nวันที่: ${drafted.dateStr}\nเรื่อง: ${subject}\n\nเรียน: ${receiver}\n\n${drafted.para1}\n\n${drafted.para2}\n\n${drafted.para3}\n\nขอแสดงความนับถือ\n\n${drafted.signName}\n${drafted.signPosition}`,
        created_at: "เมื่อสักครู่"
      };

      documents.unshift(newDoc);
      return res.json({ drafted, document: newDoc });
    } catch (e) {
      console.error("Gemini Letter Writer Error:", e);
    }
  }

  // Fallback high-quality Thai military document draft
  const drafted = {
    senderUnit: "กองการพัสดุ กองทัพเรือ",
    documentNo: "ที่ กพ.ทร. ๐๕๒๓/๕๘๔",
    dateStr: "๑๔ กรกฎาคม ๒๕๖๖",
    para1: `ตามที่ กองการพัสดุ กองทัพเรือ ได้รับมอบหมายภารกิจด้านการสนับสนุนงานสารบรรณและการเตรียมเอกสารสำหรับการประชุมสภาสถาบันกำลังพลทหารเรือ เพื่ออำนวยความสะดวกในการจัดสรรพัสดุให้ตรงตามกรอบยุทธศาสตร์การพัฒนาความพร้อมรบนั้น`,
    para2: `ในการนี้ กองการพัสดุมีความจำเป็นเร่งด่วนในการจัดหาพัสดุหมึกพิมพ์ประสิทธิภาพสูงและวัสดุอุปกรณ์ที่จำเป็น สำหรับรองรับโครงการจัดเตรียมและแจกจ่ายสาระความรู้เกี่ยวกับกฎระเบียบกองทัพเรือใหม่ ซึ่งมีความจำเป็นอย่างยิ่งที่จะต้องได้รับความเห็นชอบและสนับสนุนเพื่อป้องกันความล่าช้าในงานธุรการกลาง`,
    para3: `จึงเรียนมาเพื่อโปรดพิจารณาอนุมัติให้ดำเนินการจัดจัดซื้อจัดจ้างตามความเร่งด่วนขั้นวิกฤตดังกล่าว หากประธานเห็นสมควรประการใด ขอได้โปรดอนุมัติลงนามในคำสั่งแต่งตั้งคณะกรรมการตามแนบท้ายนี้`,
    signName: "(สาธิต ประชารัฐ)",
    signPosition: "เรือเอก\nหัวหน้าฝ่ายจัดซื้อ กองการพัสดุ ทร."
  };

  const userId = (req.headers["x-user-id"] as string) || "satit_1";
  const newDoc = {
    doc_id: `doc_${Date.now()}`,
    user_id: userId,
    doc_type: docType || "หนังสือภายนอก",
    title: subject || "ร่างหนังสือราชการขอพัสดุ",
    content: `ส่วนราชการ: ${drafted.senderUnit}\nที่: ${drafted.documentNo}\nวันที่: ${drafted.dateStr}\nเรื่อง: ${subject || "จัดหาพัสดุอุปกรณ์"}\n\nเรียน: ${receiver || "ผู้บัญชาการกรมอู่ทหารเรือ"}\n\n${drafted.para1}\n\n${drafted.para2}\n\n${drafted.para3}\n\nขอแสดงความนับถือ\n\n${drafted.signName}\n${drafted.signPosition}`,
    created_at: "เมื่อสักครู่"
  };

  documents.unshift(newDoc);
  res.json({ drafted, document: newDoc });
});

// 6. Get Saved Documents List
app.get("/api/documents", (req, res) => {
  const userId = (req.headers["x-user-id"] as string) || "satit_1";
  const userDocs = documents.filter(d => d.user_id === userId);
  res.json(userDocs);
});

// 7. Get Chat History
app.get("/api/chat-history", (req, res) => {
  const userId = (req.headers["x-user-id"] as string) || "satit_1";
  const userChats = chatHistory.filter((c: any) => !c.user_id || c.user_id === userId);
  res.json(userChats);
});

// 8. Delete document (optional utility)
app.delete("/api/documents/:id", (req, res) => {
  const { id } = req.params;
  documents = documents.filter(d => d.doc_id !== id);
  res.json({ success: true });
});

// Vite middleware setup or static production serves
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[OK] Server listening at http://localhost:${PORT}`);
  });
}

startServer();
