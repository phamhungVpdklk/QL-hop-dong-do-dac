import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useData } from '../context/DataContext';
import { ContractStatus, type Contract } from '../types';
import { formatDate } from '../utils';

declare global {
    interface Window {
        jspdf: any;
        Chart: any;
        ChartDataLabels: any;
    }
}

const getStatusColor = (status: ContractStatus) => {
  switch (status) {
    case ContractStatus.Processing: return '#f59e0b'; // amber-500
    case ContractStatus.Completed: return '#10b981'; // emerald-500
    case ContractStatus.Cancelled: return '#ef4444'; // red-500
    default: return '#6b7280'; // gray-500
  }
};

const Statistics: React.FC = () => {
  const { data, getWardById } = useData();
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    status: '',
    wardId: ''
  });

  const pieChartRef = useRef<HTMLCanvasElement>(null);
  const barChartRef = useRef<HTMLCanvasElement>(null);
  const pieChartInstance = useRef<any>(null);
  const barChartInstance = useRef<any>(null);

  // Register ChartJS plugins on mount
  useEffect(() => {
    if (window.ChartDataLabels) {
        // It might be already registered, so we can try to unregister first to avoid errors
        try {
            window.Chart.unregister(window.ChartDataLabels);
        } catch (e) {
            // Ignore if it was not registered
        }
        window.Chart.register(window.ChartDataLabels);
    }
  }, []);


  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value
    });
  };

  const formatDateForInput = (date: Date) => date.toISOString().split('T')[0];

  const setDateRange = (period: 'week' | 'month' | 'quarter' | 'year') => {
    const today = new Date();
    let startDate = new Date();
    
    switch(period) {
        case 'week':
            startDate.setDate(today.getDate() - today.getDay());
            break;
        case 'month':
            startDate = new Date(today.getFullYear(), today.getMonth(), 1);
            break;
        case 'quarter':
            const quarter = Math.floor(today.getMonth() / 3);
            startDate = new Date(today.getFullYear(), quarter * 3, 1);
            break;
        case 'year':
            startDate = new Date(today.getFullYear(), 0, 1);
            break;
    }
    
    setFilters({
        ...filters,
        startDate: formatDateForInput(startDate),
        endDate: formatDateForInput(today),
    });
  };

  const resetFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      status: '',
      wardId: ''
    });
  };

  const filteredContracts = useMemo(() => {
    return data.contracts.filter(contract => {
        const contractDate = new Date(contract.createdAt);
        const matchesStartDate = !filters.startDate || contractDate >= new Date(filters.startDate);
        const matchesEndDate = !filters.endDate || contractDate <= new Date(new Date(filters.endDate).setHours(23, 59, 59, 999));
        const matchesStatus = !filters.status || contract.status === filters.status;
        const matchesWard = !filters.wardId || contract.wardId.toString() === filters.wardId;
        return matchesStartDate && matchesEndDate && matchesStatus && matchesWard;
    });
  }, [data.contracts, filters]);


  const filteredStats = useMemo(() => {
    return {
        total: filteredContracts.length,
        processing: filteredContracts.filter(c => c.status === ContractStatus.Processing).length,
        completed: filteredContracts.filter(c => c.status === ContractStatus.Completed).length,
        cancelled: filteredContracts.filter(c => c.status === ContractStatus.Cancelled).length,
    };
  }, [filteredContracts]);

  const pieChartData = useMemo(() => ({
    labels: [ContractStatus.Processing, ContractStatus.Completed, ContractStatus.Cancelled],
    data: [filteredStats.processing, filteredStats.completed, filteredStats.cancelled],
  }), [filteredStats]);

  const barChartData = useMemo(() => {
    const statuses = [ContractStatus.Processing, ContractStatus.Completed, ContractStatus.Cancelled];
    const dataByWard: { [wardName: string]: { [status: string]: number } } = {};

    // Get a unique, sorted list of wards from the filtered data
    const wardLabels = [...new Set(filteredContracts.map(c => getWardById(c.wardId)?.wardName || 'Không xác định'))].sort();
    
    // Initialize counts for all wards to ensure they appear on the chart
    wardLabels.forEach(label => {
        dataByWard[label] = {
            [ContractStatus.Processing]: 0,
            [ContractStatus.Completed]: 0,
            [ContractStatus.Cancelled]: 0,
        };
    });
    
    // Populate counts from filtered contracts
    filteredContracts.forEach(contract => {
        const wardName = getWardById(contract.wardId)?.wardName || 'Không xác định';
        if (dataByWard[wardName]) {
            dataByWard[wardName][contract.status]++;
        }
    });

    return {
        labels: wardLabels,
        datasets: statuses.map(status => ({
            label: status,
            data: wardLabels.map(label => dataByWard[label][status]),
            backgroundColor: getStatusColor(status),
        })),
    };
  }, [filteredContracts, getWardById]);


  useEffect(() => {
    const ctx = pieChartRef.current?.getContext('2d');
    if (!ctx) return;
    if (pieChartInstance.current) pieChartInstance.current.destroy();

    const isDarkMode = document.body.classList.contains('dark');

    pieChartInstance.current = new window.Chart(ctx, {
        type: 'pie',
        data: {
            labels: pieChartData.labels,
            datasets: [{
                data: pieChartData.data,
                backgroundColor: pieChartData.labels.map(label => getStatusColor(label as ContractStatus)),
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { 
                    position: 'top',
                    labels: {
                        color: isDarkMode ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)',
                    }
                },
                datalabels: {
                    formatter: (value: number, context: any) => {
                        const total = context.chart.getDatasetMeta(0).total || 0;
                        if (!total || !value) return null;
                        const percentage = (value / total) * 100;
                        if (percentage < 7) return null; // Hide for small slices
                        const label = context.chart.data.labels?.[context.dataIndex] ?? '';
                        return `${label}\n${value} (${percentage.toFixed(1)}%)`;
                    },
                    color: '#fff',
                    textAlign: 'center',
                    font: { weight: 'bold', size: 11 },
                    backgroundColor: 'rgba(0, 0, 0, 0.4)',
                    borderRadius: 4,
                    padding: 4,
                }
            }
        }
    });
  }, [pieChartData]);

  useEffect(() => {
    const ctx = barChartRef.current?.getContext('2d');
    if (!ctx) return;
    if (barChartInstance.current) barChartInstance.current.destroy();

    const isDarkMode = document.body.classList.contains('dark');

    barChartInstance.current = new window.Chart(ctx, {
        type: 'bar',
        data: barChartData,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { 
                legend: { 
                    position: 'top',
                    labels: {
                        color: isDarkMode ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)',
                    }
                } 
            },
            scales: {
                y: { 
                    beginAtZero: true, 
                    ticks: { 
                        stepSize: 1,
                        color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
                    },
                    grid: {
                        color: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                    }
                },
                x: { 
                    grid: { display: false },
                    ticks: {
                        color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
                    }
                }
            }
        }
    });
  }, [barChartData]);

  const exportPDF = () => {
    const { jsPDF } = window.jspdf;
    // A4 page is 210 x 297 mm
    const doc = new jsPDF('p', 'mm', 'a4');
    
    // Set font that supports Vietnamese characters (loaded via script in index.html)
    doc.setFont('Roboto');

    const margin = 10;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageCenter = pageWidth / 2;

    // Report Title
    doc.setFontSize(16);
    doc.setFont('Roboto', 'bold');
    doc.text("Báo cáo Thống kê Hợp đồng Tương tác", pageCenter, margin + 5, { align: 'center' });
    
    // Filter Info
    doc.setFontSize(10);
    doc.setFont('Roboto', 'normal');
    const filterInfo = `Bộ lọc: Từ ${filters.startDate || 'Tất cả'} - Đến ${filters.endDate || 'Tất cả'} | Trạng thái: ${filters.status || 'Tất cả'} | Phường/Xã: ${filters.wardId ? getWardById(Number(filters.wardId))?.wardName : 'Tất cả'}`;
    doc.text(filterInfo, pageCenter, margin + 12, { align: 'center' });
    
    let yPos = margin + 25; // Start position for charts
    
    try {
        const pieChartImg = pieChartRef.current?.toDataURL('image/png', 1.0);
        const barChartImg = barChartRef.current?.toDataURL('image/png', 1.0);

        const chartWidth = (pageWidth - margin * 3) / 2; // two charts with one margin between them
        const chartHeight = chartWidth; // Keep it square-ish
        const chart1X = margin;
        const chart2X = margin * 2 + chartWidth;
        
        doc.setFontSize(12); 
        doc.setFont('Roboto', 'bold');

        if(pieChartImg) {
            doc.text("Hợp đồng theo Trạng thái", chart1X + chartWidth/2, yPos, {align: 'center'});
            doc.addImage(pieChartImg, 'PNG', chart1X, yPos + 5, chartWidth, chartHeight);
        }

        if(barChartImg) {
            doc.text("Hợp đồng theo Phường/Xã", chart2X + chartWidth/2, yPos, {align: 'center'});
            doc.addImage(barChartImg, 'PNG', chart2X, yPos + 5, chartWidth, chartHeight);
        }
        yPos += chartHeight + 15;
    } catch(e) { console.error("Could not add charts to PDF", e); }
    
    doc.setFontSize(12); 
    doc.setFont('Roboto', 'bold');
    doc.text("Danh sách Hợp đồng chi tiết", margin, yPos);
    
    (doc as any).autoTable({
        head: [["Số HĐ", "Khách hàng", "Ngày tạo", "Trạng thái", "Phường/Xã"]],
        body: filteredContracts.map(c => [
            c.contractNumber, c.customerName, formatDate(c.createdAt), c.status, getWardById(c.wardId)?.wardName || 'N/A'
        ]),
        startY: yPos + 5,
        theme: 'grid',
        styles: { 
            font: 'Roboto', 
            fontSize: 8 
        },
        headStyles: {
            fillColor: [41, 128, 185], // A nice blue color
            textColor: 255,
            fontStyle: 'bold',
        },
        margin: { left: margin, right: margin, bottom: margin },
    });
    doc.save(`bao_cao_tuong_tac_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Thống kê Tương tác</h1>
      
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow mb-6">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 items-end">
            <div className="col-span-full flex gap-2 flex-wrap mb-4">
                <button onClick={() => setDateRange('week')} className="px-3 py-1 text-sm border rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 dark:border-gray-600">Tuần này</button>
                <button onClick={() => setDateRange('month')} className="px-3 py-1 text-sm border rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 dark:border-gray-600">Tháng này</button>
                <button onClick={() => setDateRange('quarter')} className="px-3 py-1 text-sm border rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 dark:border-gray-600">Quý này</button>
                <button onClick={() => setDateRange('year')} className="px-3 py-1 text-sm border rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 dark:border-gray-600">Năm nay</button>
            </div>
            <div className="col-span-2 lg:col-span-2"><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Từ ngày</label><input type="date" name="startDate" value={filters.startDate} onChange={handleFilterChange} className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"/></div>
            <div className="col-span-2 lg:col-span-2"><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Đến ngày</label><input type="date" name="endDate" value={filters.endDate} onChange={handleFilterChange} className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"/></div>
            <div className="col-span-2 lg:col-span-1"><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Trạng thái</label><select name="status" value={filters.status} onChange={handleFilterChange} className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"><option value="">Tất cả</option>{Object.values(ContractStatus).map(s => <option key={s} value={s}>{s}</option>)}</select></div>
            <div className="col-span-2 lg:col-span-1"><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phường/Xã</label><select name="wardId" value={filters.wardId} onChange={handleFilterChange} className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"><option value="">Tất cả</option>{data.wards.map(w => <option key={w.id} value={w.id}>{w.wardName}</option>)}</select></div>
            <div className="col-span-1"><button onClick={resetFilters} className="w-full p-2 border rounded-lg bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 dark:text-white dark:border-gray-600 transition">Xóa</button></div>
            <div className="col-span-1"><button onClick={exportPDF} className="w-full px-4 py-2 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700">Xuất PDF</button></div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-blue-500 text-white p-6 rounded-lg shadow-lg"><div className="text-4xl font-bold">{filteredStats.total}</div><div className="text-blue-200">Tổng số hợp đồng</div></div>
        <div className="bg-yellow-500 text-white p-6 rounded-lg shadow-lg"><div className="text-4xl font-bold">{filteredStats.processing}</div><div className="text-yellow-200">Đang xử lý</div></div>
        <div className="bg-green-500 text-white p-6 rounded-lg shadow-lg"><div className="text-4xl font-bold">{filteredStats.completed}</div><div className="text-green-200">Hoàn thành</div></div>
        <div className="bg-red-500 text-white p-6 rounded-lg shadow-lg"><div className="text-4xl font-bold">{filteredStats.cancelled}</div><div className="text-red-200">Đã hủy</div></div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-8">
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">Hợp đồng theo Trạng thái</h3>
            <div className="h-64 md:h-80"><canvas ref={pieChartRef}></canvas></div>
        </div>
        <div className="lg:col-span-3 bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">Hợp đồng theo Phường/Xã</h3>
            <div className="h-64 md:h-80"><canvas ref={barChartRef}></canvas></div>
        </div>
      </div>
      
      <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-lg shadow">
        <h3 className="p-6 text-xl font-semibold text-gray-800 dark:text-gray-200">Danh sách Hợp đồng chi tiết</h3>
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
           <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase dark:text-gray-300">Số HĐ</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase dark:text-gray-300">Khách hàng</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase dark:text-gray-300">Phường/Xã</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase dark:text-gray-300">Ngày tạo</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase dark:text-gray-300">Trạng thái</th>
                </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
            {filteredContracts.length > 0 ? filteredContracts.map((contract: Contract) => (
                <tr key={contract.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 dark:text-gray-200">{contract.contractNumber}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 dark:text-gray-200">{contract.customerName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{getWardById(contract.wardId)?.wardName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{formatDate(contract.createdAt)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 dark:text-gray-200">{contract.status}</td>
                </tr>
            )) : (
              <tr>
                <td colSpan={5} className="text-center py-10 text-gray-500 dark:text-gray-400">Không có dữ liệu hợp đồng khớp với bộ lọc.</td>
              </tr>
            )}
            </tbody>
        </table>
      </div>
    </div>
  );
};

export default Statistics;