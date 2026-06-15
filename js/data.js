// ??????????????????????????????
const GameData = {
    programTypes: [
        { id: 'music', name: '🎵 音乐节目', effects: { morale: 5, noise: 3, fatigue: -2 }, power: 5, desc: '播放轻松音乐' },
        { id: 'news', name: '📰 新闻播报', effects: { morale: 3, rumor: -5, trust: 5 }, power: 8, desc: '播报真实新闻' },
        { id: 'story', name: '📖 故事时间', effects: { morale: 8, fatigue: -5 }, power: 4, desc: '讲述精彩故事' },
        { id: 'education', name: '📚 知识讲座', effects: { morale: 4, trust: 8 }, power: 6, desc: '科普生存知识' },
        { id: 'interview', name: '🎙️ 幸存者访谈', effects: { morale: 6, trust: 10, rumor: -8 }, power: 10, desc: '采访幸存者' },
        { id: 'weather', name: '🌤️ 天气预报', effects: { morale: 2, trust: 3 }, power: 3, desc: '播报天气情况' },
        { id: 'silent', name: '🔇 静默时段', effects: { fatigue: -10, noise: -10 }, power: 1, desc: '关闭广播休息' },
        { id: 'emergency', name: '🚨 紧急广播', effects: { morale: -5, rumor: -15, trust: 15 }, power: 15, desc: '发布紧急通知' }
    ],

    questionBank: [
        {
            question: '听众问："外面的辐射情况怎么样了？我想出去寻找物资。"',
            options: [
                { text: '目前辐射较高，建议等待几日再行动', correct: true, effects: { trust: 5, morale: -2 } },
                { text: '辐射已经很安全了，随时可以出去', correct: false, effects: { trust: -10, rumor: 10 } },
                { text: '不清楚，你们自己看着办吧', correct: false, effects: { trust: -5, morale: -3 } }
            ]
        },
        {
            question: '听众问："听说东边的避难所有充足的食物，这是真的吗？"',
            options: [
                { text: '我们正在核实，请勿轻信谣言', correct: true, effects: { trust: 5, rumor: -5 } },
                { text: '没错，大家赶紧往东边去！', correct: false, effects: { trust: -15, rumor: 15, morale: -10 } },
                { text: '那边是陷阱，千万别去！', correct: false, effects: { trust: -8, rumor: 5 } }
            ]
        },
        {
            question: '听众问："饮用水应该怎么处理才安全？"',
            options: [
                { text: '建议煮沸后再饮用，或使用净水片', correct: true, effects: { trust: 8, morale: 3 } },
                { text: '看起来干净的水可以直接喝', correct: false, effects: { trust: -10, morale: -5 } },
                { text: '我不是专家，不知道', correct: false, effects: { trust: -3 } }
            ]
        },
        {
            question: '听众问："我的家人还在外面，我应该去找他们吗？"',
            options: [
                { text: '请先保持冷静，我们可以帮你广播寻人', correct: true, effects: { morale: 5, trust: 10 } },
                { text: '别去找了，他们肯定已经...', correct: false, effects: { morale: -15, trust: -10 } },
                { text: '赶紧去，晚了就来不及了！', correct: false, effects: { morale: -5, rumor: 5 } }
            ]
        },
        {
            question: '听众问："晚上总是听到奇怪的声音，是怪物吗？"',
            options: [
                { text: '可能是风声或建筑晃动，保持警惕但不必恐慌', correct: true, effects: { morale: 3, rumor: -8 } },
                { text: '是的！很危险，大家要小心！', correct: false, effects: { rumor: 15, morale: -10 } },
                { text: '我也听到了，太可怕了...', correct: false, effects: { rumor: 10, morale: -8 } }
            ]
        },
        {
            question: '听众问："什么时候才能恢复正常生活？"',
            options: [
                { text: '我们正在努力，保持希望，互相帮助', correct: true, effects: { morale: 10, trust: 5 } },
                { text: '永远不可能了，接受现实吧', correct: false, effects: { morale: -20, trust: -15 } },
                { text: '再过一个月就好了，我保证', correct: false, effects: { trust: -10, rumor: 5 } }
            ]
        },
        {
            question: '听众问："电池快用完了，有什么省电的方法吗？"',
            options: [
                { text: '关闭不必要的设备，改用手动照明', correct: true, effects: { trust: 8, morale: 2 } },
                { text: '尽情用吧，没电了再说', correct: false, effects: { trust: -5 } },
                { text: '可以用人力发电机，锻炼身体', correct: true, effects: { trust: 6, morale: 3 } }
            ]
        },
        {
            question: '听众问："有人说政府已经抛弃我们了，是真的吗？"',
            options: [
                { text: '目前没有官方消息，请不要传播未经证实的信息', correct: true, effects: { rumor: -10, trust: 8 } },
                { text: '是的，我们只能靠自己了', correct: false, effects: { rumor: 10, morale: -15 } },
                { text: '政府很快会来救我们的，耐心等待', correct: false, effects: { trust: -8, rumor: 5 } }
            ]
        },
        {
            question: '听众问："孩子一直哭，我该怎么安抚他？"',
            options: [
                { text: '抱着他轻声说话，给他讲故事', correct: true, effects: { morale: 8, trust: 5 } },
                { text: '让他哭，哭累了就好了', correct: false, effects: { morale: -5, trust: -3 } },
                { text: '给他点吃的，转移注意力', correct: true, effects: { morale: 5, trust: 3 } }
            ]
        },
        {
            question: '听众问："我发烧了，是不是被感染了？"',
            options: [
                { text: '先隔离观察，多喝水，如有其他症状及时告知', correct: true, effects: { trust: 10, rumor: -5 } },
                { text: '完了，你肯定被感染了！', correct: false, effects: { rumor: 15, morale: -10 } },
                { text: '别担心，只是普通感冒', correct: false, effects: { trust: -5, rumor: 8 } }
            ]
        }
    ],

    broadcastMessages: [
        { id: 'safe_zone', title: '📍 安全区通知', content: '城西区已确认安全，幸存者可前往临时避难所。', effects: { morale: 8, trust: 10, rumor: -5 }, power: 10 },
        { id: 'food_depot', title: '🍞 物资发放', content: '今日下午三点在中心广场发放应急物资，请携带身份证明。', effects: { morale: 12, trust: 8 }, power: 8 },
        { id: 'danger_warning', title: '⚠️ 危险警告', content: '工业区发现不明泄漏，请所有居民远离该区域。', effects: { morale: -3, trust: 15, rumor: -10 }, power: 12 },
        { id: 'rescue_team', title: '🚑 救援队消息', content: '搜救队已救出12名被困幸存者，正在送往医疗点。', effects: { morale: 15, trust: 12 }, power: 8 },
        { id: 'water_supply', title: '💧 供水恢复', content: '城东片区供水已恢复，请节约用水。', effects: { morale: 10, trust: 8 }, power: 6 },
        { id: 'curfew', title: '🌙 宵禁通知', content: '今晚十点至明日六点实行宵禁，请勿外出。', effects: { morale: -5, trust: 5, rumor: 5 }, power: 5 },
        { id: 'missing_person', title: '🔍 寻人启事', content: '寻找5岁女童小雨，穿红色外套，知情者请联系广播站。', effects: { morale: 3, trust: 10 }, power: 7 },
        { id: 'weather_alert', title: '🌪️ 天气预警', content: '预计明日有强暴雨，请做好防护准备。', effects: { morale: -2, trust: 12 }, power: 6 },
        { id: 'medical_help', title: '🏥 医疗援助', content: '临时医疗点24小时开放，有需要的居民可前往就诊。', effects: { morale: 8, trust: 10 }, power: 7 },
        { id: 'power_restore', title: '⚡ 电力恢复', content: '城南片区今晚八点恢复供电。', effects: { morale: 12, trust: 10 }, power: 5 }
    ],

    equipmentList: [
        { id: 'transmitter', name: '📡 主发射器', condition: 85, maxCondition: 100, repairCost: 3, repairTime: 2, effect: '广播范围' },
        { id: 'antenna', name: '📶 信号天线', condition: 70, maxCondition: 100, repairCost: 2, repairTime: 1, effect: '信号强度' },
        { id: 'generator', name: '🔋 备用发电机', condition: 90, maxCondition: 100, repairCost: 4, repairTime: 2, effect: '电力供应' },
        { id: 'mixer', name: '🎚️ 音频控制台', condition: 75, maxCondition: 100, repairCost: 2, repairTime: 1, effect: '音质效果' },
        { id: 'ups', name: '🔌 UPS电源', condition: 65, maxCondition: 100, repairCost: 3, repairTime: 1, effect: '电力稳定' }
    ],

    districts: [
        { id: 'east', name: '城东', trust: 60 },
        { id: 'west', name: '城西', trust: 50 },
        { id: 'south', name: '城南', trust: 55 },
        { id: 'north', name: '城北', trust: 45 },
        { id: 'center', name: '市中心', trust: 70 }
    ],

    survivorNames: ['李明', '王芳', '张伟', '刘洋', '陈静', '杨帆', '赵磊', '周婷', '吴强', '郑雪'],
    survivorSkills: ['维修', '医疗', '电力', '通讯', '搜索'],

    materialTypes: {
        interview: { name: '幸存者采访', icon: '🎙️', color: '#e94560' },
        letter: { name: '居民来信', icon: '✉️', color: '#3498db' },
        official: { name: '官方片段', icon: '📢', color: '#2ecc71' },
        ambient: { name: '环境声', icon: '🌊', color: '#9b59b6' },
        news: { name: '旧新闻', icon: '📰', color: '#f39c12' }
    },

    materials: [
        { id: 'int_001', type: 'interview', name: '教师张明的回忆', description: '张明老师讲述灾前学校的日常，孩子们的笑声仿佛还在耳边。', authenticity: 85, appeal: 75, stimulation: 20, duration: 8, unlocked: true },
        { id: 'int_002', type: 'interview', name: '医生李华的经历', description: '李医生讲述在灾难中救死扶伤的经历，真实感人。', authenticity: 90, appeal: 80, stimulation: 35, duration: 10, unlocked: true },
        { id: 'int_003', type: 'interview', name: '消防员王强的故事', description: '王队长回忆救援过程中的惊险瞬间，令人揪心。', authenticity: 88, appeal: 70, stimulation: 60, duration: 12, unlocked: true },
        { id: 'int_004', type: 'interview', name: '老人的全家福', description: '赵奶奶讲述家人团聚的珍贵，平淡中见真情。', authenticity: 95, appeal: 85, stimulation: 15, duration: 6, unlocked: false },

        { id: 'let_001', type: 'letter', name: '小女孩的画', description: '一封夹着蜡笔画的来信，画中是阳光明媚的公园。', authenticity: 80, appeal: 90, stimulation: 10, duration: 5, unlocked: true },
        { id: 'let_002', type: 'letter', name: '丈夫给妻子的信', description: '一位丈夫写给失散妻子的信，字字泣血。', authenticity: 75, appeal: 95, stimulation: 40, duration: 7, unlocked: true },
        { id: 'let_003', type: 'letter', name: '社区感谢信', description: '居民联名感谢广播站的陪伴，暖意融融。', authenticity: 85, appeal: 70, stimulation: 15, duration: 6, unlocked: true },
        { id: 'let_004', type: 'letter', name: '孩子的愿望清单', description: '10岁的小米写下的愿望清单，第一条是"再吃一次冰淇淋"。', authenticity: 90, appeal: 88, stimulation: 20, duration: 5, unlocked: false },

        { id: 'off_001', type: 'official', name: '应急指挥部公告', description: '官方发布的物资发放通知，正式而权威。', authenticity: 95, appeal: 40, stimulation: 30, duration: 4, unlocked: true },
        { id: 'off_002', type: 'official', name: '安全区划定说明', description: '详细说明各安全区位置和注意事项，信息量大。', authenticity: 98, appeal: 35, stimulation: 25, duration: 8, unlocked: true },
        { id: 'off_003', type: 'official', name: '救援进度通报', description: '官方通报最新救援进展，给人希望。', authenticity: 92, appeal: 65, stimulation: 20, duration: 6, unlocked: true },
        { id: 'off_004', type: 'official', name: '专家防疫指导', description: '卫生专家讲解灾后防疫知识，专业实用。', authenticity: 96, appeal: 45, stimulation: 35, duration: 10, unlocked: false },

        { id: 'amb_001', type: 'ambient', name: '清晨的鸟鸣', description: '灾难后依然顽强歌唱的鸟儿，象征生命的力量。', authenticity: 100, appeal: 80, stimulation: 5, duration: 3, unlocked: true },
        { id: 'amb_002', type: 'ambient', name: '雨声', description: '淅淅沥沥的雨声，抚慰人心的白噪音。', authenticity: 100, appeal: 75, stimulation: 10, duration: 5, unlocked: true },
        { id: 'amb_003', type: 'ambient', name: '远处的钟声', description: '悠扬的钟声穿越废墟，提醒人们时间仍在流淌。', authenticity: 95, appeal: 85, stimulation: 15, duration: 4, unlocked: true },
        { id: 'amb_004', type: 'ambient', name: '孩子们的欢笑声', description: '难得的片刻安宁中，孩子们的笑声。', authenticity: 90, appeal: 92, stimulation: 8, duration: 3, unlocked: false },

        { id: 'new_001', type: 'news', name: '灾前天气预报', description: '灾难前一天的天气预报，平静得令人唏嘘。', authenticity: 85, appeal: 50, stimulation: 45, duration: 3, unlocked: true },
        { id: 'new_002', type: 'news', name: '城市建设报道', description: '灾前关于城市新地标建设的报道，今昔对比令人感慨。', authenticity: 80, appeal: 60, stimulation: 35, duration: 5, unlocked: true },
        { id: 'new_003', type: 'news', name: '节日庆典回顾', description: '去年春节联欢晚会的精彩片段，勾起美好回忆。', authenticity: 90, appeal: 85, stimulation: 25, duration: 8, unlocked: true },
        { id: 'new_004', type: 'news', name: '体育赛事重播', description: '中国队夺冠的精彩瞬间，振奋人心。', authenticity: 95, appeal: 90, stimulation: 55, duration: 10, unlocked: false }
    ],

    ratingNames: {
        chaotic: { name: '混乱不堪', color: '#e74c3c', desc: '素材杂乱无章，听众感到困惑' },
        normal: { name: '中规中矩', color: '#f39c12', desc: '节目平稳，但缺乏亮点' },
        good: { name: '搭配良好', color: '#3498db', desc: '素材组合得当，听众反响不错' },
        perfect: { name: '完美组合', color: '#2ecc71', desc: '素材相得益彰，感染力爆棚' }
    }
};
