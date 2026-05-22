import api from './api';

const buildParams = ({ tags = [], favorite = false, ...rest } = {}) => {
  const params = { ...rest };
  if (tags.length > 0) {
    params.tags = tags.join(',');
  }
  if (favorite) {
    params.favorite = true;
  }
  return params;
};

const toFormData = (payload, avatarBlob) => {
  const formData = new FormData();
  formData.append('name', payload.name || '');
  formData.append('phoneNumbers', JSON.stringify(payload.phoneNumbers || []));
  formData.append('emails', JSON.stringify(payload.emails || []));
  formData.append('company', payload.company || '');
  formData.append('address', payload.address || '');
  formData.append('tags', JSON.stringify(payload.tags || []));
  formData.append('isFavorite', String(Boolean(payload.isFavorite)));

  if (payload.avatar?.url && !avatarBlob) {
    formData.append('avatar', JSON.stringify(payload.avatar));
  }

  if (avatarBlob) {
    formData.append('avatar', avatarBlob, 'avatar.jpg');
  }

  return formData;
};

export const contactService = {
  getContacts(params) {
    return api.get('/contacts', { params: buildParams(params) });
  },

  getContact(id) {
    return api.get(`/contacts/${id}`);
  },

  getSuggestions(params) {
    return api.get('/contacts/suggestions', { params: buildParams(params) });
  },

  getRecents(params) {
    return api.get('/contacts/recents', { params: buildParams(params) });
  },

  createContact(payload, avatarBlob) {
    if (avatarBlob) {
      return api.post('/contacts', toFormData(payload, avatarBlob), {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    }
    return api.post('/contacts', payload);
  },

  updateContact(id, payload, avatarBlob) {
    if (avatarBlob) {
      return api.put(`/contacts/${id}`, toFormData(payload, avatarBlob), {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    }
    return api.put(`/contacts/${id}`, payload);
  },

  deleteContact(id) {
    return api.delete(`/contacts/${id}`);
  },

  setFavorite(id, isFavorite) {
    return api.patch(`/contacts/${id}/favorite`, { isFavorite });
  },

  importCsv(file) {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/contacts/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  async exportCsv() {
    const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
    const response = await fetch(`${baseURL}/contacts/export`);
    if (!response.ok) {
      throw new Error('CSV export failed');
    }
    return response.blob();
  },

  getDashboardStats() {
    return api.get('/dashboard/stats');
  },
};
