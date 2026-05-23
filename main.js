const default_items = [
    {id: 1, name: 'Помідори', quantity: 2, bought: true},
    {id: 2, name: 'Печиво', quantity: 2, bought: false},
    {id: 3, name: 'Сир', quantity: 1, bought: false},
]

const listContainer = document.getElementById('shopping-list');
const nameInput = document.getElementById('new-item-input');
const addBtn = document.getElementById('add-btn');
const unboughtStatsContainer = document.getElementById('unbought-stats');
const boughtStatsContainer = document.getElementById('bought-stats');

let nextId = 4;
function loadState() {
    try {
        const saved = localStorage.getItem('buyListItems');
        const savedId = localStorage.getItem('buyListNextId');
        if (saved) {
            const parsed = JSON.parse(saved);
            if (parsed.length > 0) {
                if (savedId) nextId = Number(savedId);
                return parsed;
            }
        }
    }
    catch (_) {}
    return default_items.map(i => ({ ...i }));
}

function saveState() {
    try {
        localStorage.setItem('buyListItems', JSON.stringify(items));
        localStorage.setItem('buyListNextId', String(nextId));
    } 
    catch (_) {}
}
let items = loadState();

function buildRow(item) {
    const row = document.createElement('div');
    row.className = 'item-row';
    row.dataset.id = item.id;

    if (item.bought) {
        const name = document.createElement('span');
        name.className = 'item-name strikethrough';
        name.textContent = item.name;

        const controls = document.createElement('div');
        controls.className = 'item-controls';

        const count = document.createElement('span');
        count.className = 'item-count';
        count.textContent = item.quantity;

        controls.appendChild(count);

        const status = document.createElement('div');
        status.className = 'item-status';

        const unbuyBtn = document.createElement('button');
        unbuyBtn.className = 'btn-status';
        unbuyBtn.dataset.tooltip = 'Зробити не купленим';
        unbuyBtn.dataset.action = 'unbuy';
        unbuyBtn.textContent = 'Не куплено';

        status.appendChild(unbuyBtn);

        row.appendChild(name);
        row.appendChild(controls);
        row.appendChild(status);
    }
    else {
        const name = document.createElement('span');
        name.className = 'item-name';
        name.dataset.action = 'startEdit';
        name.dataset.tooltip = 'Клікніть щоб редагувати';
        name.textContent = item.name;

        const controls = document.createElement('div');
        controls.className = 'item-controls';

        const minusBtn = document.createElement('button');
        minusBtn.className = item.quantity <= 1
            ? 'btn-circle btn-minus disabled'
            : 'btn-circle btn-minus';
        minusBtn.dataset.tooltip = item.quantity <= 1 ? 'Не можна менше 1' : 'Зменшити кількість';
        minusBtn.dataset.action = 'minus';
        minusBtn.textContent = '−';

        const count = document.createElement('span');
        count.className = 'item-count';
        count.textContent = item.quantity;

        const plusBtn = document.createElement('button');
        plusBtn.className = 'btn-circle btn-plus';
        plusBtn.dataset.tooltip = 'Збільшити кількість';
        plusBtn.dataset.action = 'plus';
        plusBtn.textContent = '+';

        controls.appendChild(minusBtn);
        controls.appendChild(count);
        controls.appendChild(plusBtn);

        const status = document.createElement('div');
        status.className = 'item-status';

        const buyBtn = document.createElement('button');
        buyBtn.className = 'btn-status';
        buyBtn.dataset.tooltip = 'Зробити купленим';
        buyBtn.dataset.action = 'buy';
        buyBtn.textContent = 'Куплено';

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn-delete';
        deleteBtn.dataset.tooltip = 'Видалити товар';
        deleteBtn.dataset.action = 'delete';
        deleteBtn.textContent = '✖';

        status.appendChild(buyBtn);
        status.appendChild(deleteBtn);

        row.appendChild(name);
        row.appendChild(controls);
        row.appendChild(status);
    }
    return row;
}

function renderItems() {
    listContainer.innerHTML = '';
    items.forEach(item => listContainer.appendChild(buildRow(item)));
    renderSummary();
    saveState();
}

function renderSummary() {
    renderStats(unboughtStatsContainer, items.filter(i => !i.bought), false);
    renderStats(boughtStatsContainer, items.filter(i => i.bought), true);
}

function renderStats(container, list, strike) {
    container.innerHTML = '';
    if (list.length === 0) {
        const empty = document.createElement('span');
        empty.style.cssText = 'color: #aaa; font-size: 14px';
        empty.textContent = strike ? 'Ще нічого не куплено' : 'Нічого не залишилося';
        container.appendChild(empty);
        return;
    }

    list.forEach(item => {
        const tag = document.createElement('span');
        tag.className = strike ? 'tag strikethrough' : 'tag';
        tag.textContent = item.name + ' ';

        const badge = document.createElement('span');
        badge.className = 'tag-count';
        badge.textContent = item.quantity;

        tag.appendChild(badge);
        container.appendChild(tag);
    });
}

listContainer.addEventListener('click', e => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;

    const row = btn.closest('.item-row');
    const id = Number(row.dataset.id);
    const item = items.find(i => i.id === id);
    if (!item) return;

    switch(btn.dataset.action){
        case 'delete':
            items = items.filter(i => i.id !== id);
            renderItems();
            break;
        case 'buy':
            item.bought = true;
            renderItems();
            break;
        case 'unbuy':
            item.bought = false;
            renderItems();
            break;
        case 'plus':
            item.quantity++;
            renderItems();
            break;
        case 'minus':
            if (item.quantity > 1){
                item.quantity--;
                renderItems();
            }
            break;
        case 'startEdit':
            startEditing(row, item);
            break;
    }
});

function startEditing(row, item) {
    const nameSpan = row.querySelector('.item-name');

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'edit-input';
    input.value = item.name;
    nameSpan.replaceWith(input);
    input.focus();

    function finishEdit() {
        const newName = input.value.trim();
        if (newName) item.name = newName;
        renderItems();
    }

    input.addEventListener('blur', finishEdit);
    input.addEventListener('keydown', e => {
        if (e.key === 'Enter')  input.blur();
        if (e.key === 'Escape') {
            input.removeEventListener('blur', finishEdit);
            renderItems();
        }
    });
}

function addItem() {
    const name = nameInput.value.trim();
    if (!name) return;

    items.push({id: nextId++, name, quantity: 1, bought: false});
    renderItems();

    nameInput.value = '';
    nameInput.focus();
}

addBtn.addEventListener('click', addItem);
nameInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') addItem();
});

renderItems();