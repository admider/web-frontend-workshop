/* ================================================================
   box-model.js · 盒子模型 7 个子板块的全部交互逻辑
   ================================================================ */

import { $, bindToggle } from '../core/utils.js';
import { initSlider } from '../components/slider.js';
import { ChallengeSet } from '../components/challenge.js';
import { initChallengeUI } from '../components/challenge-ui.js';

/* ================================================================
   子板块切换
   ================================================================ */
function initSectionSwitcher() {
    document.querySelectorAll('.sidebar-nav-item[data-section]').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.sidebar-nav-item').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const section = btn.dataset.section;
            document.querySelectorAll('.section-panel').forEach(p => p.classList.remove('active'));
            document.getElementById('section-' + section)?.classList.add('active');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    });
}

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

/* ================================================================
   板块 3：border
   ================================================================ */
const borderState = {
    mode: 'uniform',
    none: false,
    uniform: { style: 'solid', width: 4, color: '#3b82f6' },
    multi: {
        1: { style: 'solid', width: 4, color: '#3b82f6' },
        2: [
            { style: 'solid', width: 4, color: '#3b82f6' },
            { style: 'solid', width: 4, color: '#10b981' }
        ],
        3: [
            { style: 'solid', width: 4, color: '#3b82f6' },
            { style: 'solid', width: 4, color: '#10b981' },
            { style: 'solid', width: 4, color: '#f59e0b' }
        ],
        4: [
            { style: 'solid', width: 4, color: '#3b82f6' },
            { style: 'solid', width: 4, color: '#10b981' },
            { style: 'solid', width: 4, color: '#f59e0b' },
            { style: 'solid', width: 4, color: '#ec4899' }
        ]
    },
    perSide: {
        top: { style: 'solid', width: 4, color: '#3b82f6' },
        right: { style: 'solid', width: 4, color: '#10b981' },
        bottom: { style: 'solid', width: 4, color: '#f59e0b' },
        left: { style: 'solid', width: 4, color: '#ec4899' }
    }
};

function applyBorder() {
    const borderEl = $('borderDemoBorder');
    if (!borderEl) return;

    if (borderState.none) {
        borderEl.style.borderStyle = 'none';
        borderEl.style.borderWidth = '0';
        borderEl.style.borderColor = 'transparent';
        $('codeBorderFull').textContent = 'none';
        return;
    }

    borderEl.style.borderStyle = 'solid';
    borderEl.style.borderWidth = '0';
    borderEl.style.borderColor = 'transparent';

    if (borderState.mode === 'uniform') {
        const u = borderState.uniform;
        borderEl.style.borderStyle = u.style;
        borderEl.style.borderWidth = u.width + 'px';
        borderEl.style.borderColor = u.color;
        $('codeBorderFull').textContent = `${u.width}px ${u.style} ${u.color}`;
    } else if (borderState.mode === 'per-side') {
        ['top', 'right', 'bottom', 'left'].forEach(side => {
            const s = borderState.perSide[side];
            borderEl.style[`border${capitalize(side)}Style`] = s.style;
            borderEl.style[`border${capitalize(side)}Width`] = s.width + 'px';
            borderEl.style[`border${capitalize(side)}Color`] = s.color;
        });
        $('codeBorderFull').textContent = '四边分别设置';
    } else {
        const mode = borderState.mode;
        const items = borderState.multi[mode];
        if (mode === '1') {
            const s = items;
            borderEl.style.borderStyle = s.style;
            borderEl.style.borderWidth = s.width + 'px';
            borderEl.style.borderColor = s.color;
            $('codeBorderFull').textContent = `${s.width}px ${s.style} ${s.color}`;
        } else {
            const map = {
                '2': { top: items[0], bottom: items[0], left: items[1], right: items[1] },
                '3': { top: items[0], left: items[1], right: items[1], bottom: items[2] },
                '4': { top: items[0], right: items[1], bottom: items[2], left: items[3] }
            };
            const config = map[mode];
            Object.entries(config).forEach(([side, s]) => {
                borderEl.style[`border${capitalize(side)}Style`] = s.style;
                borderEl.style[`border${capitalize(side)}Width`] = s.width + 'px';
                borderEl.style[`border${capitalize(side)}Color`] = s.color;
            });
            $('codeBorderFull').textContent = items.map(s => `${s.width}px ${s.style} ${s.color}`).join(' / ');
        }
    }
}

function syncBorderDisabledState() {
    const area = $('borderSettingArea');
    const hint = $('borderNoneHint');
    if (area) area.classList.toggle('is-disabled', borderState.none);
    if (hint) hint.style.display = borderState.none ? 'block' : 'none';
}

function buildBorderMultiSlots(mode) {
    const container = $('borderMultiSlots');
    if (!container) return;

    if (mode === '1') {
        container.innerHTML = `
            <div class="border-multi-slot">
                <div class="border-multi-slot-header">
                    <span class="slot-label">四边统一</span>
                </div>
                <div class="border-multi-slot-controls">
                    <select data-slot-style="0">
                        <option value="solid">solid</option>
                        <option value="dashed">dashed</option>
                        <option value="dotted">dotted</option>
                        <option value="double">double</option>
                        <option value="none">none</option>
                    </select>
                    <input type="range" data-slot-width="0" min="0" max="20" value="4">
                    <input type="color" data-slot-color="0" value="#3b82f6">
                </div>
            </div>
        `;
    } else {
        const sides = mode === '2' ? ['上下', '左右'] :
                      mode === '3' ? ['上', '左右', '下'] :
                                     ['上', '右', '下', '左'];
        container.innerHTML = sides.map((label, i) => `
            <div class="border-multi-slot">
                <div class="border-multi-slot-header">
                    <span class="slot-label">${label}</span>
                </div>
                <div class="border-multi-slot-controls">
                    <select data-slot-style="${i}">
                        <option value="solid">solid</option>
                        <option value="dashed">dashed</option>
                        <option value="dotted">dotted</option>
                        <option value="double">double</option>
                        <option value="none">none</option>
                    </select>
                    <input type="range" data-slot-width="${i}" min="0" max="20" value="4">
                    <input type="color" data-slot-color="${i}" value="#3b82f6">
                </div>
            </div>
        `).join('');
    }

    container.querySelectorAll('[data-slot-style]').forEach(sel => {
        sel.addEventListener('change', e => {
            const i = parseInt(sel.dataset.slotStyle, 10);
            if (mode === '1') borderState.multi[1].style = e.target.value;
            else borderState.multi[mode][i].style = e.target.value;
            applyBorder();
        });
    });
    container.querySelectorAll('[data-slot-width]').forEach(range => {
        range.addEventListener('input', e => {
            const i = parseInt(range.dataset.slotWidth, 10);
            if (mode === '1') borderState.multi[1].width = parseInt(e.target.value, 10);
            else borderState.multi[mode][i].width = parseInt(e.target.value, 10);
            applyBorder();
        });
    });
    container.querySelectorAll('[data-slot-color]').forEach(color => {
        color.addEventListener('input', e => {
            const i = parseInt(color.dataset.slotColor, 10);
            if (mode === '1') borderState.multi[1].color = e.target.value;
            else borderState.multi[mode][i].color = e.target.value;
            applyBorder();
        });
    });
}

function initBorderSection() {
    document.querySelectorAll('[data-border-mode]').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('[data-border-mode]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            borderState.mode = btn.dataset.borderMode;

            document.querySelectorAll('.border-sub-panel').forEach(p => p.classList.remove('active'));
            if (borderState.mode === 'uniform') $('borderUniformPanel')?.classList.add('active');
            else if (borderState.mode === 'per-side') $('borderPerSidePanel')?.classList.add('active');
            else {
                $('borderMultiPanel')?.classList.add('active');
                buildBorderMultiSlots(borderState.mode);
            }
            applyBorder();
        });
    });

    bindToggle('toggleBorderNone', active => {
        borderState.none = active;
        syncBorderDisabledState();
        applyBorder();
    });

    document.querySelectorAll('[data-border-style]').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('[data-border-style]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            borderState.uniform.style = btn.dataset.borderStyle;
            applyBorder();
        });
    });

    initSlider({
        id: 'sliderBorderWidth', displayId: 'valBorderWidth',
        min: 0, max: 20, value: 4,
        onChange: v => { borderState.uniform.width = v; applyBorder(); }
    });

    document.querySelectorAll('[data-border-color]').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('[data-border-color]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            borderState.uniform.color = btn.dataset.borderColor;
            applyBorder();
        });
    });

    document.querySelectorAll('[data-side-style]').forEach(sel => {
        sel.addEventListener('change', e => {
            borderState.perSide[sel.dataset.sideStyle].style = e.target.value;
            applyBorder();
        });
    });
    document.querySelectorAll('[data-side-width]').forEach(range => {
        range.addEventListener('input', e => {
            borderState.perSide[range.dataset.sideWidth].width = parseInt(e.target.value, 10);
            applyBorder();
        });
    });
    document.querySelectorAll('[data-side-color]').forEach(color => {
        color.addEventListener('input', e => {
            borderState.perSide[color.dataset.sideColor].color = e.target.value;
            applyBorder();
        });
    });

    $('borderTransparentAnimBtn')?.addEventListener('click', () => {
        const borderEl = $('borderDemoBorder');
        if (!borderEl) return;

        if (borderState.none) {
            borderState.none = false;
            $('toggleBorderNone')?.classList.remove('active');
            syncBorderDisabledState();
        }

        const hint = $('borderAnimHint');
        borderEl.style.transition = 'all 0.6s ease';
        borderEl.style.borderStyle = 'solid';
        borderEl.style.borderWidth = '8px';
        borderEl.style.borderColor = '#3b82f6';
        hint.innerHTML = '<strong>阶段 1：</strong>正常边框（8px solid #3b82f6），元素总尺寸包含边框宽度。';

        setTimeout(() => {
            borderEl.style.borderColor = 'transparent';
            hint.innerHTML = '<strong>阶段 2：</strong>border-color: transparent —— 边框看不见了，但宽度仍然占位，元素总尺寸不变。';

            setTimeout(() => {
                borderEl.style.borderStyle = 'none';
                hint.innerHTML = '<strong>阶段 3：</strong>border-style: none —— 边框宽度变为 0，元素总尺寸缩小。';
            }, 2000);
        }, 2000);
    });

    applyBorder();
    syncBorderDisabledState();
}

/* ================================================================
   板块 4：padding
   ================================================================ */
const paddingState = {
    mode: 1,
    unit: 'px',
    values: [20, 20, 20, 20],
    percentValues: [10, 10, 10, 10]
};

function buildPaddingSliders() {
    const container = $('paddingSliders');
    if (!container) return;

    const labels = {
        1: ['四边统一'],
        2: ['上下', '左右'],
        3: ['上', '左右', '下'],
        4: ['上', '右', '下', '左']
    };

    const mode = paddingState.mode;
    const labelArr = labels[mode];

    container.innerHTML = labelArr.map((label, i) => {
        const val = paddingState.unit === 'px' ? paddingState.values[i] : paddingState.percentValues[i];
        const max = paddingState.unit === 'px' ? 60 : 30;
        return `
            <div class="padding-slider-item">
                <label>
                    <span>${label}</span>
                    <span class="value-display" data-padding-display="${i}">${val}${paddingState.unit}</span>
                </label>
                <input type="range" data-padding-slider="${i}" min="0" max="${max}" value="${val}">
            </div>
        `;
    }).join('');

    container.querySelectorAll('[data-padding-slider]').forEach(slider => {
        slider.addEventListener('input', e => {
            const i = parseInt(slider.dataset.paddingSlider, 10);
            const v = parseInt(e.target.value, 10);
            if (paddingState.unit === 'px') paddingState.values[i] = v;
            else paddingState.percentValues[i] = v;
            const display = container.querySelector(`[data-padding-display="${i}"]`);
            if (display) display.textContent = v + paddingState.unit;
            applyPadding();
        });
    });
}

function applyPadding() {
    const paddingEl = $('paddingDemoLayer');
    if (!paddingEl) return;

    let paddingStr;
    const mode = paddingState.mode;
    const unit = paddingState.unit;
    const v = unit === 'px' ? paddingState.values : paddingState.percentValues;

    if (mode === '1') paddingStr = `${v[0]}${unit}`;
    else if (mode === '2') paddingStr = `${v[0]}${unit} ${v[1]}${unit}`;
    else if (mode === '3') paddingStr = `${v[0]}${unit} ${v[1]}${unit} ${v[2]}${unit}`;
    else paddingStr = `${v[0]}${unit} ${v[1]}${unit} ${v[2]}${unit} ${v[3]}${unit}`;

    paddingEl.style.padding = paddingStr;
    $('codePadding').textContent = paddingStr;
    $('valPaddingMode').textContent = mode + ' 值';
    $('valPaddingUnit').textContent = unit;
}

function initPaddingSection() {
    document.querySelectorAll('[data-padding-mode]').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('[data-padding-mode]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            paddingState.mode = btn.dataset.paddingMode;
            paddingState.values = [20, 20, 20, 20];
            paddingState.percentValues = [10, 10, 10, 10];
            buildPaddingSliders();
            applyPadding();
        });
    });

    document.querySelectorAll('[data-padding-unit]').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('[data-padding-unit]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            paddingState.unit = btn.dataset.paddingUnit;
            buildPaddingSliders();
            applyPadding();
        });
    });

    buildPaddingSliders();
    applyPadding();
}

/* ================================================================
   板块 5：margin（重构 · 单大屏切换）
   ================================================================ */
const marginState = {
    scene: 'surround',
    mode: 1,
    values: [0, 0, 0, 0],
    surround: { top: 0, right: 0, bottom: 0, left: 0 },
    align: { h: 'flex-start', v: 'flex-start' },
    alignMargin: { top: 0, left: 0, bottom: 0, right: 0 }
};

function switchMarginScene(scene) {
    marginState.scene = scene;

    document.querySelectorAll('[data-margin-scene]').forEach(b => {
        b.classList.toggle('active', b.dataset.marginScene === scene);
    });

    const sceneSurround = $('marginSceneSurround');
    const sceneAlign = $('marginSceneAlign');
    const panelSurround = $('marginPanelSurround');
    const panelAlign = $('marginPanelAlign');
    const hint = $('marginSceneHint');

    if (scene === 'surround') {
        sceneSurround && (sceneSurround.style.display = 'flex');
        sceneAlign && (sceneAlign.style.display = 'none');
        panelSurround && (panelSurround.style.display = 'block');
        panelAlign && (panelAlign.style.display = 'none');
        if (hint) hint.innerHTML = '<strong>💡 当前：</strong>盒子四周有元素。粉色虚线框代表盒子的 margin，四周元素紧贴着粉色框，说明盒子与邻居之间的距离就是 margin 值。';
        applyMargin();
    } else {
        sceneSurround && (sceneSurround.style.display = 'none');
        sceneAlign && (sceneAlign.style.display = 'flex');
        panelSurround && (panelSurround.style.display = 'none');
        panelAlign && (panelAlign.style.display = 'block');
        if (hint) hint.innerHTML = '<strong>💡 当前：</strong>盒子四周无元素。此时 <code>margin-top / margin-left</code> 表现为盒子与浏览器（或父元素）上 / 左边的距离；<code>margin-bottom / margin-right</code> 在左上对齐时无法推远盒子，因为盒子已经在左上角。';
        applyAlign();
    }
}

function buildMarginSliders() {
    const container = $('marginSliders');
    if (!container) return;

    const labels = {
        1: ['四边统一'],
        2: ['上下', '左右'],
        3: ['上', '左右', '下'],
        4: ['上', '右', '下', '左']
    };

    const mode = marginState.mode;
    const labelArr = labels[mode];

    container.innerHTML = labelArr.map((label, i) => {
        const val = marginState.values[i];
        return `
            <div class="padding-slider-item">
                <label>
                    <span>${label}</span>
                    <span class="value-display" data-margin-display="${i}">${val}px</span>
                </label>
                <input type="range" data-margin-slider="${i}" min="-40" max="60" value="${val}">
            </div>
        `;
    }).join('');

    container.querySelectorAll('[data-margin-slider]').forEach(slider => {
        slider.addEventListener('input', e => {
            const i = parseInt(slider.dataset.marginSlider, 10);
            const v = parseInt(e.target.value, 10);
            marginState.values[i] = v;
            const display = container.querySelector(`[data-margin-display="${i}"]`);
            if (display) display.textContent = v + 'px';
            applyMargin();
        });
    });
}

function getMarginBySide() {
    const m = marginState.mode;
    const v = marginState.values;
    if (m === 1) return { top: v[0], right: v[0], bottom: v[0], left: v[0] };
    if (m === 2) return { top: v[0], right: v[1], bottom: v[0], left: v[1] };
    if (m === 3) return { top: v[0], right: v[1], bottom: v[2], left: v[1] };
    return { top: v[0], right: v[1], bottom: v[2], left: v[3] };
}

function applyMargin() {
    const marginLayer = $('marginLayerBox');
    if (!marginLayer) return;

    const sides = getMarginBySide();

    /* 粉色 padding = 盒子自身的 margin 大小 */
    const visualTop = Math.max(0, sides.top);
    const visualRight = Math.max(0, sides.right);
    const visualBottom = Math.max(0, sides.bottom);
    const visualLeft = Math.max(0, sides.left);
    marginLayer.style.padding = `${visualTop}px ${visualRight}px ${visualBottom}px ${visualLeft}px`;

    /* 四周邻居紧贴粉色框：邻居 margin 只承担「邻居 margin − 盒子 margin」的差值（≥0） */
    const s = marginState.surround;
    const neighborTop    = Math.max(0, s.top - sides.top);
    const neighborRight  = Math.max(0, s.right - sides.right);
    const neighborBottom = Math.max(0, s.bottom - sides.bottom);
    const neighborLeft   = Math.max(0, s.left - sides.left);

    const topEl = $('surroundTop');
    const bottomEl = $('surroundBottom');
    const leftEl = $('surroundLeft');
    const rightEl = $('surroundRight');

    if (topEl) topEl.style.marginBottom = neighborTop + 'px';
    if (bottomEl) bottomEl.style.marginTop = neighborBottom + 'px';
    if (leftEl) leftEl.style.marginRight = neighborLeft + 'px';
    if (rightEl) rightEl.style.marginLeft = neighborRight + 'px';

    /* 总间距 = 盒子 margin 与邻居 margin 的较大值 */
    const gapTop    = Math.max(0, sides.top, s.top);
    const gapRight  = Math.max(0, sides.right, s.right);
    const gapBottom = Math.max(0, sides.bottom, s.bottom);
    const gapLeft   = Math.max(0, sides.left, s.left);

    let marginStr;
    const m = marginState.mode;
    const v = marginState.values;
    if (m === 1) marginStr = `${v[0]}px`;
    else if (m === 2) marginStr = `${v[0]}px ${v[1]}px`;
    else if (m === 3) marginStr = `${v[0]}px ${v[1]}px ${v[2]}px`;
    else marginStr = `${v[0]}px ${v[1]}px ${v[2]}px ${v[3]}px`;

    $('codeMargin').textContent = marginStr;
    $('valMarginMode').textContent = marginState.mode + ' 值';

    const surroundHint = $('surroundGapHint');
    if (surroundHint) {
        surroundHint.innerHTML = `<strong>💡 当前：</strong>盒子 margin = ${marginStr}；上 ${gapTop}px / 右 ${gapRight}px / 下 ${gapBottom}px / 左 ${gapLeft}px 是与四周邻居的距离（取盒子 margin 与邻居 margin 的较大值）。`;
    }
}

function applySurround() {
    const s = marginState.surround;
    $('valSurroundTopM') && ($('valSurroundTopM').textContent = s.top + 'px');
    $('valSurroundBottomM') && ($('valSurroundBottomM').textContent = s.bottom + 'px');
    $('valSurroundLeftM') && ($('valSurroundLeftM').textContent = s.left + 'px');
    $('valSurroundRightM') && ($('valSurroundRightM').textContent = s.right + 'px');
    applyMargin();
}

function applyAlign() {
    const viewport = $('alignViewport');
    const box = $('alignBox');
    if (!viewport || !box) return;

    viewport.style.display = 'flex';
    viewport.style.alignItems = marginState.align.v;
    viewport.style.justifyContent = marginState.align.h;

    box.style.marginTop = marginState.alignMargin.top + 'px';
    box.style.marginRight = marginState.alignMargin.right + 'px';
    box.style.marginBottom = marginState.alignMargin.bottom + 'px';
    box.style.marginLeft = marginState.alignMargin.left + 'px';

    const hLabel = { 'flex-start': 'flex-start（左）', 'center': 'center（居中）', 'flex-end': 'flex-end（右）' };
    const vLabel = { 'flex-start': 'flex-start（上）', 'center': 'center（居中）', 'flex-end': 'flex-end（下）' };
    $('valAlignH') && ($('valAlignH').textContent = hLabel[marginState.align.h] || marginState.align.h);
    $('valAlignV') && ($('valAlignV').textContent = vLabel[marginState.align.v] || marginState.align.v);

    $('valAlignTop') && ($('valAlignTop').textContent = marginState.alignMargin.top + 'px');
    $('valAlignLeft') && ($('valAlignLeft').textContent = marginState.alignMargin.left + 'px');
    $('valAlignBottom') && ($('valAlignBottom').textContent = marginState.alignMargin.bottom + 'px');
    $('valAlignRight') && ($('valAlignRight').textContent = marginState.alignMargin.right + 'px');

    const hint = $('alignHint');
    if (hint) {
        let text = '<strong>💡 当前：</strong>';
        if (marginState.align.h === 'flex-start' && marginState.align.v === 'flex-start') {
            text += '盒子在浏览器左上角。margin-top / margin-left 表现为与视口上边 / 左边的距离；margin-bottom / margin-right <strong>无法推远盒子</strong>（它已经在左上角）。';
        } else if (marginState.align.h === 'flex-end' && marginState.align.v === 'flex-start') {
            text += '盒子在浏览器右上角。margin-top 控制与视口上边的距离，margin-right 控制与视口右边的距离；margin-left / margin-bottom 无法推远盒子。';
        } else if (marginState.align.h === 'flex-start' && marginState.align.v === 'flex-end') {
            text += '盒子在浏览器左下角。margin-left 控制与视口左边的距离，margin-bottom 控制与视口下边的距离；margin-top / margin-right 无法推远盒子。';
        } else if (marginState.align.h === 'flex-end' && marginState.align.v === 'flex-end') {
            text += '盒子在浏览器右下角。margin-right / margin-bottom 控制与视口右边 / 下边的距离；margin-top / margin-left 无法推远盒子。';
        } else if (marginState.align.h === 'center' && marginState.align.v === 'center') {
            text += '盒子在视口居中。margin 会与居中的剩余空间相互挤压。';
        } else {
            text += '盒子在当前对齐方式下，margin 的作用方向由对齐方式决定。';
        }
        hint.innerHTML = text;
    }
}

function initMarginSection() {
    document.querySelectorAll('[data-margin-scene]').forEach(btn => {
        btn.addEventListener('click', () => switchMarginScene(btn.dataset.marginScene));
    });

    document.querySelectorAll('[data-margin-mode]').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('[data-margin-mode]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            marginState.mode = parseInt(btn.dataset.marginMode, 10);
            marginState.values = [0, 0, 0, 0];
            buildMarginSliders();
            applyMargin();
        });
    });

    initSlider({
        id: 'sliderSurroundTop', displayId: 'valSurroundTopM',
        min: 0, max: 40, value: 0, step: 2,
        onChange: v => { marginState.surround.top = v; applySurround(); }
    });
    initSlider({
        id: 'sliderSurroundBottom', displayId: 'valSurroundBottomM',
        min: 0, max: 40, value: 0, step: 2,
        onChange: v => { marginState.surround.bottom = v; applySurround(); }
    });
    initSlider({
        id: 'sliderSurroundLeft', displayId: 'valSurroundLeftM',
        min: 0, max: 40, value: 0, step: 2,
        onChange: v => { marginState.surround.left = v; applySurround(); }
    });
    initSlider({
        id: 'sliderSurroundRight', displayId: 'valSurroundRightM',
        min: 0, max: 40, value: 0, step: 2,
        onChange: v => { marginState.surround.right = v; applySurround(); }
    });

    document.querySelectorAll('[data-align-h]').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('[data-align-h]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            marginState.align.h = btn.dataset.alignH;
            applyAlign();
        });
    });
    document.querySelectorAll('[data-align-v]').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('[data-align-v]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            marginState.align.v = btn.dataset.alignV;
            applyAlign();
        });
    });

    initSlider({
        id: 'sliderAlignTop', displayId: 'valAlignTop',
        min: 0, max: 80, value: 0, step: 4,
        onChange: v => { marginState.alignMargin.top = v; applyAlign(); }
    });
    initSlider({
        id: 'sliderAlignLeft', displayId: 'valAlignLeft',
        min: 0, max: 80, value: 0, step: 4,
        onChange: v => { marginState.alignMargin.left = v; applyAlign(); }
    });
    initSlider({
        id: 'sliderAlignBottom', displayId: 'valAlignBottom',
        min: 0, max: 80, value: 0, step: 4,
        onChange: v => { marginState.alignMargin.bottom = v; applyAlign(); }
    });
    initSlider({
        id: 'sliderAlignRight', displayId: 'valAlignRight',
        min: 0, max: 80, value: 0, step: 4,
        onChange: v => { marginState.alignMargin.right = v; applyAlign(); }
    });

    buildMarginSliders();
    applySurround();
    applyAlign();
    switchMarginScene('surround');
}

/* ================================================================
   板块 6：宽高（含 margin 区域模拟 + 总宽/总高公式）
   ================================================================ */
const sizeState = {
    width: 200,
    height: 100,
    padding: 20,
    border: 5,
    margin: 10,
    boxSizing: 'content-box'
};

function applySize() {
    const box = $('sizeDemoBox');
    const marginLayer = $('sizeMarginLayer');
    if (!box) return;

    box.style.boxSizing = sizeState.boxSizing;
    box.style.width = sizeState.width + 'px';
    box.style.height = sizeState.height + 'px';
    box.style.padding = sizeState.padding + 'px';
    box.style.borderWidth = sizeState.border + 'px';
    box.style.borderStyle = 'solid';
    box.style.borderColor = 'var(--accent-orange)';
    box.style.margin = '0';

    if (marginLayer) {
        marginLayer.style.padding = sizeState.margin + 'px';
    }

    requestAnimationFrame(() => {
        let contentW, contentH;
        if (sizeState.boxSizing === 'border-box') {
            contentW = Math.max(0, sizeState.width - sizeState.padding * 2 - sizeState.border * 2);
            contentH = Math.max(0, sizeState.height - sizeState.padding * 2 - sizeState.border * 2);
        } else {
            contentW = sizeState.width;
            contentH = sizeState.height;
        }
        updateSizeDisplay(contentW, contentH);
    });
}

function updateSizeDisplay(contentW, contentH) {
    const { width, height, padding, border, margin, boxSizing } = sizeState;

    let formulaW, formulaH;
    if (boxSizing === 'border-box') {
        formulaW = `
            <span style="color: var(--accent-blue);">width = ${width}px</span>
            <span style="color: var(--text-muted);">（作用于总宽）</span>
            <br>
            &nbsp;&nbsp;&nbsp;&nbsp;→ <span style="color: var(--accent-cyan);">内容宽</span> = 
            <span style="color: var(--accent-blue);">${width}</span>
            − <span style="color: var(--accent-green);">${padding * 2}</span>
            <span style="color: var(--text-muted);">(padding×2)</span>
            − <span style="color: var(--accent-orange);">${border * 2}</span>
            <span style="color: var(--text-muted);">(border×2)</span>
            = <span style="color: var(--accent-pink); font-weight: 700;">${contentW}</span> px
        `;
        formulaH = `
            <span style="color: var(--accent-blue);">height = ${height}px</span>
            <span style="color: var(--text-muted);">（作用于总高）</span>
            <br>
            &nbsp;&nbsp;&nbsp;&nbsp;→ <span style="color: var(--accent-cyan);">内容高</span> = 
            <span style="color: var(--accent-blue);">${height}</span>
            − <span style="color: var(--accent-green);">${padding * 2}</span>
            <span style="color: var(--text-muted);">(padding×2)</span>
            − <span style="color: var(--accent-orange);">${border * 2}</span>
            <span style="color: var(--text-muted);">(border×2)</span>
            = <span style="color: var(--accent-pink); font-weight: 700;">${contentH}</span> px
        `;
    } else {
        formulaW = `
            <span style="color: var(--accent-blue);">width = ${width}px</span>
            <span style="color: var(--text-muted);">（作用于内容宽）</span>
            <br>
            &nbsp;&nbsp;&nbsp;&nbsp;→ <span style="color: var(--accent-pink);">盒子宽</span> = 
            <span style="color: var(--accent-blue);">${width}</span>
            + <span style="color: var(--accent-green);">${padding * 2}</span>
            <span style="color: var(--text-muted);">(padding×2)</span>
            + <span style="color: var(--accent-orange);">${border * 2}</span>
            <span style="color: var(--text-muted);">(border×2)</span>
            = <span style="color: var(--accent-pink); font-weight: 700;">${width + padding * 2 + border * 2}</span> px
        `;
        formulaH = `
            <span style="color: var(--accent-blue);">height = ${height}px</span>
            <span style="color: var(--text-muted);">（作用于内容高）</span>
            <br>
            &nbsp;&nbsp;&nbsp;&nbsp;→ <span style="color: var(--accent-pink);">盒子高</span> = 
            <span style="color: var(--accent-blue);">${height}</span>
            + <span style="color: var(--accent-green);">${padding * 2}</span>
            <span style="color: var(--text-muted);">(padding×2)</span>
            + <span style="color: var(--accent-orange);">${border * 2}</span>
            <span style="color: var(--text-muted);">(border×2)</span>
            = <span style="color: var(--accent-pink); font-weight: 700;">${height + padding * 2 + border * 2}</span> px
        `;
    }

    let totalW, totalH, totalWFormula, totalHFormula;

    if (boxSizing === 'border-box') {
        totalW = width + margin * 2;
        totalH = height + margin * 2;
        totalWFormula = `
            <span style="color: var(--accent-purple); font-weight: 700;">总宽度</span> = 
            <span style="color: var(--accent-blue);">width = ${width}</span>
            <span style="color: var(--text-muted);">（border-box，已含 padding + border）</span>
            + <span style="color: var(--accent-pink);">${margin * 2}</span>
            <span style="color: var(--text-muted);">(margin×2)</span>
            = <span style="color: var(--accent-pink); font-weight: 700;">${totalW}</span> px
        `;
        totalHFormula = `
            <span style="color: var(--accent-purple); font-weight: 700;">总高度</span> = 
            <span style="color: var(--accent-blue);">height = ${height}</span>
            <span style="color: var(--text-muted);">（border-box，已含 padding + border）</span>
            + <span style="color: var(--accent-pink);">${margin * 2}</span>
            <span style="color: var(--text-muted);">(margin×2)</span>
            = <span style="color: var(--accent-pink); font-weight: 700;">${totalH}</span> px
        `;
    } else {
        totalW = width + padding * 2 + border * 2 + margin * 2;
        totalH = height + padding * 2 + border * 2 + margin * 2;
        totalWFormula = `
            <span style="color: var(--accent-purple); font-weight: 700;">总宽度</span> = 
            <span style="color: var(--accent-blue);">${width}</span>
            <span style="color: var(--text-muted);">(width)</span>
            + <span style="color: var(--accent-green);">${padding * 2}</span>
            <span style="color: var(--text-muted);">(padding×2)</span>
            + <span style="color: var(--accent-orange);">${border * 2}</span>
            <span style="color: var(--text-muted);">(border×2)</span>
            + <span style="color: var(--accent-pink);">${margin * 2}</span>
            <span style="color: var(--text-muted);">(margin×2)</span>
            = <span style="color: var(--accent-pink); font-weight: 700;">${totalW}</span> px
        `;
        totalHFormula = `
            <span style="color: var(--accent-purple); font-weight: 700;">总高度</span> = 
            <span style="color: var(--accent-blue);">${height}</span>
            <span style="color: var(--text-muted);">(height)</span>
            + <span style="color: var(--accent-green);">${padding * 2}</span>
            <span style="color: var(--text-muted);">(padding×2)</span>
            + <span style="color: var(--accent-orange);">${border * 2}</span>
            <span style="color: var(--text-muted);">(border×2)</span>
            + <span style="color: var(--accent-pink);">${margin * 2}</span>
            <span style="color: var(--text-muted);">(margin×2)</span>
            = <span style="color: var(--accent-pink); font-weight: 700;">${totalH}</span> px
        `;
    }

    const wRow = $('calcWidthRow');
    const hRow = $('calcHeightRow');
    const twRow = $('calcTotalWidthRow');
    const thRow = $('calcTotalHeightRow');
    if (wRow) wRow.innerHTML = formulaW;
    if (hRow) hRow.innerHTML = formulaH;
    if (twRow) twRow.innerHTML = totalWFormula;
    if (thRow) thRow.innerHTML = totalHFormula;

    $('valBoxSizing') && ($('valBoxSizing').textContent = boxSizing);
    $('valSizeWidth') && ($('valSizeWidth').textContent = width + 'px');
    $('valSizeHeight') && ($('valSizeHeight').textContent = height + 'px');
    $('valSizePadding') && ($('valSizePadding').textContent = padding + 'px');
    $('valSizeBorder') && ($('valSizeBorder').textContent = border + 'px');
    $('valSizeMargin') && ($('valSizeMargin').textContent = margin + 'px');

    if ($('sizeContentLabel')) {
        $('sizeContentLabel').textContent = `content ${contentW} × ${contentH}`;
    }
}

function initSizeSection() {
    document.querySelectorAll('[data-box-sizing]').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('[data-box-sizing]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            sizeState.boxSizing = btn.dataset.boxSizing;
            applySize();
        });
    });

    initSlider({ id: 'sliderSizeWidth', displayId: 'valSizeWidth', min: 100, max: 360, value: 200, step: 10, onChange: v => { sizeState.width = v; applySize(); } });
    initSlider({ id: 'sliderSizeHeight', displayId: 'valSizeHeight', min: 60, max: 200, value: 100, step: 10, onChange: v => { sizeState.height = v; applySize(); } });
    initSlider({ id: 'sliderSizePadding', displayId: 'valSizePadding', min: 0, max: 40, value: 20, step: 2, onChange: v => { sizeState.padding = v; applySize(); } });
    initSlider({ id: 'sliderSizeBorder', displayId: 'valSizeBorder', min: 0, max: 20, value: 5, step: 1, onChange: v => { sizeState.border = v; applySize(); } });
    initSlider({ id: 'sliderSizeMargin', displayId: 'valSizeMargin', min: 0, max: 40, value: 10, step: 2, onChange: v => { sizeState.margin = v; applySize(); } });

    applySize();
}

/* ================================================================
   板块 7：背景
   ================================================================ */
const bgImageNaturalSize = { w: 0, h: 0 };
const bgState = {
    color: '#1e3a5f',
    imageOn: true,
    imageUrl: '../img/bg.png',
    repeat: 'no-repeat',
    positionMode: 'keyword',
    positionKeyword: 'center center',
    positionX: 50,
    positionY: 50,
    sizeMode: '%',
    sizeW: 0,
    sizeH: 0,
    attachment: 'scroll'
};

function loadBgImageSize() {
    const img = new Image();
    img.onload = () => {
        bgImageNaturalSize.w = img.naturalWidth;
        bgImageNaturalSize.h = img.naturalHeight;
        applyBg();
    };
    img.onerror = () => console.warn('背景图加载失败：', bgState.imageUrl);
    img.src = bgState.imageUrl;
}

function getBgPositionValue() {
    if (bgState.positionMode === 'percent') {
        return `${bgState.positionX}% ${bgState.positionY}%`;
    }
    return bgState.positionKeyword;
}

function getBgSizeValue() {
    if (bgState.sizeMode === 'cover') return 'cover';
    if (bgState.sizeMode === 'contain') return 'contain';

    const unit = bgState.sizeMode === 'px' ? 'px' : '%';
    const w = bgState.sizeW;
    const h = bgState.sizeH;

    if (w === 0 && h === 0) return 'auto';
    if (w > 0 && h === 0) return `${w}${unit}`;
    if (w === 0 && h > 0) return `auto ${h}${unit}`;
    return `${w}${unit} ${h}${unit}`;
}

function getBgRenderSize() {
    const paddingEl = $('bgDemoPadding');
    if (!paddingEl) return { w: 0, h: 0 };

    const boxW = paddingEl.offsetWidth;
    const boxH = paddingEl.offsetHeight;

    if (bgImageNaturalSize.w === 0 || bgImageNaturalSize.h === 0) return { w: boxW, h: boxH };

    const imgRatio = bgImageNaturalSize.w / bgImageNaturalSize.h;
    const boxRatio = boxW / boxH;

    if (bgState.sizeMode === 'cover') {
        if (imgRatio > boxRatio) return { w: boxH * imgRatio, h: boxH };
        else return { w: boxW, h: boxW / imgRatio };
    }
    if (bgState.sizeMode === 'contain') {
        if (imgRatio > boxRatio) return { w: boxW, h: boxW / imgRatio };
        else return { w: boxH * imgRatio, h: boxH };
    }

    const unit = bgState.sizeMode === 'px' ? 1 : 0.01;
    const w = bgState.sizeW;
    const h = bgState.sizeH;

    if (w === 0 && h === 0) return { w: bgImageNaturalSize.w, h: bgImageNaturalSize.h };
    if (w > 0 && h === 0) {
        const actualW = bgState.sizeMode === 'px' ? w : boxW * unit * w;
        return { w: actualW, h: actualW * (bgImageNaturalSize.h / bgImageNaturalSize.w) };
    }
    if (w === 0 && h > 0) {
        const actualH = bgState.sizeMode === 'px' ? h : boxH * unit * h;
        return { w: actualH * (bgImageNaturalSize.w / bgImageNaturalSize.h), h: actualH };
    }
    const actualW = bgState.sizeMode === 'px' ? w : boxW * unit * w;
    const actualH = bgState.sizeMode === 'px' ? h : boxH * unit * h;
    return { w: actualW, h: actualH };
}

function updateFixedBgPosition() {
    const paddingEl = $('bgDemoPadding');
    const fixedLayer = $('bgFixedImageLayer');
    const viewport = $('bgScrollViewport');
    if (!paddingEl || !fixedLayer || !viewport) return;

    if (bgState.attachment !== 'fixed' || !bgState.imageOn) {
        fixedLayer.classList.remove('active');
        fixedLayer.style.backgroundImage = 'none';
        return;
    }

    fixedLayer.classList.add('active');
    fixedLayer.style.backgroundImage = `url("${bgState.imageUrl}")`;
    fixedLayer.style.backgroundRepeat = bgState.repeat;
    fixedLayer.style.backgroundSize = getBgSizeValue();

    const viewportRect = viewport.getBoundingClientRect();
    const paddingRect = paddingEl.getBoundingClientRect();

    const offsetLeft = paddingRect.left - viewportRect.left;
    const offsetTop = paddingRect.top - viewportRect.top;

    const { w: imgW, h: imgH } = getBgRenderSize();

    let targetX, targetY;
    if (bgState.positionMode === 'keyword') {
        const posMap = { left: 0, center: 0.5, right: 1, top: 0, bottom: 1 };
        const [hPart, vPart] = bgState.positionKeyword.split(' ');
        const hFactor = posMap[hPart] ?? 0.5;
        const vFactor = posMap[vPart] ?? 0.5;
        targetX = (viewportRect.width - imgW) * hFactor;
        targetY = (viewportRect.height - imgH) * vFactor;
    } else {
        targetX = (viewportRect.width - imgW) * (bgState.positionX / 100);
        targetY = (viewportRect.height - imgH) * (bgState.positionY / 100);
    }

    fixedLayer.style.backgroundPosition = `${targetX - offsetLeft}px ${targetY - offsetTop}px`;
}

function syncBgSizeSliders() {
    const hSlider = $('sliderBgSizeH');
    if (!hSlider) return;

    if (!bgState.imageOn) {
        $('valBgSizeW') && ($('valBgSizeW').textContent = '未设置');
        $('valBgSizeH') && ($('valBgSizeH').textContent = '未设置');
        return;
    }

    if (bgState.sizeW > 0 && bgState.sizeH === 0 &&
        bgImageNaturalSize.w > 0 && bgImageNaturalSize.h > 0) {

        const ratio = bgImageNaturalSize.h / bgImageNaturalSize.w;
        const paddingEl = $('bgDemoPadding');
        const boxW = paddingEl ? paddingEl.offsetWidth : 0;

        let displayH = 0;
        if (bgState.sizeMode === '%' && boxW > 0) {
            const actualW = boxW * bgState.sizeW / 100;
            const actualH = actualW * ratio;
            displayH = Math.round(actualH / boxW * 100);
        } else if (bgState.sizeMode === 'px') {
            displayH = Math.round(bgState.sizeW * ratio);
        }

        hSlider.value = Math.min(displayH, parseInt(hSlider.max, 10));
        $('valBgSizeH') && ($('valBgSizeH').textContent =
            displayH + (bgState.sizeMode === 'px' ? 'px' : '%') + '（等比）');
    } else {
        if (bgState.sizeH !== 0) hSlider.value = bgState.sizeH;
        $('valBgSizeH') && ($('valBgSizeH').textContent = bgState.sizeH > 0
            ? bgState.sizeH + (bgState.sizeMode === 'px' ? 'px' : '%')
            : '未设置');
    }

    $('valBgSizeW') && ($('valBgSizeW').textContent = bgState.sizeW > 0
        ? bgState.sizeW + (bgState.sizeMode === 'px' ? 'px' : '%')
        : '未设置');
}

function applyBg() {
    const paddingEl = $('bgDemoPadding');
    const fixedLayer = $('bgFixedImageLayer');
    if (!paddingEl) return;

    paddingEl.style.backgroundColor = bgState.color;

    if (bgState.imageOn && bgState.imageUrl) {
        if (bgState.attachment === 'scroll') {
            paddingEl.style.backgroundImage = `url("${bgState.imageUrl}")`;
            paddingEl.style.backgroundRepeat = bgState.repeat;
            paddingEl.style.backgroundPosition = getBgPositionValue();
            paddingEl.style.backgroundSize = getBgSizeValue();
            if (fixedLayer) {
                fixedLayer.classList.remove('active');
                fixedLayer.style.backgroundImage = 'none';
            }
        } else {
            paddingEl.style.backgroundImage = 'none';
            if (fixedLayer) {
                fixedLayer.classList.add('active');
                fixedLayer.style.backgroundImage = `url("${bgState.imageUrl}")`;
                fixedLayer.style.backgroundColor = 'transparent';
                fixedLayer.style.backgroundRepeat = bgState.repeat;
                fixedLayer.style.backgroundSize = getBgSizeValue();
            }
            updateFixedBgPosition();
        }
    } else {
        paddingEl.style.backgroundImage = 'none';
        if (fixedLayer) {
            fixedLayer.classList.remove('active');
            fixedLayer.style.backgroundImage = 'none';
        }
    }

    const disabled = !bgState.imageOn;
    document.querySelectorAll('[data-bg-repeat], [data-bg-position], [data-bg-size-mode], [data-bg-attach]')
        .forEach(btn => {
            btn.disabled = disabled;
            btn.style.opacity = disabled ? '0.35' : '1';
            btn.style.pointerEvents = disabled ? 'none' : 'auto';
        });
    ['sliderBgPosX', 'sliderBgPosY', 'sliderBgSizeW', 'sliderBgSizeH'].forEach(id => {
        const el = $(id);
        if (el) {
            el.disabled = disabled;
            el.style.opacity = disabled ? '0.35' : '1';
        }
    });

    $('codeBgColor') && ($('codeBgColor').textContent = bgState.color);
    $('codeBgImage') && ($('codeBgImage').textContent = bgState.imageOn ? `url("${bgState.imageUrl}")` : 'none');
    $('codeBgRepeat') && ($('codeBgRepeat').textContent = bgState.imageOn ? bgState.repeat : '—');
    $('codeBgPosition') && ($('codeBgPosition').textContent = bgState.imageOn ? getBgPositionValue() : '—');
    $('codeBgSize') && ($('codeBgSize').textContent = bgState.imageOn ? getBgSizeValue() : '—');
    $('codeBgAttach') && ($('codeBgAttach').textContent = bgState.imageOn ? bgState.attachment : '—');

    $('valBgColor') && ($('valBgColor').textContent = bgState.color);
    $('valBgImage') && ($('valBgImage').textContent = bgState.imageOn ? `url("${bgState.imageUrl}")` : 'none');
    $('valBgRepeat') && ($('valBgRepeat').textContent = bgState.imageOn ? bgState.repeat : '—');
    $('valBgPosition') && ($('valBgPosition').textContent = bgState.imageOn ? getBgPositionValue() : '—');
    $('valBgSize') && ($('valBgSize').textContent = bgState.imageOn ? getBgSizeValue() : '—');
    $('valBgAttach') && ($('valBgAttach').textContent = bgState.imageOn ? bgState.attachment : '—');
    $('valBgPositionPercent') && ($('valBgPositionPercent').textContent = `${bgState.positionX}% ${bgState.positionY}%`);

    const attachHint = $('bgAttachHint');
    if (attachHint) {
        if (bgState.imageOn && bgState.attachment === 'fixed') {
            attachHint.style.display = 'block';
            attachHint.innerHTML = `
                <strong>💡 演示：</strong>当前模拟 <code>background-attachment: fixed</code>。
                背景图会<strong>固定在模拟浏览器视口</strong>中不动，当你滚动右侧滚动条时，
                盒子会被划上去，但背景图始终停留在视口中。
                <br><em>（真实浏览器中 fixed 相对整个浏览器窗口定位；这里为了教学，相对模拟的视口定位。）</em>
            `;
        } else {
            attachHint.style.display = 'none';
        }
    }

    syncBgSizeSliders();
}

function initBackgroundSection() {
    loadBgImageSize();

    const viewport = $('bgScrollViewport');
    if (viewport) {
        viewport.addEventListener('scroll', () => {
            if (bgState.attachment === 'fixed' && bgState.imageOn) {
                updateFixedBgPosition();
            }
        });
    }

    document.querySelectorAll('[data-bg-color]').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('[data-bg-color]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            bgState.color = btn.dataset.bgColor;
            applyBg();
        });
    });

    document.querySelectorAll('[data-bg-image]').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('[data-bg-image]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            bgState.imageOn = btn.dataset.bgImage === 'on';
            applyBg();
        });
    });

    document.querySelectorAll('[data-bg-repeat]').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('[data-bg-repeat]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            bgState.repeat = btn.dataset.bgRepeat;
            applyBg();
        });
    });

    document.querySelectorAll('[data-bg-position]').forEach(btn => {
        btn.addEventListener('click', () => {
            bgState.positionMode = 'keyword';
            bgState.positionKeyword = btn.dataset.bgPosition;
            document.querySelectorAll('[data-bg-position]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            bgState.positionX = 50;
            bgState.positionY = 50;
            const sliderX = $('sliderBgPosX');
            const sliderY = $('sliderBgPosY');
            if (sliderX) sliderX.value = 50;
            if (sliderY) sliderY.value = 50;
            applyBg();
        });
    });

    initSlider({ id: 'sliderBgPosX', displayId: null, min: 0, max: 100, value: 50, onChange: v => {
        bgState.positionX = v;
        bgState.positionMode = 'percent';
        document.querySelectorAll('[data-bg-position]').forEach(b => b.classList.remove('active'));
        applyBg();
    }});
    initSlider({ id: 'sliderBgPosY', displayId: null, min: 0, max: 100, value: 50, onChange: v => {
        bgState.positionY = v;
        bgState.positionMode = 'percent';
        document.querySelectorAll('[data-bg-position]').forEach(b => b.classList.remove('active'));
        applyBg();
    }});

    document.querySelectorAll('[data-bg-size-mode]').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('[data-bg-size-mode]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            bgState.sizeMode = btn.dataset.bgSizeMode;
            applyBg();
        });
    });

    initSlider({ id: 'sliderBgSizeW', displayId: null, min: 0, max: 200, value: 0, onChange: v => {
        bgState.sizeW = v;
        if (bgState.sizeMode === 'cover' || bgState.sizeMode === 'contain') {
            bgState.sizeMode = '%';
            document.querySelectorAll('[data-bg-size-mode]').forEach(b => {
                b.classList.toggle('active', b.dataset.bgSizeMode === '%');
            });
        }
        applyBg();
    }});

    initSlider({ id: 'sliderBgSizeH', displayId: null, min: 0, max: 200, value: 0, onChange: v => {
        bgState.sizeH = v;
        if (bgState.sizeMode === 'cover' || bgState.sizeMode === 'contain') {
            bgState.sizeMode = '%';
            document.querySelectorAll('[data-bg-size-mode]').forEach(b => {
                b.classList.toggle('active', b.dataset.bgSizeMode === '%');
            });
        }
        applyBg();
    }});

    document.querySelectorAll('[data-bg-attach]').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('[data-bg-attach]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            bgState.attachment = btn.dataset.bgAttach;
            applyBg();
        });
    });

    applyBg();
}


/* ================================================================
   初始化
   ================================================================ */
export function initBoxModelModule() {
    initSectionSwitcher();
    initBorderSection();
    initPaddingSection();
    initMarginSection();
    initSizeSection();
    initBackgroundSection();
	
	// 挑战题库
	initChallengeUI('盒子模型');
	
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
}