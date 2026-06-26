// =============================================================
//  script.js — Form Teknisi & Data Management (ITS Scale)
//  Sesuai dengan struktur HTML: index.html + script.js
// =============================================================

// ─────────────────────────────────────────────
//  STATE GLOBAL
// ─────────────────────────────────────────────
let currentPage    = 1;
let currentEditIndex = null;

// ─────────────────────────────────────────────
//  STORAGE  (localStorage agar data tetap ada setelah refresh)
// ─────────────────────────────────────────────
function getData() {
    try {
        return JSON.parse(localStorage.getItem('dataTeknisi')) || [];
    } catch (_) {
        return [];
    }
}

function setData(arr) {
    localStorage.setItem('dataTeknisi', JSON.stringify(arr));
}

// ─────────────────────────────────────────────
//  TOAST NOTIFICATION  (mengganti alert())
// ─────────────────────────────────────────────
function showToast(msg, type) {
    type = type || 'success';
    var t = document.getElementById('toast');
    if (!t) return;
    t.textContent = msg;
    t.className = 'toast toast-' + type + ' show';
    clearTimeout(t._timer);
    t._timer = setTimeout(function () { t.className = 'toast'; }, 3200);
}

// ─────────────────────────────────────────────
//  INISIALISASI  (DOMContentLoaded)
// ─────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function () {

    // Tampilkan tanggal hari ini di header
    var dateDisplay = document.getElementById('dateDisplay');
    if (dateDisplay) {
        dateDisplay.textContent = new Date().toLocaleDateString('id-ID', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        });
    }

    // Set default filter tanggal = hari ini
    var todayStr = new Date().toISOString().split('T')[0];
    setVal('filterStart',   todayStr);
    setVal('filterEnd',     todayStr);
    setVal('statusUpdateDate', todayStr);

    renderTable();
    bindEventListeners();
});

// ─────────────────────────────────────────────
//  BIND SEMUA EVENT LISTENER
// ─────────────────────────────────────────────
function bindEventListeners() {

    // ── Tab navigasi ──
    on('tabData',      'click', function () { switchTab('data'); });
    on('tabDashboard', 'click', function () { switchTab('dashboard'); });

    // ── Filter & pencarian  (re-render tabel otomatis) ──
    ['searchInput','searchType','filterStart','filterEnd',
     'entriesPerPage','filterStatus','filterTeknisi'].forEach(function (id) {
        var el = document.getElementById(id);
        if (!el) return;
        el.addEventListener('change', function () { currentPage = 1; renderTable(); });
        if (id === 'searchInput') {
            el.addEventListener('input', function () { currentPage = 1; renderTable(); });
        }
    });

    on('btnResetFilter',     'click', resetFilters);
    on('btnResetDateFilter', 'click', resetDateFilter);

    // ── Form utama ──
    on('btnToggleForm', 'click', openFormNew);
    on('btnCloseForm',  'click', closeForm);
    on('btnCancelEdit', 'click', cancelEdit);
    on('formTeknisi',   'submit', handleFormSubmit);

    // ── Export ──
    on('btnExport', 'click', exportExcel);

    // ── Modal Detail ──
    on('closeModal', 'click', closeDetailModal);
    var detailModal = document.getElementById('detailModal');
    if (detailModal) {
        detailModal.addEventListener('click', function (e) {
            if (e.target === detailModal) closeDetailModal();
        });
    }

    // ── Modal Tambah Status ──
    on('btnTambahStatus',    'click', openStatusModal);
    on('closeStatusModal',   'click', closeStatusModal);
    on('closeStatusFormBtn', 'click', closeStatusModal);
    on('formStatusUpdate',   'submit', handleStatusUpdate);
    var statusModal = document.getElementById('statusModal');
    if (statusModal) {
        statusModal.addEventListener('click', function (e) {
            if (e.target === statusModal) closeStatusModal();
        });
    }
}

// Helper: tambah listener dengan pengecekan null
function on(id, evt, fn) {
    var el = document.getElementById(id);
    if (el) el.addEventListener(evt, fn);
}

// Helper: set value jika elemen ada
function setVal(id, val) {
    var el = document.getElementById(id);
    if (el) el.value = val;
}

// Helper: baca value, default ''
function getVal(id) {
    var el = document.getElementById(id);
    return el ? el.value : '';
}

// ─────────────────────────────────────────────
//  TAB NAVIGATION
// ─────────────────────────────────────────────
function switchTab(tab) {
    var isData = (tab === 'data');
    toggleHidden('contentData',      !isData);
    toggleHidden('contentDashboard', isData);

    var tabData      = document.getElementById('tabData');
    var tabDashboard = document.getElementById('tabDashboard');
    var activeClass  = 'px-5 py-2.5 font-medium text-sm tab-active transition rounded-t';
    var inactiveClass = 'px-5 py-2.5 font-medium text-sm tab-inactive transition rounded-t';

    if (tabData)      tabData.className      = isData  ? activeClass : inactiveClass;
    if (tabDashboard) tabDashboard.className = !isData ? activeClass : inactiveClass;

    if (!isData) renderDashboard();
}

function toggleHidden(id, hide) {
    var el = document.getElementById(id);
    if (!el) return;
    if (hide) el.classList.add('hidden');
    else       el.classList.remove('hidden');
}

// ─────────────────────────────────────────────
//  FORM INPUT DATA BARU
// ─────────────────────────────────────────────
function openFormNew() {
    currentEditIndex = null;
    var form = document.getElementById('formTeknisi');
    if (form) form.reset();

    setInnerText('formTitle', 'Input Data Teknisi Baru');
    setInnerHTML('submitButton', '<i class="fa-solid fa-save mr-1.5"></i> Simpan Data');
    toggleHidden('btnCancelEdit', true);

    var fc = document.getElementById('formContainer');
    if (fc) {
        fc.classList.add('visible');
        fc.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

function openFormEdit(index) {
    var dataArr = getData();
    var item    = dataArr[index];
    if (!item) return;

    currentEditIndex = index;

    // Isi semua field form dari data
    var map = {
        tglDiterima:        item.tglDiterima,
        namaBarang:         item.namaBarang,
        customer:           item.customer,
        serialNumber:       item.serialNumber,
        qtyIn:              item.qtyIn,
        garansi:            item.garansi,
        kerusakan:          item.kerusakan,
        perbaikan:          item.perbaikan,
        pergantian:         item.pergantian,
        tglPengecekan:      item.tglPengecekan,
        namaSales:          item.namaSales,
        statusService:      item.statusService,
        tglStatusService:   item.tglStatusService,
        konfirmasiSales:    item.konfirmasiSales,
        tglKonfirmasi:      item.tglKonfirmasi,
        statusTeknisi:      item.statusTeknisi,
        tglSelesai:         item.tglSelesai,
        namaTeknisi:        item.namaTeknisi,
        statusBarang:       item.statusBarang,
        konfirmasiKirim:    item.konfirmasiKirim,
        tglKonfirmasiKirim: item.tglKonfirmasiKirim,
        keterangan:         item.keterangan
    };

    Object.keys(map).forEach(function (id) {
        setVal(id, map[id] || '');
    });

    setInnerText('formTitle', 'Edit Data Teknisi');
    setInnerHTML('submitButton', '<i class="fa-solid fa-rotate-right mr-1.5"></i> Perbarui Data');
    toggleHidden('btnCancelEdit', false);

    var fc = document.getElementById('formContainer');
    if (fc) {
        fc.classList.add('visible');
        fc.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

function closeForm() {
    var fc = document.getElementById('formContainer');
    if (fc) fc.classList.remove('visible');
    cancelEdit();
}

function cancelEdit() {
    currentEditIndex = null;
    var form = document.getElementById('formTeknisi');
    if (form) form.reset();
    setInnerText('formTitle', 'Input Data Teknisi Baru');
    setInnerHTML('submitButton', '<i class="fa-solid fa-save mr-1.5"></i> Simpan Data');
    toggleHidden('btnCancelEdit', true);
}

// ─────────────────────────────────────────────
//  SIMPAN / PERBARUI DATA
// ─────────────────────────────────────────────
function handleFormSubmit(e) {
    e.preventDefault();

    var dataArr  = getData();
    var existing = (currentEditIndex !== null && dataArr[currentEditIndex])
        ? dataArr[currentEditIndex]
        : {};

    var newData = Object.assign({}, existing, {
        tglDiterima:        getVal('tglDiterima'),
        namaBarang:         getVal('namaBarang').toUpperCase(),
        customer:           getVal('customer'),
        serialNumber:       getVal('serialNumber'),
        qtyIn:              getVal('qtyIn'),
        garansi:            getVal('garansi'),
        kerusakan:          getVal('kerusakan'),
        perbaikan:          getVal('perbaikan'),
        pergantian:         getVal('pergantian'),
        tglPengecekan:      getVal('tglPengecekan'),
        namaSales:          getVal('namaSales'),
        statusService:      getVal('statusService'),
        tglStatusService:   getVal('tglStatusService'),
        konfirmasiSales:    getVal('konfirmasiSales'),
        tglKonfirmasi:      getVal('tglKonfirmasi'),
        statusTeknisi:      getVal('statusTeknisi'),
        tglSelesai:         getVal('tglSelesai'),
        namaTeknisi:        getVal('namaTeknisi'),
        statusBarang:       getVal('statusBarang'),
        konfirmasiKirim:    getVal('konfirmasiKirim'),
        tglKonfirmasiKirim: getVal('tglKonfirmasiKirim'),
        keterangan:         getVal('keterangan'),
        updatedAt:          new Date().toISOString()
    });

    if (currentEditIndex !== null && dataArr[currentEditIndex]) {
        dataArr[currentEditIndex] = newData;
        showToast('Data berhasil diperbarui!');
    } else {
        newData.createdAt = new Date().toISOString();
        dataArr.push(newData);
        showToast('Data berhasil disimpan!');
    }

    setData(dataArr);
    cancelEdit();
    closeForm();
    renderTable();
}

// ─────────────────────────────────────────────
//  HAPUS DATA
// ─────────────────────────────────────────────
function hapusData(index) {
    if (!confirm('Yakin ingin menghapus data ini? Tindakan ini tidak bisa dibatalkan.')) return;
    var dataArr = getData();
    dataArr.splice(index, 1);
    setData(dataArr);
    if (currentEditIndex === index) cancelEdit();
    currentPage = 1;
    renderTable();
    showToast('Data berhasil dihapus.', 'error');
}

// ─────────────────────────────────────────────
//  RESET FILTER
// ─────────────────────────────────────────────
function resetFilters() {
    setVal('searchInput',   '');
    setVal('searchType',    'all');
    setVal('filterStatus',  '');
    setVal('filterTeknisi', '');
    currentPage = 1;
    renderTable();
}

function resetDateFilter() {
    setVal('filterStart', '');
    setVal('filterEnd',   '');
    currentPage = 1;
    renderTable();
}

// ─────────────────────────────────────────────
//  RENDER TABEL
// ─────────────────────────────────────────────
function renderTable() {
    var dataArr       = getData();
    var tbody         = document.getElementById('tableBody');
    if (!tbody) return;

    var keyword       = getVal('searchInput').toLowerCase();
    var sType         = getVal('searchType') || 'all';
    var filterStart   = getVal('filterStart');
    var filterEnd     = getVal('filterEnd');
    var filterStatus  = getVal('filterStatus');
    var filterTeknisi = getVal('filterTeknisi');
    var perPage       = parseInt(getVal('entriesPerPage')) || 10;

    // ── Filter ──
    var filtered = dataArr.filter(function (item) {

        // Keyword search
        if (keyword) {
            var hit = false;
            if (sType === 'serial')   hit = contains(item.serialNumber, keyword);
            else if (sType === 'barang')   hit = contains(item.namaBarang,   keyword);
            else if (sType === 'customer') hit = contains(item.customer,     keyword);
            else hit = [item.namaBarang, item.customer, item.serialNumber,
                        item.namaTeknisi, item.namaSales].some(function (v) {
                            return contains(v, keyword);
                        });
            if (!hit) return false;
        }

        // Filter tanggal
        if (filterStart && item.tglDiterima && item.tglDiterima < filterStart) return false;
        if (filterEnd   && item.tglDiterima && item.tglDiterima > filterEnd)   return false;
        if (!item.tglDiterima && (filterStart || filterEnd)) return false;

        // Filter status & teknisi
        if (filterStatus  && item.statusTeknisi !== filterStatus)  return false;
        if (filterTeknisi && item.namaTeknisi   !== filterTeknisi) return false;

        return true;
    });

    var total      = filtered.length;
    var totalPages = Math.max(1, Math.ceil(total / perPage));
    if (currentPage > totalPages) currentPage = totalPages;
    if (currentPage < 1)          currentPage = 1;

    var start     = (currentPage - 1) * perPage;
    var end       = Math.min(start + perPage, total);
    var paginated = filtered.slice(start, end);

    // ── Render baris ──
    tbody.innerHTML = '';

    if (paginated.length === 0) {
        tbody.innerHTML = '<tr><td colspan="24" class="text-center py-10 text-gray-400">' +
            '<i class="fa-solid fa-inbox text-3xl mb-2 block"></i>Tidak ada data yang cocok dengan filter</td></tr>';
    } else {
        paginated.forEach(function (item, i) {
            var actualIndex  = dataArr.indexOf(item);
            var statusCls    = item.statusTeknisi === 'CLOSE'
                ? 'bg-green-100 text-green-800'
                : 'bg-yellow-100 text-yellow-800';
            var barangBadge  = '';
            if (item.statusBarang === 'Baik')    barangBadge = 'bg-blue-100 text-blue-800';
            else if (item.statusBarang === 'Rusak')   barangBadge = 'bg-red-100 text-red-800';
            else if (item.statusBarang === 'Pending') barangBadge = 'bg-orange-100 text-orange-800';

            var tr = document.createElement('tr');
            tr.className = 'hover:bg-blue-50 transition border-b border-gray-100 text-xs';
            tr.innerHTML =
                '<td class="px-3 py-2.5 border-r border-gray-100 text-center text-gray-400">' + (start + i + 1) + '</td>' +
                '<td class="px-3 py-2.5 border-r border-gray-100 text-center">' +
                  '<div class="inline-flex items-center gap-1">' +
                    '<button onclick="viewData(' + actualIndex + ')" title="Lihat Detail" ' +
                      'class="w-7 h-7 rounded border border-gray-200 bg-white text-gray-400 hover:bg-blue-50 hover:text-blue-600 transition">' +
                      '<i class="fa-solid fa-eye"></i></button>' +
                    '<button onclick="openFormEdit(' + actualIndex + ')" title="Edit" ' +
                      'class="w-7 h-7 rounded border border-gray-200 bg-white text-gray-400 hover:bg-amber-50 hover:text-amber-600 transition">' +
                      '<i class="fa-solid fa-pen"></i></button>' +
                    '<button onclick="hapusData(' + actualIndex + ')" title="Hapus" ' +
                      'class="w-7 h-7 rounded border border-gray-200 bg-white text-gray-400 hover:bg-red-50 hover:text-red-600 transition">' +
                      '<i class="fa-solid fa-trash"></i></button>' +
                  '</div>' +
                '</td>' +
                td(item.tglDiterima) +
                '<td class="px-4 py-2.5 border-r border-gray-100 font-medium text-gray-800 whitespace-nowrap">' + esc(item.namaBarang) + '</td>' +
                td(item.customer) +
                td(item.serialNumber) +
                '<td class="px-3 py-2.5 border-r border-gray-100 text-center">' + esc(item.qtyIn) + '</td>' +
                td(item.garansi) +
                tdTrunc(item.kerusakan, 180) +
                tdTrunc(item.perbaikan, 180) +
                tdTrunc(item.pergantian, 150) +
                td(item.tglPengecekan) +
                td(item.namaSales) +
                td(item.statusService) +
                td(item.tglStatusService) +
                td(item.konfirmasiSales) +
                td(item.tglKonfirmasi) +
                '<td class="px-4 py-2.5 border-r border-gray-100 text-center">' +
                  '<span class="px-2 py-0.5 rounded-full text-xs font-semibold ' + statusCls + '">' + esc(item.statusTeknisi || 'OPEN') + '</span>' +
                '</td>' +
                td(item.tglSelesai) +
                td(item.namaTeknisi) +
                '<td class="px-4 py-2.5 border-r border-gray-100">' +
                  (item.statusBarang
                      ? '<span class="px-2 py-0.5 rounded-full text-xs font-semibold ' + barangBadge + '">' + esc(item.statusBarang) + '</span>'
                      : '-') +
                '</td>' +
                td(item.konfirmasiKirim) +
                td(item.tglKonfirmasiKirim) +
                '<td class="px-4 py-2.5 max-w-[200px] truncate" title="' + esc(item.keterangan) + '">' + esc(item.keterangan) + '</td>';
            tbody.appendChild(tr);
        });
    }

    // Info teks
    var info = document.getElementById('tableInfo');
    if (info) {
        info.textContent = total > 0
            ? 'Showing ' + (start + 1) + ' to ' + end + ' of ' + total + ' entries'
            : 'Showing 0 to 0 of 0 entries';
    }

    renderPagination(totalPages);
}

// Helper: sel tabel standar
function td(val) {
    return '<td class="px-4 py-2.5 border-r border-gray-100 whitespace-nowrap">' + esc(val) + '</td>';
}
function tdTrunc(val, maxW) {
    return '<td class="px-4 py-2.5 border-r border-gray-100 truncate" style="max-width:' + maxW + 'px" title="' + esc(val) + '">' + esc(val) + '</td>';
}
function esc(v) { return v ? String(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;') : '-'; }
function contains(str, kw) { return str && str.toLowerCase().indexOf(kw) !== -1; }

// ─────────────────────────────────────────────
//  PAGINATION
// ─────────────────────────────────────────────
function renderPagination(totalPages) {
    var nav = document.getElementById('paginationControls');
    if (!nav) return;
    nav.innerHTML = '';

    function makeBtn(label, page, active, disabled) {
        var btn = document.createElement('button');
        var cls = 'px-3 py-1.5 text-xs font-medium transition ';
        if (active)   cls += 'bg-blue-600 text-white cursor-default ';
        else if (disabled) cls += 'bg-gray-50 text-gray-300 cursor-not-allowed ';
        else cls += 'bg-white text-gray-600 hover:bg-gray-100 ';
        btn.className = cls;
        btn.textContent = label;
        if (!active && !disabled && page !== null) {
            btn.addEventListener('click', function () { currentPage = page; renderTable(); });
        }
        return btn;
    }

    nav.appendChild(makeBtn('Previous', currentPage - 1, false, currentPage === 1));

    getPageNumbers(currentPage, totalPages).forEach(function (p) {
        if (p === '...') {
            var span = document.createElement('button');
            span.className = 'px-3 py-1.5 text-xs bg-gray-50 text-gray-400 cursor-default';
            span.textContent = '…';
            nav.appendChild(span);
        } else {
            nav.appendChild(makeBtn(p, p, p === currentPage, false));
        }
    });

    nav.appendChild(makeBtn('Next', currentPage + 1, false, currentPage === totalPages));
}

function getPageNumbers(cur, total) {
    if (total <= 7) {
        var arr = [];
        for (var i = 1; i <= total; i++) arr.push(i);
        return arr;
    }
    if (cur <= 4)          return [1,2,3,4,5,'...',total];
    if (cur >= total - 3)  return [1,'...',total-4,total-3,total-2,total-1,total];
    return [1,'...',cur-1,cur,cur+1,'...',total];
}

// ─────────────────────────────────────────────
//  MODAL DETAIL (LIHAT DATA)
// ─────────────────────────────────────────────
function viewData(index) {
    var item = getData()[index];
    if (!item) return;

    var statusCls = item.statusTeknisi === 'CLOSE'
        ? 'bg-green-100 text-green-800'
        : 'bg-yellow-100 text-yellow-800';

    var rows = [
        ['Tanggal Diterima',     item.tglDiterima],
        ['Item / Barang',        item.namaBarang],
        ['Customer',             item.customer],
        ['Serial Number',        item.serialNumber],
        ['Quantity',             item.qtyIn],
        ['Garansi',             item.garansi],
        ['Kerusakan & Indikasi', item.kerusakan],
        ['Perbaikan',            item.perbaikan],
        ['Item Pergantian',      item.pergantian],
        ['Tgl Pengecekan',       item.tglPengecekan],
        ['Nama Sales',           item.namaSales],
        ['Status Service',       item.statusService],
        ['Tgl Status Service',   item.tglStatusService],
        ['Konfirmasi Admin Sales',item.konfirmasiSales],
        ['Tgl Konfirmasi',       item.tglKonfirmasi],
        ['Status Teknisi',       item.statusTeknisi],
        ['Tgl Selesai',          item.tglSelesai],
        ['Nama Teknisi',         item.namaTeknisi],
        ['Status Barang',        item.statusBarang],
        ['Konfirmasi Admin Kirim',item.konfirmasiKirim],
        ['Tgl Konfirmasi Kirim', item.tglKonfirmasiKirim],
        ['Keterangan',           item.keterangan],
    ];

    var rowsHTML = rows.map(function (r) {
        return '<div class="flex gap-2 py-1.5 border-b border-gray-100 last:border-0">' +
            '<span class="text-gray-400 text-xs min-w-[160px] shrink-0">' + r[0] + '</span>' +
            '<span class="text-gray-800 font-medium text-xs">' + esc(r[1]) + '</span>' +
            '</div>';
    }).join('');

    var mc = document.getElementById('modalContent');
    if (mc) {
        mc.innerHTML =
            '<div class="mb-4 p-3 rounded-lg bg-blue-50 border border-blue-100 flex items-center gap-3">' +
              '<div class="text-xl font-bold text-blue-700">' + esc(item.namaBarang) + '</div>' +
              '<span class="ml-auto px-3 py-1 rounded-full text-xs font-bold ' + statusCls + '">' +
                esc(item.statusTeknisi || 'OPEN') +
              '</span>' +
            '</div>' +
            '<div class="grid grid-cols-1 md:grid-cols-2 gap-x-6">' + rowsHTML + '</div>';
    }

    showModal('detailModal');
}

function closeDetailModal() { hideModal('detailModal'); }

// ─────────────────────────────────────────────
//  MODAL TAMBAH STATUS UPDATE
// ─────────────────────────────────────────────
function openStatusModal() {
    var dataArr = getData();
    var sel     = document.getElementById('statusSelectData');
    if (!sel) return;

    sel.innerHTML = '<option value="">-- Pilih Data Service --</option>';
    dataArr.forEach(function (item, i) {
        var opt = document.createElement('option');
        opt.value = i;
        opt.textContent = '#' + (i + 1) + ' | ' +
            (item.namaBarang || '?') + ' — ' +
            (item.customer   || '?') + ' (' +
            (item.statusTeknisi || 'OPEN') + ')';
        sel.appendChild(opt);
    });

    // Set default tanggal = hari ini
    setVal('statusUpdateDate', new Date().toISOString().split('T')[0]);
    showModal('statusModal');
}

function closeStatusModal() {
    hideModal('statusModal');
    var f = document.getElementById('formStatusUpdate');
    if (f) f.reset();
}

function handleStatusUpdate(e) {
    e.preventDefault();
    var idx = parseInt(getVal('statusSelectData'));
    if (isNaN(idx)) { showToast('Pilih data terlebih dahulu!', 'error'); return; }

    var dataArr = getData();
    if (!dataArr[idx]) return;

    var newStatus = getVal('statusUpdateTeknisi');
    var notes     = getVal('statusUpdateNotes').trim();
    var date      = getVal('statusUpdateDate');

    dataArr[idx].statusTeknisi = newStatus;
    if (newStatus === 'CLOSE' && date) dataArr[idx].tglSelesai = date;
    if (notes) {
        var prefix = date ? '[' + date + '] ' : '';
        var existing = dataArr[idx].keterangan ? dataArr[idx].keterangan + ' | ' : '';
        dataArr[idx].keterangan = existing + prefix + notes;
    }
    dataArr[idx].updatedAt = new Date().toISOString();

    setData(dataArr);
    closeStatusModal();
    renderTable();
    showToast('Status berhasil diubah ke ' + newStatus + '!');
}

// ─────────────────────────────────────────────
//  DASHBOARD
// ─────────────────────────────────────────────
function renderDashboard() {
    var dataArr = getData();

    setText('dashTotalService', dataArr.length);
    setText('dashStatusOpen',   dataArr.filter(function (i) { return i.statusTeknisi === 'OPEN'; }).length);
    setText('dashStatusClose',  dataArr.filter(function (i) { return i.statusTeknisi === 'CLOSE'; }).length);

    // Map teknisi
    var teknisiMap = {};
    dataArr.forEach(function (item) {
        var t = item.namaTeknisi || 'Belum Ditugaskan';
        if (!teknisiMap[t]) teknisiMap[t] = { open: 0, close: 0 };
        if (item.statusTeknisi === 'CLOSE') teknisiMap[t].close++;
        else teknisiMap[t].open++;
    });

    var techNames = Object.keys(teknisiMap).filter(function (k) { return k !== 'Belum Ditugaskan'; });
    setText('dashTechCount', techNames.length);

    // ── Per-teknisi ──
    var detailDiv = document.getElementById('dashTeknisiDetail');
    if (detailDiv) {
        if (Object.keys(teknisiMap).length === 0) {
            detailDiv.innerHTML = '<p class="text-gray-400 text-xs">Belum ada data</p>';
        } else {
            detailDiv.innerHTML = Object.entries(teknisiMap)
                .sort(function (a, b) { return (b[1].open + b[1].close) - (a[1].open + a[1].close); })
                .map(function (e) {
                    return '<div class="flex justify-between items-center p-2.5 bg-gray-50 rounded-lg border border-gray-100">' +
                        '<span class="font-medium text-gray-800 text-sm">' + esc(e[0]) + '</span>' +
                        '<div class="flex gap-1.5 text-xs">' +
                          '<span class="bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full font-medium">OPEN: ' + e[1].open + '</span>' +
                          '<span class="bg-green-100 text-green-800 px-2 py-0.5 rounded-full font-medium">CLOSE: ' + e[1].close + '</span>' +
                        '</div></div>';
                }).join('');
        }
    }

    // ── Breakdown status service ──
    var statuses = ['Lanjut Service', 'Batal Service', 'Service IMI', 'Service SSC'];
    var colors   = ['text-blue-700', 'text-red-700', 'text-amber-700', 'text-purple-700'];
    var statusDiv = document.getElementById('dashStatusDetail');
    if (statusDiv) {
        statusDiv.innerHTML = statuses.map(function (s, i) {
            var count = dataArr.filter(function (x) { return x.statusService === s; }).length;
            var pct   = dataArr.length ? Math.round(count / dataArr.length * 100) : 0;
            return '<div class="flex justify-between items-center p-2.5 bg-gray-50 rounded-lg border border-gray-100">' +
                '<span class="' + colors[i] + ' font-medium text-sm">' + s + '</span>' +
                '<div class="flex items-center gap-2">' +
                  '<div class="w-20 bg-gray-200 rounded-full h-1.5">' +
                    '<div class="bg-blue-500 h-1.5 rounded-full" style="width:' + pct + '%"></div>' +
                  '</div>' +
                  '<span class="font-semibold text-gray-700 w-5 text-right text-sm">' + count + '</span>' +
                '</div></div>';
        }).join('');
    }

    // ── List per teknisi ──
    var listDiv = document.getElementById('dashTechniqueList');
    if (listDiv) {
        if (Object.keys(teknisiMap).length === 0) {
            listDiv.innerHTML = '<p class="text-gray-400 text-xs">Belum ada data</p>';
        } else {
            listDiv.innerHTML = Object.entries(teknisiMap).map(function (e) {
                var tech     = e[0];
                var services = dataArr.filter(function (x) {
                    return (x.namaTeknisi || 'Belum Ditugaskan') === tech;
                });
                return '<div class="border border-gray-200 rounded-lg p-3">' +
                    '<div class="flex items-center justify-between mb-2">' +
                      '<h5 class="font-semibold text-sm text-gray-800">' +
                        '<i class="fa-solid fa-user-gear mr-1.5 text-gray-400"></i>' + esc(tech) +
                      '</h5>' +
                      '<span class="text-xs text-gray-400">' + services.length + ' item</span>' +
                    '</div>' +
                    '<div class="space-y-1">' +
                    services.map(function (s) {
                        var sc = s.statusTeknisi === 'CLOSE'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800';
                        return '<div class="flex justify-between items-center px-2 py-1.5 bg-gray-50 rounded text-xs">' +
                            '<span class="text-gray-700 font-medium">' + esc(s.namaBarang) + '</span>' +
                            '<div class="flex items-center gap-2 text-gray-400">' +
                              '<span>' + esc(s.customer) + '</span>' +
                              '<span class="px-1.5 py-0.5 rounded-full font-semibold ' + sc + '">' +
                                esc(s.statusTeknisi || 'OPEN') +
                              '</span></div></div>';
                    }).join('') +
                    '</div></div>';
            }).join('');
        }
    }
}

// ─────────────────────────────────────────────
//  EXPORT EXCEL
// ─────────────────────────────────────────────
function exportExcel() {
    var dataArr = getData();
    if (dataArr.length === 0) { showToast('Tidak ada data untuk diexport!', 'error'); return; }

    // Load library XLSX lalu jalankan
    if (typeof XLSX !== 'undefined') {
        doExport(dataArr);
    } else {
        var script  = document.createElement('script');
        script.src  = 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';
        script.onload = function () { doExport(dataArr); };
        script.onerror = function () { showToast('Gagal memuat library Excel. Cek koneksi internet.', 'error'); };
        document.head.appendChild(script);
    }
}

function doExport(dataArr) {
    var rows = dataArr.map(function (item, i) {
        return {
            'No.'                     : i + 1,
            'Tanggal Terima'          : item.tglDiterima        || '',
            'Nama Barang / Item'      : item.namaBarang         || '',
            'Customer'                : item.customer           || '',
            'Serial Number'           : item.serialNumber       || '',
            'Qty In'                  : parseInt(item.qtyIn)    || 0,
            'Garansi'                 : item.garansi            || '',
            'Kerusakan & Indikasi'    : item.kerusakan          || '',
            'Perbaikan'               : item.perbaikan          || '',
            'Item Pergantian'         : item.pergantian         || '',
            'Tgl Pengecekan'          : item.tglPengecekan      || '',
            'Nama Sales'              : item.namaSales          || '',
            'Status Service'          : item.statusService      || '',
            'Tgl Status Service'      : item.tglStatusService   || '',
            'Konfirmasi Admin Sales'  : item.konfirmasiSales    || '',
            'Tgl Konfirmasi'          : item.tglKonfirmasi      || '',
            'Status Teknisi'          : item.statusTeknisi      || '',
            'Tgl Selesai'             : item.tglSelesai         || '',
            'Nama Teknisi'            : item.namaTeknisi        || '',
            'Status Barang'           : item.statusBarang       || '',
            'Konfirmasi Admin Kirim'  : item.konfirmasiKirim    || '',
            'Tgl Konfirmasi Kirim'    : item.tglKonfirmasiKirim || '',
            'Keterangan'              : item.keterangan         || ''
        };
    });

    var ws  = XLSX.utils.json_to_sheet(rows);
    var wb  = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Data_Teknisi');

    // Auto-width kolom
    var cols = Object.keys(rows[0]).map(function (k) {
        var max = Math.max(k.length, rows.reduce(function (m, r) {
            return Math.max(m, String(r[k] || '').length);
        }, 0));
        return { wch: Math.min(max + 2, 40) };
    });
    ws['!cols'] = cols;

    var fileName = 'Data_Teknisi_ITS_Scale_' + new Date().toISOString().split('T')[0] + '.xlsx';
    XLSX.writeFile(wb, fileName);
    showToast('Export Excel berhasil: ' + fileName);
}

// ─────────────────────────────────────────────
//  HELPERS UMUM
// ─────────────────────────────────────────────
function showModal(id) {
    var el = document.getElementById(id);
    if (el) el.style.display = 'flex';
}
function hideModal(id) {
    var el = document.getElementById(id);
    if (el) el.style.display = 'none';
}
function setText(id, val) {
    var el = document.getElementById(id);
    if (el) el.textContent = val;
}
function setInnerText(id, val) {
    var el = document.getElementById(id);
    if (el) el.innerText = val;
}
function setInnerHTML(id, val) {
    var el = document.getElementById(id);
    if (el) el.innerHTML = val;
}
