document.addEventListener("DOMContentLoaded", function() {
    // Atur tanggal default ke hari ini
    const today = new Date().toISOString().split('T')[0];
    if(document.getElementById('filterStart')) document.getElementById('filterStart').value = today;
    if(document.getElementById('filterEnd')) document.getElementById('filterEnd').value = today;
    
    // Render tabel pertama kali
    renderTable();

    // Hubungkan tombol export ke fungsi exportExcel
    const exportBtn = document.querySelector('button[class*="bg-[#2B3441]"]');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportExcel);
    }

    // EVENT LISTENERS UNTUK FILTER, SEARCH, DAN PAGINATION
    const searchInput = document.getElementById('searchInput');
    const filterStart = document.getElementById('filterStart');
    const filterEnd = document.getElementById('filterEnd');
    const selectElem = document.getElementById('entriesPerPage');
    const detailModal = document.getElementById('detailModal');
    const closeModalBtn = document.getElementById('closeModal');
    const closeModalFooter = document.getElementById('closeModalFooter');

    if (searchInput) searchInput.addEventListener('input', renderTable);
    if (filterStart) filterStart.addEventListener('change', renderTable);
    if (filterEnd) filterEnd.addEventListener('change', renderTable);
    if (selectElem) selectElem.addEventListener('change', renderTable);
    if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
    if (closeModalFooter) closeModalFooter.addEventListener('click', closeModal);
    if (detailModal) {
        detailModal.addEventListener('click', function(event) {
            if (event.target === detailModal) closeModal();
        });
    }
});

// Variabel global untuk melacak halaman aktif saat ini (Pagination)
let currentPage = 1;
let currentEditIndex = null;

function getData() {
    return JSON.parse(localStorage.getItem('dataTeknisi')) || [];
}

function renderTable() {
    const dataArr = getData();
    const tbody = document.getElementById('tableBody');
    if (!tbody) return;
    
    // 1. AMBIL NILAI FILTER & SEARCH
    const searchInput = document.getElementById('searchInput');
    const keyword = searchInput ? searchInput.value.toLowerCase() : '';
    
    const filterStart = document.getElementById('filterStart') ? document.getElementById('filterStart').value : '';
    const filterEnd = document.getElementById('filterEnd') ? document.getElementById('filterEnd').value : '';
    
    const selectElem = document.getElementById('entriesPerPage');
    const entriesPerPage = selectElem ? parseInt(selectElem.value) : 10;

    // 2. PROSES FILTERING (Search & Date Filter)
    const filteredData = dataArr.filter(item => {
        // Filter Berdasarkan Pencarian (Memeriksa beberapa kolom utama)
        const matchKeyword = 
            (item.namaBarang && item.namaBarang.toLowerCase().includes(keyword)) ||
            (item.customer && item.customer.toLowerCase().includes(keyword)) ||
            (item.serialNumber && item.serialNumber.toLowerCase().includes(keyword)) ||
            (item.namaTeknisi && item.namaTeknisi.toLowerCase().includes(keyword)) ||
            (item.namaSales && item.namaSales.toLowerCase().includes(keyword));

        // Filter Berdasarkan Rentang Tanggal (Berdasarkan tglDiterima)
        let matchDate = true;
        if (item.tglDiterima) {
            if (filterStart && item.tglDiterima < filterStart) matchDate = false;
            if (filterEnd && item.tglDiterima > filterEnd) matchDate = false;
        } else if (filterStart || filterEnd) {
            matchDate = false; // Jika filter diisi tapi data tidak punya tanggal
        }

        return matchKeyword && matchDate;
    });

    // 3. PROSES PAGINATION
    const totalEntries = filteredData.length;
    const totalPages = Math.ceil(totalEntries / entriesPerPage) || 1;
    
    // Jaga agar halaman aktif tidak melampaui total halaman baru setelah difilter
    if (currentPage > totalPages) currentPage = totalPages;
    if (currentPage < 1) currentPage = 1;

    const startIndex = (currentPage - 1) * entriesPerPage;
    const endIndex = Math.min(startIndex + entriesPerPage, totalEntries);
    
    // Potong data sesuai halaman aktif
    const paginatedData = filteredData.slice(startIndex, endIndex);

    // 4. RENDER DATA KE TABEL HTML
    tbody.innerHTML = '';

    if (paginatedData.length === 0) {
        tbody.innerHTML = `<tr><td colspan="25" class="text-center py-4 text-gray-400">Tidak ada data yang cocok dengan filter</td></tr>`;
    } else {
        paginatedData.forEach((item, index) => {
            const actualIndex = startIndex + index;
            const tr = document.createElement('tr');
            tr.className = "hover:bg-gray-50 transition";
            tr.innerHTML = `
                <td class="px-3 py-2 border-r border-gray-200 text-center">${actualIndex + 1}</td>
                <td class="px-3 py-2 border-r border-gray-200 text-center space-x-1">
                    <button onclick="viewData(${actualIndex})" class="bg-blue-500 hover:bg-blue-600 text-white text-xs px-2 py-1 rounded transition">
                        <i class="fa-solid fa-eye"></i>
                    </button>
                    <button onclick="editData(${actualIndex})" class="bg-yellow-500 hover:bg-yellow-600 text-white text-xs px-2 py-1 rounded transition">
                        <i class="fa-solid fa-pen-to-square"></i>
                    </button>
                    <button onclick="hapusData(${actualIndex})" class="bg-red-500 hover:bg-red-600 text-white text-xs px-2 py-1 rounded transition">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </td>
                <td class="px-4 py-2 border-r border-gray-200">${item.tglDiterima || '-'}</td>
                <td class="px-4 py-2 border-r border-gray-200 font-medium text-gray-800">${item.namaBarang || '-'}</td>
                <td class="px-4 py-2 border-r border-gray-200">${item.customer || '-'}</td>
                <td class="px-4 py-2 border-r border-gray-200">${item.serialNumber || '-'}</td>
                <td class="px-3 py-2 border-r border-gray-200 text-center">${item.qtyIn || '0'}</td>
                <td class="px-4 py-2 border-r border-gray-200">${item.garansi || '-'}</td>
                <td class="px-4 py-2 border-r border-gray-200">${item.kerusakan || '-'}</td>
                <td class="px-4 py-2 border-r border-gray-200">${item.perbaikan || '-'}</td>
                <td class="px-4 py-2 border-r border-gray-200">${item.pergantian || '-'}</td>
                <td class="px-4 py-2 border-r border-gray-200">${item.tglPengecekan || '-'}</td>
                <td class="px-4 py-2 border-r border-gray-200">${item.namaSales || '-'}</td>
                <td class="px-4 py-2 border-r border-gray-200">${item.statusService || '-'}</td>
                <td class="px-4 py-2 border-r border-gray-200">${item.tglStatusService || '-'}</td>
                <td class="px-4 py-2 border-r border-gray-200">${item.konfirmasiSales || '-'}</td>
                <td class="px-4 py-2 border-r border-gray-200">${item.tglKonfirmasi || '-'}</td>
                <td class="px-4 py-2 border-r border-gray-200">${item.statusTeknisi || '-'}</td>
                <td class="px-4 py-2 border-r border-gray-200">${item.tglSelesai || '-'}</td>
                <td class="px-4 py-2 border-r border-gray-200">${item.namaTeknisi || '-'}</td>
                <td class="px-4 py-2 border-r border-gray-200">${item.statusBarang || '-'}</td>
                <td class="px-4 py-2 border-r border-gray-200">${item.konfirmasiKirim || '-'}</td>
                <td class="px-4 py-2 border-r border-gray-200">${item.tglKonfirmasiKirim || '-'}</td>
                <td class="px-4 py-2">${item.keterangan || '-'}</td>
            `;
            tbody.appendChild(tr);
        });
    }

    // 5. UPDATE INFORMASI KETERANGAN TABEL (Showing X to Y of Z entries)
    const tableInfo = document.getElementById('tableInfo');
    if (tableInfo) {
        const displayStart = totalEntries > 0 ? startIndex + 1 : 0;
        tableInfo.innerText = `Showing ${displayStart} to ${endIndex} of ${totalEntries} entries`;
    }

    // 6. RENDER TOMBOL PAGINATION (PREVIOUS / NEXT)
    renderPaginationControls(totalPages);
}

// Fungsi pembantu untuk membuat tombol Previous dan Next berfungsi dinamis
function renderPaginationControls(totalPages) {
    const infoContainer = document.getElementById('tableInfo');
    if (!infoContainer) return;

    // Cari komponen pembungkus tombol navigasi (elemen setelah #tableInfo atau cari wrapper-nya)
    const navWrapper = infoContainer.parentElement.querySelector('.flex.items-center.border');
    if (!navWrapper) return;

    navWrapper.innerHTML = '';

    // Tombol Previous
    const prevBtn = document.createElement('button');
    prevBtn.className = `px-3 py-1 text-xs sm:text-sm font-medium transition ${currentPage === 1 ? 'bg-gray-50 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-100'}`;
    prevBtn.innerText = 'Previous';
    if (currentPage > 1) {
        prevBtn.addEventListener('click', () => {
            currentPage--;
            renderTable();
        });
    }
    navWrapper.appendChild(prevBtn);

    // Nomor Halaman Aktif
    const pageIndicator = document.createElement('button');
    pageIndicator.className = 'px-3 py-1 text-xs sm:text-sm font-semibold bg-blue-50 text-blue-600 cursor-default';
    pageIndicator.innerText = currentPage;
    navWrapper.appendChild(pageIndicator);

    // Tombol Next
    const nextBtn = document.createElement('button');
    nextBtn.className = `px-3 py-1 text-xs sm:text-sm font-medium transition ${currentPage === totalPages ? 'bg-gray-50 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-100'}`;
    nextBtn.innerText = 'Next';
    if (currentPage < totalPages) {
        nextBtn.addEventListener('click', () => {
            currentPage++;
            renderTable();
        });
    }
    navWrapper.appendChild(nextBtn);
}

// FORM SUBMISSION HANDLING
const formTeknisi = document.getElementById('formTeknisi');
if (formTeknisi) {
    formTeknisi.addEventListener('submit', function(e) {
        e.preventDefault();

        const newData = {
            tglDiterima: document.getElementById('tglDiterima').value,
            namaBarang: document.getElementById('namaBarang').value.toUpperCase(),
            customer: document.getElementById('customer').value,
            serialNumber: document.getElementById('serialNumber').value,
            qtyIn: document.getElementById('qtyIn').value,
            garansi: document.getElementById('garansi').value,
            kerusakan: document.getElementById('kerusakan').value,
            perbaikan: document.getElementById('perbaikan').value,
            pergantian: document.getElementById('pergantian').value,
            tglPengecekan: document.getElementById('tglPengecekan').value,
            namaSales: document.getElementById('namaSales').value,
            statusService: document.getElementById('statusService').value,
            tglStatusService: document.getElementById('tglStatusService').value,
            konfirmasiSales: document.getElementById('konfirmasiSales').value,
            tglKonfirmasi: document.getElementById('tglKonfirmasi').value,
            statusTeknisi: document.getElementById('statusTeknisi').value,
            tglSelesai: document.getElementById('tglSelesai').value,
            namaTeknisi: document.getElementById('namaTeknisi').value,
            statusBarang: document.getElementById('statusBarang').value,
            konfirmasiKirim: document.getElementById('konfirmasiKirim').value,
            tglKonfirmasiKirim: document.getElementById('tglKonfirmasiKirim').value,
            keterangan: document.getElementById('keterangan').value
        };

        const dataArr = getData();
        if (currentEditIndex !== null && currentEditIndex >= 0 && currentEditIndex < dataArr.length) {
            dataArr[currentEditIndex] = newData;
            alert('Data berhasil diperbarui!');
        } else {
            dataArr.push(newData);
            alert('Data berhasil disimpan!');
        }

        localStorage.setItem('dataTeknisi', JSON.stringify(dataArr));
        currentEditIndex = null;
        document.getElementById('submitButton').innerText = 'Simpan Data';
        renderTable();
        formTeknisi.reset();
    });
}

function hapusData(index) {
    if(confirm('Apakah Anda yakin ingin menghapus data ini?')) {
        const dataArr = getData();
        dataArr.splice(index, 1);
        localStorage.setItem('dataTeknisi', JSON.stringify(dataArr));
        renderTable();
    }
}

// EXPORT TO EXCEL FUNCTION
function exportExcel() {
    const dataArr = getData();
    
    if (dataArr.length === 0) {
        alert("Tidak ada data yang bisa diexport!");
        return;
    }

    const script = document.createElement('script');
    script.src = "https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js";
    script.onload = function() {
        
        const formattedData = dataArr.map((item, index) => ({
            "No.": index + 1,
            "Tanggal Terima": item.tglDiterima,
            "Nama Barang / Item": item.namaBarang,
            "Customer": item.customer,
            "Serial Number (SN)": item.serialNumber,
            "Qty In": parseInt(item.qtyIn) || 0,
            "Garansi": item.garansi,
            "Kerusakan & Indikasi": item.kerusakan,
            "Perbaikan": item.perbaikan,
            "Item Pergantian": item.pergantian,
            "Tanggal Pengecekan": item.tglPengecekan,
            "Nama Sales": item.namaSales,
            "Status Service": item.statusService,
            "Tgl Status Service": item.tglStatusService,
            "Konfirmasi Admin Sales": item.konfirmasiSales,
            "Tanggal Konfirmasi": item.tglKonfirmasi,
            "Status Teknisi": item.statusTeknisi,
            "Tanggal Selesai": item.tglSelesai,
            "Nama Teknisi": item.namaTeknisi,
            "Status Barang": item.statusBarang,
            "Konfirmasi Admin Kirim": item.konfirmasiKirim,
            "Tgl Konfirmasi Kirim": item.tglKonfirmasiKirim,
            "Keterangan": item.keterangan
        }));

        const worksheet = XLSX.utils.json_to_sheet(formattedData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Data_Teknisi");

        const fileDate = new Date().toISOString().split('T')[0];
        const fileName = `Data_Teknisi_ITS_Scale_${fileDate}.xlsx`;

        XLSX.writeFile(workbook, fileName);
    };
    
    document.head.appendChild(script);
}

function viewData(index) {
    const dataArr = getData();
    const item = dataArr[index];
    if (!item) return;

    const modal = document.getElementById('detailModal');
    const modalContent = document.getElementById('modalContent');
    if (!modal || !modalContent) return;

    modalContent.innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div><strong>Tanggal Diterima:</strong> ${item.tglDiterima || '-'}</div>
            <div><strong>Item:</strong> ${item.namaBarang || '-'}</div>
            <div><strong>Customer:</strong> ${item.customer || '-'}</div>
            <div><strong>Serial Number:</strong> ${item.serialNumber || '-'}</div>
            <div><strong>Quantity:</strong> ${item.qtyIn || '-'}</div>
            <div><strong>Garansi:</strong> ${item.garansi || '-'}</div>
            <div><strong>Kerusakan & Indikasi:</strong> ${item.kerusakan || '-'}</div>
            <div><strong>Perbaikan:</strong> ${item.perbaikan || '-'}</div>
            <div><strong>Item Pergantian:</strong> ${item.pergantian || '-'}</div>
            <div><strong>Tanggal Pengecekan:</strong> ${item.tglPengecekan || '-'}</div>
            <div><strong>Nama Sales:</strong> ${item.namaSales || '-'}</div>
            <div><strong>Status Service:</strong> ${item.statusService || '-'}</div>
            <div><strong>Tanggal Status Service:</strong> ${item.tglStatusService || '-'}</div>
            <div><strong>Konfirmasi Admin Sales:</strong> ${item.konfirmasiSales || '-'}</div>
            <div><strong>Tanggal Konfirmasi:</strong> ${item.tglKonfirmasi || '-'}</div>
            <div><strong>Status Teknisi:</strong> ${item.statusTeknisi || '-'}</div>
            <div><strong>Tanggal Selesai:</strong> ${item.tglSelesai || '-'}</div>
            <div><strong>Nama Teknisi:</strong> ${item.namaTeknisi || '-'}</div>
            <div><strong>Status Barang:</strong> ${item.statusBarang || '-'}</div>
            <div><strong>Konfirmasi Admin Pengiriman:</strong> ${item.konfirmasiKirim || '-'}</div>
            <div><strong>Tanggal Konfirmasi Pengiriman:</strong> ${item.tglKonfirmasiKirim || '-'}</div>
            <div class="md:col-span-2"><strong>Keterangan:</strong> ${item.keterangan || '-'}</div>
        </div>
    `;
    modal.classList.remove('hidden');
}

function editData(index) {
    const dataArr = getData();
    const item = dataArr[index];
    if (!item) return;

    currentEditIndex = index;
    document.getElementById('tglDiterima').value = item.tglDiterima || '';
    document.getElementById('namaBarang').value = item.namaBarang || '';
    document.getElementById('customer').value = item.customer || '';
    document.getElementById('serialNumber').value = item.serialNumber || '';
    document.getElementById('qtyIn').value = item.qtyIn || '';
    document.getElementById('garansi').value = item.garansi || 'Garansi';
    document.getElementById('kerusakan').value = item.kerusakan || '';
    document.getElementById('perbaikan').value = item.perbaikan || '';
    document.getElementById('pergantian').value = item.pergantian || '';
    document.getElementById('tglPengecekan').value = item.tglPengecekan || '';
    document.getElementById('namaSales').value = item.namaSales || '';
    document.getElementById('statusService').value = item.statusService || 'Lanjut Service';
    document.getElementById('tglStatusService').value = item.tglStatusService || '';
    document.getElementById('konfirmasiSales').value = item.konfirmasiSales || '';
    document.getElementById('tglKonfirmasi').value = item.tglKonfirmasi || '';
    document.getElementById('statusTeknisi').value = item.statusTeknisi || 'OPEN';
    document.getElementById('tglSelesai').value = item.tglSelesai || '';
    document.getElementById('namaTeknisi').value = item.namaTeknisi || '';
    document.getElementById('statusBarang').value = item.statusBarang || '';
    document.getElementById('konfirmasiKirim').value = item.konfirmasiKirim || '';
    document.getElementById('tglKonfirmasiKirim').value = item.tglKonfirmasiKirim || '';
    document.getElementById('keterangan').value = item.keterangan || '';
    document.getElementById('submitButton').innerText = 'Perbarui Data';
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function closeModal() {
    const modal = document.getElementById('detailModal');
    if (modal) modal.classList.add('hidden');
}
