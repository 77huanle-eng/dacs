/* ============================================= */
/*  AI Chat Widget - Floating Chat Component     */
/* ============================================= */
import { apiPost } from './core/api.js';

const CHAT_HISTORY_KEY = 'vht_chat_history';

function getChatHistory() {
  try { return JSON.parse(localStorage.getItem(CHAT_HISTORY_KEY) || '[]'); }
  catch { return []; }
}

function saveChatHistory(msgs) {
  try { localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(msgs.slice(-50))); }
  catch { /* ignore */ }
}

function createChatWidget() {
  if (document.getElementById('ai-chat-fab')) return;

  const fab = document.createElement('button');
  fab.id = 'ai-chat-fab';
  fab.className = 'ai-chat-fab';
  fab.innerHTML = '<i class="bi bi-chat-dots-fill"></i>';
  fab.title = 'Chat với AI';

  const panel = document.createElement('div');
  panel.id = 'ai-chat-panel';
  panel.className = 'ai-chat-panel';
  panel.innerHTML = `
    <div class="ai-chat-header">
      <h6><i class="bi bi-robot"></i> Trợ lý Viet Horizon</h6>
      <button id="ai-chat-close" style="border:none;background:none;font-size:1.2rem;cursor:pointer;"><i class="bi bi-x-lg"></i></button>
    </div>
    <div class="ai-chat-messages" id="ai-chat-messages"></div>
    <div class="ai-chat-input">
      <input type="text" id="ai-chat-input" placeholder="Nhập câu hỏi..." autocomplete="off">
      <button id="ai-chat-send"><i class="bi bi-send-fill"></i></button>
    </div>
  `;

  document.body.appendChild(fab);
  document.body.appendChild(panel);

  const messagesEl = document.getElementById('ai-chat-messages');
  const inputEl = document.getElementById('ai-chat-input');
  const sendBtn = document.getElementById('ai-chat-send');
  const closeBtn = document.getElementById('ai-chat-close');
  let isOpen = false;

  // Load history
  const history = getChatHistory();
  if (history.length === 0) {
    addMessage('bot', 'Xin chào! 👋 Tôi là trợ lý du lịch Viet Horizon. Bạn cần tôi giúp gì?');
  } else {
    history.forEach(m => addMessage(m.role, m.text, false));
  }

  function addMessage(role, text, save = true) {
    const div = document.createElement('div');
    div.className = `ai-msg ${role}`;
    div.textContent = text;
    messagesEl.appendChild(div);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    if (save) {
      const msgs = getChatHistory();
      msgs.push({ role, text });
      saveChatHistory(msgs);
    }
  }

  function showTyping() {
    const div = document.createElement('div');
    div.className = 'ai-msg bot ai-typing-msg';
    div.innerHTML = '<div class="ai-typing"><span></span><span></span><span></span></div>';
    messagesEl.appendChild(div);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    return div;
  }

  async function sendMessage() {
    const text = inputEl.value.trim();
    if (!text) return;
    inputEl.value = '';
    addMessage('user', text);

    const typing = showTyping();
    try {
      const res = await apiPost('/chat', { message: text });
      typing.remove();
      const reply = res?.reply || res?.data?.reply || 'Xin lỗi, tôi không thể trả lời lúc này.';
      addMessage('bot', reply);
    } catch (err) {
      typing.remove();
      addMessage('bot', 'Có lỗi xảy ra. Vui lòng thử lại sau.');
    }
  }

  fab.addEventListener('click', () => {
    isOpen = !isOpen;
    panel.classList.toggle('active', isOpen);
    fab.innerHTML = isOpen ? '<i class="bi bi-x-lg"></i>' : '<i class="bi bi-chat-dots-fill"></i>';
    if (isOpen) inputEl.focus();
  });

  closeBtn.addEventListener('click', () => {
    isOpen = false;
    panel.classList.remove('active');
    fab.innerHTML = '<i class="bi bi-chat-dots-fill"></i>';
  });

  sendBtn.addEventListener('click', sendMessage);
  inputEl.addEventListener('keydown', e => { if (e.key === 'Enter') sendMessage(); });
}

export function initAiChatWidget() {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createChatWidget);
  } else {
    createChatWidget();
  }
}
