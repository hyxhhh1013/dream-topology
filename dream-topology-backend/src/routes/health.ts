import { Hono } from 'hono';
import * as dotenv from 'dotenv';
import { prisma } from '../index'; // Add prisma import

dotenv.config();

const healthRouter = new Hono();

// Helper to get userId from header or fallback
function getUserId(c: any): string {
  const headerUserId = c.req.header('x-user-id')?.trim();
  if (headerUserId) return headerUserId;
  const anonId = c.req.header('x-anon-id')?.trim();
  if (anonId) return anonId;
  return `anon_${Date.now()}`;
}

// 8. Get user's dream records for calendar
healthRouter.get('/user/dreams', async (c) => {
  try {
    const userId = getUserId(c);
    
    const records = await prisma.dreamRecord.findMany({
      where: { 
        user_id: userId,
        deleted_at: null 
      },
      orderBy: {
        recorded_at: 'desc'
      },
      select: {
        id: true,
        content: true,
        emotion: true,
        recorded_at: true,
        dream_symbols: {
          include: {
            dream_symbol: true
          }
        }
      }
    });

    // Format for frontend consumption
    const formattedRecords = records.map(record => {
      let title = "未命名梦境";
      let tags: string[] = [];
      
      // Extract tags from relations
      if (record.dream_symbols && record.dream_symbols.length > 0) {
        tags = record.dream_symbols.map(ds => ds.dream_symbol.name).slice(0, 3);
        title = tags[0] ? `关于${tags[0]}的梦` : title;
      }
      
      // Default title
      if (title === "未命名梦境" && record.content) {
         title = record.content.substring(0, 10) + "...";
      }

      return {
        id: record.id,
        date: record.recorded_at.toISOString(),
        time: record.recorded_at.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
        title,
        content: record.content,
        emotion: record.emotion?.toLowerCase() || 'neutral',
        tags,
        crossAnalysis: "暂无交叉分析数据"
      };
    });

    return c.json({
      success: true,
      data: formattedRecords
    });
  } catch (error) {
    console.error('Error fetching user dreams:', error);
    return c.json({ success: false, message: "Failed to fetch dreams", data: [] });
  }
});

// ==========================================
// 方案一：基于 iOS 快捷指令 (Apple Health) / OS 级中枢 的接口
// ==========================================

// 接收来自 iOS 快捷指令 POST 过来的健康数据
healthRouter.post('/os/sync', async (c) => {
  try {
    const body = await c.req.json();
    
    // 快捷指令传来的数据结构示例
    const { 
      heart_rate, 
      sleep_duration, 
      device_name = 'Apple Health / Shortcuts',
      timestamp = new Date().toISOString()
    } = body;

    console.log(`[Health Sync] Received data via Shortcuts: HR ${heart_rate}bpm, Sleep ${sleep_duration}h`);

    // 在真实的数据库逻辑中，你会根据 userId 将这些数据存入 PhysiologicalData 表，
    // 并在用户创建下一条 DreamRecord 时自动关联。
    
    return c.json({ 
      success: true, 
      message: "iOS 健康数据接收成功！",
      data: {
        rem_heart_rate: heart_rate || 72, // 如果没传，给个默认值
        room_temperature: 24.5, // 快捷指令较难获取室温，这里 Mock
        device_source: device_name,
        raw_health_data: JSON.stringify(body)
      }
    });

  } catch (error) {
    console.error("Error parsing health data from Shortcuts:", error);
    return c.json({ success: false, message: "数据格式错误" }, 400);
  }
});


// ==========================================
// 方案二：基于各厂商云端开放平台 API (如小米)
// ==========================================

// 1. 获取小米 OAuth 授权链接
healthRouter.get('/xiaomi/auth', (c) => {
  const clientId = process.env.XIAOMI_CLIENT_ID;
  
  // 【黑客松 Mock 逻辑】：如果没有配置真实的 Client ID，直接返回一个模拟的授权链接
  if (!clientId) {
    return c.json({ 
      success: true, 
      url: null, // 告诉前端直接走 Mock 流程，不需要真跳转
      message: '进入黑客松 Mock 授权模式' 
    });
  }

  // 真实业务逻辑：重定向到小米开放平台授权页面
  const redirectUri = encodeURIComponent(`${process.env.FRONTEND_URL}/sync-callback`);
  const authUrl = `https://account.xiaomi.com/oauth2/authorize?client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}&scope=1 3`; // scope=1(个人信息) 3(运动健康)
  
  return c.json({ success: true, url: authUrl });
});

// 2. 拉取小米健康数据 (睡眠、心率)
healthRouter.post('/xiaomi/sync', async (c) => {
  const clientId = process.env.XIAOMI_CLIENT_ID;

  // 【黑客松 Mock 逻辑】：如果没有配置真实环境，生成随机的真实感数据返回
  if (!clientId) {
    // 模拟一段网络延迟，增加真实感
    await new Promise(resolve => setTimeout(resolve, 1500));

    const mockData = {
      rem_heart_rate: Math.floor(Math.random() * (85 - 65 + 1)) + 65, // 65-85 bpm
      room_temperature: (Math.random() * (28 - 22) + 22).toFixed(1), // 22.0 - 28.0 °C
      device_source: 'xiaomi_band',
      raw_health_data: JSON.stringify({
        sleep_stage: "REM",
        duration: 120,
        deep_sleep: 180,
        light_sleep: 200,
        awake: 10
      })
    };

    return c.json({ 
      success: true, 
      data: mockData, 
      message: "小米健康数据同步成功 (Mock)" 
    });
  }

  // ==== 以下为真实对接小米 API 的参考代码（需具备企业资质和 API 权限） ====
  /*
  const { code } = await c.req.json();
  
  // 1. 用 code 换取 access_token
  const tokenResponse = await fetch(`https://account.xiaomi.com/oauth2/token?client_id=${clientId}&client_secret=${process.env.XIAOMI_CLIENT_SECRET}&grant_type=authorization_code&redirect_uri=${redirectUri}&code=${code}`);
  const tokenData = await tokenResponse.json();
  const accessToken = tokenData.access_token;

  // 2. 请求小米开放平台健康 API 获取昨晚睡眠数据
  const healthResponse = await fetch(`https://openapi.xiaomi.com/v1/health/sleep`, {
    headers: { 'Authorization': `Bearer ${accessToken}` }
  });
  const healthData = await healthResponse.json();

  // 3. 将数据存入你的 Prisma 数据库...
  // await prisma.physiologicalData.create({ ... })
  */

  return c.json({ success: false, message: "真实 API 尚未实现，请配置正确参数" }, 500);
});

// 7. Get user's dream count
healthRouter.get('/user/stats', async (c) => {
  try {
    const userId = getUserId(c);
    
    // Check if user exists, if not create a default one for the hackathon demo
    let user = await prisma.user.findFirst({
      where: { id: userId }
    });

    if (!user) {
      // Create dynamically based on requested ID
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

    const dreamCount = await prisma.dreamRecord.count({
      where: { 
        user_id: user.id,
        deleted_at: null 
      }
    });

    return c.json({
      success: true,
      data: {
        dreamCount,
        username: user.name || `Dreamer_${user.id.slice(-4)}`,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    return c.json({ success: false, message: "Failed to fetch stats", data: { dreamCount: 0, username: 'Unknown User', email: '' } });
  }
});

// ==========================================
// 方案三：华为运动健康开放平台 (Health Kit)
// ==========================================

// 1. 获取华为 OAuth 授权链接
healthRouter.get('/huawei/auth', (c) => {
  const clientId = process.env.HUAWEI_CLIENT_ID;
  
  // 【黑客松 Mock 逻辑】
  if (!clientId) {
    return c.json({ 
      success: true, 
      url: null,
      message: '进入黑客松 Mock 授权模式 (华为)' 
    });
  }

  // 真实业务逻辑：重定向到华为账号登录授权页面
  const redirectUri = encodeURIComponent(`${process.env.FRONTEND_URL}/sync-callback-huawei`);
  const authUrl = `https://oauth-login.cloud.huawei.com/oauth2/v3/authorize?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&scope=https://www.huawei.com/health/ext/sleep.read`;
  
  return c.json({ success: true, url: authUrl });
});

// 2. 拉取华为健康数据
healthRouter.post('/huawei/sync', async (c) => {
  const clientId = process.env.HUAWEI_CLIENT_ID;

  // 【黑客松 Mock 逻辑】
  if (!clientId) {
    await new Promise(resolve => setTimeout(resolve, 1800));

    const mockData = {
      rem_heart_rate: Math.floor(Math.random() * (80 - 60 + 1)) + 60, // 60-80 bpm
      room_temperature: (Math.random() * (27 - 21) + 21).toFixed(1), // 21.0 - 27.0 °C
      device_source: 'huawei_watch',
      raw_health_data: JSON.stringify({
        sleep_stage: "REM",
        rem_duration: 110,
        deep_sleep: 160,
        light_sleep: 210,
        nap_count: 1
      })
    };

    return c.json({ 
      success: true, 
      data: mockData, 
      message: "华为健康数据同步成功 (Mock)" 
    });
  }

  return c.json({ success: false, message: "真实 API 尚未实现，请配置正确参数" }, 500);
});

export default healthRouter;
