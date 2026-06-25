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
    const searchInput = document.querySelector('input[placeholder="Cari data..."]');
    const filterStart = document.getElementById('filterStart');
    const filterEnd = document.getElementById('filterEnd');
    const showEntries = document.querySelector('select class*="border"'); // Selector dinamis atau sesuaikan jika ada ID

    // Jika select entries belum ada ID, kita bisa targetkan select pertama di dalam class text-sm
    const selectElem = document.querySelector('select'); 

    if (searchInput) searchInput.addEventListener('input', renderTable);
    if (filterStart) filterStart.addEventListener('change', renderTable);
    if (filterEnd) filterEnd.addEventListener('change', renderTable);
    if (selectElem) selectElem.addEventListener('change', renderTable);
});

// Variabel global untuk melacak halaman aktif saat ini (Pagination)
let currentPage = 1;

function getData() {
    return JSON.parse(localStorage.getItem('dataTeknisi')) || [];
}

function renderTable() {
    const dataArr = getData();
    const tbody = document.getElementById('tableBody');
    if (!tbody) return;
    
    // 1. AMBIL NILAI FILTER & SEARCH
    const searchInput = document.querySelector('input[placeholder="Cari data..."]');
    const keyword = searchInput ? searchInput.value.toLowerCase() : '';
    
    const filterStart = document.getElementById('filterStart') ? document.getElementById('filterStart').value : '';
    const filterEnd = document.getElementById('filterEnd') ? document.getElementById('filterEnd').value : '';
    
    const selectElem = document.querySelector('select');
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
        tbody.innerHTML = `<tr><td colspan="24" class="text-center py-4 text-gray-400">Tidak ada data yang cocok dengan filter</td></tr>`;
    } else {
        paginatedData.forEach((item, index) => {
            // Hitung nomor urut asli berdasarkan indeks data keseluruhan
            const actualIndex = startIndex + index;
            const tr = document.createElement('tr');
            tr.className = "hover:bg-gray-50 transition";
            tr.innerHTML = `
                <td class="px-3 py-2 border-r border-gray-200 text-center">${actualIndex + 1}</td>
                <td class="px-3 py-2 border-r border-gray-200 text-center">
                    <button onclick="hapusData(${actualIndex})" class="bg-red-500 hover:bg-red-600 text-white text-xs px-2 py-1 rounded transition">
                        <i class="fa-solid fa-trash"></i> Hapus
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
                <td class="px-4 py-2 border-r border-gray-200">${item.dateOut || '-'}</td>
                <td class="px-4 py-2 border-r border-gray-200">
                    <span class="px-2 py-0.5 rounded text-xs font-semibold ${item.statusTeknisi === 'CLOSE' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}">
                        ${item.statusTeknisi || 'OPEN'}
                    </span>
                </td>
                <td class="px-4 py-2 border-r border-gray-200">${item.tglSelesai || '-'}</td>
                <td class="px-4 py-2 border-r border-gray-200">${item.konfirmasiKirim || '-'}</td>
                <td class="px-4 py-2 border-r border-gray-200">${item.tglKonfirmasiKirim || '-'}</td>
                <td class="px-4 py-2 border-r border-gray-200">${item.namaTeknisi || '-'}</td>
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
            dateOut: document.getElementById('dateOut').value,
            statusTeknisi: document.getElementById('statusTeknisi').value,
            tglSelesai: document.getElementById('tglSelesai').value,
            konfirmasiKirim: document.getElementById('konfirmasiKirim').value,
            tglKonfirmasiKirim: document.getElementById('tglKonfirmasiKirim').value,
            namaTeknisi: document.getElementById('namaTeknisi').value,
            keterangan: document.getElementById('keterangan').value
        };

        const dataArr = getData();
        dataArr.push(newData);

        localStorage.setItem('dataTeknisi', JSON.stringify(dataArr));

        renderTable();
        formTeknisi.reset();
        alert('Data berhasil disimpan!');
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
            "Date Out": item.dateOut,
            "Status Teknisi": item.statusTeknisi,
            "Tanggal Selesai": item.tglSelesai,
            "Konfirmasi Admin Kirim": item.konfirmasiKirim,
            "Tgl Konfirmasi Kirim": item.tglKonfirmasiKirim,
            "Nama Teknisi": item.namaTeknisi,
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