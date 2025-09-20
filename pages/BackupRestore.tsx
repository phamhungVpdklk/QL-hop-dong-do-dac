
import React, { useState, useRef } from 'react';
import { useData } from '../context/DataContext';
import { DownloadIcon, UploadIcon } from '../components/Icons';
import Modal from '../components/Modal';

const BackupRestore: React.FC = () => {
    const { backupData, restoreData } = useData();
    const [isRestoreModalOpen, setRestoreModalOpen] = useState(false);
    const [fileToRestore, setFileToRestore] = useState<File | null>(null);
    const [restoreError, setRestoreError] = useState('');
    const [restoreSuccess, setRestoreSuccess] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files.length > 0) {
            setFileToRestore(event.target.files[0]);
            setRestoreError('');
        }
    };
    
    const handleUploadClick = () => {
        if(fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const handleConfirmRestore = async () => {
        if (!fileToRestore) {
            setRestoreError("Vui lòng chọn một tệp để phục hồi.");
            return;
        }

        try {
            await restoreData(fileToRestore);
            setRestoreSuccess("Phục hồi dữ liệu thành công! Trang sẽ được tải lại.");
            setRestoreError('');
            setTimeout(() => window.location.reload(), 2000);
        } catch (error) {
            setRestoreError("Phục hồi thất bại. Tệp có thể bị hỏng hoặc không đúng định dạng.");
            console.error(error);
        } finally {
            setRestoreModalOpen(false);
            setFileToRestore(null);
        }
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Sao lưu & Phục hồi</h1>
            <div className="max-w-2xl mx-auto space-y-8">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">Tải xuống bản sao lưu</h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                        Tải xuống một tệp JSON chứa toàn bộ dữ liệu ứng dụng (hợp đồng, người dùng, phường/xã). Giữ tệp này ở nơi an toàn.
                    </p>
                    <button onClick={backupData} className="flex items-center gap-2 px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700">
                       <DownloadIcon className="w-5 h-5"/>
                       Tải xuống
                    </button>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">Phục hồi từ bản sao lưu</h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                        <strong className="text-red-500">Cảnh báo:</strong> Thao tác này sẽ <strong className="underline">ghi đè toàn bộ dữ liệu hiện tại</strong> bằng dữ liệu từ tệp sao lưu. Không thể hoàn tác.
                    </p>
                     <input type="file" accept=".json" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                     <button onClick={handleUploadClick} className="flex items-center gap-2 px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700">
                        <UploadIcon className="w-5 h-5"/>
                        Tải lên để phục hồi
                    </button>

                    {fileToRestore && (
                        <div className="mt-4 p-2 bg-gray-100 dark:bg-gray-700 rounded">
                            <p className="text-sm dark:text-gray-300">Tệp đã chọn: <span className="font-mono">{fileToRestore.name}</span></p>
                            <button onClick={() => setRestoreModalOpen(true)} className="mt-2 text-sm font-bold text-blue-600 hover:underline">Tiếp tục phục hồi</button>
                        </div>
                    )}
                    {restoreError && <p className="mt-2 text-sm text-red-500">{restoreError}</p>}
                    {restoreSuccess && <p className="mt-2 text-sm text-green-500">{restoreSuccess}</p>}
                </div>
            </div>
            <Modal isOpen={isRestoreModalOpen} onClose={() => setRestoreModalOpen(false)} title="Xác nhận Phục hồi">
                <div>
                    <p className="text-gray-700 dark:text-gray-300 mb-4">
                        Bạn có chắc chắn muốn ghi đè tất cả dữ liệu hiện tại bằng nội dung từ tệp <strong className="font-mono">{fileToRestore?.name}</strong>?
                        <br/>
                        <strong className="text-red-600 dark:text-red-400">Hành động này không thể được hoàn tác.</strong>
                    </p>
                    <div className="flex justify-end gap-2">
                        <button onClick={() => setRestoreModalOpen(false)} className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500">Hủy</button>
                        <button onClick={handleConfirmRestore} className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700">Tôi hiểu, Phục hồi</button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default BackupRestore;
