/* ================================================================
   challenge-ui.js · 全局挑战模式 UI 生成器（完美复刻盒子模型版）
   ================================================================ */
import { ChallengeSet } from './challenge.js';

export function initChallengeUI(moduleName, containerId) {
    // 防止重复注入
    if (document.getElementById('global-mode-switcher')) return;

    const mainContent = document.querySelector('.main-content');
    if (!mainContent) return;

    // 1. 把原本 mainContent 里的所有内容（除了侧边栏）包进一个演示面板
    const originalNodes = Array.from(mainContent.children);
    const demoPanel = document.createElement('div');
    demoPanel.className = 'panel active';
    demoPanel.id = 'global-panel-demo';
    
    originalNodes.forEach(node => {
        // 过滤掉一些脚本或已经注入过的节点
        if (node.tagName !== 'SCRIPT' && node.id !== 'global-mode-switcher') {
            demoPanel.appendChild(node);
        }
    });

    // 2. 创建挑战面板
    const challengePanel = document.createElement('div');
    challengePanel.className = 'panel';
    challengePanel.id = 'global-panel-challenge';
    
    // 如果没传 containerId，就默认用 moduleName 造一个
    const targetContainerId = containerId || `challenge-container-${moduleName.replace(/\s+/g, '')}`;
    
    challengePanel.innerHTML = `
        <div class="concept-card">
            <h2>${moduleName} · AI 自适应挑战</h2>
            <p>AI 会根据你的历史表现，动态生成不同难度的题目。</p>
        </div>
        <div id="${targetContainerId}"></div>
    `;

    // 3. 创建顶部切换栏（完全复刻盒子模型）
    const modeSwitcher = document.createElement('div');
    modeSwitcher.className = 'mode-switcher';
    modeSwitcher.id = 'global-mode-switcher';
    modeSwitcher.style.marginBottom = '24px';
    modeSwitcher.innerHTML = `
        <button class="mode-btn active" data-mode="demo">🎬 演示模式</button>
        <button class="mode-btn" data-mode="challenge">🎯 挑战模式</button>
    `;

    // 4. 重新组装 DOM
    mainContent.innerHTML = ''; // 清空原有内容
    mainContent.appendChild(modeSwitcher); // 放入切换栏
    mainContent.appendChild(demoPanel);    // 放入演示区
    mainContent.appendChild(challengePanel); // 放入挑战区

    // 5. 绑定切换事件（和盒子模型的逻辑一模一样）
    modeSwitcher.querySelectorAll('.mode-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            modeSwitcher.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            document.querySelectorAll('#global-panel-demo, #global-panel-challenge').forEach(p => p.classList.remove('active'));
            const targetId = 'global-panel-' + btn.dataset.mode;
            document.getElementById(targetId)?.classList.add('active');
        });
    });

    // 6. 实例化 AI 挑战题库
    const challengeSet = new ChallengeSet(targetContainerId, moduleName);
    challengeSet.render();
}