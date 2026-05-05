import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Helper function for in-memory cosine similarity (since SQLite doesn't have pgvector)
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

export class DreamService {
  /**
   * 1. 相似梦境向量检索 (Similarity Search - SQLite In-Memory Fallback)
   * 给定一个梦境的 Vector，查询该用户历史上最相似的 5 个梦境
   */
  async findSimilarDreams(userId: string, targetEmbedding: number[], limit = 5) {
    // 1. Fetch all dreams for the user that have an embedding
    const allDreams = await prisma.dreamRecord.findMany({
      where: {
        user_id: userId,
        deleted_at: null,
        content_embedding: {
          not: null
        }
      },
      select: {
        id: true,
        content: true,
        emotion: true,
        vividness: true,
        recorded_at: true,
        content_embedding: true
      }
    });

    // 2. Calculate similarity in memory
    const dreamsWithSimilarity = allDreams.map((dream: { content_embedding: string | null; id: string; content: string; emotion: string; vividness: number; recorded_at: Date }) => {
      const embedding = JSON.parse(dream.content_embedding as string) as number[];
      const similarity = cosineSimilarity(targetEmbedding, embedding);

      return {
        id: dream.id,
        content: dream.content,
        emotion: dream.emotion,
        vividness: dream.vividness,
        recorded_at: dream.recorded_at,
        similarity
      };
    });

    // 3. Sort by highest similarity and limit
    dreamsWithSimilarity.sort((a: { similarity: number }, b: { similarity: number }) => b.similarity - a.similarity);
    return dreamsWithSimilarity.slice(0, limit);
  }

  /**
   * 2. 拓扑图渲染初始化查询 (Standard Prisma Query)
   * 一次性查询某用户最近 30 天的所有梦境节点、提取的符号节点，以及它们之间的连线权重。
   */
  async getTopologyData(userId: string) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const dreams = await prisma.dreamRecord.findMany({
      where: {
        user_id: userId,
        recorded_at: { gte: thirtyDaysAgo },
        deleted_at: null,
      },
      include: {
        dream_symbols: {
          include: {
            dream_symbol: true
          }
        },
        source_edges: true,
      }
    });

    const nodes: any[] = [];
    const links: any[] = [];

    dreams.forEach((dream: any) => {
      nodes.push({
        id: dream.id,
        type: 'dream',
        label: dream.recorded_at.toLocaleDateString(),
        data: { emotion: dream.emotion, vividness: dream.vividness }
      });

      dream.dream_symbols.forEach((ds: any) => {
        nodes.push({
          id: ds.dream_symbol.id,
          type: 'symbol',
          label: ds.dream_symbol.name,
        });

        links.push({
          source: dream.id,
          target: ds.dream_symbol.id,
          type: 'contains',
          label: ds.personalized_meaning
        });
      });

      dream.source_edges.forEach((edge: any) => {
        links.push({
          source: edge.source_id,
          target: edge.target_id,
          type: 'associated',
          weight: edge.weight,
          relation: edge.logic_relation
        });
      });
    });

    const uniqueNodes = Array.from(new Map(nodes.map((n: any) => [n.id, n])).values());

    return { nodes: uniqueNodes, links };
  }

  /**
   * 3. 日历热力图聚合查询 (SQLite Memory Aggregation Fallback)
   */
  async getCalendarHeatmap(userId: string, startDate: Date, endDate: Date) {
    const records = await prisma.dreamRecord.findMany({
      where: {
        user_id: userId,
        recorded_at: {
          gte: startDate,
          lte: endDate
        },
        deleted_at: null
      },
      include: {
        physiological_data: true
      }
    });

    const dailyStats = new Map<string, any>();

    records.forEach((record: any) => {
      const dateStr = record.recorded_at.toISOString().split('T')[0];

      if (!dailyStats.has(dateStr)) {
        dailyStats.set(dateStr, {
          dream_date: dateStr,
          dream_count: 0,
          emotions: [] as string[],
          heart_rates: [] as number[]
        });
      }

      const stats = dailyStats.get(dateStr);
      stats.dream_count += 1;
      stats.emotions.push(record.emotion);

      if (record.physiological_data?.rem_heart_rate) {
        stats.heart_rates.push(record.physiological_data.rem_heart_rate);
      }
    });

    const result = Array.from(dailyStats.values()).map((stats: any) => {
      const emotionCounts = (stats.emotions as string[]).reduce((acc: Record<string, number>, curr: string) => {
        acc[curr] = (acc[curr] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      let dominant_emotion = null;
      let maxCount = 0;
      for (const [emotion, count] of Object.entries(emotionCounts)) {
        if ((count as number) > maxCount) {
          maxCount = count as number;
          dominant_emotion = emotion;
        }
      }

      const avg_rem_heart_rate = stats.heart_rates.length > 0
        ? stats.heart_rates.reduce((a: number, b: number) => a + b, 0) / stats.heart_rates.length
        : null;

      return {
        dream_date: stats.dream_date,
        dream_count: stats.dream_count,
        dominant_emotion,
        avg_rem_heart_rate
      };
    });

    return result.sort((a: { dream_date: string }, b: { dream_date: string }) => a.dream_date.localeCompare(b.dream_date));
  }
}
