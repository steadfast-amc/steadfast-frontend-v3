import { api } from "./api";

export async function uploadPhotoFile(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("photo", file);

  const { data } = await api.post("/uploads", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data.url as string;
}
