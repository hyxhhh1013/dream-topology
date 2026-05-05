import { OpenAI } from 'openai';
import { config } from '../src/lib/config';

const openai = new OpenAI({
  apiKey: config.OPENAI_API_KEY,
  baseURL: config.OPENAI_BASE_URL,
});

const SYSTEM_PROMPT = `
你是一位专业的荣格与弗洛伊德流派心理分析师、梦境解析专家。
你的任务是从用户提供的梦境描述中，提取出核心的"梦境符号"（包括物体、动作、人物、环境等），并进行深度心理学原型的解构。

请严格以 JSON 格式返回结果，包含一个 "symbols" 数组。每个符号包含以下字段：
- "name": 符号名称（如："坠落"、"考试"、"无面人"、"蛇"、"火"）
- "category": 符号分类（可选值：物体 Object、动作 Action、人物 Character、环境 Environment）
- "archetype_meaning": 经典心理学原型释义。请给出非常详细、专业且深刻的长篇分析（约 150-300 字），基于荣格或弗洛伊德理论，解释该符号代表的深层潜意识机制（例如：阴影、阿尼玛、自性、俄狄浦斯情结等）。请不要吝啬字数，尽可能展开论述该符号在心理动力学上的意义，以及它如何与梦者的现实境遇产生联结。
- "culture_tag": 文化或普遍心理标签（如："现代社会焦虑"、"集体潜意识恐惧"、"自我重构"）
- "emotion": 该符号在梦境中通常投射的潜在情绪（如："惊恐"、"压抑"、"渴望"、"平静"）

示例输出格式：
{
  "symbols": [
    {
      "name": "被火追赶",
      "category": "动作",
      "archetype_meaning": "在荣格心理学中，火是极具双重性的符号，既象征着毁灭的狂暴力量，也代表着炼金术般的转化与重生。被火追赶通常意味着你正在被自身潜意识中压抑的强烈情绪（如未表达的愤怒、嫉妒或激烈的欲望）所反噬。这股力量由于未被意识接纳，化作了梦境中的威胁者，逼迫你直面内心的'阴影'。这种压抑往往源于现实生活中为了维持'人格面具'（Persona，即社会期望的良好形象）而做出的妥协。当你极力表现得温和、顺从时，内心积压的攻击性便会在梦境中以烈火的形式爆发。此外，火也具有净化的作用，这场追逐或许是潜意识在提示你，旧的自我认知模式已经不再适用，你必须经历一场痛苦的心理淬炼，烧毁那些束缚你的教条，才能实现自性的完整与重生。",
      "culture_tag": "高压应激",
      "emotion": "极度焦虑"
    }
  ]
}
`;

async function extractDreamSymbols(dreamText: string) {
  console.log(`\n正在分析梦境: "${dreamText}"\n`);
  console.log('请求 LLM 中...\n');

  try {
    const response = await openai.chat.completions.create({
      model: config.AI_CHAT_MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `这是我的梦境：\n${dreamText}` }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    });

    const result = response.choices[0].message.content;

    if (result) {
      const parsed = JSON.parse(result);
      console.log('✅ 提取结果:');
      console.log(JSON.stringify(parsed, null, 2));
      return parsed;
    } else {
      console.log('❌ 未收到有效回复');
    }
  } catch (error) {
    console.error('❌ 请求失败:', error);
  }
}

// ================= 测试用例 =================

async function runTests() {
  const testDreams = [
    "我梦见被一团火追赶，怎么跑都跑不掉，感觉特别热，最后躲进了一个冰冷的地下室。",
    "梦到又回到了高中考场，数学卷子发下来发现自己一道题都不会做，笔也写不出水，急得满头大汗。",
    "走在一条长满发光植物的森林里，遇到一个没有脸的黑衣人递给我一把生锈的钥匙。"
  ];

  for (const dream of testDreams) {
    await extractDreamSymbols(dream);
    console.log('--------------------------------------------------');
  }
}

runTests();
