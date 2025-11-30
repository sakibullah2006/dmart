"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { fetchCategories } from "@/lib/api";
import { createCategory, updateCategory, deleteCategory, fetchCategoriesPaginated } from "@/lib/adminApi";
import { Plus, Edit, Trash2, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { Category } from "@/lib/api";
import { generateSlug } from "@/lib/slugUtils";

export function CategoriesAdmin() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    parentCategoryId: "",
    slug: "",
  });
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  // Auto-generate slug from name when creating (not editing)
  useEffect(() => {
    if (!editingCategory && !slugManuallyEdited && formData.name) {
      const autoSlug = generateSlug(formData.name);
      setFormData((prev) => ({ ...prev, slug: autoSlug }));
    }
  }, [formData.name, editingCategory, slugManuallyEdited]);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const allCategories = await fetchCategories();
      setCategories(allCategories);
    } catch (error) {
      console.error("Failed to load categories:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Generate slug if empty (fallback)
      const finalSlug = formData.slug || (formData.name ? generateSlug(formData.name) : undefined);

      const categoryPayload = {
        name: formData.name,
        description: formData.description || undefined,
        parentCategoryId: formData.parentCategoryId || undefined,
        slug: finalSlug || undefined,
      };

      if (editingCategory) {
        await updateCategory(editingCategory.id, categoryPayload);
      } else {
        await createCategory(categoryPayload);
      }

      await loadCategories();
      resetForm();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to save category");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this category?")) return;
    try {
      await deleteCategory(id);
      await loadCategories();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to delete category");
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || "",
      parentCategoryId: category.parentCategoryId || "",
      slug: category.slug || "",
    });
    setSlugManuallyEdited(true); // When editing, don't auto-generate slug
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      parentCategoryId: "",
      slug: "",
    });
    setSlugManuallyEdited(false);
    setEditingCategory(null);
    setShowForm(false);
  };

  const filteredCategories = categories.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="text-center text-muted-foreground">Loading categories...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-foreground">Categories</h2>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Category
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search categories..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>{editingCategory ? "Edit Category" : "Create Category"}</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="slug">Slug</Label>
                    <Input
                      id="slug"
                      value={formData.slug}
                      onChange={(e) => {
                        setSlugManuallyEdited(true);
                        setFormData({ ...formData, slug: e.target.value });
                      }}
                      placeholder="Auto-generated from name"
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                    />
                  </div>

                  <div>
                    <Label htmlFor="parentCategoryId">Parent Category</Label>
                    <select
                      id="parentCategoryId"
                      value={formData.parentCategoryId}
                      onChange={(e) => setFormData({ ...formData, parentCategoryId: e.target.value })}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="">None</option>
                      {categories
                        .filter((c) => c.id !== editingCategory?.id)
                        .map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name}
                          </option>
                        ))}
                    </select>
                  </div>

                  <div className="flex gap-2">
                    <Button type="submit">{editingCategory ? "Update" : "Create"}</Button>
                    <Button type="button" variant="outline" onClick={resetForm}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid gap-4">
        {filteredCategories.map((category) => (
          <motion.div
            key={category.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            layout
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg text-foreground">{category.name}</h3>
                    {category.description && (
                      <p className="text-sm text-muted-foreground mt-1">{category.description}</p>
                    )}
                    {category.slug && (
                      <p className="text-xs text-muted-foreground mt-1">Slug: {category.slug}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(category)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(category.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {filteredCategories.length === 0 && (
        <div className="text-center text-muted-foreground py-8">No categories found</div>
      )}
    </div>
  );
}

