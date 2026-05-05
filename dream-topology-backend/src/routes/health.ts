import { Hono } from 'hono';
import { prisma } from '../index';
import { config } from '../lib/config';
import { getUserId } from '../middleware/auth';

const healthRouter = new Hono();

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
        cross_analysis: true,
        dream_symbols: {
          include: {
            dream_symbol: true
          }
        }
      }
    });

    // Format for frontend consumption
    const formattedRecords = records.map((record: any) => {
      let title = "未命名梦境";
      let tags: string[] = [];

      // Extract tags from relations
      if (record.dream_symbols && record.dream_symbols.length > 0) {
        tags = record.dream_symbols.map((ds: any) => ds.dream_symbol.name).slice(0, 3);
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
        crossAnalysis: record.cross_analysis || ''
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

    const {
      heart_rate,
      sleep_duration,
      device_name = 'Apple Health / Shortcuts',
      timestamp = new Date().toISOString()
    } = body;

    console.log(`[Health Sync] Received data via Shortcuts: HR ${heart_rate}bpm, Sleep ${sleep_duration}h`);

    return c.json({
      success: true,
      message: "iOS 健康数据接收成功！",
      data: {
        rem_heart_rate: heart_rate || 72,
        room_temperature: 24.5,
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
  const clientId = config.XIAOMI_CLIENT_ID;

  if (!clientId) {
    return c.json({
      success: true,
      url: null,
      message: '进入黑客松 Mock 授权模式'
    });
  }

  const redirectUri = encodeURIComponent(`${config.FRONTEND_ORIGIN}/sync-callback`);
  const authUrl = `https://account.xiaomi.com/oauth2/authorize?client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}&scope=1 3`;

  return c.json({ success: true, url: authUrl });
});

// 2. 拉取小米健康数据 (睡眠、心率)
healthRouter.post('/xiaomi/sync', async (c) => {
  const clientId = config.XIAOMI_CLIENT_ID;

  if (!clientId) {
    await new Promise(resolve => setTimeout(resolve, 1500));

    const mockData = {
      rem_heart_rate: Math.floor(Math.random() * (85 - 65 + 1)) + 65,
      room_temperature: (Math.random() * (28 - 22) + 22).toFixed(1),
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

  return c.json({ success: false, message: "真实 API 尚未实现，请配置正确参数" }, 500);
});

// 7. Get user's dream count
healthRouter.get('/user/stats', async (c) => {
  try {
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
  const clientId = config.HUAWEI_CLIENT_ID;

  if (!clientId) {
    return c.json({
      success: true,
      url: null,
      message: '进入黑客松 Mock 授权模式 (华为)'
    });
  }

  const redirectUri = encodeURIComponent(`${config.FRONTEND_ORIGIN}/sync-callback-huawei`);
  const authUrl = `https://oauth-login.cloud.huawei.com/oauth2/v3/authorize?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&scope=https://www.huawei.com/health/ext/sleep.read`;

  return c.json({ success: true, url: authUrl });
});

// 2. 拉取华为健康数据
healthRouter.post('/huawei/sync', async (c) => {
  const clientId = config.HUAWEI_CLIENT_ID;

  if (!clientId) {
    await new Promise(resolve => setTimeout(resolve, 1800));

    const mockData = {
      rem_heart_rate: Math.floor(Math.random() * (80 - 60 + 1)) + 60,
      room_temperature: (Math.random() * (27 - 21) + 21).toFixed(1),
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
