"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "../ui/badge";
import { MapPin, Package, Users, Clock, ArrowRight } from "lucide-react";
import { DropPointService } from "@/lib/client-services";
import { toast } from "sonner";
import { logger } from "@/utils/client/logger";

// Types
interface DropPointLocation {
  id: number;
  name: string;
  address: string;
  max_capacity: number;
  current_capacity: number;
  available_capacity: number;
  is_available: boolean;
  created_at: string;
  updated_at: string;
}

export function DropPointLocations() {
  const router = useRouter();
  const [dropPointLocations, setDropPointLocations] = useState<DropPointLocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load drop-point locations on component mount
  useEffect(() => {
    const loadDropPointLocations = async () => {
      try {
        setIsLoading(true);
        const locations = await DropPointService.getDropPointLocations();
        logger.info("Loaded drop-point locations", { count: locations.length }, "DropPointLocations");
        setDropPointLocations(locations);
      } catch (error) {
        logger.error("Failed to load drop-point locations", { error }, "DropPointLocations");
        toast.error("Failed to load drop-point locations. Please refresh the page.");
      } finally {
        setIsLoading(false);
      }
    };

    loadDropPointLocations();
  }, []);

  const handleSelectLocation = (locationId: number, locationName: string) => {
    // Navigate to drop-point customer information form (Stage 1)
    const locationSlug = locationName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    router.push(`/drop-point/${locationSlug}/order?id=${locationId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <div className="w-full max-w-5xl mx-auto px-4 py-8">
        
        {/* Header */}
        <div className="text-center mb-10">
            <h1 className="text-4xl font-bold text-gray-900 mb-3 tracking-tight">Drop-Point Cleaning</h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Premium shoe cleaning services at your convenience. Select a location below to get started.
            </p>
        </div>

        {/* Locations Grid */}
        <div className="grid gap-6 md:grid-cols-2 mb-12">
            {isLoading ? (
                 <div className="col-span-full flex justify-center py-20">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                 </div>
            ) : dropPointLocations.length === 0 ? (
                <div className="col-span-full text-center py-16 bg-white rounded-2xl shadow-sm border border-gray-100">
                    <Package className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                    <h3 className="text-xl font-medium text-gray-900">No Locations Found</h3>
                    <p className="text-gray-500 mt-2">We are currently expanding our network.</p>
                </div>
            ) : (
                dropPointLocations.map((location) => (
                    <div
                        key={location.id}
                        onClick={() => location.is_available && handleSelectLocation(location.id, location.name)}
                        className={`group relative bg-white rounded-2xl p-6 shadow-sm border border-gray-100 transition-all duration-300 
                            ${location.is_available 
                                ? 'hover:shadow-md hover:border-blue-200 cursor-pointer' 
                                : 'opacity-75 cursor-not-allowed bg-gray-50'
                            }`}
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                                    {location.name}
                                </h3>
                                <div className="flex items-center text-gray-500 mt-1 text-sm">
                                    <MapPin className="h-4 w-4 mr-1" />
                                    {location.address}
                                </div>
                            </div>
                            <Badge 
                                className={`px-3 py-1 rounded-full font-medium ${
                                    location.is_available 
                                    ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                                    : 'bg-red-100 text-red-700 hover:bg-red-200'
                                }`}
                            >
                                {location.is_available ? 'Open' : 'Full'}
                            </Badge>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mt-6">
                            <div className="bg-gray-50 rounded-xl p-3">
                                <div className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">Available Slots</div>
                                <div className="text-2xl font-bold text-gray-900 flex items-baseline gap-1">
                                    {location.available_capacity}
                                    <span className="text-sm text-gray-400 font-normal">/ {location.max_capacity}</span>
                                </div>
                            </div>
                            <div className="bg-gray-50 rounded-xl p-3">
                                <div className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">Demand</div>
                                <div className={`text-lg font-bold ${
                                    location.available_capacity < 10 ? 'text-orange-500' : 'text-blue-500'
                                }`}>
                                     {location.available_capacity > 20 ? 'Normal' : location.available_capacity > 0 ? 'High' : 'Maxed'}
                                </div>
                            </div>
                        </div>

                        {location.is_available && (
                             <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-2 group-hover:translate-x-0">
                                <div className="bg-blue-600 text-white p-2 rounded-full shadow-lg">
                                    <ArrowRight className="h-5 w-5" />
                                </div>
                             </div>
                        )}
                    </div>
                ))
            )}
        </div>

        {/* Info Cards */}
        <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                    <Package className="h-5 w-5 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Smart Drop-Off</h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                    Book a slot, drop your shoes, and track progress instantly via our digital system.
                </p>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mb-4">
                    <Users className="h-5 w-5 text-green-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Expert Care</h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                    Professional cleaning including special treatments for white shoes and delicate materials.
                </p>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                    <Clock className="h-5 w-5 text-purple-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Quick Turnaround</h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                    Get notified as soon as your shoes are ready for pickup at your chosen location.
                </p>
            </div>
        </div>
      </div>
    </div>
  );
}