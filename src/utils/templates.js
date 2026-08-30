// 常见通知类型的快速录入模板:班委按格填空即可生成完整通知草稿,零 AI 成本
// 生成的是"草稿",填入编辑表单后班委检查修改,再照常"校验并生成 JSON"发布
// 字段说明:type = date 必填日期 / text 文本(可留空);optional = 选填(留空时对应内容自动省略)

export const TEMPLATES = [
  {
    key: 'select-course',
    name: '📖 选课通知',
    fields: [
      { key: 'term', label: '学期(如:2026-2027学年第一学期)', type: 'text' },
      { key: 'start', label: '选课开始日期', type: 'date' },
      { key: 'end', label: '选课结束日期', type: 'date' },
      { key: 'result', label: '结果公布/退补选日期', type: 'date' },
      { key: 'system', label: '选课系统名称', type: 'text', def: '教务系统' },
      { key: 'max', label: '每人限选门数', type: 'text', def: '2' }
    ],
    build: (v) => ({
      title: `关于${v.term || '本学期'}公共选修课网上选课的通知`,
      category: 'course',
      source: '教务处',
      summary: `${v.start} 至 ${v.end} 网上选课,先到先得,每人限选${v.max}门,${v.result}公布结果并开放退补选。`,
      timeline: [
        { date: v.start, label: '网上选课开始' },
        { date: v.end, label: '网上选课结束' },
        { date: v.result, label: '选课结果公布,开放退补选' }
      ],
      steps: [
        '查看培养方案,确认本学期需要修的学分与方向',
        `选课开始当天登录${v.system}选课`,
        '提前想好热门课程的备选,先到先得',
        '选课后核对课表,确认无时间冲突',
        `未选上的课程在${v.result}参加退补选`
      ],
      materials: [],
      pitfalls: [
        '热门课程先到先得,建议提前想好备选',
        '选课后务必核对课表,时间冲突会导致选课失败',
        '退补选同样有名额限制,不要拖到最后一天'
      ],
      attachments: [],
      tags: ['选课']
    })
  },
  {
    key: 'exam',
    name: '📝 考试安排',
    fields: [
      { key: 'subject', label: '科目(如:高等数学)', type: 'text' },
      { key: 'date', label: '考试日期', type: 'date' },
      { key: 'time', label: '考试时间(如:9:00-11:00)', type: 'text' },
      { key: 'place', label: '考试地点(如:教学楼A301)', type: 'text' }
    ],
    build: (v) => ({
      title: `关于《${v.subject}》课程期末考试安排的通知`,
      category: 'course',
      source: '教务处',
      summary: `${v.date} ${v.time} 在 ${v.place} 举行《${v.subject}》期末考试,请提前15分钟到场。`,
      timeline: [{ date: v.date, label: `${v.subject}考试(${v.time},${v.place})` }],
      steps: ['确认考试时间地点,提前查看考场位置', '复习备考,准备好考试用具', '考试当天带齐证件,提前15分钟到场', '遵守考场纪律,考试结束后有序离场'],
      materials: ['学生证或校园卡', '2B铅笔、黑色签字笔等考试用具'],
      pitfalls: ['开考15分钟后不得入场', '手机等电子设备须关机并按要求存放', '考试作弊后果严重,切勿心存侥幸'],
      attachments: [],
      tags: ['考试']
    })
  },
  {
    key: 'competition',
    name: '🏆 竞赛报名',
    fields: [
      { key: 'name', label: '竞赛名称(如:全国大学生数学建模竞赛)', type: 'text' },
      { key: 'deadline', label: '报名截止日期', type: 'date' },
      { key: 'matchDate', label: '比赛/选拔日期(选填)', type: 'date', optional: true }
    ],
    build: (v) => ({
      title: `关于组织参加${v.name}的通知`,
      category: 'competition',
      source: '教务处',
      summary: `${v.deadline}前完成报名${v.matchDate ? ',比赛/选拔时间为 ' + v.matchDate : ''}。`,
      timeline: [
        { date: v.deadline, label: '报名截止' },
        ...(v.matchDate ? [{ date: v.matchDate, label: '比赛/选拔' }] : [])
      ],
      steps: ['确认参赛资格,按要求组队或单独报名', '填写报名信息,准备报名材料', `在${v.deadline}前完成报名并确认报名成功`, v.matchDate ? `按通知时间参加比赛/选拔` : '关注后续比赛安排通知'],
      materials: ['报名表(按要求填写)', '学生证复印件', '其他证明材料(以官方通知为准)'],
      pitfalls: ['报名信息提交后不可更改,提交前仔细核对', '注意报名截止时间,逾期无法补报', '涉及缴费的认准官方渠道,谨防诈骗'],
      attachments: [],
      tags: []
    })
  },
  {
    key: 'activity',
    name: '🎪 活动通知',
    fields: [
      { key: 'name', label: '活动名称(如:中秋游园会)', type: 'text' },
      { key: 'deadline', label: '报名截止日期', type: 'date' },
      { key: 'date', label: '活动日期', type: 'date' },
      { key: 'time', label: '活动时间(如:19:00)', type: 'text' },
      { key: 'place', label: '活动地点(如:学校操场)', type: 'text' }
    ],
    build: (v) => ({
      title: `关于举办${v.name}的通知`,
      category: 'activity',
      source: '校学生会',
      summary: `${v.date} ${v.time} 在 ${v.place} 举办${v.name},${v.deadline}前完成报名。`,
      timeline: [
        { date: v.deadline, label: '报名截止' },
        { date: v.date, label: `${v.name}(${v.time},${v.place})` }
      ],
      steps: ['各班统计报名情况', `在${v.deadline}前提交报名信息`, `活动当天提前到场,按安排就位`],
      materials: ['报名表'],
      pitfalls: ['报名后无故缺席可能影响班级评优', '注意集合时间和地点,提前出发', '如遇天气等突发情况,关注群内最新通知'],
      attachments: [],
      tags: []
    })
  },
  {
    key: 'award',
    name: '🎖️ 奖学金/评优',
    fields: [
      { key: 'term', label: '学年(如:2025-2026学年)', type: 'text' },
      { key: 'deadline', label: '申请截止日期', type: 'date' },
      { key: 'reviewDate', label: '评议日期(选填)', type: 'date', optional: true },
      { key: 'publicDate', label: '公示日期(选填)', type: 'date', optional: true }
    ],
    build: (v) => ({
      title: `关于开展${v.term || '本学年'}奖学金评定工作的通知`,
      category: 'award',
      source: '学生工作处',
      summary: `${v.deadline}前提交个人申请${v.reviewDate ? ',' + v.reviewDate + '班级评议' : ''}${v.publicDate ? ',' + v.publicDate + '起公示' : ''}。`,
      timeline: [
        { date: v.deadline, label: '个人申请截止' },
        ...(v.reviewDate ? [{ date: v.reviewDate, label: '班级民主评议' }] : []),
        ...(v.publicDate ? [{ date: v.publicDate, label: '学院公示' }] : [])
      ],
      steps: ['对照评定条件确认自己是否符合资格', '填写申请表并准备证明材料', `在${v.deadline}前将材料交至辅导员处`, v.reviewDate ? '参加班级民主评议' : '等待评议安排', v.publicDate ? '关注公示,有异议在公示期内提出' : '关注后续公示通知'],
      materials: ['奖学金申请表', '成绩单(教务系统打印并盖章)', '获奖证书复印件', '志愿服务时长证明'],
      pitfalls: ['成绩单必须盖章,未盖章无效', '申请材料逾期一律不予补报', '对公示结果有异议,须在公示期内通过正规渠道反映'],
      attachments: [],
      tags: ['材料填写']
    })
  },
  {
    key: 'practice',
    name: '🌱 社会实践结项',
    fields: [
      { key: 'term', label: '实践主题(如:2026年暑期)', type: 'text' },
      { key: 'deadline', label: '材料提交截止日期', type: 'date' },
      { key: 'defenseDate', label: '答辩日期(选填)', type: 'date', optional: true }
    ],
    build: (v) => ({
      title: `关于开展${v.term || '暑期'}社会实践结项工作的通知`,
      category: 'practice',
      source: '校团委',
      summary: `${v.deadline}前提交电子版+纸质版结项材料${v.defenseDate ? ',' + v.defenseDate + '校级结项答辩' : ''}。`,
      timeline: [
        { date: v.deadline, label: '结项材料提交截止(电子版+纸质版)' },
        ...(v.defenseDate ? [{ date: v.defenseDate, label: '校级结项答辩' }] : [])
      ],
      steps: ['队长填写结项报告书基本信息', '整理调研报告、照片、发票等材料', `在${v.deadline}前提交电子版和纸质版材料`, v.defenseDate ? '准备答辩PPT,答辩当天全员到场' : '关注答辩安排通知'],
      materials: ['结项报告书', '调研报告(不少于3000字)', '活动照片不少于10张(需原图)', '发票及报销明细表'],
      pitfalls: ['电子版和纸质版缺一不可', '照片要求原图,拼图或截图无效', '答辩需全员到场,无法到场须提前提交书面说明'],
      attachments: [],
      tags: ['材料填写']
    })
  }
]
