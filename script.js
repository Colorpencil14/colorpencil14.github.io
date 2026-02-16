// ========================================
// 原版染料颜色对照表 (来自 CSV)
// ========================================
const DYE_COLORS = [
    { name: '黑色', dye: 'black', value: 1973019 },
    { name: '灰色', dye: 'gray', value: 4408131 },
    { name: '淡灰色', dye: 'light_gray', value: 11250603 },
    { name: '白色', dye: 'white', value: 15790320 },
    { name: '红色', dye: 'red', value: 11743532 },
    { name: '粉红色', dye: 'pink', value: 14188952 },
    { name: '橙色', dye: 'orange', value: 15435844 },
    { name: '黄色', dye: 'yellow', value: 14602026 },
    { name: '绿色', dye: 'green', value: 3887386 },
    { name: '黄绿色', dye: 'lime', value: 4312372 },
    { name: '青色', dye: 'cyan', value: 2651799 },
    { name: '淡蓝色', dye: 'light_blue', value: 6719955 },
    { name: '蓝色', dye: 'blue', value: 2437522 },
    { name: '紫色', dye: 'purple', value: 8073150 },
    { name: '品红色', dye: 'magenta', value: 12801229 },
    { name: '棕色', dye: 'brown', value: 5320730 },
];

// 爆炸形态
const EXPLOSION_TYPES = [
    { value: 0, label: '小型球状 (Small Ball)' },
    { value: 1, label: '大型球状 (Large Ball)' },
    { value: 2, label: '星形 (Star)' },
    { value: 3, label: '苦力怕状 (Creeper)' },
    { value: 4, label: '喷发状 (Burst)' },
];

// ========================================
// 颜色工具函数
// ========================================
function hslToRgb(h, s, l) {
    h = ((h % 360) + 360) % 360;
    s = Math.max(0, Math.min(1, s));
    l = Math.max(0, Math.min(1, l));
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs((h / 60) % 2 - 1));
    const m = l - c / 2;
    let r1, g1, b1;
    if (h < 60) { r1 = c; g1 = x; b1 = 0; }
    else if (h < 120) { r1 = x; g1 = c; b1 = 0; }
    else if (h < 180) { r1 = 0; g1 = c; b1 = x; }
    else if (h < 240) { r1 = 0; g1 = x; b1 = c; }
    else if (h < 300) { r1 = x; g1 = 0; b1 = c; }
    else { r1 = c; g1 = 0; b1 = x; }
    return [
        Math.round((r1 + m) * 255),
        Math.round((g1 + m) * 255),
        Math.round((b1 + m) * 255),
    ];
}

function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
    let h = 0, s = 0, l = (mx + mn) / 2;
    if (mx !== mn) {
        const d = mx - mn;
        s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
        if (mx === r) h = ((g - b) / d + (g < b ? 6 : 0)) * 60;
        else if (mx === g) h = ((b - r) / d + 2) * 60;
        else h = ((r - g) / d + 4) * 60;
    }
    return [h, s, l];
}

function hexToRgb(hex) {
    const n = parseInt(hex.replace('#', ''), 16);
    return [(n >> 16) & 0xFF, (n >> 8) & 0xFF, n & 0xFF];
}

function rgbToHex(r, g, b) {
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

const HARMONY_MODES = [
    { value: 'analogous', label: '类似色 (Analogous)' },
    { value: 'complementary', label: '互补色 (Complementary)' },
    { value: 'triadic', label: '三角色 (Triadic)' },
    { value: 'split', label: '分裂互补 (Split-Comp)' },
    { value: 'tetradic', label: '四角色 (Tetradic)' },
    { value: 'mono', label: '单色渐变 (Monochromatic)' },
    { value: 'rainbow', label: '彩虹 (Rainbow)' },
];

function generateHarmony(baseHex, mode) {
    const [r, g, b] = hexToRgb(baseHex);
    const [h, s, l] = rgbToHsl(r, g, b);
    const sOut = Math.max(s, 0.85);
    const lOut = Math.max(0.35, Math.min(0.65, l));
    const make = (hue, sat, lit) => {
        const [cr, cg, cb] = hslToRgb(hue, sat, lit);
        return { hex: rgbToHex(cr, cg, cb), dec: (cr << 16) + (cg << 8) + cb };
    };
    switch (mode) {
        case 'complementary':
            return [make(h, sOut, lOut), make((h + 180) % 360, sOut, lOut)];
        case 'analogous':
            return [make((h - 30 + 360) % 360, sOut, lOut), make(h, sOut, lOut), make((h + 30) % 360, sOut, lOut)];
        case 'triadic':
            return [make(h, sOut, lOut), make((h + 120) % 360, sOut, lOut), make((h + 240) % 360, sOut, lOut)];
        case 'split':
            return [make(h, sOut, lOut), make((h + 150) % 360, sOut, lOut), make((h + 210) % 360, sOut, lOut)];
        case 'tetradic':
            return [make(h, sOut, lOut), make((h + 90) % 360, sOut, lOut), make((h + 180) % 360, sOut, lOut), make((h + 270) % 360, sOut, lOut)];
        case 'mono':
            return [make(h, sOut, 0.25), make(h, sOut, 0.35), make(h, sOut, 0.50), make(h, sOut, 0.65), make(h, sOut, 0.80)];
        case 'rainbow':
            return [0, 30, 60, 120, 180, 210, 270, 330].map(o => make((h + o) % 360, sOut, lOut));
        default:
            return [make(h, sOut, lOut)];
    }
}

// ========================================
// 数据模型
// ========================================
let entities = [];
let entityIdCounter = 0;
let explosionIdCounter = 0;

function createExplosion() {
    return {
        id: ++explosionIdCounter,
        type: 0,
        colors: [],
        fadeColors: [],
        flicker: false,
        trail: false,
        _gen: {
            colors: { baseColor: '#ff0000', mode: 'analogous', results: [] },
            fadeColors: { baseColor: '#0088ff', mode: 'analogous', results: [] },
        },
    };
}

function createEntity() {
    return {
        id: ++entityIdCounter,
        weight: 1,
        lifeTime: 30,
        flight: 1,
        count: 1,
        explosions: [createExplosion()],
    };
}

// ========================================
// 刷怪笼下拉框：自定义输入处理
// ========================================
const customSelectFields = [
    'minSpawnDelay', 'maxSpawnDelay', 'spawnCount'
];

function initCustomInputs() {
    customSelectFields.forEach(name => {
        const sel = document.getElementById(name);
        const inp = document.getElementById(name + 'Custom');
        if (sel && inp) {
            sel.addEventListener('change', () => {
                if (sel.value === 'custom') { inp.classList.remove('hidden'); inp.focus(); }
                else { inp.classList.add('hidden'); inp.value = ''; }
            });
        }
    });
}

function getSelectValue(name) {
    // 直接输入框字段（高级参数）
    if (['delay', 'requiredPlayerRange', 'spawnRange', 'maxNearbyEntities'].includes(name)) {
        const inp = document.getElementById(name);
        return inp ? inp.value.trim() : '';
    }
    // 下拉框字段
    const sel = document.getElementById(name);
    if (!sel) return '';
    if (sel.value === 'custom') {
        const inp = document.getElementById(name + 'Custom');
        return inp ? inp.value.trim() : '';
    }
    return sel.value;
}

// ========================================
// 将十进制颜色值转为 CSS hex
// ========================================
function decToHex(val) {
    return '#' + (val & 0xFFFFFF).toString(16).padStart(6, '0');
}
function hexToDec(hex) {
    return parseInt(hex.replace('#', ''), 16);
}

// ========================================
// 渲染
// ========================================
function render() {
    const list = document.getElementById('entitiesList');
    if (entities.length === 0) { list.innerHTML = ''; return; }
    list.innerHTML = entities.map((ent, idx) => renderEntityCard(ent, idx)).join('');
    bindEntityEvents();
}

function renderEntityCard(ent, idx) {
    return `
    <div class="entity-card" data-entity-id="${ent.id}">
        <div class="entity-card-header">
            <span class="entity-card-title">🎆 烟花实体 #${idx + 1}</span>
            <button class="btn-remove" onclick="removeEntity(${ent.id})">× 删除</button>
        </div>

        <div class="entity-params">
            <div class="form-group">
                <label>权重 (Weight)
                    <span class="tooltip" data-tip="相对其他实体被选中的权重，值越大越容易被选中">?</span>
                </label>
                <input type="number" min="1" value="${ent.weight}"
                       onchange="updateEntity(${ent.id}, 'weight', this.value)">
            </div>
            <div class="form-group">
                <label>存活时间 (LifeTime)
                    <span class="tooltip" data-tip="烟花火箭的存活时间(ticks)，影响爆炸高度。值越大飞得越高。20刻=1秒">?</span>
                </label>
                <input type="number" min="0" value="${ent.lifeTime}"
                       onchange="updateEntity(${ent.id}, 'lifeTime', this.value)">
                <span class="hint">${(ent.lifeTime / 20).toFixed(1)}秒</span>
            </div>
        </div>

        <div class="explosions-section">
            <div class="explosions-section-header">
                <h4>💥 爆炸样式 (Explosions)</h4>
                <button class="btn-add-sm" onclick="addExplosion(${ent.id})">+ 添加</button>
            </div>
            <div class="explosion-list">
                ${ent.explosions.map((exp, ei) => renderExplosionCard(ent.id, exp, ei)).join('')}
            </div>
        </div>
    </div>`;
}

function renderExplosionCard(entityId, exp, idx) {
    const colorPalette = (fieldName) => {
        const selected = exp[fieldName] || [];
        const gen = exp._gen && exp._gen[fieldName] ? exp._gen[fieldName] : { baseColor: '#ff0000', mode: 'analogous', results: [] };
        const uid = `${entityId}_${exp.id}_${fieldName}`;
        return `
        <div class="color-field">
            <div class="color-field-label">
                ${fieldName === 'colors' ? '🎨 爆炸颜色 (Colors)' : '🌈 淡化颜色 (FadeColors，可选)'}
                <span class="tooltip" data-tip="${fieldName === 'colors'
                ? '爆裂时的粒子颜色。同一颜色重复添加可提高该色权重。不选则为黑色'
                : '爆裂后的淡化粒子颜色(可选)。同一颜色重复添加可提高该色权重'}">?</span>
            </div>

            <div class="selected-colors-preview">
                <span class="selected-colors-label">已选颜色: </span>
                ${selected.length === 0
                ? '<span class="selected-colors-label none">无</span>'
                : selected.map((v, i) => `
                        <div class="mini-swatch" style="background:${decToHex(v)}"
                             title="${v} (${decToHex(v)}) — 点击移除"
                             onclick="removeColorAt(${entityId}, ${exp.id}, '${fieldName}', ${i})"></div>
                    `).join('')}
            </div>

            <div class="color-generator">
                <div class="generator-row">
                    <input type="color" id="genBase_${uid}" value="${gen.baseColor}"
                           title="选择基准色"
                           onchange="updateGenState(${entityId}, ${exp.id}, '${fieldName}', 'baseColor', this.value)">
                    <select id="genMode_${uid}"
                            onchange="updateGenState(${entityId}, ${exp.id}, '${fieldName}', 'mode', this.value)">
                        ${HARMONY_MODES.map(m => `<option value="${m.value}" ${gen.mode === m.value ? 'selected' : ''}>${m.label}</option>`).join('')}
                    </select>
                    <button class="btn-sm" onclick="doGenerate(${entityId}, ${exp.id}, '${fieldName}')">生成配色</button>
                    <button class="btn-sm btn-sm-accent" onclick="addAllGenerated(${entityId}, ${exp.id}, '${fieldName}')">全部添加</button>
                </div>
                <div class="generator-results" id="genResults_${uid}">
                    ${gen.results.length > 0
                ? gen.results.map(c => `
                            <div class="color-swatch gen-swatch"
                                 style="background:${c.hex}"
                                 title="${c.hex} (${c.dec}) — 点击添加"
                                 onclick="addColor(${entityId}, ${exp.id}, '${fieldName}', ${c.dec})">
                            </div>`).join('')
                : '<span class="gen-placeholder">点击"生成配色"预览配色方案</span>'
            }
                </div>
            </div>

            <div class="color-custom-row">
                <input type="color" id="customColor_${uid}" value="#ff0000">
                <button class="btn-sm" onclick="addCustomColor(${entityId}, ${exp.id}, '${fieldName}')">添加单色</button>
                <input type="number" id="customDec_${uid}" class="dec-input" placeholder="十进制值" min="0" max="16777215">
                <button class="btn-sm" onclick="addDecColor(${entityId}, ${exp.id}, '${fieldName}')">添加</button>
            </div>

            <details class="dye-collapsible">
                <summary>⚠️ 原版染料颜色（颜色不够鲜艳，不推荐用于烟花）</summary>
                <div class="color-palette">
                    ${DYE_COLORS.map(c => `
                        <div class="color-swatch"
                             style="background:${decToHex(c.value)}"
                             title="${c.name} (${c.dye}: ${c.value}) — 点击添加"
                             onclick="addColor(${entityId}, ${exp.id}, '${fieldName}', ${c.value})">
                        </div>
                    `).join('')}
                </div>
            </details>
        </div>`;
    };

    return `
    <div class="explosion-card" data-explosion-id="${exp.id}">
        <div class="explosion-card-header">
            <span class="explosion-card-title">爆炸 #${idx + 1}</span>
            <button class="btn-remove" onclick="removeExplosion(${entityId}, ${exp.id})">× 删除</button>
        </div>

        <div class="explosion-params">
            <div class="form-group">
                <label>形态 (Type)
                    <span class="tooltip" data-tip="爆裂时的形态: 0=小型球状, 1=大型球状, 2=星形, 3=苦力怕状, 4=喷发状">?</span>
                </label>
                <select onchange="updateExplosion(${entityId}, ${exp.id}, 'type', this.value)">
                    ${EXPLOSION_TYPES.map(t => `
                        <option value="${t.value}" ${exp.type == t.value ? 'selected' : ''}>${t.label}</option>
                    `).join('')}
                </select>
            </div>
            <div class="form-group">
                <div class="toggle-row">
                    <div class="toggle-group">
                        <label class="toggle-switch">
                            <input type="checkbox" ${exp.flicker ? 'checked' : ''}
                                   onchange="updateExplosion(${entityId}, ${exp.id}, 'flicker', this.checked)">
                            <span class="toggle-slider"></span>
                        </label>
                        <label>闪烁 (Flicker)
                            <span class="tooltip" data-tip="烟花是否出现闪烁效果（对应荧石粉合成）">?</span>
                        </label>
                    </div>
                    <div class="toggle-group">
                        <label class="toggle-switch">
                            <input type="checkbox" ${exp.trail ? 'checked' : ''}
                                   onchange="updateExplosion(${entityId}, ${exp.id}, 'trail', this.checked)">
                            <span class="toggle-slider"></span>
                        </label>
                        <label>拖曳 (Trail)
                            <span class="tooltip" data-tip="烟花是否有拖曳痕迹（对应钻石合成）">?</span>
                        </label>
                    </div>
                </div>
            </div>
        </div>

        ${colorPalette('colors')}
        ${colorPalette('fadeColors')}
    </div>`;
}

// ========================================
// 数据操作
// ========================================
function addEntity() {
    entities.push(createEntity());
    render();
}

function removeEntity(id) {
    entities = entities.filter(e => e.id !== id);
    render();
}

function updateEntity(entityId, field, value) {
    const ent = entities.find(e => e.id === entityId);
    if (!ent) return;
    if (['weight', 'lifeTime', 'flight', 'count'].includes(field)) {
        ent[field] = parseInt(value) || 0;
    }
    render();
}

function addExplosion(entityId) {
    const ent = entities.find(e => e.id === entityId);
    if (!ent) return;
    ent.explosions.push(createExplosion());
    render();
}

function removeExplosion(entityId, explosionId) {
    const ent = entities.find(e => e.id === entityId);
    if (!ent) return;
    ent.explosions = ent.explosions.filter(x => x.id !== explosionId);
    render();
}

function updateExplosion(entityId, explosionId, field, value) {
    const ent = entities.find(e => e.id === entityId);
    if (!ent) return;
    const exp = ent.explosions.find(x => x.id === explosionId);
    if (!exp) return;
    if (field === 'type') exp.type = parseInt(value);
    else if (field === 'flicker') exp.flicker = !!value;
    else if (field === 'trail') exp.trail = !!value;
    render();
}

function addColor(entityId, explosionId, field, colorValue) {
    const ent = entities.find(e => e.id === entityId);
    if (!ent) return;
    const exp = ent.explosions.find(x => x.id === explosionId);
    if (!exp) return;
    exp[field].push(colorValue);
    render();
}

function removeColorAt(entityId, explosionId, field, index) {
    const ent = entities.find(e => e.id === entityId);
    if (!ent) return;
    const exp = ent.explosions.find(x => x.id === explosionId);
    if (!exp) return;
    exp[field].splice(index, 1);
    render();
}

function addCustomColor(entityId, explosionId, field) {
    const uid = `${entityId}_${explosionId}_${field}`;
    const picker = document.getElementById(`customColor_${uid}`);
    if (!picker) return;
    const dec = hexToDec(picker.value);
    const ent = entities.find(e => e.id === entityId);
    if (!ent) return;
    const exp = ent.explosions.find(x => x.id === explosionId);
    if (!exp) return;
    exp[field].push(dec);
    render();
}

function addDecColor(entityId, explosionId, field) {
    const uid = `${entityId}_${explosionId}_${field}`;
    const inp = document.getElementById(`customDec_${uid}`);
    if (!inp) return;
    const dec = parseInt(inp.value);
    if (isNaN(dec) || dec < 0 || dec > 16777215) { alert('请输入 0-16777215 的十进制颜色值'); return; }
    const ent = entities.find(e => e.id === entityId);
    if (!ent) return;
    const exp = ent.explosions.find(x => x.id === explosionId);
    if (!exp) return;
    exp[field].push(dec);
    render();
}

// ========================================
// 配色生成器交互
// ========================================
function updateGenState(entityId, explosionId, field, prop, value) {
    const ent = entities.find(e => e.id === entityId);
    if (!ent) return;
    const exp = ent.explosions.find(x => x.id === explosionId);
    if (!exp || !exp._gen || !exp._gen[field]) return;
    exp._gen[field][prop] = value;
}

function doGenerate(entityId, explosionId, field) {
    const ent = entities.find(e => e.id === entityId);
    if (!ent) return;
    const exp = ent.explosions.find(x => x.id === explosionId);
    if (!exp || !exp._gen || !exp._gen[field]) return;
    const gen = exp._gen[field];
    gen.results = generateHarmony(gen.baseColor, gen.mode);
    render();
}

function addAllGenerated(entityId, explosionId, field) {
    const ent = entities.find(e => e.id === entityId);
    if (!ent) return;
    const exp = ent.explosions.find(x => x.id === explosionId);
    if (!exp || !exp._gen || !exp._gen[field]) return;
    const gen = exp._gen[field];
    if (gen.results.length === 0) { doGenerate(entityId, explosionId, field); return; }
    for (const c of gen.results) {
        exp[field].push(c.dec);
    }
    render();
}

function bindEntityEvents() {
    // Events are handled via inline handlers
}

// ========================================
// NBT 生成
// ========================================
function generateNBT() {
    // 基本信息
    const name = document.getElementById('name').value.trim();
    const no = document.getElementById('no').value.trim();
    const tip = document.getElementById('tip').value.trim();
    if (!name || !no || !tip) { alert('请填写所有基本信息字段!'); return; }

    // 刷怪笼参数
    const delay = getSelectValue('delay');
    const requiredPlayerRange = getSelectValue('requiredPlayerRange');
    const minSpawnDelay = getSelectValue('minSpawnDelay');
    const maxSpawnDelay = getSelectValue('maxSpawnDelay');
    const spawnRange = getSelectValue('spawnRange');
    const spawnCount = getSelectValue('spawnCount');
    const maxNearbyEntities = getSelectValue('maxNearbyEntities');

    if (!maxSpawnDelay || !minSpawnDelay) { alert('请选择最大和最小生成间隔!'); return; }

    // ---- 构建 NBT ----
    let s = 'give @a minecraft:spawner{HideFlags:63,display:{';
    s += `Name:'[{"text":"${name}|烟花刷怪笼","color":"aqua","italic":false}]',`;
    s += `Lore:['[{"text":"#${no}","color":"white","bold":true,"italic":false}]',`;
    s += `'[{"text":"${tip}","color":"red","italic":false}]','""',`;
    s += `'[{"text":"Colorpencil的烟花刷怪笼","color":"aqua","italic":false}]']`;
    s += '},BlockEntityTag:{';
    s += `Delay:${delay}s,RequiredPlayerRange:${requiredPlayerRange}s,`;
    s += `MaxSpawnDelay:${maxSpawnDelay}s,MinSpawnDelay:${minSpawnDelay}s`;

    if (spawnRange) s += `,SpawnRange:${spawnRange}s`;
    if (spawnCount) s += `,SpawnCount:${spawnCount}s`;
    if (maxNearbyEntities) s += `,MaxNearbyEntities:${maxNearbyEntities}s`;

    // SpawnData (Colorpencil 署名)
    s += ',SpawnData:{CustomName:"Colorpencil",'
        + 'uuid:[I;-1361177361,1763460505,-1286925813,512240562],'
        + 'UUIDMost:-5846212247787125351L,UUIDLeast:-5527304278700971086L,'
        + 'id:"minecraft:player"}';

    // SpawnPotentials
    s += ',SpawnPotentials:[';

    const potentials = [];
    for (const ent of entities) {
        if (ent.explosions.length === 0) continue;
        potentials.push(buildEntityNBT(ent));
    }

    // 如果没有用户实体，放一个占位
    if (potentials.length === 0) {
        potentials.push('{Weight:1,Entity:{CustomName:"Colorpencil",' +
            'uuid:[I;-1361177361,1763460505,-1286925813,512240562],' +
            'UUIDMost:-5846212247787125351L,UUIDLeast:-5527304278700971086L,' +
            'id:"minecraft:player"}}');
    }

    s += potentials.join(',');
    s += ']}}';

    // 显示
    const output = document.getElementById('output');
    const section = document.getElementById('outputSection');
    output.textContent = s;
    section.style.display = 'block';
    section.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    document.getElementById('copyMessage').style.display = 'none';
}

function buildEntityNBT(ent) {
    let s = `{Weight:${ent.weight},Entity:{`;
    s += `LifeTime:${ent.lifeTime},`;
    s += `FireworksItem:{id:"minecraft:firework_rocket",Count:${ent.count}b,tag:{Fireworks:{`;
    s += `Flight:${ent.flight}b`;

    // Explosions
    if (ent.explosions.length > 0) {
        s += ',Explosions:[';
        s += ent.explosions.map(exp => buildExplosionNBT(exp)).join(',');
        s += ']';
    }

    s += '}}},id:"minecraft:firework_rocket"}}';
    return s;
}

function buildExplosionNBT(exp) {
    const parts = [];
    parts.push(`Type:${exp.type}b`);

    if (exp.trail) parts.push('Trail:1b');
    if (exp.flicker) parts.push('Flicker:1b');

    if (exp.colors.length > 0) {
        parts.push(`Colors:[I;${exp.colors.join(',')}]`);
    }
    if (exp.fadeColors.length > 0) {
        parts.push(`FadeColors:[I;${exp.fadeColors.join(',')}]`);
    }

    return '{' + parts.join(',') + '}';
}

// ========================================
// 复制到剪贴板
// ========================================
async function copyToClipboard() {
    const text = document.getElementById('output').textContent;
    const msg = document.getElementById('copyMessage');
    try {
        await navigator.clipboard.writeText(text);
        msg.style.display = 'block';
        setTimeout(() => { msg.style.display = 'none'; }, 3000);
    } catch {
        const ta = document.createElement('textarea');
        ta.value = text; ta.style.position = 'fixed'; ta.style.left = '-9999px';
        document.body.appendChild(ta); ta.select();
        try { document.execCommand('copy'); msg.style.display = 'block'; setTimeout(() => { msg.style.display = 'none'; }, 3000); }
        catch { alert('复制失败，请手动复制'); }
        document.body.removeChild(ta);
    }
}

// ========================================
// 预设 (来自 2024成品.snbt，不含冲天炮)
// ========================================
const PRESETS = [
    {
        name: '#1 双色苦力怕',
        desc: '苦力怕形状，白色配各色，放远处',
        spawner: { delay: '-1', requiredPlayerRange: '327', minSpawnDelay: '60', maxSpawnDelay: '180', spawnRange: '10', spawnCount: '2', maxNearbyEntities: '' },
        basic: { name: '双色苦力怕', no: '1', tip: '放远处' },
        entities: [
            { weight: 2, lifeTime: 44, flight: 1, count: 61, explosions: [{ type: 3, colors: [14188952, 15790320, 14188952], fadeColors: [], flicker: false, trail: false }] },
            { weight: 2, lifeTime: 46, flight: 1, count: 60, explosions: [{ type: 3, colors: [15790320, 14602026, 14602026], fadeColors: [], flicker: false, trail: false }] },
            { weight: 2, lifeTime: 40, flight: 1, count: 57, explosions: [{ type: 3, colors: [15790320, 12801229, 12801229], fadeColors: [], flicker: false, trail: false }] },
            { weight: 2, lifeTime: 42, flight: 1, count: 55, explosions: [{ type: 3, colors: [15790320, 15435844, 15435844], fadeColors: [], flicker: false, trail: false }] },
            { weight: 1, lifeTime: 40, flight: 1, count: 58, explosions: [{ type: 3, colors: [15790320, 2437522, 2437522], fadeColors: [], flicker: false, trail: false }] },
            { weight: 3, lifeTime: 48, flight: 1, count: 55, explosions: [{ type: 3, colors: [15790320, 6719955, 6719955], fadeColors: [], flicker: false, trail: false }] },
            { weight: 2, lifeTime: 44, flight: 1, count: 61, explosions: [{ type: 3, colors: [8073150, 15790320, 8073150], fadeColors: [], flicker: false, trail: false }] },
            { weight: 2, lifeTime: 49, flight: 1, count: 55, explosions: [{ type: 3, colors: [15790320, 4312372, 4312372], fadeColors: [], flicker: false, trail: false }] },
            { weight: 2, lifeTime: 44, flight: 1, count: 63, explosions: [{ type: 3, colors: [4408131, 15790320, 4408131], fadeColors: [], flicker: false, trail: false }] },
        ]
    },
    {
        name: '#2 星',
        desc: '星形，黄色为主，放远处',
        spawner: { delay: '-1', requiredPlayerRange: '327', minSpawnDelay: '60', maxSpawnDelay: '180', spawnRange: '4', spawnCount: '1', maxNearbyEntities: '' },
        basic: { name: '星', no: '2', tip: '放远处' },
        entities: [
            { weight: 2, lifeTime: 25, flight: 1, count: 60, explosions: [{ type: 2, colors: [16776960], fadeColors: [], flicker: true, trail: true }] },
            { weight: 2, lifeTime: 25, flight: 1, count: 60, explosions: [{ type: 2, colors: [16776960], fadeColors: [], flicker: false, trail: true }] },
            { weight: 3, lifeTime: 25, flight: 1, count: 60, explosions: [{ type: 2, colors: [16776960], fadeColors: [], flicker: true, trail: false }] },
            { weight: 1, lifeTime: 25, flight: 1, count: 60, explosions: [{ type: 2, colors: [16711680], fadeColors: [], flicker: true, trail: false }] },
        ]
    },
    {
        name: '#3 双色球',
        desc: '小型球状，带拖曳，双色搭配，无距离限制',
        spawner: { delay: '-1', requiredPlayerRange: '327', minSpawnDelay: '50', maxSpawnDelay: '120', spawnRange: '4', spawnCount: '1', maxNearbyEntities: '' },
        basic: { name: '双色球', no: '3', tip: '无距离限制' },
        entities: [
            { weight: 1, lifeTime: 39, flight: 1, count: 61, explosions: [{ type: 0, colors: [12801229, 14188952], fadeColors: [], flicker: false, trail: true }] },
            { weight: 1, lifeTime: 35, flight: 1, count: 61, explosions: [{ type: 0, colors: [4408131, 11250603], fadeColors: [], flicker: false, trail: true }] },
            { weight: 1, lifeTime: 33, flight: 1, count: 61, explosions: [{ type: 0, colors: [3887386, 4312372], fadeColors: [], flicker: false, trail: true }] },
            { weight: 1, lifeTime: 39, flight: 1, count: 61, explosions: [{ type: 0, colors: [2437522, 6719955], fadeColors: [], flicker: false, trail: true }] },
        ]
    },
    {
        name: '#5 中心',
        desc: '经过精心设计的特殊烟花，在玩家正上方爆炸才能达到效果',
        spawner: { delay: '-1', requiredPlayerRange: '327', minSpawnDelay: '400', maxSpawnDelay: '500', spawnRange: '3', spawnCount: '1', maxNearbyEntities: '' },
        basic: { name: '中心', no: '5', tip: '只能放在正中央' },
        entities: [
            {
                weight: 2, lifeTime: 30, flight: 1, count: 3, explosions: [
                    { type: 1, colors: [14188952], fadeColors: [], flicker: false, trail: false },
                    { type: 2, colors: [12801229], fadeColors: [], flicker: false, trail: false },
                    { type: 2, colors: [12801229], fadeColors: [], flicker: false, trail: false },
                    { type: 2, colors: [12801229], fadeColors: [], flicker: false, trail: false },
                ]
            },
            {
                weight: 1, lifeTime: 30, flight: 1, count: 1, explosions: [
                    { type: 1, colors: [0], fadeColors: [16777215, 0], flicker: false, trail: false },
                    { type: 4, colors: [16777215], fadeColors: [], flicker: false, trail: true },
                ]
            },
        ]
    },
    {
        name: '#6 爆裂',
        desc: '喷发状，多彩搭配，无距离限制',
        spawner: { delay: '-1', requiredPlayerRange: '327', minSpawnDelay: '100', maxSpawnDelay: '200', spawnRange: '4', spawnCount: '1', maxNearbyEntities: '' },
        basic: { name: '爆裂', no: '6', tip: '无距离限制' },
        entities: [
            {
                weight: 1, lifeTime: 30, flight: 1, count: 1, explosions: [
                    { type: 4, colors: [16736988, 65280], fadeColors: [], flicker: false, trail: true },
                    { type: 4, colors: [16777215], fadeColors: [], flicker: true, trail: false },
                ]
            },
            {
                weight: 1, lifeTime: 30, flight: 1, count: 1, explosions: [
                    { type: 4, colors: [65535, 16776960], fadeColors: [], flicker: false, trail: true },
                    { type: 4, colors: [16777215], fadeColors: [], flicker: true, trail: false },
                ]
            },
            {
                weight: 2, lifeTime: 30, flight: 1, count: 1, explosions: [
                    { type: 4, colors: [16771456], fadeColors: [16777215], flicker: false, trail: true },
                    { type: 4, colors: [16736988], fadeColors: [65280], flicker: false, trail: false },
                ]
            },
            {
                weight: 2, lifeTime: 30, flight: 1, count: 1, explosions: [
                    { type: 4, colors: [16771456], fadeColors: [16777215], flicker: false, trail: true },
                    { type: 4, colors: [65280], fadeColors: [16736988], flicker: false, trail: false },
                ]
            },
        ]
    },
    {
        name: '#7 苦力怕',
        desc: '大球+苦力怕，彩虹色，放远处',
        spawner: { delay: '-1', requiredPlayerRange: '327', minSpawnDelay: '400', maxSpawnDelay: '800', spawnRange: '4', spawnCount: '1', maxNearbyEntities: '' },
        basic: { name: '苦力怕', no: '7', tip: '放远处' },
        entities: [
            {
                weight: 1, lifeTime: 20, flight: 1, count: 1, explosions: [
                    { type: 1, colors: [6803285], fadeColors: [], flicker: false, trail: false },
                    { type: 3, colors: [6803285, 4698681, 9688972, 5740630, 1522196, 3692593, 11587754, 14474460], fadeColors: [], flicker: false, trail: false },
                ]
            },
            {
                weight: 2, lifeTime: 20, flight: 1, count: 1, explosions: [
                    { type: 1, colors: [6803285], fadeColors: [], flicker: false, trail: false },
                    { type: 3, colors: [6803285, 4698681, 9688972, 5740630, 1522196, 3692593, 11587754, 14474460], fadeColors: [], flicker: false, trail: false },
                ]
            },
        ]
    },
    {
        name: '#8 主题色大球',
        desc: '大型球状，使用各种有特殊意义的颜色，无距离限制',
        spawner: { delay: '-1', requiredPlayerRange: '327', minSpawnDelay: '100', maxSpawnDelay: '200', spawnRange: '4', spawnCount: '1', maxNearbyEntities: '' },
        basic: { name: '主题色大球', no: '8', tip: '无距离限制' },
        entities: [
            { weight: 1, lifeTime: 35, flight: 1, count: 1, explosions: [{ type: 1, colors: [6737151], fadeColors: [], flicker: false, trail: true }] },
            {
                weight: 1, lifeTime: 35, flight: 1, count: 1, explosions: [
                    { type: 1, colors: [0], fadeColors: [0, 16777215], flicker: false, trail: false },
                    { type: 0, colors: [0], fadeColors: [], flicker: false, trail: false },
                    { type: 0, colors: [0], fadeColors: [], flicker: false, trail: false },
                    { type: 0, colors: [0], fadeColors: [], flicker: false, trail: false },
                    { type: 0, colors: [0], fadeColors: [], flicker: false, trail: false },
                    { type: 0, colors: [0], fadeColors: [], flicker: false, trail: false },
                    { type: 1, colors: [0], fadeColors: [0, 16777215], flicker: false, trail: false },
                ]
            },
            {
                weight: 2, lifeTime: 35, flight: 1, count: 64, explosions: [
                    { type: 1, colors: [15790320], fadeColors: [], flicker: false, trail: false },
                    { type: 1, colors: [14188952], fadeColors: [], flicker: false, trail: false },
                    { type: 1, colors: [11743532], fadeColors: [], flicker: false, trail: false },
                ]
            },
            { weight: 1, lifeTime: 35, flight: 1, count: 64, explosions: [{ type: 1, colors: [149386, 13119557], fadeColors: [], flicker: false, trail: true }] },
            { weight: 2, lifeTime: 35, flight: 1, count: 64, explosions: [{ type: 1, colors: [15885602, 9291327, 44783, 16761358], fadeColors: [], flicker: false, trail: false }] },
            { weight: 2, lifeTime: 35, flight: 1, count: 64, explosions: [{ type: 1, colors: [4359668, 4359668, 15352629, 16497669, 3450963], fadeColors: [], flicker: false, trail: false }] },
            { weight: 1, lifeTime: 35, flight: 1, count: 1, explosions: [{ type: 1, colors: [60123], fadeColors: [], flicker: false, trail: true }] },
            { weight: 1, lifeTime: 35, flight: 1, count: 1, explosions: [{ type: 1, colors: [13156327], fadeColors: [], flicker: false, trail: true }] },
            { weight: 2, lifeTime: 35, flight: 1, count: 1, explosions: [{ type: 1, colors: [16478873], fadeColors: [], flicker: false, trail: true }] },
            { weight: 1, lifeTime: 35, flight: 1, count: 1, explosions: [{ type: 1, colors: [16738560], fadeColors: [], flicker: false, trail: true }] },
            {
                weight: 2, lifeTime: 35, flight: 1, count: 64, explosions: [
                    { type: 1, colors: [13029907, 2072351, 1731885, 12166425, 2207280, 1877799, 3186481, 11323143], fadeColors: [], flicker: false, trail: false },
                    { type: 1, colors: [11248401, 4173865, 1934606, 1944854, 12312110, 1927200, 13030190, 2600482], fadeColors: [], flicker: false, trail: false },
                ]
            },
        ]
    },
];

// ========================================
// 设置下拉框值 (处理自定义值)
// ========================================
function setSelectValue(fieldName, value) {
    // 直接输入框字段（高级参数）
    if (['delay', 'requiredPlayerRange', 'spawnRange', 'maxNearbyEntities'].includes(fieldName)) {
        const inp = document.getElementById(fieldName);
        if (inp) inp.value = value || '';
        return;
    }

    // 下拉框字段
    const sel = document.getElementById(fieldName);
    const inp = document.getElementById(fieldName + 'Custom');
    if (!sel) return;
    if (!value) { sel.value = ''; if (inp) { inp.classList.add('hidden'); inp.value = ''; } return; }

    // 尝试匹配已有选项
    const options = Array.from(sel.options);
    const match = options.find(o => o.value === value && o.value !== 'custom');
    if (match) {
        sel.value = value;
        if (inp) { inp.classList.add('hidden'); inp.value = ''; }
    } else {
        sel.value = 'custom';
        if (inp) { inp.classList.remove('hidden'); inp.value = value; }
    }
}

// ========================================
// 加载预设
// ========================================
function loadPreset() {
    const idx = document.getElementById('presetSelect').value;
    if (idx === '') return;

    const preset = PRESETS[parseInt(idx)];
    if (!preset) return;

    // 基本信息
    document.getElementById('name').value = preset.basic.name;
    document.getElementById('no').value = preset.basic.no;
    document.getElementById('tip').value = preset.basic.tip;

    // 刷怪笼参数
    const sp = preset.spawner;
    setSelectValue('delay', sp.delay);
    setSelectValue('requiredPlayerRange', sp.requiredPlayerRange);
    setSelectValue('minSpawnDelay', sp.minSpawnDelay);
    setSelectValue('maxSpawnDelay', sp.maxSpawnDelay);
    setSelectValue('spawnRange', sp.spawnRange);
    setSelectValue('spawnCount', sp.spawnCount);
    setSelectValue('maxNearbyEntities', sp.maxNearbyEntities);

    // 烟花实体
    entities = preset.entities.map(pe => {
        const ent = {
            id: ++entityIdCounter,
            weight: pe.weight,
            lifeTime: pe.lifeTime,
            flight: pe.flight,
            count: pe.count,
            explosions: pe.explosions.map(px => ({
                id: ++explosionIdCounter,
                type: px.type,
                colors: [...px.colors],
                fadeColors: [...px.fadeColors],
                flicker: px.flicker,
                trail: px.trail,
                _gen: {
                    colors: { baseColor: '#ff0000', mode: 'analogous', results: [] },
                    fadeColors: { baseColor: '#0088ff', mode: 'analogous', results: [] },
                },
            })),
        };
        return ent;
    });

    render();

    // 隐藏之前的输出
    document.getElementById('outputSection').style.display = 'none';
}

// ========================================
// 初始化预设下拉菜单
// ========================================
function initPresets() {
    const sel = document.getElementById('presetSelect');
    PRESETS.forEach((p, i) => {
        const opt = document.createElement('option');
        opt.value = i;
        opt.textContent = `${p.name} — ${p.desc}`;
        sel.appendChild(opt);
    });
    document.getElementById('loadPresetBtn').addEventListener('click', loadPreset);
}

// ========================================
// 初始化
// ========================================
document.addEventListener('DOMContentLoaded', () => {
    initCustomInputs();
    initPresets();
    document.getElementById('addEntityBtn').addEventListener('click', addEntity);
    document.getElementById('generateBtn').addEventListener('click', generateNBT);
    document.getElementById('copyBtn').addEventListener('click', copyToClipboard);
});

document.addEventListener('keydown', e => {
    if (e.ctrlKey && e.key === 'Enter') generateNBT();
});
