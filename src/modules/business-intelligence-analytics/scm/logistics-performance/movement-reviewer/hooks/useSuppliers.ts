import { useState, useEffect } from "react";

export interface Supplier {
    id: string;
    name: string;
}

export const useSuppliers = () => {
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [loadingSuppliers, setLoadingSuppliers] = useState(true);

    useEffect(() => {
        const fetchSuppliers = async () => {
            try {
                const res = await fetch("/api/bia/metadata/suppliers");
                if (!res.ok) throw new Error("Failed to fetch suppliers");

                const json = await res.json();

                // Safely extract the data array, handling Directus's { data: [] } wrapper
                const dataArray = Array.isArray(json)
                    ? json
                    : (Array.isArray(json?.data) ? json.data : []);

                const mappedSuppliers = dataArray.map((s: { id: string | number; supplier_name?: string }) => ({
                    id: s.id?.toString(), // Safely convert ID to string for Shadcn Combobox
                    name: s.supplier_name || "Unknown Supplier"
                }));

                setSuppliers(mappedSuppliers);
            } catch (err) {
                console.error("Failed to load suppliers:", err);
            } finally {
                setLoadingSuppliers(false);
            }
        };

        fetchSuppliers();
    }, []);

    return { suppliers, loadingSuppliers };
};
