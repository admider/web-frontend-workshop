/* ================================================================
   ai-assistant.js · 全局 AI 智学伴悬浮组件
   ================================================================ */

// ⚠️ 请将这里替换为你刚刚申请的 API Key
const API_KEY = 'sk-906a58dd3a4e4271ae766af69f12e11b';

export function initAIAssistant() {
    // 1. 注入 HTML
    const div = document.createElement('div');
    div.innerHTML = `
        <div id="ai-fab" class="ai-fab">🤖</div>
        <div id="ai-panel" class="ai-panel">
            <div class="ai-header">
                <span>🤖 AI 智学伴</span>
                <button id="ai-close">✕</button>
            </div>
            <div class="ai-messages" id="ai-messages">
                <div class="ai-msg ai-msg-bot">你好！我是 CSS 原理工坊的 AI 助手。遇到不懂的代码或概念，随时问我哦！</div>
            </div>
            <div class="ai-input-area">
                <input type="text" id="ai-input" placeholder="例如：为什么 margin 会合并？">
                <button id="ai-send">发送</button>
            </div>
        </div>
    `;
    document.body.appendChild(div);

    // 2. 注入 CSS
    const style = document.createElement('style');
    style.textContent = `
        .ai-fab {
            position: fixed; right: 30px; bottom: 40px; width: 56px; height: 56px;
            background: linear-gradient(135deg, #06b6d4, #3b82f6); border-radius: 50%;
            display: flex; align-items: center; justify-content: center; font-size: 24px;
            color: white; cursor: pointer; box-shadow: 0 4px 12px rgba(59,130,246,0.4);
            z-index: 9999; transition: transform 0.2s;
        }
        .ai-fab:hover { transform: scale(1.1); }
        .ai-panel {
            position: fixed; right: 30px; bottom: 110px; width: 340px; height: 480px;
            background: #1e293b; border: 1px solid #334155; border-radius: 12px;
            display: none; flex-direction: column; z-index: 9999;
            box-shadow: 0 10px 30px rgba(0,0,0,0.5); overflow: hidden;
        }
        .ai-panel.active { display: flex; }
        .ai-header {
            padding: 12px 16px; background: #0f172a; border-bottom: 1px solid #334155;
            display: flex; justify-content: space-between; align-items: center; color: #f1f5f9; font-weight: bold;
        }
        .ai-header button { background: none; border: none; color: #94a3b8; cursor: pointer; font-size: 16px; }
        .ai-messages { flex: 1; padding: 16px; overflow-y: auto; display: flex; flex-direction: column; gap: 12px; }
        .ai-msg { padding: 10px 14px; border-radius: 8px; font-size: 13px; line-height: 1.6; max-width: 90%; }
        .ai-msg-bot { background: #334155; color: #e2e8f0; align-self: flex-start; border-bottom-left-radius: 2px; }
        .ai-msg-user { background: #3b82f6; color: white; align-self: flex-end; border-bottom-right-radius: 2px; }
        .ai-input-area { padding: 12px; border-top: 1px solid #334155; display: flex; gap: 8px; }
        .ai-input-area input {
            flex: 1; padding: 10px; background: #0f172a; border: 1px solid #334155;
            border-radius: 6px; color: white; outline: none;
        }
        .ai-input-area input:focus { border-color: #06b6d4; }
        .ai-input-area button {
            padding: 0 16px; background: #06b6d4; color: #0f172a; border: none;
            border-radius: 6px; font-weight: bold; cursor: pointer;
        }
        .ai-input-area button:disabled { opacity: 0.5; cursor: not-allowed; }
    `;
    document.head.appendChild(style);

    // 3. 交互逻辑
    const fab = document.getElementById('ai-fab');
    const panel = document.getElementById('ai-panel');
    const closeBtn = document.getElementById('ai-close');
    const input = document.getElementById('ai-input');
    const sendBtn = document.getElementById('ai-send');
    const messages = document.getElementById('ai-messages');

    fab.addEventListener('click', () => panel.classList.add('active'));
    closeBtn.addEventListener('click', () => panel.classList.remove('active'));

    async function askAI() {
        const text = input.value.trim();
        if (!text) return;

        // 显示用户消息
        appendMsg(text, 'user');
        input.value = '';
        sendBtn.disabled = true;

        // 显示加载中
        const loadingMsg = appendMsg('思考中...', 'bot');

        try {
            const res = await fetch('https://api.deepseek.com/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${API_KEY}`
                },
                body: JSON.stringify({
                    model: 'deepseek-chat',
                    messages: [
                        { role: 'system', content: '你是一个Web前端(CSS/HTML)教学专家。请用简练、生动、适合大学生的语言，解答用户的问题。尽量结合实际例子。' },
                        { role: 'user', content: text }
                    ]
                })
            });

            const data = await res.json();
            const reply = data.choices[0].message.content;
            
            // 渲染 Markdown 并替换 loading
            loadingMsg.innerHTML = reply.replace(/\n/g, '<br>').replace(/`(.*?)`/g, '<code>$1</code>');
            
        } catch (error) {
            loadingMsg.textContent = '😢 网络开小差了，请稍后再试。';
            console.error(error);
        } finally {
            sendBtn.disabled = false;
        }
    }

    function appendMsg(text, type) {
        const msg = document.createElement('div');
        msg.className = `ai-msg ai-msg-${type}`;
        msg.innerHTML = text;
        messages.appendChild(msg);
        messages.scrollTop = messages.scrollHeight;
        return msg;
    }

    sendBtn.addEventListener('click', askAI);
    input.addEventListener('keypress', (e) => { if (e.key === 'Enter') askAI(); });
}