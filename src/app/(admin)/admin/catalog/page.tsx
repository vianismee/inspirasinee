"use client";

import { CatalogApp } from "@/components/Catalog/CatalogApp";
import { useServiceCatalogStore } from "@/stores/serviceCatalogStore";
import { useEffect } from "react";

export default function InputPage() {
  const { fetchCatalog, subscribeToChanges } = useServiceCatalogStore();
  useEffect(() => {
    fetchCatalog();
    const unsubscribe = subscribeToChanges();
    return () => unsubscribe();
  }, [fetchCatalog, subscribeToChanges]);
  return <CatalogApp />;
}
