"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createAttribute,
  updateAttribute,
  deleteAttribute,
  fetchAttributesPaginated,
  fetchAttributeOptions,
  createAttributeOption,
  updateAttributeOption,
  type Attribute,
  type AttributeOption,
} from "@/lib/adminApi";
import { Plus, Edit, Trash2, Search, ChevronDown, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function AttributesAdmin() {
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingAttribute, setEditingAttribute] = useState<Attribute | null>(null);
  const [expandedAttributes, setExpandedAttributes] = useState<Set<string>>(new Set());
  const [attributeOptions, setAttributeOptions] = useState<Record<string, AttributeOption[]>>({});
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });

  useEffect(() => {
    loadAttributes();
  }, []);

  const loadAttributes = async () => {
    try {
      setLoading(true);
      const response = await fetchAttributesPaginated(0, 100);
      setAttributes(response.content);
    } catch (error) {
      console.error("Failed to load attributes:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadAttributeOptions = async (attributeId: string) => {
    try {
      const options = await fetchAttributeOptions(attributeId);
      setAttributeOptions((prev) => ({ ...prev, [attributeId]: options }));
    } catch (error) {
      console.error("Failed to load attribute options:", error);
    }
  };

  const toggleAttribute = (attributeId: string) => {
    const newExpanded = new Set(expandedAttributes);
    if (newExpanded.has(attributeId)) {
      newExpanded.delete(attributeId);
    } else {
      newExpanded.add(attributeId);
      loadAttributeOptions(attributeId);
    }
    setExpandedAttributes(newExpanded);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingAttribute) {
        await updateAttribute(editingAttribute.id, formData);
      } else {
        await createAttribute(formData);
      }

      await loadAttributes();
      resetForm();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to save attribute");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this attribute?")) return;
    try {
      await deleteAttribute(id);
      await loadAttributes();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to delete attribute");
    }
  };

  const handleEdit = (attribute: Attribute) => {
    setEditingAttribute(attribute);
    setFormData({
      name: attribute.name,
      description: attribute.description || "",
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
    });
    setEditingAttribute(null);
    setShowForm(false);
  };

  const filteredAttributes = attributes.filter((a) =>
    a.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="text-center text-muted-foreground">Loading attributes...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-foreground">Attributes</h2>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Attribute
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search attributes..."
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
                <CardTitle>{editingAttribute ? "Edit Attribute" : "Create Attribute"}</CardTitle>
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
                    <Label htmlFor="description">Description</Label>
                    <textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button type="submit">{editingAttribute ? "Update" : "Create"}</Button>
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
        {filteredAttributes.map((attribute) => (
          <motion.div
            key={attribute.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            layout
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleAttribute(attribute.id)}
                      >
                        {expandedAttributes.has(attribute.id) ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </Button>
                      <h3 className="font-semibold text-lg text-foreground">{attribute.name}</h3>
                    </div>
                    {attribute.description && (
                      <p className="text-sm text-muted-foreground mt-1 ml-8">
                        {attribute.description}
                      </p>
                    )}

                    <AnimatePresence>
                      {expandedAttributes.has(attribute.id) && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-4 ml-8"
                        >
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <h4 className="font-medium text-sm text-foreground">Options</h4>
                            </div>
                            {attributeOptions[attribute.id]?.map((option) => (
                              <div
                                key={option.id}
                                className="flex justify-between items-center p-2 bg-secondary/30 rounded"
                              >
                                <span className="text-sm text-foreground">{option.name}</span>
                              </div>
                            ))}
                            {(!attributeOptions[attribute.id] ||
                              attributeOptions[attribute.id].length === 0) && (
                              <p className="text-sm text-muted-foreground">No options yet</p>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(attribute)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(attribute.id)}
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

      {filteredAttributes.length === 0 && (
        <div className="text-center text-muted-foreground py-8">No attributes found</div>
      )}
    </div>
  );
}

