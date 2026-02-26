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

        // Rensa tabellerna innan vi fyller dem
        devicesBody.innerHTML     = '';
        consumablesBody.innerHTML = '';

        // Fyll enheter
        data.devices.forEach(device => {
            const statusMap = {
                'Aktiv':     'status-active',
                'Underhåll': 'status-maintenance',
                'Inaktiv':   'status-inactive'
            };
            const statusClass = statusMap[device.status] || 'status-active';
            const updated = device.last_updated
                ? device.last_updated.split(' ')[0]
                : new Date().toISOString().split('T')[0];

            const tr = document.createElement('tr');
            tr.setAttribute('data-category', 'devices');
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

        // Fyll förbrukningsvaror
        data.consumables.forEach(item => {
            let stockClass, stockLabel;
            if (item.stock == 0) {
                stockClass = 'stock-out';  stockLabel = 'Slut i lager';
            } else if (item.stock < item.min_level) {
                stockClass = 'stock-low';  stockLabel = 'Lågt lager';
            } else {
                stockClass = 'stock-good'; stockLabel = 'I lager';
            }

            const tr = document.createElement('tr');
            tr.setAttribute('data-category', 'consumables');
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
        console.error('Fel vid hämtning av inventariedata:', err);
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
// SÖKFUNKTION
// ===========================
function searchInventory() {
    const searchTerm = document.getElementById('searchField').value.toLowerCase().trim();
    searchInTable('devicesData', searchTerm);
    searchInTable('consumablesData', searchTerm);
}

function searchInTable(tableBodyId, searchTerm) {
    const tableBody = document.getElementById(tableBodyId);
    if (!tableBody) return;

    const rows = tableBody.getElementsByTagName('tr');
    for (let i = 0; i < rows.length; i++) {
        const text = rows[i].textContent || rows[i].innerText;
        rows[i].style.display = (searchTerm === '' || text.toLowerCase().includes(searchTerm)) ? '' : 'none';
    }
}

// ===========================
// FILTERFUNKTION
// ===========================
function filterCategory(category) {
    const deviceRows        = document.querySelectorAll('[data-category="devices"]');
    const consumableRows    = document.querySelectorAll('[data-category="consumables"]');
    const deviceSection     = document.getElementById('deviceSection');
    const consumableSection = document.getElementById('consumableSection');

    if (category === 'all') {
        deviceRows.forEach(r => r.style.display = '');
        consumableRows.forEach(r => r.style.display = '');
        if (deviceSection)      deviceSection.style.display      = 'block';
        if (consumableSection)  consumableSection.style.display  = 'block';
    } else if (category === 'devices') {
        deviceRows.forEach(r => r.style.display = '');
        consumableRows.forEach(r => r.style.display = 'none');
        if (deviceSection)      deviceSection.style.display      = 'block';
        if (consumableSection)  consumableSection.style.display  = 'none';
    } else if (category === 'consumables') {
        deviceRows.forEach(r => r.style.display = 'none');
        consumableRows.forEach(r => r.style.display = '');
        if (deviceSection)      deviceSection.style.display      = 'none';
        if (consumableSection)  consumableSection.style.display  = 'block';
    }
}

// ===========================
// REDIGERA FUNKTION
// ===========================
function editItem(itemId, type = 'device') {
    alert(`Redigera objekt: ${itemId}\n\nDenna funktion kommer att kopplas till PHP backend.`);
    console.log(`Redigerar objekt med ID: ${itemId}, typ: ${type}`);
}

// ===========================
// LAGER VARNINGAR
// ===========================
function checkStockLevels() {
    const consumableRows = document.querySelectorAll('#consumablesData tr');
    let lowStockItems = [], outOfStockItems = [];

    consumableRows.forEach(row => {
        const cells = row.getElementsByTagName('td');
        if (cells.length >= 6) {
            const itemName     = cells[1].textContent;
            const currentStock = parseInt(cells[3].textContent);
            const minLevel     = parseInt(cells[4].textContent);
            if (currentStock === 0)           outOfStockItems.push(itemName);
            else if (currentStock < minLevel) lowStockItems.push(itemName);
        }
    });

    return { lowStock: lowStockItems, outOfStock: outOfStockItems };
}

// ===========================
// SORTERINGSFUNKTION
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
        const aNum = parseFloat(aValue), bNum = parseFloat(bValue);

        if (!isNaN(aNum) && !isNaN(bNum)) return isAscending ? aNum - bNum : bNum - aNum;
        return isAscending
            ? aValue.localeCompare(bValue, 'sv')
            : bValue.localeCompare(aValue, 'sv');
    });

    rows.forEach(row => tbody.appendChild(row));
}

// ===========================
// EXPORT TILL CSV
// ===========================
function exportToCSV(tableId, filename) {
    const table = document.getElementById(tableId);
    if (!table) return;

    const csv = [];
    table.querySelectorAll('tr').forEach(row => {
        const cols = row.querySelectorAll('td, th');
        const rowData = Array.from(cols)
            .map(col => col.querySelector('button') ? '' : `"${col.textContent.trim()}"`)
            .filter(t => t !== '""');
        csv.push(rowData.join(','));
    });

    const blob = new Blob([csv.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.setAttribute('href', URL.createObjectURL(blob));
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// ===========================
// INITIALISERING
// ===========================
document.addEventListener('DOMContentLoaded', function () {
    console.log('IT-Inventariesystem initierat');

    // Hämta all data från databasen vid sidladdning
    loadInventoryFromDB();

    // Sökfält
    const searchField = document.getElementById('searchField');
    if (searchField) {
        searchField.addEventListener('keypress', e => { if (e.key === 'Enter') searchInventory(); });
        searchField.addEventListener('input', searchInventory);
    }

    // Filterknappar
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(btn => {
        btn.addEventListener('click', function () {
            filterButtons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            filterCategory(this.getAttribute('data-filter'));
        });
    });

    // Sorteringsbara kolumnrubriker
    document.querySelectorAll('th').forEach(header => {
        if (!header.textContent.includes('Åtgärder')) {
            header.style.cursor = 'pointer';
            header.title = 'Klicka för att sortera';
        }
    });
});