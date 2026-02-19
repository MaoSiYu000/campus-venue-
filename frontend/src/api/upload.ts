import axios from 'axios';

export function uploadProposal(file: File) {
  const form = new FormData();
  form.append('file', file);
  const token = localStorage.getItem('accessToken');
  return axios
    .post<{ path: string | null }>('/api/v1/upload/proposal', form, {
      headers: {
        'Content-Type': 'multipart/form-data',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    })
    .then((r) => r.data);
}
