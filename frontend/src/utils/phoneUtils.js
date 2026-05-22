export const digitsOnly = (value = '') => String(value).replace(/\D/g, '');

export const isFullTenDigitPhone = (value = '') => digitsOnly(value).length === 10;

export const hasLetters = (value = '') => /[a-zA-Z]/.test(String(value));

export const getPrimaryPhone = (contact) => {
  const phone = contact?.phoneNumbers?.find((item) => item.isPrimary) || contact?.phoneNumbers?.[0];
  return phone?.number || contact?.primaryPhone?.number || '';
};

export const getPhoneHref = (number = '') => {
  const digits = digitsOnly(number);
  return digits ? `tel:${digits}` : undefined;
};

export const getWhatsAppHref = (number = '') => {
  const digits = digitsOnly(number);
  return digits ? `https://wa.me/${digits}` : undefined;
};
