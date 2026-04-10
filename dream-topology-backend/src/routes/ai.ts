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
  mode: z.enum(['fast', 'deep']).optional(),
});

const SYSTEM_PROMPT = `
你是一位专业的荣格与弗洛伊德流派心理分析师、梦境解析专家。
你的任务是从用户提供的梦境描述和（如果提供的话）睡眠时的生理数据（如心率、温度）中，提取出核心的“梦境符号”，并进行深度心理学原型的解构。同时，请评估这个梦境的整体情绪，并结合生理数据给出一份详尽的交叉验证分析报告。

请严格以 JSON 格式返回结果，包含 "emotion"、"symbols"、"cross_analysis"、"insights"、"overall_archetype" 五个字段：
- "emotion": 梦境的整体情绪分类（必须从以下选项中选择一个："HAPPY", "SAD", "ANGRY", "FEAR", "NEUTRAL", "ANXIETY", "PEACEFUL", "CONFUSION"）
- "symbols": 符号数组（最多 6 个，按重要性排序）。每个符号包含以下字段：
  - "name": 符号名称（如：“坠落”、“考试”、“无面人”、“蛇”、“火”）
  - "category": 符号分类（可选值：物体 Object、动作 Action、人物 Character、环境 Environment）
  - "archetype_meaning": 经典心理学原型释义（约 80-160 字），基于荣格或弗洛伊德理论，解释该符号的潜意识机制，并点明其与现实处境的可能联系。
  - "culture_tag": 文化或普遍心理标签（如：“现代社会焦虑”、“集体潜意识恐惧”、“自我重构”）
  - "symbol_emotion": 该符号在梦境中通常投射的潜在情绪（如：“惊恐”、“压抑”、“渴望”、“平静”）
- "overall_archetype": 整个梦境的主导心理原型名称（格式：中文名称(英文名)，例如："阿尼玛(Anima)"，"阴影(Shadow)"，"自性(Self)" 等）。
- "insights": 核心洞察与建议，包含以下字段：
  - "coreTheme": 核心洞察主题（极简的一句话，如：“高应激预警：身份认同焦虑”）
  - "interpretation": 针对梦境核心的深度解释（一两句话总结）
  - "actionableAdvice": 包含 2-3 条具体的行动建议的数组（例如："睡前将空调温度下调至 24°C-26°C"，"尝试 10 分钟身体扫描冥想"）
- "cross_analysis": 一份综合分析报告（约 140-220 字）。必须包含以下三个结构化段落（使用换行符 \n\n 分隔）：
  1. 生理-心理映射：详细解释梦境中的高潮片段如何与提供的生理数据（如心率波动、体温变化）相呼应。如果未提供生理数据，则推测梦境可能引发的躯体反应。
  2. 潜意识深层动机：基于荣格或弗洛伊德理论，深挖梦境核心冲突的现实根源（如被压抑的欲望、未解决的创伤、身份认同危机）。
  3. 现实觉知建议：给出 1-2 条切实可行的心理建议或生活调整方向，帮助用户在清醒状态下整合这段潜意识体验。
`;

const SYSTEM_PROMPT_FAST = `
你是一位专业的荣格与弗洛伊德流派心理分析师、梦境解析专家。
请严格以 JSON 格式返回结果，包含 "emotion"、"symbols"、"cross_analysis"、"insights"、"overall_archetype" 五个字段：
- "emotion": 必须从："HAPPY", "SAD", "ANGRY", "FEAR", "NEUTRAL", "ANXIETY", "PEACEFUL", "CONFUSION" 中选择
- "symbols": 最多 4 个，按重要性排序；每个包含 name/category/archetype_meaning(40-90字)/culture_tag/symbol_emotion
- "overall_archetype": 中文名称(英文名)
- "insights": coreTheme/interpretation/actionableAdvice(2条)
- "cross_analysis": 3 段（用 \\n\\n 分隔），总字数 90-140 字
`;

function normalizeAnalyzeResult(parsedData: any, physiologicalData?: { heartRate?: number; temperature?: number }) {
  const safeEmotion = typeof parsedData?.emotion === 'string' ? parsedData.emotion : 'NEUTRAL';
  const safeSymbols = Array.isArray(parsedData?.symbols) ? parsedData.symbols.slice(0, 6) : [];
  const safeInsights = parsedData?.insights || {};
  const safeScientific = parsedData?.scientific_basis || {};
  const safeCross = typeof parsedData?.cross_analysis === 'string' ? parsedData.cross_analysis.trim() : '';

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

  const fallbackCross = safeCross || [
    `【生理-心理映射】\n${physiologicalData?.heartRate ? `心率 ${physiologicalData.heartRate} bpm 提示较高唤醒水平，` : ''}${physiologicalData?.temperature ? `体温 ${physiologicalData.temperature}°C 可能放大不适感，` : ''}梦境中的紧迫与迷失更容易被躯体反应强化。`,
    `【潜意识深层动机】\n高频的“被困/迷路/追逐”等意象通常指向现实中的压力与控制感下降，潜意识用情境化符号让你意识到需要面对的核心冲突。`,
    `【现实觉知建议】\n睡前做 3-5 分钟缓呼吸与放松；白天把近期最焦虑的事项写成清单并拆分成可执行步骤，降低夜间唤醒。`
  ].join('\n\n');

  return {
    ...parsedData,
    emotion: safeEmotion,
    symbols: safeSymbols,
    cross_analysis: fallbackCross,
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

function parseModelJson(content: string) {
  try {
    return JSON.parse(content);
  } catch {
  }

  const start = content.indexOf('{');
  const end = content.lastIndexOf('}');
  if (start !== -1 && end !== -1 && end > start) {
    const sliced = content.slice(start, end + 1);
    return JSON.parse(sliced);
  }

  return JSON.parse(content);
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
    
    const { dreamText, physiologicalData, mode } = result.data;
    const userId = getUserId(c);

    const cached = await prisma.dreamRecord.findFirst({
      where: {
        user_id: userId,
        content: dreamText,
        deleted_at: null,
        analysis_result: { not: null },
      },
      orderBy: { created_at: 'desc' },
      select: { analysis_result: true }
    });

    if (cached?.analysis_result) {
      try {
        return c.json({ data: JSON.parse(cached.analysis_result) });
      } catch {
      }
    }
    
    let userMessage = `这是我的梦境：\n${dreamText}`;
    if (physiologicalData) {
      userMessage += `\n这是我睡眠时的生理数据：心率 ${physiologicalData.heartRate || '未知'} bpm, 温度 ${physiologicalData.temperature || '未知'} °C`;
    }
    
    const response = await openai.chat.completions.create({
      model: 'deepseek-chat', // 使用 DeepSeek 的模型
      messages: [
        { role: 'system', content: mode === 'deep' ? SYSTEM_PROMPT : SYSTEM_PROMPT_FAST },
        { role: 'user', content: userMessage }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
      max_tokens: mode === 'deep' ? 1500 : 1200,
    });
    
    const content = response.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error('No content returned from OpenAI');
    }
    
    const parsedData = normalizeAnalyzeResult(parseModelJson(content), physiologicalData);
    
    // Create DreamRecord in database
    let dreamRecordId = null;
    try {
      // Ensure user exists
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
          analysis_result: JSON.stringify(parsedData),
          cross_analysis: parsedData.cross_analysis || null,
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
    const { prompt, dreamId, style } = body;
    
    if (!prompt) {
      return c.json({ error: 'Missing prompt' }, 400);
    }

    // Define style prompts
    const stylePrompts: Record<string, string> = {
      'surrealism': 'Create a dreamlike, surrealistic illustration. The style should be mysterious, psychological, and visually striking, similar to Carl Jung\'s Red Book or surrealist paintings.',
      'cyberpunk': 'Create a futuristic, cyberpunk style illustration with neon lights, high-tech elements, and a dark, moody atmosphere.',
      'watercolor': 'Create a soft, ethereal watercolor painting with fluid colors, gentle textures, and a poetic, dreamlike quality.',
      'oil_painting': 'Create a rich, textured oil painting with visible brushstrokes, deep colors, and a classic, expressive fine art style.',
      'anime': 'Create a high-quality Japanese anime style illustration, similar to Makoto Shinkai or Studio Ghibli, with beautiful lighting and emotional atmosphere.',
      'sketch': 'Create a detailed charcoal or pencil sketch with expressive lines, shading, and a raw, psychological feel.'
    };

    const selectedStylePrompt = stylePrompts[style] || stylePrompts['surrealism'];
    const finalPrompt = `${selectedStylePrompt} Based on this dream description: ${prompt}`;
    
    // 1. Generate image using Zhipu AI (CogView)
    const response = await zhipuai.images.generate({
      model: "cogview-3", // 智谱的文生图模型
      prompt: finalPrompt,
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
