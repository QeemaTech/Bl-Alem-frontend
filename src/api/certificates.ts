import { apiClient } from './client';
import type { ApiResponse } from '../utils/types';

const unwrap = async <T>(request: Promise<{ data: ApiResponse<T> }>) => (await request).data.data;

export const certificatesApi = {
  verify: (certificateNumber: string) =>
    unwrap<any>(apiClient.get(`/certificates/verify/${encodeURIComponent(certificateNumber)}`)),
};
