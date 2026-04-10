const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

function getOrCreateAnonymousUserId(): string {
  const key = 'dream_topology_anonymous_user_id';
  const existing = localStorage.getItem(key);
  if (existing && existing.trim()) return existing;
  const generated = `anon_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  localStorage.setItem(key, generated);
  return generated;
}

function getActiveUserId(): string {
  try {
    const userStr = localStorage.getItem('dream_topology_current_user');
    if (userStr) {
      const user = JSON.parse(userStr);
      if (user?.id) return String(user.id);
    }
  } catch {
    // ignore and fallback to anonymous id
  }
  return getOrCreateAnonymousUserId();
}

// Helper to get headers with stable user identity
function getHeaders() {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };
  const activeUserId = getActiveUserId();
  headers['x-user-id'] = activeUserId;
  headers['x-anon-id'] = getOrCreateAnonymousUserId();
  return headers;
}

export interface DreamSymbol {
  name: string;
  category: string;
  archetype_meaning: string;
  culture_tag: string;
  symbol_emotion: string;
}

export interface AnalyzeResponse {
  emotion: string;
  symbols: DreamSymbol[];
  cross_analysis?: string;
  insights?: {
    coreTheme: string;
    interpretation: string;
    actionableAdvice: string[];
  };
  scientific_basis?: {
    confidence: number;
    coreHypothesis: string;
    evidenceMap: Array<{
      observation: string;
      inference: string;
      strength: 'HIGH' | 'MEDIUM' | 'LOW' | string;
    }>;
    limitations: string[];
  };
  immersive_reflection?: string;
  overall_archetype?: string;
}

export interface MatchResponse {
  id: string;
  content: string;
  emotion: string;
  similarity: number;
}

export interface PhysiologicalData {
  heartRate?: number;
  temperature?: number;
}

export interface TarotReadingCard {
  id: string;
  position: number;
  card_code: string;
  card_name: string;
  card_emoji?: string | null;
  is_reversed: boolean;
  upright_meaning: string;
  reversed_meaning: string;
}

export interface TarotReading {
  id: string;
  spread_type: string;
  question?: string | null;
  ai_summary: string;
  ai_interpretation: string;
  advice: string[];
  evidence?: Array<{
    point: string;
    card_basis: string;
    dream_basis: string;
  }>;
  created_at: string;
  cards: TarotReadingCard[];
}

export interface TarotFavorite {
  id: string;
  card_code: string;
  card_name: string;
  card_emoji?: string | null;
  created_at: string;
}

/**
 * 1. 语义解构 API：提取梦境符号与情绪，支持传入生理数据进行交叉验证
 */
export async function analyzeDream(dreamText: string, physiologicalData?: PhysiologicalData): Promise<AnalyzeResponse> {
  const response = await fetch(`${API_BASE_URL}/ai/analyze`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ dreamText, physiologicalData })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to analyze dream');
  }
  
  const data = await response.json();
  return data.data;
}

/**
 * 2. 向量化 (Embedding)：将梦境文本转化为向量并存入数据库
 */
export async function embedDream(dreamText: string, dreamId?: string): Promise<number[]> {
  const response = await fetch(`${API_BASE_URL}/ai/embed`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ dreamText, dreamId })
  });
  
  if (!response.ok) {
    throw new Error('Failed to generate embedding');
  }
  
  const data = await response.json();
  return data.data.embedding;
}

/**
 * 3. 相似梦境匹配：寻找相似的梦境节点
 */
export async function findSimilarDreams(targetEmbedding: number[], topK: number = 5): Promise<MatchResponse[]> {
  const response = await fetch(`${API_BASE_URL}/ai/match`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ targetEmbedding, topK })
  });
  
  if (!response.ok) {
    throw new Error('Failed to find similar dreams');
  }
  
  const data = await response.json();
  return data.data;
}

/**
 * 4. AIGC 绘图：生成梦境画卷
 */
export async function generateDreamImage(prompt: string): Promise<string> {
  const response = await fetch(`${API_BASE_URL}/ai/generate-image`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ prompt })
  });
  
  if (!response.ok) {
    throw new Error('Failed to generate dream image');
  }
  
  const data = await response.json();
  return data.data.imageUrl;
}

/**
 * 5. 获取潜意识词典（从数据库中拉取历史解析的符号）
 */
export async function fetchDreamSymbols(): Promise<{id: string, name: string, universal_meaning: string}[]> {
  const response = await fetch(`${API_BASE_URL}/ai/symbols`, {
    method: 'GET',
    headers: getHeaders()
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch dream symbols');
  }
  
  const data = await response.json();
  return data.data;
}

/**
 * 8. 触发基于 OS (Apple Health/Shortcuts) 的数据拉取/验证
 */
export async function syncOSHealthData(mockData?: any): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/health/os/sync`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(mockData || { 
      heart_rate: 68, 
      sleep_duration: 7.5,
      device_name: 'Apple Health (Web Trigger Mock)'
    })
  });
  
  if (!response.ok) {
    throw new Error('Failed to sync OS health data');
  }
  
  const data = await response.json();
  return data.data;
}

/**
 * 9. 获取华为健康授权链接
 */
export async function getHuaweiAuthUrl(): Promise<{url: string | null, message: string}> {
  const response = await fetch(`${API_BASE_URL}/health/huawei/auth`, {
    method: 'GET',
    headers: getHeaders()
  });
  
  if (!response.ok) {
    throw new Error('Failed to get Huawei auth url');
  }
  
  const data = await response.json();
  return { url: data.url, message: data.message };
}

/**
 * 10. 同步华为健康数据
 */
export async function syncHuaweiHealthData(): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/health/huawei/sync`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({})
  });
  
  if (!response.ok) {
    throw new Error('Failed to sync Huawei health data');
  }
  
  const data = await response.json();
  return data.data;
}

/**
 * 6. 获取小米健康授权链接
 */
export async function getXiaomiAuthUrl(): Promise<{url: string | null, message: string}> {
  const response = await fetch(`${API_BASE_URL}/health/xiaomi/auth`, {
    method: 'GET',
    headers: getHeaders()
  });
  
  if (!response.ok) {
    throw new Error('Failed to get auth url');
  }
  
  const data = await response.json();
  return { url: data.url, message: data.message };
}

/**
 * 7. 同步小米健康数据（心率、睡眠）
 */
export async function syncXiaomiHealthData(): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/health/xiaomi/sync`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({})
  });
  
  if (!response.ok) {
    throw new Error('Failed to sync health data');
  }
  
  const data = await response.json();
  return data.data;
}

/**
 * 8. 获取用户统计数据（梦境数量等）
 */
export async function getUserStats(): Promise<{dreamCount: number, username: string, email: string}> {
  const response = await fetch(`${API_BASE_URL}/health/user/stats`, {
    method: 'GET',
    headers: getHeaders()
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch user stats');
  }
  
  const data = await response.json();
  return data.data;
}

/**
 * 9. 获取用户的所有梦境记录（用于日历和列表）
 */
export async function getUserDreams(): Promise<any[]> {
  const response = await fetch(`${API_BASE_URL}/health/user/dreams`, {
    method: 'GET',
    headers: getHeaders()
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch user dreams');
  }
  
  const data = await response.json();
  return data.data;
}

/**
 * 10. 获取用户当前地理位置的实时温度 (调用免费的天气 API)
 * 注意：为了黑客松演示的稳定性，如果 API 调用失败或用户拒绝定位，将返回一个合理的 mock 值。
 */
export async function fetchLocalTemperature(): Promise<number> {
  return new Promise((resolve) => {
    // 1. 获取地理位置
    if (!navigator.geolocation) {
      console.warn("Geolocation is not supported by this browser.");
      resolve(24.5); // Fallback mock temp
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          // 2. 调用免费的 Open-Meteo API 获取实时温度
          // 不需要 API Key，非常适合黑客松
          const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`);
          
          if (!response.ok) {
            throw new Error('Weather API error');
          }
          
          const data = await response.json();
          resolve(data.current_weather.temperature);
        } catch (error) {
          console.error("Error fetching weather:", error);
          resolve(25.0); // Fallback on network error
        }
      },
      (error) => {
        console.warn("Geolocation error or denied:", error.message);
        resolve(23.5); // Fallback on permission denied
      },
      { timeout: 5000 } // Don't hang forever
    );
  });
}

/**
 * Tarot: draw three cards and get AI interpretation
 */
export async function drawTarot(payload: {
  dreamText?: string;
  emotion?: string;
  question?: string;
  spreadType?: 'three_card';
}): Promise<TarotReading> {
  const response = await fetch(`${API_BASE_URL}/tarot/draw`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to draw tarot');
  }
  const data = await response.json();
  if (!data.success || !data.data) {
    throw new Error(data.message || 'Failed to draw tarot');
  }
  return data.data;
}

/**
 * Tarot: fetch reading history
 */
export async function getTarotHistory(): Promise<TarotReading[]> {
  const response = await fetch(`${API_BASE_URL}/tarot/history`, {
    method: 'GET',
    headers: getHeaders(),
  });
  if (!response.ok) {
    throw new Error('Failed to fetch tarot history');
  }
  const data = await response.json();
  if (!data.success || !Array.isArray(data.data)) {
    throw new Error(data.message || 'Failed to fetch tarot history');
  }
  return data.data;
}

/**
 * Tarot: toggle favorite card
 */
export async function toggleTarotFavorite(card: {
  cardCode: string;
  cardName: string;
  cardEmoji?: string;
}): Promise<{ favorited: boolean }> {
  const response = await fetch(`${API_BASE_URL}/tarot/favorite/toggle`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(card),
  });
  if (!response.ok) {
    throw new Error('Failed to toggle tarot favorite');
  }
  const data = await response.json();
  if (!data.success || !data.data) {
    throw new Error(data.message || 'Failed to toggle tarot favorite');
  }
  return data.data;
}

/**
 * Tarot: fetch favorite cards
 */
export async function getTarotFavorites(): Promise<TarotFavorite[]> {
  const response = await fetch(`${API_BASE_URL}/tarot/favorites`, {
    method: 'GET',
    headers: getHeaders(),
  });
  if (!response.ok) {
    throw new Error('Failed to fetch tarot favorites');
  }
  const data = await response.json();
  if (!data.success || !Array.isArray(data.data)) {
    throw new Error(data.message || 'Failed to fetch tarot favorites');
  }
  return data.data;
}
