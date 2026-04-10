import { Hono } from 'hono';
import { z } from 'zod';
import { OpenAI } from 'openai';
import * as dotenv from 'dotenv';
import { prisma } from '../index';

dotenv.config();

const aiRouter = new Hono();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL, // 允许通过环境变量配置 DeepSeek/通义千问等兼容 OpenAI 的接口
});

// Zhipu AI client for Embedding and Image Generation
const zhipuai = new OpenAI({
  apiKey: process.env.ZHIPU_API_KEY,
  baseURL: process.env.ZHIPU_BASE_URL,
});

// Zod schemas for validation
const analyzeSchema = z.object({
  dreamText: z.string().min(5, "Dream text is too short"),
  physiologicalData: z.object({
    heartRate: z.number().optional(),
    temperature: z.number().optional(),
  }).optional(),
});

const SYSTEM_PROMPT = `
你是一位专业的荣格与弗洛伊德流派心理分析师、梦境解析专家。
你的任务是从用户提供的梦境描述和（如果提供的话）睡眠时的生理数据（如心率、温度）中，提取出核心的“梦境符号”，并进行深度心理学原型的解构。同时，请评估这个梦境的整体情绪，并结合生理数据给出一份详尽的交叉验证分析报告。

请严格以 JSON 格式返回结果，包含 "emotion"、"symbols"、"cross_analysis"、"insights"、"scientific_basis"、"immersive_reflection" 六个字段：
- "emotion": 梦境的整体情绪分类（必须从以下选项中选择一个："HAPPY", "SAD", "ANGRY", "FEAR", "NEUTRAL", "ANXIETY", "PEACEFUL", "CONFUSION"）
- "symbols": 符号数组。每个符号包含以下字段：
  - "name": 符号名称（如：“坠落”、“考试”、“无面人”、“蛇”、“火”）
  - "category": 符号分类（可选值：物体 Object、动作 Action、人物 Character、环境 Environment）
  - "archetype_meaning": 经典心理学原型释义。请给出非常详细、专业且深刻的长篇分析（约 150-300 字），基于荣格或弗洛伊德理论，解释该符号代表的深层潜意识机制（例如：阴影、阿尼玛、自性、俄狄浦斯情结等）。请不要吝啬字数，尽可能展开论述该符号在心理动力学上的意义，以及它如何与梦者的现实境遇产生联结。
  - "culture_tag": 文化或普遍心理标签（如：“现代社会焦虑”、“集体潜意识恐惧”、“自我重构”）
  - "symbol_emotion": 该符号在梦境中通常投射的潜在情绪（如：“惊恐”、“压抑”、“渴望”、“平静”）
- "overall_archetype": 整个梦境的主导心理原型名称（格式：中文名称(英文名)，例如："阿尼玛(Anima)"，"阴影(Shadow)"，"自性(Self)" 等）。
- "insights": 核心洞察与建议，包含以下字段：
  - "coreTheme": 核心洞察主题（极简的一句话，如：“高应激预警：身份认同焦虑”）
  - "interpretation": 针对梦境核心的深度解释（一两句话总结）
  - "actionableAdvice": 包含 2-3 条具体的行动建议的数组（例如："睡前将空调温度下调至 24°C-26°C"，"尝试 10 分钟身体扫描冥想"）
- "scientific_basis": 科学依据模块，包含以下字段：
  - "confidence": 0-100 的整型置信度（基于梦境信息完整度与生理数据一致性）
  - "coreHypothesis": 一句话核心假设（例如：“高唤醒状态下的威胁模拟梦”）
  - "evidenceMap": 数组，至少 3 条，每条包含：
    - "observation": 观察到的梦境或生理线索
    - "inference": 由线索推导出的心理机制
    - "strength": 证据强度（"HIGH" | "MEDIUM" | "LOW"）
  - "limitations": 数组，1-2 条，说明推断边界与不确定性
- "immersive_reflection": 帮助用户“有切身体会”的代入式描述（120-220 字），用第二人称，聚焦身体感觉、注意焦点与当下可执行的自我安抚动作。
- "cross_analysis": 一份详尽的综合分析报告（约 200-300 字）。必须包含以下三个结构化段落（使用换行符 \n\n 分隔）：
  1. 生理-心理映射：详细解释梦境中的高潮片段如何与提供的生理数据（如心率波动、体温变化）相呼应。如果未提供生理数据，则推测梦境可能引发的躯体反应。
  2. 潜意识深层动机：基于荣格或弗洛伊德理论，深挖梦境核心冲突的现实根源（如被压抑的欲望、未解决的创伤、身份认同危机）。
  3. 现实觉知建议：给出 1-2 条切实可行的心理建议或生活调整方向，帮助用户在清醒状态下整合这段潜意识体验。

示例输出格式：
{
  "emotion": "FEAR",
  "overall_archetype": "阴影(Shadow)",
  "insights": {
    "coreTheme": "高应激预警：被压抑的焦虑爆发",
    "interpretation": "梦境中被火追赶指向潜意识深处的冲突。这通常出现在高强度工作周期或你在现实中极力逃避某项重大责任时。",
    "actionableAdvice": [
      "环境调节：睡前调整室内温度，保持卧室通风。",
      "心理阻断：尝试 10 分钟身体扫描冥想，平复自主神经系统。"
    ]
  },
  "symbols": [
    {
      "name": "被火追赶",
      "category": "动作",
      "archetype_meaning": "在荣格心理学中，火是极具双重性的符号，既象征着毁灭的狂暴力量，也代表着炼金术般的转化与重生。被火追赶通常意味着你正在被自身潜意识中压抑的强烈情绪（如未表达的愤怒、嫉妒或激烈的欲望）所反噬。这股力量由于未被意识接纳，化作了梦境中的威胁者，逼迫你直面内心的‘阴影’。这种压抑往往源于现实生活中为了维持‘人格面具’（Persona，即社会期望的良好形象）而做出的妥协。当你极力表现得温和、顺从时，内心积压的攻击性便会在梦境中以烈火的形式爆发。此外，火也具有净化的作用，这场追逐或许是潜意识在提示你，旧的自我认知模式已经不再适用，你必须经历一场痛苦的心理淬炼，烧毁那些束缚你的教条，才能实现自性的完整与重生。",
      "culture_tag": "高压应激",
      "symbol_emotion": "极度焦虑"
    }
  ],
  "cross_analysis": "【生理-心理映射】\\n梦境中被火追赶的意象与记录到的 REM 期高心率 (85bpm) 和略微升高的体温 (28.5°C) 高度吻合。这表明在梦境发生时，你的自主神经系统被完全激活，进入了经典的“战斗或逃跑”状态。躯体的炎热感可能直接投射为了梦中的“火”，而高心率则强化了被追赶的紧迫感。\\n\\n【潜意识深层动机】\\n在荣格心理学中，“火”不仅是毁灭的象征，更是转化的能量。那团追赶你的火，很可能是你在现实生活中一直试图逃避的某种强烈情绪（如愤怒、压抑的激情或巨大的工作压力）。它之所以紧追不舍，是因为你的潜意识正在强迫你面对这种需要被整合的心理阴影（Shadow）。\\n\\n【现实觉知建议】\\n建议在接下来的几天里，觉察自己是否在某些关系或任务中积压了过多的情绪。你可以尝试在睡前进行 10 分钟的降温冥想，或者通过书写将内心的焦虑具象化，变被动逃跑为主动面对。"
},
"scientific_basis": {
  "confidence": 82,
  "coreHypothesis": "高唤醒状态下的威胁模拟梦",
  "evidenceMap": [
    { "observation": "梦中持续被追赶", "inference": "威胁监测系统持续激活", "strength": "HIGH" }
  ],
  "limitations": ["缺少连续多晚生理数据，结论需动态复核"]
},
"immersive_reflection": "当你再次回想这个梦，先把注意力放在脚底与呼吸..."
}
`;

function normalizeAnalyzeResult(parsedData: any, physiologicalData?: { heartRate?: number; temperature?: number }) {
  const safeEmotion = typeof parsedData?.emotion === 'string' ? parsedData.emotion : 'NEUTRAL';
  const safeSymbols = Array.isArray(parsedData?.symbols) ? parsedData.symbols : [];
  const safeInsights = parsedData?.insights || {};
  const safeScientific = parsedData?.scientific_basis || {};

  const confidence = Number.isFinite(safeScientific?.confidence)
    ? Math.max(0, Math.min(100, Math.round(safeScientific.confidence)))
    : (physiologicalData?.heartRate ? 78 : 68);

  const evidenceMap = Array.isArray(safeScientific?.evidenceMap) && safeScientific.evidenceMap.length > 0
    ? safeScientific.evidenceMap.slice(0, 5)
    : [
        {
          observation: safeSymbols[0]?.name ? `梦中出现“${safeSymbols[0].name}”等高显著符号` : '梦境文本包含明显情绪线索',
          inference: '说明潜意识正在通过高显著意象进行情绪编码与提醒',
          strength: 'MEDIUM'
        },
        {
          observation: physiologicalData?.heartRate ? `记录到较高心率（${physiologicalData.heartRate} bpm）` : '缺少连续生理数据',
          inference: physiologicalData?.heartRate ? '与高唤醒梦境模型一致，支持威胁模拟假设' : '当前判断主要依赖叙事内容，生理证据不足',
          strength: physiologicalData?.heartRate ? 'HIGH' : 'LOW'
        },
        {
          observation: `主情绪为 ${safeEmotion}`,
          inference: '情绪与符号语义方向一致，可用于短期干预建议',
          strength: 'MEDIUM'
        }
      ];

  return {
    ...parsedData,
    emotion: safeEmotion,
    symbols: safeSymbols,
    insights: {
      coreTheme: safeInsights?.coreTheme || '潜意识冲突信号',
      interpretation: safeInsights?.interpretation || '你的梦境反映了近期压力与内在需求之间的拉扯。',
      actionableAdvice: Array.isArray(safeInsights?.actionableAdvice) && safeInsights.actionableAdvice.length > 0
        ? safeInsights.actionableAdvice.slice(0, 4)
        : ['睡前进行 10 分钟缓呼吸，拉低入睡前唤醒水平。', '记录梦中最强烈片段，并写下其对应现实事件。']
    },
    scientific_basis: {
      confidence,
      coreHypothesis: safeScientific?.coreHypothesis || '压力相关的情绪整合梦',
      evidenceMap,
      limitations: Array.isArray(safeScientific?.limitations) && safeScientific.limitations.length > 0
        ? safeScientific.limitations.slice(0, 3)
        : ['梦境解析属于心理推断，不构成医学诊断。']
    },
    immersive_reflection: typeof parsedData?.immersive_reflection === 'string' && parsedData.immersive_reflection.trim()
      ? parsedData.immersive_reflection
      : '当你回想这个梦时，先把注意力放在呼吸与肩颈的紧张感上。你可能会发现，梦里的压迫感和白天未表达的担忧是同一种身体信号。给自己 90 秒慢呼吸，再把“我最担心的事”写成一句话，压力会从模糊威胁变成可处理问题。'
  };
}

// Helper to get userId from header or fallback
function getUserId(c: any): string {
  const headerUserId = c.req.header('x-user-id')?.trim();
  if (headerUserId) return headerUserId;
  const anonId = c.req.header('x-anon-id')?.trim();
  if (anonId) return anonId;
  return `anon_${Date.now()}`;
}

aiRouter.post('/analyze', async (c) => {
  try {
    const body = await c.req.json();
    const result = analyzeSchema.safeParse(body);
    
    if (!result.success) {
      return c.json({ error: 'Invalid input', details: result.error.issues }, 400);
    }
    
    const { dreamText, physiologicalData } = result.data;
    
    let userMessage = `这是我的梦境：\n${dreamText}`;
    if (physiologicalData) {
      userMessage += `\n这是我睡眠时的生理数据：心率 ${physiologicalData.heartRate || '未知'} bpm, 温度 ${physiologicalData.temperature || '未知'} °C`;
    }
    
    const response = await openai.chat.completions.create({
      model: 'deepseek-chat', // 使用 DeepSeek 的模型
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userMessage }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    });
    
    const content = response.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error('No content returned from OpenAI');
    }
    
    const parsedData = normalizeAnalyzeResult(JSON.parse(content), physiologicalData);
    
    // Create DreamRecord in database
    let dreamRecordId = null;
    try {
      // Ensure user exists
      const userId = getUserId(c);
      let user = await prisma.user.findFirst({
        where: { id: userId }
      });

      if (!user) {
        user = await prisma.user.create({
          data: {
            id: userId,
            email: `${userId}@example.com`,
            name: `User_${userId.substring(0, 4)}`,
            password_hash: 'hashed_password_mock',
            encryption_key: 'mock_key',
          }
        });
      }

      const newRecord = await prisma.dreamRecord.create({
        data: {
          user_id: user.id,
          content: dreamText,
          emotion: parsedData.emotion || 'NEUTRAL',
          // Storing analysis result in DB isn't strictly in schema as a column anymore?
          // Wait, if it isn't, we just skip it or store it elsewhere. 
          // The schema has `emotion`, `content`, `recorded_at`
        }
      });
      dreamRecordId = newRecord.id;
    } catch (dbError) {
      console.error("Failed to save DreamRecord to DB:", dbError);
    }

    // Save symbols to database
    try {
      if (parsedData.symbols && Array.isArray(parsedData.symbols)) {
        for (const symbol of parsedData.symbols) {
          // Use upsert to create or update the symbol to avoid duplicates
          const savedSymbol = await prisma.dreamSymbol.upsert({
            where: { name: symbol.name },
            update: {
              universal_meaning: symbol.archetype_meaning,
            },
            create: {
              name: symbol.name,
              universal_meaning: symbol.archetype_meaning,
            }
          });
          
          if (dreamRecordId) {
            await prisma.dreamToSymbol.create({
              data: {
                dream_record_id: dreamRecordId,
                dream_symbol_id: savedSymbol.id,
                personalized_meaning: symbol.archetype_meaning // fallback
              }
            });
          }
        }
      }
    } catch (dbError) {
      console.error("Failed to save symbols to DB:", dbError);
      // Don't fail the whole request if saving symbols fails
    }

    return c.json({ data: parsedData });
    
  } catch (error: any) {
    console.error('Error analyzing dream:', error);
    return c.json({ error: 'Failed to analyze dream', details: error.message }, 500);
  }
});

// Calculate Cosine Similarity
function cosineSimilarity(vecA: number[], vecB: number[]) {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

aiRouter.post('/embed', async (c) => {
  try {
    const body = await c.req.json();
    const { dreamText, dreamId } = body;
    
    if (!dreamText) {
      return c.json({ error: 'Missing dreamText' }, 400);
    }
    
    // 1. Generate embedding using Zhipu AI
    const response = await zhipuai.embeddings.create({
      model: "embedding-3", // 智谱的 embedding 模型
      input: dreamText,
    });
    
    const embedding = response.data[0].embedding;
    
    // 2. Save embedding to database if dreamId is provided
    if (dreamId) {
      await prisma.dreamRecord.update({
        where: { id: dreamId },
        data: {
          content_embedding: JSON.stringify(embedding),
        }
      });
    }
    
    return c.json({ data: { embedding } });
  } catch (error: any) {
    console.error('Error generating embedding:', error);
    return c.json({ error: 'Failed to generate embedding', details: error.message }, 500);
  }
});

aiRouter.post('/match', async (c) => {
  try {
    const body = await c.req.json();
    const { targetEmbedding, topK = 5 } = body;
    
    if (!targetEmbedding || !Array.isArray(targetEmbedding)) {
      return c.json({ error: 'Invalid targetEmbedding' }, 400);
    }
    
    const userId = getUserId(c);
    
    // 1. Fetch all dreams with embeddings for this user
    const dreams = await prisma.dreamRecord.findMany({
      where: {
        user_id: userId,
        content_embedding: {
          not: null
        }
      },
      select: {
        id: true,
        content: true,
        emotion: true,
        content_embedding: true
      }
    });
    
    // 2. Calculate similarities
    const matches = dreams.map(dream => {
      const dbEmbedding = JSON.parse(dream.content_embedding as string);
      const similarity = cosineSimilarity(targetEmbedding, dbEmbedding);
      return {
        id: dream.id,
        content: dream.content,
        emotion: dream.emotion,
        similarity
      };
    });
    
    // 3. Sort and slice
    matches.sort((a, b) => b.similarity - a.similarity);
    const topMatches = matches.slice(0, topK);
    
    return c.json({ data: topMatches });
    
  } catch (error: any) {
    console.error('Error matching dreams:', error);
    return c.json({ error: 'Failed to match dreams', details: error.message }, 500);
  }
});

// Fetch all saved dream symbols for the current user
aiRouter.get('/symbols', async (c) => {
  try {
    const userId = getUserId(c);
    
    // Find all symbols that are linked to this user's dream records
    const symbols = await prisma.dreamSymbol.findMany({
      where: {
        dream_associations: {
          some: {
            dream_record: {
              user_id: userId,
              deleted_at: null
            }
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    });
    return c.json({ data: symbols });
  } catch (error: any) {
    console.error('Error fetching symbols:', error);
    return c.json({ error: 'Failed to fetch symbols', details: error.message }, 500);
  }
});

aiRouter.post('/generate-image', async (c) => {
  try {
    const body = await c.req.json();
    const { prompt, dreamId } = body;
    
    if (!prompt) {
      return c.json({ error: 'Missing prompt' }, 400);
    }
    
    // 1. Generate image using Zhipu AI (CogView)
    const response = await zhipuai.images.generate({
      model: "cogview-3", // 智谱的文生图模型
      prompt: `Create a dreamlike, surrealistic illustration based on the following dream description. The style should be mysterious, psychological, and visually striking, similar to Carl Jung's Red Book or surrealist paintings: ${prompt}`,
      n: 1,
      size: "1024x1024",
    });
    
    const imageUrl = response.data?.[0]?.url;
    
    if (!imageUrl) {
      return c.json({ error: 'Failed to generate image URL' }, 500);
    }
    
    // 2. Optionally save to database
    // (If we had an image_url field in DreamRecord, we could save it here)
    // if (dreamId) {
    //   await prisma.dreamRecord.update({
    //     where: { id: dreamId },
    //     data: { image_url: imageUrl }
    //   });
    // }
    
    return c.json({ data: { imageUrl } });
    
  } catch (error: any) {
    console.error('Error generating image:', error);
    return c.json({ error: 'Failed to generate image', details: error.message }, 500);
  }
});

export default aiRouter;
