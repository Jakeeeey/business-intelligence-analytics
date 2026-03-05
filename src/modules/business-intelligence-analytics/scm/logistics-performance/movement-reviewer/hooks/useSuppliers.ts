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
                // ✅ Pointing to the new module-specific route
                const res = await fetch("/api/bia/scm/logistics-performance/movement-reviewer/suppliers");
                if (!res.ok) throw new Error("Failed to fetch suppliers");

                const json = await res.json();

                const dataArray = Array.isArray(json)
                    ? json
                    : (Array.isArray(json?.data) ? json.data : []);

                const mappedSuppliers = dataArray.map((s: Record<string, unknown>) => ({
                    id: s.id ? String(s.id) : "",
                    name: typeof s.supplier_name === "string" ? s.supplier_name : "Unknown Supplier"
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