let uploadedFile = null;
let parsedData = null;

// ===========================
// SÃ„KERHETSKONSTANTER
// ===========================
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

// ===========================
// SÃ„KERHETSFUNKTIONER
// ===========================
function sanitizeFilename(filename) {
    // Ta bort farliga tecken och begrÃ¤nsa lÃ¤ngd
    return filename.replace(/[<>:"/\\|?*]/g, '_').substring(0, 255);
}

function safeParseInt(value, defaultValue = 0) {
    const parsed = parseInt(value);
    return (!isNaN(parsed) && parsed >= 0) ? parsed : defaultValue;
}

function getInventoryData() {
    try {
        const data = JSON.parse(localStorage.getItem('inventoryData') || '{"devices": [], "consumables": []}');
        // Validera struktur
        if (!data || typeof data !== 'object') {
            return {"devices": [], "consumables": []};
        }
        if (!Array.isArray(data.devices)) data.devices = [];
        if (!Array.isArray(data.consumables)) data.consumables = [];
        return data;
    } catch (e) {
        console.error('Fel vid lÃ¤sning av localStorage:', e);
        return {"devices": [], "consumables": []};
    }
}

function generateId(prefix) {
    // AnvÃ¤nd crypto.randomUUID() om tillgÃ¤nglig, annars fallback
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return `${prefix}-${crypto.randomUUID()}`;
    }
    // Fallback fÃ¶r Ã¤ldre webblÃ¤sare
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000000);
    return `${prefix}-${timestamp}-${random}`;
}

// ===========================
// DRAG AND DROP FUNKTIONALITET
// ===========================
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');

if (uploadArea) {
    // FÃ¶rhindra default drag behaviors
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, preventDefaults, false);
        document.body.addEventListener(eventName, preventDefaults, false);
    });

    // Highlight drop area nÃ¤r fil dras Ã¶ver
    ['dragenter', 'dragover'].forEach(eventName => {
        uploadArea.addEventListener(eventName, highlight, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, unhighlight, false);
    });

    // Hantera dropped filer
    uploadArea.addEventListener('drop', handleDrop, false);
}

if (fileInput) {
    fileInput.addEventListener('change', handleFileSelect, false);
}

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

function highlight(e) {
    uploadArea.classList.add('highlight');
}

function unhighlight(e) {
    uploadArea.classList.remove('highlight');
}

function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;
    handleFiles(files);
}

function handleFileSelect(e) {
    const files = e.target.files;
    handleFiles(files);
}

function handleFiles(files) {
    if (files.length > 0) {
        const file = files[0];

        // Validera filstorlek
        if (file.size > MAX_FILE_SIZE) {
            alert(`Filen Ã¤r fÃ¶r stor. Max ${Math.round(MAX_FILE_SIZE / 1024 / 1024)} MB tillÃ¥ten.`);
            return;
        }

        // Validera filtyp
        const validTypes = [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-excel'
        ];

        if (!validTypes.includes(file.type) &&
            !file.name.endsWith('.xlsx') &&
            !file.name.endsWith('.xls')) {
            alert('VÃ¤nligen vÃ¤lj en Excel-fil (.xlsx eller .xls)');
            return;
        }

        uploadedFile = file;
        showFileInfo(file);
    }
}

function showFileInfo(file) {
    const fileInfo = document.getElementById('fileInfo');
    const fileName = document.getElementById('fileName');
    const uploadArea = document.getElementById('uploadArea');

    // Sanera filnamn innan visning
    const safeName = sanitizeFilename(file.name);
    fileName.textContent = `${safeName} (${formatFileSize(file.size)})`;
    uploadArea.style.display = 'none';
    fileInfo.style.display = 'block';
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

// ===========================
// PROCESSA EXCEL-FIL
// ===========================
function processFile() {
    if (!uploadedFile) {
        alert('Ingen fil vald!');
        return;
    }

    const reader = new FileReader();

    reader.onload = function(e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });

            // Ta fÃ¶rsta arbetsbladet
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];

            // Konvertera till JSON
            const jsonData = XLSX.utils.sheet_to_json(worksheet);

            if (jsonData.length === 0) {
                alert('Excel-filen verkar vara tom!');
                return;
            }

            // BegrÃ¤nsa antal rader fÃ¶r att undvika DoS
            if (jsonData.length > 10000) {
                alert('Filen innehÃ¥ller fÃ¶r mÃ¥nga rader. Max 10,000 rader tillÃ¥tna.');
                return;
            }

            parsedData = jsonData;
            displayPreview(jsonData);

        } catch (error) {
            console.error('Fel vid lÃ¤sning av Excel-fil:', error);
            alert('Kunde inte lÃ¤sa Excel-filen. Kontrollera att formatet Ã¤r korrekt.');
        }
    };

    reader.onerror = function() {
        alert('Fel uppstod vid lÃ¤sning av filen.');
    };

    reader.readAsArrayBuffer(uploadedFile);
}

// ===========================
// VISA FÃ–RHANDSGRANSKNING
// ===========================
function displayPreview(data) {
    const previewSection = document.getElementById('previewSection');
    const previewTableHead = document.getElementById('previewTableHead');
    const previewTableBody = document.getElementById('previewTableBody');

    // Visa preview-sektionen
    previewSection.style.display = 'block';

    // Scrolla ner till preview
    previewSection.scrollIntoView({ behavior: 'smooth' });

    // Rensa tidigare data
    previewTableHead.innerHTML = '';
    previewTableBody.innerHTML = '';

    if (data.length === 0) return;

    // Skapa headers frÃ¥n fÃ¶rsta objektet
    const headers = Object.keys(data[0]);
    const headerRow = document.createElement('tr');
    headers.forEach(header => {
        const th = document.createElement('th');
        th.textContent = header;
        headerRow.appendChild(th);
    });
    previewTableHead.appendChild(headerRow);

    // LÃ¤gg till data rader (max 10 fÃ¶r preview)
    const previewLimit = Math.min(data.length, 10);
    for (let i = 0; i < previewLimit; i++) {
        const row = document.createElement('tr');
        headers.forEach(header => {
            const td = document.createElement('td');
            // AnvÃ¤nd textContent fÃ¶r att fÃ¶rhindra XSS
            td.textContent = data[i][header] || '';
            row.appendChild(td);
        });
        previewTableBody.appendChild(row);
    }

    // Uppdatera statistik
    updateStats(data);
}

function updateStats(data) {
    document.getElementById('totalRows').textContent = data.length;

    // FÃ¶rsÃ¶k identifiera typ baserat pÃ¥ kolumnnamn
    let devicesCount = 0;
    let consumablesCount = 0;

    data.forEach(row => {
        const hasOwner = row['Ã„gare'] || row['Owner'] || row['Ã¤gare'];
        const hasStock = row['Antal i lager'] || row['Stock'] || row['Antal'];

        if (hasOwner) {
            devicesCount++;
        } else if (hasStock !== undefined) {
            consumablesCount++;
        }
    });

    document.getElementById('devicesCount').textContent = devicesCount;
    document.getElementById('consumablesCount').textContent = consumablesCount;
}

// ===========================
// BEKRÃ„FTA OCH IMPORTERA
// ===========================
function confirmImport() {
    if (!parsedData || parsedData.length === 0) {
        alert('Ingen data att importera!');
        return;
    }

    // HÃ¤mta befintlig data med sÃ¤ker hantering
    const existingData = getInventoryData();

    // Kategorisera data
    parsedData.forEach(row => {
        const hasOwner = row['Ã„gare'] || row['Owner'] || row['Ã¤gare'];
        const hasStock = row['Antal i lager'] || row['Stock'] || row['Antal'];

        if (hasOwner) {
            // Det Ã¤r en enhet
            const device = {
                id: row['Enhet ID'] || row['ID'] || row['id'] || generateId('DEV'),
                name: String(row['Enhetsnamn'] || row['Name'] || row['Namn'] || 'OkÃ¤nd enhet').substring(0, 255),
                type: String(row['Typ'] || row['Type'] || 'OkÃ¤nd').substring(0, 100),
                owner: String(hasOwner).substring(0, 255),
                status: String(row['Status'] || 'Aktiv').substring(0, 50),
                lastUpdated: new Date().toISOString().split('T')[0]
            };
            existingData.devices.push(device);
        } else if (hasStock !== undefined) {
            // Det Ã¤r en fÃ¶rbrukningsvara
            const consumable = {
                id: row['Produkt ID'] || row['ID'] || row['id'] || generateId('CONS'),
                name: String(row['Produktnamn'] || row['Name'] || row['Namn'] || 'OkÃ¤nd produkt').substring(0, 255),
                category: String(row['Kategori'] || row['Category'] || 'OkÃ¤nd').substring(0, 100),
                stock: safeParseInt(hasStock, 0),
                minLevel: safeParseInt(row['Minimum nivÃ¥'] || row['Min Level'] || row['Minimum'], 5)
            };
            existingData.consumables.push(consumable);
        }
    });

    // Spara till localStorage
    try {
        localStorage.setItem('inventoryData', JSON.stringify(existingData));
    } catch (e) {
        alert('Kunde inte spara data. Kontrollera att localStorage Ã¤r aktiverat.');
        return;
    }

    // Visa bekrÃ¤ftelse
    alert(`âœ… Import lyckades!\n\n${parsedData.length} rader importerade.\n\nGÃ¥ till Inventarie-sidan fÃ¶r att se datan.`);

    // Reset efter 2 sekunder och omdirigera
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 2000);
}

// ===========================
// RESET UPLOAD
// ===========================
function resetUpload() {
    uploadedFile = null;
    parsedData = null;

    const uploadArea = document.getElementById('uploadArea');
    const fileInfo = document.getElementById('fileInfo');
    const previewSection = document.getElementById('previewSection');
    const fileInput = document.getElementById('fileInput');

    uploadArea.style.display = 'block';
    fileInfo.style.display = 'none';
    previewSection.style.display = 'none';

    if (fileInput) {
        fileInput.value = '';
    }
}

// ===========================
// LADDA NER MALLAR
// ===========================
function downloadDeviceTemplate() {
    const data = [
        {
            'Enhet ID': 'DEV-001',
            'Enhetsnamn': 'Laptop Dell XPS 15',
            'Typ': 'Laptop',
            'Ã„gare': 'Anna Andersson',
            'Status': 'Aktiv'
        },
        {
            'Enhet ID': 'DEV-002',
            'Enhetsnamn': 'Desktop HP EliteDesk',
            'Typ': 'Desktop',
            'Ã„gare': 'Erik Eriksson',
            'Status': 'Aktiv'
        },
        {
            'Enhet ID': 'DEV-003',
            'Enhetsnamn': 'MacBook Pro 14"',
            'Typ': 'Laptop',
            'Ã„gare': 'Sara Svensson',
            'Status': 'UnderhÃ¥ll'
        }
    ];

    downloadExcel(data, 'Enhetsmall.xlsx');
}

function downloadConsumableTemplate() {
    const data = [
        {
            'Produkt ID': 'CONS-001',
            'Produktnamn': 'Logitech MX Master 3',
            'Kategori': 'MÃ¶ss',
            'Antal i lager': 15,
            'Minimum nivÃ¥': 5
        },
        {
            'Produkt ID': 'CONS-002',
            'Produktnamn': 'Sony WH-1000XM5',
            'Kategori': 'HÃ¶rlurar',
            'Antal i lager': 8,
            'Minimum nivÃ¥': 5
        },
        {
            'Produkt ID': 'CONS-003',
            'Produktnamn': 'USB-C Kabel 2m',
            'Kategori': 'Kablar',
            'Antal i lager': 3,
            'Minimum nivÃ¥': 10
        }
    ];

    downloadExcel(data, 'FÃ¶rbrukningsvarumall.xlsx');
}

function downloadExcel(data, filename) {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');

    // Generera Excel-fil och ladda ner
    XLSX.writeFile(workbook, filename);
}

// ===========================
// INITIALISERING
// ===========================
document.addEventListener('DOMContentLoaded', function() {
    console.log('Upload-sida initierad');
});