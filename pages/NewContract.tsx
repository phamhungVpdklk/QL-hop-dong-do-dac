
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';

const NewContract: React.FC = () => {
  const { data, addContract } = useData();
  const navigate = useNavigate();

  const [customerName, setCustomerName] = useState('');
  const [mapSheetNumber, setMapSheetNumber] = useState('');
  const [plotNumber, setPlotNumber] = useState('');
  const [wardId, setWardId] = useState(data.wards[0]?.id.toString() || '');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!customerName || !mapSheetNumber || !plotNumber || !wardId) {
      setError('Vui lòng điền tất cả các trường bắt buộc.');
      return;
    }
    
    try {
        addContract({
            customerName,
            mapSheetNumber: parseInt(mapSheetNumber),
            plotNumber: parseInt(plotNumber),
            wardId: parseInt(wardId),
            notes,
        });
        navigate('/dashboard');
    } catch(err) {
        if(err instanceof Error) {
            setError(err.message);
        } else {
            setError("An unknown error occurred");
        }
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Tạo Hợp đồng Mới</h1>
      <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 p-8 rounded-lg shadow">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="customer_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Họ và tên khách hàng (Bắt buộc)</label>
            <input type="text" id="customer_name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="map_sheet_number" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Số tờ bản đồ (Bắt buộc)</label>
              <input type="number" id="map_sheet_number" value={mapSheetNumber} onChange={(e) => setMapSheetNumber(e.target.value)} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
            </div>
            <div>
              <label htmlFor="plot_number" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Số thửa đất (Bắt buộc)</label>
              <input type="number" id="plot_number" value={plotNumber} onChange={(e) => setPlotNumber(e.target.value)} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
            </div>
          </div>
          <div>
            <label htmlFor="ward" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Phường/Xã (Bắt buộc)</label>
            <select id="ward" value={wardId} onChange={(e) => setWardId(e.target.value)} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white">
              {data.wards.map(ward => (
                <option key={ward.id} value={ward.id}>{ward.wardName}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Ghi chú</label>
            <textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <div className="flex justify-end gap-4">
            <button type="button" onClick={() => navigate('/dashboard')} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">
              Hủy
            </button>
            <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">
              Lưu
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewContract;
