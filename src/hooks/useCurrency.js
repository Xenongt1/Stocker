import { useAppSettings } from '../context/AppSettingsContext';
import { formatCurrency as format } from '../utils/formatCurrency';

export const useCurrency = () => {
    const { settings } = useAppSettings();

    // Return a function that automatically uses the global currency setting
    const formatCurrency = (amount) => {
        return format(amount, settings.currency);
    };

    return {
        currency: settings.currency,
        formatCurrency
    };
};
