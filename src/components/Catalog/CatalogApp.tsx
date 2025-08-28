import { AddService } from "./AddService";

export function CatalogApp() {
  return (
    <div className="px-6">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          {/* 3. Ukuran Font Responsif: Judul lebih kecil di layar ponsel. */}
          <h1 className="text-2xl text-center md:text-left sm:text-3xl font-bold text-gray-900 dark:text-white">
            Service Catalog
          </h1>
          <p className="text-gray-500 text-center md:text-left dark:text-gray-400 mt-1">
            Manage harga dan update Service Catalog.
          </p>
        </div>
        <AddService />
      </header>
    </div>
  );
}
