import { Hono } from 'hono';
import { z } from 'zod';
import { OpenAI } from 'openai';
import * as dotenv from 'dotenv';
import { prisma } from '../index';

dotenv.config();

const tarotRouter = new Hono();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL,
});

type TarotCardSeed = {
  code: string;
  name: string;
  emoji: string;
  upright: string;
  reversed: string;
};

const MAJOR_ARCANA: TarotCardSeed[] = [
  { code: 'FOOL', name: '愚者', emoji: '🃏', upright: '新的开始、自由探索、信任直觉', reversed: '冲动冒进、方向感缺失、逃避责任' },
  { code: 'MAGICIAN', name: '魔术师', emoji: '✨', upright: '行动力、资源整合、意志实现', reversed: '操控倾向、执行分散、过度包装' },
  { code: 'HIGH_PRIESTESS', name: '女祭司', emoji: '🌙', upright: '内在直觉、潜意识信息、安静观察', reversed: '直觉受阻、信息混乱、过度猜测' },
  { code: 'EMPRESS', name: '皇后', emoji: '🌿', upright: '滋养成长、创造力、关系丰盛', reversed: '情感过度、依赖、边界模糊' },
  { code: 'EMPEROR', name: '皇帝', emoji: '🛡️', upright: '秩序结构、掌控感、现实执行', reversed: '控制欲、僵化、压迫感' },
  { code: 'HIEROPHANT', name: '教皇', emoji: '📜', upright: '传统信念、学习指引、价值框架', reversed: '教条束缚、盲从、价值冲突' },
  { code: 'LOVERS', name: '恋人', emoji: '💞', upright: '关系联结、价值选择、真实承诺', reversed: '关系拉扯、犹豫不决、欲望分裂' },
  { code: 'CHARIOT', name: '战车', emoji: '🏇', upright: '意志前进、突破阻力、目标感', reversed: '失控焦躁、方向偏移、过度竞争' },
  { code: 'STRENGTH', name: '力量', emoji: '🦁', upright: '温柔坚韧、情绪驯化、内在勇气', reversed: '自我怀疑、情绪压抑、能量低迷' },
  { code: 'HERMIT', name: '隐士', emoji: '🕯️', upright: '内省沉淀、独立判断、寻找真相', reversed: '孤立封闭、拖延回避、过度退缩' },
  { code: 'WHEEL_OF_FORTUNE', name: '命运之轮', emoji: '🎡', upright: '周期变化、机会转折、顺势而为', reversed: '卡点循环、抗拒变化、时机错配' },
  { code: 'JUSTICE', name: '正义', emoji: '⚖️', upright: '客观平衡、因果责任、边界清晰', reversed: '失衡偏见、逃避后果、标准摇摆' },
  { code: 'HANGED_MAN', name: '倒吊人', emoji: '🙃', upright: '换位视角、暂停重估、释放执念', reversed: '僵持拖延、无效牺牲、停滞不前' },
  { code: 'DEATH', name: '死神', emoji: '🕊️', upright: '结束与重生、断舍离、深层转化', reversed: '抗拒结束、旧模式反复、过渡困难' },
  { code: 'TEMPERANCE', name: '节制', emoji: '🧪', upright: '整合调和、节律修复、长期平衡', reversed: '失衡过载、节奏紊乱、极端波动' },
  { code: 'DEVIL', name: '恶魔', emoji: '⛓️', upright: '欲望束缚、成瘾循环、阴影依附', reversed: '松绑觉察、戒断启动、边界重建' },
  { code: 'TOWER', name: '高塔', emoji: '⚡', upright: '突发震荡、真相揭露、结构重置', reversed: '慢性崩解、长期焦虑、逃避现实' },
  { code: 'STAR', name: '星星', emoji: '🌟', upright: '希望修复、信念回归、温柔疗愈', reversed: '希望感下降、信任受损、复原缓慢' },
  { code: 'MOON', name: '月亮', emoji: '🌘', upright: '潜意识涌现、梦境象征、情绪潮汐', reversed: '恐惧投射、误读信号、迷雾加深' },
  { code: 'SUN', name: '太阳', emoji: '☀️', upright: '清晰生命力、积极表达、真实自信', reversed: '过度乐观、精力透支、注意力分散' },
  { code: 'JUDGEMENT', name: '审判', emoji: '📣', upright: '觉醒召唤、复盘决断、人生升级', reversed: '自责循环、拖延决策、回避召唤' },
  { code: 'WORLD', name: '世界', emoji: '🌍', upright: '阶段完成、整合圆满、迈入新周期', reversed: '收尾困难、目标未闭环、延迟完成' },
];

const drawSchema = z.object({
  dreamText: z.string().optional(),
  emotion: z.string().optional(),
  question: z.string().optional(),
  spreadType: z.literal('three_card').optional(),
});

function getUserId(c: any): string {
  const headerUserId = c.req.header('x-user-id')?.trim();
  if (headerUserId) return headerUserId;
  const anonId = c.req.header('x-anon-id')?.trim();
  if (anonId) return anonId;
  return `anon_${Date.now()}`;
}

async function ensureUser(userId: string) {
  let user = await prisma.user.findFirst({ where: { id: userId } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        id: userId,
        email: `${userId}@example.com`,
        name: `User_${userId.substring(0, 4)}`,
        password_hash: 'hashed_password_mock',
        encryption_key: 'mock_key',
      },
    });
  }
  return user;
}

function drawThreeCards(): Array<TarotCardSeed & { is_reversed: boolean; position: number }> {
  const pool = [...MAJOR_ARCANA];
  const drawn: Array<TarotCardSeed & { is_reversed: boolean; position: number }> = [];
  for (let i = 0; i < 3; i++) {
    const idx = Math.floor(Math.random() * pool.length);
    const card = pool.splice(idx, 1)[0];
    drawn.push({
      ...card,
      is_reversed: Math.random() < 0.4,
      position: i + 1,
    });
  }
  return drawn;
}

function buildTarotPrompt(cards: Array<TarotCardSeed & { is_reversed: boolean; position: number }>, dreamText?: string, emotion?: string, question?: string) {
  const cardText = cards
    .map((c, i) => `${i + 1}. ${c.name}${c.is_reversed ? '（逆位）' : '（正位）'}：正位=${c.upright}；逆位=${c.reversed}`)
    .join('\n');

  return `
你是一位“神秘叙事 + 心理落地”风格的塔罗顾问。请基于三张牌阵给出中文解读。

输出必须是 JSON，字段如下：
{
  "summary": "一句话总览，不超过30字",
  "interpretation": "完整解读，120-220字",
  "evidence": [
    {
      "point": "一个明确判断",
      "card_basis": "基于哪张牌、正逆位及牌义",
      "dream_basis": "从梦境文本里引用到的依据；若无梦境就写'未提供梦境文本'"
    }
  ],
  "advice": ["建议1","建议2","建议3"]
}

要求：
1) 语气前半带神秘感，后半给可执行建议。
2) 不要制造恐吓，不给绝对命运结论。
3) 建议务实具体，每条 18-40 字，且能当天执行。
4) interpretation 中必须显式提到“过去/现在/未来”三张牌各自对结论的贡献。
5) evidence 至少 2 条，每条都要写清楚牌面依据。

梦境文本：${dreamText || '未提供'}
情绪标签：${emotion || '未提供'}
用户问题：${question || '未提供'}

三张牌阵（过去-现在-未来）：
${cardText}
`;
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('AI timeout')), timeoutMs);
    promise
      .then((res) => {
        clearTimeout(timer);
        resolve(res);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

tarotRouter.post('/draw', async (c) => {
  try {
    const body = await c.req.json();
    const parsed = drawSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ success: false, message: 'Invalid input', details: parsed.error.issues }, 400);
    }

    const { dreamText, emotion, question, spreadType } = parsed.data;
    const userId = getUserId(c);
    const user = await ensureUser(userId);
    const cards = drawThreeCards();

    const prompt = buildTarotPrompt(cards, dreamText, emotion, question);
    let summary = '潜意识正在提醒你重建内在秩序';
    let interpretation = '三张牌显示你正处于旧模式松动到新阶段开启的过渡期。请先稳定节律，再推进关键决定。';
    let advice: string[] = ['今天只推进一件最重要的小事。', '记录一次情绪触发场景并复盘。', '睡前做 10 分钟呼吸放松。'];
    let evidence: Array<{ point: string; card_basis: string; dream_basis: string }> = [];

    try {
      const response = await withTimeout(
        openai.chat.completions.create({
          model: 'deepseek-chat',
          messages: [
            { role: 'system', content: '你是专业塔罗顾问，请严格返回 JSON。' },
            { role: 'user', content: prompt },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.6,
        }),
        8000
      );
      const content = response.choices[0]?.message?.content;
      if (content) {
        const data = JSON.parse(content);
        summary = data.summary || summary;
        interpretation = data.interpretation || interpretation;
        advice = Array.isArray(data.advice) && data.advice.length ? data.advice : advice;
        evidence = Array.isArray(data.evidence) ? data.evidence.slice(0, 3) : [];
      }
    } catch (aiError) {
      console.error('Tarot AI fallback:', aiError);
    }

    if (evidence.length === 0) {
      evidence = cards.slice(0, 2).map((card, index) => ({
        point: index === 0 ? '当前阶段存在明确的内在拉扯。' : '未来阶段可通过主动行动改善走势。',
        card_basis: `${card.name}${card.is_reversed ? '（逆位）' : '（正位）'}：${card.is_reversed ? card.reversed : card.upright}`,
        dream_basis: dreamText ? `梦境文本已提供，情绪标签为 ${emotion || '未提供'}。` : '未提供梦境文本',
      }));
    }

    const reading = await prisma.tarotReading.create({
      data: {
        user_id: user.id,
        spread_type: spreadType || 'three_card',
        question: question || null,
        ai_summary: summary,
        ai_interpretation: interpretation,
        ai_advice: JSON.stringify({ advice, evidence }),
        cards: {
          create: cards.map((card) => ({
            position: card.position,
            card_code: card.code,
            card_name: card.name,
            card_emoji: card.emoji,
            is_reversed: card.is_reversed,
            upright_meaning: card.upright,
            reversed_meaning: card.reversed,
          })),
        },
      },
      include: { cards: { orderBy: { position: 'asc' } } },
    });

    return c.json({
      success: true,
      data: {
        ...reading,
        advice,
        evidence,
      },
    });
  } catch (error: any) {
    console.error('Tarot draw error:', error);
    return c.json({ success: false, message: 'Failed to draw tarot', details: error.message }, 500);
  }
});

tarotRouter.get('/history', async (c) => {
  try {
    const userId = getUserId(c);
    const readings = await prisma.tarotReading.findMany({
      where: { user_id: userId },
      include: { cards: { orderBy: { position: 'asc' } } },
      orderBy: { created_at: 'desc' },
      take: 30,
    });

    return c.json({
      success: true,
      data: readings.map((r) => ({
        ...r,
        advice: (() => {
          try {
            const parsed = r.ai_advice ? JSON.parse(r.ai_advice) : [];
            return Array.isArray(parsed) ? parsed : parsed.advice || [];
          } catch {
            return [];
          }
        })(),
        evidence: (() => {
          try {
            const parsed = r.ai_advice ? JSON.parse(r.ai_advice) : {};
            return Array.isArray(parsed.evidence) ? parsed.evidence : [];
          } catch {
            return [];
          }
        })(),
      })),
    });
  } catch (error: any) {
    console.error('Tarot history error:', error);
    return c.json({ success: false, message: 'Failed to fetch history', details: error.message }, 500);
  }
});

const favoriteSchema = z.object({
  cardCode: z.string().min(1),
  cardName: z.string().min(1),
  cardEmoji: z.string().optional(),
});

tarotRouter.post('/favorite/toggle', async (c) => {
  try {
    const body = await c.req.json();
    const parsed = favoriteSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ success: false, message: 'Invalid input', details: parsed.error.issues }, 400);
    }

    const userId = getUserId(c);
    const user = await ensureUser(userId);
    const { cardCode, cardName, cardEmoji } = parsed.data;
    const existing = await prisma.tarotFavorite.findUnique({
      where: { user_id_card_code: { user_id: user.id, card_code: cardCode } },
    });

    if (existing) {
      await prisma.tarotFavorite.delete({ where: { id: existing.id } });
      return c.json({ success: true, data: { favorited: false } });
    }

    await prisma.tarotFavorite.create({
      data: {
        user_id: user.id,
        card_code: cardCode,
        card_name: cardName,
        card_emoji: cardEmoji || null,
      },
    });
    return c.json({ success: true, data: { favorited: true } });
  } catch (error: any) {
    console.error('Tarot toggle favorite error:', error);
    return c.json({ success: false, message: 'Failed to toggle favorite', details: error.message }, 500);
  }
});

tarotRouter.get('/favorites', async (c) => {
  try {
    const userId = getUserId(c);
    const data = await prisma.tarotFavorite.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
    });
    return c.json({ success: true, data });
  } catch (error: any) {
    console.error('Tarot favorites error:', error);
    return c.json({ success: false, message: 'Failed to fetch favorites', details: error.message }, 500);
  }
});

export default tarotRouter;
