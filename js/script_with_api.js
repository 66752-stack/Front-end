// ===========================
// SÄKERHETSFUNKTIONER
// ===========================
function sanitizeInput(input) {
    // Grundläggande sanering av input
    if (typeof input !== 'string') return '';
    return input.trim().substring(0, 1000);
}

function escapeCsvValue(value) {
    // Konvertera till sträng
    value = String(value);

    // Förhindra CSV/Formula injection
    const dangerousChars = ['=', '+', '-', '@', '\t', '\r'];
    if (dangerousChars.some(char => value.startsWith(char))) {
        value = "'" + value; // Prefix med single quote
    }

    // Escape quotes och wrap i quotes
    return `"${value.replace(/"/g, '""')}"`;
}

// ===========================
// SÖKFUNKTION
// ===========================
function searchInventory() {
    const searchField = document.getElementById('searchField');
    if (!searchField) return;

    const searchTerm = sanitizeInput(searchField.value).toLowerCase();

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

// Lägg till enter-tangent support för sökfältet
document.addEventListener('DOMContentLoaded', function() {
    const searchField = document.getElementById('searchField');
    if (searchField) {
        searchField.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                searchInventory();
            }
        });

        // RealtidssÃ¶kning när användaren skriver
        searchField.addEventListener('input', function() {
            searchInventory();
        });
    }
});

// ===========================
// FILTERFUNKTION - FIXAD VERSION
// ===========================
function filterCategory(category, buttonElement) {
    // Hantera både när funktionen anropas med 'this' från onclick eller med event
    let targetButton = buttonElement;

    // Om buttonElement inte är ett element, försök hitta det från event
    if (!targetButton || !targetButton.classList) {
        targetButton = window.event?.target;
    }

    // Om vi fortfarande inte har en knapp, avbryt
    if (!targetButton || !targetButton.classList) {
        console.warn('Ingen knapp-element hittad för filtrering');
        return;
    }

    // Uppdatera aktiv klass på filter knappar
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(btn => {
        btn.classList.remove('active');
    });
    targetButton.classList.add('active');

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
function editItem(itemId) {
    // Sanera itemId innan användning
    const safeId = sanitizeInput(itemId);

    // Denna funktion kommer att kopplas till PHP backend senare
    // För nu, visa bara en bekräftelse
    alert(`Redigera objekt: ${safeId}\n\nDenna funktion kommer att kopplas till PHP backend.`);

    // TODO: Implementera modal/form för redigering
    // TODO: Skicka data till PHP endpoint
    console.log(`Redigerar objekt med ID: ${safeId}`);
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

            // Validera att parsningen lyckades
            if (!isNaN(currentStock) && !isNaN(minLevel)) {
                if (currentStock === 0) {
                    outOfStockItems.push(itemName);
                } else if (currentStock < minLevel) {
                    lowStockItems.push(itemName);
                }
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
    if (!tbody) return;

    const rows = Array.from(tbody.querySelectorAll('tr'));

    // Bestäm sorteringsordning
    const isAscending = table.dataset.sortOrder !== 'asc';
    table.dataset.sortOrder = isAscending ? 'asc' : 'desc';

    // Validera columnIndex
    if (columnIndex < 0 || rows.length === 0) return;
    if (rows[0].cells.length <= columnIndex) return;

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

    // Sanera filnamn
    const safeFilename = filename.replace(/[^a-zA-Z0-9_\-\.]/g, '_');

    let csv = [];
    const rows = table.querySelectorAll('tr');

    rows.forEach(row => {
        const cols = row.querySelectorAll('td, th');
        const rowData = Array.from(cols).map(col => {
            // Ta bort redigera-knappen från export
            if (col.querySelector('button')) return '';
            // Använd säker CSV escaping
            return escapeCsvValue(col.textContent.trim());
        }).filter(text => text !== '""');

        if (rowData.length > 0) {
            csv.push(rowData.join(','));
        }
    });

    // Skapa och ladda ner fil
    const csvContent = csv.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', safeFilename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Rensa URL objekt
    URL.revokeObjectURL(url);
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
// INITIALISERING
// ===========================
document.addEventListener('DOMContentLoaded', function() {
    console.log('IT-Inventariesystem initierat');

    // Kontrollera lagernivåer vid sidladdning
    const stockStatus = checkStockLevels();

    // Visa statistik i konsolen
    const stats = getInventoryStats();
    console.log('Inventariestatistik:', stats);

    // Lägg till klickbara headers för sortering (kan implementeras senare)
    const headers = document.querySelectorAll('th');
    headers.forEach((header, index) => {
        if (!header.textContent.includes('Åtgärder')) {
            header.style.cursor = 'pointer';
            header.title = 'Klicka för att sortera';
        }
    });
});

// ===========================
// HJÄLPFUNKTIONER
// ===========================

// Formatera datum
function formatDate(dateString) {
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
            return 'Ogiltigt datum';
        }
        return date.toLocaleDateString('sv-SE');
    } catch (e) {
        return 'Ogiltigt datum';
    }
}

// Validera formulärdata (kommer användas senare med PHP)
function validateForm(formData) {
    const errors = [];

    if (!formData.name || formData.name.trim() === '') {
        errors.push('Namn måste anges');
    }

    if (formData.name && formData.name.length > 255) {
        errors.push('Namn får max vara 255 tecken');
    }

    if (formData.quantity !== undefined) {
        const qty = parseInt(formData.quantity);
        if (isNaN(qty) || qty < 0) {
            errors.push('Antal måste vara ett positivt nummer');
        }
    }

    return {
        isValid: errors.length === 0,
        errors: errors
    };
}