
import { KnowledgeSnippet } from '../types';

export const KNOWLEDGE_LIBRARY: KnowledgeSnippet[] = [
  {
    id: 'nvc-core',
    title: 'Non-Violent Communication (NVC)',
    tags: ['conflict', 'relationship', 'feelings', 'empathy', 'general'],
    content: `
      NVC Framework:
      1. Observation: State the facts without judgment ("When I see socks on the floor...").
      2. Feeling: Express emotion ("I feel frustrated...").
      3. Need: Connect to a value ("...because I need order in the house.").
      4. Request: Ask for a specific action ("Would you be willing to put them in the hamper?").
      Avoid words that imply wrongness (lazy, messy, rude).
    `
  },
  {
    id: 'dear-man',
    title: 'DEAR MAN (DBT Skill)',
    tags: ['request', 'work', 'negotiation', 'assertiveness', 'boundary'],
    content: `
      DEAR MAN for getting what you want:
      - Describe: Stick to facts.
      - Express: Use "I" statements for feelings.
      - Assert: Ask clearly. Don't hint.
      - Reinforce: Explain why it benefits the other person.
      - Mindful: Don't get distracted. Broken record technique.
      - Appear Confident: Eye contact, steady voice.
      - Negotiate: Be willing to give to get.
    `
  },
  {
    id: 'fbi-negotiation',
    title: 'Tactical Empathy (Chris Voss)',
    tags: ['negotiation', 'work', 'conflict', 'interview'],
    content: `
      - Mirroring: Repeat the last 3 words the person said as a question.
      - Labeling: "It seems like you're upset about X." (Don't use "I think").
      - Calibrated Questions: "How am I supposed to do that?" instead of "No".
      - Late Night DJ Voice: Deep, calm, slow downward inflection to soothe.
    `
  },
  {
    id: 'star-method',
    title: 'STAR Method',
    tags: ['interview', 'work', 'career'],
    content: `
      For answering behavioral interview questions:
      - Situation: Set the scene.
      - Task: What was the challenge?
      - Action: What specifically did YOU do?
      - Result: What was the outcome? (Use numbers/metrics if possible).
    `
  },
  {
    id: 'active-listening',
    title: 'Active Listening',
    tags: ['general', 'relationship', 'dating', 'social'],
    content: `
      - Paraphrasing: "What I'm hearing is..."
      - Validation: "It makes sense you feel that way because..."
      - Open-ended questions: Who, what, where, how (avoid Why, it sounds accusatory).
      - Silence: Allow pauses for the other person to think.
    `
  },
  {
    id: 'boundary-setting',
    title: 'Setting Boundaries',
    tags: ['boundaries', 'relationship', 'work', 'family'],
    content: `
      - The "Sandwich" is outdated. Be direct.
      - "I am not comfortable with X."
      - "I can do X, but I cannot do Y."
      - "If this continues, I will have to leave the conversation."
      - Boundaries are about what YOU will do, not controlling the other person.
    `
  },
  {
    id: 'cognitive-reframing',
    title: 'Cognitive Reframing (CBT)',
    tags: ['anxiety', 'confidence', 'self-talk'],
    content: `
      - Identify the distortion: (e.g., Catastrophizing, Mind Reading).
      - Challenge it: "Do I have evidence for this?"
      - Reframe: "This is a challenge, not a disaster."
      - Replace "I should" with "I would prefer".
    `
  }
];
