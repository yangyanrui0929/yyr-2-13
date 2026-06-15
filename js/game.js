// ?????????????????????????
class UndergroundRadioGame {
    constructor() {
        this.gameState = null;
        this.init();
    }

    init() {
        this.loadGame();
        this.setupEventListeners();
        this.renderAll();
    }

    getDefaultState() {
        return {
            day: 1,
            status: {
                power: 100,
                noise: 0,
                rumor: 0,
                fatigue: 0,
                morale: 50
            },
            thresholds: {
                power: 20,
                noise: 70,
                rumor: 70,
                fatigue: 70,
                morale: 30
            },
            resources: {
                food: 20,
                battery: 10,
                parts: 5,
                medicine: 3
            },
            survivors: this.generateSurvivors(),
            equipment: JSON.parse(JSON.stringify(GameData.equipmentList)),
            districts: JSON.parse(JSON.stringify(GameData.districts)),
            schedule: {
                morning: null,
                afternoon: null,
                evening: null
            },
            selectedBroadcast: null,
            currentQuestion: null,
            answeredQuestions: [],
            rumors: [],
            settlementHistory: [],
            todayActions: {
                broadcastDone: false,
                qaDone: 0,
                repairDone: [],
                rumorSuppressDone: []
            },
            editingDesk: {
                materialFilter: 'all',
                timeline: [],
                generatedProgram: null,
                dailyPrograms: [],
                unlockedMaterials: GameData.materials.filter(m => m.unlocked).map(m => m.id)
            },
            gameOver: false
        };
    }

    generateSurvivors() {
        const survivors = [];
        const count = 4 + Math.floor(Math.random() * 3);
        const shuffledNames = [...GameData.survivorNames].sort(() => Math.random() - 0.5);
        
        for (let i = 0; i < count; i++) {
            survivors.push({
                id: 'survivor_' + i,
                name: shuffledNames[i],
                skill: GameData.survivorSkills[Math.floor(Math.random() * GameData.survivorSkills.length)],
                fatigue: Math.floor(Math.random() * 20),
                health: 80 + Math.floor(Math.random() * 20),
                task: null
            });
        }
        return survivors;
    }

    generateRumor() {
        const rumorTemplates = [
            { title: '水源污染谣言', desc: '有人说自来水厂被污染了，不能喝水。', severity: 15 },
            { title: '怪物出没传闻', desc: '传言夜间有怪物在街道游荡。', severity: 20 },
            { title: '食物短缺恐慌', desc: '据说储备物资只够维持一周了。', severity: 18 },
            { title: '政府阴谋论', desc: '有人说这一切都是政府的阴谋。', severity: 12 },
            { title: '传染病扩散', desc: '听说新的传染病正在蔓延。', severity: 22 },
            { title: '救援队骗局', desc: '传言救援队根本不存在。', severity: 15 },
            { title: '核泄漏消息', desc: '据说远处的核电站发生了泄漏。', severity: 25 },
            { title: '暴动计划', desc: '有人在策划抢夺物资的暴动。', severity: 20 }
        ];
        
        const template = rumorTemplates[Math.floor(Math.random() * rumorTemplates.length)];
        return {
            id: 'rumor_' + Date.now() + '_' + Math.random(),
            ...template,
            dayStarted: this.gameState.day
        };
    }

    saveGame() {
        localStorage.setItem('undergroundRadioSave', JSON.stringify(this.gameState));
        this.showEvent('游戏已保存', '你的游戏进度已保存到本地存储。', []);
    }

    loadGame() {
        const saved = localStorage.getItem('undergroundRadioSave');
        if (saved) {
            try {
                this.gameState = JSON.parse(saved);
                if (!this.gameState.editingDesk) {
                    this.gameState.editingDesk = {
                        materialFilter: 'all',
                        timeline: [],
                        generatedProgram: null,
                        dailyPrograms: [],
                        unlockedMaterials: GameData.materials.filter(m => m.unlocked).map(m => m.id)
                };
            }
                this.showEvent('读取存档', '成功读取游戏存档！', []);
            } catch (e) {
                this.gameState = this.getDefaultState();
            }
        } else {
            this.gameState = this.getDefaultState();
            this.generateDailyRumors();
        }
    }

    resetGame() {
        if (confirm('确定要重新开始吗？所有进度将会丢失。')) {
            localStorage.removeItem('undergroundRadioSave');
            this.gameState = this.getDefaultState();
            this.generateDailyRumors();
            this.renderAll();
            this.showEvent('新游戏开始', '欢迎来到地下广播站！你的任务是维持广播运营，安抚民心，管理物资和幸存者。试试新的剪辑台功能吧！', []);
        }
    }

    setupEventListeners() {
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });

        document.getElementById('endDayBtn').addEventListener('click', () => this.endDay());
        document.getElementById('saveBtn').addEventListener('click', () => this.saveGame());
        document.getElementById('loadBtn').addEventListener('click', () => { this.loadGame(); this.renderAll(); });
        document.getElementById('resetBtn').addEventListener('click', () => this.resetGame());

        document.getElementById('doBroadcastBtn').addEventListener('click', () => this.doBroadcast());
        document.getElementById('doRepairBtn').addEventListener('click', () => this.doRepair());
        document.getElementById('suppressRumorBtn').addEventListener('click', () => this.suppressRumor());

        ['power', 'noise', 'rumor', 'fatigue', 'morale'].forEach(stat => {
            const slider = document.getElementById(stat + 'ThresholdSlider');
            const valSpan = document.getElementById(stat + 'ThresholdVal');
            slider.addEventListener('input', (e) => {
                this.gameState.thresholds[stat] = parseInt(e.target.value);
                valSpan.textContent = e.target.value;
                this.renderStatus();
            });
        });

        document.getElementById('modalCloseBtn').addEventListener('click', () => this.closeModal());

        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.filterMaterials(e.target.dataset.filter));
        });

        document.getElementById('clearTimelineBtn').addEventListener('click', () => this.clearTimeline());
        document.getElementById('generateProgramBtn').addEventListener('click', () => this.generateProgram());
        document.getElementById('scheduleProgramBtn').addEventListener('click', () => this.scheduleProgram());

        const timelineTrack = document.getElementById('timelineTrack');
        timelineTrack.addEventListener('dragover', (e) => this.handleTimelineDragOver(e));
        timelineTrack.addEventListener('dragleave', (e) => this.handleTimelineDragLeave(e));
        timelineTrack.addEventListener('drop', (e) => this.handleTimelineDrop(e));
    }

    switchTab(tabName) {
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));
        
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        document.getElementById(tabName).classList.add('active');

        if (tabName === 'qa' && !this.gameState.currentQuestion) {
            this.generateQuestion();
        }
    }

    renderAll() {
        this.renderStatus();
        this.renderResources();
        this.renderSurvivors();
        this.renderDistrictTrust();
        this.renderSchedule();
        this.renderEditingDesk();
        this.renderBroadcasts();
        this.renderEquipment();
        this.renderRumors();
        this.renderSettlements();
        this.renderThresholds();
    }

    renderStatus() {
        const { status, thresholds } = this.gameState;
        
        ['power', 'noise', 'rumor', 'fatigue', 'morale'].forEach(stat => {
            const value = Math.max(0, Math.min(100, status[stat]));
            const fill = document.getElementById(stat + 'Fill');
            const val = document.getElementById(stat + 'Value');
            const thresholdDisplay = document.getElementById(stat + 'Threshold');
            
            fill.style.width = value + '%';
            val.textContent = Math.round(value);
            
            const isWarning = (stat === 'power' || stat === 'morale') 
                ? value <= thresholds[stat] 
                : value >= thresholds[stat];
            
            fill.classList.toggle('warning', isWarning);
            thresholdDisplay.textContent = thresholds[stat];
            
            const slider = document.getElementById(stat + 'ThresholdSlider');
            const valSpan = document.getElementById(stat + 'ThresholdVal');
            if (slider) slider.value = thresholds[stat];
            if (valSpan) valSpan.textContent = thresholds[stat];
        });

        document.getElementById('dayCount').textContent = this.gameState.day;
    }

    renderThresholds() {
        Object.keys(this.gameState.thresholds).forEach(stat => {
            document.getElementById(stat + 'Threshold').textContent = this.gameState.thresholds[stat];
        });
    }

    renderResources() {
        const { resources } = this.gameState;
        document.getElementById('foodCount').textContent = resources.food;
        document.getElementById('batteryCount').textContent = resources.battery;
        document.getElementById('partsCount').textContent = resources.parts;
        document.getElementById('medicineCount').textContent = resources.medicine;
    }

    renderSurvivors() {
        const container = document.getElementById('survivorList');
        const repairSelect = document.getElementById('repairSurvivor');
        
        container.innerHTML = '';
        repairSelect.innerHTML = '';

        this.gameState.survivors.forEach(survivor => {
            const card = document.createElement('div');
            card.className = 'survivor-card';
            if (survivor.fatigue >= 70) card.classList.add('exhausted');
            else if (survivor.fatigue >= 40) card.classList.add('tired');

            card.innerHTML = `
                <div class="survivor-name">${survivor.name} <small style="color:#888">[${survivor.skill}]</small></div>
                <div class="survivor-stats">
                    <span>❤️ ${survivor.health}%</span>
                    <span>😴 ${survivor.fatigue}%</span>
                </div>
                ${survivor.task ? `<div class="survivor-task">${survivor.task}</div>` : ''}
            `;
            container.appendChild(card);

            if (!survivor.task) {
                const option = document.createElement('option');
                option.value = survivor.id;
                option.textContent = `${survivor.name} (${survivor.skill})`;
                repairSelect.appendChild(option);
            }
        });
    }

    renderDistrictTrust() {
        const container = document.getElementById('districtTrust');
        container.innerHTML = '';

        this.gameState.districts.forEach(district => {
            const item = document.createElement('div');
            item.className = 'district-item';
            item.innerHTML = `
                <div class="district-name">
                    <span>${district.name}</span>
                    <span style="color:#3498db">${district.trust}%</span>
                </div>
                <div class="district-bar">
                    <div class="district-bar-fill" style="width:${district.trust}%"></div>
                </div>
            `;
            container.appendChild(item);
        });
    }

    renderSchedule() {
        ['morning', 'afternoon', 'evening'].forEach(slot => {
            const optionsContainer = document.getElementById(slot + 'Options');
            const slotDisplay = document.getElementById('slot' + slot.charAt(0).toUpperCase() + slot.slice(1));
            
            optionsContainer.innerHTML = '';
            
            GameData.programTypes.forEach(program => {
                const btn = document.createElement('button');
                btn.className = 'program-btn';
                if (this.gameState.schedule[slot] === program.id) {
                    btn.classList.add('selected');
                }
                
                const effectsText = Object.entries(program.effects)
                    .map(([k, v]) => `${this.getStatName(k)} ${v > 0 ? '+' : ''}${v}`)
                    .join(', ');
                
                btn.innerHTML = `
                    <div>${program.name}</div>
                    <div class="program-effects">${effectsText} | ⚡${program.power}</div>
                `;
                
                btn.addEventListener('click', () => this.selectProgram(slot, program.id));
                optionsContainer.appendChild(btn);
            });

            const current = this.gameState.schedule[slot];
            if (current) {
                if (current === 'editing_program') {
                    const editingProgram = this.gameState.editingDesk.dailyPrograms.find(p => p.scheduledSlot === slot);
                    if (editingProgram) {
                        const ratingInfo = GameData.ratingNames[editingProgram.scores.rating];
                        slotDisplay.textContent = `🎬 ${editingProgram.name} (${ratingInfo.name})`;
                        slotDisplay.style.color = ratingInfo.color;
                    } else {
                        slotDisplay.textContent = '🎬 剪辑节目';
                    }
                } else {
                    const program = GameData.programTypes.find(p => p.id === current);
                    slotDisplay.textContent = program ? program.name : '未安排';
                    slotDisplay.style.color = '';
                }
            } else {
                slotDisplay.textContent = '未安排';
                slotDisplay.style.color = '';
            }
        });
    }

    renderBroadcasts() {
        const container = document.getElementById('broadcastList');
        container.innerHTML = '';

        GameData.broadcastMessages.forEach(msg => {
            const item = document.createElement('div');
            item.className = 'broadcast-item';
            if (this.gameState.selectedBroadcast === msg.id) {
                item.classList.add('selected');
            }
            
            item.innerHTML = `
                <div class="broadcast-title">${msg.title}</div>
                <div class="broadcast-desc">${msg.content}</div>
            `;
            
            item.addEventListener('click', () => this.selectBroadcast(msg.id));
            container.appendChild(item);
        });

        document.getElementById('doBroadcastBtn').disabled = 
            !this.gameState.selectedBroadcast || this.gameState.todayActions.broadcastDone;
    }

    renderEquipment() {
        const container = document.getElementById('equipmentList');
        const select = document.getElementById('repairEquipment');
        
        container.innerHTML = '';
        select.innerHTML = '';

        this.gameState.equipment.forEach(eq => {
            const item = document.createElement('div');
            item.className = 'equipment-item';
            
            let conditionClass = 'condition-good';
            if (eq.condition <= 30) conditionClass = 'condition-bad';
            else if (eq.condition <= 60) conditionClass = 'condition-warn';

            let barColor = '#2ecc71';
            if (eq.condition <= 30) barColor = '#e74c3c';
            else if (eq.condition <= 60) barColor = '#f39c12';

            item.innerHTML = `
                <div class="equipment-header">
                    <span class="equipment-name">${eq.name}</span>
                    <span class="equipment-condition ${conditionClass}">${eq.condition}%</span>
                </div>
                <div class="equipment-bar">
                    <div class="equipment-bar-fill" style="width:${eq.condition}%; background:${barColor}"></div>
                </div>
                <div style="font-size:11px; color:#888; margin-top:5px">
                    影响: ${eq.effect} | 维修: 🔧${eq.repairCost}零件 | 修复: +${25}%
                </div>
            `;
            container.appendChild(item);

            if (eq.condition < 100 && !this.gameState.todayActions.repairDone.includes(eq.id)) {
                const option = document.createElement('option');
                option.value = eq.id;
                option.textContent = `${eq.name} (${eq.condition}%)`;
                select.appendChild(option);
            }
        });
    }

    renderRumors() {
        const container = document.getElementById('rumorList');
        const select = document.getElementById('rumorToSuppress');
        
        container.innerHTML = '';
        select.innerHTML = '';

        if (this.gameState.rumors.length === 0) {
            container.innerHTML = '<p style="color:#888; text-align:center; padding:20px">暂无活跃谣言</p>';
            return;
        }

        this.gameState.rumors.forEach(rumor => {
            const item = document.createElement('div');
            item.className = 'rumor-item';
            item.innerHTML = `
                <div class="rumor-title">${rumor.title}</div>
                <div class="rumor-desc">${rumor.desc}</div>
                <div class="rumor-severity">
                    <span>严重程度</span>
                    <div class="rumor-severity-bar">
                        <div class="rumor-severity-fill" style="width:${rumor.severity}%"></div>
                    </div>
                    <span>${rumor.severity}%</span>
                </div>
            `;
            container.appendChild(item);

            if (!this.gameState.todayActions.rumorSuppressDone.includes(rumor.id)) {
                const option = document.createElement('option');
                option.value = rumor.id;
                option.textContent = `${rumor.title} (${rumor.severity}%)`;
                select.appendChild(option);
            }
        });

        document.getElementById('suppressRumorBtn').disabled = select.options.length === 0;
    }

    renderSettlements() {
        const container = document.getElementById('settlementList');
        container.innerHTML = '';

        if (this.gameState.settlementHistory.length === 0) {
            container.innerHTML = '<p style="color:#888; text-align:center; padding:40px">暂无结算记录</p>';
            return;
        }

        this.gameState.settlementHistory.slice().reverse().forEach(settlement => {
            const item = document.createElement('div');
            item.className = 'settlement-item';
            
            let statsHtml = '';
            Object.entries(settlement.effects).forEach(([stat, value]) => {
                if (value !== 0) {
                    const className = value > 0 ? 'positive' : 'negative';
                    const sign = value > 0 ? '+' : '';
                    statsHtml += `<div class="settlement-stat ${className}"><span>${this.getStatName(stat)}</span><span>${sign}${value}</span></div>`;
                }
            });

            item.innerHTML = `
                <div class="settlement-header">
                    <span>第 ${settlement.day} 天结算</span>
                    <span style="font-size:12px; color:#888">${settlement.summary}</span>
                </div>
                <div class="settlement-stats">${statsHtml}</div>
            `;
            container.appendChild(item);
        });
    }

    renderQuestion() {
        const question = this.gameState.currentQuestion;
        const questionText = document.getElementById('questionText');
        const optionsContainer = document.getElementById('answerOptions');
        const historyContainer = document.getElementById('historyList');

        if (!question) {
            questionText.textContent = '今日问答次数已用完，请明日再来。';
            optionsContainer.innerHTML = '';
        } else {
            questionText.textContent = question.question;
            optionsContainer.innerHTML = '';

            question.options.forEach((option, index) => {
                const btn = document.createElement('button');
                btn.className = 'option-btn';
                btn.textContent = option.text;
                btn.addEventListener('click', () => this.answerQuestion(index));
                optionsContainer.appendChild(btn);
            });
        }

        historyContainer.innerHTML = '';
        this.gameState.answeredQuestions.slice().reverse().forEach(item => {
            const div = document.createElement('div');
            div.className = 'history-item ' + (item.correct ? 'correct' : 'wrong');
            div.innerHTML = `<strong>${item.question}</strong><br><small>${item.correct ? '✓ 回答正确' : '✗ 回答错误'}: ${item.answer}</small>`;
            historyContainer.appendChild(div);
        });
    }

    getStatName(stat) {
        const names = {
            power: '⚡电量',
            noise: '🔊噪声',
            rumor: '🗣️谣言',
            fatigue: '😴疲劳',
            morale: '❤️民心',
            trust: '🤝信任',
            food: '🍞食物',
            battery: '🔋电池',
            parts: '🔧零件'
        };
        return names[stat] || stat;
    }

    selectProgram(slot, programId) {
        if (this.gameState.schedule[slot] === 'editing_program') {
            if (!confirm('该时段已安排剪辑节目，是否替换为普通节目？')) return;
        }
        this.gameState.schedule[slot] = programId;
        this.renderSchedule();
    }

    selectBroadcast(broadcastId) {
        this.gameState.selectedBroadcast = broadcastId;
        
        const msg = GameData.broadcastMessages.find(m => m.id === broadcastId);
        const preview = document.getElementById('broadcastPreview');
        
        const effectsText = Object.entries(msg.effects)
            .map(([k, v]) => `${this.getStatName(k)} ${v > 0 ? '+' : ''}${v}`)
            .join(' | ');
        
        preview.innerHTML = `
            <h4 style="color:#e94560; margin-bottom:10px">${msg.title}</h4>
            <p>${msg.content}</p>
            <p style="color:#888; font-size:12px; margin-top:10px">效果: ${effectsText} | 耗电: ⚡${msg.power}</p>
        `;
        
        this.renderBroadcasts();
    }

    doBroadcast() {
        const msg = GameData.broadcastMessages.find(m => m.id === this.gameState.selectedBroadcast);
        if (!msg || this.gameState.todayActions.broadcastDone) return;

        if (this.gameState.status.power < msg.power) {
            this.showEvent('电力不足', '电量不足，无法进行播报！', [{ text: '⚡电量不足', type: 'negative' }]);
            return;
        }

        this.applyEffects(msg.effects);
        this.gameState.status.power -= msg.power;
        this.gameState.todayActions.broadcastDone = true;

        const effectTags = Object.entries(msg.effects)
            .filter(([_, v]) => v !== 0)
            .map(([k, v]) => ({
                text: `${this.getStatName(k)} ${v > 0 ? '+' : ''}${v}`,
                type: v > 0 ? 'positive' : 'negative'
            }));

        this.showEvent('播报完成', `已播报：${msg.title}`, effectTags);
        this.renderAll();
    }

    generateQuestion() {
        if (this.gameState.todayActions.qaDone >= 3) {
            this.gameState.currentQuestion = null;
        } else {
            const available = GameData.questionBank.filter(q => 
                !this.gameState.answeredQuestions.some(a => a.question === q.question)
            );
            
            if (available.length > 0) {
                this.gameState.currentQuestion = available[Math.floor(Math.random() * available.length)];
            } else {
                this.gameState.currentQuestion = GameData.questionBank[Math.floor(Math.random() * GameData.questionBank.length)];
            }
        }
        this.renderQuestion();
    }

    answerQuestion(optionIndex) {
        const question = this.gameState.currentQuestion;
        if (!question) return;

        const option = question.options[optionIndex];
        this.applyEffects(option.effects);
        this.gameState.todayActions.qaDone++;

        this.gameState.answeredQuestions.push({
            question: question.question,
            answer: option.text,
            correct: option.correct,
            day: this.gameState.day
        });

        const effectTags = Object.entries(option.effects)
            .filter(([_, v]) => v !== 0)
            .map(([k, v]) => ({
                text: `${this.getStatName(k)} ${v > 0 ? '+' : ''}${v}`,
                type: v > 0 ? 'positive' : 'negative'
            }));

        const title = option.correct ? '回答正确！' : '回答不佳...';
        this.showEvent(title, option.text, effectTags);

        this.generateQuestion();
        this.renderStatus();
    }

    doRepair() {
        const eqId = document.getElementById('repairEquipment').value;
        const survivorId = document.getElementById('repairSurvivor').value;
        
        if (!eqId || !survivorId) return;

        const equipment = this.gameState.equipment.find(e => e.id === eqId);
        const survivor = this.gameState.survivors.find(s => s.id === survivorId);
        
        if (!equipment || !survivor) return;

        if (this.gameState.resources.parts < equipment.repairCost) {
            this.showEvent('零件不足', '没有足够的零件进行维修！', [{ text: '🔧零件不足', type: 'negative' }]);
            return;
        }

        this.gameState.resources.parts -= equipment.repairCost;
        
        const repairBonus = survivor.skill === '维修' ? 15 : 0;
        const repairAmount = 25 + repairBonus;
        equipment.condition = Math.min(100, equipment.condition + repairAmount);
        
        survivor.fatigue += 20;
        survivor.task = `维修 ${equipment.name}`;
        
        this.gameState.todayActions.repairDone.push(eqId);

        this.showEvent('维修完成', `${survivor.name} 完成了 ${equipment.name} 的维修工作！`, [
            { text: `🔧 ${equipment.name} +${repairAmount}%`, type: 'positive' },
            { text: `😴 ${survivor.name} 疲劳 +20`, type: 'negative' }
        ]);

        this.renderAll();
    }

    suppressRumor() {
        const rumorId = document.getElementById('rumorToSuppress').value;
        if (!rumorId) return;

        const rumor = this.gameState.rumors.find(r => r.id === rumorId);
        if (!rumor) return;

        if (this.gameState.status.power < 8) {
            this.showEvent('电力不足', '电量不足，无法发布澄清广播！', [{ text: '⚡电量不足', type: 'negative' }]);
            return;
        }

        this.gameState.status.power -= 8;
        rumor.severity -= 40;
        this.gameState.status.rumor -= 15;
        this.gameState.status.fatigue += 10;
        this.gameState.todayActions.rumorSuppressDone.push(rumorId);

        let effectTags = [
            { text: `🗣️ 谣言 -40%`, type: 'positive' },
            { text: `😴 疲劳 +10`, type: 'negative' }
        ];

        if (rumor.severity <= 0) {
            this.gameState.rumors = this.gameState.rumors.filter(r => r.id !== rumorId);
            this.gameState.status.morale += 10;
            effectTags.push({ text: '✅ 谣言已平息', type: 'positive' });
            effectTags.push({ text: '❤️ 民心 +10', type: 'positive' });
        }

        this.showEvent('发布澄清', `针对"${rumor.title}"发布了官方澄清消息。`, effectTags);
        this.renderAll();
    }

    applyEffects(effects) {
        Object.entries(effects).forEach(([key, value]) => {
            if (key === 'trust') {
                this.gameState.districts.forEach(d => {
                    d.trust = Math.max(0, Math.min(100, d.trust + value));
                });
            } else if (this.gameState.status[key] !== undefined) {
                this.gameState.status[key] = Math.max(0, Math.min(100, this.gameState.status[key] + value));
            } else if (this.gameState.resources[key] !== undefined) {
                this.gameState.resources[key] = Math.max(0, this.gameState.resources[key] + value);
            }
        });
    }

    generateDailyRumors() {
        if (Math.random() < 0.6) {
            this.gameState.rumors.push(this.generateRumor());
        }
        if (this.gameState.day > 3 && Math.random() < 0.4) {
            this.gameState.rumors.push(this.generateRumor());
        }
    }

    endDay() {
        const dayEffects = {
            power: 0,
            noise: 0,
            rumor: 0,
            fatigue: 0,
            morale: 0,
            food: 0,
            trust: 0
        };

        let totalPowerUsed = 0;
        ['morning', 'afternoon', 'evening'].forEach(slot => {
            const programId = this.gameState.schedule[slot];
            if (programId) {
                if (programId === 'editing_program') {
                    const editingProgram = this.gameState.editingDesk.dailyPrograms.find(p => p.scheduledSlot === slot);
                    if (editingProgram) {
                        totalPowerUsed += 8;
                        dayEffects.rumor += editingProgram.effects.rumor;
                        dayEffects.morale += editingProgram.effects.morale;
                        dayEffects.trust += editingProgram.effects.trust;
                    }
                } else {
                    const program = GameData.programTypes.find(p => p.id === programId);
                    if (program) {
                        totalPowerUsed += program.power;
                        Object.entries(program.effects).forEach(([k, v]) => {
                            if (dayEffects[k] !== undefined) {
                                dayEffects[k] += v;
                            }
                        });
                    }
                }
            }
        });

        dayEffects.power -= totalPowerUsed;

        const survivorCount = this.gameState.survivors.length;
        dayEffects.food -= survivorCount;
        this.gameState.resources.food += dayEffects.food;

        this.gameState.survivors.forEach(s => {
            if (s.fatigue > 0) {
                s.fatigue = Math.max(0, s.fatigue - 30);
            }
            if (s.task) {
                s.task = null;
            }
        });

        this.gameState.rumors.forEach(rumor => {
            rumor.severity += 10;
            dayEffects.rumor += 5;
        });

        this.gameState.rumors = this.gameState.rumors.filter(r => r.severity <= 100);
        this.gameState.rumors.forEach(r => {
            if (r.severity >= 80) {
                dayEffects.morale -= 8;
            }
        });

        if (this.gameState.status.power <= this.gameState.thresholds.power) {
            dayEffects.morale -= 10;
        }
        if (this.gameState.status.noise >= this.gameState.thresholds.noise) {
            dayEffects.morale -= 5;
            dayEffects.fatigue += 10;
        }
        if (this.gameState.status.rumor >= this.gameState.thresholds.rumor) {
            dayEffects.morale -= 15;
        }
        if (this.gameState.status.fatigue >= this.gameState.thresholds.fatigue) {
            dayEffects.morale -= 5;
        }
        if (this.gameState.status.morale <= this.gameState.thresholds.morale) {
            this.gameState.districts.forEach(d => {
                d.trust = Math.max(0, d.trust - 5);
            });
        }

        if (this.gameState.resources.food < 0) {
            dayEffects.morale -= 20;
            this.gameState.resources.food = 0;
            this.gameState.survivors.forEach(s => {
                s.health -= 10;
            });
        }

        Object.entries(dayEffects).forEach(([k, v]) => {
            if (k !== 'food' && this.gameState.status[k] !== undefined) {
                this.gameState.status[k] = Math.max(0, Math.min(100, this.gameState.status[k] + v));
            }
        });

        let summary = '正常';
        if (this.gameState.status.morale <= 20) summary = '危急';
        else if (this.gameState.status.morale <= 40) summary = '堪忧';
        else if (this.gameState.status.morale >= 80) summary = '良好';

        this.gameState.settlementHistory.push({
            day: this.gameState.day,
            effects: dayEffects,
            summary: summary
        });

        this.showSettlementModal(dayEffects, summary);

        this.gameState.day++;
        this.gameState.schedule = { morning: null, afternoon: null, evening: null };
        this.gameState.selectedBroadcast = null;
        this.gameState.currentQuestion = null;
        this.gameState.todayActions = {
            broadcastDone: false,
            qaDone: 0,
            repairDone: [],
            rumorSuppressDone: []
        };
        this.gameState.editingDesk.timeline = [];
        this.gameState.editingDesk.generatedProgram = null;
        this.gameState.editingDesk.dailyPrograms = [];

        this.generateDailyRumors();
        this.unlockRandomMaterial();

        this.gameState.equipment.forEach(eq => {
            eq.condition = Math.max(0, eq.condition - 3);
        });

        if (Math.random() < 0.3) {
            this.gameState.resources.parts += Math.floor(Math.random() * 3) + 1;
        }
        if (Math.random() < 0.3) {
            this.gameState.resources.battery += Math.floor(Math.random() * 2) + 1;
        }
        if (Math.random() < 0.2) {
            this.gameState.resources.food += Math.floor(Math.random() * 5) + 2;
        }

        if (this.gameState.status.morale <= 0) {
            this.gameOver('民心崩溃', '广播站失去了所有听众的信任，人们不再相信你了...');
            return;
        }
        if (this.gameState.status.power <= 0 && this.gameState.resources.battery <= 0) {
            this.gameOver('电力耗尽', '所有电力来源都已耗尽，广播站陷入了黑暗...');
            return;
        }

        this.renderAll();
    }

    showSettlementModal(effects, summary) {
        let effectsHtml = '';
        Object.entries(effects).forEach(([stat, value]) => {
            if (value !== 0) {
                const className = value > 0 ? 'positive' : 'negative';
                const sign = value > 0 ? '+' : '';
                effectsHtml += `<span class="effect-tag ${className}">${this.getStatName(stat)} ${sign}${value}</span>`;
            }
        });

        document.getElementById('modalTitle').textContent = `第 ${this.gameState.day} 天结算 - ${summary}`;
        document.getElementById('modalText').textContent = '今日运营已结束，以下是今日总结：';
        document.getElementById('modalEffects').innerHTML = effectsHtml;
        document.getElementById('eventModal').classList.add('active');
    }

    showEvent(title, text, effects) {
        let effectsHtml = '';
        effects.forEach(e => {
            effectsHtml += `<span class="effect-tag ${e.type}">${e.text}</span>`;
        });

        document.getElementById('modalTitle').textContent = title;
        document.getElementById('modalText').textContent = text;
        document.getElementById('modalEffects').innerHTML = effectsHtml;
        document.getElementById('eventModal').classList.add('active');
    }

    closeModal() {
        document.getElementById('eventModal').classList.remove('active');
    }

    filterMaterials(filter) {
        this.gameState.editingDesk.materialFilter = filter;
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === filter);
        });
        this.renderMaterials();
    }

    renderEditingDesk() {
        this.renderMaterials();
        this.renderTimeline();
        this.renderPreview();
    }

    renderMaterials() {
        const container = document.getElementById('materialsGrid');
        const filter = this.gameState.editingDesk.materialFilter;
        const unlockedIds = this.gameState.editingDesk.unlockedMaterials;
        
        let materials = GameData.materials.filter(m => unlockedIds.includes(m.id));
        if (filter !== 'all') {
            materials = materials.filter(m => m.type === filter);
        }

        container.innerHTML = '';
        materials.forEach(material => {
            const typeInfo = GameData.materialTypes[material.type];
            const card = document.createElement('div');
            card.className = `material-card ${material.type}`;
            card.draggable = true;
            card.dataset.materialId = material.id;
            
            card.innerHTML = `
                <div class="material-title">
                    <span>${material.name}</span>
                    <span class="material-type" style="background:${typeInfo.color}">${typeInfo.icon}</span>
                </div>
                <div class="material-desc">${material.description}</div>
                <div class="material-stats">
                    <div class="material-stat"><span>真实度</span><span>${material.authenticity}</span></div>
                    <div class="material-stat"><span>感染力</span><span>${material.appeal}</span></div>
                    <div class="material-stat"><span>刺激性</span><span>${material.stimulation}</span></div>
                    <div class="material-stat"><span>时长</span><span>${material.duration}分</span></div>
                </div>
            `;

            card.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('materialId', material.id);
                e.dataTransfer.setData('source', 'library');
                card.classList.add('dragging');
            });

            card.addEventListener('dragend', () => {
                card.classList.remove('dragging');
            });

            card.addEventListener('dblclick', () => {
                this.addMaterialToTimeline(material.id);
            });

            container.appendChild(card);
        });
    }

    renderTimeline() {
        const track = document.getElementById('timelineTrack');
        const placeholder = document.getElementById('timelinePlaceholder');
        const timeline = this.gameState.editingDesk.timeline;
        const durationSpan = document.getElementById('timelineDuration');
        const generateBtn = document.getElementById('generateProgramBtn');

        let totalDuration = 0;
        timeline.forEach(id => {
            const material = GameData.materials.find(m => m.id === id);
            if (material) totalDuration += material.duration;
        });

        durationSpan.textContent = `总时长: ${totalDuration}分钟`;
        generateBtn.disabled = timeline.length < 2;

        if (timeline.length === 0) {
            placeholder.classList.remove('hidden');
            const existingItems = track.querySelector('.timeline-items');
            if (existingItems) existingItems.remove();
            return;
        }

        placeholder.classList.add('hidden');

        let itemsContainer = track.querySelector('.timeline-items');
        if (!itemsContainer) {
            itemsContainer = document.createElement('div');
            itemsContainer.className = 'timeline-items';
            track.appendChild(itemsContainer);
        }

        itemsContainer.innerHTML = '';
        timeline.forEach((materialId, index) => {
            const material = GameData.materials.find(m => m.id === materialId);
            if (!material) return;

            const typeInfo = GameData.materialTypes[material.type];
            const item = document.createElement('div');
            item.className = 'timeline-item';
            item.draggable = true;
            item.dataset.index = index;
            item.dataset.materialId = materialId;
            item.style.borderLeft = `3px solid ${typeInfo.color}`;

            item.innerHTML = `
                <span class="timeline-item-handle">⋮⋮</span>
                <div class="timeline-item-info">
                    <div class="timeline-item-name">${typeInfo.icon} ${material.name}</div>
                    <div class="timeline-item-meta">真实度 ${material.authenticity} | 感染力 ${material.appeal} | ${material.duration}分钟</div>
                </div>
                <button class="timeline-item-remove" title="移除">×</button>
            `;

            item.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('source', 'timeline');
                e.dataTransfer.setData('fromIndex', index);
                item.classList.add('dragging');
            });

            item.addEventListener('dragend', () => {
                item.classList.remove('dragging');
                document.querySelectorAll('.timeline-item').forEach(i => i.classList.remove('drag-over'));
            });

            item.addEventListener('dragover', (e) => {
                e.preventDefault();
                item.classList.add('drag-over');
            });

            item.addEventListener('dragleave', () => {
                item.classList.remove('drag-over');
            });

            item.addEventListener('drop', (e) => {
                e.preventDefault();
                e.stopPropagation();
                item.classList.remove('drag-over');
                
                const source = e.dataTransfer.getData('source');
                if (source === 'timeline') {
                    const fromIndex = parseInt(e.dataTransfer.getData('fromIndex'));
                    this.reorderTimeline(fromIndex, index);
                } else {
                    const materialId = e.dataTransfer.getData('materialId');
                    this.insertMaterialToTimeline(materialId, index);
                }
            });

            item.querySelector('.timeline-item-remove').addEventListener('click', (e) => {
                e.stopPropagation();
                this.removeMaterialFromTimeline(index);
            });

            itemsContainer.appendChild(item);
        });
    }

    renderPreview() {
        const timeline = this.gameState.editingDesk.timeline;
        const materials = timeline.map(id => GameData.materials.find(m => m.id === id)).filter(Boolean);

        document.getElementById('scoreAuthenticity').style.width = '0%';
        document.getElementById('scoreAppeal').style.width = '0%';
        document.getElementById('scoreStimulation').style.width = '0%';
        document.getElementById('scoreVariety').style.width = '0%';
        document.getElementById('valueAuthenticity').textContent = '0';
        document.getElementById('valueAppeal').textContent = '0';
        document.getElementById('valueStimulation').textContent = '0';
        document.getElementById('valueVariety').textContent = '0';

        const ratingBadge = document.getElementById('ratingBadge');
        const ratingDesc = document.getElementById('ratingDesc');
        const effectTags = document.getElementById('effectTags');
        const previewActions = document.getElementById('previewActions');

        if (materials.length === 0) {
            ratingBadge.textContent = '--';
            ratingBadge.style.background = 'rgba(255,255,255,0.1)';
            ratingBadge.style.color = '#888';
            ratingDesc.textContent = '请添加素材以查看评价';
            effectTags.innerHTML = '<span class="effect-tag neutral">请添加素材</span>';
            previewActions.style.display = 'none';
            return;
        }

        const scores = this.calculateProgramScore(materials);
        const effects = this.calculateProgramEffects(scores, materials);

        setTimeout(() => {
            document.getElementById('scoreAuthenticity').style.width = scores.totalAuthenticity + '%';
            document.getElementById('scoreAppeal').style.width = scores.totalAppeal + '%';
            document.getElementById('scoreStimulation').style.width = scores.totalStimulation + '%';
            document.getElementById('scoreVariety').style.width = scores.varietyScore + '%';
        }, 50);

        document.getElementById('valueAuthenticity').textContent = Math.round(scores.totalAuthenticity);
        document.getElementById('valueAppeal').textContent = Math.round(scores.totalAppeal);
        document.getElementById('valueStimulation').textContent = Math.round(scores.totalStimulation);
        document.getElementById('valueVariety').textContent = Math.round(scores.varietyScore);

        const ratingInfo = GameData.ratingNames[scores.rating];
        ratingBadge.textContent = ratingInfo.name;
        ratingBadge.style.background = ratingInfo.color + '33';
        ratingBadge.style.color = ratingInfo.color;
        ratingDesc.textContent = ratingInfo.desc;

        effectTags.innerHTML = '';
        if (effects.trust !== 0) {
            const tag = document.createElement('span');
            tag.className = `effect-tag ${effects.trust > 0 ? 'positive' : 'negative'}`;
            tag.textContent = `🤝信任 ${effects.trust > 0 ? '+' : ''}${effects.trust}`;
            effectTags.appendChild(tag);
        }
        if (effects.morale !== 0) {
            const tag = document.createElement('span');
            tag.className = `effect-tag ${effects.morale > 0 ? 'positive' : 'negative'}`;
            tag.textContent = `❤️民心 ${effects.morale > 0 ? '+' : ''}${effects.morale}`;
            effectTags.appendChild(tag);
        }
        if (effects.rumor !== 0) {
            const tag = document.createElement('span');
            tag.className = `effect-tag ${effects.rumor < 0 ? 'positive' : 'negative'}`;
            tag.textContent = `🗣️谣言 ${effects.rumor > 0 ? '+' : ''}${effects.rumor}`;
            effectTags.appendChild(tag);
        }

        if (this.gameState.editingDesk.generatedProgram) {
            previewActions.style.display = 'block';
        } else {
            previewActions.style.display = 'none';
        }
    }

    calculateProgramScore(materials) {
        if (materials.length === 0) {
            return { totalAuthenticity: 0, totalAppeal: 0, totalStimulation: 0, varietyScore: 0, durationScore: 0, overall: 0, rating: 'chaotic' };
        }

        const totalAuthenticity = materials.reduce((sum, m) => sum + m.authenticity, 0) / materials.length;
        const totalAppeal = materials.reduce((sum, m) => sum + m.appeal, 0) / materials.length;
        const totalStimulation = materials.reduce((sum, m) => sum + m.stimulation, 0) / materials.length;

        const typeCount = new Set(materials.map(m => m.type)).size;
        let varietyScore = 0;
        if (typeCount === 1) varietyScore = 30;
        else if (typeCount === 2) varietyScore = 70;
        else if (typeCount >= 3) varietyScore = 100;

        const totalDuration = materials.reduce((sum, m) => sum + m.duration, 0);
        let durationScore = 0;
        if (totalDuration < 10) durationScore = 40;
        else if (totalDuration <= 45) durationScore = 100;
        else durationScore = 60;

        const overall = (totalAuthenticity * 0.3 + totalAppeal * 0.3 + varietyScore * 0.25 + durationScore * 0.15);

        let rating = 'chaotic';
        if (overall >= 85) rating = 'perfect';
        else if (overall >= 70) rating = 'good';
        else if (overall >= 50) rating = 'normal';

        return { totalAuthenticity, totalAppeal, totalStimulation, varietyScore, durationScore, overall, rating };
    }

    calculateProgramEffects(scores, materials) {
        const { totalAuthenticity, totalAppeal, totalStimulation, rating } = scores;

        let trust = totalAuthenticity * 0.5 - totalStimulation * 0.3;
        let morale = totalAppeal * 0.6;
        let rumor = -totalAuthenticity * 0.4 + totalStimulation * 0.5;

        const ratingBonus = {
            perfect: { trust: 10, morale: 15, rumor: -15 },
            good: { trust: 5, morale: 8, rumor: -8 },
            normal: { trust: 0, morale: 0, rumor: 0 },
            chaotic: { trust: -10, morale: -5, rumor: 10 }
        };

        trust += ratingBonus[rating].trust;
        morale += ratingBonus[rating].morale;
        rumor += ratingBonus[rating].rumor;

        const typeCount = materials.reduce((acc, m) => {
            acc[m.type] = (acc[m.type] || 0) + 1;
            return acc;
        }, {});

        if (typeCount.interview && typeCount.letter) morale += 5;
        if (typeCount.official && typeCount.news) rumor -= 8;
        if (typeCount.ambient) morale += 3;

        return {
            trust: Math.round(trust),
            morale: Math.round(morale),
            rumor: Math.round(rumor)
        };
    }

    handleTimelineDragOver(e) {
        e.preventDefault();
        e.currentTarget.classList.add('drag-over');
    }

    handleTimelineDragLeave(e) {
        if (!e.currentTarget.contains(e.relatedTarget)) {
            e.currentTarget.classList.remove('drag-over');
        }
    }

    handleTimelineDrop(e) {
        e.preventDefault();
        e.currentTarget.classList.remove('drag-over');
        
        const source = e.dataTransfer.getData('source');
        if (source === 'library') {
            const materialId = e.dataTransfer.getData('materialId');
            this.addMaterialToTimeline(materialId);
        }
    }

    addMaterialToTimeline(materialId) {
        if (this.gameState.editingDesk.timeline.length >= 8) {
            this.showEvent('轨道已满', '最多只能添加8个素材到轨道中。', []);
            return;
        }

        const material = GameData.materials.find(m => m.id === materialId);
        if (!material || !this.gameState.editingDesk.unlockedMaterials.includes(materialId)) {
            return;
        }

        this.gameState.editingDesk.timeline.push(materialId);
        this.gameState.editingDesk.generatedProgram = null;
        this.renderTimeline();
        this.renderPreview();
    }

    insertMaterialToTimeline(materialId, index) {
        if (this.gameState.editingDesk.timeline.length >= 8) {
            this.showEvent('轨道已满', '最多只能添加8个素材到轨道中。', []);
            return;
        }

        const material = GameData.materials.find(m => m.id === materialId);
        if (!material || !this.gameState.editingDesk.unlockedMaterials.includes(materialId)) {
            return;
        }

        this.gameState.editingDesk.timeline.splice(index, 0, materialId);
        this.gameState.editingDesk.generatedProgram = null;
        this.renderTimeline();
        this.renderPreview();
    }

    removeMaterialFromTimeline(index) {
        this.gameState.editingDesk.timeline.splice(index, 1);
        this.gameState.editingDesk.generatedProgram = null;
        this.renderTimeline();
        this.renderPreview();
    }

    reorderTimeline(fromIndex, toIndex) {
        const timeline = this.gameState.editingDesk.timeline;
        const [removed] = timeline.splice(fromIndex, 1);
        timeline.splice(toIndex, 0, removed);
        this.gameState.editingDesk.generatedProgram = null;
        this.renderTimeline();
        this.renderPreview();
    }

    clearTimeline() {
        this.gameState.editingDesk.timeline = [];
        this.gameState.editingDesk.generatedProgram = null;
        this.renderTimeline();
        this.renderPreview();
    }

    generateProgram() {
        const timeline = this.gameState.editingDesk.timeline;
        if (timeline.length < 2) return;

        const materials = timeline.map(id => GameData.materials.find(m => m.id === id)).filter(Boolean);
        const scores = this.calculateProgramScore(materials);
        const effects = this.calculateProgramEffects(scores, materials);
        const totalDuration = materials.reduce((sum, m) => sum + m.duration, 0);

        const program = {
            id: 'program_' + Date.now(),
            name: `特别节目 - 第${this.gameState.day}天`,
            materials: [...timeline],
            totalDuration,
            scores,
            effects,
            day: this.gameState.day,
            scheduledSlot: null
        };

        this.gameState.editingDesk.generatedProgram = program;

        const effectTags = [
            { text: `综合评分: ${Math.round(scores.overall)}分`, type: scores.overall >= 70 ? 'positive' : 'negative' },
            { text: `评级: ${GameData.ratingNames[scores.rating].name}`, type: scores.rating === 'perfect' || scores.rating === 'good' ? 'positive' : 'negative' }
        ];

        if (effects.trust !== 0) effectTags.push({ text: `🤝信任 ${effects.trust > 0 ? '+' : ''}${effects.trust}`, type: effects.trust > 0 ? 'positive' : 'negative' });
        if (effects.morale !== 0) effectTags.push({ text: `❤️民心 ${effects.morale > 0 ? '+' : ''}${effects.morale}`, type: effects.morale > 0 ? 'positive' : 'negative' });
        if (effects.rumor !== 0) effectTags.push({ text: `🗣️谣言 ${effects.rumor > 0 ? '+' : ''}${effects.rumor}`, type: effects.rumor < 0 ? 'positive' : 'negative' });

        this.showEvent('节目生成成功', `已生成"${program.name}"，时长${totalDuration}分钟。可选择时段加入今日播出。`, effectTags);
        this.renderPreview();
    }

    scheduleProgram() {
        const program = this.gameState.editingDesk.generatedProgram;
        const slot = document.getElementById('scheduleSlotSelect').value;

        if (!program || !slot) return;

        if (this.gameState.todayActions.broadcastDone) {
            this.showEvent('无法安排', '今日已完成播报，无法再安排节目。', []);
            return;
        }

        if (this.gameState.schedule[slot]) {
            if (!confirm(`该时段已有节目安排，是否替换？`)) return;
        }

        this.gameState.schedule[slot] = 'editing_program';
        program.scheduledSlot = slot;
        this.gameState.editingDesk.dailyPrograms.push(program);

        const effectTags = [
            { text: `已安排到${slot === 'morning' ? '早间' : slot === 'afternoon' ? '午间' : '晚间'}时段`, type: 'positive' }
        ];

        this.showEvent('节目已安排', `"${program.name}"已加入今日播出队列，将在${slot === 'morning' ? '早间' : slot === 'afternoon' ? '午间' : '晚间'}时段播出。`, effectTags);

        this.gameState.editingDesk.timeline = [];
        this.gameState.editingDesk.generatedProgram = null;
        document.getElementById('scheduleSlotSelect').value = '';

        this.renderAll();
    }

    unlockRandomMaterial() {
        const locked = GameData.materials.filter(m => !this.gameState.editingDesk.unlockedMaterials.includes(m.id));
        if (locked.length > 0 && Math.random() < 0.3) {
            const material = locked[Math.floor(Math.random() * locked.length)];
            this.gameState.editingDesk.unlockedMaterials.push(material.id);
            this.showEvent('解锁新素材', `解锁了新素材：${GameData.materialTypes[material.type].icon} ${material.name}`, [{ text: '🎬 新素材可用', type: 'positive' }]);
            return true;
        }
        return false;
    }

    gameOver(title, message) {
        this.gameState.gameOver = true;
        this.showEvent(`游戏结束 - ${title}`, message + `\n你坚持了 ${this.gameState.day} 天。`, []);
        document.getElementById('endDayBtn').disabled = true;
    }
}
