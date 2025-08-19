// C:\File\Source Code\Pertanahan\src\components\documents\DocumentGrid.tsx
"use client";
import React, { useState, useEffect } from "react";
import { useAuthStore } from "@/lib/stores/useAuthStore";
import { useDocumentStore } from "@/lib/stores/useDocumentStore";
import { toast } from "sonner";
import { DocumentCard } from "@/components/documents/DocumentCard";
import Button from "../ui/button/Button";
import Input from "../form/input/InputField";

// Konfigurasi pagination
const ITEMS_PER_PAGE = 3;

export default function DocumentGrid() {
    const { token } = useAuthStore();
    const {
        templates,
        loading,
        error,
        fetchTemplates,
        deleteTemplate,
    } = useDocumentStore();

    const [searchTerm, setSearchTerm] = useState<string>("");
    const [currentPage, setCurrentPage] = useState<number>(1);

    useEffect(() => {
        if (typeof token === "string") {
            fetchTemplates(token);
        }
    }, [token, fetchTemplates]); // Tambahkan fetchTemplates sebagai dependency

    const filteredTemplates = templates?.filter((doc) =>
        doc.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalPages = Math.ceil((filteredTemplates?.length || 0) / ITEMS_PER_PAGE);

    const paginatedTemplates = filteredTemplates?.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    // Pastikan handleDelete menerima ID bertipe string (UUID)
    const handleDelete = async (id: string) => { 
        console.log("Menghapus dokumen dengan ID:", id);


        if (!id) { 
            toast.error("ID dokumen tidak valid untuk dihapus.");
            console.error("Kesalahan: ID dokumen yang diterima kosong.");
            return;
        }

        if (typeof token !== "string") {
            toast.error("Token tidak tersedia");
            return;
        }

        try {
            await deleteTemplate(id, token); 
            toast.success("Dokumen berhasil dihapus!");
        } catch (err) {
            console.error("Gagal menghapus dokumen:", err);
            toast.error("Gagal menghapus dokumen.");
        }
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                <h1 className="text-xl font-semibold text-gray-800 dark:text-white">Dokumen</h1>
                <Input
                    type="text"
                    placeholder="Cari dokumen..."
                    value={searchTerm}
                    onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setCurrentPage(1);
                    }}
                    className="w-full sm:w-64 px-4 py-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none"
                />
            </div>

            {loading ? (
                <p className="text-center text-gray-500 dark:text-gray-400 py-6">Memuat dokumen...</p>
            ) : error ? (
                <p className="text-center text-red-500 py-6">{error}</p>
            ) : !paginatedTemplates || paginatedTemplates.length === 0 ? (
                <p className="text-center text-gray-500 dark:text-gray-400 py-6">
                    {searchTerm ? "Tidak ada dokumen yang cocok." : "Tidak ada dokumen tersedia."}
                </p>
            ) : (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {paginatedTemplates.map((doc) => {
                            if (!doc.id) {
                                console.warn(`Peringatan: ID dokumen kosong untuk dokumen "${doc.name}". Dokumen ini mungkin tidak dapat dihapus atau diproses.`);
                                return null;
                            }

                            return (
                                <DocumentCard
                                    key={doc.id}
                                    doc={{
                                        id: doc.id, 
                                        name: doc.name,
                                        description: doc.description ?? "",
                                        thumbnail: doc.thumbnail ?? "/images/default-thumbnail.png",
                                    }}
                                    onDelete={() => handleDelete(doc.id)} 
                                />
                            );
                        })}
                    </div>

                    <div className="flex justify-center items-center gap-2 mt-6">
                        <Button
                            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            variant="outline"
                        >
                            Previous
                        </Button>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                            Halaman {currentPage} dari {totalPages}
                        </span>
                        <Button
                            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            variant="outline"
                        >
                            Next
                        </Button>
                    </div>
                </>
            )}
        </div>
    );
}