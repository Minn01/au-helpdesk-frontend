import { categories, delay, setCategories } from "./store";
import { requesterApi } from "./requester.api";
import { useMockApi } from "./api.config";
import { ApiError } from "./http.client";
import { adminApi } from "./admin.api";

const adminUnavailable = () => new ApiError(501, "PHASE_NOT_IMPLEMENTED", "Admin category APIs are not connected in Phase 4.");
export const categoriesApi = {
  async getCategories(signal?: AbortSignal) { if (!useMockApi) return requesterApi.getCategories(signal); await delay(220); return structuredClone(categories); },
  async getAdminCategories(signal?: AbortSignal) { if (!useMockApi) return adminApi.getCategories(signal); await delay(220); return structuredClone(categories.map((category) => ({ ...category, isActive: category.isActive !== false }))); },
  async createCategory(input: { name: string; description?: string }) { if (!useMockApi) return adminApi.createCategory(input); await delay(); const name = input.name.trim(); if (!name) throw new Error("Category name is required."); if (categories.some((item) => item.name.toLowerCase() === name.toLowerCase())) throw new Error("A category with that name already exists."); const category = { id: `category-${Date.now()}`, name, description: input.description?.trim() || undefined, isActive: true }; setCategories([...categories, category]); return structuredClone(category); },
  async updateCategory(id: string, input: { name: string; description?: string }) { if (!useMockApi) return adminApi.updateCategory(id, input); await delay(); const name = input.name.trim(); if (!name) throw new Error("Category name is required."); if (categories.some((item) => item.id !== id && item.name.toLowerCase() === name.toLowerCase())) throw new Error("A category with that name already exists."); const current = categories.find((item) => item.id === id); if (!current) throw new Error("Category not found."); const updated = { ...current, name, description: input.description?.trim() || undefined }; setCategories(categories.map((item) => item.id === id ? updated : item)); return structuredClone(updated); },
  async setCategoryActive(id: string, isActive: boolean) { if (!useMockApi) return adminApi.setCategoryActive(id, isActive); await delay(); const current = categories.find((item) => item.id === id); if (!current) throw new Error("Category not found."); const updated = { ...current, isActive }; setCategories(categories.map((item) => item.id === id ? updated : item)); return structuredClone(updated); },
  async deleteCategory(id: string) { if (!useMockApi) throw adminUnavailable(); await delay(); if (categories.length <= 1) throw new Error("At least one category must remain."); setCategories(categories.filter((item) => item.id !== id)); },
};
