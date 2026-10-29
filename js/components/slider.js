/* ================================================================
   slider.js · 滑块组件
   ================================================================ */

/**
 * 初始化一个滑块
 * @param {object} options
 * @param {string} options.id - 滑块元素 ID
 * @param {string} options.displayId - 数值显示元素 ID
 * @param {number} options.min
 * @param {number} options.max
 * @param {number} options.value
 * @param {string} [options.unit] - 单位（如 'px'）
 * @param {Function} options.onChange - 值变化回调
 */
export function initSlider(options) {
    const slider = document.getElementById(options.id);
    const display = options.displayId ? document.getElementById(options.displayId) : null;

    if (!slider) return;

    if (options.min !== undefined) slider.min = options.min;
    if (options.max !== undefined) slider.max = options.max;
    if (options.value !== undefined) slider.value = options.value;

    const unit = options.unit || 'px';

    function updateDisplay(val) {
        if (display) display.textContent = val + unit;
    }

    updateDisplay(slider.value);

    slider.addEventListener('input', (e) => {
        const val = parseInt(e.target.value, 10);
        updateDisplay(val);
        if (options.onChange) options.onChange(val);
    });
}

/**
 * 批量初始化滑块
 * @param {Array<object>} configs
 */
export function initSliders(configs) {
    configs.forEach(initSlider);
}