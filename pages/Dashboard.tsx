
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { ContractStatus, type Contract } from '../types';
import { formatDate } from '../utils';
import { FilePlusIcon, SearchIcon } from '../components/Icons';

const getStatusClass = (status: ContractStatus) => {
  switch (status) {
    case ContractStatus.Processing:
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
    case ContractStatus.Completed:
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    case ContractStatus.Cancelled:
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
  }
};

const Dashboard: React.FC = () => {
  const { data } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const navigate = useNavigate();

  const filteredContracts = useMemo(() => {
    return data.contracts
      .filter(contract => {
        // Search filter
        const matchesSearch = contract.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          contract.contractNumber.toLowerCase().includes(searchTerm.toLowerCase());
        
        // Status filter
        const matchesStatus = !statusFilter || contract.status === statusFilter;

        // Date filter
        const contractDate = new Date(contract.createdAt);
        const matchesStartDate = !startDate || contractDate >= new Date(startDate);
        // Set end date to end of day for inclusive filtering
        const matchesEndDate = !endDate || contractDate <= new Date(new Date(endDate).setHours(23, 59, 59, 999));

        return matchesSearch && matchesStatus && matchesStartDate && matchesEndDate;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [data.contracts, searchTerm, statusFilter, startDate, endDate]);

  const resetFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
    setStartDate('');
    setEndDate('');
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-0">Bảng điều khiển</h1>
        <button
          onClick={() => navigate('/contract/new')}
          className="flex items-center gap-2 px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition duration-300"
        >
          <FilePlusIcon className="w-5 h-5" />
          Tạo Hợp đồng Mới
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="sm:col-span-2 lg:col-span-5">
            <label htmlFor="search" className="sr-only">Search</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <SearchIcon className="w-5 h-5 text-gray-400" />
              </div>
              <input
                id="search"
                type="text"
                placeholder="Tìm theo số hợp đồng hoặc tên khách hàng..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full p-2 pl-10 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
          </div>
          <div>
            <label htmlFor="statusFilter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Trạng thái</label>
            <select
              id="statusFilter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="">Tất cả</option>
              {Object.values(ContractStatus).map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Từ ngày</label>
            <input
              id="startDate"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Đến ngày</label>
            <input
              id="endDate"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={resetFilters}
              className="w-full p-2 border rounded-lg bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 dark:text-white dark:border-gray-600 transition"
            >
              Xóa bộ lọc
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-lg shadow">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">Số hợp đồng</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">Ngày tạo</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">Họ và tên</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">Trạng thái</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
            {filteredContracts.length > 0 ? (
                filteredContracts.map((contract: Contract) => (
                    <tr key={contract.id} onClick={() => navigate(`/contract/${contract.id}`)} className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{contract.contractNumber}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{formatDate(contract.createdAt)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{contract.customerName}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(contract.status)}`}>
                            {contract.status}
                        </span>
                        </td>
                    </tr>
                ))
            ) : (
                <tr>
                    <td colSpan={4} className="text-center py-10 text-gray-500 dark:text-gray-400">Không tìm thấy hợp đồng nào khớp với bộ lọc.</td>
                </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Dashboard;
