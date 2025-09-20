import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { INITIAL_USERS, INITIAL_WARDS, INITIAL_CONTRACTS } from '../constants';
import { type AppData, type Contract, type Liquidation, type Ward, type User, ContractStatus, LiquidationType } from '../types';

interface DataContextType {
    data: AppData;
    loading: boolean;
    addContract: (newContractData: Omit<Contract, 'id' | 'contractNumber' | 'createdAt' | 'status'>) => void;
    updateContract: (contractId: number, updatedData: Pick<Contract, 'customerName' | 'mapSheetNumber' | 'plotNumber' | 'wardId' | 'notes'>) => void;
    updateContractStatus: (contractId: number, status: ContractStatus, reason?: string) => void;
    addLiquidation: (contractId: number, liquidationType: LiquidationType) => void;
    getWardById: (id: number) => Ward | undefined;
    getContractById: (id: number) => Contract | undefined;
    getLiquidationsByContractId: (contractId: number) => Liquidation[];
    backupData: () => void;
    restoreData: (file: File) => Promise<void>;
    findUser: (username: string, password?: string) => User | undefined;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const initialData: AppData = {
    users: INITIAL_USERS,
    wards: INITIAL_WARDS,
    contracts: INITIAL_CONTRACTS,
    liquidations: [],
};

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [data, setData] = useState<AppData>(initialData);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        try {
            const storedData = localStorage.getItem('appData');
            if (storedData) {
                setData(JSON.parse(storedData));
            } else {
                setData(initialData);
            }
        } catch (error) {
            console.error("Failed to load data from localStorage", error);
            setData(initialData);
        } finally {
            setLoading(false);
        }
    }, []);

    const saveData = useCallback((newData: AppData) => {
        try {
            localStorage.setItem('appData', JSON.stringify(newData));
            setData(newData);
        } catch (error) {
            console.error("Failed to save data to localStorage", error);
        }
    }, []);

    const findUser = useCallback((username: string, password?: string): User | undefined => {
        const user = data.users.find(u => u.username === username);
        if (password) {
            // In a real app, this would be a hashed password check
            return user && user.password === password ? user : undefined;
        }
        return user;
    }, [data.users]);
    
    const getWardById = useCallback((id: number) => data.wards.find(w => w.id === id), [data.wards]);
    const getContractById = useCallback((id: number) => data.contracts.find(c => c.id === id), [data.contracts]);
    const getLiquidationsByContractId = useCallback((contractId: number) => data.liquidations.filter(l => l.contractId === contractId), [data.liquidations]);


    const addContract = (newContractData: Omit<Contract, 'id' | 'contractNumber' | 'createdAt' | 'status'>) => {
        setData(prevData => {
            const now = new Date();
            const year = now.getFullYear().toString().slice(-2);
            const ward = prevData.wards.find(w => w.id === newContractData.wardId);
            if (!ward) throw new Error("Ward not found");

            const contractsThisYear = prevData.contracts.filter(c => new Date(c.createdAt).getFullYear() === now.getFullYear());
            const sequentialNumber = contractsThisYear.length + 1;
            const formattedSeq = sequentialNumber.toString().padStart(2, '0');
            
            const contractNumber = `${formattedSeq}/${year}${ward.wardCode}.HĐ.VPĐKLK`;

            const newContract: Contract = {
                ...newContractData,
                id: Date.now(),
                contractNumber,
                createdAt: now.toISOString(),
                status: ContractStatus.Processing,
            };
            const newData = { ...prevData, contracts: [...prevData.contracts, newContract] };
            saveData(newData);
            return newData;
        });
    };
    
    const updateContract = (contractId: number, updatedData: Pick<Contract, 'customerName' | 'mapSheetNumber' | 'plotNumber' | 'wardId' | 'notes'>) => {
        setData(prevData => {
            const updatedContracts = prevData.contracts.map(c => {
                if (c.id === contractId) {
                    return { ...c, ...updatedData };
                }
                return c;
            });
            const newData = { ...prevData, contracts: updatedContracts };
            saveData(newData);
            return newData;
        });
    };

    const updateContractStatus = (contractId: number, status: ContractStatus, reason?: string) => {
        setData(prevData => {
            const updatedContracts = prevData.contracts.map(c => {
                if (c.id === contractId) {
                    return { ...c, status, cancellationReason: reason || c.cancellationReason };
                }
                return c;
            });
            const newData = { ...prevData, contracts: updatedContracts };
            saveData(newData);
            return newData;
        });
    };

    const addLiquidation = (contractId: number, liquidationType: LiquidationType) => {
        setData(prevData => {
            const contract = prevData.contracts.find(c => c.id === contractId);
            if (!contract) throw new Error("Contract not found");

            const suffix = liquidationType === LiquidationType.Complete ? ".TLHĐ.VPĐKLK" : ".TLHHĐ.VPĐKLK";
            const liquidationNumber = contract.contractNumber.replace('.HĐ.VPĐKLK', suffix);

            const newLiquidation: Liquidation = {
                id: Date.now(),
                contractId,
                liquidationType,
                liquidationNumber,
                createdAt: new Date().toISOString(),
            };
            
            const updatedContracts = prevData.contracts.map(c => {
                if (c.id === contractId) {
                    const newStatus = liquidationType === LiquidationType.Complete ? ContractStatus.Completed : ContractStatus.Cancelled;
                    return { ...c, status: newStatus };
                }
                return c;
            });

            const newData = { 
                ...prevData, 
                contracts: updatedContracts,
                liquidations: [...prevData.liquidations, newLiquidation] 
            };
            saveData(newData);
            return newData;
        });
    };

    const backupData = () => {
        const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
          JSON.stringify(data)
        )}`;
        const link = document.createElement("a");
        link.href = jsonString;
        link.download = `backup-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
    };

    const restoreData = (file: File): Promise<void> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const text = e.target?.result;
                    if (typeof text !== 'string') {
                        throw new Error("Invalid file content");
                    }
                    const restoredData = JSON.parse(text);
                    // Basic validation
                    if (restoredData.users && restoredData.wards && restoredData.contracts) {
                        saveData(restoredData);
                        resolve();
                    } else {
                        throw new Error("Invalid data structure in backup file.");
                    }
                } catch (err) {
                    reject(err);
                }
            };
            reader.onerror = (err) => reject(err);
            reader.readAsText(file);
        });
    };

    return (
        <DataContext.Provider value={{ data, loading, addContract, updateContract, updateContractStatus, addLiquidation, getWardById, getContractById, getLiquidationsByContractId, backupData, restoreData, findUser }}>
            {children}
        </DataContext.Provider>
    );
};

export const useData = () => {
    const context = useContext(DataContext);
    if (context === undefined) {
        throw new Error('useData must be used within a DataProvider');
    }
    return context;
};