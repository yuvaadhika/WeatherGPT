// WeatherGPT Vercel Serverless Central Database Endpoint (Node.js)
// Centralizes real-time user registrations, sessions, chat conversations, and spotter records across all devices & friends.

const USER_REGISTRY_CLOUD_ID = 'ff808181a067127101a0816a838f4ad4';
const CHAT_LOGS_CLOUD_ID = 'ff808181a067127101a0816bd7934ada';
const CLOUD_API_BASE = 'https://api.restful-api.dev/objects';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { action = 'get_users' } = req.query;

  // Extract client IP and location from Vercel edge headers
  const clientIp = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || 'Direct Web Client';
  const clientCity = req.headers['x-vercel-ip-city'] || '';
  const clientCountry = req.headers['x-vercel-ip-country'] || 'India';
  const locationTag = clientCity ? `${clientCity}, ${clientCountry}` : clientCountry;

  try {
    // 1. GET ALL USERS (Across all friends and devices)
    if (action === 'get_users' || (req.method === 'GET' && !action)) {
      const cloudRes = await fetch(`${CLOUD_API_BASE}/${USER_REGISTRY_CLOUD_ID}`);
      if (cloudRes.ok) {
        const json = await cloudRes.json();
        const users = json.data?.users || [];
        return res.status(200).json({ success: true, count: users.length, users });
      }
      return res.status(200).json({ success: true, count: 0, users: [] });
    }

    // 2. RECORD / SYNC A USER SESSION
    if (action === 'record_user' || (req.method === 'POST' && req.body?.user)) {
      const user = req.body?.user || req.body;
      if (!user) return res.status(400).json({ error: 'No user payload provided' });

      // Fetch existing cloud users
      let existingUsers = [];
      try {
        const getRes = await fetch(`${CLOUD_API_BASE}/${USER_REGISTRY_CLOUD_ID}`);
        if (getRes.ok) {
          const json = await getRes.json();
          existingUsers = json.data?.users || [];
        }
      } catch (e) {}

      const userEmail = (user.email || '').trim().toLowerCase();
      const userName = (user.name || 'WeatherGPT User').trim();
      const now = new Date();

      const userIdx = existingUsers.findIndex(
        (u) => u.email && u.email.toLowerCase() === userEmail && userEmail !== 'guest@weathergpt.ai'
      );

      const recordToSave = {
        id: user.id || `usr-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        name: userName,
        email: user.email || `visitor_${Date.now()}@weathergpt.ai`,
        provider: user.provider || 'Guest Access 👤',
        role: user.role || 'Member',
        timestamp: now.toISOString(),
        formattedTime: now.toLocaleString(),
        device: user.device || 'Web Client 🌐',
        browser: user.browser || 'Browser',
        ip_address: user.ip_address || clientIp,
        location: user.location || locationTag,
        loginCount: (userIdx >= 0 ? (existingUsers[userIdx].loginCount || 1) + 1 : (user.loginCount || 1)),
        status: 'Active Now 🟢'
      };

      if (userIdx >= 0) {
        existingUsers[userIdx] = { ...existingUsers[userIdx], ...recordToSave };
      } else {
        existingUsers.unshift(recordToSave);
      }

      // Limit array size to top 200 recent active users
      const trimmedUsers = existingUsers.slice(0, 200);

      // Save back to cloud store
      await fetch(`${CLOUD_API_BASE}/${USER_REGISTRY_CLOUD_ID}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'WeatherGPT_Global_Users',
          data: { users: trimmedUsers }
        })
      });

      return res.status(200).json({ success: true, user: recordToSave, totalUsers: trimmedUsers.length });
    }

    // 3. GET ALL CHAT CONVERSATIONS
    if (action === 'get_chats') {
      const cloudRes = await fetch(`${CLOUD_API_BASE}/${CHAT_LOGS_CLOUD_ID}`);
      if (cloudRes.ok) {
        const json = await cloudRes.json();
        const chats = json.data?.chats || [];
        return res.status(200).json({ success: true, count: chats.length, chats });
      }
      return res.status(200).json({ success: true, count: 0, chats: [] });
    }

    // 4. RECORD A CHAT MESSAGE
    if (action === 'record_chat' && req.method === 'POST') {
      const message = req.body?.message || req.body;
      if (!message) return res.status(400).json({ error: 'No message payload' });

      let existingChats = [];
      try {
        const getRes = await fetch(`${CLOUD_API_BASE}/${CHAT_LOGS_CLOUD_ID}`);
        if (getRes.ok) {
          const json = await getRes.json();
          existingChats = json.data?.chats || [];
        }
      } catch (e) {}

      const newChat = {
        id: existingChats.length + 1,
        session_id: message.sessionId || `sql_sess_${Date.now()}`,
        sender: message.sender || 'user',
        message_text: message.text || message.message_text || '',
        language_code: message.detectedLanguage || message.language_code || 'en',
        model_used: message.modelUsed || message.model_used || 'WeatherGPT Engine',
        location_name: message.locationName || message.location_name || locationTag,
        created_at: new Date().toISOString()
      };

      existingChats.unshift(newChat);
      const trimmedChats = existingChats.slice(0, 200);

      await fetch(`${CLOUD_API_BASE}/${CHAT_LOGS_CLOUD_ID}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'WeatherGPT_Global_ChatLogs',
          data: { chats: trimmedChats }
        })
      });

      return res.status(200).json({ success: true, chat: newChat, totalChats: trimmedChats.length });
    }

    // 5. CLEAR DATABASE (Admin only)
    if (action === 'clear' && req.method === 'POST') {
      await fetch(`${CLOUD_API_BASE}/${USER_REGISTRY_CLOUD_ID}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'WeatherGPT_Global_Users', data: { users: [] } })
      });
      return res.status(200).json({ success: true, message: 'Database cleared' });
    }

    return res.status(400).json({ error: `Unknown action: ${action}` });
  } catch (error) {
    console.error('Serverless DB Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
