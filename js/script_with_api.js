// ===========================
// SÖKFUNKTION
// ===========================
function searchInventory() {
    const searchTerm = document.getElementById('searchField').value.toLowerCase().trim();

    // Sök i båda tabellerna
    searchInTable('devicesData', searchTerm);
    searchInTable('consumablesData', searchTerm);

    // Visa meddelande om inga resultat hittades
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
    // Visa/dölj tabeller baserat på kategori
    const deviceRows = document.querySelectorAll('[data-category="devices"]');
    const consumableRows = document.querySelectorAll('[data-category="consumables"]');
    const deviceSection = document.querySelector('.inventory-section:has(#devicesTable)');
    const consumableSection = document.querySelector('.inventory-section:has(#consumablesTable)');

    if (category === 'all') {
        // Visa allt
        showRows(deviceRows);
        showRows(consumableRows);
        if (deviceSection) deviceSection.style.display = 'block';
        if (consumableSection) consumableSection.style.display = 'block';
    } else if (category === 'devices') {
        // Visa endast enheter
        showRows(deviceRows);
        hideRows(consumableRows);
        if (deviceSection) deviceSection.style.display = 'block';
        if (consumableSection) consumableSection.style.display = 'none';
    } else if (category === 'consumables') {
        // Visa endast förbrukningsvaror
        hideRows(deviceRows);
        showRows(consumableRows);
        if (deviceSection) deviceSection.style.display = 'none';
        if (consumableSection) consumableSection.style.display = 'block';
    }
}

function showRows(rows) {
    rows.forEach(row => {
        row.style.display = '';
    });
}

function hideRows(rows) {
    rows.forEach(row => {
        row.style.display = 'none';
    });
}

// ===========================
// REDIGERA FUNKTION
// ===========================
function editItem(itemId, type = 'device') {
    // Denna funktion kommer att kopplas till PHP backend senare
    // För nu, visa bara en bekräftelse
    alert(`Redigera objekt: ${itemId}\n\nDenna funktion kommer att kopplas till PHP backend.`);

    // TODO: Implementera modal/form för redigering
    // TODO: Skicka data till PHP endpoint
    console.log(`Redigerar objekt med ID: ${itemId}, typ: ${type}`);
}

// ===========================
// LÄGG TILL NY ENHET FUNKTION
// ===========================
function addNewItem() {
    // Denna funktion kommer att kopplas till PHP backend senare
    alert('Lägg till ny enhet/vara\n\nDenna funktion kommer att öppna ett formulär för att lägga till nya objekt.');

    // TODO: Öppna modal med formulär
    // TODO: Skicka data till PHP endpoint för att spara i databas
    console.log('Öppnar formulär för att lägga till ny enhet/vara');
}

// ===========================
// LAGER VARNINGAR
// ===========================
function checkStockLevels() {
    // Kontrollera lagervarningar för förbrukningsvaror
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

    // Visa varningar om det behövs
    if (outOfStockItems.length > 0) {
        console.warn('Slut i lager:', outOfStockItems);
    }
    if (lowStockItems.length > 0) {
        console.warn('Lågt lager:', lowStockItems);
    }

    return {
        lowStock: lowStockItems,
        outOfStock: outOfStockItems
    };
}

// ===========================
// SORTERINGSFUNKTION
// ===========================
function sortTable(tableId, columnIndex) {
    const table = document.getElementById(tableId);
    if (!table) return;

    const tbody = table.querySelector('tbody');
    const rows = Array.from(tbody.querySelectorAll('tr'));

    // Bestäm sorteringsordning
    const isAscending = table.dataset.sortOrder !== 'asc';
    table.dataset.sortOrder = isAscending ? 'asc' : 'desc';

    // Sortera rader
    rows.sort((a, b) => {
        const aValue = a.cells[columnIndex].textContent.trim();
        const bValue = b.cells[columnIndex].textContent.trim();

        // Försök konvertera till nummer om möjligt
        const aNum = parseFloat(aValue);
        const bNum = parseFloat(bValue);

        if (!isNaN(aNum) && !isNaN(bNum)) {
            return isAscending ? aNum - bNum : bNum - aNum;
        }

        // Annars, sortera som text
        return isAscending
            ? aValue.localeCompare(bValue, 'sv')
            : bValue.localeCompare(aValue, 'sv');
    });

    // Uppdatera tabellen
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
            // Ta bort redigera-knappen från export
            if (col.querySelector('button')) return '';
            return `"${col.textContent.trim()}"`;
        }).filter(text => text !== '""');

        csv.push(rowData.join(','));
    });

    // Skapa och ladda ner fil
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

    // Räkna aktiva och underhållsenheter
    deviceRows.forEach(row => {
        const statusCell = row.querySelector('.status-badge');
        if (statusCell) {
            if (statusCell.classList.contains('status-active')) {
                stats.activeDevices++;
            } else if (statusCell.classList.contains('status-maintenance')) {
                stats.maintenanceDevices++;
            }
        }
    });

    return stats;
}

// ===========================
// LADDA SAMPLE DATA (om ingen databas)
// ===========================
function loadSampleData() {
    const devicesData = [
        { id: 'DEV-001', name: 'Laptop Dell XPS 15', type: 'Laptop', owner: 'Anna Andersson', status: 'Aktiv', updated: '2026-02-05' },
        { id: 'DEV-002', name: 'Desktop HP EliteDesk', type: 'Desktop', owner: 'Erik Eriksson', status: 'Aktiv', updated: '2026-02-04' },
        { id: 'DEV-003', name: 'MacBook Pro 14"', type: 'Laptop', owner: 'Sara Svensson', status: 'Underhåll', updated: '2026-02-03' }
    ];

    const consumablesData = [
        { id: 'CONS-001', name: 'Logitech MX Master 3', category: 'Möss', stock: 15, minLevel: 5 },
        { id: 'CONS-002', name: 'Sony WH-1000XM5', category: 'Hörlurar', stock: 8, minLevel: 5 },
        { id: 'CONS-003', name: 'USB-C Kabel 2m', category: 'Kablar', stock: 3, minLevel: 10 },
        { id: 'CONS-004', name: 'Logitech MX Keys', category: 'Tangentbord', stock: 0, minLevel: 3 },
        { id: 'CONS-005', name: 'Dell P2422H Monitor', category: 'Skärmar', stock: 12, minLevel: 5 }
    ];

    const devicesBody = document.getElementById('devicesData');
    const consumablesBody = document.getElementById('consumablesData');

    if (devicesBody) {
        devicesData.forEach(device => {
            const statusClass = device.status === 'Aktiv' ? 'status-active' : 'status-maintenance';
            const row = document.createElement('tr');
            row.setAttribute('data-category', 'devices');
            row.innerHTML = `
                <td>${device.id}</td>
                <td>${device.name}</td>
                <td>${device.type}</td>
                <td>${device.owner}</td>
                <td><span class="status-badge ${statusClass}">${device.status}</span></td>
                <td>${device.updated}</td>
                <td><button class="edit-btn" data-item-id="${device.id}" data-item-type="device">Redigera</button></td>
            `;
            devicesBody.appendChild(row);
        });
    }

    if (consumablesBody) {
        consumablesData.forEach(item => {
            let stockClass = 'stock-good';
            let stockStatus = 'I lager';

            if (item.stock === 0) {
                stockClass = 'stock-out';
                stockStatus = 'Slut i lager';
            } else if (item.stock < item.minLevel) {
                stockClass = 'stock-low';
                stockStatus = 'Lågt lager';
            }

            const row = document.createElement('tr');
            row.setAttribute('data-category', 'consumables');
            row.innerHTML = `
                <td>${item.id}</td>
                <td>${item.name}</td>
                <td>${item.category}</td>
                <td>${item.stock}</td>
                <td>${item.minLevel}</td>
                <td><span class="stock-badge ${stockClass}">${stockStatus}</span></td>
                <td><button class="edit-btn" data-item-id="${item.id}" data-item-type="consumable">Redigera</button></td>
            `;
            consumablesBody.appendChild(row);
        });
    }
}

// ===========================
// HJÄLPFUNKTIONER
// ===========================

// Formatera datum
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('sv-SE');
}

// Validera formulärdata (kommer användas senare med PHP)
function validateForm(formData) {
    const errors = [];

    if (!formData.name || formData.name.trim() === '') {
        errors.push('Namn måste anges');
    }

    if (formData.quantity && formData.quantity < 0) {
        errors.push('Antal kan inte vara negativt');
    }

    return {
        isValid: errors.length === 0,
        errors: errors
    };
}

// ===========================
// INITIALISERING
// ===========================
document.addEventListener('DOMContentLoaded', function() {
    console.log('IT-Inventariesystem initierat');

    // Ladda sample data
    loadSampleData();

    // Lägg till event listener för sökknapp
    const searchBtn = document.getElementById('searchBtn');
    if (searchBtn) {
        searchBtn.addEventListener('click', searchInventory);
    }

    // Lägg till event listener för sökfält
    const searchField = document.getElementById('searchField');
    if (searchField) {
        searchField.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                searchInventory();
            }
        });

        // Realtidssökning när användaren skriver
        searchField.addEventListener('input', function() {
            searchInventory();
        });
    }

    // Lägg till event listeners för filterknappar
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            // Ta bort active från alla knappar
            filterButtons.forEach(b => b.classList.remove('active'));
            // Lägg till active på klickad knapp
            this.classList.add('active');
            // Filtrera baserat på data-filter attribut
            const filter = this.getAttribute('data-filter');
            filterCategory(filter);
        });
    });

    // Lägg till event listener för "Lägg till ny" knapp
    const addNewItemBtn = document.getElementById('addNewItemBtn');
    if (addNewItemBtn) {
        addNewItemBtn.addEventListener('click', addNewItem);
    }

    // Lägg till event listeners för alla redigera-knappar (delegation)
    document.addEventListener('click', function(e) {
        if (e.target && e.target.classList.contains('edit-btn')) {
            const itemId = e.target.getAttribute('data-item-id');
            const itemType = e.target.getAttribute('data-item-type');
            editItem(itemId, itemType);
        }
    });

    // Kontrollera lagernivåer vid sidladdning
    setTimeout(() => {
        const stockStatus = checkStockLevels();
        const stats = getInventoryStats();
        console.log('Inventariestatistik:', stats);
    }, 500);

    // Lägg till klickbara headers för sortering (kan implementeras senare)
    const headers = document.querySelectorAll('th');
    headers.forEach((header, index) => {
        if (!header.textContent.includes('Åtgärder')) {
            header.style.cursor = 'pointer';
            header.title = 'Klicka för att sortera';
        }
    });
});