
import { Agent, Scenario, Language } from './types';

// Deprecated: Use KnowledgeService instead
export const KNOWLEDGE_BASE = ''; 

export const TRANSLATIONS = {
  en: {
    app_name: "Luna",
    app_subtitle: "Your personal AI communication coach.",
    sign_in: "Sign in to continue",
    sign_in_google: "Sign in with Google",
    terms: "By continuing, you agree to our Terms of Service and Privacy Policy.",
    session: "Session",
    gathering_insights: "Gathering Insights",
    insights_ready: "Insights Ready",
    anything_luna_know: "Anything Luna should know?",
    call_subtext: "Call to strengthen your communication skills with Luna",
    select_focus: "Select a Focus (Optional)",
    custom_goal_placeholder: "Add a specific goal (e.g., 'I want to work on my tone')...",
    custom_goal_context_placeholder: "Add details for ",
    live_session_active: "Live Session Active",
    generating_report: "Generating Post-Session Report...",
    tap_mic_general: "Ready to practice? Tap the microphone below.",
    tap_mic_context: "Tap mic to start session with your selected context.",
    researching: "Researching Strategy...",
    scanning_db: "Scanning psychology database",
    connecting: "Connecting to Luna...",
    tap_end: "Tap to end session",
    tap_start: "Tap to start coaching",
    choose_partner: "Choose your Partner",
    nav_call: "Call 'Luna'",
    nav_recs: "Recommendations",
    nav_profile: "My Profile",
    nav_context: "Files & Context",
    nav_logout: "Sign out",
    not_signed_in: "Not signed in",
    context_hub_title: "Knowledge Assets",
    context_hub_desc: "Upload text, resumes, or scripts. Luna will memorize active assets for your calls.",
    add_asset: "Add New Asset",
    paste_content: "Paste content here (Resume, Script, Email draft)...",
    asset_name: "Asset Name (e.g., My Resume)",
    save_asset: "Save Asset",
    active_assets: "Active Memory",
    no_assets: "No assets yet. Add a resume or script to get specific feedback."
  },
  th: {
    app_name: "ลูน่า",
    app_subtitle: "โค้ชสื่อสาร AI ส่วนตัวของคุณ",
    sign_in: "เข้าสู่ระบบเพื่อดำเนินการต่อ",
    sign_in_google: "เข้าสู่ระบบด้วย Google",
    terms: "การดำเนินการต่อถือว่าคุณยอมรับข้อกำหนดการใช้งานและนโยบายความเป็นส่วนตัว",
    session: "เซสชัน",
    gathering_insights: "กำลังรวบรวมข้อมูลเชิงลึก",
    insights_ready: "ข้อมูลเชิงลึกพร้อมแล้ว",
    anything_luna_know: "มีอะไรอยากบอกลูน่าไหม?",
    call_subtext: "โทรเพื่อฝึกทักษะการสื่อสารกับลูน่า",
    select_focus: "เลือกหัวข้อที่เน้น (ไม่บังคับ)",
    custom_goal_placeholder: "เพิ่มเป้าหมายเฉพาะ (เช่น 'ฉันอยากปรับน้ำเสียง')...",
    custom_goal_context_placeholder: "เพิ่มรายละเอียดสำหรับ ",
    live_session_active: "กำลังสนทนาสด",
    generating_report: "กำลังสร้างรายงานหลังจบเซสชัน...",
    tap_mic_general: "พร้อมฝึกหรือยัง? แตะไมโครโฟนด้านล่าง",
    tap_mic_context: "แตะไมโครโฟนเพื่อเริ่มเซสชันตามบริบทที่เลือก",
    researching: "กำลังค้นหากลยุทธ์...",
    scanning_db: "กำลังสแกนฐานข้อมูลจิตวิทยา",
    connecting: "กำลังเชื่อมต่อกับลูน่า...",
    tap_end: "แตะเพื่อจบเซสชัน",
    tap_start: "แตะเพื่อเริ่มการโค้ช",
    choose_partner: "เลือกคู่สนทนาของคุณ",
    nav_call: "โทรหา 'ลูน่า'",
    nav_recs: "คำแนะนำ",
    nav_profile: "โปรไฟล์ของฉัน",
    nav_context: "ไฟล์และบริบท",
    nav_logout: "ออกจากระบบ",
    not_signed_in: "ยังไม่ได้เข้าสู่ระบบ",
    context_hub_title: "คลังความรู้",
    context_hub_desc: "อัปโหลดข้อความ เรซูเม่ หรือสคริปต์ ลูน่าจะจดจำข้อมูลที่เลือกไว้สำหรับการสนทนา",
    add_asset: "เพิ่มข้อมูลใหม่",
    paste_content: "วางเนื้อหาที่นี่ (เรซูเม่, สคริปต์, ร่างอีเมล)...",
    asset_name: "ชื่อข้อมูล (เช่น เรซูเม่ของฉัน)",
    save_asset: "บันทึก",
    active_assets: "ความจำที่ใช้งานอยู่",
    no_assets: "ยังไม่มีข้อมูล เพิ่มเรซูเม่หรือสคริปต์เพื่อรับคำแนะนำที่ตรงจุด"
  }
};

export const AGENTS: Agent[] = [
  {
    id: 'luna',
    name: 'Luna',
    role: 'Your Personal Coach',
    description: 'Balanced, warm, and insightful. Best for general improvement.',
    voiceName: 'Zephyr',
    stylePrompt: 'You are Luna, a warm and balanced communication coach. You focus on clarity and emotional intelligence. Your tone is calm and encouraging, but you are not afraid to offer constructive corrections.',
    hiddenDirectives: [
      'Maintain a 50/50 speaking balance.',
      'If the user is unclear, ask clarifying questions immediately.',
      'Summarize the users point before offering advice.'
    ],
    evaluationCriteria: ['Clarity', 'Balanced Tone', 'Structure'],
    color: 'from-teal-400 to-emerald-500'
  },
  {
    id: 'marcus',
    name: 'Marcus',
    role: 'Executive Challenger',
    description: 'Direct, firm, and demanding. Best for interviews and negotiation.',
    voiceName: 'Fenrir',
    stylePrompt: 'You are Marcus, a high-stakes executive coach. You are direct, firm, and no-nonsense. You believe pressure creates diamonds. You do not tolerate vague language, filler words, or unnecessary apologies.',
    hiddenDirectives: [
      'Interrupt the user if they ramble for more than 15 seconds.',
      'Call out every unnecessary apology immediately.',
      'Force the user to rephrase sentences to be shorter.',
      'Use short, punchy sentences. No fluff.'
    ],
    evaluationCriteria: ['Brevity', 'Assertiveness', 'Power Dynamics'],
    color: 'from-orange-400 to-red-500'
  },
  {
    id: 'sarah',
    name: 'Sarah',
    role: 'Empathetic Friend',
    description: 'Gentle, patient, and safe. Best for anxiety and difficult feelings.',
    voiceName: 'Kore',
    stylePrompt: 'You are Sarah, a gentle and supportive confidant. You prioritize the user\'s feelings and psychological safety. You speak softly and validate them frequently. Your goal is to make them feel heard before fixing anything.',
    hiddenDirectives: [
      'Never interrupt the user.',
      'Always validate the emotion ("It makes sense you feel...") before giving advice.',
      'Use pauses to let the user reflect.',
      'Focus on "I" statements and internal feelings.'
    ],
    evaluationCriteria: ['Vulnerability', 'Self-Awareness', 'Emotional Vocabulary'],
    color: 'from-blue-400 to-indigo-500'
  }
];

export const SYSTEM_INSTRUCTION_BASE = `
Your job:
- Hold natural voice conversations with the user.
- Read the provided RAG context and use it only when relevant.
- **IF VIDEO IS AVAILABLE**: Observe the user's non-verbal cues.
- Give short, spoken tips users can apply immediately.
- Offer improved versions of what the user wants to say.
- Maintain the specific PERSONA and TONE requested in the context.

Strict rules:
- Never diagnose or label the user.
- Never provide therapy or crisis advice.
- Never read long passages from context.
- Keep your whole reply under 4 sentences.
`;

export const SCENARIOS: Scenario[] = [
  { 
    id: 'general', 
    label: 'General Coaching', 
    prompt: "I'd like to practice general communication skills." 
  },
  { 
    id: 'work', 
    label: 'Work Conflict', 
    prompt: "I need help resolving a conflict with a coworker or boss. Help me remain professional but firm." 
  },
  { 
    id: 'relationship', 
    label: 'Relationships', 
    prompt: "I want to discuss relationship boundaries and expressing feelings without blaming." 
  },
  { 
    id: 'interview', 
    label: 'Job Interview', 
    prompt: "I have a job interview coming up. Help me sound confident and clear." 
  },
];

// Helper to get text based on language
export const getTranslation = (lang: Language, key: keyof typeof TRANSLATIONS['en']) => {
  return TRANSLATIONS[lang][key] || TRANSLATIONS['en'][key];
};

// Helper to localize Agents
export const getLocalizedAgents = (lang: Language): Agent[] => {
  if (lang === 'en') return AGENTS;
  
  // Thai Localizations
  const thAgents: Partial<Record<string, Partial<Agent>>> = {
    luna: { name: 'ลูน่า', role: 'โค้ชส่วนตัวของคุณ', description: 'สมดุล อบอุ่น และลึกซึ้ง เหมาะสำหรับการพัฒนาทั่วไป' },
    marcus: { name: 'มาร์คัส', role: 'ผู้ท้าชิงระดับผู้บริหาร', description: 'ตรงไปตรงมา หนักแน่น และเรียกร้อง เหมาะสำหรับการสัมภาษณ์และการเจรจาต่อรอง' },
    sarah: { name: 'ซาร่า', role: 'เพื่อนที่เข้าใจ', description: 'อ่อนโยน อดทน และปลอดภัย เหมาะสำหรับความวิตกกังวลและความรู้สึกที่ยากลำบาก' }
  };

  return AGENTS.map(agent => ({
    ...agent,
    ...thAgents[agent.id]
  }));
};

// Helper to localize Scenarios
export const getLocalizedScenarios = (lang: Language): Scenario[] => {
  if (lang === 'en') return SCENARIOS;

  const thScenarios: Record<string, string> = {
    general: 'การโค้ชทั่วไป',
    work: 'ความขัดแย้งในที่ทำงาน',
    relationship: 'ความสัมพันธ์',
    interview: 'การสัมภาษณ์งาน'
  };

  return SCENARIOS.map(s => ({
    ...s,
    label: thScenarios[s.id] || s.label
  }));
};
