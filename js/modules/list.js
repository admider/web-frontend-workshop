import { $ } from '../core/utils.js';
import { initSlider } from '../components/slider.js';
import { initChallengeUI } from '../components/challenge-ui.js';

/* ================================================================
   工具：转义 HTML 并高亮
   ================================================================ */
function renderCode(code) {
    let html = code
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    html = html.replace(/(&lt;\/?)([a-z0-9]+)/g, '$1<span class="sel">$2</span>');
    html = html.replace(/([a-z-]+)=(&quot;.*?&quot;)/g, '<span class="prop">$1</span>=<span class="val">$2</span>');
    return `<pre>${html}</pre>`;
}

function initSectionSwitcher() {
    const navItems = document.querySelectorAll('.sidebar-nav-item[data-section]');
    const panels = document.querySelectorAll('.section-panel');
    navItems.forEach(btn => {
        btn.addEventListener('click', () => {
            navItems.forEach(b => b.classList.remove('active'));
            panels.forEach(p => p.classList.remove('active'));
            btn.classList.add('active');
            const target = document.getElementById('section-' + btn.dataset.section);
            if (target) target.classList.add('active');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    });
}

export function initListModule() {
    initSectionSwitcher();

    /* ============================================================
       模块 1：无序列表
       ============================================================ */
    const ulState = { type: 'disc' };
    
    function updateUl() {
        const ul = $('ulPreview');
        const codeBox = $('ulLiveCode');
        if (!ul) return;

        if (ulState.type === 'none') ul.style.listStyleType = 'none';
        else {
            ul.style.listStyleType = '';
            ul.setAttribute('type', ulState.type);
        }
        
        $('valUlType') && ($('valUlType').textContent = ulState.type);
        
        const code = `<ul type="${ulState.type}">\n  <li>HTML 基础</li>\n  <li>CSS 样式</li>\n  <li>JavaScript 交互</li>\n</ul>`;
        if (codeBox) codeBox.innerHTML = renderCode(code);
    }

    document.querySelectorAll('[data-ul-type]').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('[data-ul-type]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            ulState.type = btn.dataset.ulType;
            updateUl();
        });
    });
    updateUl();

    document.querySelectorAll('[data-rule-test]').forEach(btn => {
        btn.addEventListener('click', () => {
            const stage = $('ruleDemoStage');
            if (!stage) return;
            if (btn.dataset.ruleTest === 'error') {
                stage.innerHTML = `
                    <div class="rule-code rule-error">
                        &lt;ul&gt;<br>
                        &nbsp;&nbsp;我是直接写在 ul 里的文字（错误）<br>
                        &nbsp;&nbsp;&lt;div&gt;直接放 div（错误）&lt;/div&gt;<br>
                        &lt;/ul&gt;
                    </div>
                    <p style="color:#f87171; font-size:11px; margin-top:6px;">❌ 违反了 HTML 语义规范。</p>
                `;
            } else {
                stage.innerHTML = `
                    <div class="rule-code rule-correct">
                        &lt;ul&gt;<br>
                        &nbsp;&nbsp;&lt;li&gt;文字放在 li 里（正确）&lt;/li&gt;<br>
                        &nbsp;&nbsp;&lt;li&gt;&lt;div&gt;容器放在 li 里（正确）&lt;/div&gt;&lt;/li&gt;<br>
                        &lt;/ul&gt;
                    </div>
                    <p style="color:#34d399; font-size:11px; margin-top:6px;">✅ 符合 HTML 规范。</p>
                `;
            }
        });
    });

    function runEmmet(inputId, stageId, tag) {
        const input = $(inputId);
        const stage = $(stageId);
        if (!input || !stage) return;
        
        const val = input.value.trim();
        const regex = new RegExp(`^${tag}>li\\*(\\d+)$`);
        const match = val.match(regex);

        if (!match) {
            stage.innerHTML = `<span style="color:#ef4444; font-size:12px;">语法错误！请按照 ${tag}>li*数字 格式输入。</span>`;
            return;
        }

        const count = parseInt(match[1], 10);
        if (count < 1 || count > 10) {
            stage.innerHTML = `<span style="color:#ef4444; font-size:12px;">数量请在 1-10 之间。</span>`;
            return;
        }

        stage.innerHTML = `<div id="emmetTyping${tag}" class="emmet-typing"></div><div id="emmetResult${tag}" class="emmet-result"></div>`;
        const typingEl = $(`emmetTyping${tag}`);
        const resultEl = $(`emmetResult${tag}`);

        let i = 0;
        function typeChar() {
            if (i < val.length) {
                typingEl.textContent += val.charAt(i);
                i++;
                setTimeout(typeChar, 100);
            } else {
                typingEl.innerHTML += ` <span class="emmet-enter-badge">Enter ↵</span>`;
                setTimeout(() => {
                    let code = `<${tag}>\n`;
                    for (let j = 1; j <= count; j++) {
                        code += `  <li>列表项 ${j}</li>\n`;
                    }
                    code += `</${tag}>`;
                    typingEl.style.display = 'none';
                    resultEl.innerHTML = renderCode(code);
                    resultEl.classList.add('show');
                }, 800);
            }
        }
        typeChar();
    }

    $('emmetRunBtnUl')?.addEventListener('click', () => runEmmet('emmetInputUl', 'emmetAnimStageUl', 'ul'));
    $('emmetInputUl')?.addEventListener('keydown', (e) => { if (e.key === 'Enter') runEmmet('emmetInputUl', 'emmetAnimStageUl', 'ul'); });

    /* ============================================================
       模块 2：有序列表
       ============================================================ */
    const olState = { type: '1', start: 1, useValue: false };

    function updateOl() {
        const ol = $('olPreview');
        const codeBox = $('olLiveCode');
        if (!ol) return;

        ol.setAttribute('type', olState.type);
        ol.setAttribute('start', olState.start);
        $('valOlType') && ($('valOlType').textContent = olState.type);

        const items = ol.querySelectorAll('li');
        if (items.length > 1) {
            if (olState.useValue) items[1].setAttribute('value', '10');
            else items[1].removeAttribute('value');
        }

        let code = `<ol type="${olState.type}" start="${olState.start}">\n`;
        code += `  <li>第一步：新建文件</li>\n`;
        code += olState.useValue ? `  <li value="10">第二步：编写代码</li>\n` : `  <li>第二步：编写代码</li>\n`;
        code += `  <li>第三步：运行测试</li>\n</ol>`;
        
        if (codeBox) codeBox.innerHTML = renderCode(code);
    }

    document.querySelectorAll('[data-ol-type]').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('[data-ol-type]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            olState.type = btn.dataset.olType;
            updateOl();
        });
    });

    initSlider({
        id: 'sliderOlStart', displayId: 'valOlStart',
        min: 1, max: 20, value: 1,
        onChange: v => { olState.start = v; updateOl(); }
    });

    $('toggleOlValue')?.addEventListener('click', (e) => {
        e.currentTarget.classList.toggle('active');
        olState.useValue = e.currentTarget.classList.contains('active');
        updateOl();
    });
    updateOl();

    $('emmetRunBtnOl')?.addEventListener('click', () => runEmmet('emmetInputOl', 'emmetAnimStageOl', 'ol'));
    $('emmetInputOl')?.addEventListener('keydown', (e) => { if (e.key === 'Enter') runEmmet('emmetInputOl', 'emmetAnimStageOl', 'ol'); });


    /* ============================================================
       模块 3：定义列表
       ============================================================ */
    const dlState = { mode: 'text' };

    function updateDl() {
        const dl = $('dlDemo');
        const codeBox = $('dlLiveCode');
        if (!dl) return;

        if (dlState.mode === 'text') {
            dl.innerHTML = `
                <dt><img src="https://picsum.photos/100/100?random=1" alt="头像"></dt>
                <dd>
                    <strong>张三</strong><br>
                    高级前端开发工程师，精通 HTML、CSS 与 JavaScript，拥有 5 年开发经验。
                </dd>
            `;
            dl.style.display = 'flex';
            dl.style.gap = '20px';
            dl.style.alignItems = 'flex-start';

            const code = `/* 使用 Flexbox 实现图文同行 */\n.dl-demo {\n  display: flex;\n  gap: 20px;\n}\n\n<dl class="dl-demo">\n  <dt><img src="头像地址"></dt>\n  <dd>\n    <strong>张三</strong><br>\n    高级前端开发工程师...\n  </dd>\n</dl>`;
            if (codeBox) codeBox.innerHTML = renderCode(code);
        } else {
            dl.innerHTML = `
                <dt style="width: 100%; display: flex; justify-content: center; margin-bottom: 16px;">
                    <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=HelloCSS" alt="二维码" style="width:140px; height:140px; border-radius:4px;">
                </dt>
                <dd style="text-align: center;">
                    <strong>扫码了解 CSS 原理工坊</strong><br>
                    使用手机扫描二维码。
                </dd>
            `;
            dl.style.display = 'block';
            dl.style.alignItems = '';

            const code = `/* 默认块级元素上下排列 */\n.dl-demo {\n  /* 无需 Flexbox，正常显示即可 */\n}\n\n<dl class="dl-demo">\n  <dt><img src="二维码地址"></dt>\n  <dd>扫码了解 CSS 原理工坊...</dd>\n</dl>`;
            if (codeBox) codeBox.innerHTML = renderCode(code);
        }
    }

    document.querySelectorAll('[data-dl-mode]').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('[data-dl-mode]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            dlState.mode = btn.dataset.dlMode;
            updateDl();
        });
    });
    updateDl();


    /* ============================================================
       模块 4：列表嵌套
       ============================================================ */
    let nestItems = [];
    const builderZone = $('nestBuilderZone');
    const builderList = $('nestBuilderList');
    const builderHint = $('nestBuilderHint');
    const btnRenderNest = $('btnRenderNest');
    const renderArea = $('nestRenderArea');
    const nestCodeBox = $('nestLiveCode');
    const pieces = document.querySelectorAll('.puzzle-draggable');

    function updateBuilderUI() {
        builderList.innerHTML = '';
        nestItems.forEach((type, index) => {
            const div = document.createElement('div');
            div.className = 'nest-built-item';
            let label = '';
            if (type === 'ul-root') label = '📌 无序列表 (外层)';
            else if (type === 'ol-root') label = '🔢 有序列表 (外层)';
            else if (type === 'ul-child') label = '↳ 无序列表 (子层)';
            else if (type === 'ol-child') label = '↳ 有序列表 (子层)';
            div.innerHTML = `<span>${label}</span><button class="btn-remove" data-index="${index}">✕</button>`;
            builderList.appendChild(div);
        });

        const hasRoot = nestItems.some(i => i.endsWith('-root'));
        const childCount = nestItems.filter(i => i.endsWith('-child')).length;
        
        builderHint.style.display = hasRoot ? 'none' : 'block';
        btnRenderNest.disabled = !hasRoot;

        $('pieceUlRoot').classList.toggle('disabled', hasRoot);
        $('pieceOlRoot').classList.toggle('disabled', hasRoot);
        const childDisabled = !hasRoot || childCount >= 2;
        $('pieceUlChild').classList.toggle('disabled', childDisabled);
        $('pieceOlChild').classList.toggle('disabled', childDisabled);

        builderList.querySelectorAll('.btn-remove').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = parseInt(e.currentTarget.dataset.index, 10);
                nestItems.splice(idx, 1);
                updateBuilderUI();
            });
        });
    }

    pieces.forEach(piece => {
        piece.addEventListener('dragstart', (e) => {
            if (piece.classList.contains('disabled')) {
                e.preventDefault();
                return;
            }
            e.dataTransfer.setData('text/plain', piece.dataset.piece);
            e.dataTransfer.effectAllowed = 'copy';
        });
    });

    builderZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        builderZone.classList.add('drag-over');
    });
    builderZone.addEventListener('dragleave', () => builderZone.classList.remove('drag-over'));
    builderZone.addEventListener('drop', (e) => {
        e.preventDefault();
        builderZone.classList.remove('drag-over');
        const pieceType = e.dataTransfer.getData('text/plain');
        if (!pieceType) return;
        
        const isRoot = pieceType.endsWith('-root');
        const hasRoot = nestItems.some(i => i.endsWith('-root'));
        const childCount = nestItems.filter(i => i.endsWith('-child')).length;

        if (isRoot && hasRoot) return;
        if (!isRoot && !hasRoot) return;
        if (!isRoot && childCount >= 2) return;

        nestItems.push(pieceType);
        updateBuilderUI();
    });

    btnRenderNest.addEventListener('click', () => {
        const rootType = nestItems.find(i => i.endsWith('-root'));
        if (!rootType) return;

        const rootTag = rootType.split('-')[0];
        const childTags = nestItems.filter(i => i.endsWith('-child')).map(i => i.split('-')[0]);

        let code = `<${rootTag}>\n  <li>父级列表项\n`;
        childTags.forEach(tag => {
            code += `    <${tag}>\n`;
            code += `      <li>子级项 1</li>\n`;
            code += `      <li>子级项 2</li>\n`;
            code += `    </${tag}>\n`;
        });
        code += `  </li>\n</${rootTag}>`;
        nestCodeBox.innerHTML = renderCode(code);

        let html = `<${rootTag} class="nest-render-${rootTag}">\n  <li>父级列表项`;
        childTags.forEach(tag => {
            html += `<${tag}>\n  <li>子级项 1</li>\n  <li>子级项 2</li>\n</${tag}>`;
        });
        html += `</li>\n</${rootTag}>`;
        
        renderArea.style.textAlign = 'left';
        renderArea.style.color = 'var(--text-primary)';
        renderArea.innerHTML = html;
    });

    $('resetNestBtn')?.addEventListener('click', () => {
        nestItems = [];
        updateBuilderUI();
        renderArea.innerHTML = '尚未生成嵌套列表，请从右侧拖拽拼装并点击确定。';
        renderArea.style.textAlign = 'center';
        renderArea.style.color = 'var(--text-muted)';
        nestCodeBox.innerHTML = `<pre><span style="color:var(--text-muted);">// 等待生成...</span></pre>`;
    });

    updateBuilderUI();


    /* ============================================================
       模块 5：CSS 列表样式（JS 结构强控版）
       ============================================================ */
    const styleState = {
        type: 'disc',
        position: 'outside',
        useListImage: false,
        clearedSymbol: false, 
        paddingLeft: 0,
        useBgImage: false
    };

    const demoUl = $('listStyleDemo');
    const codeBox = $('styleLiveCode');
    const btnClear = $('btnClearSymbol');
    const btnApplyBg = $('btnApplyBg');

    function updateStyle() {
        if (!demoUl) return;

        // 获取所有 li
        const items = demoUl.querySelectorAll('.list-item-box');

        // 每次渲染前重置基础状态
        items.forEach(li => {
            // 重置 padding
            li.style.paddingLeft = '0px';
            // 重置内部结构（保留文字）
            const text = li.querySelector('.item-text').innerHTML;
            li.innerHTML = `<span class="item-text">${text}</span>`;
        });

        // ==========================================
        // 渲染逻辑
        // ==========================================
        
        // 1. 如果开启了背景图模式
        if (styleState.useBgImage) {
            styleState.clearedSymbol = true; // 背景图模式下，A 默认算作已完成
            items.forEach(li => {
                li.style.paddingLeft = styleState.paddingLeft + 'px';
                const text = li.querySelector('.item-text').innerHTML;
                // 注入背景图图标
                li.innerHTML = `<span class="mock-bg-image" style="position: ${styleState.position === 'inside' ? 'relative' : 'absolute'}; left: ${styleState.position === 'inside' ? '0' : '-30px'};"></span><span class="item-text">${text}</span>`;
            });
        } 
        // 2. 如果开启了 list-style-image 模式
        else if (styleState.useListImage) {
            styleState.clearedSymbol = false;
            items.forEach(li => {
                const text = li.querySelector('.item-text').innerHTML;
                // 注入大图图标（造成排版崩坏）
                li.innerHTML = `<span class="mock-list-image" style="position: ${styleState.position === 'inside' ? 'relative' : 'absolute'}; left: ${styleState.position === 'inside' ? '0' : '-50px'};"></span><span class="item-text">${text}</span>`;
                // 大图容易遮挡，给文字加点 padding
                li.style.paddingLeft = styleState.position === 'inside' ? '50px' : '0px';
            });
        } 
        // 3. 普通模式
        else {
            // 如果没点 A，显示默认符号
            if (!styleState.clearedSymbol) {
                let symbol = '●';
                if (styleState.type === 'circle') symbol = '○';
                if (styleState.type === 'square') symbol = '■';
                if (styleState.type === 'decimal') symbol = '1.';
                if (styleState.type === 'lower-alpha') symbol = 'a.';

                items.forEach(li => {
                    const text = li.querySelector('.item-text').innerHTML;
                    li.innerHTML = `<span class="mock-bullet" style="position: ${styleState.position === 'inside' ? 'relative' : 'absolute'}; left: ${styleState.position === 'inside' ? '0' : '-20px'}; right: ${styleState.position === 'inside' ? 'auto' : 'auto'};">${symbol}</span><span class="item-text">${text}</span>`;
                });
            } else {
                // 如果点了 A，就不显示符号，但应用缩进
                items.forEach(li => {
                    li.style.paddingLeft = styleState.paddingLeft + 'px';
                });
            }
        }

        // ==========================================
        // 同步右侧 UI 面板状态
        // ==========================================
        if (styleState.useBgImage) {
            btnClear.className = 'btn btn-secondary success';
            btnClear.innerHTML = '✅ 已执行 list-style: none';
        } else if (styleState.clearedSymbol) {
            btnClear.className = 'btn btn-secondary success';
            btnClear.innerHTML = '✅ 已执行 list-style: none';
        } else {
            btnClear.className = 'btn btn-secondary';
            btnClear.innerHTML = '点击执行 list-style: none';
        }

        // ==========================================
        // 生成代码
        // ==========================================
        let css = 'ul {\n';
        if (styleState.useListImage) {
            css += `  list-style-image: url("../../img/panda.png");\n`;
            css += `  list-style-position: ${styleState.position};\n`;
        } 
        else if (styleState.useBgImage) {
            css += `  list-style-type: none;\n`;
        } 
        else {
            css += `  list-style-type: ${styleState.clearedSymbol ? 'none' : styleState.type};\n`;
            css += `  list-style-position: ${styleState.position};\n`;
        }
        css += `}\n`;

        if (styleState.useBgImage) {
            css += `\nli {\n  padding-left: ${styleState.paddingLeft}px;\n`;
            css += `  background: url("../../img/panda.png") no-repeat;\n`;
            css += `  background-size: 20px 20px;\n`;
            css += `}`;
        }

        if (codeBox) codeBox.innerHTML = renderCode(css);
        $('valPaddingLeft') && ($('valPaddingLeft').textContent = styleState.paddingLeft + 'px');
    }

    // 下拉菜单切换 type
    $('selectListType')?.addEventListener('change', (e) => {
        styleState.type = e.target.value;
        styleState.clearedSymbol = false;
        styleState.useBgImage = false;
        styleState.useListImage = false;
        $('toggleListImage').classList.remove('active');
        btnApplyBg.classList.remove('active');
        updateStyle();
    });

    // 切换 position
    document.querySelectorAll('[data-list-pos]').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('[data-list-pos]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            styleState.position = btn.dataset.listPos;
            updateStyle();
        });
    });

    // 切换 list-style-image
    $('toggleListImage')?.addEventListener('click', (e) => {
        e.currentTarget.classList.toggle('active');
        styleState.useListImage = e.currentTarget.classList.contains('active');
        if (styleState.useListImage) {
            styleState.useBgImage = false;
            btnApplyBg.classList.remove('active');
        }
        updateStyle();
    });

    // 步骤 A：清除符号
    btnClear?.addEventListener('click', () => {
        styleState.clearedSymbol = true;
        styleState.useListImage = false;
        styleState.useBgImage = false;
        $('toggleListImage').classList.remove('active');
        btnApplyBg.classList.remove('active');
        updateStyle();
    });

    // 步骤 B：调整 padding
    initSlider({
        id: 'sliderPaddingLeft', displayId: 'valPaddingLeft',
        min: 0, max: 40, value: 0, step: 4,
        onChange: v => { 
            styleState.paddingLeft = v; 
            updateStyle(); 
        }
    });

    // 步骤 C：应用背景
    btnApplyBg?.addEventListener('click', () => {
        if (!styleState.clearedSymbol) {
            alert("❌ 设置失败！请先完成 A（清除符号）。");
            return;
        }
        if (styleState.paddingLeft === 0) {
            alert("❌ 设置失败！请在 B 步骤中拖动滑块，设置内边距大于 0。");
            return;
        }
        styleState.useBgImage = true;
        styleState.useListImage = false;
        $('toggleListImage').classList.remove('active');
        updateStyle();
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
	
	initChallengeUI('列表');
    // 初始化
    updateStyle();
}