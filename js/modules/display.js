/* ================================================================
   display.js · Display 类型独立模块（含实时代码）
   ================================================================ */

import { $ } from '../core/utils.js';
import { initChallengeUI } from '../components/challenge-ui.js';

const displayStates = {
    1: { display: 'block',        width: 200, height: 60 },
    2: { display: 'inline',       width: 200, height: 60 },
    3: { display: 'inline-block', width: 200, height: 60 }
};

/* 当前代码标签页：'css' | 'html' */
let currentCodeTab = 'css';

function renderCode(code) {
    let html = code
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    html = html.replace(/(&lt;\/?)([a-z0-9]+)/g, '$1<span class="tag">$2</span>');
    html = html.replace(/([a-z-]+)=(&quot;.*?&quot;)/g, '<span class="prop">$1</span>=<span class="val">$2</span>');
    return `<pre>${html}</pre>`;
}

function updateLiveCode() {
    const codeBox = $('displayLiveCode');
    if (!codeBox) return;

    if (currentCodeTab === 'css') {
        const lines = ['.item-1, .item-2, .item-3 { /* 基础样式 */ }'];
        lines.push('');
        [1, 2, 3].forEach(i => {
            const s = displayStates[i];
            lines.push(`.item-${i} {`);
            lines.push(`  display: ${s.display};`);
            if (s.display !== 'inline') {
                lines.push(`  width: ${s.width}px;`);
                lines.push(`  height: ${s.height}px;`);
            } else {
                lines.push(`  /* inline 不支持设置宽高 */`);
            }
            if (s.display === 'flex') {
                lines.push(`  align-items: center;`);
                lines.push(`  justify-content: center;`);
            }
            if (s.display === 'grid') {
                lines.push(`  place-items: center;`);
            }
            lines.push(`}`);
            lines.push('');
        });
        codeBox.innerHTML = renderCode(lines.join('\n').trim());
    } else {
        const lines = [
            '<!-- 三个元素，可通过 CSS 改变 display -->',
            '<div class="item-1">div 标签</div>',
            '<span class="item-2">span 标签</span>',
            '<img class="item-3" src="..." alt="img 标签">'
        ];
        codeBox.innerHTML = renderCode(lines.join('\n'));
    }
}

function applyDisplay() {
    [1, 2, 3].forEach(i => {
        const item = $(`displayItem${i}`);
        if (!item) return;
        const s = displayStates[i];

        item.classList.remove('display-block', 'display-inline', 'display-inline-block',
                              'display-flex', 'display-grid');
        item.style.cssText = '';

        if (s.display === 'block') {
            item.classList.add('display-block');
            item.style.width = s.width + 'px';
            item.style.height = s.height + 'px';
        } else if (s.display === 'inline') {
            item.classList.add('display-inline');
        } else if (s.display === 'inline-block') {
            item.classList.add('display-inline-block');
            item.style.width = s.width + 'px';
            item.style.height = s.height + 'px';
        } else if (s.display === 'flex') {
            item.classList.add('display-flex');
            item.style.width = s.width + 'px';
            item.style.height = s.height + 'px';
            item.style.display = 'flex';
            item.style.alignItems = 'center';
            item.style.justifyContent = 'center';
        } else if (s.display === 'grid') {
            item.classList.add('display-grid');
            item.style.width = s.width + 'px';
            item.style.height = s.height + 'px';
            item.style.display = 'grid';
            item.style.placeItems = 'center';
        }

        $(`displayTextValue${i}`) && ($(`displayTextValue${i}`).textContent = `display: ${s.display}`);
        $(`valDisplay${i}`) && ($(`valDisplay${i}`).textContent = s.display);

        const wSlider = document.querySelector(`[data-display-w="${i}"]`);
        const hSlider = document.querySelector(`[data-display-h="${i}"]`);

        if (s.display === 'inline') {
            $(`valDisplayW${i}`) && ($(`valDisplayW${i}`).textContent = '不可设');
            $(`valDisplayH${i}`) && ($(`valDisplayH${i}`).textContent = '不可设');
            if (wSlider) wSlider.disabled = true;
            if (hSlider) hSlider.disabled = true;
        } else {
            $(`valDisplayW${i}`) && ($(`valDisplayW${i}`).textContent = s.width + 'px');
            $(`valDisplayH${i}`) && ($(`valDisplayH${i}`).textContent = s.height + 'px');
            if (wSlider) wSlider.disabled = false;
            if (hSlider) hSlider.disabled = false;
        }
    });

    updateLiveCode();
}

export function initDisplayModule() {
    /* display 切换按钮 */
    document.querySelectorAll('[data-display-target]').forEach(btn => {
        btn.addEventListener('click', () => {
            const target = btn.dataset.displayTarget;
            document.querySelectorAll(`[data-display-target="${target}"]`).forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            displayStates[target].display = btn.dataset.displayValue;
            applyDisplay();
        });
    });

    /* 宽高滑块 */
    [1, 2, 3].forEach(i => {
        document.querySelector(`[data-display-w="${i}"]`)?.addEventListener('input', e => {
            displayStates[i].width = parseInt(e.target.value, 10);
            applyDisplay();
        });
        document.querySelector(`[data-display-h="${i}"]`)?.addEventListener('input', e => {
            displayStates[i].height = parseInt(e.target.value, 10);
            applyDisplay();
        });
    });

    /* 代码标签切换 */
    document.querySelectorAll('[data-code-tab]').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('[data-code-tab]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentCodeTab = btn.dataset.codeTab;
            updateLiveCode();
        });
    });
	
	document.getElementById('ai-check-btn')?.addEventListener('click', async function() {
	    const code = document.getElementById('ai-code-input').value;
	    if (!code) return;
	    const resultBox = document.getElementById('ai-check-result');
	    resultBox.innerHTML = 'AI 导师正在阅读你的代码...';
	    this.disabled = true;
	
	    try {
	        const res = await fetch('https://api.deepseek.com/chat/completions', {
	            method: 'POST',
	            headers: {
	                'Content-Type': 'application/json',
	                'Authorization': 'Bearer sk-906a58dd3a4e4271ae766af69f12e11b'
	            },
	            body: JSON.stringify({
	                model: 'deepseek-chat',
	                messages: [
	                    { role: 'system', content: '你是一个严苛但耐心的前端导师。请指出用户CSS代码中的潜在问题（如盒子尺寸溢出、margin合并等），给出修改后的代码，并用简短的话解释原因。' },
	                    { role: 'user', content: code }
	                ]
	            })
	        });
	        const data = await res.json();
	        resultBox.innerHTML = `<div style="background: rgba(6,182,212,0.1); padding: 10px; border-left: 3px solid var(--accent-cyan); border-radius: 4px;">${data.choices[0].message.content.replace(/\n/g, '<br>')}</div>`;
	    } catch(e) {
	        resultBox.textContent = '网络错误，请重试。';
	    } finally {
	        this.disabled = false;
	    }
	});

    applyDisplay();
	
	initChallengeUI('display');
}