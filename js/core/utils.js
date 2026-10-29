/* ================================================================
   utils.js · 通用工具函数
   ================================================================ */

/**
 * 简化的 DOM 选择器
 * @param {string} id - 元素 ID
 * @returns {HTMLElement}
 */
export function $(id) {
    return document.getElementById(id);
}

/**
 * 创建元素并设置属性
 * @param {string} tag
 * @param {object} attrs
 * @param {string} [text]
 * @returns {HTMLElement}
 */
export function createEl(tag, attrs = {}, text = '') {
    const el = document.createElement(tag);
    Object.entries(attrs).forEach(([key, value]) => {
        if (key === 'className') {
            el.className = value;
        } else if (key === 'style' && typeof value === 'object') {
            Object.assign(el.style, value);
        } else {
            el.setAttribute(key, value);
        }
    });
    if (text) el.textContent = text;
    return el;
}

/**
 * 防抖
 */
export function debounce(fn, delay = 100) {
    let timer = null;
    return function (...args) {
        clearTimeout(timer);
        timer = setTimeout(() => fn.apply(this, args), delay);
    };
}

/**
 * 绑定开关按钮
 * @param {string} id - 开关元素 ID
 * @param {Function} onChange - 状态变化回调
 */
export function bindToggle(id, onChange) {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('click', () => {
        el.classList.toggle('active');
        if (onChange) onChange(el.classList.contains('active'));
    });
}

/**
 * 更新步骤指示器
 * @param {string} containerId
 * @param {number} currentStep
 */
export function updateStepIndicator(containerId, currentStep) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.querySelectorAll('.step-dot').forEach((dot, i) => {
        dot.classList.remove('active', 'done');
        if (i < currentStep) dot.classList.add('done');
        if (i === currentStep) dot.classList.add('active');
    });
}

/**
 * 简单的 CSS 缓动函数
 */
export function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
}

/**
 * 设置元素样式（批量）
 */
export function setStyles(el, styles) {
    Object.assign(el.style, styles);
}

/**
 * 切换元素显示
 */
export function toggleDisplay(el, show) {
    el.style.display = show ? '' : 'none';
}