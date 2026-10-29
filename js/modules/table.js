import { $, bindToggle } from '../core/utils.js';
import { initSlider } from '../components/slider.js';
import { initChallengeUI } from '../components/challenge-ui.js';

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
    return `<pre>${html}</pre>`;
}

let baseData = [
    ['姓名', '科目', '分数'],
    ['张三', '数学', '98'],
    ['李四', '英语', '92']
];

// 初始状态全部清空/归零
const state = {
    useTh: false, // 默认不使用 th，保持纯 td
    tblBorder: 0,
    tblCellSpacing: 2,
    tblCellPadding: 1,
    tblWidth: '',
    tblHeight: '',
    tblAlign: 'left',
    
    tblBgcolor: '',
    tblBgImage: '',
    
    trTarget: 'all',
    trHeight: '',
    trAlign: 'left',
    trValign: 'top',
    trBgcolor: '',
    trBgImage: '',
    
    tdWidth: '', 
    tdHeight: '',
    tdAlign: 'left',
    tdValign: 'top',
    tdBgcolor: '',
    tdBgImage: '',
    
    selectedCell: { r: -1, c: -1 },
    activeRowspan: 1,
    activeColspan: 1
};

function buildHTML(isCodeDisplay = false) {
    let tableAttrs = '';
    if (state.tblBorder > 0) tableAttrs += ` border="${state.tblBorder}"`;
    if (state.tblCellSpacing !== 2) tableAttrs += ` cellspacing="${state.tblCellSpacing}px"`;
    if (state.tblCellPadding !== 1) tableAttrs += ` cellpadding="${state.tblCellPadding}px"`;
    if (state.tblWidth) tableAttrs += ` width="${state.tblWidth}"`;
    if (state.tblHeight) tableAttrs += ` height="${state.tblHeight}"`;
    
    if (state.tblBgcolor) tableAttrs += ` bgcolor="${state.tblBgcolor}"`;
    if (state.tblBgImage) tableAttrs += ` background="${state.tblBgImage}"`;

    // 对齐处理
    if (state.tblAlign !== 'left') {
        if (isCodeDisplay) {
            tableAttrs += ` align="${state.tblAlign}"`;
        } else {
            if (state.tblAlign === 'center') tableAttrs += ` style="table-layout: fixed; word-wrap: break-word; margin: 0 auto;"`;
            else if (state.tblAlign === 'right') tableAttrs += ` style="table-layout: fixed; word-wrap: break-word; margin: 0 0 0 auto;"`;
        }
    } else {
        if (!isCodeDisplay) tableAttrs += ` style="table-layout: fixed; word-wrap: break-word; margin: 0 auto 0 0;"`;
    }

    const isHeadRowspan = (state.selectedCell.r === 0 && state.activeRowspan > 1);
    let html = `<table id="dynamicTable"${tableAttrs}>\n`;

    const renderCell = (r, c, tag) => {
        if (isSwallowed(r, c)) return `      <!-- <${tag}>${baseData[r][c]}</${tag}> (被合并隐藏) -->\n`;

        let attrs = '';
        if (state.selectedCell.r === r && state.selectedCell.c === c) {
            if (state.activeColspan > 1) attrs += ` colspan="${state.activeColspan}"`;
            if (state.activeRowspan > 1) attrs += ` rowspan="${state.activeRowspan}"`;
            if (state.tdBgcolor) attrs += ` bgcolor="${state.tdBgcolor}"`;
            if (state.tdBgImage) attrs += ` background="${state.tdBgImage}"`;
        }

        if (isCodeDisplay) {
            if (state.selectedCell.r === r && state.selectedCell.c === c) {
                if (state.tdWidth) attrs += ` width="${state.tdWidth}"`;
                if (state.tdHeight) attrs += ` height="${state.tdHeight}"`;
                if (state.tdAlign !== 'left') attrs += ` align="${state.tdAlign}"`;
                if (state.tdValign !== 'top') attrs += ` valign="${state.tdValign}"`;
            }
        } else {
            let styleStr = '';
            if (state.selectedCell.r === r && state.selectedCell.c === c) {
                if (state.tdWidth) styleStr += `width: ${state.tdWidth}; `;
                if (state.tdHeight) styleStr += `height: ${state.tdHeight}; `;
                if (state.tdAlign !== 'left') styleStr += `text-align: ${state.tdAlign}; `;
                if (state.tdValign !== 'top') styleStr += `vertical-align: ${state.tdValign}; `;
            }
            if (styleStr) attrs += ` style="${styleStr}"`;
        }

        return `      <${tag}${attrs} data-r="${r}" data-c="${c}">${baseData[r][c]}</${tag}>\n`;
    };

    // 渲染 THEAD
    if (!isHeadRowspan) {
        let theadTrAttrs = '';
        if (state.trTarget === 'all' || parseInt(state.trTarget) === 0) {
            if (state.trAlign !== 'left') theadTrAttrs += ` align="${state.trAlign}"`;
            if (state.trValign !== 'top') theadTrAttrs += ` valign="${state.trValign}"`;
            if (state.trBgcolor) theadTrAttrs += ` bgcolor="${state.trBgcolor}"`;
            if (state.trBgImage) theadTrAttrs += ` background="${state.trBgImage}"`;
        }
        if (isCodeDisplay) {
            if (state.trHeight && (state.trTarget === 'all' || parseInt(state.trTarget) === 0)) theadTrAttrs += ` height="${state.trHeight}"`;
        } else {
            if (state.trHeight && (state.trTarget === 'all' || parseInt(state.trTarget) === 0)) theadTrAttrs += ` style="height: ${state.trHeight};"`;
        }

        html += `  <thead>\n    <tr${theadTrAttrs}>\n`;
        for (let j = 0; j < baseData[0].length; j++) {
            html += renderCell(0, j, state.useTh ? 'th' : 'td');
        }
        html += `    </tr>\n  </thead>\n`;
    }

    // 渲染 TBODY
    html += `  <tbody>\n`;
    const startRow = isHeadRowspan ? 0 : 1;
    
    for (let i = startRow; i < baseData.length; i++) {
        let trAttrs = '';
        if (state.trTarget === 'all' || parseInt(state.trTarget) === i) {
            if (state.trAlign !== 'left') trAttrs += ` align="${state.trAlign}"`;
            if (state.trValign !== 'top') trAttrs += ` valign="${state.trValign}"`;
            if (state.trBgcolor) trAttrs += ` bgcolor="${state.trBgcolor}"`;
            if (state.trBgImage) trAttrs += ` background="${state.trBgImage}"`;
        }
        
        if (isCodeDisplay) {
            if (state.trHeight && (state.trTarget === 'all' || parseInt(state.trTarget) === i)) trAttrs += ` height="${state.trHeight}"`;
        } else {
            if (state.trHeight && (state.trTarget === 'all' || parseInt(state.trTarget) === i)) trAttrs += ` style="height: ${state.trHeight};"`;
        }

        html += `    <tr${trAttrs}>\n`;

        for (let j = 0; j < baseData[i].length; j++) {
            const tag = (i === 0 && state.useTh) ? 'th' : 'td';
            html += renderCell(i, j, tag);
        }
        html += `    </tr>\n`;
    }
    html += `  </tbody>\n</table>`;
    return html;
}

function isSwallowed(r, c) {
    const { r: sr, c: sc } = state.selectedCell;
    if (sr === -1) return false;
    if (r === sr && c > sc && c < sc + state.activeColspan) return true;
    if (c === sc && r > sr && r < sr + state.activeRowspan) return true;
    if (r > sr && r < sr + state.activeRowspan && c > sc && c < sc + state.activeColspan) return true;
    return false;
}

function renderTable() {
    const wrapper = $('tableWrapper');
    if (!wrapper) return;
    
    const renderHTML = buildHTML(false);
    wrapper.innerHTML = renderHTML;

    const codeHTML = buildHTML(true);
    $('tableHtmlCode').innerHTML = renderCode(codeHTML);

    const tableNode = wrapper.querySelector('table');
    if (tableNode) {
        // ======== 核心修复 1：强制接管 Table 的背景图，使大图能缩放 ========
        if (state.tblBgImage) {
            tableNode.style.backgroundImage = `url("${state.tblBgImage}")`;
            tableNode.style.backgroundSize = 'cover';
            tableNode.style.backgroundPosition = 'center';
            tableNode.style.backgroundRepeat = 'no-repeat';
        } else {
            tableNode.style.backgroundImage = 'none';
        }
        if (state.tblBgcolor) {
            tableNode.style.backgroundColor = state.tblBgcolor;
        } else {
            tableNode.style.backgroundColor = '';
        }

        // 补齐 padding 和边框
        tableNode.querySelectorAll('th, td').forEach(cell => {
            cell.style.padding = `${state.tblCellPadding}px`;
        });
        
        const allTrs = tableNode.querySelectorAll('tr');
        allTrs.forEach((tr, index) => {
            const isHead = tr.parentNode.tagName === 'THEAD';
            const rIndex = isHead ? 0 : index; 
            
            // ======== 核心修复 2：行背景强行接管，清空时变透明 ========
            if (state.trTarget === 'all' || parseInt(state.trTarget) === rIndex) {
                if (state.trAlign !== 'left') tr.style.textAlign = state.trAlign;
                if (state.trValign !== 'top') tr.style.verticalAlign = state.trValign;
                
                if (state.trBgcolor) tr.style.backgroundColor = state.trBgcolor;
                else tr.style.backgroundColor = 'transparent';
                
                if (state.trBgImage) {
                    tr.style.backgroundImage = `url("${state.trBgImage}")`;
                    tr.style.backgroundSize = 'cover';
                    tr.style.backgroundPosition = 'center';
                    tr.style.backgroundRepeat = 'no-repeat';
                } else {
                    tr.style.backgroundImage = 'none';
                }

                tr.querySelectorAll('th, td').forEach(cell => {
                    if (!cell.style.textAlign) cell.style.textAlign = state.trAlign;
                    if (!cell.style.verticalAlign) cell.style.verticalAlign = state.trValign;
                });
            }

            // ======== 核心修复 3：单元格背景强行接管 ========
            tr.querySelectorAll('th, td').forEach(cell => {
                const r = parseInt(cell.dataset.r);
                const c = parseInt(cell.dataset.c);

                if (state.selectedCell.r === r && state.selectedCell.c === c) {
                    if (state.tdBgcolor) cell.style.backgroundColor = state.tdBgcolor;
                    else cell.style.backgroundColor = 'transparent';
                    
                    if (state.tdBgImage) {
                        cell.style.backgroundImage = `url("${state.tdBgImage}")`;
                        cell.style.backgroundSize = 'cover';
                        cell.style.backgroundPosition = 'center';
                        cell.style.backgroundRepeat = 'no-repeat';
                    } else {
                        cell.style.backgroundImage = 'none';
                    }
                }
            });
        });

        // 选中交互
        tableNode.querySelectorAll('th, td').forEach(cell => {
            if (parseInt(cell.dataset.r) === state.selectedCell.r && parseInt(cell.dataset.c) === state.selectedCell.c) {
                cell.style.outline = '3px solid var(--accent-cyan)';
                cell.style.outlineOffset = '-3px';
            } else {
                cell.style.outline = 'none';
            }

            cell.addEventListener('click', (e) => {
                e.preventDefault();
                const r = parseInt(cell.dataset.r);
                const c = parseInt(cell.dataset.c);
                
                if (state.selectedCell.r === r && state.selectedCell.c === c) return;

                state.selectedCell = { r, c };
                state.activeRowspan = 1;
                state.activeColspan = 1;
                state.tdWidth = '';
                state.tdHeight = '';
                state.tdBgcolor = '';
                state.tdBgImage = '';
                
                // 同步重置面板控件
                $('inputTdBgcolor').value = '#1e293b';
                $('inputTdBgImage').value = '';

                $('toggleRowspan').classList.remove('active');
                $('toggleColspan').classList.remove('active');
                $('rowspanControls').style.display = 'none';
                $('colspanControls').style.display = 'none';
                
                $('sliderTdWidth').value = 0;
                $('sliderTdHeight').value = 0;
                $('valTdWidth').textContent = 'auto';
                $('valTdHeight').textContent = 'auto';

                const maxRowspan = baseData.length - r;
                const maxColspan = baseData[0].length - c;
                $('inputRowspanCount').max = maxRowspan;
                $('inputRowspanCount').value = Math.min(2, maxRowspan);
                $('inputColspanCount').max = maxColspan;
                $('inputColspanCount').value = Math.min(2, maxColspan);

                $('selectionInfo').innerHTML = `🎯 当前选中：<strong>第 ${r+1} 行，第 ${c+1} 列</strong>`;
                $('mergeControlBox').style.display = 'block';

                renderTable();
            });
        });
    }
}

function initTableBasicSection() {
    document.querySelectorAll('[data-tab]').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('[data-tab]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            document.querySelectorAll('.table-tab-panel').forEach(p => p.style.display = 'none');
            $('tab-panel-' + btn.dataset.tab).style.display = 'block';
        });
    });

    bindToggle('toggleUseTh', active => { state.useTh = active; renderTable(); });

    // Table 属性
    initSlider({ id: 'sliderTblBorder', displayId: 'valTblBorder', min: 0, max: 10, value: 0, step: 1, onChange: v => { state.tblBorder = v; renderTable(); } });
    initSlider({ id: 'sliderTblCellSpacing', displayId: 'valTblCellSpacing', min: 0, max: 30, value: 2, step: 1, onChange: v => { state.tblCellSpacing = v; renderTable(); } });
    initSlider({ id: 'sliderTblCellPadding', displayId: 'valTblCellPadding', min: 0, max: 100, value: 1, step: 1, onChange: v => { state.tblCellPadding = v; renderTable(); } });
    initSlider({ id: 'sliderTblWidth', displayId: 'valTblWidth', min: 0, max: 800, value: 0, step: 10, onChange: v => { state.tblWidth = v === 0 ? '' : v + 'px'; renderTable(); } });
    initSlider({ id: 'sliderTblHeight', displayId: 'valTblHeight', min: 0, max: 400, value: 0, step: 10, onChange: v => { state.tblHeight = v === 0 ? '' : v + 'px'; renderTable(); } });
    
    document.querySelectorAll('[data-tbl-align]').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('[data-tbl-align]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.tblAlign = btn.dataset.tblAlign;
            renderTable();
        });
    });
    $('inputTblBgcolor')?.addEventListener('input', e => { state.tblBgcolor = e.target.value; renderTable(); });
    $('inputTblBgImage')?.addEventListener('input', e => { state.tblBgImage = e.target.value; renderTable(); });

    // Tr 属性
    $('selectTrTarget')?.addEventListener('change', e => { state.trTarget = e.target.value; renderTable(); });
    initSlider({ id: 'sliderTrHeight', displayId: 'valTrHeight', min: 0, max: 100, value: 0, step: 5, onChange: v => { state.trHeight = v === 0 ? '' : v + 'px'; renderTable(); } });
    $('selectTrAlign')?.addEventListener('change', e => { state.trAlign = e.target.value; renderTable(); });
    $('selectTrValign')?.addEventListener('change', e => { state.trValign = e.target.value; renderTable(); });
    $('inputTrBgcolor')?.addEventListener('input', e => { state.trBgcolor = e.target.value; renderTable(); });
    $('inputTrBgImage')?.addEventListener('input', e => { state.trBgImage = e.target.value; renderTable(); });

    // 合并
    bindToggle('toggleRowspan', active => {
        $('rowspanControls').style.display = active ? 'block' : 'none';
        if (active && state.selectedCell.r > -1) {
            let max = parseInt($('inputRowspanCount').max);
            let v = parseInt($('inputRowspanCount').value) || 2;
            if (v > max) v = max;
            state.activeRowspan = v;
        } else {
            state.activeRowspan = 1;
        }
        renderTable();
    });
    
    bindToggle('toggleColspan', active => {
        $('colspanControls').style.display = active ? 'block' : 'none';
        if (active && state.selectedCell.r > -1) {
            let max = parseInt($('inputColspanCount').max);
            let v = parseInt($('inputColspanCount').value) || 2;
            if (v > max) v = max;
            state.activeColspan = v;
        } else {
            state.activeColspan = 1;
        }
        renderTable();
    });

    $('inputRowspanCount')?.addEventListener('change', e => {
        let max = parseInt(e.target.max);
        let v = parseInt(e.target.value) || 2;
        if (v > max) v = max;
        e.target.value = v;
        if (state.activeRowspan > 1) { state.activeRowspan = v; renderTable(); }
    });
    
    $('inputColspanCount')?.addEventListener('change', e => {
        let max = parseInt(e.target.max);
        let v = parseInt(e.target.value) || 2;
        if (v > max) v = max;
        e.target.value = v;
        if (state.activeColspan > 1) { state.activeColspan = v; renderTable(); }
    });

    // Td 属性
    initSlider({ id: 'sliderTdWidth', displayId: 'valTdWidth', min: 0, max: 300, value: 0, step: 10, onChange: v => { state.tdWidth = v === 0 ? '' : v + 'px'; renderTable(); }});
    initSlider({ id: 'sliderTdHeight', displayId: 'valTdHeight', min: 0, max: 200, value: 0, step: 10, onChange: v => { state.tdHeight = v === 0 ? '' : v + 'px'; renderTable(); }});
    $('selectTdAlign')?.addEventListener('change', e => { state.tdAlign = e.target.value; renderTable(); });
    $('selectTdValign')?.addEventListener('change', e => { state.tdValign = e.target.value; renderTable(); });
    $('inputTdBgcolor')?.addEventListener('input', e => { state.tdBgcolor = e.target.value; renderTable(); });
    $('inputTdBgImage')?.addEventListener('input', e => { state.tdBgImage = e.target.value; renderTable(); });

    renderTable();
}

// ================= 以下是 CSS 表格美化板块的新增逻辑 =================

const cssStyleState = {
    collapse: 'collapse',
    spacing: 4,
    
    // Table 外边框
    tblBorderStyle: 'solid',
    tblBorderWidth: 2,
    tblBorderColor: '#3b82f6',
    tblBorderRadius: 0,
    
    // td / th 单元格边框
    tdBorderStyle: 'solid',
    tdBorderWidth: 1,
    tdBorderColor: '#475569',
    tdBorderRadius: 0,
    
    // Table 背景
    tblBgColor: '#0f172a',
    tblBgImage: '',
    
    // td / th 背景
    tdBgColor: '#1e293b',
    tdBgImage: '',
    bgSize: 'cover',
    bgRepeat: 'no-repeat',
    
    // Padding
    tblPadding: 0,
    tdPadding: 14,
    
    zebra: true,
    hover: true
};

function updateModernTableCss() {
    const table = $('modernTable');
    if (!table) return;

    // 1. 清空所有内联样式和类名
    table.style = '';
    table.className = 'modern-table';
    table.querySelectorAll('th, td').forEach(el => { el.style = ''; });

    // 2. 边框合并
    table.style.borderCollapse = cssStyleState.collapse;
    if (cssStyleState.collapse === 'separate') {
        table.style.borderSpacing = cssStyleState.spacing + 'px';
        $('spacingGroup').style.display = 'block';
    } else {
        $('spacingGroup').style.display = 'none';
    }

    // 3. Table 外边框 + 圆角
    const hasTblBorder = cssStyleState.tblBorderStyle !== 'none' && cssStyleState.tblBorderWidth > 0;
    const borderStr = `${cssStyleState.tblBorderWidth}px ${cssStyleState.tblBorderStyle} ${cssStyleState.tblBorderColor}`;
    
    // 判断是否需要特殊渲染（collapse 模式 + 圆角 > 0 会导致原生 border 颜色丢失，必须用阴影/轮廓兜底）
    const useFallback = (cssStyleState.tblBorderRadius > 0 && cssStyleState.collapse === 'collapse');

    if (useFallback) {
        // --- 兜底渲染方案 (为了视觉正确) ---
        table.style.border = 'none';
        table.style.borderRadius = cssStyleState.tblBorderRadius + 'px';
        table.style.overflow = 'hidden';
        
        if (hasTblBorder) {
            // 用 outline 兜底，完美支持 dashed/dotted，并且能贴合圆角
            table.style.outline = `${cssStyleState.tblBorderWidth}px ${cssStyleState.tblBorderStyle} ${cssStyleState.tblBorderColor}`;
            table.style.outlineOffset = `-${cssStyleState.tblBorderWidth}px`;
        }
    } else {
        // --- 标准渲染方案 (代码怎么写，大屏就怎么显) ---
        table.style.border = hasTblBorder ? borderStr : 'none';
        if (cssStyleState.tblBorderRadius > 0) {
            table.style.borderRadius = cssStyleState.tblBorderRadius + 'px';
            table.style.overflow = 'hidden';
        }
    }

    // 4. td / th 单元格边框 + 圆角
    const hasTdBorder = cssStyleState.tdBorderStyle !== 'none' && cssStyleState.tdBorderWidth > 0;
    const tdBorderStr = hasTdBorder ? `${cssStyleState.tdBorderWidth}px ${cssStyleState.tdBorderStyle} ${cssStyleState.tdBorderColor}` : 'none';
    
    table.querySelectorAll('th, td').forEach(el => {
        el.style.border = tdBorderStr;
        if (cssStyleState.tdBorderRadius > 0) {
            el.style.borderRadius = cssStyleState.tdBorderRadius + 'px';
        }
    });

    // 5. Table 背景
    if (cssStyleState.tblBgColor) table.style.backgroundColor = cssStyleState.tblBgColor;
    if (cssStyleState.tblBgImage) {
        table.style.backgroundImage = `url("${cssStyleState.tblBgImage}")`;
        table.style.backgroundSize = cssStyleState.bgSize;
        table.style.backgroundRepeat = cssStyleState.bgRepeat;
        table.style.backgroundPosition = 'center';
        if (!cssStyleState.tdBgImage && !cssStyleState.tdBgColor) {
            table.querySelectorAll('th, td').forEach(el => el.style.backgroundColor = 'transparent');
        }
    }

    // 6. td / th 背景
    table.querySelectorAll('th, td').forEach(el => {
        if (cssStyleState.tdBgColor) el.style.backgroundColor = cssStyleState.tdBgColor;
        if (cssStyleState.tdBgImage) {
            el.style.backgroundImage = `url("${cssStyleState.tdBgImage}")`;
            el.style.backgroundSize = cssStyleState.bgSize;
            el.style.backgroundRepeat = cssStyleState.bgRepeat;
            el.style.backgroundPosition = 'center';
        }
    });

    // 7. Padding
    if (cssStyleState.tblPadding > 0) table.style.padding = cssStyleState.tblPadding + 'px';
    table.querySelectorAll('th, td').forEach(el => { el.style.padding = cssStyleState.tdPadding + 'px'; });

    // (已删除 第 8 步 斑马线与悬停的逻辑)

    // 9. 生成代码面板 (纯正教学代码，屏蔽 outline 兜底，且移除斑马线代码)
    let codeStr = `/* Table 外边框与背景 */\ntable {\n`;
    codeStr += `  border-collapse: ${cssStyleState.collapse};\n`;
    if (cssStyleState.collapse === 'separate') {
        codeStr += `  border-spacing: ${cssStyleState.spacing}px;\n`;
    }
    
    // 【核心】代码面板永远只输出标准的 border，忠于边框样式的原始定义
    if (hasTblBorder) {
        codeStr += `  border: ${borderStr};\n`;
    } else {
        codeStr += `  border: none;\n`;
    }
    
    if (cssStyleState.tblBorderRadius > 0) {
        codeStr += `  border-radius: ${cssStyleState.tblBorderRadius}px;\n`;
        codeStr += `  overflow: hidden;\n`;
    }
    
    if (cssStyleState.tblPadding > 0) codeStr += `  padding: ${cssStyleState.tblPadding}px;\n`;
    if (cssStyleState.tblBgColor) codeStr += `  background-color: ${cssStyleState.tblBgColor};\n`;
    if (cssStyleState.tblBgImage) {
        codeStr += `  background-image: url("${cssStyleState.tblBgImage}");\n`;
        codeStr += `  background-size: ${cssStyleState.bgSize};\n`;
        codeStr += `  background-repeat: ${cssStyleState.bgRepeat};\n`;
    }
    codeStr += `}\n\n`;

    codeStr += `/* td / th 单元格边框与背景 */\nth, td {\n`;
    if (hasTdBorder) {
        codeStr += `  border: ${tdBorderStr};\n`;
    } else {
        codeStr += `  border: none;\n`;
    }
    if (cssStyleState.tdBorderRadius > 0) codeStr += `  border-radius: ${cssStyleState.tdBorderRadius}px;\n`;
    codeStr += `  padding: ${cssStyleState.tdPadding}px;\n`;
    if (cssStyleState.tdBgColor) codeStr += `  background-color: ${cssStyleState.tdBgColor};\n`;
    if (cssStyleState.tdBgImage) {
        codeStr += `  background-image: url("${cssStyleState.tdBgImage}");\n`;
        codeStr += `  background-size: ${cssStyleState.bgSize};\n`;
        codeStr += `  background-repeat: ${cssStyleState.bgRepeat};\n`;
    }
    codeStr += `}\n`;

    // (已删除 生成斑马线和悬停代码的逻辑)

    $('tableCssCode').innerHTML = renderCode(codeStr);
}

function initTableStyleSection() {
    // 1. 标签切换
    document.querySelectorAll('[data-css-tab]').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('[data-css-tab]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            document.querySelectorAll('.css-tab-panel').forEach(p => p.style.display = 'none');
            $('css-panel-' + btn.dataset.cssTab).style.display = 'block';
        });
    });

    // 2. 合并模式
    document.querySelectorAll('[data-collapse]').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('[data-collapse]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            cssStyleState.collapse = btn.dataset.collapse;
            $('valBorderCollapse').textContent = cssStyleState.collapse;
            updateModernTableCss();
        });
    });
    initSlider({ id: 'sliderBorderSpacing', displayId: 'valBorderSpacing', min: 0, max: 30, value: 4, step: 1, onChange: v => { cssStyleState.spacing = v; updateModernTableCss(); } });

    // 3. Table 外边框与圆角
    document.querySelectorAll('[data-tbl-b-style]').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('[data-tbl-b-style]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            cssStyleState.tblBorderStyle = btn.dataset.tblBStyle;
            $('valTblBorderStyle').textContent = cssStyleState.tblBorderStyle;
            updateModernTableCss();
        });
    });
    initSlider({ id: 'sliderTblBorderWidth', displayId: 'valTblBorderWidth', min: 0, max: 20, value: 2, step: 1, onChange: v => { cssStyleState.tblBorderWidth = v; updateModernTableCss(); } });
    $('inputTblBorderColor')?.addEventListener('input', e => { 
        cssStyleState.tblBorderColor = e.target.value; 
        $('valTblBorderColor').textContent = cssStyleState.tblBorderColor;
        updateModernTableCss(); 
    });
    initSlider({ id: 'sliderTblBorderRadius', displayId: 'valTblBorderRadius', min: 0, max: 50, value: 0, step: 1, onChange: v => { cssStyleState.tblBorderRadius = v; updateModernTableCss(); } });

    // 4. td / th 单元格边框与圆角
    document.querySelectorAll('[data-td-b-style]').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('[data-td-b-style]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            cssStyleState.tdBorderStyle = btn.dataset.tdBStyle;
            $('valTdBorderStyle').textContent = cssStyleState.tdBorderStyle;
            updateModernTableCss();
        });
    });
    initSlider({ id: 'sliderTdBorderWidth', displayId: 'valTdBorderWidth', min: 0, max: 20, value: 1, step: 1, onChange: v => { cssStyleState.tdBorderWidth = v; updateModernTableCss(); } });
    $('inputTdBorderColor')?.addEventListener('input', e => { 
        cssStyleState.tdBorderColor = e.target.value; 
        $('valTdBorderColor').textContent = cssStyleState.tdBorderColor;
        updateModernTableCss(); 
    });
    initSlider({ id: 'sliderTdBorderRadius', displayId: 'valTdBorderRadius', min: 0, max: 50, value: 0, step: 1, onChange: v => { cssStyleState.tdBorderRadius = v; updateModernTableCss(); } });

    // 5. 背景（**重点修复：使用 cssInput 前缀的 ID**）
    $('cssInputTblBgColor')?.addEventListener('input', e => { cssStyleState.tblBgColor = e.target.value; updateModernTableCss(); });
    $('cssInputTblBgImage')?.addEventListener('input', e => { cssStyleState.tblBgImage = e.target.value; updateModernTableCss(); });
    $('cssInputTdBgColor')?.addEventListener('input', e => { cssStyleState.tdBgColor = e.target.value; updateModernTableCss(); });
    $('cssInputTdBgImage')?.addEventListener('input', e => { cssStyleState.tdBgImage = e.target.value; updateModernTableCss(); });
    $('cssSelectBgSize')?.addEventListener('change', e => { cssStyleState.bgSize = e.target.value; updateModernTableCss(); });
    $('cssSelectBgRepeat')?.addEventListener('change', e => { cssStyleState.bgRepeat = e.target.value; updateModernTableCss(); });

    // 6. Padding
    initSlider({ id: 'sliderTblPadding', displayId: 'valTblPadding', min: 0, max: 80, value: 0, step: 2, onChange: v => { cssStyleState.tblPadding = v; updateModernTableCss(); } });
    initSlider({ id: 'sliderTdPadding', displayId: 'valTdPadding', min: 0, max: 80, value: 14, step: 2, onChange: v => { cssStyleState.tdPadding = v; updateModernTableCss(); } });

    updateModernTableCss();
}

// ================= 经典场景：Table 布局逻辑 (thead/tbody/tfoot版) =================

const layoutState = {
    border: 1,
    cellspacing: 2,
    cellpadding: 10,
    headerHeight: 80,
    bodyHeight: 250,
    footerHeight: 50,
    twoColumn: true
};

function updateLayoutTable() {
    const wrapper = $('layoutTableWrapper');
    if (!wrapper) return;

    // 1. 生成语义化 HTML 结构
    let html = `<table border="${layoutState.border}" cellspacing="${layoutState.cellspacing}" cellpadding="${layoutState.cellpadding}" style="width: 100%; border-collapse: separate; background: #1e293b;">\n`;
    
    // THEAD (头部)
    html += `  <thead>\n    <tr>\n`;
    html += `      <td colspan="2" style="height: ${layoutState.headerHeight}px; background: #3b82f6; color: white; text-align: center; font-weight: bold; font-size: 18px;">\n`;
    html += `        Header (网页头部)\n`;
    html += `      </td>\n    </tr>\n  </thead>\n`;

    // TBODY (主体)
    html += `  <tbody>\n`;
    if (layoutState.twoColumn) {
        // 左右分栏布局
        html += `    <tr style="height: ${layoutState.bodyHeight}px;">\n`;
        html += `      <td style="width: 25%; vertical-align: top; background: #334155; color: white; padding: 20px;">\n`;
        html += `        <h4 style="margin-top:0; color: #94a3b8;">Sidebar</h4>\n`;
        html += `        <div style="font-size: 14px; line-height: 2;">首页<br>产品中心<br>关于我们</div>\n`;
        html += `      </td>\n`;
        html += `      <td style="width: 75%; vertical-align: top; background: #0f172a; color: #cbd5e1; padding: 20px;">\n`;
        html += `        <h3 style="margin-top: 0; color: #38bdf8;">Main Content Area</h3>\n`;
        html += `        <p style="font-size: 14px; line-height: 1.8;">这就是早年的左右分栏布局。开发者不用 float，也不用 flex，只需要在 <code>&lt;tbody&gt;</code> 里加一行，配两个 <code>&lt;td&gt;</code>，一边给宽，另一边自适应即可。</p>\n`;
        html += `      </td>\n    </tr>\n`;
    } else {
        // 全宽布局
        html += `    <tr style="height: ${layoutState.bodyHeight}px;">\n`;
        html += `      <td colspan="2" style="vertical-align: top; background: #0f172a; color: #cbd5e1; padding: 20px;">\n`;
        html += `        <h3 style="margin-top: 0; color: #38bdf8;">Main Content Area</h3>\n`;
        html += `        <p style="font-size: 14px; line-height: 1.8;">当你关闭左侧分栏时，<code>&lt;td colspan="2"&gt;</code> 会让内容区占满整个表格宽度。</p>\n`;
        html += `      </td>\n    </tr>\n`;
    }
    html += `  </tbody>\n`;

    // TFOOT (底部)
    html += `  <tfoot>\n    <tr>\n`;
    html += `      <td colspan="2" style="height: ${layoutState.footerHeight}px; background: #475569; color: white; text-align: center; line-height: ${layoutState.footerHeight}px;">\n`;
    html += `        Footer (网页底部) © 1999-2024\n`;
    html += `      </td>\n    </tr>\n  </tfoot>\n`;

    html += `</table>`;
    wrapper.innerHTML = html;

    // 2. 生成代码并高亮
    let codeStr = `<!-- 早期语义化 Table 布局 -->\n<table border="${layoutState.border}" cellspacing="${layoutState.cellspacing}" cellpadding="${layoutState.cellpadding}">\n`;
    
    codeStr += `  <thead>\n    <tr>\n      <td colspan="2" height="${layoutState.headerHeight}">Header</td>\n    </tr>\n  </thead>\n`;

    codeStr += `  <tbody>\n`;
    if (layoutState.twoColumn) {
        codeStr += `    <tr>\n      <td width="25%" valign="top">Sidebar</td>\n      <td width="75%" valign="top">Main Content</td>\n    </tr>\n`;
    } else {
        codeStr += `    <tr>\n      <td colspan="2" valign="top">Main Content</td>\n    </tr>\n`;
    }
    codeStr += `  </tbody>\n`;

    codeStr += `  <tfoot>\n    <tr>\n      <td colspan="2" height="${layoutState.footerHeight}">Footer</td>\n    </tr>\n  </tfoot>\n`;
    
    codeStr += `</table>`;

    // 使用你现有的 renderCode 函数处理代码高亮
    $('layoutTableCode').innerHTML = renderCode(codeStr);
}

function initLayoutTableSection() {
    // Table 基础属性
    initSlider({ id: 'sliderLayoutBorder', displayId: 'valLayoutBorder', min: 0, max: 10, value: 1, step: 1, onChange: v => { layoutState.border = v; updateLayoutTable(); } });
    initSlider({ id: 'sliderLayoutCellSpacing', displayId: 'valLayoutCellSpacing', min: 0, max: 20, value: 2, step: 1, onChange: v => { layoutState.cellspacing = v; updateLayoutTable(); } });
    initSlider({ id: 'sliderLayoutCellPadding', displayId: 'valLayoutCellPadding', min: 0, max: 40, value: 10, step: 1, onChange: v => { layoutState.cellpadding = v; updateLayoutTable(); } });

    // 语义标签尺寸
    initSlider({ id: 'sliderLayoutHeaderH', displayId: 'valLayoutHeaderH', min: 40, max: 150, value: 80, step: 10, onChange: v => { layoutState.headerHeight = v; updateLayoutTable(); } });
    initSlider({ id: 'sliderLayoutBodyH', displayId: 'valLayoutBodyH', min: 150, max: 400, value: 250, step: 10, onChange: v => { layoutState.bodyHeight = v; updateLayoutTable(); } });
    initSlider({ id: 'sliderLayoutFooterH', displayId: 'valLayoutFooterH', min: 30, max: 100, value: 50, step: 10, onChange: v => { layoutState.footerHeight = v; updateLayoutTable(); } });

    // 左右分栏开关
    bindToggle('toggleLayoutSidebar', active => {
        layoutState.twoColumn = active;
        updateLayoutTable();
    });

    // 初始化渲染
    updateLayoutTable();
}

// ================= 板块4，现代场景：高级表格皮肤切换逻辑 =================

const caseStyles = {
    antd: `/* Ant Design 风格 */
.table-container {
  border-radius: 8px;
  overflow: hidden;
}
th {
  background: #0f172a;
  color: #94a3b8;
  font-weight: 500;
  border-bottom: 1px solid #334155;
}
td { border-bottom: 1px solid #334155; }
tbody tr:nth-child(even) { background-color: #182234; }
tbody tr:hover { background-color: #243147; }`,

    tailwind: `/* Tailwind UI 风格 */
.table-container {
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
}
th {
  background: #1e293b;
  color: #64748b;
  text-transform: uppercase;
  font-size: 12px;
  letter-spacing: 0.05em;
}
td { border-bottom: 1px solid #2d3748; }
tbody tr:hover { background-color: #283548; }`,

    github: `/* GitHub 风格 */
.table-container {
  border: 1px solid #30363d;
  border-radius: 6px;
  background: #0d1117;
}
th {
  background: #161b22;
  color: #c9d1d9;
  font-weight: 600;
  border-bottom: 1px solid #30363d;
}
td { border-bottom: 1px solid #21262d; }
tbody tr:hover { background-color: #161b22; }`,

    stripe: `/* Stripe 仪表盘风格 */
table {
  border-collapse: separate;
  border-spacing: 0 8px;
}
th {
  color: #94a3b8;
  font-size: 12px;
  text-transform: uppercase;
  border-bottom: none;
}
td { background: #1e293b; }
tr td:first-child { border-top-left-radius: 8px; border-bottom-left-radius: 8px; }
tr td:last-child { border-top-right-radius: 8px; border-bottom-right-radius: 8px; }
tbody tr:hover td {
  background-color: #2a3a52;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}`
};

function initCaseTableSection() {
    const wrapper = $('caseTableWrapper');
    if (!wrapper) return;

    document.querySelectorAll('.case-style-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            // 1. 切换按钮高亮
            document.querySelectorAll('.case-style-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // 2. 切换包裹层的类名
            const styleName = btn.dataset.caseStyle;
            wrapper.className = 'case-table-wrapper style-' + styleName;

            // 3. 更新右侧代码区
            const code = caseStyles[styleName];
            $('caseTableCode').innerHTML = renderCode(code);
        });
    });

    // 默认选中 antd 并渲染
    document.querySelector('.case-style-btn[data-case-style="antd"]').click();
}

// 在最终的 initTableModule 中调用
export function initTableModule() {
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
	
    initSectionSwitcher();
    initTableBasicSection();
    initTableStyleSection();
    initCaseTableSection();
    initLayoutTableSection(); 
	
	initChallengeUI('表格');
}