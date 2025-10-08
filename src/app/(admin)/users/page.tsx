"use client";

import React, { useEffect, useState } from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";

type Role = "ADMIN" | "USER";

type User = {
  id: string;
  email: string;
  name?: string | null;
  role: Role;
  createdAt: string;
  updatedAt: string;
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<Role>("USER");

  const [editId, setEditId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/users");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load");
      setUsers(data.users || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const resetForm = () => {
    setEmail("");
    setName("");
    setRole("USER");
    setEditId(null);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      if (editId) {
        const res = await fetch(`/api/users/${editId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, name: name || null, role }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Update failed");
      } else {
        const res = await fetch("/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, name: name || null, role }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Create failed");
      }
      resetForm();
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
    } finally {
      setLoading(false);
    }
  };

  const onEdit = (u: User) => {
    setEditId(u.id);
    setEmail(u.email);
    setName(u.name || "");
    setRole(u.role);
  };

  const onDelete = async (id: string) => {
    if (!confirm("Delete user?")) return;
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Delete failed");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PageBreadcrumb pageTitle="Users" />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* Form */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
            {editId ? "Edit User" : "Create User"}
          </h3>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-700 mb-1">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="name@example.com"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Optional"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as Role)}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="USER">USER</option>
                <option value="ADMIN">ADMIN</option>
              </select>
            </div>
            <div className="flex gap-3">
              <button
                disabled={loading}
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300"
              >
                {editId ? "Save" : "Create"}
              </button>
              {editId && (
                <button
                  type="button"
                  className="px-4 py-2 rounded-md border"
                  onClick={resetForm}
                >
                  Cancel
                </button>
              )}
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
          </form>
        </div>

        {/* Table */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">Users</h3>
          {loading ? (
            <p className="text-gray-500">Loading...</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-2 text-left">Email</th>
                    <th className="px-4 py-2 text-left">Name</th>
                    <th className="px-4 py-2 text-left">Role</th>
                    <th className="px-4 py-2 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td className="px-4 py-2">{u.email}</td>
                      <td className="px-4 py-2">{u.name || "-"}</td>
                      <td className="px-4 py-2">{u.role}</td>
                      <td className="px-4 py-2">
                        <div className="flex gap-2">
                          <button
                            onClick={() => onEdit(u)}
                            className="px-3 py-1 border rounded-md"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => onDelete(u.id)}
                            className="px-3 py-1 border rounded-md text-red-600 border-red-300"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
