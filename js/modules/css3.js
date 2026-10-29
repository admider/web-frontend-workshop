/* ================================================================
   css3.js · CSS3 扩展模块
   包含：圆角 / 阴影 / 透明度 / 渐变（圆心 at + 重复渐变环带区间）
         / 图片边框 / 多背景图像（图片 + SVG 兜底 + 3D 分层动画 + 拼图案例）
         + 四圆归圆等比缩放动画
   ================================================================ */

import { $, bindToggle } from '../core/utils.js';
import { initSlider } from '../components/slider.js';
import { initChallengeUI } from '../components/challenge-ui.js';

const css3State = {
    radiusUnit: 'px',
    radiusMode: 1,
    radiusValues: [0, 0, 0, 0],
    
    shadow: 'none',
    shadowH: 0,
    shadowV: 10,
    shadowBlur: 20,
    shadowColor: '#ffffff',
    
    opacityMode: 'opacity',
    opacity: 1,
    rgba: { r: 30, g: 58, b: 95, a: 1 },
    
    gradient: 'none',
    gradientColors: ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b'],
    gradientStops: [
        { start: 0,  end: 20 },
        { start: 20, end: 40 },
        { start: 40, end: 60 },
        { start: 60, end: 80 }
    ],
    gradientAngle: 45,
    gradientShape: 'circle',
    gradientPositionMode: 'keyword',
    gradientPositionKeyword: 'center',
    gradientPositionX: 50,
    gradientPositionY: 50,
    
    borderStyle: 'solid',
    borderWidth: 10,
    
    biSource: 'none',
    biSlice: 30,
    biRepeat: 'repeat',
    biWidth: 1,
    biOutset: 0,
    biFill: false,
    biUrl: '../img/icon.png',

    /* 多背景图像（已移除 multiBgColor） */
    multiBgCount: 3,
    multiBgLayers: [
        { image: '../img/bg.png',    position: 'center',       size: 'cover', repeat: 'no-repeat' },
        { image: '../img/icon.png',  position: 'top left',     size: '40%',   repeat: 'no-repeat' },
        { image: '../img/panda.png', position: 'bottom right', size: '35%',   repeat: 'no-repeat' },
        { image: '../img/bg.png',    position: 'center',       size: '100%',  repeat: 'no-repeat' }
    ]
};

function initSidebarSwitch() {
    document.querySelectorAll('.sidebar-nav-item[data-css3]').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.sidebar-nav-item').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const target = btn.dataset.css3;
            document.querySelectorAll('.css3-control-group').forEach(g => g.classList.remove('active'));
            document.getElementById('ctrl-' + target)?.classList.add('active');

            const sliceArea = $('css3SliceArea');
            if (target === 'border-image' && css3State.biSource === 'on') {
                if (sliceArea) sliceArea.style.display = 'flex';
            } else {
                if (sliceArea) sliceArea.style.display = 'none';
            }

            /* 多背景左侧区块显隐 */
            const multiBgLeft = $('multiBgLeftSection');
            if (multiBgLeft) {
                multiBgLeft.style.display = (target === 'multi-bg') ? 'flex' : 'none';
            }

            applyCss3();
        });
    });
}

/* 修改滑块最大值，允许到 240 */
function buildRadiusSliders() {
    const container = $('radiusSliders');
    if (!container) return;

    const labels = { 1: ['四角统一'], 2: ['左上右下', '右上左下'], 3: ['左上', '右上左下', '右下'], 4: ['左上', '右上', '右下', '左下'] };
    const mode = parseInt(css3State.radiusMode, 10);
    const max = css3State.radiusUnit === 'px' ? 240 : 200; 
    const labelArr = labels[mode];

    container.innerHTML = labelArr.map((label, i) => {
        const val = css3State.radiusValues[i];
        const unit = css3State.radiusUnit;
        return `
            <div class="padding-slider-item">
                <label>
                    <span>${label}</span>
                    <span class="value-display" data-radius-display="${i}">${val}${unit}</span>
                </label>
                <input type="range" data-radius-slider="${i}" min="0" max="${max}" value="${val}">
            </div>
        `;
    }).join('');

    container.querySelectorAll('[data-radius-slider]').forEach(slider => {
        slider.addEventListener('input', e => {
            const i = parseInt(slider.dataset.radiusSlider, 10);
            const v = parseInt(e.target.value, 10);
            css3State.radiusValues[i] = v;
            const display = container.querySelector(`[data-radius-display="${i}"]`);
            if (display) display.textContent = v + css3State.radiusUnit;
            applyCss3();
        });
    });
}

function getFourCornerValues() {
    const mode = parseInt(css3State.radiusMode, 10);
    const v = css3State.radiusValues;
    if (mode === 1) return [v[0], v[0], v[0], v[0]];
    if (mode === 2) return [v[0], v[1], v[0], v[1]];
    if (mode === 3) return [v[0], v[1], v[2], v[1]];
    return [v[0], v[1], v[2], v[3]];
}

/* 计算径向渐变的圆心位置字符串（at 后面那部分） */
function getRadialPositionValue() {
    if (css3State.gradientPositionMode === 'percent') {
        return `${css3State.gradientPositionX}% ${css3State.gradientPositionY}%`;
    }
    return css3State.gradientPositionKeyword;
}

/* 生成重复渐变的颜色段字符串，如：
   "#3b82f6 0px 20px, #f59e0b 20px 40px" */
function getRepeatingStopsStr(colorCount) {
    const parts = [];
    for (let i = 0; i < colorCount; i++) {
        const color = css3State.gradientColors[i];
        const stop = css3State.gradientStops[i] || { start: i * 20, end: (i + 1) * 20 };
        parts.push(`${color} ${stop.start}px ${stop.end}px`);
    }
    return parts.join(', ');
}

/* ================================================================
   多背景 · 图片兜底（SVG）
   ================================================================ */
const MULTI_BG_FALLBACKS = {
    '../img/bg.png':    'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="%231e3a5f"/><circle cx="50" cy="50" r="35" fill="%233b82f6" opacity="0.6"/></svg>',
    '../img/icon.png':  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23ec4899"/><circle cx="50" cy="50" r="30" fill="%23fdf2f8"/></svg>',
    '../img/panda.png': 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="%2310b981"/><circle cx="50" cy="50" r="30" fill="%23ecfdf5"/></svg>'
};

const multiBgImageCache = {};

function probeImage(path) {
    return new Promise(resolve => {
        if (multiBgImageCache[path] !== undefined) {
            resolve(multiBgImageCache[path]);
            return;
        }
        const img = new Image();
        img.onload = () => {
            multiBgImageCache[path] = path;
            resolve(path);
        };
        img.onerror = () => {
            const fallback = MULTI_BG_FALLBACKS[path] || 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23334155"/><text x="50" y="55" font-size="12" fill="%2394a3b8" text-anchor="middle">IMG</text></svg>';
            multiBgImageCache[path] = fallback;
            resolve(fallback);
        };
        img.src = path;
    });
}

function getResolvedImage(path) {
    return multiBgImageCache[path] || path;
}

/* 生成单层 background-image 字符串 */
function buildMultiBgLayerImage(layer) {
    if (!layer || !layer.image) return 'none';
    return `url("${getResolvedImage(layer.image)}")`;
}

function getMultiBgLayerStyle(layer) {
    if (!layer) return { image: 'none', position: 'center', size: 'auto', repeat: 'no-repeat' };
    return {
        image: buildMultiBgLayerImage(layer),
        position: layer.position || 'center',
        size: layer.size || 'cover',
        repeat: layer.repeat || 'no-repeat'
    };
}

/* ================================================================
   渐变面板
   ================================================================ */
function buildGradientPanel() {
    const panel = $('gradientPanel');
    if (!panel) return;
    if (css3State.gradient === 'none') { panel.classList.remove('active'); return; }

    panel.classList.add('active');
    const colorOptions = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4'];
    const colorCount = (css3State.gradient === 'linear' || css3State.gradient === 'radial') ? 3 : 2;
    const isRepeating =
        css3State.gradient === 'repeating-linear' ||
        css3State.gradient === 'repeating-radial';

    let html = '';

    if (css3State.gradient === 'linear' || css3State.gradient === 'repeating-linear') {
        html += `
            <div class="gradient-param-row">
                <label>角度</label>
                <input type="range" id="gradientAngle" min="0" max="360" value="${css3State.gradientAngle}">
                <span class="value-display" id="valGradientAngle">${css3State.gradientAngle}deg</span>
            </div>
        `;
    }

    if (css3State.gradient === 'radial' || css3State.gradient === 'repeating-radial') {
        html += `
            <div class="gradient-param-row">
                <label>形状</label>
                <select id="gradientShape">
                    <option value="circle" ${css3State.gradientShape === 'circle' ? 'selected' : ''}>circle</option>
                    <option value="ellipse" ${css3State.gradientShape === 'ellipse' ? 'selected' : ''}>ellipse</option>
                </select>
            </div>
        `;

        html += `
            <div class="gradient-param-row" style="flex-wrap: wrap; gap: 6px;">
                <label style="min-width: 70px;">圆心位置</label>
                <div style="display: flex; gap: 4px; flex-wrap: wrap; width: 100%;">
                    <button class="preset-btn ${css3State.gradientPositionMode === 'keyword' && css3State.gradientPositionKeyword === 'center' ? 'active' : ''}" data-grad-pos="center">center</button>
                    <button class="preset-btn ${css3State.gradientPositionMode === 'keyword' && css3State.gradientPositionKeyword === 'top' ? 'active' : ''}" data-grad-pos="top">top</button>
                    <button class="preset-btn ${css3State.gradientPositionMode === 'keyword' && css3State.gradientPositionKeyword === 'bottom' ? 'active' : ''}" data-grad-pos="bottom">bottom</button>
                    <button class="preset-btn ${css3State.gradientPositionMode === 'keyword' && css3State.gradientPositionKeyword === 'left' ? 'active' : ''}" data-grad-pos="left">left</button>
                    <button class="preset-btn ${css3State.gradientPositionMode === 'keyword' && css3State.gradientPositionKeyword === 'right' ? 'active' : ''}" data-grad-pos="right">right</button>
                    <button class="preset-btn ${css3State.gradientPositionMode === 'keyword' && css3State.gradientPositionKeyword === 'top left' ? 'active' : ''}" data-grad-pos="top left">top left</button>
                    <button class="preset-btn ${css3State.gradientPositionMode === 'keyword' && css3State.gradientPositionKeyword === 'bottom right' ? 'active' : ''}" data-grad-pos="bottom right">bottom right</button>
                </div>
            </div>

            <div class="gradient-param-row">
                <label>X 百分比</label>
                <input type="range" id="gradientPosX" min="0" max="100" value="${css3State.gradientPositionX}">
                <span class="value-display" id="valGradientPosX">${css3State.gradientPositionX}%</span>
            </div>
            <div class="gradient-param-row">
                <label>Y 百分比</label>
                <input type="range" id="gradientPosY" min="0" max="100" value="${css3State.gradientPositionY}">
                <span class="value-display" id="valGradientPosY">${css3State.gradientPositionY}%</span>
            </div>

            <div class="hint-box" style="font-size: 11px; margin-top: 4px; padding: 8px;">
                <strong>💡 at 语法：</strong>关键词按钮与百分比滑块二选一。点击关键词后，滑块位置会同步但不生效；拖动滑块后，按钮取消选中，改用百分比定位。
            </div>
        `;
    }

    for (let i = 0; i < colorCount; i++) {
        const stop = css3State.gradientStops[i] || { start: i * 20, end: (i + 1) * 20 };
        html += `
            <div class="gradient-param-row" style="flex-wrap: wrap;">
                <label>颜色 ${i + 1}</label>
                <select id="gradientColor${i}">
                    ${colorOptions.map(c => `<option value="${c}" ${css3State.gradientColors[i] === c ? 'selected' : ''}>${c}</option>`).join('')}
                </select>
            </div>
        `;
        if (isRepeating) {
            html += `
                <div class="gradient-param-row" style="padding-left: 78px; margin-top: -4px;">
                    <label style="min-width: auto; font-size: 11px;">区间</label>
                    <input type="number" id="gradientStopStart${i}" min="0" max="200" step="1"
                           value="${stop.start}" style="width: 56px; padding: 3px 6px; font-size: 11px;">
                    <span style="color: var(--text-muted); font-size: 11px;">→</span>
                    <input type="number" id="gradientStopEnd${i}" min="0" max="200" step="1"
                           value="${stop.end}" style="width: 56px; padding: 3px 6px; font-size: 11px;">
                    <span style="color: var(--text-muted); font-size: 11px;">px</span>
                </div>
            `;
        }
    }
    panel.innerHTML = html;

    $('gradientAngle')?.addEventListener('input', e => {
        css3State.gradientAngle = parseInt(e.target.value, 10);
        $('valGradientAngle').textContent = css3State.gradientAngle + 'deg';
        applyCss3();
    });
    $('gradientShape')?.addEventListener('change', e => {
        css3State.gradientShape = e.target.value;
        applyCss3();
    });

    panel.querySelectorAll('[data-grad-pos]').forEach(btn => {
        btn.addEventListener('click', () => {
            panel.querySelectorAll('[data-grad-pos]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            css3State.gradientPositionMode = 'keyword';
            css3State.gradientPositionKeyword = btn.dataset.gradPos;

            const posMap = {
                'center': [50, 50],
                'top': [50, 0],
                'bottom': [50, 100],
                'left': [0, 50],
                'right': [100, 50],
                'top left': [0, 0],
                'bottom right': [100, 100]
            };
            const [x, y] = posMap[btn.dataset.gradPos] || [50, 50];
            css3State.gradientPositionX = x;
            css3State.gradientPositionY = y;
            const sx = $('gradientPosX'), sy = $('gradientPosY');
            if (sx) sx.value = x;
            if (sy) sy.value = y;
            if ($('valGradientPosX')) $('valGradientPosX').textContent = x + '%';
            if ($('valGradientPosY')) $('valGradientPosY').textContent = y + '%';

            applyCss3();
        });
    });

    $('gradientPosX')?.addEventListener('input', e => {
        css3State.gradientPositionX = parseInt(e.target.value, 10);
        css3State.gradientPositionMode = 'percent';
        if ($('valGradientPosX')) $('valGradientPosX').textContent = css3State.gradientPositionX + '%';
        panel.querySelectorAll('[data-grad-pos]').forEach(b => b.classList.remove('active'));
        applyCss3();
    });
    $('gradientPosY')?.addEventListener('input', e => {
        css3State.gradientPositionY = parseInt(e.target.value, 10);
        css3State.gradientPositionMode = 'percent';
        if ($('valGradientPosY')) $('valGradientPosY').textContent = css3State.gradientPositionY + '%';
        panel.querySelectorAll('[data-grad-pos]').forEach(b => b.classList.remove('active'));
        applyCss3();
    });

    for (let i = 0; i < colorCount; i++) {
        $(`gradientColor${i}`)?.addEventListener('change', e => {
            css3State.gradientColors[i] = e.target.value;
            applyCss3();
        });
        if (isRepeating) {
            $(`gradientStopStart${i}`)?.addEventListener('input', e => {
                const v = Math.max(0, parseInt(e.target.value, 10) || 0);
                css3State.gradientStops[i].start = v;
                applyCss3();
            });
            $(`gradientStopEnd${i}`)?.addEventListener('input', e => {
                const v = Math.max(0, parseInt(e.target.value, 10) || 0);
                css3State.gradientStops[i].end = v;
                applyCss3();
            });
        }
    }
}

/* ================================================================
   多背景面板（图片层 + 3D 分层舞台）
   ================================================================ */
const MULTI_BG_IMAGE_OPTIONS = [
    { value: '../img/bg.png',    label: '背景图 bg.png' },
    { value: '../img/icon.png',  label: '图标 icon.png' },
    { value: '../img/panda.png', label: '熊猫 panda.png' }
];

function buildMultiBgPanel() {
    const container = $('multiBgLayers');
    const scene = $('multiBgScene');
    if (!container) return;

    const count = css3State.multiBgCount;
    const positionOptions = [
        'left top', 'center top', 'right top',
        'left center', 'center', 'right center',
        'left bottom', 'center bottom', 'right bottom'
    ];
    const sizeOptions = ['auto', 'cover', 'contain', '30%', '40%', '50%', '100%'];
    const repeatOptions = ['no-repeat', 'repeat', 'repeat-x', 'repeat-y'];

    /* ---------- 1. 控制面板 ---------- */
    let html = '';
    for (let i = 0; i < count; i++) {
        const layer = css3State.multiBgLayers[i];
        if (!layer) continue;
        const isTop = i === 0;
        const imgPath = getResolvedImage(layer.image);

        html += `
            <div class="multi-bg-layer ${isTop ? 'is-top' : ''}" data-layer="${i}">
                <div class="multi-bg-layer-header">
                    <span>图层 ${i + 1}</span>
                    <span class="layer-order ${isTop ? 'top-layer' : ''}">${isTop ? '最上层' : '第 ' + (i + 1) + ' 层'}</span>
                </div>

                <div class="multi-bg-layer-row">
                    <label>图片</label>
                    <select data-mbg="image" data-layer="${i}">
                        ${MULTI_BG_IMAGE_OPTIONS.map(opt =>
                            `<option value="${opt.value}" ${layer.image === opt.value ? 'selected' : ''}>${opt.label}</option>`
                        ).join('')}
                    </select>
                </div>

                <div class="multi-bg-layer-thumb" style="background-image: url('${imgPath}');"></div>

                <div class="multi-bg-layer-row">
                    <label>位置</label>
                    <select data-mbg="position" data-layer="${i}">
                        ${positionOptions.map(p => `<option value="${p}" ${layer.position === p ? 'selected' : ''}>${p}</option>`).join('')}
                    </select>
                </div>

                <div class="multi-bg-layer-row">
                    <label>大小</label>
                    <select data-mbg="size" data-layer="${i}">
                        ${sizeOptions.map(s => `<option value="${s}" ${layer.size === s ? 'selected' : ''}>${s}</option>`).join('')}
                    </select>
                </div>

                <div class="multi-bg-layer-row">
                    <label>平铺</label>
                    <select data-mbg="repeat" data-layer="${i}">
                        ${repeatOptions.map(r => `<option value="${r}" ${layer.repeat === r ? 'selected' : ''}>${r}</option>`).join('')}
                    </select>
                </div>
            </div>
        `;
    }
    container.innerHTML = html;

    /* ---------- 2. 3D 分层舞台 ---------- */
    if (scene) {
        scene.innerHTML = '';
        const layers = css3State.multiBgLayers.slice(0, count);
        for (let i = layers.length - 1; i >= 0; i--) {
            const layer = layers[i];
            const plane = document.createElement('div');
            plane.className = 'multi-bg-plane hidden-before-insert';
            plane.dataset.layer = i;
            plane.dataset.label = `图层 ${i + 1}`;
            const imgPath = getResolvedImage(layer.image);
            plane.style.backgroundImage = `url("${imgPath}")`;
            plane.style.backgroundPosition = layer.position;
            plane.style.backgroundSize = layer.size;
            plane.style.backgroundRepeat = layer.repeat;
            plane.style.setProperty('--z-offset', `${(layers.length - 1 - i) * 30 + 10}px`);
            scene.appendChild(plane);
        }
    }

    /* ---------- 3. 事件绑定 ---------- */
    container.querySelectorAll('[data-mbg]').forEach(el => {
        const layerIndex = parseInt(el.dataset.layer, 10);
        const key = el.dataset.mbg;

        el.addEventListener('change', e => {
            const layer = css3State.multiBgLayers[layerIndex];
            if (!layer) return;
            const val = e.target.value;
            layer[key] = val;
            if (key === 'image') {
                probeImage(val).then(() => {
                    buildMultiBgPanel();
                    applyCss3();
                });
            } else {
                buildMultiBgPanel();
                applyCss3();
            }
        });
    });
}

/* ================================================================
   多背景 3D 舞台动画：逐层插入
   ================================================================ */
let multiBgAnimTimers = [];

function playMultiBgInsertAnimation() {
    const scene = $('multiBgScene');
    if (!scene) return;

    multiBgAnimTimers.forEach(t => clearTimeout(t));
    multiBgAnimTimers = [];

    const planes = scene.querySelectorAll('.multi-bg-plane');
    planes.forEach(p => {
        p.classList.remove('inserting');
        p.classList.add('hidden-before-insert');
    });

    planes.forEach((plane, idx) => {
        multiBgAnimTimers.push(setTimeout(() => {
            plane.classList.remove('hidden-before-insert');
            plane.classList.add('inserting');
        }, idx * 350));
    });
}

/* ================================================================
   拼图动态案例（四块统一用 bg.png）
   ================================================================ */
function initMultiBgPuzzle() {
    const box = $('multiBgPuzzleBox');
    const playBtn = $('multiBgPuzzlePlay');
    const resetBtn = $('multiBgPuzzleReset');
    const codeBox = $('multiBgPuzzleCode');
    if (!box) return;

    // 统一使用 bg.png
    const puzzleImg = '../img/bg.png';

    probeImage(puzzleImg).then(resolved => {
        box.innerHTML = '';
        const positions = ['tl', 'tr', 'bl', 'br'];
        positions.forEach(cls => {
            const el = document.createElement('div');
            el.className = 'puzzle-piece ' + cls;
            el.style.backgroundImage = `url("${resolved}")`;
            box.appendChild(el);
        });
    });

    playBtn?.addEventListener('click', () => {
        box.classList.remove('puzzle-play');
        void box.offsetWidth;
        box.classList.add('puzzle-play');
    });

    resetBtn?.addEventListener('click', () => {
        box.classList.remove('puzzle-play');
    });

    if (codeBox) {
        codeBox.innerHTML = renderCode(`.puzzle-box {
  background-image:
    url("../img/bg.png"),
    url("../img/bg.png"),
    url("../img/bg.png"),
    url("../img/bg.png");
  background-position:
    0 0,
    -100px 0,
    0 -100px,
    -100px -100px;
  background-size: 200px 200px;
  background-repeat: no-repeat;
}`);
    }
}

function updateSliceVisualizer() {
    const wrapper = $('sliceSourceWrapper');
    if (!wrapper) return;
    const displayW = wrapper.offsetWidth;
    const displayH = wrapper.offsetHeight;
    if (!displayW || !displayH) { setTimeout(updateSliceVisualizer, 200); return; }

    const offsetX = displayW * (css3State.biSlice / 100);
    const offsetY = displayH * (css3State.biSlice / 100);

    const lineTop = $('sliceLineTop'), lineRight = $('sliceLineRight'), lineBottom = $('sliceLineBottom'), lineLeft = $('sliceLineLeft');
    if (lineTop) lineTop.style.top = offsetY + 'px';
    if (lineRight) lineRight.style.right = offsetX + 'px';
    if (lineBottom) lineBottom.style.bottom = offsetY + 'px';
    if (lineLeft) lineLeft.style.left = offsetX + 'px';

    const gap = 2;
    const positions = {
        1: { top: 0, left: 0, width: offsetX - gap, height: offsetY - gap },
        2: { top: 0, left: offsetX, right: offsetX, height: offsetY - gap },
        3: { top: 0, right: 0, width: offsetX - gap, height: offsetY - gap },
        4: { top: offsetY, bottom: offsetY, left: 0, width: offsetX - gap },
        5: { top: offsetY, bottom: offsetY, left: offsetX, right: offsetX },
        6: { top: offsetY, bottom: offsetY, right: 0, width: offsetX - gap },
        7: { bottom: 0, left: 0, width: offsetX - gap, height: offsetY - gap },
        8: { bottom: 0, left: offsetX, right: offsetX, height: offsetY - gap },
        9: { bottom: 0, right: 0, width: offsetX - gap, height: offsetY - gap }
    };

    wrapper.querySelectorAll('.slice-cell').forEach(cell => {
        const idx = parseInt(cell.dataset.cell, 10);
        const pos = positions[idx];
        if (!pos) return;
        cell.style.top = pos.top !== undefined ? pos.top + 'px' : 'auto';
        cell.style.bottom = pos.bottom !== undefined ? pos.bottom + 'px' : 'auto';
        cell.style.left = pos.left !== undefined ? pos.left + 'px' : 'auto';
        cell.style.right = pos.right !== undefined ? pos.right + 'px' : 'auto';
        cell.style.width = pos.width !== undefined ? pos.width + 'px' : 'auto';
        cell.style.height = pos.height !== undefined ? pos.height + 'px' : 'auto';
    });
}

let sliceAnimTimers = [];
function playSliceAnimation() {
    sliceAnimTimers.forEach(t => clearTimeout(t));
    sliceAnimTimers = [];
    document.querySelectorAll('.flying-piece').forEach(el => el.remove());
    const wrapper = $('sliceSourceWrapper'), demoBox = $('css3DemoBox');
    if (!wrapper || !demoBox) return;

    wrapper.classList.remove('animating');
    sliceAnimTimers.push(setTimeout(() => { wrapper.classList.add('animating'); }, 600));
    sliceAnimTimers.push(setTimeout(() => { flyCornersToBox(demoBox); }, 900));
    sliceAnimTimers.push(setTimeout(() => { flyEdgesToBox(demoBox); }, 1500));
    if (css3State.biFill) { sliceAnimTimers.push(setTimeout(() => { flyCenterToBox(demoBox); }, 2100)); }
    sliceAnimTimers.push(setTimeout(() => { wrapper.classList.remove('animating'); }, 3200));
}

function getCellRect(cellIndex) {
    const cell = document.querySelector(`.slice-cell[data-cell="${cellIndex}"]`);
    if (!cell) return null;
    const rect = cell.getBoundingClientRect();
    return { left: rect.left, top: rect.top, width: rect.width, height: rect.height };
}
function createFlyingPiece(rect, className, color) {
    const piece = document.createElement('div');
    piece.className = 'flying-piece ' + (className || '');
    piece.style.left = rect.left + 'px'; piece.style.top = rect.top + 'px';
    piece.style.width = rect.width + 'px'; piece.style.height = rect.height + 'px';
    if (color) { piece.style.background = color.bg; piece.style.borderColor = color.border; }
    document.body.appendChild(piece);
    return piece;
}
function flyCornersToBox(demoBox) {
    const boxRect = demoBox.getBoundingClientRect();
    const cornerMap = [{ cell: 1, cornerX: 0, cornerY: 0 }, { cell: 3, cornerX: 1, cornerY: 0 }, { cell: 9, cornerX: 1, cornerY: 1 }, { cell: 7, cornerX: 0, cornerY: 1 }];
    cornerMap.forEach(({ cell, cornerX, cornerY }) => {
        const srcRect = getCellRect(cell);
        if (!srcRect) return;
        const piece = createFlyingPiece(srcRect, 'corner', { bg: 'rgba(236,72,153,.75)', border: 'rgba(236,72,153,1)' });
        piece.textContent = cell;
        const borderPx = css3State.borderWidth;
        const targetX = boxRect.left + cornerX * (boxRect.width - borderPx);
        const targetY = boxRect.top + cornerY * (boxRect.height - borderPx);
        requestAnimationFrame(() => {
            piece.style.left = targetX + 'px'; piece.style.top = targetY + 'px';
            piece.style.width = borderPx + 'px'; piece.style.height = borderPx + 'px';
        });
        setTimeout(() => piece.remove(), 1300);
    });
}
function flyEdgesToBox(demoBox) {
    const boxRect = demoBox.getBoundingClientRect();
    const borderPx = css3State.borderWidth, repeat = css3State.biRepeat;
    const edgeMap = [{ cell: 2, dir: 'top' }, { cell: 6, dir: 'right' }, { cell: 8, dir: 'bottom' }, { cell: 4, dir: 'left' }];
    edgeMap.forEach(({ cell, dir }) => {
        const srcRect = getCellRect(cell);
        if (!srcRect) return;
        const edgeLen = (dir === 'top' || dir === 'bottom') ? boxRect.width - borderPx * 2 : boxRect.height - borderPx * 2;
        const srcLen = (dir === 'top' || dir === 'bottom') ? srcRect.width : srcRect.height;
        let sliceCount = (repeat === 'stretch') ? 1 : Math.max(1, Math.floor(edgeLen / srcLen));
        const sliceLen = edgeLen / sliceCount;
        for (let i = 0; i < sliceCount; i++) {
            const piece = createFlyingPiece(srcRect, 'edge', { bg: 'rgba(59,130,246,.75)', border: 'rgba(59,130,246,1)' });
            piece.textContent = cell;
            let targetX, targetY, targetW, targetH;
            if (repeat === 'stretch') {
                targetW = (dir === 'top' || dir === 'bottom') ? edgeLen : borderPx;
                targetH = (dir === 'left' || dir === 'right') ? edgeLen : borderPx;
            } else {
                targetW = (dir === 'top' || dir === 'bottom') ? sliceLen : borderPx;
                targetH = (dir === 'left' || dir === 'right') ? sliceLen : borderPx;
            }
            const offset = i * sliceLen;
            if (dir === 'top') { targetX = boxRect.left + borderPx + offset; targetY = boxRect.top; }
            else if (dir === 'bottom') { targetX = boxRect.left + borderPx + offset; targetY = boxRect.top + boxRect.height - borderPx; }
            else if (dir === 'left') { targetX = boxRect.left; targetY = boxRect.top + borderPx + offset; }
            else { targetX = boxRect.left + boxRect.width - borderPx; targetY = boxRect.top + borderPx + offset; }
            requestAnimationFrame(() => {
                piece.style.left = targetX + 'px'; piece.style.top = targetY + 'px';
                piece.style.width = targetW + 'px'; piece.style.height = targetH + 'px';
            });
            setTimeout(() => piece.remove(), 1300);
        }
    });
}
function flyCenterToBox(demoBox) {
    const srcRect = getCellRect(5);
    if (!srcRect) return;
    const boxRect = demoBox.getBoundingClientRect(), borderPx = css3State.borderWidth;
    const piece = createFlyingPiece(srcRect, 'center', { bg: 'rgba(139,92,246,.5)', border: 'rgba(139,92,246,1)' });
    piece.textContent = '5';
    requestAnimationFrame(() => {
        piece.style.left = (boxRect.left + borderPx) + 'px'; piece.style.top = (boxRect.top + borderPx) + 'px';
        piece.style.width = (boxRect.width - borderPx * 2) + 'px'; piece.style.height = (boxRect.height - borderPx * 2) + 'px';
    });
    setTimeout(() => piece.remove(), 1300);
}

function renderCode(code) {
    let html = code
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    html = html.replace(/(&lt;\/?)([a-z0-9]+)/g, '$1<span class="sel">$2</span>');
    html = html.replace(/([a-z-]+)=(&quot;.*?&quot;)/g, '<span class="prop">$1</span>=<span class="val">$2</span>');
    return `<pre>${html}</pre>`;
}

function updateLiveCode(activeTab = 'radius') {
    const codeBox = $('css3LiveCode');
    if (!codeBox) return;

    const unit = css3State.radiusUnit;
    const mode = parseInt(css3State.radiusMode, 10);
    const v = css3State.radiusValues;
    let radiusStr = mode === 1 ? `${v[0]}${unit}` : (mode === 2 ? `${v[0]}${unit} ${v[1]}${unit}` : (mode === 3 ? `${v[0]}${unit} ${v[1]}${unit} ${v[2]}${unit}` : `${v[0]}${unit} ${v[1]}${unit} ${v[2]}${unit} ${v[3]}${unit}`));
    
    let shadowStr = 'none';
    if (css3State.shadow === 'on') {
        const r = parseInt(css3State.shadowColor.slice(1, 3), 16), g = parseInt(css3State.shadowColor.slice(3, 5), 16), b = parseInt(css3State.shadowColor.slice(5, 7), 16);
        shadowStr = `${css3State.shadowH}px ${css3State.shadowV}px ${css3State.shadowBlur}px rgba(${r},${g},${b},0.6)`;
    }

    let bgStr = '#1e3a5f';
    if (css3State.gradient === 'linear') {
        bgStr = `linear-gradient(${css3State.gradientAngle}deg, ${css3State.gradientColors.slice(0, 3).join(', ')})`;
    } else if (css3State.gradient === 'radial') {
        bgStr = `radial-gradient(${css3State.gradientShape} at ${getRadialPositionValue()}, ${css3State.gradientColors.slice(0, 3).join(', ')})`;
    } else if (css3State.gradient === 'repeating-linear') {
        bgStr = `repeating-linear-gradient(${css3State.gradientAngle}deg, ${getRepeatingStopsStr(2)})`;
    } else if (css3State.gradient === 'repeating-radial') {
        bgStr = `repeating-radial-gradient(${css3State.gradientShape} at ${getRadialPositionValue()}, ${getRepeatingStopsStr(2)})`;
    }

    let css = '.box {\n';
    if (activeTab === 'radius') css += `  border-radius: ${radiusStr};\n`;
    if (activeTab === 'shadow') css += `  box-shadow: ${shadowStr};\n`;
    
    if (activeTab === 'opacity') {
        if (css3State.opacityMode === 'opacity') {
            css += `  opacity: ${css3State.opacity.toFixed(2)};\n`;
        } else {
            css += `  background: rgba(${css3State.rgba.r}, ${css3State.rgba.g}, ${css3State.rgba.b}, ${css3State.rgba.a.toFixed(2)});\n`;
        }
    }
    
    if (activeTab === 'gradient') css += `  background: ${bgStr};\n`;
    if (activeTab === 'border-image') {
        css += `  border: ${css3State.borderWidth}px ${css3State.borderStyle};\n`;
        if (css3State.biSource === 'on') {
            css += `  border-image: url("${css3State.biUrl}") ${css3State.biSlice}%${css3State.biFill ? ' fill' : ''} / ${css3State.biWidth} / ${css3State.biOutset}px ${css3State.biRepeat};\n`;
        }
    }
    if (activeTab === 'multi-bg') {
        const layers = css3State.multiBgLayers.slice(0, css3State.multiBgCount);
        const styleArr = layers.map(layer => getMultiBgLayerStyle(layer));
        const imageStr = layers.map(layer => `url("${getResolvedImage(layer.image)}")`).join(', ');
        const positionStr = styleArr.map(s => s.position).join(', ');
        const sizeStr = styleArr.map(s => s.size).join(', ');
        const repeatStr = styleArr.map(s => s.repeat).join(', ');

        $('codeMultiBgImage') && ($('codeMultiBgImage').textContent = imageStr);
        $('codeMultiBgPosition') && ($('codeMultiBgPosition').textContent = positionStr);
        $('codeMultiBgSize') && ($('codeMultiBgSize').textContent = sizeStr);
        $('codeMultiBgRepeat') && ($('codeMultiBgRepeat').textContent = repeatStr);
    }
    css += '}';
    codeBox.innerHTML = renderCode(css);
}

/* ================================================================
   四圆回归一圆 · 自动等比缩放动画
   ================================================================ */
function playRadiusScaleAnimation() {
    const box = $('css3DemoBox') || $('css3RenderBox');
    if (!box) return;

    if (box.classList.contains('scaling')) return;

    const unit = css3State.radiusUnit;
    const base = 220;
    const rawR = getFourCornerValues().map(v =>
        unit === '%' ? (v / 100) * base : v
    );

    const needsScale =
        rawR[0] + rawR[1] > base ||
        rawR[3] + rawR[2] > base ||
        rawR[0] + rawR[3] > base ||
        rawR[1] + rawR[2] > base;
    if (!needsScale) return;

    const hTop    = rawR[0] + rawR[1];
    const hBottom = rawR[3] + rawR[2];
    const vLeft   = rawR[0] + rawR[3];
    const vRight  = rawR[1] + rawR[2];

    let scale = 1;
    if (hTop    > base) scale = Math.min(scale, base / hTop);
    if (hBottom > base) scale = Math.min(scale, base / hBottom);
    if (vLeft   > base) scale = Math.min(scale, base / vLeft);
    if (vRight  > base) scale = Math.min(scale, base / vRight);

    const realR = rawR.map(r => r * scale);

    const circles = [
        { el: $('radiusCircleTL'), raw: rawR[0] },
        { el: $('radiusCircleTR'), raw: rawR[1] },
        { el: $('radiusCircleBR'), raw: rawR[2] },
        { el: $('radiusCircleBL'), raw: rawR[3] }
    ];

    box.classList.add('scaling');

    circles.forEach(({ el }, i) => {
        if (!el) return;
        const d = realR[i] * 2;
        el.style.width = d + 'px';
        el.style.height = d + 'px';
        el.style.left = '50%';
        el.style.top = '50%';
        el.style.right = 'auto';
        el.style.bottom = 'auto';
        el.style.transform = 'translate(-50%, -50%)';
    });

    const flash = $('css3ScaleFlash');
    if (flash) {
        flash.classList.remove('active');
        void flash.offsetWidth;
        flash.classList.add('active');
    }

    setTimeout(() => {
        box.classList.remove('scaling');
        circles.forEach(({ el }) => {
            if (!el) return;
            el.style.left = '';
            el.style.top = '';
            el.style.right = '';
            el.style.bottom = '';
            el.style.transform = '';
            el.style.width = '';
            el.style.height = '';
        });
        applyCss3();
    }, 1200);
}

function applyCss3() {
    const box = $('css3DemoBox') || $('css3RenderBox');
    if (!box) return;

    /* 圆角 */
    const unit = css3State.radiusUnit;
    const mode = parseInt(css3State.radiusMode, 10);
    const v = css3State.radiusValues;
    let radiusStr = mode === 1 ? `${v[0]}${unit}` : (mode === 2 ? `${v[0]}${unit} ${v[1]}${unit}` : (mode === 3 ? `${v[0]}${unit} ${v[1]}${unit} ${v[2]}${unit}` : `${v[0]}${unit} ${v[1]}${unit} ${v[2]}${unit} ${v[3]}${unit}`));
    box.style.borderRadius = radiusStr;

    const corners = getFourCornerValues();
    const base = 220; 
    let rawR = corners.map(value => unit === '%' ? (value / 100) * base : value);
    
    let needsScale = false;
    if (rawR[0] + rawR[1] > base || rawR[3] + rawR[2] > base || 
        rawR[0] + rawR[3] > base || rawR[1] + rawR[2] > base) {
        needsScale = true;
    }

    const scaleWarning = $('scaleWarning');
    if (scaleWarning) {
        scaleWarning.classList.toggle('show', needsScale);
        const playBtn = $('btnPlayScale');
        if (playBtn) playBtn.disabled = !needsScale;
    }

    const labels = [ $('labelTL'), $('labelTR'), $('labelBR'), $('labelBL') ];
    const circles = [
        { el: $('radiusCircleTL'), rawValue: rawR[0], labelEl: labels[0] }, 
        { el: $('radiusCircleTR'), rawValue: rawR[1], labelEl: labels[1] },
        { el: $('radiusCircleBR'), rawValue: rawR[2], labelEl: labels[2] }, 
        { el: $('radiusCircleBL'), rawValue: rawR[3], labelEl: labels[3] }
    ];
    
    circles.forEach(({ el, rawValue, labelEl }) => {
        if (!el) return;
        
        if (rawValue > 0) {
            el.classList.add('active');
            if (el.id === 'radiusCircleTL') {
                el.style.left = rawValue + 'px';
                el.style.top = rawValue + 'px';
                el.style.transform = 'translate(-50%, -50%)';
            } else if (el.id === 'radiusCircleTR') {
                el.style.right = rawValue + 'px';
                el.style.top = rawValue + 'px';
                el.style.transform = 'translate(50%, -50%)';
            } else if (el.id === 'radiusCircleBR') {
                el.style.right = rawValue + 'px';
                el.style.bottom = rawValue + 'px';
                el.style.transform = 'translate(50%, 50%)';
            } else if (el.id === 'radiusCircleBL') {
                el.style.left = rawValue + 'px';
                el.style.bottom = rawValue + 'px';
                el.style.transform = 'translate(-50%, 50%)';
            }
            el.style.width = (rawValue * 2) + 'px';
            el.style.height = (rawValue * 2) + 'px';
            
            if (labelEl) {
                if (needsScale) {
                    labelEl.textContent = `r: ${Math.round(rawValue)}(已缩放)`;
                    labelEl.style.color = 'var(--accent-orange)';
                    labelEl.style.borderColor = 'var(--accent-orange)';
                } else {
                    labelEl.textContent = `r: ${Math.round(rawValue)}`;
                    labelEl.style.color = 'var(--accent-cyan)';
                    labelEl.style.borderColor = 'var(--accent-cyan)';
                }
            }
        } else {
            el.classList.remove('active');
            el.style.width = '0';
            el.style.height = '0';
            el.style.left = 'auto';
            el.style.top = 'auto';
            el.style.right = 'auto';
            el.style.bottom = 'auto';
            if (labelEl) labelEl.textContent = '';
        }
    });

    /* 阴影 */
    let shadowStr = 'none';
    if (css3State.shadow === 'on') {
        const r = parseInt(css3State.shadowColor.slice(1, 3), 16), g = parseInt(css3State.shadowColor.slice(3, 5), 16), b = parseInt(css3State.shadowColor.slice(5, 7), 16);
        shadowStr = `${css3State.shadowH}px ${css3State.shadowV}px ${css3State.shadowBlur}px rgba(${r},${g},${b},0.6)`;
    }
    box.style.boxShadow = shadowStr;

    /* 透明度 */
    if (css3State.opacityMode === 'opacity') {
        box.style.opacity = css3State.opacity;
        box.style.backgroundColor = '#1e3a5f';
    } else {
        box.style.opacity = '1';
        box.style.backgroundColor = `rgba(${css3State.rgba.r}, ${css3State.rgba.g}, ${css3State.rgba.b}, ${css3State.rgba.a})`;
    }

    /* 渐变 */
    let bgStr = css3State.opacityMode === 'opacity' ? '#1e3a5f' : '';
    if (css3State.gradient === 'linear') {
        bgStr = `linear-gradient(${css3State.gradientAngle}deg, ${css3State.gradientColors.slice(0, 3).join(', ')})`;
    } else if (css3State.gradient === 'radial') {
        bgStr = `radial-gradient(${css3State.gradientShape} at ${getRadialPositionValue()}, ${css3State.gradientColors.slice(0, 3).join(', ')})`;
    } else if (css3State.gradient === 'repeating-linear') {
        bgStr = `repeating-linear-gradient(${css3State.gradientAngle}deg, ${getRepeatingStopsStr(2)})`;
    } else if (css3State.gradient === 'repeating-radial') {
        bgStr = `repeating-radial-gradient(${css3State.gradientShape} at ${getRadialPositionValue()}, ${getRepeatingStopsStr(2)})`;
    }
    if (bgStr) box.style.background = bgStr;

    /* UI 同步（提前取 activeTab） */
    const shadowControls = $('shadowControls');
    if (shadowControls) shadowControls.classList.toggle('disabled', css3State.shadow === 'none');

    const activeTab = document.querySelector('.css3-control-group.active')?.id.replace('ctrl-', '') || 'radius';
    updateLiveCode(activeTab);

    /* 多背景图像：用逗号分隔，图层从后往前叠加（已移除背景色） */
    if (activeTab === 'multi-bg') {
        const layers = css3State.multiBgLayers.slice(0, css3State.multiBgCount);
        const styleArr = layers.map(layer => getMultiBgLayerStyle(layer));

        box.style.backgroundColor = 'transparent';
        box.style.backgroundImage = layers.map(layer => `url("${getResolvedImage(layer.image)}")`).join(', ');
        box.style.backgroundPosition = styleArr.map(s => s.position).join(', ');
        box.style.backgroundSize = styleArr.map(s => s.size).join(', ');
        box.style.backgroundRepeat = styleArr.map(s => s.repeat).join(', ');
    }

    /* 边框 */
    box.style.borderStyle = css3State.borderStyle;
    box.style.borderWidth = css3State.borderWidth + 'px';
    box.style.borderColor = '#ffffff'; 
    
    const borderEnabled = css3State.borderStyle !== 'none' && css3State.borderWidth > 0;
    
    if (css3State.biSource === 'none' || !borderEnabled) {
        box.style.borderImageSource = 'none'; 
        box.style.borderImageSlice = '';
        box.style.borderImageWidth = ''; 
        box.style.borderImageOutset = '';
        box.style.borderImageRepeat = '';
    } else {
        box.style.borderImageSource = `url("${css3State.biUrl}")`;
        box.style.borderImageSlice = css3State.biFill ? `${css3State.biSlice}% fill` : `${css3State.biSlice}%`;
        box.style.borderImageWidth = css3State.biWidth;
        box.style.borderImageOutset = css3State.biOutset + 'px';
        box.style.borderImageRepeat = css3State.biRepeat;
    }

    /* 九宫格区域显隐 */
    const sliceArea = $('css3SliceArea');
    if (sliceArea) {
        if (activeTab === 'border-image' && css3State.biSource === 'on') sliceArea.style.display = 'flex';
        else sliceArea.style.display = 'none';
    }

    updateSliceVisualizer();
}

export function initCss3Module() {
    initSidebarSwitch();

    /* 圆角 */
    document.querySelectorAll('[data-radius-unit]').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('[data-radius-unit]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            css3State.radiusUnit = btn.dataset.radiusUnit;
            css3State.radiusValues = [0, 0, 0, 0];
            buildRadiusSliders();
            applyCss3();
        });
    });
    document.querySelectorAll('[data-radius-mode]').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('[data-radius-mode]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            css3State.radiusMode = btn.dataset.radiusMode;
            css3State.radiusValues = [0, 0, 0, 0];
            buildRadiusSliders();
            applyCss3();
        });
    });

    /* 阴影 */
    document.querySelectorAll('[data-shadow]').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('[data-shadow]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            css3State.shadow = btn.dataset.shadow;
            applyCss3();
        });
    });
    initSlider({ id: 'sliderShadowH', displayId: 'valShadowH', min: -30, max: 30, value: 0, onChange: v => { css3State.shadowH = v; applyCss3(); } });
    initSlider({ id: 'sliderShadowV', displayId: 'valShadowV', min: -30, max: 30, value: 10, onChange: v => { css3State.shadowV = v; applyCss3(); } });
    initSlider({ id: 'sliderShadowBlur', displayId: 'valShadowBlur', min: 0, max: 60, value: 20, onChange: v => { css3State.shadowBlur = v; applyCss3(); } });
    $('inputShadowColor')?.addEventListener('input', e => {
        css3State.shadowColor = e.target.value;
        $('valShadowColor').textContent = e.target.value;
        applyCss3();
    });

    /* 透明度 */
    document.querySelectorAll('[data-opacity-mode]').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('[data-opacity-mode]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            css3State.opacityMode = btn.dataset.opacityMode;
            $('valOpacityMode').textContent = css3State.opacityMode;
            $('opacityModePanel').style.display = css3State.opacityMode === 'opacity' ? 'block' : 'none';
            $('rgbaModePanel').style.display = css3State.opacityMode === 'rgba' ? 'block' : 'none';
            applyCss3();
        });
    });

    const opacitySlider = $('sliderOpacity');
    const valOpacity = $('valOpacity');
    if (opacitySlider) {
        opacitySlider.addEventListener('input', e => {
            const v = parseInt(e.target.value, 10);
            css3State.opacity = v / 100;
            if (valOpacity) valOpacity.textContent = css3State.opacity.toFixed(2);
            applyCss3();
        });
    }

    const sliderRgbaA = $('sliderRgbaA');
    const valRgbaA = $('valRgbaA');
    if (sliderRgbaA) {
        sliderRgbaA.addEventListener('input', e => {
            const v = parseInt(e.target.value, 10);
            css3State.rgba.a = v / 100;
            if (valRgbaA) valRgbaA.textContent = css3State.rgba.a.toFixed(2);
            applyCss3();
            updateRgbaPreview();
        });
    }

    initSlider({ id: 'sliderRgbaR', displayId: 'valRgbaR', min: 0, max: 255, value: 30, onChange: v => { css3State.rgba.r = v; applyCss3(); updateRgbaPreview(); } });
    initSlider({ id: 'sliderRgbaG', displayId: 'valRgbaG', min: 0, max: 255, value: 58, onChange: v => { css3State.rgba.g = v; applyCss3(); updateRgbaPreview(); } });
    initSlider({ id: 'sliderRgbaB', displayId: 'valRgbaB', min: 0, max: 255, value: 95, onChange: v => { css3State.rgba.b = v; applyCss3(); updateRgbaPreview(); } });

    function updateRgbaPreview() {
        const el = $('rgbaPreview');
        if(el) el.style.backgroundColor = `rgba(${css3State.rgba.r}, ${css3State.rgba.g}, ${css3State.rgba.b}, ${css3State.rgba.a})`;
    }
    updateRgbaPreview();

    /* 渐变 */
    document.querySelectorAll('[data-gradient]').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('[data-gradient]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            css3State.gradient = btn.dataset.gradient;
            $('valGradient').textContent = btn.dataset.gradient === 'none' ? '无' : btn.dataset.gradient;
            buildGradientPanel();
            applyCss3();
        });
    });

    /* 边框 */
    document.querySelectorAll('[data-bg-border-style]').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('[data-bg-border-style]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            css3State.borderStyle = btn.dataset.bgBorderStyle;
            applyCss3();
        });
    });
    initSlider({ id: 'css3SliderBorderWidth', displayId: 'css3ValBorderWidth', min: 0, max: 40, value: 10, onChange: v => { css3State.borderWidth = v; applyCss3(); } });

    /* 图片边框 */
    document.querySelectorAll('[data-border-image-source]').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('[data-border-image-source]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            css3State.biSource = btn.dataset.borderImageSource;
            $('valBorderImageSource').textContent = css3State.biSource === 'on' ? '有' : '无';
            applyCss3();
        });
    });
    initSlider({ id: 'sliderBorderImageSlice', displayId: 'valBorderImageSlice', min: 5, max: 50, value: 30, unit: '%', onChange: v => { css3State.biSlice = v; applyCss3(); } });
    initSlider({ id: 'sliderBorderImageWidth', displayId: 'valBorderImageWidth', min: 1, max: 10, value: 1, step: 1, unit: '', onChange: v => { css3State.biWidth = v; applyCss3(); } });
    initSlider({ id: 'sliderBorderImageOutset', displayId: 'valBorderImageOutset', min: 0, max: 30, value: 0, unit: '', onChange: v => { css3State.biOutset = v; applyCss3(); } });
    $('selectBorderImageRepeat')?.addEventListener('change', e => {
        css3State.biRepeat = e.target.value;
        $('valBorderImageRepeat').textContent = e.target.value;
        applyCss3();
    });
    bindToggle('toggleBorderImageFill', active => { css3State.biFill = active; applyCss3(); });

    $('playSliceAnim')?.addEventListener('click', playSliceAnimation);

    /* 四圆归圆动画按钮 */
    $('btnPlayScale')?.addEventListener('click', playRadiusScaleAnimation);

    buildRadiusSliders();
    applyCss3();

    const sliceImg = $('sliceSourceImg');
    if (sliceImg) {
        if (sliceImg.complete) updateSliceVisualizer();
        else sliceImg.addEventListener('load', updateSliceVisualizer);
    }

    /* ==========================================================
       多背景图像初始化（已移除背景色）
       ========================================================== */
    initSlider({
        id: 'sliderMultiBgCount', displayId: 'valMultiBgCount',
        min: 1, max: 4, value: 3, step: 1, unit: '',
        onChange: v => {
            css3State.multiBgCount = v;
            buildMultiBgPanel();
            applyCss3();
        }
    });

    /* 预加载图片后构建面板 */
    Promise.all(css3State.multiBgLayers.map(l => probeImage(l.image))).then(() => {
        buildMultiBgPanel();
        applyCss3();
        initMultiBgPuzzle();
    });

    /* 3D 视角切换 */
    $('multiBgToggleView')?.addEventListener('click', () => {
        const scene = $('multiBgScene');
        if (!scene) return;
        if (scene.classList.contains('isometric')) {
            scene.classList.remove('isometric');
            scene.classList.add('flat');
        } else {
            scene.classList.remove('flat');
            scene.classList.add('isometric');
        }
    });

    /* 播放插入动画 */
    $('multiBgPlayInsert')?.addEventListener('click', playMultiBgInsertAnimation);

    /* 默认 3D 视角 */
    $('multiBgScene')?.classList.add('isometric');
	
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
	
	initChallengeUI('CSS3新增扩展属性');
}