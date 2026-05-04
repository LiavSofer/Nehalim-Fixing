/**
 * Uploads a file using multipart/form-data directly.
 * The SDK serializes files as JSON which causes a 422 error.
 * This function bypasses the SDK and sends the file correctly.
 * Returns { file_url: string }
 */
export async function uploadFile(file) {
  const appId = import.meta.env.VITE_BASE44_APP_ID || localStorage.getItem('base44_app_id');
  const token = localStorage.getItem('base44_access_token') || localStorage.getItem('token');

  const formData = new FormData();
  formData.append('file', file);

  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const response = await fetch(
    `/api/apps/${appId}/integration-endpoints/Core/UploadFile`,
    { method: 'POST', headers, body: formData }
  );

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Upload failed (${response.status}): ${err}`);
  }

  return response.json(); // { file_url: string }
}