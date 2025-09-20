
export enum Role {
  Admin = "Admin",
  User = "User",
}

export enum ContractStatus {
  Processing = "Đang xử lý",
  Completed = "Hoàn thành",
  Cancelled = "Đã hủy",
}

export enum LiquidationType {
    Complete = "Thanh lý hoàn tất",
    Cancel = "Thanh lý hủy hợp đồng",
}

export interface User {
  id: number;
  username: string;
  password?: string; // Password should not be stored in client-side state long-term
  fullName: string;
  role: Role;
}

export interface Ward {
  id: number;
  wardName: string;
  wardCode: string;
}

export interface Contract {
  id: number;
  contractNumber: string;
  customerName: string;
  mapSheetNumber: number;
  plotNumber: number;
  wardId: number;
  notes?: string;
  createdAt: string; // ISO string date
  status: ContractStatus;
  cancellationReason?: string;
}

export interface Liquidation {
  id: number;
  liquidationNumber: string;
  contractId: number;
  liquidationType: LiquidationType;
  createdAt: string; // ISO string date
}

export interface AppData {
    users: User[];
    wards: Ward[];
    contracts: Contract[];
    liquidations: Liquidation[];
}
