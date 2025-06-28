// This file is being deprecated in favor of src/utils/api.ts
// Please use the api utility from '@/utils/api' instead

import { api as apiUtil, reconcileInvoices as reconcileInvoicesUtil } from '@/utils/api';

export * from '@/utils/api';

/**
 * @deprecated Use reconcileInvoices from '@/utils/api' instead
 */
export const reconcileInvoices = reconcileInvoicesUtil;
