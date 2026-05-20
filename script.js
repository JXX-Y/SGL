// ==================== 数据定义 ====================
const STORAGE_ROLES='r_final', STORAGE_TASKS='t_final', STORAGE_RECORDS='rec_final';
const STORAGE_THEME='theme', STORAGE_CURRENCY='cur_final';
const DEFAULT_TASKS = [
    {id:'t1',name:'大战',category:'PVE',type:'daily',defaultReward:150,condition:1,remark:'',assignedRoles:[]},
    {id:'t2',name:'矿跑',category:'PVP',type:'daily',defaultReward:120,condition:1,remark:'',assignedRoles:[]},
    {id:'t3',name:'茶馆',category:'PVX',type:'daily',defaultReward:80,condition:1,remark:'',assignedRoles:[]},
    {id:'t4',name:'小周常·CD1',category:'PVE',type:'smallWeekly',defaultReward:300,condition:1,remark:'周一7:00~周五7:00',assignedRoles:[]},
    {id:'t5',name:'小周常·CD2',category:'PVP',type:'smallWeekly',defaultReward:300,condition:1,remark:'周五7:00~下周一7:00',assignedRoles:[]},
    {id:'t6',name:'大周常',category:'PVE',type:'bigWeekly',defaultReward:500,condition:1,remark:'',assignedRoles:[]}
];
const DEFAULT_ROLES = [
    {id:'r1',server:'唯我独尊',name:'小七',faction:'七秀',bodyType:'成女'},
    {id:'r2',server:'唯我独尊',name:'阿花',faction:'万花',bodyType:'萝莉'},
    {id:'r3',server:'双梦镇',name:'苍爹',faction:'苍云',bodyType:'成男'}
];
const FORTUNES = [
    {text:'大吉 · 紫气东来',icon:'🌟',desc:'今日运势极佳，适合挑战高难度副本'},
    {text:'中吉 · 玉露凝光',icon:'✨',desc:'稳扎稳打，收益可期'},
    {text:'小吉 · 清风拂面',icon:'🍃',desc:'日常清完，闲来可逛交易行'},
    {text:'平 · 云淡风轻',icon:'☁️',desc:'平淡是福，勿忘签到'},
    {text:'小凶 · 雾锁重楼',icon:'🌫️',desc:'今日开支可能偏大，注意攒钱'},
    {text:'中凶 · 剑鸣匣中',icon:'⚔️',desc:'小心翻车，组队时多沟通'}
];
const QUOTES = ['江湖路远，行则将至。','一壶浊酒，一剑天涯。','不忘初心，方得始终。','青山不改，绿水长流。','剑气纵横三万里，一剑光寒十九洲。','事了拂衣去，深藏身与名。'];

let appRoles = JSON.parse(localStorage.getItem(STORAGE_ROLES)) || DEFAULT_ROLES;
let appTasks = JSON.parse(localStorage.getItem(STORAGE_TASKS)) || DEFAULT_TASKS;
let appRecords = JSON.parse(localStorage.getItem(STORAGE_RECORDS)) || {};
let currentTheme = localStorage.getItem(STORAGE_THEME) || 'default';
let currencyData = JSON.parse(localStorage.getItem(STORAGE_CURRENCY)) || {unit:'金',bigUnit:'砖',rate:10000};

// ==================== 辅助函数 ====================
function formatCurrency(amount){
    const {unit,bigUnit,rate}=currencyData;
    const r=parseInt(rate)||10000;
    if(bigUnit&&r>1&&Math.abs(amount)>=r){
        const big=Math.floor(Math.abs(amount)/r);
        const small=Math.abs(amount)%r;
        return (amount<0?'-':'')+big+bigUnit+(small>0?small+unit:'');
    }
    return amount+unit;
}
function saveAll(){
    localStorage.setItem(STORAGE_ROLES,JSON.stringify(appRoles));
    localStorage.setItem(STORAGE_TASKS,JSON.stringify(appTasks));
    localStorage.setItem(STORAGE_RECORDS,JSON.stringify(appRecords));
}
function genId(){ return 'id_'+Date.now()+'_'+Math.random().toString(36).substr(2,6); }
function getToday(){
    const d=new Date();
    if(d.getHours()<7) d.setDate(d.getDate()-1);
    return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
}
function isTaskVisibleForRole(task,roleId){
    return !task.assignedRoles || task.assignedRoles.length===0 || task.assignedRoles.includes(roleId);
}
function getDayOfWeek(date){ const d=new Date(date); return d.getDay()||7; }
function isTaskActiveInDate(task,dateStr){
    const d=new Date(dateStr+'T12:00:00');
    const day=getDayOfWeek(d);
    if(task.type==='daily') return true;
    if(task.type==='smallWeekly'){
        if(day===1) return task.name.includes('CD1');
        if(day>=2&&day<=4) return task.name.includes('CD1');
        if(day===5) return true;
        if(day===6||day===7) return task.name.includes('CD2');
        return false;
    }
    if(task.type==='bigWeekly') return true;
    if(task.type==='limited'){
        if(task.startDate&&dateStr<task.startDate) return false;
        if(task.endDate&&dateStr>task.endDate) return false;
        return true;
    }
    return false;
}

// ==================== 主题 ====================
function setTheme(theme){
    currentTheme=theme;
    localStorage.setItem(STORAGE_THEME,theme);
    if(theme==='default') document.documentElement.removeAttribute('data-theme');
    else document.documentElement.setAttribute('data-theme',theme);
    document.querySelectorAll('.theme-option').forEach(o=>o.classList.remove('active'));
    document.querySelector(`.theme-option[data-theme="${theme}"]`)?.classList.add('active');
}
function initTheme(){
    if(currentTheme!=='default') document.documentElement.setAttribute('data-theme',currentTheme);
    document.querySelector(`.theme-option[data-theme="${currentTheme}"]`)?.classList.add('active');
}

// ==================== 货币设置 ====================
function saveCurrencyUnit(){
    currencyData.unit = document.getElementById('currencyUnit').value.trim() || '金';
    currencyData.bigUnit = document.getElementById('bigUnit').value.trim() || '';
    currencyData.rate = parseInt(document.getElementById('unitRate').value) || 10000;
    localStorage.setItem(STORAGE_CURRENCY,JSON.stringify(currencyData));
    if(document.getElementById('tab-home').classList.contains('active')) renderHome();
    if(document.getElementById('tab-analysis').classList.contains('active')) renderAnalysis();
}

// ==================== 数据导入导出 ====================
function exportData(){
    const data = {
        roles:appRoles, tasks:appTasks, records:appRecords,
        currency:currencyData, theme:currentTheme,
        exportTime:new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `日常管理_备份_${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
}
function importData(){
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = e => {
        const file = e.target.files[0];
        if(!file) return;
        const reader = new FileReader();
        reader.onload = re => {
            try {
                const data = JSON.parse(re.target.result);
                if(!data.roles || !data.tasks || !data.records) return alert('无效文件');
                if(!confirm('导入将覆盖当前所有数据，确定继续？')) return;
                appRoles = data.roles;
                appTasks = data.tasks;
                appRecords = data.records;
                if(data.currency){
                    currencyData = data.currency;
                    localStorage.setItem(STORAGE_CURRENCY,JSON.stringify(currencyData));
                }
                if(data.theme) setTheme(data.theme);
                saveAll();
                alert('导入成功！页面将刷新。');
                location.reload();
            } catch(err) {
                alert('解析失败：'+err.message);
            }
        };
        reader.readAsText(file);
    };
    input.click();
}

// ==================== 悬浮菜单 ====================
function toggleFabMenu(){
    const m = document.getElementById('fabMenu');
    m.style.display = m.style.display==='block'?'none':'block';
}
document.addEventListener('click', e => {
    if(!e.target.closest('.fab') && !e.target.closest('.fab-menu'))
        document.getElementById('fabMenu').style.display = 'none';
});
document.getElementById('fabBtn').addEventListener('click', toggleFabMenu);
document.getElementById('btn-add-role').addEventListener('click', ()=>{ toggleFabMenu(); showAddRoleModal(); });
document.getElementById('btn-add-task').addEventListener('click', ()=>{ toggleFabMenu(); showAddTaskModal(); });
document.getElementById('btn-manage-tasks').addEventListener('click', ()=>{ toggleFabMenu(); showManageTasksModal(); });
document.getElementById('btn-manage-roles').addEventListener('click', ()=>{ toggleFabMenu(); showManageRolesModal(); });

function closeModal(){ document.getElementById('modalContainer').innerHTML = ''; }

// ==================== 添加角色模态 ====================
function showAddRoleModal(){
    let html = `<div class="modal-overlay" onclick="closeModal()"><div class="modal" onclick="event.stopPropagation()"><h3>📝 添加角色 <button class="close-btn" onclick="closeModal()">×</button></h3>
        <div class="form-row"><label>区服<input type="text" id="modalServer" placeholder="唯我独尊"></label><label>角色名称<input type="text" id="modalName" placeholder="小七"></label><label>门派<select id="modalFaction"><option value="">请选择</option><option>万花</option><option>七秀</option><option>少林</option><option>天策</option><option>纯阳</option><option>藏剑</option><option>五毒</option><option>唐门</option><option>明教</option><option>丐帮</option><option>苍云</option><option>长歌</option><option>霸刀</option><option>蓬莱</option><option>凌雪阁</option><option>衍天宗</option><option>药宗</option><option>刀宗</option><option>万灵</option></select></label><label>体型<select id="modalBodyType"><option value="">请选择</option><option>成男</option><option>成女</option><option>正太</option><option>萝莉</option></select></label></div>
        <button class="btn btn-primary" id="saveRoleBtn">✅ 保存角色</button>
        <div id="modalRoleTags" style="margin-top:10px;display:flex;flex-wrap:wrap;gap:6px;max-height:100px;overflow-y:auto;"></div>
    </div></div>`;
    document.getElementById('modalContainer').innerHTML = html;
    document.getElementById('saveRoleBtn').addEventListener('click', addRoleFromModal);
    updateModalRoleTags();
}
function updateModalRoleTags(){
    const c = document.getElementById('modalRoleTags');
    if(c) c.innerHTML = appRoles.map(r=>`<span class="role-tag">${r.name}（${r.faction}）</span>`).join('');
}
function addRoleFromModal(){
    const s = document.getElementById('modalServer').value.trim();
    const n = document.getElementById('modalName').value.trim();
    const f = document.getElementById('modalFaction').value;
    const b = document.getElementById('modalBodyType').value;
    if(!s||!n||!f||!b) return alert('请填写完整');
    appRoles.push({id:genId(),server:s,name:n,faction:f,bodyType:b});
    saveAll();
    closeModal();
    renderHome();
    renderRecordRoleList();
    if(document.getElementById('taskViewContent').innerHTML) renderTaskView();
}

// ==================== 角色管理模态 ====================
function showManageRolesModal(){
    let html = `<div class="modal-overlay" onclick="closeModal()"><div class="modal" onclick="event.stopPropagation()"><h3>👥 角色管理 <button class="close-btn" onclick="closeModal()">×</button></h3><div id="manageRoleList">${appRoles.length===0?'<p style="color:var(--text-light);text-align:center;">暂无角色</p>':''}${appRoles.map(r=>`<div class="role-manage-card"><div class="role-manage-info"><strong>${r.name}</strong><span style="font-size:0.75rem;color:var(--text-light);"> · ${r.faction} · ${r.bodyType}</span><br><small style="color:var(--text-light);">区服：${r.server}</small></div><div class="role-manage-actions" style="display:flex;gap:6px;"><button class="btn btn-sm edit-role-btn" data-roleid="${r.id}">✏️ 编辑</button><button class="btn btn-sm btn-danger delete-role-btn" data-roleid="${r.id}">🗑 删除</button></div></div>`).join('')}</div></div></div>`;
    document.getElementById('modalContainer').innerHTML = html;
    document.querySelectorAll('.edit-role-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const roleId = btn.dataset.roleid;
            closeModal();
            editRole(roleId);
        });
    });
    document.querySelectorAll('.delete-role-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const roleId = btn.dataset.roleid;
            deleteRole(roleId);
        });
    });
}
function editRole(roleId){
    const role = appRoles.find(r=>r.id===roleId);
    if(!role) return;
    let html = `<div class="modal-overlay" onclick="closeModal()"><div class="modal" onclick="event.stopPropagation()"><h3>✏️ 编辑角色 <button class="close-btn" onclick="closeModal()">×</button></h3>
        <div class="form-row"><label>区服 <input type="text" id="editServer" value="${role.server}"></label><label>角色名称 <input type="text" id="editName" value="${role.name}"></label><label>门派<select id="editFaction">${['万花','七秀','少林','天策','纯阳','藏剑','五毒','唐门','明教','丐帮','苍云','长歌','霸刀','蓬莱','凌雪阁','衍天宗','药宗','刀宗','万灵'].map(f=>`<option value="${f}" ${role.faction===f?'selected':''}>${f}</option>`).join('')}</select></label><label>体型<select id="editBodyType">${['成男','成女','正太','萝莉'].map(b=>`<option value="${b}" ${role.bodyType===b?'selected':''}>${b}</option>`).join('')}</select></label></div>
        <button class="btn btn-primary" id="saveRoleEditBtn">💾 保存修改</button>
    </div></div>`;
    document.getElementById('modalContainer').innerHTML = html;
    document.getElementById('saveRoleEditBtn').addEventListener('click', () => saveRoleEdit(roleId));
}
function saveRoleEdit(roleId){
    const role = appRoles.find(r=>r.id===roleId);
    if(!role) return;
    const server = document.getElementById('editServer').value.trim();
    const name = document.getElementById('editName').value.trim();
    const faction = document.getElementById('editFaction').value;
    const bodyType = document.getElementById('editBodyType').value;
    if(!server||!name||!faction||!bodyType) return alert('请填写完整信息');
    role.server = server; role.name = name; role.faction = faction; role.bodyType = bodyType;
    saveAll();
    closeModal();
    renderHome();
    renderRecordRoleList();
    if(document.getElementById('tab-analysis').classList.contains('active')) { renderAnalysisRoleCards(); renderAnalysis(); }
    alert('角色信息已更新！');
}
function deleteRole(roleId){
    const role = appRoles.find(r=>r.id===roleId);
    if(!role) return;
    if(!confirm(`确定要删除角色「${role.name}」吗？\n\n删除后该角色的完成记录将被保留，但不再显示。`)) return;
    appRoles = appRoles.filter(r=>r.id!==roleId);
    saveAll();
    showManageRolesModal();
    renderHome();
    renderRecordRoleList();
    if(document.getElementById('tab-analysis').classList.contains('active')) { renderAnalysisRoleCards(); renderAnalysis(); }
}

// ==================== 添加/编辑任务模态 ====================
function showAddTaskModal(editTaskId=null){
    const task = editTaskId ? appTasks.find(t=>t.id===editTaskId) : null;
    let html = `<div class="modal-overlay" onclick="closeModal()"><div class="modal" onclick="event.stopPropagation()"><h3>${task?'✏️ 编辑任务':'📋 添加任务'} <button class="close-btn" onclick="closeModal()">×</button></h3>
        <div class="form-row"><label>任务名称<input type="text" id="modalTaskName" value="${task?.name||''}"></label><label>一级分类<select id="modalTaskCategory"><option value="PVE" ${task?.category==='PVE'?'selected':''}>PVE</option><option value="PVP" ${task?.category==='PVP'?'selected':''}>PVP</option><option value="PVX" ${task?.category==='PVX'?'selected':''}>PVX</option><option value="__custom__" ${task&&!['PVE','PVP','PVX'].includes(task.category)?'selected':''}>其他</option></select></label><label id="modalCustomCatLabel" style="display:${task&&!['PVE','PVP','PVX'].includes(task.category)?'':'none'};">自定义<input type="text" id="modalCustomCat" value="${task&&!['PVE','PVP','PVX'].includes(task.category)?task.category:''}"></label></div>
        <div class="form-row"><label>二级类型<select id="modalTaskType"><option value="daily" ${task?.type==='daily'?'selected':''}>日常</option><option value="smallWeekly" ${task?.type==='smallWeekly'?'selected':''}>小周常</option><option value="bigWeekly" ${task?.type==='bigWeekly'?'selected':''}>大周常</option><option value="limited" ${task?.type==='limited'?'selected':''}>限时</option><option value="__customType__" ${task?.type==='custom'?'selected':''}>自定义</option></select></label><label id="modalCustomTypeLabel" style="display:${task?.type==='custom'?'':'none'};">自定义类型名<input type="text" id="modalCustomTypeName" value="${task?.typeName||''}"></label><label>默认收益<input type="number" id="modalTaskReward" value="${task?.defaultReward||0}" step="0.01"></label><label>完成条件<input type="number" id="modalTaskCondition" value="${task?.condition||1}" min="1" ${(task&&task.type!=='limited'&&task.type!=='custom')?'disabled':''}></label></div>
        <div class="form-row"><label>开始日期<input type="date" id="modalStart" value="${task?.startDate||''}"></label><label>结束日期<input type="date" id="modalEnd" value="${task?.endDate||''}"></label><label>持续天数<input type="number" id="modalDuration" value="${task?.duration||''}" placeholder="自动"></label></div>
        <div class="form-row"><label>备注<textarea id="modalRemark">${task?.remark||''}</textarea></label></div>
        <div class="form-row"><label>分配给角色 <span class="select-all-btn" id="toggleAllRolesBtn">全选/取消</span></label><div id="modalRoleCheckboxes" style="display:flex;flex-wrap:wrap;gap:6px;"></div></div>
        <button class="btn btn-primary" id="saveTaskBtn">${task?'💾 更新任务':'✅ 保存任务'}</button>
    </div></div>`;
    document.getElementById('modalContainer').innerHTML = html;

    renderModalRoleTags(task?.assignedRoles||[]);

    document.getElementById('toggleAllRolesBtn').addEventListener('click', toggleAllModalRoles);

    document.getElementById('modalStart').addEventListener('change', ()=>autoCalcDates('modalStart','modalEnd','modalDuration'));
    document.getElementById('modalEnd').addEventListener('change', ()=>autoCalcDates('modalStart','modalEnd','modalDuration'));
    document.getElementById('modalDuration').addEventListener('input', ()=>autoCalcEndFromDuration('modalStart','modalDuration','modalEnd'));

    document.getElementById('modalTaskCategory').addEventListener('change', function(){
        document.getElementById('modalCustomCatLabel').style.display = this.value==='__custom__'?'':'none';
    });
    document.getElementById('modalTaskType').addEventListener('change', function(){
        document.getElementById('modalCustomTypeLabel').style.display = this.value==='__customType__'?'':'none';
        const cond = document.getElementById('modalTaskCondition');
        if(this.value==='limited'||this.value==='__customType__'){
            cond.disabled = false;
        } else {
            cond.disabled = true;
            cond.value = 1;
        }
    });

    document.getElementById('saveTaskBtn').addEventListener('click', function(){
        saveTaskFromModal(editTaskId);
    });
}

function renderModalRoleTags(selectedIds=[]){
    document.getElementById('modalRoleCheckboxes').innerHTML = appRoles.map(r=>
        `<span class="role-tag ${selectedIds.includes(r.id)?'selected':''}" data-roleid="${r.id}">${r.name}</span>`
    ).join('');
    document.querySelectorAll('#modalRoleCheckboxes .role-tag').forEach(tag => {
        tag.addEventListener('click', function(){
            this.classList.toggle('selected');
        });
    });
}
function toggleAllModalRoles(){
    const tags = document.querySelectorAll('#modalRoleCheckboxes .role-tag');
    const allSelected = [...tags].every(t => t.classList.contains('selected'));
    tags.forEach(t => {
        if(allSelected) t.classList.remove('selected');
        else t.classList.add('selected');
    });
}
function saveTaskFromModal(editId){
    const name = document.getElementById('modalTaskName').value.trim();
    let category = document.getElementById('modalTaskCategory').value;
    if(category==='__custom__') category = document.getElementById('modalCustomCat').value.trim();
    if(!name||!category) return alert('名称和分类必填');

    let type = document.getElementById('modalTaskType').value;
    let typeName = '';
    if(type==='__customType__'){
        type = 'custom';
        typeName = document.getElementById('modalCustomTypeName').value.trim();
        if(!typeName) return alert('请输入自定义类型名');
    }

    const reward = parseFloat(document.getElementById('modalTaskReward').value)||0;
    const condition = parseInt(document.getElementById('modalTaskCondition').value)||1;
    const start = document.getElementById('modalStart').value;
    const end = document.getElementById('modalEnd').value;
    const dur = parseInt(document.getElementById('modalDuration').value)||0;
    const remark = document.getElementById('modalRemark').value.trim();

    const selectedIds = [...document.querySelectorAll('#modalRoleCheckboxes .role-tag.selected')]
        .map(t => t.dataset.roleid)
        .filter(Boolean);
    if(!selectedIds.length) return alert('请至少选择一个角色');

    if(editId){
        const task = appTasks.find(t=>t.id===editId);
        if(!task) return;
        Object.assign(task, {name,category,type,typeName,defaultReward:reward,condition,startDate:start,endDate:end,duration:dur,remark,assignedRoles:selectedIds});
    } else {
        appTasks.push({
            id:genId(), name, category, type, typeName, defaultReward:reward,
            condition, startDate:start, endDate:end, duration:dur, remark, assignedRoles:selectedIds
        });
    }
    saveAll();
    closeModal();
    if(document.getElementById('tab-record').classList.contains('active')) renderTaskView();
    if(document.getElementById('tab-home').classList.contains('active')) renderHome();
}

// ==================== 管理任务模态 ====================
function showManageTasksModal(){
    let html = `<div class="modal-overlay" onclick="closeModal()"><div class="modal" onclick="event.stopPropagation()"><h3>🗂️ 管理任务 <button class="close-btn" onclick="closeModal()">×</button></h3><div id="manageTaskListContainer"></div></div></div>`;
    document.getElementById('modalContainer').innerHTML = html;
    renderManageTaskList();
}
function renderManageTaskList(){
    const container = document.getElementById('manageTaskListContainer');
    if(!container) return;
    if(!appTasks.length){ container.innerHTML = '<p>暂无任务</p>'; return; }
    const grouped = {};
    appTasks.forEach(t => {
        if(!grouped[t.category]) grouped[t.category] = [];
        grouped[t.category].push(t);
    });
    let html = '';
    for(const [cat, tasks] of Object.entries(grouped)){
        html += `<div style="margin-bottom:12px;"><strong>${cat}</strong>`;
        tasks.forEach(t => {
            let d = {'daily':'日常','smallWeekly':'小周常','bigWeekly':'大周常','limited':'限时'}[t.type] || t.typeName || '自定义';
            html += `<div class="task-card">
                <div class="task-info"><b>${t.name}</b> <small>(${d})</small><br><small>收益:${t.defaultReward}|条件:${t.condition}次</small></div>
                <div class="task-actions">
                    <button class="btn btn-sm edit-task-btn" data-taskid="${t.id}">编辑</button>
                    <button class="btn btn-sm btn-danger delete-task-btn" data-taskid="${t.id}">删除</button>
                </div>
            </div>`;
        });
        html += '</div>';
    }
    container.innerHTML = html;

    document.querySelectorAll('.edit-task-btn').forEach(btn => {
        btn.addEventListener('click', function(e){
            e.stopPropagation();
            const taskId = this.dataset.taskid;
            closeModal();
            showAddTaskModal(taskId);
        });
    });
    document.querySelectorAll('.delete-task-btn').forEach(btn => {
        btn.addEventListener('click', function(e){
            e.stopPropagation();
            const taskId = this.dataset.taskid;
            deleteTaskFromManage(taskId);
        });
    });
}
function deleteTaskFromManage(taskId){
    if(!confirm('确定删除吗？')) return;
    appTasks = appTasks.filter(t => t.id !== taskId);
    saveAll();
    renderManageTaskList();
    if(document.getElementById('tab-record').classList.contains('active')) renderTaskView();
    if(document.getElementById('tab-home').classList.contains('active')) renderHome();
}

function autoCalcDates(s,e,d){
    const start = document.getElementById(s).value;
    const end = document.getElementById(e).value;
    if(start&&end) document.getElementById(d).value = Math.max(0, (new Date(end)-new Date(start))/86400000);
}
function autoCalcEndFromDuration(s,d,e){
    const start = document.getElementById(s).value;
    const dur = parseInt(document.getElementById(d).value);
    if(start && !isNaN(dur) && dur>=0){
        const dt = new Date(start);
        dt.setDate(dt.getDate()+dur);
        document.getElementById(e).value = dt.toISOString().split('T')[0];
    }
}

// ==================== 标签切换 ====================
document.getElementById('tabNav').addEventListener('click', e => {
    if(e.target.tagName !== 'BUTTON') return;
    document.querySelectorAll('#tabNav button').forEach(b=>b.classList.remove('active'));
    e.target.classList.add('active');
    document.querySelectorAll('.tab-content').forEach(c=>c.classList.remove('active'));
    const tabId = 'tab-' + e.target.dataset.tab;
    document.getElementById(tabId).classList.add('active');

    if(e.target.dataset.tab === 'home') renderHome();
    if(e.target.dataset.tab === 'record') { renderRecordRoleList(); renderTaskView(); }
    if(e.target.dataset.tab === 'analysis') { initAnalysisPage(); renderAnalysis(); }
});

// ==================== 首页 ====================
let selectedHomeRoles = new Set();
function getPendingCount(roleId){
    const today = getToday();
    let count = 0;
    appTasks.forEach(t => {
        if(t.type==='daily' && isTaskVisibleForRole(t,roleId) && !appRecords[`${roleId}_${t.id}_${today}`]) count++;
    });
    return count;
}
function renderHome(){
    document.getElementById('roleCountBadge').textContent = appRoles.length;
    const container = document.getElementById('roleCardsContainer');
    if(!appRoles.length){
        container.innerHTML = '<p style="color:var(--text-light);text-align:center;">暂无角色，点击右下角+号添加</p>';
    } else {
        container.innerHTML = appRoles.map(r => {
            const pending = getPendingCount(r.id);
            return `<div class="role-card ${selectedHomeRoles.has(r.id)?'selected':''}" data-roleid="${r.id}">
                <div class="pending-count ${pending===0?'zero':''}">${pending}</div>
                <div class="role-name">${r.name}</div>
                <div class="role-server">${r.server}</div>
                <div class="role-meta"><span>${r.faction}</span><span>${r.bodyType}</span></div>
            </div>`;
        }).join('');
        document.querySelectorAll('#roleCardsContainer .role-card').forEach(card => {
            card.addEventListener('click', function(){
                const roleId = this.dataset.roleid;
                toggleHomeRole(roleId);
            });
        });
    }

    const today = getToday();
    let totalPending = 0, todayIncome = 0, todayExpense = 0, weekIncome = 0;
    appRoles.forEach(r => {
        appTasks.forEach(t => {
            if(t.type==='daily' && isTaskVisibleForRole(t,r.id) && !appRecords[`${r.id}_${t.id}_${today}`]) totalPending++;
        });
    });
    Object.values(appRecords).forEach(rec => {
        if(rec.completedAt && rec.completedAt.startsWith(today)){
            todayIncome += rec.income||0;
            (rec.expenses||[]).forEach(ex => todayExpense += ex.amount||0);
        }
    });
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);
    weekStart.setHours(0,0,0,0);
    Object.values(appRecords).forEach(rec => {
        if(rec.completedAt && new Date(rec.completedAt) >= weekStart) weekIncome += rec.income||0;
    });

    document.getElementById('statCardsContainer').innerHTML = `
        <div class="stat-card glass-card"><div class="stat-value">${totalPending}</div><div class="stat-label">今日待完成</div></div>
        <div class="stat-card glass-card"><div class="stat-value">${formatCurrency(todayIncome)}</div><div class="stat-label">今日收入</div></div>
        <div class="stat-card glass-card"><div class="stat-value">${formatCurrency(todayExpense)}</div><div class="stat-label">今日支出</div></div>
        <div class="stat-card glass-card"><div class="stat-value">${formatCurrency(weekIncome)}</div><div class="stat-label">本周收入</div></div>
    `;

    const recs = Object.entries(appRecords).sort((a,b)=>new Date(b[1].completedAt||0)-new Date(a[1].completedAt||0)).slice(0,6);
    let actHtml = '';
    if(recs.length === 0){
        actHtml = '<p style="color:var(--text-light);font-size:0.8rem;">暂无活动记录</p>';
    } else {
        recs.forEach(([key,rec]) => {
            const [rid,tid,ds] = key.split('_');
            const role = appRoles.find(r=>r.id===rid);
            const task = appTasks.find(t=>t.id===tid);
            if(role && task){
                const time = ds.slice(5);
                const net = rec.income - (rec.expenses||[]).reduce((s,e)=>s+e.amount,0);
                actHtml += `<div class="timeline-item"><span class="time">${time}</span><span class="desc">${role.name} · ${task.name}</span><span class="amount ${net>=0?'positive':'negative'}">${formatCurrency(net)}</span></div>`;
            }
        });
    }
    document.getElementById('recentActivityList').innerHTML = actHtml;

    const weekStats = {};
    appRoles.forEach(r => weekStats[r.id] = {name:r.name, income:0, expense:0});
    Object.entries(appRecords).forEach(([key,rec]) => {
        const [rid] = key.split('_');
        if(rec.completedAt && new Date(rec.completedAt) >= weekStart && weekStats[rid]){
            weekStats[rid].income += rec.income||0;
            (rec.expenses||[]).forEach(ex => weekStats[rid].expense += ex.amount||0);
        }
    });
    const sorted = Object.values(weekStats).sort((a,b)=>(b.income-b.expense)-(a.income-a.expense));
    const topEarn = sorted.slice(0,3);
    const topSpend = [...sorted].sort((a,b)=>b.expense-a.expense).slice(0,3);
    let repHtml = '<div style="display:flex;gap:12px;font-size:0.82rem;"><div style="flex:1;"><strong>💰 最会赚钱</strong><ul class="rank-list">';
    topEarn.forEach((s,i) => {
        const icons = ['🥇','🥈','🥉'];
        repHtml += `<li><span>${icons[i]} ${s.name}</span><span class="gold-text">${formatCurrency(s.income-s.expense)}</span></li>`;
    });
    repHtml += '</ul></div><div style="flex:1;"><strong>💸 最会花钱</strong><ul class="rank-list">';
    topSpend.forEach((s,i) => {
        const icons = ['🔥','💧','🍃'];
        repHtml += `<li><span>${icons[i]} ${s.name}</span><span style="color:var(--danger);">${formatCurrency(s.expense)}</span></li>`;
    });
    repHtml += '</ul></div></div>';
    document.getElementById('weekReport').innerHTML = repHtml;

    document.getElementById('dailyQuote').textContent = '—— ' + QUOTES[new Date().getDate() % QUOTES.length];
}
function toggleHomeRole(id){
    if(selectedHomeRoles.has(id)) selectedHomeRoles.delete(id);
    else selectedHomeRoles.add(id);
    renderHome();
}
document.getElementById('fortuneBtn').addEventListener('click', function(){
    const res = FORTUNES[Math.floor(Math.random()*FORTUNES.length)];
    const el = document.getElementById('fortuneResult');
    el.classList.add('ing');
    el.innerHTML = `<span class="divine">${res.icon}</span>${res.text}<br><small style="color:var(--text-light);">${res.desc}</small>`;
    setTimeout(()=>el.classList.remove('ing'),600);
});

// ==================== 任务记录 ====================
let recordSelectedRoles = new Set();
let currentView = 'day';
let currentRecordDate = getToday();

function renderRecordRoleList(){
    const container = document.getElementById('recordRoleList');
    container.innerHTML = appRoles.map(r => `
        <label><input type="checkbox" value="${r.id}" ${recordSelectedRoles.has(r.id)?'checked':''}> ${r.name}</label>
    `).join('');
    container.querySelectorAll('input[type="checkbox"]').forEach(cb => {
        cb.addEventListener('change', function(){
            toggleRecordRole(this.value, this.checked);
        });
    });
}
function toggleRecordRole(id, checked){
    if(checked) recordSelectedRoles.add(id);
    else recordSelectedRoles.delete(id);
    renderTaskView();
}
document.getElementById('recordDatePicker').addEventListener('change', function(){
    currentRecordDate = this.value;
    renderTaskView();
});
document.querySelector('.view-toggle').addEventListener('click', e => {
    if(e.target.tagName !== 'BUTTON') return;
    document.querySelectorAll('.view-toggle button').forEach(b=>b.classList.remove('active'));
    e.target.classList.add('active');
    currentView = e.target.dataset.view;
    renderTaskView();
});
document.getElementById('filterCategory').addEventListener('change', renderTaskView);
document.getElementById('filterType').addEventListener('change', renderTaskView);
document.getElementById('filterStatus').addEventListener('change', renderTaskView);

function updateFilterOptions(){
    document.getElementById('filterCategory').innerHTML = '<option value="all">全部分类</option>' +
        [...new Set(appTasks.map(t=>t.category).filter(Boolean))].map(c=>`<option value="${c}">${c}</option>`).join('');
    document.getElementById('filterType').innerHTML = '<option value="all">全部类型</option><option value="daily">日常</option><option value="smallWeekly">小周常</option><option value="bigWeekly">大周常</option><option value="limited">限时</option><option value="custom">自定义</option>';
    document.getElementById('filterStatus').innerHTML = '<option value="all">全部状态</option><option value="done">已完成</option><option value="undone">未完成</option>';
}
function renderTaskView(){
    const roles = appRoles.filter(r => recordSelectedRoles.has(r.id));
    if(!roles.length){
        document.getElementById('taskViewContent').innerHTML = '<p style="color:var(--text-light);">请选择角色</p>';
        return;
    }
    const cat = document.getElementById('filterCategory').value;
    const type = document.getElementById('filterType').value;
    const status = document.getElementById('filterStatus').value;
    let tasks = appTasks.filter(t => 
        (cat==='all' || t.category===cat) && 
        (type==='all' || (type==='custom'?t.type==='custom':t.type===type))
    );
    tasks = tasks.filter(t => isTaskActiveInDate(t, currentRecordDate));
    if(currentView === 'day') renderDayView(roles, tasks, status);
    else if(currentView === 'week') renderWeekView(roles, tasks, status);
    else renderMonthView(roles, tasks, status);
}

function onTaskCellClick(roleId, taskId, dateStr){
    const recordKey = `${roleId}_${taskId}_${dateStr}`;
    const task = appTasks.find(t=>t.id===taskId);
    const role = appRoles.find(r=>r.id===roleId);
    if(!task||!role) return;
    if(appRecords[recordKey]){
        if(confirm(`确定将「${role.name}」的「${task.name}」标记为未完成吗？`)){
            delete appRecords[recordKey];
            saveAll();
            renderTaskView();
            renderHome();
        }
    } else {
        showCompleteModal(role, task, dateStr);
    }
}
function showCompleteModal(role, task, dateStr){
    let modalHTML = `<div class="modal-overlay"><div class="modal"><button class="close-btn" onclick="closeModal()">×</button><h3>✅ 完成任务</h3>
        <div style="background:var(--task-card-bg);padding:12px;border-radius:8px;margin-bottom:16px;">
            <strong>${role.name}</strong> · ${task.name}<br><small>${dateStr}</small>
        </div>
        <label style="display:block;margin-bottom:12px;">收入 (${currencyData.unit})
            <input type="number" id="incomeInput" value="${task.defaultReward||0}" step="0.01" style="width:100%;padding:8px;border:1px solid var(--border);border-radius:6px;background:var(--input-bg);color:var(--text);">
        </label>
        <div style="margin-bottom:8px;"><strong>支出明细</strong></div>
        <div id="expenseList"></div>
        <button class="btn btn-sm" id="addExpenseBtn">+ 添加支出</button>
        <div style="text-align:right;margin-top:16px;">
            <button class="btn" style="background:#b2bec3;color:#fff;" onclick="closeModal()">取消</button>
            <button class="btn btn-primary" id="confirmCompleteBtn">确认完成</button>
        </div>
    </div></div>`;
    document.getElementById('modalContainer').innerHTML = modalHTML;
    document.getElementById('addExpenseBtn').addEventListener('click', addExpenseRow);
    document.getElementById('confirmCompleteBtn').addEventListener('click', function(){
        confirmComplete(role.id, task.id, dateStr);
    });
}
function addExpenseRow(){
    const div = document.getElementById('expenseList');
    const row = document.createElement('div');
    row.className = 'expense-row';
    row.innerHTML = `<input type="number" placeholder="金额" class="expense-amount" step="0.01"><input type="text" placeholder="备注" class="expense-note"><button class="btn btn-sm btn-danger" onclick="this.parentElement.remove()">删除</button>`;
    div.appendChild(row);
}
function confirmComplete(roleId, taskId, dateStr){
    const income = parseFloat(document.getElementById('incomeInput').value) || 0;
    const rows = document.querySelectorAll('#expenseList .expense-row');
    let expenses = [];
    rows.forEach(r => {
        const amt = parseFloat(r.querySelector('.expense-amount').value) || 0;
        const note = r.querySelector('.expense-note').value.trim() || '无备注';
        if(amt > 0) expenses.push({amount:amt, note});
    });
    appRecords[`${roleId}_${taskId}_${dateStr}`] = {
        completed: true,
        income: income,
        expenses: expenses,
        completedAt: new Date().toISOString()
    };
    saveAll();
    closeModal();
    renderTaskView();
    renderHome();
}

function renderDayView(roles, tasks, status){
    let html = '<table class="task-table"><thead><tr><th>角色</th>';
    tasks.forEach(t => html += `<th>${t.name}</th>`);
    html += '</tr></thead><tbody>';
    roles.forEach(r => {
        html += `<tr><td><strong>${r.name}</strong></td>`;
        tasks.forEach(t => {
            if(!isTaskVisibleForRole(t, r.id)){ html += '<td>-</td>'; return; }
            const done = appRecords[`${r.id}_${t.id}_${currentRecordDate}`];
            if(status==='all' || (status==='done' && done) || (status==='undone' && !done)){
                html += `<td class="${done?'done':'undone'}" data-roleid="${r.id}" data-taskid="${t.id}" data-date="${currentRecordDate}">${done?'✅':'❌'}</td>`;
            } else {
                html += '<td></td>';
            }
        });
        html += '</tr>';
    });
    html += '</tbody></table>';
    document.getElementById('taskViewContent').innerHTML = html;
    // 绑定点击事件
    document.querySelectorAll('.done, .undone').forEach(cell => {
        cell.addEventListener('click', function(){
            const roleId = this.dataset.roleid;
            const taskId = this.dataset.taskid;
            const date = this.dataset.date;
            onTaskCellClick(roleId, taskId, date);
        });
    });
}
function renderWeekView(roles, tasks, status){
    const now = new Date(currentRecordDate+'T12:00:00');
    const dow = now.getDay();
    const off = dow===0 ? -6 : 1-dow;
    const mon = new Date(now);
    mon.setDate(now.getDate()+off);
    const weekDates = [], days = ['周一','周二','周三','周四','周五','周六','周日'];
    for(let i=0; i<7; i++){
        const d = new Date(mon);
        d.setDate(mon.getDate()+i);
        weekDates.push(d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'));
    }
    let html = '<table class="task-table"><thead><tr><th>任务</th>';
    days.forEach((d,i) => html += `<th>${d}<br><span style="font-size:0.65rem;">${weekDates[i].slice(5)}</span></th>`);
    html += '</tr></thead><tbody>';
    tasks.forEach(t => {
        html += `<tr><td><strong>${t.name}</strong></td>`;
        weekDates.forEach(ds => {
            if(!isTaskActiveInDate(t, ds)){ html += '<td>-</td>'; return; }
            let done = 0, total = 0;
            roles.forEach(r => {
                if(isTaskVisibleForRole(t, r.id)){
                    total++;
                    if(appRecords[`${r.id}_${t.id}_${ds}`]) done++;
                }
            });
            if(total === 0){ html += '<td>-</td>'; return; }
            const undone = total - done;
            if(total === 1){
                html += `<td class="${done?'done':'undone'} count-cell" data-roleid="${roles[0].id}" data-taskid="${t.id}" data-date="${ds}">${done?'✅':'❌'}</td>`;
            } else {
                html += `<td class="count-cell" data-taskid="${t.id}" data-date="${ds}">${done}/${undone}</td>`;
            }
        });
        html += '</tr>';
    });
    html += '</tbody></table>';
    document.getElementById('taskViewContent').innerHTML = html;
    // 绑定点击事件
    document.querySelectorAll('.count-cell').forEach(cell => {
        cell.addEventListener('click', function(){
            const taskId = this.dataset.taskid;
            const date = this.dataset.date;
            const roleId = this.dataset.roleid;
            if(roleId){
                onTaskCellClick(roleId, taskId, date);
            } else {
                showWeekDetail(taskId, date);
            }
        });
    });
}
function showWeekDetail(taskId, dateStr){
    const task = appTasks.find(t=>t.id===taskId);
    const roles = appRoles.filter(r => recordSelectedRoles.has(r.id) && isTaskVisibleForRole(task, r.id));
    let done = [], undone = [];
    roles.forEach(r => {
        if(appRecords[`${r.id}_${taskId}_${dateStr}`]) done.push(r.name);
        else undone.push(r.name);
    });
    document.getElementById('modalContainer').innerHTML = `
        <div class="modal-overlay" onclick="closeModal()"><div class="modal"><button class="close-btn" onclick="closeModal()">×</button>
            <h3>${task?.name||''} - ${dateStr}</h3>
            <p>✅ 已完成：${done.join('、')||'无'}</p>
            <p>❌ 未完成：${undone.join('、')||'无'}</p>
        </div></div>`;
}
function renderMonthView(roles, tasks, status){
    const now = new Date(currentRecordDate+'T12:00:00');
    const y = now.getFullYear(), m = now.getMonth();
    const dim = new Date(y, m+1, 0).getDate();
    const fday = new Date(y, m, 1).getDay();
    let html = `<h3 style="text-align:center;">${y}年${m+1}月</h3><div style="display:grid;grid-template-columns:repeat(7,1fr);gap:4px;text-align:center;">`;
    ['日','一','二','三','四','五','六'].forEach(d => html += `<div style="font-weight:700;font-size:0.8rem;color:var(--text-light);">${d}</div>`);
    for(let i=0; i<fday; i++) html += '<div></div>';
    for(let d=1; d<=dim; d++){
        const ds = `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
        let done = 0, total = 0;
        roles.forEach(r => tasks.forEach(t => {
            if(!isTaskActiveInDate(t, ds)) return;
            if(isTaskVisibleForRole(t, r.id)){
                total++;
                if(appRecords[`${r.id}_${t.id}_${ds}`]) done++;
            }
        }));
        const undone = total - done;
        html += `<div style="background:var(--card-bg);border-radius:8px;padding:4px;min-height:55px;cursor:pointer;border:1px solid var(--border);font-size:0.8rem;" data-date="${ds}">
            <div style="font-weight:700;">${d}</div>
            <div style="font-size:0.65rem;color:${undone>0?'var(--danger)':'var(--success)'};">${total?done+'/'+total:'-'}</div>
        </div>`;
    }
    html += '</div>';
    document.getElementById('taskViewContent').innerHTML = html;
    document.querySelectorAll('[data-date]').forEach(day => {
        day.addEventListener('click', function(){
            goToDay(this.dataset.date);
        });
    });
}
function goToDay(ds){
    currentRecordDate = ds;
    document.getElementById('recordDatePicker').value = ds;
    currentView = 'day';
    document.querySelectorAll('.view-toggle button').forEach(b=>b.classList.remove('active'));
    document.querySelector('[data-view="day"]').classList.add('active');
    renderTaskView();
}

// ==================== 盈亏分析 ====================
let analysisCharts = [];
let currentChartType = 'bar';
let currentDimension = 'net';

function getFactionAbbr(faction) {
    const map = {'万花':'花','七秀':'秀','少林':'僧','天策':'策','纯阳':'道','藏剑':'剑','五毒':'毒','唐门':'唐','明教':'明','丐帮':'丐','苍云':'苍','长歌':'歌','霸刀':'刀','蓬莱':'蓬','凌雪阁':'凌','衍天宗':'衍','药宗':'药','刀宗':'刀','万灵':'灵'};
    return map[faction] || faction.charAt(0);
}
function renderAnalysisRoleCards(){
    const container = document.getElementById('analysisRoleCards');
    if(!container) return;
    const selectedIds = getAnalysisSelectedIds();
    container.innerHTML = appRoles.map(r => {
        const selected = selectedIds.includes(r.id);
        const abbr = getFactionAbbr(r.faction);
        return `<div class="role-card ${selected?'selected':''}" data-roleid="${r.id}">
            <span style="font-weight:600;">${r.name}·${abbr}</span>
            <span style="font-size:0.7rem;color:var(--text-light);">${r.server}</span>
        </div>`;
    }).join('');
    document.querySelectorAll('#analysisRoleCards .role-card').forEach(card => {
        card.addEventListener('click', function(){
            this.classList.toggle('selected');
            renderAnalysis();
        });
    });
}
function getAnalysisSelectedIds(){
    const cards = document.querySelectorAll('#analysisRoleCards .role-card.selected');
    return [...cards].map(c => c.dataset.roleid);
}
function renderAnalysis(){
    analysisCharts.forEach(c => c.destroy());
    analysisCharts = [];
    const selectedIds = getAnalysisSelectedIds();
    const {start, end} = getAnalysisRange();
    const selectedRoles = appRoles.filter(r => selectedIds.includes(r.id));
    if(!selectedRoles.length){
        document.getElementById('analysisSummary').innerHTML = '';
        document.getElementById('analysisCharts').innerHTML = '<p style="text-align:center;color:var(--text-light);">请选择至少一个角色</p>';
        return;
    }
    let totalIncome = 0, totalExpense = 0;
    const roleStats = {};
    selectedRoles.forEach(r => roleStats[r.id] = {name:r.name, income:0, expense:0});
    const dailyMap = {}, roleDailyMap = {}, taskIncome = {};
    Object.entries(appRecords).forEach(([key, rec]) => {
        const [rid, tid, ds] = key.split('_');
        if(!roleStats[rid]) return;
        const d = new Date(ds + 'T12:00:00');
        if(d >= start && d <= end){
            const inc = rec.income || 0;
            const exp = (rec.expenses || []).reduce((s, e) => s + e.amount, 0);
            roleStats[rid].income += inc;
            roleStats[rid].expense += exp;
            totalIncome += inc;
            totalExpense += exp;
            if(!dailyMap[ds]) dailyMap[ds] = {income:0, expense:0};
            dailyMap[ds].income += inc;
            dailyMap[ds].expense += exp;
            if(!roleDailyMap[rid]) roleDailyMap[rid] = {};
            if(!roleDailyMap[rid][ds]) roleDailyMap[rid][ds] = {income:0, expense:0};
            roleDailyMap[rid][ds].income += inc;
            roleDailyMap[rid][ds].expense += exp;
            if(selectedRoles.length === 1 && rid === selectedRoles[0].id){
                const task = appTasks.find(t => t.id === tid);
                const name = task ? task.name : '其他';
                taskIncome[name] = (taskIncome[name] || 0) + inc;
            }
        }
    });
    document.getElementById('analysisSummary').innerHTML = `
        <div class="stat-card glass-card"><div class="stat-value">${formatCurrency(totalIncome)}</div><div class="stat-label">总收入</div></div>
        <div class="stat-card glass-card"><div class="stat-value">${formatCurrency(totalExpense)}</div><div class="stat-label">总支出</div></div>
        <div class="stat-card glass-card"><div class="stat-value" style="color:${totalIncome-totalExpense>=0?'var(--success)':'var(--danger)'}">${formatCurrency(totalIncome-totalExpense)}</div><div class="stat-label">净盈亏</div></div>
    `;
    const chartsDiv = document.getElementById('analysisCharts');
    const dates = Object.keys(dailyMap).sort();
    const names = selectedRoles.map(r => r.name);
    let chartHTML = '';
    if(selectedRoles.length === 1){
        if(currentChartType === 'bar') currentChartType = 'line';
        const singleRole = selectedRoles[0];
        chartHTML += `<div class="chart-card-wrapper glass-card" style="margin-bottom:16px;">
            <div class="chart-switch-bar">
                <button class="switch-btn ${currentChartType==='line'?'active':''}" id="btn-line">折线图</button>
                <button class="switch-btn ${currentChartType==='pie'?'active':''}" id="btn-pie">饼状图</button>
            </div>
            <canvas id="singleChart"></canvas>
        </div>`;
        chartsDiv.innerHTML = chartHTML;
        document.getElementById('btn-line').addEventListener('click', ()=> switchChartType('line'));
        document.getElementById('btn-pie').addEventListener('click', ()=> switchChartType('pie'));
        if(currentChartType === 'line'){
            const ctx = document.getElementById('singleChart').getContext('2d');
            analysisCharts.push(new Chart(ctx, {
                type:'line',
                data:{
                    labels:dates,
                    datasets:[
                        {label:'收入', data:dates.map(d=>dailyMap[d].income), borderColor:'#00b894', tension:0.3},
                        {label:'支出', data:dates.map(d=>dailyMap[d].expense), borderColor:'#e17055', tension:0.3}
                    ]
                },
                options:{plugins:{title:{display:true,text:`${singleRole.name} 收支走向`}}}
            }));
        } else {
            const ctx = document.getElementById('singleChart').getContext('2d');
            analysisCharts.push(new Chart(ctx, {
                type:'pie',
                data:{labels:Object.keys(taskIncome), datasets:[{data:Object.values(taskIncome)}]},
                options:{plugins:{title:{display:true,text:'收入来源'}}}
            }));
        }
    } else {
        chartHTML += `<div class="chart-card-wrapper glass-card" style="margin-bottom:16px;">
            <div class="dimension-bar">
                <button class="dimension-btn ${currentDimension==='net'?'active':''}" id="btn-net">净盈亏</button>
                <button class="dimension-btn ${currentDimension==='income'?'active':''}" id="btn-income">收入</button>
                <button class="dimension-btn ${currentDimension==='expense'?'active':''}" id="btn-expense">支出</button>
            </div>
            <div class="chart-switch-bar">
                <button class="switch-btn ${currentChartType==='bar'?'active':''}" id="btn-bar">柱状图</button>
                <button class="switch-btn ${currentChartType==='line'?'active':''}" id="btn-line2">折线图</button>
                <button class="switch-btn ${currentChartType==='pie'?'active':''}" id="btn-pie2">饼状图</button>
            </div>
            <canvas id="mainChart"></canvas>
        </div>`;
        chartsDiv.innerHTML = chartHTML;
        document.getElementById('btn-net').addEventListener('click', ()=> switchDimension('net'));
        document.getElementById('btn-income').addEventListener('click', ()=> switchDimension('income'));
        document.getElementById('btn-expense').addEventListener('click', ()=> switchDimension('expense'));
        document.getElementById('btn-bar').addEventListener('click', ()=> switchChartType('bar'));
        document.getElementById('btn-line2').addEventListener('click', ()=> switchChartType('line'));
        document.getElementById('btn-pie2').addEventListener('click', ()=> switchChartType('pie'));

        const ctx = document.getElementById('mainChart').getContext('2d');
        if(currentChartType === 'bar'){
            const data = selectedRoles.map(r => {
                if(currentDimension==='income') return roleStats[r.id].income;
                if(currentDimension==='expense') return roleStats[r.id].expense;
                return roleStats[r.id].income - roleStats[r.id].expense;
            });
            const bg = data.map(v => {
                if(currentDimension==='expense') return 'rgba(225,112,85,0.7)';
                if(currentDimension==='income') return 'rgba(0,184,148,0.7)';
                return v>=0?'rgba(0,184,148,0.7)':'rgba(225,112,85,0.7)';
            });
            analysisCharts.push(new Chart(ctx, {
                type:'bar',
                data:{labels:names, datasets:[{label:currentDimension==='net'?'净盈亏':(currentDimension==='income'?'收入':'支出'), data, backgroundColor:bg}]},
                options:{plugins:{title:{display:true,text:`各角色${currentDimension==='net'?'净盈亏':(currentDimension==='income'?'收入':'支出')}对比`}}}
            }));
        } else if(currentChartType === 'line'){
            const datasets = selectedRoles.map(r => {
                const color = '#'+Math.floor(Math.random()*16777215).toString(16).padStart(6,'0');
                const data = dates.map(d => {
                    const val = roleDailyMap[r.id]?.[d] || {income:0, expense:0};
                    if(currentDimension==='income') return val.income;
                    if(currentDimension==='expense') return val.expense;
                    return val.income - val.expense;
                });
                return {label:r.name, data, borderColor:color, tension:0.3, fill:false};
            });
            analysisCharts.push(new Chart(ctx, {
                type:'line',
                data:{labels:dates, datasets},
                options:{plugins:{title:{display:true,text:`各角色${currentDimension==='net'?'净盈亏':(currentDimension==='income'?'收入':'支出')}趋势`}}}
            }));
        } else {
            const data = selectedRoles.map(r => {
                if(currentDimension==='income') return roleStats[r.id].income;
                if(currentDimension==='expense') return roleStats[r.id].expense;
                return roleStats[r.id].income - roleStats[r.id].expense;
            });
            const bg = ['#6c5ce7','#00b894','#e17055','#fdcb6e','#a29bfe','#fd79a8','#0984e3','#e84393'];
            analysisCharts.push(new Chart(ctx, {
                type:'pie',
                data:{labels:names, datasets:[{data, backgroundColor:bg.slice(0, names.length)}]},
                options:{plugins:{title:{display:true,text:`各角色${currentDimension==='net'?'净盈亏':(currentDimension==='income'?'收入':'支出')}占比`}}}
            }));
        }
    }
}
function switchChartType(type){ currentChartType = type; renderAnalysis(); }
function switchDimension(dim){ currentDimension = dim; renderAnalysis(); }
function initAnalysisPage(){
    renderAnalysisRoleCards();
    document.getElementById('analysisPeriod').addEventListener('change', function(){
        document.getElementById('customDateLabel').style.display = this.value==='custom'?'':'none';
        renderAnalysis();
    });
    document.getElementById('analysisStart').addEventListener('change', renderAnalysis);
    document.getElementById('analysisEnd').addEventListener('change', renderAnalysis);
    if(!document.getElementById('analysisStart').value){
        const now = new Date();
        document.getElementById('analysisStart').value = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        document.getElementById('analysisEnd').value = now.toISOString().split('T')[0];
    }
}
function getAnalysisRange(){
    const period = document.getElementById('analysisPeriod').value;
    const today = new Date(); today.setHours(23,59,59,999);
    if(period === 'day') return {start:new Date(new Date().setHours(0,0,0,0)), end:today};
    if(period === 'week'){
        const d = new Date();
        const day = d.getDay();
        const s = new Date(d);
        s.setDate(d.getDate() - (day===0?6:day-1));
        s.setHours(0,0,0,0);
        return {start:s, end:today};
    }
    if(period === 'month') return {start:new Date(today.getFullYear(), today.getMonth(), 1), end:today};
    return {
        start:new Date(document.getElementById('analysisStart').value),
        end:new Date(document.getElementById('analysisEnd').value + 'T23:59:59')
    };
}

// ==================== 初始化 ====================
function init(){
    initTheme();
    document.getElementById('currencyUnit').value = currencyData.unit;
    document.getElementById('bigUnit').value = currencyData.bigUnit || '';
    document.getElementById('unitRate').value = currencyData.rate || 10000;
    document.getElementById('recordDatePicker').value = getToday();

    document.getElementById('currencyUnit').addEventListener('change', saveCurrencyUnit);
    document.getElementById('bigUnit').addEventListener('change', saveCurrencyUnit);
    document.getElementById('unitRate').addEventListener('change', saveCurrencyUnit);
    document.getElementById('btn-export').addEventListener('click', exportData);
    document.getElementById('btn-import').addEventListener('click', importData);
    document.querySelectorAll('.theme-option').forEach(opt => {
        opt.addEventListener('click', function(){
            setTheme(this.dataset.theme);
        });
    });

    renderHome();
    renderRecordRoleList();
    updateFilterOptions();
}
init();