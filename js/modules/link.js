import { $ } from '../core/utils.js';
import { initChallengeUI } from '../components/challenge-ui.js';

function renderCode(code) {
    let html = code
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    html = html.replace(/(&lt;\/?)([a-z0-9]+)/g, '$1<span class="sel">$2</span>');
    html = html.replace(/([a-z-]+)=(&quot;.*?&quot;)/g, '<span class="prop">$1</span>=<span class="val">$2</span>');
    return `<pre>${html}</pre>`;
}

// ⭐️ 核心：纯 JS 实现的平滑滚动动画，百分百兼容模拟容器
function smoothScrollTo(element, targetScrollTop, duration = 600) {
    const startScrollTop = element.scrollTop;
    const distance = targetScrollTop - startScrollTop;
    let startTime = null;

    function animation(currentTime) {
        if (startTime === null) startTime = currentTime;
        const timeElapsed = currentTime - startTime;
        // easeInOutCubic 缓动算法
        let progress = timeElapsed / duration;
        progress = progress < 0.5 ? 4 * progress * progress * progress : 1 - Math.pow(-2 * progress + 2, 3) / 2;
        
        element.scrollTop = startScrollTop + distance * progress;

        if (timeElapsed < duration) {
            requestAnimationFrame(animation);
        } else {
            element.scrollTop = targetScrollTop;
        }
    }
    requestAnimationFrame(animation);
}

function initSectionSwitcher() {
    // ... 保留之前的侧边栏切换逻辑
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

export function initLinkModule() {
    initSectionSwitcher();

    /* ============================================================
       模块 1：基础、真实跳转与锚点
       ============================================================ */
    const basicCodeBox = $('basicLiveCode');
    const selectHref = $('selectHref');
    const rawLink = $('rawLink');
    const statusText = $('statusText');
    const clearCookieBtn = $('clearCookieBtn');
    const mockUrl = $('mockUrl');
    const browserContent = $('browserContent');
    const overlayTip = $('browserOverlayTip');
    const anchorLocalLink = $('anchorLocalLink');
    const codeScrollValue = $('codeScrollValue');

    let currentHref = '#';
    let currentTarget = '_self'; // target 属性状态
    let scrollBehavior = 'auto';
    let isVisited = false; 

    function updateBasic() {
        rawLink.setAttribute('href', currentHref);
        rawLink.setAttribute('target', currentTarget);

        if (isVisited) {
            rawLink.classList.add('is-visited');
            statusText.textContent = '已访问 (:visited) - 紫色';
            statusText.style.color = '#551A8B';
        } else {
            rawLink.classList.remove('is-visited');
            statusText.textContent = '未访问 (:link) - 蓝色';
            statusText.style.color = '#0000EE';
        }

        $('valTarget') && ($('valTarget').textContent = currentTarget);
        $('valScrollBehavior') && ($('valScrollBehavior').textContent = scrollBehavior === 'smooth' ? '平滑滚动' : '直接跳转');
        if(codeScrollValue) codeScrollValue.textContent = scrollBehavior;

        const code = `<!-- 1. 链接基础 -->\n<a href="${currentHref}" target="${currentTarget}">我是测试链接</a>\n\n<!-- 2. 平滑滚动应用在 html 标签 -->\nhtml {\n  scroll-behavior: ${scrollBehavior};\n}\n\n<!-- 3. 锚点跳转 -->\n<a href="#anchorLocal">本页跳转</a>\n<a href="target-test.html#other-page-anchor">跨页跳转</a>`;
        if (basicCodeBox) basicCodeBox.innerHTML = renderCode(code);
    }

    // 切换 href
    selectHref?.addEventListener('change', (e) => {
        currentHref = e.target.value;
        isVisited = false; 
        updateBasic();
    });

    // 切换 target
    document.querySelectorAll('[data-target]').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('[data-target]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentTarget = btn.dataset.target;
            updateBasic();
        });
    });

    // 点击测试链接
    rawLink?.addEventListener('click', (e) => {
        isVisited = true;
        rawLink.classList.add('is-visited');

        if (currentHref === 'javascript:void(0)') {
            e.preventDefault();
            overlayTip.textContent = 'javascript:void(0) 阻止了页面跳转';
            overlayTip.classList.add('show');
            setTimeout(() => overlayTip.classList.remove('show'), 1500);
        } else if (currentHref === '#') {
            e.preventDefault();
            // 模拟回到顶部，这里也加入平滑滚动
            if (scrollBehavior === 'smooth') {
                smoothScrollTo(browserContent, 0, 600);
            } else {
                browserContent.scrollTop = 0;
            }
            overlayTip.textContent = '已执行 href="#": 回到页面顶部';
            overlayTip.classList.add('show');
            setTimeout(() => overlayTip.classList.remove('show'), 1500);
        }
        // 其他真实地址，不拦截，让它自由跳转
    });

    // 鼠标按下变红
    rawLink?.addEventListener('mousedown', () => {
        rawLink.style.color = '#FF0000';
        statusText.textContent = '鼠标按下 (:active) - 红色';
        statusText.style.color = '#FF0000';
    });
    rawLink?.addEventListener('mouseup', () => {
        rawLink.style.color = ''; 
        if (isVisited) {
            statusText.textContent = '已访问 (:visited) - 紫色';
            statusText.style.color = '#551A8B';
        }
    });

    // 清理 Cookie
    clearCookieBtn?.addEventListener('click', () => {
        isVisited = false;
        updateBasic();
        overlayTip.textContent = '🧹 已清理浏览器缓存，链接重置为蓝色 (:link)';
        overlayTip.classList.add('show');
        setTimeout(() => overlayTip.classList.remove('show'), 1500);
    });

    // 切换滚动方式
    document.querySelectorAll('[data-scroll]').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('[data-scroll]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            scrollBehavior = btn.dataset.scroll;
            updateBasic(); 
        });
    });

    // 本页面锚点跳转
    anchorLocalLink?.addEventListener('click', (e) => {
        e.preventDefault();
        mockUrl.textContent = 'https://example.com/link.html#anchorLocal';
        overlayTip.textContent = '⏬ 浏览器检测到 #anchorLocal，正在寻找元素...';
        overlayTip.classList.add('show');

        setTimeout(() => {
            const target = $('anchorLocal');
            if (target && browserContent) {
                // 计算目标相对于滚动容器的位置
                const targetTop = target.offsetTop - browserContent.offsetTop - 20;
                
                // ⭐ 核心：根据用户选择的滚动方式，调用不同的执行逻辑
                if (scrollBehavior === 'smooth') {
                    smoothScrollTo(browserContent, targetTop, 800);
                } else {
                    browserContent.scrollTop = targetTop;
                }

                target.classList.add('highlight');
                setTimeout(() => target.classList.remove('highlight'), 2000);
            }
            
            overlayTip.textContent = `🎯 找到目标，正在${scrollBehavior === 'smooth' ? '平滑' : '瞬间'}滚动...`;
            setTimeout(() => {
                overlayTip.classList.remove('show');
                mockUrl.textContent = 'https://example.com/link.html';
            }, 1500);
        }, 1000);
    });

    updateBasic();


    /* ============================================================
       模块 2：进阶伪类与场景画廊
       ============================================================ */
    const advancedLink = $('advancedLink');
    const activeStateHint = $('activeStateHint');
    const pseudoCodeBox = $('pseudoLiveCode');
    const orderHint = $('orderHint');
    
    const extBtn = $('extBtn');
    const extLi = $('extLi');
    const extStatusHint = $('extStatusHint');

    // 状态记录
    let styleState = {
        'no-underline': false,
        'base-style': false,
        'hover-color': false,
        'hover-lift': false,
        'bg-padding': false,
        'active-scale': false
    };
    let currentOrder = 'correct';
    let isSimulatedVisited = false; 

    function updateAdvancedLink() {
        if(!advancedLink) return;

        // 1. 更新积木代码片段显示
        Object.keys(styleState).forEach(key => {
            const snip = $(`snip-${key}`);
            if (snip) snip.style.display = styleState[key] ? 'block' : 'none';
        });

        // 2. 拼接并更新类名
        advancedLink.classList.toggle('step-no-underline', styleState['no-underline']);
        advancedLink.classList.toggle('step-base-style', styleState['base-style']);
        advancedLink.classList.toggle('step-hover-color', styleState['hover-color']);
        advancedLink.classList.toggle('step-hover-lift', styleState['hover-lift']);
        advancedLink.classList.toggle('step-bg-padding', styleState['bg-padding']);
        advancedLink.classList.toggle('step-active-scale', styleState['active-scale']);

        if (isSimulatedVisited && currentOrder === 'correct') {
            advancedLink.classList.add('is-visited');
        } else {
            advancedLink.classList.remove('is-visited');
        }

        // 3. 更新代码面板 (展示纯理论代码)
        let baseCss = '';
        if (styleState['no-underline']) baseCss += `  text-decoration: none;\n`;
        if (styleState['base-style']) baseCss += `  color: #f8fafc;\n  font-family: monospace;\n  font-style: italic;\n`;
        if (styleState['bg-padding']) baseCss += `  padding: 10px 24px;\n  background: rgba(59, 130, 246, 0.15);\n  border-radius: 8px;\n`;

        let hoverCss = '';
        if (styleState['hover-color']) hoverCss += `  color: #06b6d4;\n`;
        if (styleState['hover-lift']) hoverCss += `  transform: translateY(-3px);\n`;

        let activeCss = '';
        if (styleState['active-scale']) activeCss += `  transform: scale(0.95);\n`;

        let displayCss = `/* 当前理论代码 */\n`;
        if (currentOrder === 'correct') {
            displayCss += `/* ✅ 正确顺序 L-V-H-A */\n`;
            displayCss += `a:link {\n  color: #0000EE;\n${baseCss}}\n`;
            displayCss += `a:visited { color: #551A8B; }\n`;
            if (hoverCss) displayCss += `a:hover {\n${hoverCss}}\n`;
            if (activeCss) displayCss += `a:active {\n${activeCss}}\n`;
        } else {
            displayCss += `/* ❌ 错误顺序 L-H-V-A */\n`;
            displayCss += `a:link {\n  color: #0000EE;\n${baseCss}}\n`;
            if (hoverCss) displayCss += `a:hover {\n${hoverCss}}\n`;
            displayCss += `a:visited { color: #551A8B; } /* 覆盖了 hover！ */\n`;
            if (activeCss) displayCss += `a:active {\n${activeCss}}\n`;
        }

        if (pseudoCodeBox) pseudoCodeBox.innerHTML = renderCode(displayCss);
    }

    // 绑定积木开关
    document.querySelectorAll('[data-style]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.currentTarget.classList.toggle('active');
            const key = e.currentTarget.dataset.style;
            styleState[key] = e.currentTarget.classList.contains('active');
            updateAdvancedLink();
        });
    });

    // 绑定顺序切换
    document.querySelectorAll('[data-order]').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('[data-order]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentOrder = btn.dataset.order;
            
            if (currentOrder === 'wrong') {
                orderHint.innerHTML = '❌ 错误顺序！因为 `:visited` 写在 `:hover` 后面，导致悬停变色失效。';
                orderHint.className = 'hint-box error-hint';
                advancedLink.classList.add('order-wrong');
                isSimulatedVisited = true;
            } else {
                orderHint.innerHTML = '✅ 正确顺序。悬停时可以看到样式变化。';
                orderHint.className = 'hint-box';
                advancedLink.classList.remove('order-wrong');
                isSimulatedVisited = false;
            }
            updateAdvancedLink();
        });
    });

    // 鼠标操作检测
    advancedLink?.addEventListener('mouseenter', () => {
        if(activeStateHint) {
            activeStateHint.textContent = '鼠标悬停中';
            activeStateHint.style.color = 'var(--accent-cyan)';
        }
    });
    advancedLink?.addEventListener('mouseleave', () => {
        if(activeStateHint) {
            activeStateHint.textContent = '无操作';
            activeStateHint.style.color = 'var(--text-muted)';
        }
        // 离开模拟访问状态
        if(!isSimulatedVisited && currentOrder !== 'wrong') {
            isSimulatedVisited = true;
            updateAdvancedLink();
        }
    });
    advancedLink?.addEventListener('mousedown', () => {
        if(activeStateHint) {
            activeStateHint.textContent = '鼠标按下中';
            activeStateHint.style.color = 'var(--accent-pink)';
        }
    });
    advancedLink?.addEventListener('mouseup', () => {
        if(activeStateHint) {
            activeStateHint.textContent = '鼠标悬停中';
            activeStateHint.style.color = 'var(--accent-cyan)';
        }
    });

    // 扩展元素交互逻辑
    let extHover = false;
    let extActive = false;

    function updateExtElements() {
        if($('snip-div-hover')) $('snip-div-hover').style.display = extHover ? 'block' : 'none';
        if($('snip-div-active')) $('snip-div-active').style.display = extActive ? 'block' : 'none';
        
        [extBtn, extLi].forEach(el => {
            if(!el) return;
            el.classList.toggle('is-hover', extHover);
            el.classList.toggle('is-active', extActive);
        });
    }

    document.querySelectorAll('[data-div-style]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.currentTarget.classList.toggle('active');
            const type = e.currentTarget.dataset.divStyle;
            if (type === 'hover') extHover = e.currentTarget.classList.contains('active');
            if (type === 'active') extActive = e.currentTarget.classList.contains('active');
            updateExtElements();
        });
    });

    const bindExtEvents = (el, name) => {
        if(!el) return;
        el.addEventListener('mouseenter', () => {
            if(extHover) {
                extStatusHint.textContent = `${name} 触发了 :hover`;
                extStatusHint.style.color = 'var(--accent-cyan)';
            }
        });
        el.addEventListener('mouseleave', () => {
            extStatusHint.textContent = '等待操作...';
            extStatusHint.style.color = 'var(--accent-orange)';
        });
        el.addEventListener('mousedown', () => {
            if(extActive) {
                extStatusHint.textContent = `${name} 触发了 :active`;
                extStatusHint.style.color = 'var(--accent-pink)';
            }
        });
    };
    bindExtEvents(extBtn, 'Button');
    bindExtEvents(extLi, 'Div');

    // 拦截点击默认行为
    if (advancedLink) {
        advancedLink.setAttribute('href', 'javascript:void(0)');
        advancedLink.addEventListener('click', e => e.preventDefault());
    }
    document.querySelectorAll('.scene-link-1, .scene-link-2, .scene-link-3').forEach(el => {
        el.setAttribute('href', 'javascript:void(0)');
        el.addEventListener('click', e => e.preventDefault());
    });

    // 初始化
    updateAdvancedLink();
    updateExtElements();


    /* ============================================================
       模块 3：焦点与交互伪类百宝箱（终极飞行版）
       ============================================================ */
    const focusShowcase = $('focusShowcase');
    const focusHint = $('focusHint');
    const focusHtmlCode = $('focusHtmlCode');
    
    const focusBtn = focusShowcase.querySelector('.focus-btn');
    const focusInput = focusShowcase.querySelector('.focus-input');
    const notBtn1 = focusShowcase.querySelector('.not-btn-1');
    const notBtn2 = focusShowcase.querySelector('.not-btn-2');
    const noStyleBtn = focusShowcase.querySelector('.no-style-btn');
    const targetBlock = focusShowcase.querySelector('.target-block');
    const structList = focusShowcase.querySelector('.struct-list');
    const langTexts = focusShowcase.querySelectorAll('.lang-text');

    let states = {
        focus: false, focusVisible: false, target: false, not: false, nth: false, firstLast: false, lang: false
    };

    // ==========================================
    // 核心动画：光球飞行与多目标分发
    // ==========================================
    function flyOrb(sourceEl, targets, color, callback) {
        if (!sourceEl || !targets) return;
        if (!Array.isArray(targets)) targets = [targets];
        
        const srcRect = sourceEl.getBoundingClientRect();
        const startX = srcRect.left + srcRect.width / 2;
        const startY = srcRect.top + srcRect.height / 2;

        // 为每个目标创建一个光球
        targets.forEach(targetEl => {
            if (!targetEl) return;
            const tgtRect = targetEl.getBoundingClientRect();
            const endX = tgtRect.left + tgtRect.width / 2;
            const endY = tgtRect.top + tgtRect.height / 2;

            const orb = document.createElement('div');
            orb.className = 'flying-orb';
            orb.style.left = (startX - 8) + 'px';
            orb.style.top = (startY - 8) + 'px';
            orb.style.background = `radial-gradient(circle, #fff, ${color})`;
            orb.style.boxShadow = `0 0 15px ${color}, 0 0 30px ${color}`;
            document.body.appendChild(orb);

            // 飞行动画
            requestAnimationFrame(() => {
                orb.style.left = (endX - 8) + 'px';
                orb.style.top = (endY - 8) + 'px';
                orb.style.transform = 'scale(1.5)';
                orb.style.opacity = '0.8';
            });

            // 到达目标后触发爆炸
            setTimeout(() => {
                orb.style.transform = 'scale(0)';
                orb.style.opacity = '0';
                
                // 创建爆炸圆环
                const ring = document.createElement('div');
                ring.className = 'burst-ring';
                ring.style.left = (endX - 8) + 'px';
                ring.style.top = (endY - 8) + 'px';
                ring.style.setProperty('--burst-color', color);
                document.body.appendChild(ring);
                
                setTimeout(() => ring.remove(), 500);
                orb.remove();
                
                if (callback) callback(targetEl);
            }, 800);
        });
    }

    function updateFocusModule() {
        // 1. 应用类名控制静态特效
        focusBtn.classList.toggle('focus-active', states.focus);
        focusInput.classList.toggle('focus-visible-active', states.focusVisible);
        targetBlock.classList.toggle('target-active', states.target);
        // 选中普通按钮 1
        notBtn1.classList.toggle('not-active', states.not);
        // 选中跳转链接（它实际上是一个 a 标签）
        notBtn2.classList.toggle('not-active', states.not);
        structList.classList.toggle('nth-active', states.nth);
        structList.classList.toggle('firstlast-active', states.firstLast);
        langTexts.forEach(el => el.classList.toggle('lang-active', states.lang));

        // 2. 显示/隐藏面板
        $('exp-focus').style.display = states.focus ? 'block' : 'none';
        $('exp-focus-visible').style.display = states.focusVisible ? 'block' : 'none';
        $('exp-target').style.display = states.target ? 'block' : 'none';
        $('exp-not').style.display = states.not ? 'block' : 'none';
        $('exp-nth').style.display = states.nth ? 'block' : 'none';
        $('exp-firstlast').style.display = states.firstLast ? 'block' : 'none';
        $('exp-lang').style.display = states.lang ? 'block' : 'none';

        // 3. 渲染代码块
        const formatCode = (text) => renderCode(text);
        $('snip-focus').innerHTML = states.focus ? formatCode(`button:focus {\n  border-color: #f59e0b;\n}`) : '';
        $('snip-focus-visible').innerHTML = states.focusVisible ? formatCode(`input:focus-visible {\n  border-color: #06b6d4;\n}`) : '';
        $('snip-target').innerHTML = states.target ? formatCode(`#target-sec:target {\n  border-color: #ec4899;\n}`) : '';
        $('snip-not').innerHTML = states.not ? formatCode(`button:not(.no-style-btn) {\n  background: #3b82f6;\n}`) : '';
        $('snip-nth').innerHTML = states.nth ? formatCode(`li:nth-child(odd) { color: #3b82f6; }\nli:nth-child(even) { color: #8b5cf6; }`) : '';
        $('snip-firstlast').innerHTML = states.firstLast ? formatCode(`li:first-child { color: #ec4899; }\nli:last-child { color: #10b981; }`) : '';
        $('snip-lang').innerHTML = states.lang ? formatCode(`p:lang(zh-CN) { color: #10b981; }\np:lang(en) { color: #8b5cf6; }`) : '';

        // 4. 更新 HTML 代码展示
        if (focusHtmlCode) {
            const htmlStr = `<!-- 焦点 -->\n<button class="focus-btn">按钮</button>\n<input class="focus-input" placeholder="输入框">\n\n<!-- 锚点目标 -->\n<div id="target-sec">我是目标元素</div>\n\n<!-- 结构列表 -->\n<ul class="struct-list">\n  <li>第一项</li>...\n</ul>\n\n<!-- 多语言 -->\n<p lang="zh-CN">中文</p>\n<p lang="en">English</p>`;
            focusHtmlCode.innerHTML = renderCode(htmlStr);
        }
    }

    // ==========================================
    // 交互开关事件与多光球触发逻辑
    // ==========================================

    // 1. 通用焦点 (橙光，飞向按钮)
    $('toggleFocus')?.addEventListener('click', (e) => {
        e.currentTarget.classList.toggle('active');
        states.focus = e.currentTarget.classList.contains('active');
        updateFocusModule();
        if (states.focus) {
            flyOrb($('snip-focus'), focusBtn, 'var(--accent-orange)');
        }
    });

    // 2. 键盘专属 (青光，飞向输入框)
    $('toggleFocusVisible')?.addEventListener('click', (e) => {
        e.currentTarget.classList.toggle('active');
        states.focusVisible = e.currentTarget.classList.contains('active');
        updateFocusModule();
        if (states.focusVisible) {
            flyOrb($('snip-focus-visible'), focusInput, 'var(--accent-cyan)');
        }
    });

    // 3. 目标高亮 (粉光，飞向目标块)
    $('toggleTarget')?.addEventListener('click', (e) => {
        e.currentTarget.classList.toggle('active');
        states.target = e.currentTarget.classList.contains('active');
        updateFocusModule();
        
        if (states.target) {
            targetBlock.classList.remove('target-active'); // 先移除等待
            flyOrb($('snip-target'), targetBlock, 'var(--accent-pink)', () => {
                targetBlock.classList.add('target-active');
            });
        } else {
            targetBlock.classList.remove('target-active');
        }
    });

    // 4. 排除样式 (蓝光，飞向除了 no-style-btn 以外的两个按钮)
    $('toggleNot')?.addEventListener('click', (e) => {
        e.currentTarget.classList.toggle('active');
        states.not = e.currentTarget.classList.contains('active');
        updateFocusModule();
        
        if (states.not) {
            // 传入数组，光球一分为二
            flyOrb($('snip-not'), [notBtn1, notBtn2], '#3b82f6');
        }
    });

    // 5. 奇偶交替 (蓝/紫双色光球，分别飞向奇偶)
    $('toggleNth')?.addEventListener('click', (e) => {
        e.currentTarget.classList.toggle('active');
        states.nth = e.currentTarget.classList.contains('active');
        updateFocusModule();
        
        if (states.nth) {
            const oddItems = structList.querySelectorAll('li:nth-child(odd)');
            const evenItems = structList.querySelectorAll('li:nth-child(even)');
            if (oddItems.length) flyOrb($('snip-nth'), Array.from(oddItems), '#3b82f6'); // 蓝光
            if (evenItems.length) flyOrb($('snip-nth'), Array.from(evenItems), '#8b5cf6'); // 紫光
        }
    });

    // 6. 首尾修饰 (粉/绿双色光球)
    $('toggleFirstLast')?.addEventListener('click', (e) => {
        e.currentTarget.classList.toggle('active');
        states.firstLast = e.currentTarget.classList.contains('active');
        updateFocusModule();
        
        if (states.firstLast) {
            const firstItem = structList.querySelector('li:first-child');
            const lastItem = structList.querySelector('li:last-child');
            if (firstItem) flyOrb($('snip-firstlast'), firstItem, '#ec4899'); // 粉光
            if (lastItem) flyOrb($('snip-firstlast'), lastItem, '#10b981'); // 绿光
        }
    });

    // 7. 语言区分 (绿/紫双色光球)
    $('toggleLang')?.addEventListener('click', (e) => {
        e.currentTarget.classList.toggle('active');
        states.lang = e.currentTarget.classList.contains('active');
        updateFocusModule();
        
        if (states.lang) {
            const zhText = focusShowcase.querySelector('[lang="zh-CN"]');
            const enText = focusShowcase.querySelector('[lang="en"]');
            if (zhText) flyOrb($('snip-lang'), zhText, '#10b981'); // 绿光
            if (enText) flyOrb($('snip-lang'), enText, '#8b5cf6'); // 紫光
        }
    });

    // 焦点输入测试提示
    focusBtn.addEventListener('focus', () => {
        if (focusHint && states.focus) {
            focusHint.textContent = '🖱️/⌨️ 按钮获得焦点，橙色光圈生效！';
            focusHint.style.color = '#f59e0b';
        }
    });
    focusInput.addEventListener('focus', () => {
        if (focusHint) {
            if (focusInput.matches(':focus-visible') && states.focusVisible) {
                focusHint.textContent = '⌨️ 输入框获得键盘焦点，青色特效生效！';
                focusHint.style.color = '#06b6d4';
            } else if (states.focusVisible) {
                focusHint.textContent = '🖱️ 鼠标点击输入框，:focus-visible 未触发。';
                focusHint.style.color = '#f59e0b';
            }
        }
    });
    [focusBtn, focusInput].forEach(el => {
        el.addEventListener('blur', () => {
            if (focusHint) {
                focusHint.textContent = '按 Tab 键切换，或鼠标点击试试';
                focusHint.style.color = 'var(--text-muted)';
            }
        });
    });

    // 初始化
    updateFocusModule();


    /* ============================================================
       模块 4：高级交互代码 (完整恢复)
       ============================================================ */
    const casesCodeBox = $('casesLiveCode');
    if (casesCodeBox) {
        const casesCode = `/* 1. 下划线展开 */\na::after {\n  content: '';\n  width: 0;\n  transition: width 0.3s;\n}\na:hover::after { width: 100%; }\n\n/* 2. 按钮按压 */\na:active {\n  transform: translateY(3px);\n  box-shadow: none;\n}\n\n/* 3. target 高亮 */\n#target-box:target {\n  background: var(--accent-pink);\n  color: white;\n}`;
        casesCodeBox.innerHTML = renderCode(casesCode);
    }

    /* ============================================================
       模块 5：超链接可放置的内容
       ============================================================ */
    const linkContentDisplay = $('linkContentDisplay');
    const contentLiveCode = $('contentLiveCode');

    // 熊猫图片的正确相对路径
    const pandaPath = '../img/panda.png';
    // 图片加载失败时的兜底占位（用 SVG 画一个熊猫脸，使用单引号避免 HTML 解析冲突）
    const pandaFallback = "this.onerror=null; this.src='data:image/svg+xml;utf8,<svg xmlns=\\'http://www.w3.org/2000/svg\\' viewBox=\\'0 0 100 100\\'><circle cx=\\'50\\' cy=\\'50\\' r=\\'45\\' fill=\\'%23ffffff\\' stroke=\\'%23333\\' stroke-width=\\'4\\'/><circle cx=\\'30\\' cy=\\'40\\' r=\\'10\\' fill=\\'%23333\\'/><circle cx=\\'70\\' cy=\\'40\\' r=\\'10\\' fill=\\'%23333\\'/><circle cx=\\'50\\' cy=\\'60\\' r=\\'12\\' fill=\\'%23333\\'/><circle cx=\\'50\\' cy=\\'82\\' r=\\'6\\' fill=\\'%23ec4899\\'/></svg>'";

    function renderContentDemo(type) {
        if (!linkContentDisplay) return;

        let html = '';
        let code = '';

        switch (type) {
            case 'text':
                html = `<a href="#" class="demo-link-text">这是最基础的文字链接</a>`;
                code = `/* CSS */
.demo-link-text {
  color: #06b6d4;
  text-decoration: underline;
  font-size: 18px;
}

<!-- HTML -->
<a href="#" class="demo-link-text">这是最基础的文字链接</a>`;
                break;
                
            case 'image':
                html = `
                    <a href="#" class="demo-link-image">
                        <img src="${pandaPath}" onerror="${pandaFallback}" alt="熊猫图片">
                    </a>
                `;
                code = `/* CSS */
.demo-link-image img {
  max-width: 100%;
  border-radius: 12px;
  border: 3px solid transparent;
  transition: all 0.3s;
}
.demo-link-image:hover img {
  border-color: #06b6d4;
  transform: scale(1.02);
}

<!-- HTML -->
<a href="#" class="demo-link-image">
  <img src="img/panda.png" alt="熊猫图片">
</a>`;
                break;
                
            case 'card':
                html = `
                    <a href="#" class="demo-link-card">
                        <img src="${pandaPath}" onerror="${pandaFallback}" alt="熊猫图片">
                        <div class="card-info">
                            <h4>点击查看熊猫详情</h4>
                            <p>这里包裹了整个 div 卡片结构，点击任何地方都能跳转。</p>
                        </div>
                    </a>
                `;
                code = `/* CSS */
.demo-link-card {
  display: flex;
  gap: 16px;
  padding: 16px;
  border-radius: 12px;
  background: #1e293b;
}
.demo-link-card img {
  width: 80px;
  height: 80px;
  border-radius: 8px;
  object-fit: cover;
}

<!-- HTML -->
<a href="#" class="demo-link-card">
  <img src="img/panda.png" alt="熊猫">
  <div class="card-info">
    <h4>点击查看熊猫详情</h4>
    <p>这里包裹了整个 div...</p>
  </div>
</a>`;
                break;
                
            case 'button':
                html = `<a href="#" class="demo-link-button">我是伪装成按钮的链接</a>`;
                code = `/* CSS */
.demo-link-button {
  display: inline-block;
  padding: 12px 32px;
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: white;
  border-radius: 30px;
  box-shadow: 0 4px 12px rgba(59,130,246,0.4);
}

<!-- HTML -->
<a href="#" class="demo-link-button">
  我是伪装成按钮的链接
</a>`;
                break;
        }

        linkContentDisplay.innerHTML = html;
        
        // 渲染高亮代码
        if (contentLiveCode) {
            let highlighted = renderCode(code);
            // 简单给 CSS 属性和值上色
            highlighted = highlighted.replace(/([a-z-]+):/g, '<span class="prop">$1</span>:')
                                     .replace(/(#[a-fA-F0-9]{3,6}|[0-9]+px|rgba?\([^)]+\))/g, '<span class="val">$1</span>');
            contentLiveCode.innerHTML = highlighted;
        }
    }

    // 绑定按钮切换
    document.querySelectorAll('[data-content-type]').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('[data-content-type]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderContentDemo(btn.dataset.contentType);
        });
    });

    // 防止点击时页面跳转
    linkContentDisplay?.addEventListener('click', (e) => {
        if (e.target.closest('a')) {
            e.preventDefault();
        }
    });

    // 初始化显示文本
    renderContentDemo('text');
	
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
	
	initChallengeUI('超链接');
}