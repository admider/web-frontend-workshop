/* ================================================================
   float.js · 浮动模块逻辑（共享浮动图层模型）
   ================================================================ */

import { $, updateStepIndicator } from '../core/utils.js';
import { appState } from '../core/state.js';
import { updateSharedFloatLayer, updateFlowLayerMeta, updateDepthIndicator } from '../components/layer-stack.js';
import { initChallengeUI } from '../components/challenge-ui.js';

const ELEM_W = 76;
const GAP = 20;

/* ================================================================
   更新舞台
   ================================================================ */
function updateStage() {
    const { a, b, c } = appState.float.floats;

    /* ---- 文档流图层 ---- */
    ['a', 'b', 'c'].forEach(key => {
        const el = $(`elem${key.toUpperCase()}_flow`);
        if (el) el.style.display = appState.float.floats[key] === 'none' ? 'flex' : 'none';
    });

    /* ---- 共享浮动图层 ---- */
    const leftGroup = $('floatLeftGroup');
    const rightGroup = $('floatRightGroup');
    if (leftGroup) leftGroup.innerHTML = '';
    if (rightGroup) rightGroup.innerHTML = '';

    const floatingElements = [];
    ['a', 'b', 'c'].forEach(key => {
        const floatVal = appState.float.floats[key];
        if (floatVal === 'none') return;

        const elem = document.createElement('div');
        elem.className = `elem elem-${key} floating`;
        elem.textContent = key.toUpperCase();
        elem.style.opacity = '0';
        elem.style.transform = 'translateZ(-60px) scale(0.8)';

        if (floatVal === 'left') leftGroup?.appendChild(elem);
        else rightGroup?.appendChild(elem);

        floatingElements.push({ key, elem });
    });

    // 触发升起动画
    requestAnimationFrame(() => {
        floatingElements.forEach(({ elem }) => {
            elem.style.transition = 'all 1.1s cubic-bezier(0.34, 1.2, 0.64, 1)';
            elem.style.opacity = '1';
            elem.style.transform = 'translateZ(20px) scale(1)';
        });
    });

    /* ---- 浮动图层显示状态 ---- */
    const floatLayer = $('floatLayer');
    const hasFloating = floatingElements.length > 0;
    floatLayer?.classList.toggle('active', hasFloating);
    if (floatLayer) {
        floatLayer.style.transform = hasFloating ? 'translateZ(140px)' : 'translateZ(0px)';
    }

    /* ---- 文字环绕 ---- */
    const textFlow = $('textFlow');
    if (textFlow) {
        let padLeft = 0;
        let padRight = 0;
        if (a === 'left') padLeft += ELEM_W + GAP;
        if (b === 'left') padLeft += ELEM_W + GAP;
        if (c === 'left') padLeft += ELEM_W + GAP;
        if (a === 'right') padRight += ELEM_W + GAP;
        if (b === 'right') padRight += ELEM_W + GAP;
        if (c === 'right') padRight += ELEM_W + GAP;
        textFlow.style.paddingLeft = padLeft + 'px';
        textFlow.style.paddingRight = padRight + 'px';
    }

    /* ---- 右侧图层栈面板 ---- */
    const floatingKeys = ['a', 'b', 'c'].filter(k => appState.float.floats[k] !== 'none');
    const flowKeys = ['a', 'b', 'c'].filter(k => appState.float.floats[k] === 'none');

    updateSharedFloatLayer({
        cardId: 'cardSharedFloat',
        thumbsId: 'sharedThumbs',
        metaId: 'sharedFloatMeta',
        floatingKeys,
        floats: appState.float.floats
    });

    updateFlowLayerMeta('flowLayerMeta', flowKeys);

    updateDepthIndicator({
        fillId: 'depthFill',
        valueId: 'depthValue',
        zLevel: hasFloating ? 140 : 0
    });

    /* ---- 代码面板 ---- */
    $('codeFloatA') && ($('codeFloatA').textContent = a);
    $('codeFloatB') && ($('codeFloatB').textContent = b);
    $('codeFloatC') && ($('codeFloatC').textContent = c);

    /* ---- 手动控制按钮高亮 ---- */
    document.querySelectorAll('[data-elem]').forEach(btn => {
        const elem = btn.dataset.elem;
        const floatVal = btn.dataset.float;
        btn.classList.toggle('active', floatVal === appState.float.floats[elem]);
    });
    $('ctrlValA') && ($('ctrlValA').textContent = a);
    $('ctrlValB') && ($('ctrlValB').textContent = b);
    $('ctrlValC') && ($('ctrlValC').textContent = c);
}

/* ================================================================
   演示步骤
   ================================================================ */
const steps = [
    {
        hint: '<strong>步骤 1 · 同一图层：</strong>A、B、C 都在<strong>文档流图层</strong>上依次排列。共享浮动图层当前为空。',
        action: () => { appState.float.floats = { a: 'none', b: 'none', c: 'none' }; }
    },
    {
        hint: '<strong>步骤 2 · A 升起：</strong>给 A 设置 <code>float: left</code>。A 从文档流图层<strong>升起</strong>，进入共享浮动图层，并向左侧靠拢。原位置被释放。',
        action: () => { appState.float.floats = { a: 'left', b: 'none', c: 'none' }; }
    },
    {
        hint: '<strong>步骤 3 · 后续元素前移：</strong>A 离开文档流后，B 前移到 A 原来的位置，C 也前移一位。这就是浮动脱离文档流最直接的证据。',
        action: () => { appState.float.floats = { a: 'left', b: 'none', c: 'none' }; }
    },
    {
        hint: '<strong>步骤 4 · B 也升起：</strong>给 B 也设置 <code>float: left</code>。B <strong>升起并进入同一个共享浮动图层</strong>，紧贴在 A 的右侧排列。注意：A 和 B 现在处于<strong>同一层</strong>。',
        action: () => { appState.float.floats = { a: 'left', b: 'left', c: 'none' }; }
    },
    {
        hint: '<strong>步骤 5 · C 也升起：</strong>给 C 也设置 <code>float: left</code>。三个元素现在都处于共享浮动图层上，依次排列在左侧。文档流图层上只剩下文字内容。',
        action: () => { appState.float.floats = { a: 'left', b: 'left', c: 'left' }; }
    }
];

function goToStep(step) {
    if (step < 0 || step >= steps.length) return;
    appState.float.step = step;
    updateStepIndicator('float-stepIndicator', step);
    steps[step].action();
    updateStage();
    const hintBox = $('float-hintBox');
    if (hintBox) hintBox.innerHTML = steps[step].hint;
}

function play() {
    if (appState.float.playing) return;
    appState.float.playing = true;
    goToStep(0);

    appState.float.timer = setInterval(() => {
        if (appState.float.step < steps.length - 1) {
            goToStep(appState.float.step + 1);
        } else {
            clearInterval(appState.float.timer);
            appState.float.timer = null;
            appState.float.playing = false;
        }
    }, 2800);
}

function reset() {
    if (appState.float.timer) {
        clearInterval(appState.float.timer);
        appState.float.timer = null;
    }
    appState.float.playing = false;
    appState.float.floats = { a: 'none', b: 'none', c: 'none' };
    goToStep(0);
}

/* ================================================================
   初始化
   ================================================================ */
export function initFloatModule() {
    $('playBtn')?.addEventListener('click', play);
    $('resetBtn')?.addEventListener('click', reset);
    $('stepBtn')?.addEventListener('click', () => {
        if (appState.float.step < steps.length - 1) {
            goToStep(appState.float.step + 1);
        }
    });

    // 视角切换
    document.querySelectorAll('.view-toggle button').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.view-toggle button').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const scene = $('stageScene');
            if (!scene) return;
            scene.className = btn.dataset.view === 'isometric'
                ? 'stage-scene isometric'
                : 'stage-scene flat';
        });
    });

    // 手动控制
    document.querySelectorAll('[data-elem]').forEach(btn => {
        btn.addEventListener('click', () => {
            const elem = btn.dataset.elem;
            const floatVal = btn.dataset.float;
            appState.float.floats[elem] = floatVal;
            updateStage();
        });
    });

    // 挑战题
    initChallengeUI('float浮动');
	
	// AI 代码诊断导师
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

    // 初始化
    goToStep(0);
}