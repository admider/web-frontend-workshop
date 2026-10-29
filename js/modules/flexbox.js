/* ================================================================
   flexbox.js · Flexbox 弹性盒子布局独立模块
   ================================================================ */

import { $, bindToggle } from '../core/utils.js';
import { initSlider } from '../components/slider.js';
import { initChallengeUI } from '../components/challenge-ui.js';

/* ================================================================
   状态管理
   ================================================================ */
const flexState = {
    display: 'flex',
    count: 3,
    dir: 'row',
    wrap: 'nowrap',
    justify: 'flex-start',
    align: 'center',
    alignContent: 'flex-start',
    gap: 20,
    enableItemsFlex: false, // 新增：是否开启子项的 flex 分配
    items: [
        { flex: 1, order: 0 },
        { flex: 2, order: 0 },
        { flex: 1, order: 0 }
    ],
    isPlaying: false
};

const FLEX_COLORS = [
    'linear-gradient(135deg, #3b82f6, #2563eb)',
    'linear-gradient(135deg, #10b981, #059669)',
    'linear-gradient(135deg, #f59e0b, #d97706)',
    'linear-gradient(135deg, #ec4899, #be185d)',
    'linear-gradient(135deg, #8b5cf6, #6d28d9)',
    'linear-gradient(135deg, #06b6d4, #0891b2)',
    'linear-gradient(135deg, #ef4444, #dc2626)',
    'linear-gradient(135deg, #84cc16, #65a30d)'
];

/* ================================================================
   动态渲染子元素和控制面板
   ================================================================ */
function renderFlexItems() {
    const container = $('flexContainer');
    const controlsList = $('flexItemsControlsList');
    const theoryList = $('theoryItemsList');
    const codeItemsLines = $('codeItemsLines');
    
    if (!container || !controlsList || !theoryList) return;

    // 1. 清理现有内容
    container.querySelectorAll('.flex-item').forEach(el => el.remove());
    controlsList.innerHTML = '';
    theoryList.innerHTML = '';
    if (codeItemsLines) codeItemsLines.innerHTML = '';

    // 2. 生成新的 DOM
    for (let i = 0; i < flexState.count; i++) {
        if (!flexState.items[i]) flexState.items[i] = { flex: 1, order: 0 };
        const itemState = flexState.items[i];

        // 舞台上的子项
        const itemEl = document.createElement('div');
        itemEl.className = 'flex-item';
        itemEl.id = `flexItem${i + 1}`;
        itemEl.style.background = FLEX_COLORS[i % FLEX_COLORS.length];
        itemEl.innerHTML = `
            <span class="item-content">${i + 1}</span>
            <span class="item-size-label" id="sizeLabel${i + 1}">100px</span>
            <span class="item-order-badge" id="orderBadge${i + 1}" style="${itemState.order !== 0 ? 'display:block' : 'display:none'}">order: ${itemState.order}</span>
        `;
        container.appendChild(itemEl);

        // 理论面板数据
        theoryList.innerHTML += `
            <div class="theory-row" style="flex: 1; min-width: 100px; border: none; padding: 0;">
                <span>子项 ${i + 1} <code>flex: ${itemState.flex}</code></span>
                <span class="val" id="theoryItem${i + 1}W">-</span>
            </div>
        `;

        // 控制面板的行
        controlsList.innerHTML += `
            <div class="flex-item-control-row">
                <div class="control-group" style="min-width: 140px;">
                    <label><span>子项 ${i + 1} flex</span><span class="value-display" id="valFlexItem${i + 1}">${itemState.flex}</span></label>
                    <input type="range" id="sliderFlexItem${i + 1}" min="0" max="5" value="${itemState.flex}" step="1">
                </div>
                <div class="control-group" style="min-width: 140px;">
                    <label><span>order</span><span class="value-display" id="valOrder${i + 1}">${itemState.order}</span></label>
                    <input type="range" id="sliderOrder${i + 1}" min="-3" max="5" value="${itemState.order}" step="1">
                </div>
            </div>
        `;

        // 代码行
        if (codeItemsLines) {
            codeItemsLines.innerHTML += `
                <span class="code-line"><span class="sel">.item-${i + 1}</span> <span class="brace">{</span> <span class="prop">flex</span>: <span class="val" id="codeFlexItem${i + 1}">${itemState.flex}</span>; <span class="prop">order</span>: <span class="val" id="codeOrder${i + 1}">${itemState.order}</span>; <span class="brace">}</span></span>
            `;
        }
    }

    // 3. 事件绑定
    for (let i = 0; i < flexState.count; i++) {
        const flexSlider = document.getElementById(`sliderFlexItem${i + 1}`);
        const flexDisplay = document.getElementById(`valFlexItem${i + 1}`);
        if (flexSlider) {
            flexSlider.addEventListener('input', (e) => {
                const v = parseInt(e.target.value, 10);
                flexState.items[i].flex = v;
                if (flexDisplay) flexDisplay.textContent = v;
                applyFlex();
            });
        }

        const orderSlider = document.getElementById(`sliderOrder${i + 1}`);
        const orderDisplay = document.getElementById(`valOrder${i + 1}`);
        if (orderSlider) {
            orderSlider.addEventListener('input', (e) => {
                const v = parseInt(e.target.value, 10);
                flexState.items[i].order = v;
                if (orderDisplay) orderDisplay.textContent = v;
                
                const badge = document.getElementById(`orderBadge${i + 1}`);
                if (badge) {
                    badge.textContent = `order: ${v}`;
                    badge.style.display = v !== 0 ? 'block' : 'none';
                }
                applyFlex();
            });
        }
    }
}

/* ================================================================
   更新理论面板
   ================================================================ */
function updateFlexTheory() {
    const container = $('flexContainer');
    if (!container || flexState.display === 'block') return;

    const containerW = container.clientWidth - 60;
    const gap = flexState.gap;
    const totalGap = gap * (flexState.count - 1);
    
    const basisSize = 100;
    const totalBasis = basisSize * flexState.count;
    
    if (!flexState.enableItemsFlex) {
        // 未开启 flex 时，剩余空间计算
        const remaining = Math.max(0, containerW - totalGap - totalBasis);
        $('theoryContainerW') && ($('theoryContainerW').textContent = containerW + 'px');
        $('theoryBasisW') && ($('theoryBasisW').textContent = totalBasis + 'px');
        $('theoryRemaining') && ($('theoryRemaining').textContent = remaining + 'px');
        $('theoryFlexSum') && ($('theoryFlexSum').textContent = '0');

        for (let i = 0; i < flexState.count; i++) {
            const theoryEl = $(`theoryItem${i + 1}W`);
            if (theoryEl) theoryEl.textContent = '100px';
            const sizeLabel = $(`sizeLabel${i + 1}`);
            if (sizeLabel) sizeLabel.textContent = '100px';
        }
        return;
    }

    // 开启 flex 时
    const remaining = Math.max(0, containerW - totalGap - totalBasis);
    let flexSum = 0;
    flexState.items.slice(0, flexState.count).forEach(item => {
        flexSum += (item.flex || 0);
    });
    if (flexSum === 0) flexSum = 1;

    const unitShare = remaining / flexSum;

    $('theoryContainerW') && ($('theoryContainerW').textContent = containerW + 'px');
    $('theoryBasisW') && ($('theoryBasisW').textContent = totalBasis + 'px');
    $('theoryRemaining') && ($('theoryRemaining').textContent = remaining + 'px');
    $('theoryFlexSum') && ($('theoryFlexSum').textContent = flexSum);

    for (let i = 0; i < flexState.count; i++) {
        const flexVal = flexState.items[i]?.flex || 0;
        const finalW = flexVal > 0 ? basisSize + (flexVal * unitShare) : basisSize;
        const theoryEl = $(`theoryItem${i + 1}W`);
        if (theoryEl) theoryEl.textContent = Math.round(finalW) + 'px';
        const sizeLabel = $(`sizeLabel${i + 1}`);
        if (sizeLabel) sizeLabel.textContent = Math.round(finalW) + 'px';
    }
}

/* ================================================================
   应用 Flex 属性
   ================================================================ */
function applyFlex() {
    const container = $('flexContainer');
    const overlay = $('flexDisabledOverlay');
    const controlPanel = $('flexContainerControls');
    
    if (!container) return;

    const isFlex = flexState.display === 'flex';

    if (controlPanel) controlPanel.style.display = isFlex ? 'block' : 'none';
    if (overlay) overlay.style.display = isFlex ? 'none' : 'block';

    container.style.display = isFlex ? 'flex' : 'block';
    
    if (isFlex) {
        container.style.flexDirection = flexState.dir;
        container.style.flexWrap = flexState.wrap;
        container.style.justifyContent = flexState.justify;
        container.style.alignItems = flexState.align;
        container.style.alignContent = flexState.alignContent;
        container.style.gap = flexState.gap + 'px';
    } else {
        container.style.flexDirection = '';
        container.style.flexWrap = '';
        container.style.justifyContent = '';
        container.style.alignItems = '';
        container.style.alignContent = '';
        container.style.gap = '0';
    }

    const groupAlignItems = $('groupAlignItems');
    const groupAlignContent = $('groupAlignContent');
    const codeAlignItemsLine = $('codeAlignItemsLine');
    const codeAlignContentLine = $('codeAlignContentLine');

    if (isFlex) {
        if (flexState.wrap === 'nowrap') {
            groupAlignItems && (groupAlignItems.style.display = 'block');
            groupAlignContent && (groupAlignContent.style.display = 'none');
            codeAlignItemsLine && (codeAlignItemsLine.style.display = 'block');
            codeAlignContentLine && (codeAlignContentLine.style.display = 'none');
        } else {
            groupAlignItems && (groupAlignItems.style.display = 'none');
            groupAlignContent && (groupAlignContent.style.display = 'block');
            codeAlignItemsLine && (codeAlignItemsLine.style.display = 'none');
            codeAlignContentLine && (codeAlignContentLine.style.display = 'block');
        }
    }

    const mainAxis = $('mainAxis');
    const crossAxis = $('crossAxis');
    if (mainAxis && crossAxis && isFlex) {
        const isRow = flexState.dir === 'row' || flexState.dir === 'row-reverse';
        if (isRow) {
            mainAxis.style.cssText = 'top: 10px; left: 30px; right: 30px; bottom: auto; border-top: 1px dashed rgba(6, 182, 233, 0.6); border-left: none;';
            mainAxis.querySelector('.axis-label').style.writingMode = 'horizontal-tb';
            crossAxis.style.cssText = 'top: 30px; bottom: 30px; left: 10px; right: auto; border-left: 1px dashed rgba(236, 72, 153, 0.6); border-top: none;';
            crossAxis.querySelector('.axis-label').style.writingMode = 'vertical-rl';
        } else {
            mainAxis.style.cssText = 'top: 30px; bottom: 30px; left: 10px; right: auto; border-left: 1px dashed rgba(6, 182, 233, 0.6); border-top: none;';
            mainAxis.querySelector('.axis-label').style.writingMode = 'vertical-rl';
            crossAxis.style.cssText = 'top: 10px; left: 30px; right: 30px; bottom: auto; border-top: 1px dashed rgba(236, 72, 153, 0.6); border-left: none;';
            crossAxis.querySelector('.axis-label').style.writingMode = 'horizontal-tb';
        }
    }

    const items = container.querySelectorAll('.flex-item');
    items.forEach((item, index) => {
        const state = flexState.items[index] || { flex: 1, order: 0 };
        if (isFlex) {
            if (flexState.enableItemsFlex) {
                if (state.flex === 0) {
                    item.style.flex = '0 0 100px';
                } else {
                    item.style.flex = `${state.flex} 1 0%`;
                }
                item.style.order = state.order;
            } else {
                // 关闭时，不应用 flex 属性
                item.style.flex = '0 0 100px';
                item.style.order = '0';
            }
            item.style.height = '80px';
            item.style.width = '';
            item.style.marginBottom = '0';
        } else {
            item.style.flex = '';
            item.style.order = '';
            item.style.width = '100%';
            item.style.marginBottom = '10px';
            item.style.height = '60px';
        }
    });

    // 显示/隐藏子项控制列表
    const itemsList = $('flexItemsControlsList');
    if (itemsList) {
        itemsList.style.display = flexState.enableItemsFlex ? 'block' : 'none';
    }

    $('codeFlexDisplay') && ($('codeFlexDisplay').textContent = flexState.display);
    $('codeFlexDir') && ($('codeFlexDir').textContent = flexState.dir);
    $('codeFlexWrap') && ($('codeFlexWrap').textContent = flexState.wrap);
    $('codeFlexJustify') && ($('codeFlexJustify').textContent = flexState.justify);
    $('codeFlexAlign') && ($('codeFlexAlign').textContent = flexState.align);
    $('codeFlexAlignContent') && ($('codeFlexAlignContent').textContent = flexState.alignContent);
    $('codeFlexGap') && ($('codeFlexGap').textContent = flexState.gap + 'px');

    $('valFlexDisplay') && ($('valFlexDisplay').textContent = flexState.display);
    $('valFlexDir') && ($('valFlexDir').textContent = flexState.dir);
    $('valFlexWrap') && ($('valFlexWrap').textContent = flexState.wrap);
    $('valFlexJustify') && ($('valFlexJustify').textContent = flexState.justify);
    $('valFlexAlign') && ($('valFlexAlign').textContent = flexState.align);
    $('valFlexAlignContent') && ($('valFlexAlignContent').textContent = flexState.alignContent);
    $('valFlexGap') && ($('valFlexGap').textContent = flexState.gap + 'px');
    $('valFlexCount') && ($('valFlexCount').textContent = flexState.count);

    for (let i = 0; i < flexState.count; i++) {
        const state = flexState.items[i] || { flex: 1, order: 0 };
        $(`codeFlexItem${i + 1}`) && ($(`codeFlexItem${i + 1}`).textContent = state.flex);
        $(`codeOrder${i + 1}`) && ($(`codeOrder${i + 1}`).textContent = state.order);
    }

    // 隐藏子项的代码行
    if (codeItemsLines) {
        codeItemsLines.style.display = flexState.enableItemsFlex ? 'block' : 'none';
    }

    if (isFlex) updateFlexTheory();
}

/* ================================================================
   播放空间分配动画
   ================================================================ */
function playFlexAnimation() {
    if (flexState.isPlaying || flexState.display !== 'flex' || !flexState.enableItemsFlex) return;
    flexState.isPlaying = true;

    const container = $('flexContainer');
    if (!container) return;

    const items = container.querySelectorAll('.flex-item');
    
    items.forEach(item => {
        item.style.transition = 'all 0.1s';
        item.style.flex = '0 0 100px';
    });

    setTimeout(() => {
        items.forEach((item, index) => {
            item.style.transition = 'all 0.8s cubic-bezier(0.34, 1.2, 0.64, 1)';
            const state = flexState.items[index] || { flex: 1 };
            if (state.flex === 0) {
                item.style.flex = '0 0 100px';
            } else {
                item.style.flex = `${state.flex} 1 0%`;
            }
        });
    }, 1000);

    setTimeout(() => {
        flexState.isPlaying = false;
        updateFlexTheory();
    }, 2000);
}

/* ================================================================
   初始化模块
   ================================================================ */
export function initFlexboxModule() {
    for (let i = 0; i < 8; i++) {
        if (!flexState.items[i]) {
            flexState.items[i] = { flex: i === 1 ? 2 : 1, order: 0 };
        }
    }
    renderFlexItems();

    document.querySelectorAll('[data-flex-display]').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('[data-flex-display]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            flexState.display = btn.dataset.flexDisplay;
            applyFlex();
        });
    });

    initSlider({
        id: 'sliderFlexCount', displayId: 'valFlexCount',
        min: 2, max: 8, value: 3, step: 1, unit: '',
        onChange: v => {
            flexState.count = v;
            renderFlexItems();
            applyFlex();
        }
    });

    document.querySelectorAll('[data-flex-dir]').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('[data-flex-dir]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            flexState.dir = btn.dataset.flexDir;
            applyFlex();
        });
    });

    document.querySelectorAll('[data-flex-wrap]').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('[data-flex-wrap]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            flexState.wrap = btn.dataset.flexWrap;
            applyFlex();
        });
    });

    document.querySelectorAll('[data-flex-justify]').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('[data-flex-justify]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            flexState.justify = btn.dataset.flexJustify;
            
            const container = $('flexContainer');
            if (container) {
                container.style.justifyContent = flexState.justify;
            }
            applyFlex();
        });
    });

    document.querySelectorAll('[data-flex-align]').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('[data-flex-align]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            flexState.align = btn.dataset.flexAlign;
            applyFlex();
        });
    });

    document.querySelectorAll('[data-flex-align-content]').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('[data-flex-align-content]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            flexState.alignContent = btn.dataset.flexAlignContent;
            applyFlex();
        });
    });

    initSlider({
        id: 'sliderFlexGap', displayId: 'valFlexGap',
        min: 0, max: 60, value: 20,
        onChange: v => { flexState.gap = v; applyFlex(); }
    });

    // 绑定子项开关
    bindToggle('toggleFlexItems', active => {
        flexState.enableItemsFlex = active;
        applyFlex();
    });

    $('flexPlayBtn')?.addEventListener('click', playFlexAnimation);

    window.addEventListener('resize', () => {
        if (flexState.display === 'flex') updateFlexTheory();
    });

    applyFlex();

    // 弹窗逻辑
    const modal = $('flexCasesModal');
    const openBtn = $('openFlexCasesBtn');
    const closeBtn = $('closeFlexCasesBtn');

    if (openBtn && modal) {
        openBtn.addEventListener('click', () => modal.classList.add('show'));
    }

    if (closeBtn && modal) {
        closeBtn.addEventListener('click', () => modal.classList.remove('show'));
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.classList.remove('show');
        });
        
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.classList.contains('show')) {
                modal.classList.remove('show');
            }
        });
    }
	
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
	
	initChallengeUI('flexbox');
}