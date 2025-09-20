import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { ContractStatus, LiquidationType } from '../types';
import { formatDate } from '../utils';
import Modal from '../components/Modal';
import { PencilIcon } from '../components/Icons';

const ContractDetail: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { getContractById, getWardById, updateContractStatus, addLiquidation, getLiquidationsByContractId } = useData();
    const { isAdmin } = useAuth();
    const [isCancelModalOpen, setCancelModalOpen] = useState(false);
    const [isConfirmCancelModalOpen, setConfirmCancelModalOpen] = useState(false);
    const [isLiquidateModalOpen, setLiquidateModalOpen] = useState(false);
    const [isConfirmLiquidationModalOpen, setConfirmLiquidationModalOpen] = useState(false);
    const [liquidationTypeToConfirm, setLiquidationTypeToConfirm] = useState<LiquidationType | null>(null);
    const [cancellationReason, setCancellationReason] = useState('');
    const [reasonError, setReasonError] = useState('');
    
    const contract = getContractById(Number(id));
    const ward = contract ? getWardById(contract.wardId) : undefined;
    const liquidations = contract ? getLiquidationsByContractId(contract.id) : [];

    if (!contract || !ward) {
        return <div className="p-8 text-center text-red-500">Hợp đồng không tồn tại.</div>;
    }

    const handleInitiateCancel = () => {
        if (cancellationReason.length < 8) {
            setReasonError('Lý do hủy phải có ít nhất 8 ký tự.');
            return;
        }
        setReasonError('');
        setCancelModalOpen(false);
        setConfirmCancelModalOpen(true);
    };
    
    const handleConfirmCancel = () => {
        updateContractStatus(contract.id, ContractStatus.Cancelled, cancellationReason);
        setConfirmCancelModalOpen(false);
        setCancellationReason('');
    };

    const handleInitiateLiquidation = (type: LiquidationType) => {
        setLiquidationTypeToConfirm(type);
        setLiquidateModalOpen(false);
        setConfirmLiquidationModalOpen(true);
    };

    const handleConfirmLiquidation = () => {
        if (liquidationTypeToConfirm) {
            addLiquidation(contract.id, liquidationTypeToConfirm);
        }
        setConfirmLiquidationModalOpen(false);
        setLiquidationTypeToConfirm(null);
    };

    const closeConfirmationModal = () => {
        setConfirmLiquidationModalOpen(false);
        setLiquidationTypeToConfirm(null);
    };

    const isActionable = contract.status === ContractStatus.Processing;

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Chi tiết Hợp đồng</h1>
            <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 p-8 rounded-lg shadow">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                    <div className="col-span-1 md:col-span-2 pb-4 border-b dark:border-gray-600">
                        <h2 className="text-xl font-semibold text-blue-600 dark:text-blue-400">{contract.contractNumber}</h2>
                    </div>
                    <div><strong className="text-gray-600 dark:text-gray-400">Khách hàng:</strong> <span className="text-gray-800 dark:text-gray-200">{contract.customerName}</span></div>
                    <div><strong className="text-gray-600 dark:text-gray-400">Ngày tạo:</strong> <span className="text-gray-800 dark:text-gray-200">{formatDate(contract.createdAt)}</span></div>
                    <div><strong className="text-gray-600 dark:text-gray-400">Số tờ bản đồ:</strong> <span className="text-gray-800 dark:text-gray-200">{contract.mapSheetNumber}</span></div>
                    <div><strong className="text-gray-600 dark:text-gray-400">Số thửa đất:</strong> <span className="text-gray-800 dark:text-gray-200">{contract.plotNumber}</span></div>
                    <div><strong className="text-gray-600 dark:text-gray-400">Phường/Xã:</strong> <span className="text-gray-800 dark:text-gray-200">{ward.wardName}</span></div>
                    <div><strong className="text-gray-600 dark:text-gray-400">Trạng thái:</strong> <span className="text-gray-800 dark:text-gray-200 font-semibold">{contract.status}</span></div>
                    <div className="col-span-1 md:col-span-2"><strong className="text-gray-600 dark:text-gray-400">Ghi chú:</strong> <p className="mt-1 text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{contract.notes || 'Không có'}</p></div>
                    {contract.status === ContractStatus.Cancelled && contract.cancellationReason && (
                         <div className="col-span-1 md:col-span-2"><strong className="text-gray-600 dark:text-gray-400">Lý do hủy:</strong> <p className="mt-1 text-red-500 dark:text-red-400">{contract.cancellationReason}</p></div>
                    )}
                </div>

                {liquidations.length > 0 && (
                    <div className="mt-6 pt-6 border-t dark:border-gray-600">
                        <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-200">Lịch sử Thanh lý</h3>
                        {liquidations.map(liq => (
                            <div key={liq.id} className="text-sm">
                                <p><strong className="text-gray-600 dark:text-gray-400">Số thanh lý:</strong> {liq.liquidationNumber}</p>
                                <p><strong className="text-gray-600 dark:text-gray-400">Loại:</strong> {liq.liquidationType}</p>
                                <p><strong className="text-gray-600 dark:text-gray-400">Ngày:</strong> {formatDate(liq.createdAt)}</p>
                            </div>
                        ))}
                    </div>
                )}
                
                {isAdmin && (
                    <div className="mt-8 pt-6 border-t dark:border-gray-600 flex justify-end gap-4">
                        <button onClick={() => navigate('/dashboard')} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">Quay lại</button>
                        {isActionable && (
                           <>
                                <button onClick={() => navigate(`/contract/edit/${contract.id}`)} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-yellow-500 rounded-md hover:bg-yellow-600">
                                    <PencilIcon className="w-4 h-4" /> Sửa
                                </button>
                                <button onClick={() => setCancelModalOpen(true)} className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700">Hủy Hợp đồng</button>
                                <button onClick={() => setLiquidateModalOpen(true)} className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700">Tạo Thanh lý</button>
                           </>
                        )}
                    </div>
                )}
            </div>

            <Modal isOpen={isCancelModalOpen} onClose={() => setCancelModalOpen(false)} title="Hủy Hợp đồng">
                <div className="space-y-4">
                    <label htmlFor="cancellation_reason" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Lý do hủy (Bắt buộc, tối thiểu 8 ký tự)</label>
                    <textarea id="cancellation_reason" value={cancellationReason} onChange={(e) => setCancellationReason(e.target.value)} rows={4} className="w-full border rounded-md p-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                    {reasonError && <p className="text-sm text-red-500">{reasonError}</p>}
                    <div className="flex justify-end gap-2">
                        <button onClick={() => setCancelModalOpen(false)} className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500">Đóng</button>
                        <button onClick={handleInitiateCancel} className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700">Tiếp tục</button>
                    </div>
                </div>
            </Modal>
            
            <Modal isOpen={isConfirmCancelModalOpen} onClose={() => setConfirmCancelModalOpen(false)} title="Xác nhận Hủy Hợp đồng">
                <div>
                    <p className="text-gray-700 dark:text-gray-300 mb-4">
                        Bạn có chắc chắn muốn hủy hợp đồng này không? Hành động này sẽ thay đổi trạng thái hợp đồng thành "Đã hủy" và không thể hoàn tác.
                    </p>
                    <div className="flex justify-end gap-2">
                        <button onClick={() => setConfirmCancelModalOpen(false)} className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500">Quay lại</button>
                        <button onClick={handleConfirmCancel} className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700">Xác nhận Hủy</button>
                    </div>
                </div>
            </Modal>


            <Modal isOpen={isLiquidateModalOpen} onClose={() => setLiquidateModalOpen(false)} title="Tạo Thanh lý Hợp đồng">
                 <div className="space-y-4">
                    <p className="text-gray-700 dark:text-gray-300">Chọn loại thanh lý để tạo:</p>
                    <div className="flex flex-col sm:flex-row justify-center gap-4">
                        <button onClick={() => handleInitiateLiquidation(LiquidationType.Complete)} className="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 flex-1">Thanh lý hoàn tất</button>
                        <button onClick={() => handleInitiateLiquidation(LiquidationType.Cancel)} className="px-6 py-3 bg-red-600 text-white rounded-md hover:bg-red-700 flex-1">Thanh lý hủy hợp đồng</button>
                    </div>
                </div>
            </Modal>

            <Modal isOpen={isConfirmLiquidationModalOpen} onClose={closeConfirmationModal} title="Xác nhận Hành động">
                <div>
                    <p className="text-gray-700 dark:text-gray-300 mb-4">
                        Bạn có chắc chắn muốn thực hiện "{liquidationTypeToConfirm}" cho hợp đồng này không?
                        <br/>
                        { liquidationTypeToConfirm === LiquidationType.Cancel && 
                            <strong className="text-red-600 dark:text-red-400">Hành động này sẽ thay đổi trạng thái hợp đồng thành "Đã hủy".</strong>
                        }
                        { liquidationTypeToConfirm === LiquidationType.Complete && 
                            <strong className="text-green-600 dark:text-green-400">Hành động này sẽ thay đổi trạng thái hợp đồng thành "Hoàn thành".</strong>
                        }
                    </p>
                    <div className="flex justify-end gap-2">
                        <button onClick={closeConfirmationModal} className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500">Hủy</button>
                        <button onClick={handleConfirmLiquidation} className={`px-4 py-2 text-white rounded-md ${liquidationTypeToConfirm === LiquidationType.Complete ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}>
                            Xác nhận
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default ContractDetail;