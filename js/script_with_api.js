// ===========================
// SÖKFUNKTION
// ===========================
function searchInventory() {
    const searchTerm = document.getElementById('searchField').value.toLowerCase().trim();

    searchInTable('devicesData', searchTerm);
    searchInTable('consumablesData', searchTerm);

    if (searchTerm !== '') {
        console.log(`Söker efter: "${searchTerm}"`);
    }
}

function searchInTable(tableBodyId, searchTerm) {
    const tableBody = document.getElementById(tableBodyId);
    if (!tableBody) return;

    const rows = tableBody.getElementsByTagName('tr');
    let visibleCount = 0;

    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const text = row.textContent || row.innerText;

        if (searchTerm === '' || text.toLowerCase().includes(searchTerm)) {
            row.style.display = '';
            visibleCount++;
        } else {
            row.style.display = 'none';
        }
    }

    return visibleCount;
}

// ===========================
// FILTERFUNKTION
// ===========================
function filterCategory(category) {
    const deviceRows = document.querySelectorAll('[data-category="devices"]');
    const consumableRows = document.querySelectorAll('[data-category="consumables"]');
    const deviceSection = document.querySelector('.inventory-section:has(#devicesTable)');
    const consumableSection = document.querySelector('.inventory-section:has(#consumablesTable)');

    if (category === 'all') {
        showRows(deviceRows);
        showRows(consumableRows);
        if (deviceSection) deviceSection.style.display = 'block';
        if (consumableSection) consumableSection.style.display = 'block';
    } else if (category === 'devices') {
        showRows(deviceRows);
        hideRows(consumableRows);
        if (deviceSection) deviceSection.style.display = 'block';
        if (consumableSection) consumableSection.style.display = 'none';
    } else if (category === 'consumables') {
        hideRows(deviceRows);
        showRows(consumableRows);
        if (deviceSection) deviceSection.style.display = 'none';
        if (consumableSection) consumableSection.style.display = 'block';
    }
}

function showRows(rows) {
    rows.forEach(row => { row.style.display = ''; });
}

function hideRows(rows) {
    rows.forEach(row => { row.style.display = 'none'; });
}

// ===========================
// REDIGERA FUNKTION
// ===========================
function editItem(itemId, type = 'device') {
    alert(`Redigera objekt: ${itemId}\n\nDenna funktion kommer att kopplas till PHP backend.`);
    console.log(`Redigerar objekt med ID: ${itemId}, typ: ${type}`);
}

// ===========================
// LÄGG TILL NY ENHET FUNKTION
// ===========================
function addNewItem() {
    alert('Lägg till ny enhet/vara\n\nDenna funktion kommer att öppna ett formulär för att lägga till nya objekt.');
    console.log('Öppnar formulär för att lägga till ny enhet/vara');
}

// ===========================
// LAGER VARNINGAR
// ===========================
function checkStockLevels() {
    const consumableRows = document.querySelectorAll('#consumablesData tr');
    let lowStockItems = [];
    let outOfStockItems = [];

    consumableRows.forEach(row => {
        const cells = row.getElementsByTagName('td');
        if (cells.length >= 6) {
            const itemName = cells[1].textContent;
            const currentStock = parseInt(cells[3].textContent);
            const minLevel = parseInt(cells[4].textContent);

            if (currentStock === 0) {
                outOfStockItems.push(itemName);
            } else if (currentStock < minLevel) {
                lowStockItems.push(itemName);
            }
        }
    });

    if (outOfStockItems.length > 0) console.warn('Slut i lager:', outOfStockItems);
    if (lowStockItems.length > 0) console.warn('Lågt lager:', lowStockItems);

    return { lowStock: lowStockItems, outOfStock: outOfStockItems };
}

// ===========================
// SORTERINGSFUNKTION
// ===========================
function sortTable(tableId, columnIndex) {
    const table = document.getElementById(tableId);
    if (!table) return;

    const tbody = table.querySelector('tbody');
    const rows = Array.from(tbody.querySelectorAll('tr'));

    const isAscending = table.dataset.sortOrder !== 'asc';
    table.dataset.sortOrder = isAscending ? 'asc' : 'desc';

    rows.sort((a, b) => {
        const aValue = a.cells[columnIndex].textContent.trim();
        const bValue = b.cells[columnIndex].textContent.trim();

        const aNum = parseFloat(aValue);
        const bNum = parseFloat(bValue);

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
// EXPORT FUNKTIONER
// ===========================
function exportToCSV(tableId, filename) {
    const table = document.getElementById(tableId);
    if (!table) return;

    let csv = [];
    const rows = table.querySelectorAll('tr');

    rows.forEach(row => {
        const cols = row.querySelectorAll('td, th');
        const rowData = Array.from(cols).map(col => {
            if (col.querySelector('button')) return '';
            return `"${col.textContent.trim()}"`;
        }).filter(text => text !== '""');

        csv.push(rowData.join(','));
    });

    const csvContent = csv.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// ===========================
// STATISTIK FUNKTIONER
// ===========================
function getInventoryStats() {
    const deviceRows = document.querySelectorAll('#devicesData tr:not([style*="display: none"])');
    const consumableRows = document.querySelectorAll('#consumablesData tr:not([style*="display: none"])');

    const stats = {
        totalDevices: deviceRows.length,
        totalConsumables: consumableRows.length,
        activeDevices: 0,
        maintenanceDevices: 0,
        stockWarnings: checkStockLevels()
    };

    deviceRows.forEach(row => {
        const statusCell = row.querySelector('.status-badge');
        if (statusCell) {
            if (statusCell.classList.contains('status-active')) stats.activeDevices++;
            else if (statusCell.classList.contains('status-maintenance')) stats.maintenanceDevices++;
        }
    });

    return stats;
}

// ===========================
// HJÄLPFUNKTIONER
// ===========================
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('sv-SE');
}

function validateForm(formData) {
    const errors = [];

    if (!formData.name || formData.name.trim() === '') {
        errors.push('Namn måste anges');
    }

    if (formData.quantity && formData.quantity < 0) {
        errors.push('Antal kan inte vara negativt');
    }

    return { isValid: errors.length === 0, errors: errors };
}

// ===========================
// INITIALISERING
// ===========================
document.addEventListener('DOMContentLoaded', function() {
    console.log('IT-Inventariesystem initierat');

    // loadSampleData() är BORTTAGEN – tabellerna börjar tomma

    const searchField = document.getElementById('searchField');
    if (searchField) {
        searchField.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') searchInventory();
        });
        searchField.addEventListener('input', function() {
            searchInventory();
        });
    }

    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            filterButtons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            const filter = this.getAttribute('data-filter');
            filterCategory(filter);
        });
    });

    const addNewItemBtn = document.getElementById('addNewItemBtn');
    if (addNewItemBtn) {
        addNewItemBtn.addEventListener('click', addNewItem);
    }

    document.addEventListener('click', function(e) {
        if (e.target && e.target.classList.contains('edit-btn')) {
            const itemId = e.target.getAttribute('data-item-id');
            const itemType = e.target.getAttribute('data-item-type');
            editItem(itemId, itemType);
        }
    });

    const headers = document.querySelectorAll('th');
    headers.forEach((header) => {
        if (!header.textContent.includes('Åtgärder')) {
            header.style.cursor = 'pointer';
            header.title = 'Klicka för att sortera';
        }
    });
});