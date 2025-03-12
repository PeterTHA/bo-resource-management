import { put, del, list } from '@vercel/blob';

export async function uploadProfileImage(file, employeeId) {
  try {
    const blob = await put(`profile-images/${employeeId}.jpg`, file, {
      access: 'public',
    });
    return { success: true, url: blob.url };
  } catch (error) {
    console.error('Error uploading image:', error);
    return { success: false, error: error.message };
  }
}

export async function deleteProfileImage(employeeId) {
  try {
    await del(`profile-images/${employeeId}.jpg`);
    return { success: true };
  } catch (error) {
    console.error('Error deleting image:', error);
    return { success: false, error: error.message };
  }
}

export { list }; 