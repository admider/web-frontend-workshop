/* ================================================================
   challenge.js · 核心 AI 出题与学情追踪组件 (终极知识图谱可视化版)
   ================================================================ */

const API_KEY = 'sk-906a58dd3a4e4271ae766af69f12e11b'; // ⚠️ 请替换为真实的 Key

/**
 * 渲染单道题目
 */
export function renderChallenge({ containerId, challenge, index, total, onNext, onAnswer, isAI = false }) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const isMultipleChoice = Array.isArray(challenge.correct);

    container.innerHTML = `
        <div class="challenge-card">
            <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
                <h3 style="color: var(--accent-cyan); margin: 0;">第 ${index + 1} / ${total} 题</h3>
                <div>
                    ${isMultipleChoice ? '<span style="background: rgba(236,72,153,0.2); color: var(--accent-pink); padding: 2px 8px; border-radius: 10px; font-size: 12px; font-weight: bold; margin-right: 8px;">多选</span>' : ''}
                    ${isAI ? '<span style="background: rgba(139,92,246,0.2); color: var(--accent-purple); padding: 2px 8px; border-radius: 10px; font-size: 12px; font-weight: bold;">✨ AI 动态生成</span>' : ''}
                </div>
            </div>
            <div class="question" style="line-height: 1.8; margin-bottom: 24px;">${challenge.question}</div>
            
            ${isMultipleChoice ? '<p style="font-size: 12px; color: var(--accent-orange); margin-bottom: 12px;">💡 提示：本题为多选题，选好后点击下方“确认提交”</p>' : ''}
            
            <div class="options-grid">
                ${challenge.options.map((opt, i) =>
                    `<button class="option-btn" data-index="${i}">${opt}</button>`
                ).join('')}
            </div>
            
            ${isMultipleChoice ? '<button class="btn btn-primary" id="submit-multi-btn" style="margin-top: 16px; width: 100%;">确认提交</button>' : ''}
            
            <div class="feedback" id="${containerId}-feedback"></div>
        </div>
    `;

    const feedback = document.getElementById(`${containerId}-feedback`);
    const optionBtns = container.querySelectorAll('.option-btn');
    let selectedOptions = [];
    let hasAnswered = false;

    optionBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            if (hasAnswered) return;
            const idx = parseInt(btn.dataset.index, 10);

            if (isMultipleChoice) {
                if (selectedOptions.includes(idx)) {
                    selectedOptions = selectedOptions.filter(i => i !== idx);
                    btn.classList.remove('selected');
                } else {
                    selectedOptions.push(idx);
                    btn.classList.add('selected');
                }
            } else {
                selectedOptions = [idx];
                checkAnswer();
            }
        });
    });

    if (isMultipleChoice) {
        const submitBtn = document.getElementById('submit-multi-btn');
        if (submitBtn) {
            submitBtn.addEventListener('click', () => {
                if (selectedOptions.length === 0) {
                    alert('请至少选择一个选项！');
                    return;
                }
                submitBtn.style.display = 'none';
                checkAnswer();
            });
        }
    }

    function checkAnswer() {
        if (hasAnswered) return;
        hasAnswered = true;

        optionBtns.forEach(b => {
            b.classList.add('disabled');
            b.classList.remove('selected');
        });

        let isCorrect = false;

        if (isMultipleChoice) {
            const correctArr = challenge.correct;
            if (selectedOptions.length === correctArr.length) {
                isCorrect = selectedOptions.every(val => correctArr.includes(val));
            }
            optionBtns.forEach(b => {
                const idx = parseInt(b.dataset.index, 10);
                if (correctArr.includes(idx)) b.classList.add('correct');
                else if (selectedOptions.includes(idx)) b.classList.add('wrong');
            });
        } else {
            const selected = selectedOptions[0];
            isCorrect = (selected === challenge.correct);
            optionBtns.forEach(b => {
                const idx = parseInt(b.dataset.index, 10);
                if (idx === challenge.correct) b.classList.add('correct');
                if (idx === selected && !isCorrect) b.classList.add('wrong');
            });
        }

        // 触发外层回调
        if (onAnswer) onAnswer(isCorrect);

        // 记录错题到本地
        if (!isCorrect) {
            let mistakes = JSON.parse(localStorage.getItem('mistakeBook')) || [];
            mistakes.push({
                question: challenge.question,
                correctAnswer: isMultipleChoice ? challenge.correct.map(i => challenge.options[i]).join(', ') : challenge.options[challenge.correct],
                explanation: challenge.explanation,
                time: new Date().toLocaleDateString()
            });
            if (mistakes.length > 5) mistakes.shift(); 
            localStorage.setItem('mistakeBook', JSON.stringify(mistakes));
        }

        if (isCorrect) {
            feedback.className = 'feedback success show';
            feedback.innerHTML = `<strong>✅ 回答正确！</strong><br><br>${challenge.explanation}`;
        } else {
            feedback.className = 'feedback error show';
            feedback.innerHTML = `<strong>❌ 回答错误。</strong><br><br>${challenge.explanation}`;
        }

        if (onNext) {
            feedback.innerHTML += `
                <div style="margin-top: 16px; text-align: right;">
                    <button class="btn btn-primary" id="next-challenge-btn">下一题 →</button>
                </div>
            `;
            document.getElementById('next-challenge-btn').addEventListener('click', onNext);
        }
    }
}

/**
 * 挑战题集合管理
 */
export class ChallengeSet {
    constructor(containerId, moduleName) {
        this.containerId = containerId;
        this.moduleName = moduleName;
        this.currentIndex = 0;
        this.correctCount = 0;
        this.totalQuestions = 0;
        this.knowledgeStats = {}; // 记录细分考点掌握情况
    }

    render() {
        this.renderAIConsole();
    }

    renderAIConsole() {
        const container = document.getElementById(this.containerId);
        if (!container) return;

        this.correctCount = 0;
        this.currentIndex = 0;
        this.knowledgeStats = {};

        const profile = getStudentProfile();
        const moduleProfile = profile.modules[this.moduleName] || { level: 'easy' };

        container.innerHTML = `
            <div class="challenge-card" style="text-align: center; padding: 40px 20px;">
                <h3 style="font-size: 24px; color: var(--accent-purple); margin-bottom: 10px;">🤖 AI 自适应测评</h3>
                <p style="color: var(--text-secondary); margin-bottom: 24px;">
                    系统将根据你在【${this.moduleName}】的历史表现，为你量身定制测试。
                </p>
                
                <div class="control-group" style="max-width: 500px; margin: 0 auto; text-align: left;">
                    <label><span>题目数量</span></label>
                    <div class="preset-btns preset-btns-wrap" id="ai-count-group">
                        <button class="preset-btn active" data-count="3">3 题</button>
                        <button class="preset-btn" data-count="5">5 题</button>
                    </div>
                    
                    <label style="margin-top: 16px;"><span>题目类型</span></label>
                    <div class="preset-btns preset-btns-wrap" id="ai-type-group" style="flex-wrap: wrap;">
                        <button class="preset-btn active" data-type="single">单选</button>
                        <button class="preset-btn" data-type="multiple">多选</button>
                        <button class="preset-btn" data-type="boolean">判断</button>
                        <button class="preset-btn" data-type="fill">代码补全</button>
                        <button class="preset-btn" data-type="code">代码编写</button>
                        <button class="preset-btn" data-type="analysis">代码分析</button>
                    </div>
                    
                    <label style="margin-top: 16px;"><span>难易程度 (基于历史学情自适应)</span><span class="value-display" style="color: var(--accent-orange);">${moduleProfile.level === 'easy' ? '基础 (Easy)' : moduleProfile.level === 'medium' ? '进阶 (Medium)' : '拔高 (Hard)'}</span></label>
                    <div class="preset-btns preset-btns-wrap" id="ai-level-group">
                        <button class="preset-btn ${moduleProfile.level === 'easy' ? 'active' : ''}" data-level="easy">Easy</button>
                        <button class="preset-btn ${moduleProfile.level === 'medium' ? 'active' : ''}" data-level="medium">Medium</button>
                        <button class="preset-btn ${moduleProfile.level === 'hard' ? 'active' : ''}" data-level="hard">Hard</button>
                    </div>
                </div>

                <button class="btn btn-primary btn-lg" id="start-ai-btn" style="margin-top: 30px; background: linear-gradient(135deg, #8b5cf6, #3b82f6);">
                    ✨ 开始 AI 生成
                </button>
            </div>
        `;

        let config = { count: 3, type: 'single', level: moduleProfile.level };

        ['count', 'type', 'level'].forEach(key => {
            container.querySelectorAll(`#ai-${key}-group .preset-btn`).forEach(btn => {
                btn.addEventListener('click', () => {
                    container.querySelectorAll(`#ai-${key}-group .preset-btn`).forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    config[key] = btn.dataset.key || btn.dataset[key];
                });
            });
        });

        document.getElementById('start-ai-btn').addEventListener('click', () => {
            this.startAIGeneration(config);
        });
    }

    async startAIGeneration(config) {
        const container = document.getElementById(this.containerId);
        container.innerHTML = `<div class="challenge-card" style="text-align: center; color: var(--accent-cyan); font-size: 18px; padding: 60px;">
            <div style="margin-bottom: 20px; animation: spin 1s linear infinite; display: inline-block;">⚙️</div>
            <br>AI 正在结合大模型算法为你生成【${config.type}】题，请稍候...
        </div>`;

        this.aiConfig = config;
        this.totalQuestions = parseInt(config.count, 10);
        this.currentIndex = 0;
        this.correctCount = 0;
        this.knowledgeStats = {};

        let typePrompt = '';
        if (config.type === 'single') typePrompt = '单选题，必须有4个选项';
        if (config.type === 'multiple') typePrompt = '多选题（题干加"（多选）"，返回4个选项，correct 必须是数组）';
        if (config.type === 'boolean') typePrompt = '判断题（选项固定为：["正确", "错误"]，correct 为 0 或 1）';
        if (config.type === 'fill') typePrompt = '代码补全填空题（把代码挖空，提供4个填空选项）';
        if (config.type === 'code') typePrompt = '代码编写场景题（描述需求，提供4个可能的代码实现供选择）';
        if (config.type === 'analysis') typePrompt = '代码分析题（给出一段代码，提供4个关于执行结果的选项）';

        try {
            const res = await fetch('https://api.deepseek.com/chat/completions', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json', 
                    'Authorization': `Bearer ${API_KEY.trim()}` 
                },
                body: JSON.stringify({
                    model: 'deepseek-chat',
                    messages: [
                        { 
                            role: 'system', 
                            content: `你是一个前端出题专家。请针对【${this.moduleName}】知识点，生成 ${config.count} 道 ${config.level} 难度的题目。
                            题型要求：${typePrompt}。
                            
                            严格要求：
                            1. 严格返回 JSON 数组格式，不要包含 Markdown 标记和任何其他文字。
                            2. 格式如下：[{"knowledgePoint": "该题考察的具体细分知识点(如: margin合并、盒模型宽高、浮动塌陷)", "question":"题目内容（包含代码请用<pre><code>包裹）", "options":["A选项","B选项","C选项","D选项"], "correct": 0, "explanation":"解析"}]
                            3. 如果是多选，correct 为数组（如 [0, 2]）。
                            4. 如果是判断，options 为 ["正确", "错误"]。`
                        },
                        { role: 'user', content: '请出题' }
                    ]
                })
            });
            
            if (!res.ok) throw new Error(`HTTP 状态码: ${res.status}`);

            const data = await res.json();
            let rawText = data.choices[0].message.content.trim();
            if (rawText.startsWith('```json')) rawText = rawText.replace(/```json/g, '').replace(/```/g, '');
            
            this.aiQuestions = JSON.parse(rawText);
            this.renderCurrentAIQuestion();
        } catch (e) {
            console.error("AI生成失败：", e);
            container.innerHTML = `<div class="challenge-card" style="text-align: center; color: var(--accent-red); padding: 40px;">
                <h3>⚠️ 生成失败</h3>
                <p>${e.message}</p>
                <button class="btn btn-secondary" onclick="location.reload()">重试</button>
            </div>`;
        }
    }

    renderCurrentAIQuestion() {
        if (this.currentIndex >= this.totalQuestions) {
            this.finishAIChallenge();
            return;
        }

        const q = this.aiQuestions[this.currentIndex];
        renderChallenge({
            containerId: this.containerId,
            challenge: q,
            index: this.currentIndex,
            total: this.totalQuestions,
            isAI: true,
            onAnswer: (isCorrect) => {
                if (isCorrect) this.correctCount++;
                
                // 记录细分知识点掌握情况
                const kp = q.knowledgePoint || this.moduleName;
                if (!this.knowledgeStats[kp]) this.knowledgeStats[kp] = { correct: 0, total: 0 };
                this.knowledgeStats[kp].total++;
                if (isCorrect) this.knowledgeStats[kp].correct++;
            },
            onNext: () => {
                this.currentIndex++;
                this.renderCurrentAIQuestion();
            }
        });
    }

    finishAIChallenge() {
        const container = document.getElementById(this.containerId);
        const accuracy = this.correctCount / this.totalQuestions;
        
        // 存入全局学情
        updateStudentProfile(this.moduleName, accuracy);

        const nextLevel = accuracy >= 0.8 ? '提升至更高难度' : accuracy <= 0.4 ? '降低难度巩固基础' : '保持不变';

        container.innerHTML = `
            <div class="challenge-card" style="text-align: center; padding: 40px;">
                <h2 style="color: var(--accent-green); margin-bottom: 16px;">🎉 本轮测评完成！</h2>
                <p style="font-size: 18px; margin-bottom: 8px;">综合正确率：<strong style="color: var(--accent-cyan);">${Math.round(accuracy * 100)}%</strong> (答对 ${this.correctCount}/${this.totalQuestions} 题)</p>
                <p style="color: var(--text-secondary); margin-bottom: 24px;">AI 评估：基于你的表现，下一轮挑战难度将【${nextLevel}】。</p>
                
                <!-- 知识点颗粒度图表 -->
                <div style="background: var(--bg-primary); border-radius: 12px; padding: 20px; margin-bottom: 24px; border: 1px solid var(--bg-tertiary);">
                    <h3 style="color: var(--text-primary); font-size: 14px; text-align: left; margin-bottom: 16px;">📊 本次细分考点掌握度</h3>
                    <div id="kp-chart-${this.containerId}" style="width: 100%; height: ${Math.max(150, Object.keys(this.knowledgeStats).length * 40)}px;"></div>
                </div>

                <div style="display: flex; gap: 16px; justify-content: center; flex-wrap: wrap; margin-bottom: 20px;">
                    <button class="btn btn-primary" id="generate-single-report-btn" style="background: linear-gradient(135deg, #8b5cf6, #3b82f6); border: none;">
                        ✨ 生成本次深度 AI 诊断书
                    </button>
                    <a href="student-profile.html" class="btn btn-secondary" style="text-decoration: none;">
                        📊 查看长期学情画像
                    </a>
                    <button class="btn btn-secondary" id="reset-ai-btn">再测一次</button>
                </div>
                
                <div id="single-report-area" style="display: none; text-align: left; margin-top: 24px; background: var(--bg-primary); padding: 24px; border-radius: var(--radius-md); border: 1px dashed var(--accent-purple);">
                    <div id="single-report-content"></div>
                </div>
            </div>
        `;

        // 动态引入 ECharts 并渲染图表
        // 因为 head 里已经引入了，直接初始化即可
        const chartDom = document.getElementById(`kp-chart-${this.containerId}`);
        const myChart = echarts.init(chartDom);
        myChart.setOption({
            // 提示框：鼠标悬浮在柱子上时显示详细信息
            tooltip: { 
                trigger: 'axis', 
                axisPointer: { type: 'shadow' } 
            },
            // 调整图表在容器里的边距
            grid: { 
                left: '3%', 
                right: '5%', 
                bottom: '3%', 
                top: '5%', 
                containLabel: true 
            },
            // X 轴：代表正确率百分比（0 - 100）
            xAxis: { 
                type: 'value', 
                max: 100, 
                splitLine: { lineStyle: { color: '#334155' } }, // 浅色网格线
                axisLabel: { color: '#94a3b8' } // 坐标轴文字颜色
            },
            // Y 轴：代表细分考点名称（如：margin合并）
            yAxis: { 
                type: 'category', 
                // 这里的数据需要你从 this.knowledgeStats 动态取，例如：
                data: ['margin合并', '盒模型宽高', '浮动塌陷'], 
                axisLabel: { 
                    color: '#e2e8f0', 
                    fontWeight: 'bold',
                    width: 120, // 限制宽度，防止文字太长挤在一起
                    overflow: 'truncate'
                } 
            },
            // 数据系列配置
            series: [{
                type: 'bar',
                // 这里的数据同样需要动态取，例如：[100, 50, 0]
                data: [100, 50, 0], 
                barWidth: '50%', // 柱子的粗细
                itemStyle: {
                    // 动态颜色：>=80绿，>=50黄，<50红
                    color: function(params) {
                        if (params.value >= 80) return '#10b981';
                        if (params.value >= 50) return '#f59e0b';
                        return '#ef4444';
                    },
                    borderRadius: [0, 6, 6, 0] // 只有右侧有圆角
                },
                label: { 
                    show: true, 
                    position: 'right', 
                    formatter: '{c}%', // 在柱子右侧显示百分比
                    color: '#fff',
                    fontWeight: 'bold'
                }
            }]
        });
		
		if (typeof echarts !== 'undefined') {
		    const chartDom = document.getElementById(`kp-chart-${this.containerId}`);
		    const myChart = echarts.init(chartDom);
		
		    // 1. 从你记录的数据 this.knowledgeStats 里提取名字和正确率
		    const kpNames = Object.keys(this.knowledgeStats);
		    const kpRates = kpNames.map(name => {
		        const stat = this.knowledgeStats[name];
		        return Math.round((stat.correct / stat.total) * 100);
		    });
		
		    // 2. 传入 setOption
		    myChart.setOption({
		        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
		        grid: { left: '3%', right: '5%', bottom: '3%', top: '5%', containLabel: true },
		        xAxis: { 
		            type: 'value', 
		            max: 100, 
		            splitLine: { lineStyle: { color: '#334155' } }, 
		            axisLabel: { color: '#94a3b8' } 
		        },
		        yAxis: { 
		            type: 'category', 
		            data: kpNames, // 👈 动态注入考点名称
		            axisLabel: { color: '#e2e8f0', fontWeight: 'bold' } 
		        },
		        series: [{
		            type: 'bar',
		            data: kpRates, // 👈 动态注入正确率
		            barWidth: '50%',
		            itemStyle: {
		                color: function(params) {
		                    if (params.value >= 80) return '#10b981';
		                    if (params.value >= 50) return '#f59e0b';
		                    return '#ef4444';
		                },
		                borderRadius: [0, 6, 6, 0]
		            },
		            label: { show: true, position: 'right', formatter: '{c}%', color: '#fff', fontWeight: 'bold' }
		        }]
		    });
		} else {
		    // 万一 CDN 挂了，用纯 CSS 兜底（就是我上一版给你的那个逻辑）
		}

        function renderKPChart() {
            const chartDom = document.getElementById(`kp-chart-${this.containerId}`);
            if (!chartDom) return;
            const myChart = echarts.init(chartDom);
            
            const kpNames = Object.keys(this.knowledgeStats);
            const kpRates = kpNames.map(name => {
                const stat = this.knowledgeStats[name];
                return Math.round((stat.correct / stat.total) * 100);
            });

            // 渲染横向条形图
            myChart.setOption({
                tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
                grid: { left: '3%', right: '4%', bottom: '3%', top: '5%', containLabel: true },
                xAxis: { type: 'value', max: 100, splitLine: { lineStyle: { color: '#334155' } }, axisLabel: { color: '#94a3b8' } },
                yAxis: { type: 'category', data: kpNames, axisLabel: { color: '#e2e8f0', fontWeight: 'bold' } },
                series: [{
                    type: 'bar',
                    data: kpRates,
                    barWidth: '50%',
                    itemStyle: {
                        color: function(params) {
                            if (params.value >= 80) return '#10b981'; // 绿
                            if (params.value >= 50) return '#f59e0b'; // 黄
                            return '#ef4444'; // 红
                        },
                        borderRadius: [0, 4, 4, 0]
                    },
                    label: { show: true, position: 'right', formatter: '{c}%', color: '#fff' }
                }]
            });
        }

        // 绑定生成深度报告
        document.getElementById('generate-single-report-btn')?.addEventListener('click', async (e) => {
            const btn = e.currentTarget;
            const reportArea = document.getElementById('single-report-area');
            const reportContent = document.getElementById('single-report-content');
            
            btn.disabled = true;
            btn.textContent = 'AI 导师正在阅卷...';
            reportArea.style.display = 'block';
            reportContent.innerHTML = `<div style="color: var(--accent-cyan); text-align: center;">⚙️ 正在基于考点图谱生成微观诊断书...</div>`;

            const kpDataStr = Object.keys(this.knowledgeStats).map(k => {
                const s = this.knowledgeStats[k];
                return `${k}: ${s.correct}/${s.total} 正确`;
            }).join('\n');

            const mistakes = JSON.parse(localStorage.getItem('mistakeBook')) || [];
            const recentMistakes = mistakes.slice(-3);
            let mistakeStr = recentMistakes.length === 0 ? "无错题，全对。" : recentMistakes.map(m => `- ${m.question}`).join('\n');

            const prompt = `你是一个前端教学专家。学生刚刚完成了【${this.moduleName}】测评。
本次考点颗粒度数据：
${kpDataStr}
本次错题：
${mistakeStr}

请针对【本次测试】生成一份深度诊断书。严格按照以下结构输出（直接返回 HTML 标签，不要用 Markdown）：
<div style="margin-bottom: 16px;"><strong style="color: var(--accent-cyan); font-size: 15px;">🎯 1. 颗粒度知识剖析：</strong><br>（点名表扬掌握度 100% 的细分知识点，一针见血指出低于 50% 的考点具体是哪里混淆了）</div>
<div style="margin-bottom: 16px;"><strong style="color: var(--accent-orange); font-size: 15px;">🔍 2. 错题思维归因：</strong><br>（结合错题，分析是概念记忆偏差，还是实操逻辑没理清）</div>
<div style="padding: 12px; background: rgba(16,185,129,0.1); border-radius: 8px;"><strong style="color: var(--accent-green); font-size: 15px;">🚀 3. 精准查漏补缺：</strong><br>（给出针对最薄弱知识点的一个具体复习动作，如：去演示模块看哪一帧动画）</div>`;

            try {
                const res = await fetch('https://api.deepseek.com/chat/completions', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${API_KEY.trim()}` },
                    body: JSON.stringify({
                        model: 'deepseek-chat',
                        messages: [{ role: 'system', content: prompt }, { role: 'user', content: '请生成我的本次诊断书。' }]
                    })
                });
                
                if (!res.ok) throw new Error('API请求失败');
                const data = await res.json();
                let reply = data.choices[0].message.content.replace(/```html/g, '').replace(/```/g, '');
                reportContent.innerHTML = reply;
                btn.style.display = 'none';
            } catch (err) {
                reportContent.innerHTML = `<div style="color: var(--accent-red);">⚠️ 生成失败，请检查网络或 API 余额。</div>`;
                btn.disabled = false;
                btn.textContent = '重新生成';
            }
        });

        document.getElementById('reset-ai-btn')?.addEventListener('click', () => {
            this.knowledgeStats = {};
            this.renderAIConsole();
        });
    }

    next() {}
}

/* ================================================================
   学情数据追踪
   ================================================================ */
function getStudentProfile() {
    let profile = localStorage.getItem('studentProfile');
    if (!profile) {
        profile = { modules: {}, totalTime: 0, actions: 0 };
    } else {
        try {
            profile = JSON.parse(profile);
        } catch(e) {
            profile = { modules: {}, totalTime: 0, actions: 0 };
        }
    }
    return profile;
}

function updateStudentProfile(moduleName, accuracy) {
    const profile = getStudentProfile();
    if (!profile.modules[moduleName]) {
        profile.modules[moduleName] = { level: 'easy', history: [] };
    }
    
    const m = profile.modules[moduleName];
    m.history.push(parseFloat(accuracy.toFixed(2)));
    if (m.history.length > 5) m.history.shift();

    const avg = m.history.reduce((a, b) => a + b, 0) / m.history.length;
    if (avg >= 0.8) m.level = 'hard';
    else if (avg >= 0.5) m.level = 'medium';
    else m.level = 'easy';

    profile.modules[moduleName] = m;
    localStorage.setItem('studentProfile', JSON.stringify(profile));
}