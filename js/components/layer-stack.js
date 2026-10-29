/* ================================================================
   layer-stack.js · 图层栈面板组件
   ================================================================ */

/**
 * 更新共享浮动图层卡片
 * @param {object} options
 * @param {string} options.cardId - 卡片元素 ID
 * @param {string} options.thumbsId - 缩略图容器 ID
 * @param {string} options.metaId - 描述文字元素 ID
 * @param {Array<string>} options.floatingKeys - 浮动元素的 key 列表，如 ['a', 'b']
 * @param {object} options.floats - 当前浮动状态 { a: 'left', b: 'right', ... }
 */
export function updateSharedFloatLayer({ cardId, thumbsId, metaId, floatingKeys, floats }) {
    const card = document.getElementById(cardId);
    const thumbs = document.getElementById(thumbsId);
    const meta = document.getElementById(metaId);

    if (!card || !thumbs || !meta) return;

    const colors = {
        a: 'linear-gradient(135deg, #3b82f6, #2563eb)',
        b: 'linear-gradient(135deg, #10b981, #059669)',
        c: 'linear-gradient(135deg, #f59e0b, #d97706)'
    };

    thumbs.innerHTML = '';

    if (floatingKeys.length === 0) {
        card.style.opacity = '0.35';
        meta.textContent = '当前为空';
        return;
    }

    card.style.opacity = '1';
    floatingKeys.forEach(key => {
        const thumb = document.createElement('div');
        thumb.className = 'mini-thumb';
        thumb.style.background = colors[key] || '#666';
        thumb.textContent = key.toUpperCase();
        thumbs.appendChild(thumb);
    });

    const leftCount = floatingKeys.filter(k => floats[k] === 'left').length;
    const rightCount = floatingKeys.filter(k => floats[k] === 'right').length;
    const parts = [];
    if (leftCount) parts.push(`${leftCount} 个左浮动`);
    if (rightCount) parts.push(`${rightCount} 个右浮动`);
    meta.textContent = parts.join(' · ');
}

/**
 * 更新文档流图层卡片
 */
export function updateFlowLayerMeta(metaId, flowKeys) {
    const meta = document.getElementById(metaId);
    if (!meta) return;

    if (flowKeys.length === 0) {
        meta.textContent = '仅文字内容';
    } else {
        meta.textContent = flowKeys.map(k => k.toUpperCase()).join('、') + ' 依次排列';
    }
}

/**
 * 更新 Z 轴深度指示器
 */
export function updateDepthIndicator({ fillId, valueId, zLevel, maxZ = 200 }) {
    const fill = document.getElementById(fillId);
    const value = document.getElementById(valueId);
    if (!fill || !value) return;

    const percent = Math.min(100, (zLevel / maxZ) * 100);
    fill.style.width = Math.max(10, percent) + '%';
    value.textContent = 'z: ' + zLevel;
}