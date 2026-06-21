export const certificateVerifyUrl = (certificateNumber: string) =>
  `/certificates/verify/${encodeURIComponent(certificateNumber)}`;

export const certificatePdfUrl = (certificateNumber: string) =>
  `/api/certificates/${encodeURIComponent(certificateNumber)}/pdf`;

/** @deprecated use certificatePdfUrl with certificate number */
export const certificateFileUrl = (_pdfUrl?: string | null, certificateNumber?: string) =>
  (certificateNumber ? certificatePdfUrl(certificateNumber) : null);
