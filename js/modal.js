// ===========================
// MODAL – Lägg till ny enhet/vara
// js/modal.js
// ===========================

let currentTab = 'device';

// ===========================
// ÖPPNA / STÄNG
// ===========================
function openAddModal() {
    resetModal();
    document.getElementById('addModal').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeAddModal() {
    document.getElementById('addModal').classList.remove('active');
    document.body.style.overflow = '';
}

function closeOnOverlay(e) {
    if (e.target === document.getElementById('addModal')) {
        closeAddModal();
    }
}

// Stäng med Escape-tangenten
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') closeAddModal();
});

// ===========================
// FLIKBYTE
// ===========================
function switchTab(tab, btn) {
    currentTab = tab;

    document.querySelectorAll('.type-tab').forEach(t => t.classList.remove('active'));
    btn.classList.add('active');

    document.getElementById('deviceForm').classList.toggle('active', tab === 'device');
    document.getElementById('consumableForm').classList.toggle('active', tab === 'consumable');

    clearErrors();
}

// ===========================
// LAGERINDIKATOR
// ===========================
function updateStockIndicator() {
    const stockEl    = document.querySelector('#consumableForm [name="stock"]');
    const minEl      = document.querySelector('#consumableForm [name="min_level"]');
    const indicator  = document.getElementById('stockIndicator');
    const dot        = document.getElementById('stockDot');
    const label      = document.getElementById('stockLabel');

    const stock = parseInt(stockEl.value);
    const min   = parseInt(minEl.value);

    if (isNaN(stock)) {
        indicator.style.display = 'none';
        return;
    }

    indicator.style.display = 'flex';

    if (stock === 0) {
        dot.style.background  = '#e74c3c';
        label.textContent     = 'Slut i lager';
        label.style.color     = '#e74c3c';
    } else if (!isNaN(min) && stock < min) {
        dot.style.background  = '#f39c12';
        label.textContent     = 'Lågt lager';
        label.style.color     = '#f39c12';
    } else {
        dot.style.background  = '#27ae60';
        label.textContent     = 'I lager';
        label.style.color     = '#27ae60';
    }
}

// ===========================
// VALIDERING
// ===========================
function clearErrors() {
    document.querySelectorAll('.error-msg').forEach(el => el.classList.remove('visible'));
    document.querySelectorAll('input.error, select.error').forEach(el => el.classList.remove('error'));
}

function validateDeviceForm() {
    let valid = true;
    const form = document.getElementById('deviceForm');

    const name  = form.querySelector('[name="device_name"]');
    const type  = form.querySelector('[name="device_type"]');
    const owner = form.querySelector('[name="owner"]');

    [name, type, owner].forEach(el => {
        if (!el.value.trim()) {
            el.classList.add('error');
            el.nextElementSibling.classList.add('visible');
            valid = false;
        }
    });

    return valid;
}

function validateConsumableForm() {
    let valid = true;
    const form = document.getElementById('consumableForm');

    const name     = form.querySelector('[name="product_name"]');
    const category = form.querySelector('[name="category"]');
    const stock    = form.querySelector('[name="stock"]');
    const minLevel = form.querySelector('[name="min_level"]');

    if (!name.value.trim()) {
        name.classList.add('error');
        name.nextElementSibling.classList.add('visible');
        valid = false;
    }

    if (!category.value) {
        category.classList.add('error');
        category.nextElementSibling.classList.add('visible');
        valid = false;
    }

    const stockVal = parseInt(stock.value);
    if (stock.value === '' || isNaN(stockVal) || stockVal < 0) {
        stock.classList.add('error');
        stock.nextElementSibling.classList.add('visible');
        valid = false;
    }

    const minVal = parseInt(minLevel.value);
    if (minLevel.value === '' || isNaN(minVal) || minVal < 0) {
        minLevel.classList.add('error');
        minLevel.nextElementSibling.classList.add('visible');
        valid = false;
    }

    return valid;
}

// ===========================
// SKICKA FORMULÄR
// ===========================
async function submitForm() {
    clearErrors();

    const isDevice = currentTab === 'device';
    const isValid  = isDevice ? validateDeviceForm() : validateConsumableForm();
    if (!isValid) return;

    const btn = document.getElementById('submitBtn');
    btn.classList.add('loading');
    btn.disabled = true;

    try {
        let payload, endpoint;

        if (isDevice) {
            const form = document.getElementById('deviceForm');
            payload = {
                device_id:   form.querySelector('[name="device_id"]').value.trim() || null,
                device_name: form.querySelector('[name="device_name"]').value.trim(),
                device_type: form.querySelector('[name="device_type"]').value,
                owner:       form.querySelector('[name="owner"]').value.trim(),
                status:      form.querySelector('[name="status"]').value
            };
            endpoint = 'api/save_device.php';
        } else {
            const form = document.getElementById('consumableForm');
            payload = {
                product_id:   form.querySelector('[name="product_id"]').value.trim() || null,
                product_name: form.querySelector('[name="product_name"]').value.trim(),
                category:     form.querySelector('[name="category"]').value,
                stock:        parseInt(form.querySelector('[name="stock"]').value),
                min_level:    parseInt(form.querySelector('[name="min_level"]').value)
            };
            endpoint = 'api/save_consumable.php';
        }

        const res  = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await res.json();

        if (data.success) {
            // Lägg till rad i tabellen direkt utan sidomladdning
            if (isDevice) {
                addDeviceRowToTable(payload, data.device_id);
            } else {
                addConsumableRowToTable(payload, data.product_id);
            }

            showSuccess(
                isDevice ? 'Enheten lades till!' : 'Varan lades till!',
                'ID: ' + (data.device_id || data.product_id)
            );
        } else {
            alert('Fel: ' + (data.message || 'Okänt fel'));
        }

    } catch (err) {
        console.error('Nätverksfel:', err);
        alert('Nätverksfel – kontrollera att servern är igång och att PHP-filerna finns på plats.');
    } finally {
        btn.classList.remove('loading');
        btn.disabled = false;
    }
}

// ===========================
// LÄGG TILL RAD I TABELL
// ===========================
function addDeviceRowToTable(data, generatedId) {
    const tbody = document.getElementById('devicesData');
    if (!tbody) return;

    const id = data.device_id || generatedId;

    const statusMap = {
        'Aktiv':     'status-active',
        'Underhåll': 'status-maintenance',
        'Inaktiv':   'status-inactive'
    };
    const statusClass = statusMap[data.status] || 'status-active';
    const today = new Date().toISOString().split('T')[0];

    const tr = document.createElement('tr');
    tr.setAttribute('data-category', 'devices');
    tr.innerHTML = `
        <td>${escapeHtml(id)}</td>
        <td>${escapeHtml(data.device_name)}</td>
        <td>${escapeHtml(data.device_type)}</td>
        <td>${escapeHtml(data.owner)}</td>
        <td><span class="status-badge ${statusClass}">${escapeHtml(data.status)}</span></td>
        <td>${today}</td>
        <td><button class="edit-btn" onclick="editItem('${escapeHtml(id)}')">Redigera</button></td>
    `;
    tbody.appendChild(tr);
}

function addConsumableRowToTable(data, generatedId) {
    const tbody = document.getElementById('consumablesData');
    if (!tbody) return;

    const id = data.product_id || generatedId;

    let stockClass, stockLabel;
    if (data.stock === 0) {
        stockClass = 'stock-out';  stockLabel = 'Slut i lager';
    } else if (data.stock < data.min_level) {
        stockClass = 'stock-low';  stockLabel = 'Lågt lager';
    } else {
        stockClass = 'stock-good'; stockLabel = 'I lager';
    }

    const tr = document.createElement('tr');
    tr.setAttribute('data-category', 'consumables');
    tr.innerHTML = `
        <td>${escapeHtml(id)}</td>
        <td>${escapeHtml(data.product_name)}</td>
        <td>${escapeHtml(data.category)}</td>
        <td>${data.stock}</td>
        <td>${data.min_level}</td>
        <td><span class="stock-badge ${stockClass}">${stockLabel}</span></td>
        <td><button class="edit-btn" onclick="editItem('${escapeHtml(id)}')">Redigera</button></td>
    `;
    tbody.appendChild(tr);
}

// ===========================
// VISA LYCKAD-VY
// ===========================
function showSuccess(title, msg) {
    document.getElementById('formBody').style.display          = 'none';
    document.querySelector('.type-tabs').style.display         = 'none';
    document.getElementById('modalFooter').style.display       = 'none';
    document.getElementById('successTitle').textContent        = title;
    document.getElementById('successMsg').textContent          = msg;
    document.getElementById('modalSuccess').classList.add('active');

    // Stäng automatiskt efter 2 sekunder
    setTimeout(closeAddModal, 2200);
}

// ===========================
// ÅTERSTÄLL MODAL
// ===========================
function resetModal() {
    document.getElementById('deviceForm').reset();
    document.getElementById('consumableForm').reset();

    // Återställ flikar
    currentTab = 'device';
    document.querySelectorAll('.type-tab').forEach((t, i) => t.classList.toggle('active', i === 0));
    document.getElementById('deviceForm').classList.add('active');
    document.getElementById('consumableForm').classList.remove('active');

    // Återställ vyer
    document.getElementById('formBody').style.display          = '';
    document.querySelector('.type-tabs').style.display         = '';
    document.getElementById('modalFooter').style.display       = '';
    document.getElementById('modalSuccess').classList.remove('active');
    document.getElementById('stockIndicator').style.display    = 'none';

    clearErrors();
}

// ===========================
// HJÄLPFUNKTION – XSS-skydd
// ===========================
function escapeHtml(str) {
    return String(str)
        .replace(/&/g,  '&amp;')
        .replace(/</g,  '&lt;')
        .replace(/>/g,  '&gt;')
        .replace(/"/g,  '&quot;')
        .replace(/'/g,  '&#039;');
}