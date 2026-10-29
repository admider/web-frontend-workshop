/* ================================================================
   form.js · 表单模块全量交互逻辑 (最终定稿版)
   ================================================================ */

import { $ } from '../core/utils.js';

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

function renderCode(code) {
    let html = code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    html = html.replace(/(&lt;\/?)([a-z0-9]+)/g, '$1<span class="sel">$2</span>');
    html = html.replace(/([a-z-]+)=(&quot;.*?&quot;)/g, '<span class="prop">$1</span>=<span class="val">$2</span>');
    
    // 强制代码换行，防止撑破容器
    return `<pre style="white-space: pre-wrap; word-break: break-all; margin: 0;">${html}</pre>`;
}


/* ================================================================
   通用组件：按钮类的虚拟表单与提交控制台 (统一渲染)
   ================================================================ */
function renderBtnFormScenario(btnType, btnText, btnName, btnForm = '', btnDisabled = false, showFormAreas = false) {
    let disabledStyle = btnDisabled ? 'opacity: 0.5; cursor: not-allowed; filter: grayscale(1);' : '';
    let disabledAttr = btnDisabled ? ' disabled' : '';
    let formAttr = btnForm ? ` form="${btnForm}"` : '';
    
    // 统一的按钮标签，兼容 input 和 button
    let btnHtml = `<button type="${btnType}" name="${btnName}" class="form-btn" ${formAttr} ${disabledAttr} style="${disabledStyle}" onclick="window.triggerBtnAction(event, '${btnType}')">${btnText}</button>`;
    
    let formInnerBtn = btnForm ? '' : btnHtml;
    let externalBtn = btnForm ? btnHtml : '';

    // ====== 统一的表单内容 (使用 radio 保持一致) ======
    let formContent = `
        <div class="form-group">
            <label>用户名 (text)</label>
            <input type="text" name="username" id="simUserName" placeholder="请输入名字" value="张三">
        </div>
        <div class="form-group">
            <label>性别 (radio)</label>
            <div style="display:flex; gap: 16px;">
                <label class="demo-opt-label"><input type="radio" name="gender" value="male" checked> 男</label>
                <label class="demo-opt-label"><input type="radio" name="gender" value="female"> 女</label>
            </div>
        </div>
    `;

    // 模式 A：基础模式 (input 专属，不带区域框)
    if (!showFormAreas) {
        return `
            <div style="width: 100%; max-width: 300px;">
                <form id="simulatedBtnForm" onsubmit="event.preventDefault();">
                    ${formContent}
                    <div class="form-group" style="margin-top: 16px;">
                        ${btnHtml}
                    </div>
                </form>
                <div id="btnConsoleMock" style="margin-top: 16px; background: #000; border-radius: 8px; padding: 12px; border: 1px solid var(--bg-tertiary); font-family: var(--font-mono); font-size: 11px; color: var(--text-secondary); min-height: 80px; display: none;">
                    <div id="btnConsoleContent"></div>
                </div>
            </div>
        `;
    }

    // 模式 B：高级模式 (button 专属，带内/外区域和 SVG 连线)
    return `
        <div style="width: 100%; display: flex; flex-direction: column; gap: 16px;">
            <div class="btn-compare-stage">
                <svg class="svg-connection-layer" id="svgLayer"></svg>
                <div class="mock-form-area">
                    <form id="simulatedBtnForm" onsubmit="event.preventDefault();">
                        ${formContent}
                        <div style="margin-top: 12px;">${formInnerBtn}</div>
                    </form>
                </div>
                <div class="mock-external-area" id="externalArea">
                    ${externalBtn}
                </div>
            </div>
            <div id="btnConsoleMock" style="background: #000; border-radius: 8px; padding: 12px; border: 1px solid var(--bg-tertiary); font-family: var(--font-mono); font-size: 11px; color: var(--text-secondary); min-height: 80px; display: none;">
                <div id="btnConsoleContent"></div>
            </div>
        </div>
    `;
}

/* ================================================================
   通用组件：按钮行为模拟控制器
   ================================================================ */
window.triggerBtnAction = (e, type) => {
    if (e) e.preventDefault();
    const consoleBox = $('btnConsoleMock');
    const consoleContent = $('btnConsoleContent');
    if (!consoleBox || !consoleContent) return;
    consoleBox.style.display = 'block';

    const form = $('simulatedBtnForm');
    if (!form) return;

    if (type === 'submit') {
        const formData = new FormData(form);
        let dataStr = '';
        formData.forEach((val, key) => { dataStr += `  ${key}: "${val}"\n`; });
        
        consoleContent.innerHTML = `<div style="color: var(--accent-cyan);">> 触发了 submit (提交) 行为，正在收集数据...</div>`;
        consoleContent.innerHTML += `<pre style="color: var(--text-primary); margin-top: 6px;">${dataStr}</pre>`;
        
        setTimeout(() => {
            consoleContent.innerHTML += `<div style="color: var(--accent-green); font-weight: bold; margin-top: 4px;">> ✅ 提交成功！Server 返回 200 OK</div>`;
        }, 800);
    } else if (type === 'reset') {
        consoleContent.innerHTML = `<div style="color: var(--accent-orange);">> 🔄 触发了 reset (重置) 行为，表单已恢复默认。</div>`;
        form.reset();
    } else {
        consoleContent.innerHTML = `<div style="color: var(--text-muted);">> 普通按钮 (type="button")，无原生提交/重置行为。</div>`;
    }
};

// 绘制 button 绑定的连线
function drawSvgLine(container) {
    setTimeout(() => {
        const svgLayer = $('svgLayer');
        const formArea = container.querySelector('.mock-form-area');
        const btnEl = container.querySelector('.mock-external-area button');
        if (svgLayer && formArea && btnEl) {
            const stageRect = container.querySelector('.btn-compare-stage').getBoundingClientRect();
            const formRect = formArea.getBoundingClientRect();
            const btnRect = btnEl.getBoundingClientRect();
            const startX = formRect.right - stageRect.left;
            const startY = formRect.top + formRect.height / 2 - stageRect.top;
            const endX = btnRect.left - stageRect.left;
            const endY = btnRect.top + btnRect.height / 2 - stageRect.top;
            svgLayer.innerHTML = `<line class="svg-line" x1="${startX}" y1="${startY}" x2="${endX}" y2="${endY}" />`;
        }
    }, 50);
}

/* ================================================================
   模块 1：基础与容器
   ================================================================ */
// ... 保持你之前的 initBasicSection 不变 ...
function initBasicSection() {
    let currentAction = '/submit.php';
    let currentName = 'myForm';
    let currentMethod = 'GET';

    function updateBasicCode() {
        $('valMethod').textContent = currentMethod;
        $('animServerTarget').textContent = currentAction;
        const code = `<form action="${currentAction}" name="${currentName}" method="${currentMethod}">\n  <label>用户名：</label>\n  <input type="text" name="username">\n  <label>密码：</label>\n  <input type="password" name="password">\n  <button type="submit">提交表单</button>\n</form>`;
        $('basicCode').innerHTML = renderCode(code);
    }

    $('inputAction')?.addEventListener('input', (e) => { currentAction = e.target.value; updateBasicCode(); });
    $('inputName')?.addEventListener('input', (e) => { currentName = e.target.value; updateBasicCode(); });

    document.querySelectorAll('[data-method]').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('[data-method]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentMethod = btn.dataset.method;
            updateBasicCode();
        });
    });
    updateBasicCode();

    $('btnMockSubmit')?.addEventListener('click', (e) => {
        e.preventDefault();
        const animLayer = $('submitAnimLayer');
        const dataPacket = $('animDataPacket');
        const hint = $('submitResultHint');
        
        animLayer.classList.add('active');
        dataPacket.style.left = '15%';
        dataPacket.style.opacity = '1';
        dataPacket.style.transform = 'scale(1)';
        dataPacket.textContent = '表单数据';
        hint.innerHTML = '<strong>💡 动画演示中：</strong>数据正在收集并打包...';

        setTimeout(() => {
            dataPacket.style.left = '65%';
            dataPacket.textContent = currentMethod === 'GET' ? '数据(URL可见)' : '数据(隐式打包)';
            dataPacket.style.background = currentMethod === 'GET' ? 'var(--accent-orange)' : 'var(--accent-cyan)';
        }, 100);

        setTimeout(() => {
            dataPacket.style.opacity = '0';
            dataPacket.style.transform = 'scale(0.5)';
            if (currentMethod === 'GET') {
                hint.innerHTML = `<strong style="color:var(--accent-orange)">✅ GET 提交完成！</strong><br>数据被拼接到 URL：<br><code>${currentAction}?username=...&password=...</code>`;
            } else {
                hint.innerHTML = `<strong style="color:var(--accent-cyan)">✅ POST 提交完成！</strong><br>数据被放在 HTTP 请求体中，地址栏不可见。`;
            }
            setTimeout(() => { animLayer.classList.remove('active'); }, 1200);
        }, 1500);
    });
}

/* ================================================================
   模块 2：input 全量字典
   ================================================================ */
// ... 保持你之前的 initInputSection，只是按钮分支用通用渲染 ...
function initInputSection() {
    const inputDemoBox = $('inputDemoBox');
    const selectInputType = $('selectInputType');
    const dynamicProps = $('dynamicInputProps');
    
    let inputState = {
        type: 'text', name: 'userInput', value: '', color: '#3b82f6', 
        imgSrc: 'https://picsum.photos/150/40?random=1', imgAlt: '提交',
        required: false, disabled: false, readonly: false,
        placeholder: '请输入内容...', maxlength: 20, min: 0, max: 100, step: 1, size: 20,
        optionCount: 3, 
        options: [
            { value: 'opt1', checked: true }, { value: 'opt2', checked: false }, { value: 'opt3', checked: false },
            { value: 'opt4', checked: false }, { value: 'opt5', checked: false }, { value: 'opt6', checked: false }
        ]
    };

    function updateCode() {
        let code = '';
        if (inputState.type === 'radio' || inputState.type === 'checkbox') {
            for (let i = 0; i < inputState.optionCount; i++) {
                let opt = inputState.options[i];
                let checkedStr = opt.checked ? ' checked' : '';
                code += `<input type="${inputState.type}" name="${inputState.name}" value="${opt.value}"${checkedStr}> 选项 ${i + 1}\n`;
            }
        } else if (['submit', 'reset', 'button', 'image'].includes(inputState.type)) {
            code = `<input type="${inputState.type}"`;
            if (inputState.name) code += ` name="${inputState.name}"`;
            if (inputState.type === 'image') {
                if (inputState.imgSrc) code += ` src="${inputState.imgSrc}"`;
                if (inputState.imgAlt) code += ` alt="${inputState.imgAlt}"`;
            } else {
                if (inputState.value) code += ` value="${inputState.value}"`;
            }
            if (inputState.disabled) code += ` disabled`;
            code += `>`;
        } else {
            code = `<input type="${inputState.type}" name="${inputState.name}"`;
            if (inputState.type === 'color') code += ` value="${inputState.color}"`;
            else if (inputState.value) code += ` value="${inputState.value}"`;
            if (inputState.required) code += ` required`;
            if (inputState.disabled) code += ` disabled`;
            if (inputState.readonly) code += ` readonly`;
            if (['text', 'password', 'email', 'search', 'tel', 'url'].includes(inputState.type)) {
                if (inputState.placeholder) code += ` placeholder="${inputState.placeholder}"`;
                if (inputState.maxlength) code += ` maxlength="${inputState.maxlength}"`;
                if (inputState.size) code += ` size="${inputState.size}"`;
            }
            if (['number', 'range'].includes(inputState.type)) {
                code += ` min="${inputState.min}" max="${inputState.max}" step="${inputState.step}"`;
            }
            code += `>`;
        }
        $('inputCode').innerHTML = renderCode(code.trim());
    }

    // ... 保持你的 buildDynamicProps 完全不变 ...
    function buildDynamicProps() {
        let html = '';
        let isButton = ['submit', 'reset', 'button', 'image'].includes(inputState.type);
        let isTextLike = ['text', 'password', 'email', 'search', 'tel', 'url', 'number'].includes(inputState.type);
        let isRadioOrCheck = ['radio', 'checkbox'].includes(inputState.type);
        
        html += `<div class="control-group"><label>name (控件名称/组名)</label><input type="text" id="propName" class="text-input" value="${inputState.name}"></div>`;

        if (isTextLike) {
            html += `<div class="control-group" style="margin-top: 12px;"><label>value</label><input type="text" id="propValue" class="text-input" value="${inputState.value}"></div>`;
        } else if (isButton && inputState.type !== 'image') {
            html += `<div class="control-group" style="margin-top: 12px;"><label>value (按钮文字)</label><input type="text" id="propValue" class="text-input" value="${inputState.value}"></div>`;
        } else if (isRadioOrCheck) {
            html += `
                <div class="control-group" style="margin-top: 12px;">
                    <label>选项数量</label>
                    <div style="display:flex; gap:8px; align-items:center;">
                        <button class="btn btn-secondary" id="btnOptMinus" style="padding:4px 12px;">-</button>
                        <span style="font-weight:bold; color:var(--accent-cyan);" id="valOptCount">${inputState.optionCount}</span>
                        <button class="btn btn-secondary" id="btnOptPlus" style="padding:4px 12px;">+</button>
                    </div>
                </div>
                <div class="props-split-layout">
                    <div class="props-col"><div class="props-col-title">value(值)</div>
                        ${Array.from({length: inputState.optionCount}, (_, i) => `
                            <input type="text" class="text-input" style="padding:4px; font-size:11px;" data-opt-val="${i}" value="${inputState.options[i].value}" placeholder="值${i+1}">
                        `).join('')}
                    </div>
                    <div class="props-col"><div class="props-col-title">checked(默认)</div>
                        ${Array.from({length: inputState.optionCount}, (_, i) => `
                            <button class="checked-btn ${inputState.options[i].checked ? 'active' : ''}" data-opt-chk="${i}">选项${i+1}</button>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        if (!isButton && !isRadioOrCheck) {
            let innerHtml = '';
            if (inputState.type === 'color') {
                innerHtml += `<div class="control-group"><label>value (默认颜色)</label><input type="color" id="propColor" value="${inputState.color}" style="width: 100%; height: 32px; border-radius: 4px;"></div>`;
            }
            if (isTextLike) {
                innerHtml += `
                    <div class="control-group"><label>placeholder</label><input type="text" id="propPlaceholder" class="text-input" value="${inputState.placeholder}"></div>
                    <div class="control-group"><label>maxlength</label><input type="number" id="propMaxlength" class="text-input" value="${inputState.maxlength}"></div>
                `;
            }
            if (['number', 'range'].includes(inputState.type)) {
                innerHtml += `
                    <div class="control-group"><label>min</label><input type="number" id="propMin" class="text-input" value="${inputState.min}"></div>
                    <div class="control-group"><label>max</label><input type="number" id="propMax" class="text-input" value="${inputState.max}"></div>
                `;
            }
            if (inputState.type === 'file') {
                innerHtml += `<div class="control-group"><label>accept</label><input type="text" id="propAccept" class="text-input" value="image/*"></div>`;
            }
            if (innerHtml !== '') {
                html += `<div style="margin-top: 16px; border-top: 1px dashed var(--bg-tertiary); padding-top: 16px;">${innerHtml}</div>`; 
            }
        }

        html += `<div style="margin-top: 16px; border-top: 1px dashed var(--bg-tertiary); padding-top: 16px;">`;
        if (['text', 'password', 'email', 'search', 'tel', 'url', 'number', 'date', 'time', 'radio', 'checkbox', 'file'].includes(inputState.type)) {
            html += `<div class="toggle-row"><span>required</span><button class="toggle-switch ${inputState.required?'active':''}" data-prop="required"></button></div>`;
        }
        if (isTextLike || ['date', 'time'].includes(inputState.type)) {
            html += `<div class="toggle-row"><span>readonly</span><button class="toggle-switch ${inputState.readonly?'active':''}" data-prop="readonly"></button></div>`;
        }
        html += `<div class="toggle-row"><span>disabled</span><button class="toggle-switch ${inputState.disabled?'active':''}" data-prop="disabled"></button></div>`;
        html += `</div>`;

        if (isButton) {
            html += `
                <div class="hint-box" style="margin-top: 16px; border-left-color: var(--accent-pink); background: rgba(236, 72, 153, 0.05);">
                    <strong style="color: var(--accent-pink); font-size: 12px;">⚠️ 为什么现代开发不建议使用 input 按钮？</strong>
                    <p style="margin-top: 6px; font-size: 11px; color: var(--text-secondary); line-height: 1.5;">
                        虽然 <code>&lt;input type="submit"&gt;</code> 可以工作，但它的样式极难修改。你无法在 <code>value</code> 里放图标、图片或 HTML 标签。<br><br>
                        👉 <strong>现代推荐：</strong> 使用 <code>&lt;button&gt;</code> 标签。它的内部可以包含任意 HTML 结构（图标 + 文字），样式完全可控。
                    </p>
                </div>
            `;
        }

        dynamicProps.innerHTML = html;

        $('propName')?.addEventListener('input', (e) => { inputState.name = e.target.value; renderDemo(false); });
        $('propValue')?.addEventListener('input', (e) => { inputState.value = e.target.value; renderDemo(false); });
        $('propPlaceholder')?.addEventListener('input', (e) => { inputState.placeholder = e.target.value; renderDemo(false); });
        $('propMaxlength')?.addEventListener('input', (e) => { inputState.maxlength = parseInt(e.target.value); renderDemo(false); });
        $('propColor')?.addEventListener('input', (e) => { inputState.color = e.target.value; renderDemo(false); });
        $('propMin')?.addEventListener('input', (e) => { inputState.min = parseFloat(e.target.value); renderDemo(false); });
        $('propMax')?.addEventListener('input', (e) => { inputState.max = parseFloat(e.target.value); renderDemo(false); });

        dynamicProps.querySelectorAll('[data-opt-val]').forEach(input => {
            input.addEventListener('input', (e) => {
                const idx = parseInt(e.target.dataset.optVal, 10);
                inputState.options[idx].value = e.target.value;
                const optionDom = inputDemoBox.querySelector(`.visual-option-item[data-idx="${idx}"]`);
                if (optionDom) {
                    const valTag = optionDom.querySelector('.visual-value-tag');
                    if (valTag) valTag.textContent = `value="${e.target.value}"`;
                }
                updateCode();
            });
        });

        dynamicProps.querySelectorAll('[data-opt-chk]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                if (inputState.disabled) return;
                const idx = parseInt(e.target.dataset.optChk, 10);
                if (inputState.type === 'radio') {
                    for (let i = 0; i < inputState.optionCount; i++) inputState.options[i].checked = false;
                    inputState.options[idx].checked = true;
                } else {
                    inputState.options[idx].checked = !inputState.options[idx].checked;
                }
                buildDynamicProps();
                renderDemo(false);
            });
        });

        dynamicProps.querySelectorAll('[data-prop]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const prop = e.target.dataset.prop;
                inputState[prop] = !inputState[prop];
                e.target.classList.toggle('active');
                renderDemo(false);
            });
        });

        $('btnOptPlus')?.addEventListener('click', () => { if(inputState.optionCount < 6) { inputState.optionCount++; renderDemo(true); } });
        $('btnOptMinus')?.addEventListener('click', () => { if(inputState.optionCount > 2) { inputState.optionCount--; renderDemo(true); } });
    }

    function renderDemo(rebuildPanel = false) {
        let demoHtml = '';
        
        if (['text', 'password', 'email', 'number', 'range', 'color', 'file', 'date', 'time', 'search', 'tel', 'url', 'month', 'week'].includes(inputState.type)) {
            let attrStr = `type="${inputState.type}" name="${inputState.name}" `;
            if (inputState.type === 'color') attrStr += `value="${inputState.color}" `;
            else if (inputState.value) attrStr += `value="${inputState.value}" `;

            if (inputState.required) attrStr += `required `;
            if (inputState.disabled) attrStr += `disabled `;
            if (inputState.readonly) attrStr += `readonly `;
            if (['text', 'password', 'email', 'search', 'tel', 'url'].includes(inputState.type)) {
                if (inputState.placeholder) attrStr += `placeholder="${inputState.placeholder}" `;
                if (inputState.maxlength) attrStr += `maxlength="${inputState.maxlength}" `;
            }
            if (['number', 'range'].includes(inputState.type)) attrStr += `min="${inputState.min}" max="${inputState.max}" step="${inputState.step}" `;
            
            if (inputState.type === 'color') demoHtml = `<div class="form-group"><label>实时控件 (color)</label><input ${attrStr} style="width: 60px; height: 40px; padding: 0; cursor: pointer; background: transparent; border: 1px solid var(--bg-tertiary); border-radius: 4px;"></div>`;
            else demoHtml = `<div class="form-group"><label>实时控件 (${inputState.type})</label><input ${attrStr}></div>`;
        } 
        else if (['submit', 'reset', 'button', 'image'].includes(inputState.type)) {
            if (inputState.type === 'image') {
                let disabledStyle = inputState.disabled ? 'opacity: 0.5; pointer-events: none; filter: grayscale(1);' : '';
                demoHtml = `<div class="form-group"><input type="image" src="${inputState.imgSrc}" style="max-height: 40px; ${disabledStyle}"></div>`;
            } else {
                // 基础模式调用
                demoHtml = renderBtnFormScenario(inputState.type, inputState.value, inputState.name, '', inputState.disabled, false);
            }
        }
        else if (inputState.type === 'radio' || inputState.type === 'checkbox') {
            // ... 保持你的单选/复选框完整渲染逻辑 ...
            let optionsHtml = '';
            for (let i = 0; i < inputState.optionCount; i++) {
                let opt = inputState.options[i];
                let isActiveClass = opt.checked ? 'is-checked' : '';
                let disabledStyle = inputState.disabled ? 'opacity: 0.5; pointer-events: none; filter: grayscale(1);' : '';
                optionsHtml += `
                    <div class="visual-option-item ${isActiveClass}" data-idx="${i}" style="${disabledStyle}" onclick="window.handleOptionClick(event, ${i})">
                        <div class="visual-box-mock"></div>
                        <span style="flex:1; color: var(--text-primary); font-size: 14px;">选项 ${i+1}</span>
                        <span class="visual-value-tag">value="${opt.value}"</span>
                        <div class="check-stamp">checked</div>
                    </div>
                `;
            }
            demoHtml = `
                <div class="visual-group-border">
                    <div class="visual-group-label">name="${inputState.name}" (同一组)</div>
                    <div class="visual-options-list">${optionsHtml}</div>
                </div>
                <div class="mock-submit-btn" onclick="window.simulateGroupSubmit()">🚀 提交到服务器</div>
                <div class="visual-console-box" id="visualConsole" style="margin-top: 12px;">
                    <div style="color: var(--text-muted);">> 等待提交...</div>
                </div>
            `;
        }

        inputDemoBox.innerHTML = demoHtml;
        if (rebuildPanel) buildDynamicProps();
        updateCode();

        window.handleOptionClick = (event, idx) => {
            event.preventDefault(); event.stopPropagation(); 
            if (inputState.disabled) return;
            let isSelecting = !inputState.options[idx].checked;
            if (inputState.type === 'radio' && isSelecting) {
                for (let i = 0; i < inputState.optionCount; i++) inputState.options[i].checked = false;
            }
            inputState.options[idx].checked = isSelecting;
            const optionsDom = inputDemoBox.querySelectorAll('.visual-option-item');
            optionsDom.forEach((dom, i) => {
                if (inputState.options[i].checked) dom.classList.add('is-checked');
                else dom.classList.remove('is-checked');
            });
            updateCode();
            buildDynamicProps();
        };

        window.simulateGroupSubmit = () => {
            const consoleBox = $('visualConsole');
            if (!consoleBox) return;
            let selectedChecked = [];
            let logHtml = `<div style="color: var(--accent-cyan); font-weight: bold;">> [1] 开始收集表单数据...</div>`;
            for (let i = 0; i < inputState.optionCount; i++) {
                let opt = inputState.options[i];
                logHtml += `<div style="color: var(--text-secondary); margin-top: 4px;">> 遍历选项 ${i+1}: 它的 value 固定写死为 <strong style="color:var(--accent-orange);">"${opt.value}"</strong></div>`;
                if (opt.checked) {
                    logHtml += `<div style="color: var(--accent-green); margin-left: 10px;">  └─ 发现 checked="true" 标记！</div>`;
                    selectedChecked.push(opt.value);
                } else {
                    logHtml += `<div style="color: var(--text-muted); margin-left: 10px;">  └─ 无 checked 标记，跳过</div>`;
                }
            }
            consoleBox.innerHTML = logHtml;
            setTimeout(() => {
                if (selectedChecked.length === 0) {
                    consoleBox.innerHTML += `<div style="color: var(--accent-red); margin-top: 8px; font-weight: bold;">> ❌ 失败：你未选择任何选项！</div>`;
                    return;
                }
                let submitData = selectedChecked.join(',');
                consoleBox.innerHTML += `<div style="color: var(--accent-cyan); margin-top: 12px; font-weight: bold;">> [2] 通过 JS 动态获取选中项的 value...</div>`;
                consoleBox.innerHTML += `<div style="color: var(--text-primary); margin-top: 4px; background: rgba(255,255,255,0.1); padding: 6px; border-radius:4px;">> 收集到的数据：${inputState.name} = "${submitData}"</div>`;
                setTimeout(() => {
                    consoleBox.innerHTML += `<div style="color: var(--accent-green); margin-top: 12px; font-weight: bold;">> [3] 🚀 正在发送至服务器...</div>`;
                    setTimeout(() => {
                        consoleBox.innerHTML += `<div style="color: var(--accent-green); margin-top: 4px;">> ✅ 200 OK: 服务器接收成功！</div>`;
                    }, 800);
                }, 600);
            }, 1000);
        };
    }

    window.updateCheckedState = (idx) => {
        window.handleOptionClick({ preventDefault: () => {}, stopPropagation: () => {} }, idx);
    };

    selectInputType?.addEventListener('change', (e) => {
        inputState.type = e.target.value;
        if (['submit', 'reset', 'button'].includes(inputState.type)) {
            inputState.value = inputState.type;
        } else {
            inputState.value = '';
        }
        inputState.options = [
            { value: 'opt1', checked: true }, { value: 'opt2', checked: false }, { value: 'opt3', checked: false },
            { value: 'opt4', checked: false }, { value: 'opt5', checked: false }, { value: 'opt6', checked: false }
        ];
        inputState.disabled = false;
        inputState.required = false;
        renderDemo(true); 
    });

    renderDemo(true);
}

/* ================================================================
   模块 3：非 input 控件与按钮
   ================================================================ */
function initOtherSection() {
    const otherDemoBox = $('otherDemoBox');
    const otherCode = $('otherCode');
    
    let otherType = 'button'; 
    let btnType = 'submit'; 
    let btnText = '提交表单'; 
    let btnName = 'submitBtn';
    let btnForm = ''; 
    let btnDisabled = false;

    let isMultiple = false;
    let selectSize = 1;
    let taRows = 4;
    let taResize = 'vertical';

    function renderOtherDemo() {
        $('selectProps').style.display = otherType === 'select' ? 'block' : 'none';
        $('textareaProps').style.display = otherType === 'textarea' ? 'block' : 'none';
        $('buttonProps').style.display = otherType === 'button' ? 'block' : 'none';

        let demoHtml = '';
        let code = '';

        if (otherType === 'button') {
            // 高级模式调用 (showFormAreas = true)
            demoHtml = renderBtnFormScenario(btnType, btnText, btnName, btnForm, btnDisabled, true);
            
            if (btnForm) {
                drawSvgLine(otherDemoBox);
            }

            code = `<form id="myForm">...</form>\n\n`;
            if (btnForm) {
                code += `<!-- 按钮在表单外，但通过 form 绑定 -->\n<button type="${btnType}" name="${btnName}" form="${btnForm}"${btnDisabled?' disabled':''}>${btnText}</button>`;
            } else {
                code += `<!-- 按钮在表单内 -->\n<button type="${btnType}" name="${btnName}"${btnDisabled?' disabled':''}>${btnText}</button>`;
            }
        } 
        else if (otherType === 'select') {
            const multipleAttr = isMultiple ? 'multiple' : '';
            const sizeAttr = selectSize > 1 ? `size="${selectSize}"` : '';
            demoHtml = `<div class="form-group"><label>城市</label><select ${multipleAttr} ${sizeAttr}><option>北京</option><option>上海</option><option>广州</option></select></div>`;
            code = `<select ${multipleAttr} ${sizeAttr}>\n  <option>北京</option>\n</select>`;
        } 
        else if (otherType === 'textarea') {
            demoHtml = `<div class="form-group"><label>简介</label><textarea rows="${taRows}" style="resize: ${taResize};">请输入...</textarea></div>`;
            code = `<textarea rows="${taRows}" style="resize: ${taResize};"></textarea>`;
        }

        otherDemoBox.innerHTML = demoHtml;
        otherCode.innerHTML = renderCode(code);
    }

    document.querySelectorAll('[data-other-type]').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('[data-other-type]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            otherType = btn.dataset.otherType;
            renderOtherDemo();
        });
    });

    document.querySelectorAll('[data-btn-type]').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('[data-btn-type]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            btnType = btn.dataset.btnType;
            if (btnType === 'submit') btnText = '提交表单';
            if (btnType === 'reset') btnText = '重置表单';
            if (btnType === 'button') btnText = '普通按钮';
            $('inputBtnText').value = btnText;
            renderOtherDemo();
        });
    });

    $('inputBtnText')?.addEventListener('input', (e) => { btnText = e.target.value; renderOtherDemo(); });
    $('inputBtnName')?.addEventListener('input', (e) => { btnName = e.target.value; renderOtherDemo(); });
    
    $('selectBtnForm')?.addEventListener('change', (e) => { 
        btnForm = e.target.value; 
        renderOtherDemo(); 
    });

    $('toggleBtnDisabled')?.addEventListener('click', (e) => {
        e.currentTarget.classList.toggle('active');
        btnDisabled = e.currentTarget.classList.contains('active');
        renderOtherDemo();
    });

    $('toggleSelectMultiple')?.addEventListener('click', (e) => { e.currentTarget.classList.toggle('active'); isMultiple = e.currentTarget.classList.contains('active'); renderOtherDemo(); });
    $('sliderSelectSize')?.addEventListener('input', (e) => { selectSize = e.target.value; $('valSelectSize').textContent = selectSize; renderOtherDemo(); });
    $('sliderTaRows')?.addEventListener('input', (e) => { taRows = e.target.value; $('valTaRows').textContent = taRows; renderOtherDemo(); });
    $('selectTaResize')?.addEventListener('change', (e) => { taResize = e.target.value; renderOtherDemo(); });

    $('btnShowInputLimit')?.addEventListener('click', () => {
        if (otherType !== 'button') return;
        const externalArea = $('externalArea');
        if (!externalArea) return;
        $('svgLayer').innerHTML = ''; 
        externalArea.innerHTML = `<input type="button" class="form-btn" value="我是 input 按钮" style="background: var(--bg-tertiary); color: var(--text-secondary);" onclick="window.triggerBtnAction(event, 'button')">`;
        const consoleBox = $('btnConsoleMock');
        const consoleContent = $('btnConsoleContent');
        consoleBox.style.display = 'block';
        consoleContent.innerHTML = `<div style="color: var(--accent-cyan); font-weight: bold;">> 已将 input 按钮放入表单外区域。</div>
            <div style="color: var(--text-secondary); margin-top: 4px;">> 点击右侧的 "我是 input 按钮"，你会发现它完全没有任何反应，甚至会疯狂抖动报错。</div>`;
    });

    $('btnResetCompare')?.addEventListener('click', () => {
        renderOtherDemo(); 
    });

    renderOtherDemo();
}

/* ================================================================
   模块 4：CSS 美化高级沙盒 (终极完美版)
   ================================================================ */
function initBeautifySection() {
    const previewBox = $('stylePreviewArea');
    const codeOutput = $('beautifyCode');
    const step2Group = $('step-2-group');
    const step3Group = $('step-3-group');
    const step4Group = $('step-4-group');
    const dynamicStyleProps = $('dynamicStyleProps');

    let targetType = 'text';
    let labelMode = 'none'; 
    let isStripped = false;
    let isCheckedActive = false; 
    let stylePreset = 'default';
    let activePseudos = {}; 
    let currentCodeTab = 'html';
    let selectedIndex = 0; 
    
    let state = { 
        textColor: '#ffffff', fontSize: 14,
        borderColor: '#475569', borderW: 0, borderStyle: 'solid',
        bgColor: '#1e293b', radius: 8, padX: 16, padY: 8, blur: 10, glassAlpha: 0.15, 
        checkedBg: '#3b82f6', checkedText: '#ffffff', checkedShadow: 0, checkedH: 2,
        shadowColor: 'rgba(59,130,246,0.9)'
    };

    function resetState() {
        state = { 
            textColor: '#ffffff', fontSize: 14,
            borderColor: '#475569', borderW: 0, borderStyle: 'solid',
            bgColor: '#1e293b', radius: 8, padX: 16, padY: 8, blur: 10, glassAlpha: 0.15, 
            checkedBg: '#3b82f6', checkedText: '#ffffff', checkedShadow: 0, checkedH: 2,
            shadowColor: 'rgba(59,130,246,0.9)'
        };
        isCheckedActive = false;
        selectedIndex = 0;
    }

    // 让全局函数能修改 selectedIndex 并触发重绘
    window.sbUpdateState = (idx) => { 
        selectedIndex = idx; 
        renderPreview();
    };

    // 1. 属性面板
    function buildPropsPanel() {
        if (!isStripped) {
            dynamicStyleProps.style.display = 'none';
            return;
        }
        dynamicStyleProps.style.display = 'block';
        
        let html = `
            <div class="preset-select-wrapper" style="margin-bottom: 16px;">
                <select id="selectStylePreset">
                    <option value="default" ${stylePreset === 'default' ? 'selected' : ''}>自定义白板</option>
                    <option value="underline" ${stylePreset === 'underline' ? 'selected' : ''}>极简下划线风</option>
                    <option value="pill" ${stylePreset === 'pill' ? 'selected' : ''}>胶囊按钮风</option>
                    <option value="glass" ${stylePreset === 'glass' ? 'selected' : ''}>毛玻璃风格</option>
                </select>
            </div>
        `;

        if (stylePreset !== 'default') {
            let baseFields = '';
            let checkedFields = '';

            let commonBase = `
                <div class="control-group"><label>color(文字颜色)</label><input type="color" id="p-text" value="${state.textColor}"></div>
                <div class="control-group"><label>font-size(字号) <span>${state.fontSize}px</span></label><input type="range" id="p-font-size" min="12" max="24" value="${state.fontSize}"></div>
            `;

            if (stylePreset === 'underline') {
                baseFields = `
                    ${commonBase}
                    <div class="control-group"><label>border-width(基础线条) <span>${state.borderW}px</span></label><input type="range" id="p-border-w" min="0" max="10" value="${state.borderW}"></div>
                    <div class="control-group"><label>border-color(线条颜色)</label><input type="color" id="p-border" value="${state.borderColor}"></div>
                `;
                checkedFields = `
                    <div class="control-group"><label>color(选中文字)</label><input type="color" id="p-check-text" value="${state.checkedText}"></div>
                    <div class="control-group"><label>glow-color(发光主色)</label><input type="color" id="p-check-bg" value="${state.checkedBg}"></div>
                    <div class="control-group"><label>glow-height(发光线条) <span>${state.checkedH}px</span></label><input type="range" id="p-check-h" min="1" max="8" value="${state.checkedH}"></div>
                `;
            } 
            else if (stylePreset === 'pill') {
                baseFields = `
                    ${commonBase}
                    <div class="control-group"><label>background(背景色)</label><input type="color" id="p-bg" value="${state.bgColor}"></div>
                    <div class="control-group"><label>border-radius(圆角) <span>${state.radius}px</span></label><input type="range" id="p-radius" min="0" max="100" value="${state.radius}"></div>
                `;
                checkedFields = `
                    <div class="control-group"><label>color(选中文字)</label><input type="color" id="p-check-text" value="${state.checkedText}"></div>
                    <div class="control-group"><label>background(选中背景)</label><input type="color" id="p-check-bg" value="${state.checkedBg}"></div>
                    <div class="control-group"><label>box-shadow(选中光晕) <span>${state.checkedShadow}px</span></label><input type="range" id="p-check-shadow" min="0" max="40" value="${state.checkedShadow}"></div>
                `;
            } 
            else if (stylePreset === 'glass') {
                baseFields = `
                    ${commonBase}
                    <div class="control-group"><label>backdrop-filter(模糊度) <span>${state.blur}px</span></label><input type="range" id="p-blur" min="0" max="40" value="${state.blur}"></div>
                    <div class="control-group"><label>background(透明度) <span>${state.glassAlpha}</span></label><input type="range" id="p-glass-alpha" min="0" max="1" step="0.05" value="${state.glassAlpha}"></div>
                `;
                checkedFields = `
                    <div class="control-group"><label>color(选中文字)</label><input type="color" id="p-check-text" value="${state.checkedText}"></div>
                    <div class="control-group"><label>background(选中高亮)</label><input type="color" id="p-check-bg" value="${state.checkedBg}"></div>
                    <div class="control-group"><label>box-shadow(选中光晕) <span>${state.checkedShadow}px</span></label><input type="range" id="p-check-shadow" min="0" max="40" value="${state.checkedShadow}"></div>
                `;
            }
            
            if (targetType === 'radio' || targetType === 'checkbox') {
                html += `
                    <div class="toggle-row" style="border: none; padding: 0; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center;">
                        <span style="color: #c084fc; font-weight: bold; font-size: 12px;">激活选中态 (:checked)</span>
                        <button class="toggle-switch ${isCheckedActive ? 'active' : ''}" id="toggleCheckedState"></button>
                    </div>
                    <div class="props-split-layout">
                        <div class="props-col">
                            <div class="props-col-title base-color">基础样式</div>
                            ${baseFields}
                        </div>
                        <div class="props-col">
                            <div class="props-col-title checked-color">选中爆发</div>
                            <div style="display: flex; flex-direction: column; gap: 10px;">
                                ${checkedFields}
                            </div>
                        </div>
                    </div>
                `;
            } else {
                html += `<div class="props-col" style="width: 100%;">${baseFields}</div>`;
            }
        }
        
        dynamicStyleProps.innerHTML = html;

        document.getElementById('selectStylePreset')?.addEventListener('change', (e) => {
            stylePreset = e.target.value;
            activePseudos = {}; 
            resetState();
            buildPropsPanel(); buildPseudoPanel(); renderPreview();
        });

        dynamicStyleProps.querySelectorAll('input, select').forEach(input => {
            if (input.id === 'selectStylePreset') return; 
            const eventType = input.tagName === 'SELECT' ? 'change' : 'input';
            
            input.addEventListener(eventType, (e) => {
                const id = e.target.id;
                const val = e.target.value;
                
                if (id === 'p-text') state.textColor = val;
                if (id === 'p-bg') state.bgColor = val;
                if (id === 'p-border') state.borderColor = val;
                if (id === 'p-border-w') state.borderW = parseFloat(val);
                if (id === 'p-radius') state.radius = parseFloat(val);
                if (id === 'p-blur') state.blur = parseFloat(val);
                if (id === 'p-glass-alpha') state.glassAlpha = parseFloat(val);
                if (id === 'p-check-bg') state.checkedBg = val;
                if (id === 'p-check-text') state.checkedText = val;
                if (id === 'p-check-shadow') state.checkedShadow = parseFloat(val);
                if (id === 'p-check-h') state.checkedH = parseFloat(val);
                if (id === 'p-font-size') state.fontSize = parseFloat(val);

                const labelSpan = input.parentElement.querySelector('label span');
                if (labelSpan) {
                    if (id.includes('shadow') || id.includes('check-h') || id.includes('border-w') || id.includes('radius') || id.includes('pad') || id.includes('font-size')) labelSpan.textContent = val + 'px';
                    else if (id.includes('alpha')) labelSpan.textContent = val;
                }

                renderPreview(); 
            });
        });

        document.getElementById('toggleCheckedState')?.addEventListener('click', (e) => {
            isCheckedActive = !isCheckedActive;
            e.currentTarget.classList.toggle('active');
            renderPreview();
        });
    }

    // 2. 伪类面板
    function buildPseudoPanel() {
        let pseudos = [];
        if (targetType === 'radio' || targetType === 'checkbox') {
            pseudos = [{ id: 'hover', label: 'label:hover (悬停)' }, { id: 'active', label: 'label:active (点击)' }];
        } else if (targetType === 'button') {
            pseudos = [{ id: 'hover', label: ':hover (悬停)' }, { id: 'active', label: ':active (按压)' }, { id: 'focus', label: ':focus-visible (焦点)' }];
        } else {
            pseudos = [{ id: 'focus', label: ':focus (发光)' }, { id: 'hover', label: ':hover (悬停)' }, { id: 'active', label: ':active (点击)' }, { id: 'user-invalid', label: ':user-invalid (报错)' }];
        }

        let pseudoHtml = '';
        pseudos.forEach(p => {
            const isActive = activePseudos[p.id] ? 'active' : '';
            pseudoHtml += `
                <div class="toggle-row" style="padding: 6px 0; border-top: none;">
                    <span><code>${p.label}</code></span>
                    <button class="toggle-switch pseudo-switch ${isActive}" data-pseudo="${p.id}"></button>
                </div>
            `;
        });
        $('pseudoSelectorsContainer').innerHTML = pseudoHtml;

        $('pseudoSelectorsContainer').querySelectorAll('.pseudo-switch').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.dataset.pseudo;
                activePseudos[id] = !activePseudos[id];
                buildPseudoPanel(); renderPreview();
            });
        });
    }

    // 3. 渲染大屏与代码 (完美动态感知版)
    function renderPreview() {
        let dynamicCss = '';
        let htmlCodeStr = '';

        if (['text', 'select', 'button'].includes(targetType)) {
            let tag = targetType === 'text' ? 'input' : targetType;
            let attrs = targetType === 'text' ? 'type="text" placeholder="请输入..."' : '';
            let inner = targetType === 'button' ? '按钮' : (targetType === 'select' ? '<option>选项</option>' : '');
            
            let elHtml = `<${tag} class="sb-target" ${attrs}>${inner}</${tag}>`;
            if (targetType === 'select') elHtml = `<select class="sb-target"><option>选项</option></select>`;
            if (targetType === 'button') elHtml = `<button class="sb-target">按钮</button>`;

            if (isStripped) {
                let sel = targetType === 'text' ? 'input.sb-target' : `${targetType}.sb-target`;
                dynamicCss += `${sel} {\n  appearance: none;\n  outline: none;\n  transition: all 0.3s ease;\n  color: ${state.textColor};\n  -webkit-text-fill-color: ${state.textColor};\n  font-size: ${state.fontSize}px;\n`;

                if (stylePreset === 'underline') {
                    dynamicCss += `  background: transparent;\n  border: none;\n  border-bottom: ${state.borderW}px ${state.borderStyle} ${state.borderColor};\n  padding: 8px 0;\n`;
                } else if (stylePreset === 'pill') {
                    dynamicCss += `  background: ${state.bgColor};\n  border: none;\n  border-radius: ${state.radius}px;\n  padding: ${state.padY}px ${state.padX}px;\n`;
                } else if (stylePreset === 'glass') {
                    dynamicCss += `  background: rgba(255,255,255,${state.glassAlpha});\n  backdrop-filter: blur(${state.blur}px);\n  border: 1px solid rgba(255,255,255,0.2);\n  border-radius: ${state.radius}px;\n  padding: ${state.padY}px;\n`;
                }
                dynamicCss += `}\n\n`;

                if (activePseudos['focus']) {
                    if (targetType === 'button') dynamicCss += `${sel}:focus-visible { outline: 2px solid #06b6d4; }\n`;
                    else dynamicCss += `${sel}:focus { box-shadow: 0 0 0 4px rgba(6,182,212,0.6); }\n`;
                }
                if (activePseudos['hover']) dynamicCss += `${sel}:hover { filter: brightness(1.3); transform: translateY(-2px); }\n`;
                if (activePseudos['active']) dynamicCss += `${sel}:active { transform: scale(0.95); }\n`;
                if (activePseudos['user-invalid']) dynamicCss += `input${sel}:user-invalid { border-color: #ef4444; }\n`;
            }

            if (labelMode === 'for') {
                previewBox.innerHTML = `<label style="color:#94a3b8; margin-right:12px;">文本：</label>${elHtml}`;
                htmlCodeStr = `<label for="sb">文本：</label>\n${elHtml}`;
            } else if (labelMode === 'wrap') {
                previewBox.innerHTML = `<label style="color:#94a3b8; display:flex; align-items:center;">文本：${elHtml}</label>`;
                htmlCodeStr = `<label>\n  文本：\n  ${elHtml}\n</label>`;
            } else {
                previewBox.innerHTML = `<span style="color:#94a3b8; margin-right:12px;">文本：</span>${elHtml}`;
                htmlCodeStr = `<span>文本：</span>\n${elHtml}`;
            }
        } 
        else if (['radio', 'checkbox'].includes(targetType)) {
            let shouldHideNative = isStripped && labelMode !== 'none';
            let htmlInner = '';
            let groupHtml = `<div class="sb-group" style="display:flex; flex-direction:column; gap:12px;">`;

            for (let i = 1; i <= 2; i++) {
                let id = `sb-${targetType}-${i}`;
                let checked = (selectedIndex === i - 1) ? 'checked' : '';
                let onclickStr = `onclick="window.sbUpdateState(${i - 1})"`;

                if (shouldHideNative) {
                    groupHtml += `
                        <input type="${targetType}" id="${id}" name="sb-group" ${checked} class="sb-hidden-input" ${onclickStr}>
                        <label for="${id}" class="sb-label-target">选项 ${i}</label>
                    `;
                    htmlInner += `<input type="${targetType}" id="${id}" name="sb-group" ${checked} class="sb-hidden-input">\n<label for="${id}" class="sb-label-target">选项 ${i}</label>\n`;
                } else if (labelMode !== 'none') {
                    groupHtml += `
                        <div style="display:flex; align-items:center; gap:8px;">
                            <input type="${targetType}" id="${id}" name="sb-group" ${checked} ${onclickStr}>
                            <label for="${id}" style="color:#94a3b8;">选项 ${i}</label>
                        </div>
                    `;
                    htmlInner += `<input type="${targetType}" id="${id}" name="sb-group" ${checked}>\n<label for="${id}">选项 ${i}</label>\n`;
                } else {
                    groupHtml += `
                        <div style="display:flex; align-items:center; gap:8px;">
                            <input type="${targetType}" id="${id}" name="sb-group" ${checked} ${onclickStr}>
                            <span style="color:#94a3b8;">选项 ${i}</span>
                        </div>
                    `;
                    htmlInner += `<input type="${targetType}" id="${id}" name="sb-group" ${checked}>\n<span>选项 ${i}</span>\n`;
                }
            }
            groupHtml += `</div>`;
            previewBox.innerHTML = groupHtml;
            htmlCodeStr = htmlInner;

            if (shouldHideNative) {
                dynamicCss += `.sb-hidden-input { position: absolute; opacity: 0; width: 0; height: 0; }\n`;
                dynamicCss += `.sb-label-target { display: inline-block; cursor: pointer; transition: all 0.3s ease; color: ${state.textColor}; -webkit-text-fill-color: ${state.textColor}; font-size: ${state.fontSize}px; padding-bottom: 8px; }\n\n`;

                if (stylePreset === 'underline') {
                    dynamicCss += `.sb-label-target { background: transparent; border: none; border-bottom: ${state.borderW}px ${state.borderStyle} ${state.borderColor}; padding: 8px 12px; }\n`;
                } else if (stylePreset === 'pill') {
                    dynamicCss += `.sb-label-target { background: ${state.bgColor}; border-radius: ${state.radius}px; padding: ${state.padY}px ${state.padX}px; }\n`;
                } else if (stylePreset === 'glass') {
                    dynamicCss += `.sb-label-target { background: rgba(255,255,255,${state.glassAlpha}); backdrop-filter: blur(${state.blur}px); border-radius: ${state.radius}px; padding: ${state.padY}px; }\n`;
                }

                if (isCheckedActive) {
                    if (stylePreset === 'underline') {
                        let lineH = state.checkedH || 2;
                        let glowColor = state.checkedBg;
                        dynamicCss += `input:checked + .sb-label-target {\n`;
                        dynamicCss += `  color: ${state.checkedText};\n  -webkit-text-fill-color: ${state.checkedText};\n`;
                        dynamicCss += `  border-bottom-color: transparent;\n`;
                        dynamicCss += `  background-image: linear-gradient(90deg, transparent, ${glowColor}, transparent);\n`;
                        dynamicCss += `  background-size: 100% ${lineH}px;\n`;
                        dynamicCss += `  background-position: bottom;\n`;
                        dynamicCss += `  background-repeat: no-repeat;\n`;
                        dynamicCss += `}\n`;
                    } else {
                        let shadowStr = state.checkedShadow > 0 ? `box-shadow: 0 0 ${state.checkedShadow}px ${state.shadowColor}, 0 0 ${state.checkedShadow/2}px ${state.shadowColor};` : '';
                        dynamicCss += `input:checked + .sb-label-target { \n  background: ${state.checkedBg};\n  color: ${state.checkedText};\n  -webkit-text-fill-color: ${state.checkedText};\n  ${shadowStr}\n}\n`;
                    }
                }
                
                if (activePseudos['hover']) dynamicCss += `.sb-label-target:hover { filter: brightness(1.2); transform: translateY(-2px); }\n`;
                if (activePseudos['active']) dynamicCss += `.sb-label-target:active { transform: scale(0.95); }\n`;
            }
        }

        let styleTag = document.getElementById('dynamic-sandbox-style');
        if (!styleTag) { styleTag = document.createElement('style'); styleTag.id = 'dynamic-sandbox-style'; document.head.appendChild(styleTag); }
        styleTag.innerHTML = dynamicCss;

        let finalCode = currentCodeTab === 'html' ? htmlCodeStr : (dynamicCss || '/* 请切换右侧面板注入样式 */');
        let highlighted = finalCode
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/(&lt;\/?)([a-z0-9]+)/g, '$1<span class="tag">$2</span>')
            .replace(/([a-z-]+)=(&quot;.*?&quot;|'.*?')/g, '<span class="attr">$1</span>=<span class="val">$2</span>')
            .replace(/^([^\n{]+)\s*\{/gm, '<span class="sel">$1</span> {')
            .replace(/\/\*(.*?)\*\//g, '<span class="comment">/*$1*/</span>')
            .replace(/([a-z-]+):\s*([^;]+);/g, '<span class="prop">$1</span>: <span class="val">$2</span>;');
        codeOutput.innerHTML = `<pre>${highlighted}</pre>`;
    }

    // 4. 事件控制
    document.querySelectorAll('[data-code-tab]').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('[data-code-tab]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentCodeTab = btn.dataset.codeTab;
            renderPreview();
        });
    });

    document.querySelectorAll('[data-target]').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('[data-target]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            targetType = btn.dataset.target;
            labelMode = 'none'; isStripped = false; stylePreset = 'default'; activePseudos = {};
            resetState();
            
            document.querySelectorAll('[data-label-mode]').forEach(b => b.classList.remove('active'));
            document.querySelector('[data-label-mode="none"]').classList.add('active');
            $('toggleAppearance').classList.remove('active');
            
            step2Group.style.opacity = '0.3'; step2Group.style.pointerEvents = 'none';
            step3Group.style.opacity = '0.3'; step3Group.style.pointerEvents = 'none';
            step4Group.style.opacity = '0.3'; step4Group.style.pointerEvents = 'none';
            
            buildPropsPanel(); buildPseudoPanel(); renderPreview();
        });
    });

    document.querySelectorAll('[data-label-mode]').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('[data-label-mode]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            labelMode = btn.dataset.labelMode;
            if (labelMode !== 'none') {
                step2Group.style.opacity = '1'; step2Group.style.pointerEvents = 'auto';
            } else {
                step2Group.style.opacity = '0.3'; step2Group.style.pointerEvents = 'none';
                step3Group.style.opacity = '0.3'; step3Group.style.pointerEvents = 'none';
                step4Group.style.opacity = '0.3'; step4Group.style.pointerEvents = 'none';
                isStripped = false; $('toggleAppearance').classList.remove('active');
            }
            renderPreview();
        });
    });

    $('toggleAppearance')?.addEventListener('click', (e) => {
        e.currentTarget.classList.toggle('active');
        isStripped = e.currentTarget.classList.contains('active');
        
        if (isStripped) {
            step3Group.style.opacity = '1'; step3Group.style.pointerEvents = 'auto';
            step4Group.style.opacity = '1'; step4Group.style.pointerEvents = 'auto';
        } else {
            step3Group.style.opacity = '0.3'; step3Group.style.pointerEvents = 'none';
            step4Group.style.opacity = '0.3'; step4Group.style.pointerEvents = 'none';
            isCheckedActive = false;
        }
        buildPropsPanel(); renderPreview();
    });

    // 初始化
    buildPropsPanel();
    buildPseudoPanel();
    renderPreview();
}

/* ================================================================
   模块 5：现代高级案例库
   ================================================================ */
function initCaseSection() {
    const caseFormContainer = $('caseFormContainer');
    const caseCode = $('caseCode');
    
    function renderCaseDemo(styleName) {
        let html = '';
        let code = '';

        if (styleName === 'game') {
            html = `<div class="case-form-wrapper"><h2>GAME LOGIN</h2><input type="text" class="case-input" placeholder="Account ID"><input type="password" class="case-input" placeholder="Password"><button class="case-btn">ENTER THE ARENA</button></div>`;
            code = `/* 游戏风格 */\n.case-input { background: #1f2937; border: none; border-bottom: 2px solid #374151; padding: 14px; color: white; }\n.case-input:focus { border-bottom-color: #3b82f6; box-shadow: 0 10px 10px -10px #3b82f6; }`;
        } else if (styleName === 'saas') {
            html = `<div class="case-form-wrapper"><h2>Create an Account</h2><div class="saas-group"><input type="text" class="case-input" placeholder=" "><label>Full Name</label></div><div class="saas-group"><input type="email" class="case-input" placeholder=" "><label>Email Address</label></div><button class="case-btn">Get Started</button></div>`;
            code = `/* SaaS 风格 */\n.case-input { background: #f9fafb; border: 1px solid #d1d5db; padding: 16px 12px 6px; }\n.case-input:focus + label,\n.case-input:not(:placeholder-shown) + label { top: 4px; font-size: 11px; color: #3b82f6; }`;
        } else if (styleName === 'glass') {
            html = `<div class="case-form-wrapper"><h2>Welcome Back</h2><input type="text" class="case-input" placeholder="Username"><input type="password" class="case-input" placeholder="Password"><button class="case-btn">Sign In</button></div>`;
            code = `/* 毛玻璃风格 */\n.case-form-wrapper { background: rgba(255,255,255,0.1); backdrop-filter: blur(15px); border: 1px solid rgba(255,255,255,0.2); border-radius: 20px; }`;
        }

        caseFormContainer.innerHTML = html;
        caseCode.innerHTML = renderCode(code);
        caseFormContainer.className = 'case-form-container style-' + styleName;
    }

    document.querySelectorAll('[data-case-style]').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('[data-case-style]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderCaseDemo(btn.dataset.caseStyle);
        });
    });

    renderCaseDemo('game');
}

/* ================================================================
   总入口
   ================================================================ */
export function initFormModule() {
    // 侧边栏切换
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

    // 按需初始化各个板块
    initBasicSection();
    initInputSection();
    initOtherSection();
    initBeautifySection();
    initCaseSection();
}