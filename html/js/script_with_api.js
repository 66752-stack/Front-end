// ===========================
// HÄMTA DATA FRÅN DATABASEN
// ===========================
async function loadInventoryFromDB() {
    try {
        const res  = await fetch('php/get_inventory.php');
        const data = await res.json();

        if (!data.success) {
            console.error('Kunde inte hämta inventariedata:', data.message);
            return;
        }

        const devicesBody     = document.getElementById('devicesData');
        const consumablesBody = document.getElementById('consumablesData');

        devicesBody.innerHTML     = '';
        consumablesBody.innerHTML = '';

        data.devices.forEach(device => {

            const statusMap = {
                'Aktiv': 'status-active',
                'Underhåll': 'status-maintenance',
                'Inaktiv': 'status-inactive'
            };

            const statusClass = statusMap[device.status] || 'status-active';

            const updated = device.last_updated
                ? device.last_updated.split(' ')[0]
                : new Date().toISOString().split('T')[0];

            const tr = document.createElement('tr');

            tr.innerHTML = `
                <td>${escapeHtml(device.device_id)}</td>
                <td>${escapeHtml(device.device_name)}</td>
                <td>${escapeHtml(device.device_type)}</td>
                <td>${escapeHtml(device.owner)}</td>
                <td><span class="status-badge ${statusClass}">${escapeHtml(device.status)}</span></td>
                <td>${escapeHtml(updated)}</td>
                <td><button class="edit-btn" onclick="editItem('${escapeHtml(device.device_id)}')">Redigera</button></td>
            `;

            devicesBody.appendChild(tr);
        });

        data.consumables.forEach(item => {

            let stockClass, stockLabel;

            if (item.stock == 0) {
                stockClass = 'stock-out';
                stockLabel = 'Slut i lager';
            } else if (item.stock < item.min_level) {
                stockClass = 'stock-low';
                stockLabel = 'Lågt lager';
            } else {
                stockClass = 'stock-good';
                stockLabel = 'I lager';
            }

            const tr = document.createElement('tr');

            tr.innerHTML = `
                <td>${escapeHtml(item.product_id)}</td>
                <td>${escapeHtml(item.product_name)}</td>
                <td>${escapeHtml(item.category)}</td>
                <td>${item.stock}</td>
                <td>${item.min_level}</td>
                <td><span class="stock-badge ${stockClass}">${stockLabel}</span></td>
                <td><button class="edit-btn" onclick="editItem('${escapeHtml(item.product_id)}')">Redigera</button></td>
            `;

            consumablesBody.appendChild(tr);
        });

    } catch (err) {
        console.error('Fel vid hämtning:', err);
    }
}


// ===========================
// XSS-SKYDD
// ===========================
function escapeHtml(str) {
    return String(str)
        .replace(/&/g,  '&amp;')
        .replace(/</g,  '&lt;')
        .replace(/>/g,  '&gt;')
        .replace(/"/g,  '&quot;')
        .replace(/'/g,  '&#039;');
}


// ===========================
// FILTERFUNKTION
// ===========================
function filterCategory(category) {

    const deviceSection     = document.getElementById('deviceSection');
    const consumableSection = document.getElementById('consumableSection');

    [deviceSection, consumableSection].forEach(section => {
        if (!section) return;
        section.classList.remove('fade-in');
        section.classList.add('fade-out');
    });

    setTimeout(() => {

        if (category === 'all') {
            deviceSection.style.display = 'block';
            consumableSection.style.display = 'block';
        }

        if (category === 'devices') {
            deviceSection.style.display = 'block';
            consumableSection.style.display = 'none';
        }

        if (category === 'consumables') {
            deviceSection.style.display = 'none';
            consumableSection.style.display = 'block';
        }

        [deviceSection, consumableSection].forEach(section => {
            if (!section) return;
            section.classList.remove('fade-out');
            section.classList.add('fade-in');
        });

    }, 200);
}


// ===========================
// SORTERING
// ===========================
function sortTable(tableId, columnIndex) {

    const table = document.getElementById(tableId);
    if (!table) return;

    const tbody = table.querySelector('tbody');
    const rows  = Array.from(tbody.querySelectorAll('tr'));

    const isAscending = table.dataset.sortOrder !== 'asc';
    table.dataset.sortOrder = isAscending ? 'asc' : 'desc';

    rows.sort((a, b) => {

        const aValue = a.cells[columnIndex].textContent.trim();
        const bValue = b.cells[columnIndex].textContent.trim();

        const aNum = parseFloat(aValue.replace(',', '.'));
        const bNum = parseFloat(bValue.replace(',', '.'));

        if (!isNaN(aNum) && !isNaN(bNum)) {
            return isAscending ? aNum - bNum : bNum - aNum;
        }

        return isAscending
            ? aValue.localeCompare(bValue, 'sv')
            : bValue.localeCompare(aValue, 'sv');
    });

    rows.forEach(row => tbody.appendChild(row));
}


// ===========================
// INITIALISERING
// ===========================
document.addEventListener('DOMContentLoaded', function () {

    loadInventoryFromDB();

    // FILTER
    const filterButtons = document.querySelectorAll('.filter-btn');

    filterButtons.forEach(btn => {
        btn.addEventListener('click', function () {

            filterButtons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');

            const category = this.dataset.filter;
            filterCategory(category);
        });
    });

    // SORTERING
    document.querySelectorAll('table').forEach(table => {

        const headers = table.querySelectorAll('th');

        headers.forEach((header, index) => {

            if (header.textContent.includes('Åtgärder')) return;

            header.style.cursor = 'pointer';
            header.title = 'Klicka för att sortera';

            header.addEventListener('click', function () {
                sortTable(table.id, index);
            });

        });

    });

});