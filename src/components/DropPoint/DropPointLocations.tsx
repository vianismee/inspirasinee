"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { MapPin, Package, Users, Clock } from "lucide-react";
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

  if (isLoading) {
    return (
      <section className="w-full flex flex-col bg-zinc-200 h-full">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-lg font-medium">Loading Drop-Point Locations...</p>
            <p className="text-sm text-gray-600">Please wait while we fetch available locations</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="w-full max-w-7xl mx-auto">
        <section className="w-full flex flex-col bg-zinc-200 h-full">
          <div className="flex-1 overflow-y-auto flex flex-col py-5 gap-4 px-6">
            {/* Header */}
            <Card>
              <CardContent className="pt-6 pb-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MapPin className="h-8 w-8 text-blue-600" />
                  </div>
                  <h1 className="text-2xl font-bold mb-2">Drop-Point Shoe Cleaning Service</h1>
                  <p className="text-gray-600 max-w-2xl mx-auto">
                    Select a convenient drop-point location to start your order.
                    We offer professional shoe cleaning with special treatments for white shoes.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Drop-Point Locations */}
            {dropPointLocations.length === 0 ? (
              <Card>
                <CardContent className="pt-12 pb-12">
                  <div className="text-center">
                    <Package className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">No Drop-Point Locations Available</h3>
                    <p className="text-gray-600 mb-6">
                      We&apos;re currently setting up more drop-point locations. Please check back later.
                    </p>
                  </div>
                  <Button onClick={() => window.location.reload()}>
                    Refresh Locations
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                <h2 className="text-xl font-semibold mb-2">Available Drop-Points</h2>
                {dropPointLocations.map((location) => (
                  <Card
                    key={location.id}
                    className={`cursor-pointer transition-all hover:shadow-lg ${
                      !location.is_available ? 'opacity-60' : 'hover:border-blue-300'
                    }`}
                    onClick={() => location.is_available && handleSelectLocation(location.id, location.name)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg mb-1">{location.name}</CardTitle>
                          <p className="text-sm text-gray-600">{location.address}</p>
                        </div>
                        <Badge
                          variant={location.is_available ? "default" : "secondary"}
                          className="ml-3"
                        >
                          {location.is_available ? "Available" : "Full"}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-blue-600" />
                          <div>
                            <div className="font-medium">{location.current_capacity}/{location.max_capacity}</div>
                            <div className="text-gray-500">Items</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-green-600" />
                          <div>
                            <div className="font-medium">{location.available_capacity}</div>
                            <div className="text-gray-500">Available</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-orange-600" />
                          <div>
                            <div className="font-medium">
                              {location.available_capacity > 20 ? 'Low' :
                               location.available_capacity > 10 ? 'Medium' :
                               location.available_capacity > 0 ? 'High' : 'Full'}
                            </div>
                            <div className="text-gray-500">Demand</div>
                          </div>
                        </div>
                      </div>
                    </CardContent>

                    {location.is_available && (
                      <div className="mt-4 flex justify-end">
                        <Button size="sm" className="w-full sm:w-auto">
                          Select This Location
                        </Button>
                      </div>
                    )}

                    {!location.is_available && (
                      <div className="mt-4">
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm">
                          <span className="font-medium text-red-800">Currently Full</span>
                          <p className="text-red-600">This location has reached maximum capacity. Please check back later or choose another location.</p>
                        </div>
                      </div>
                    )}
                  </Card>
              ))}
            </div>
            )}

            {/* Information Section */}
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold text-lg mb-3">How It Works</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-blue-600">1</span>
                    </div>
                    <div>
                      <h4 className="font-medium">Select Drop-Point Location</h4>
                      <p className="text-gray-600">Choose a convenient location near you</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-blue-600">2</span>
                    </div>
                    <div>
                      <h4 className="font-medium">Configure Your Order</h4>
                      <p className="text-gray-600">Add items with colors and sizes (max 40 items per order)</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-blue-600">3</span>
                    </div>
                    <div>
                      <h4 className="font-medium">Pay with QRIS</h4>
                      <p className="text-gray-600">Secure QRIS payment (automatic white treatment for white shoes)</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-blue-600">4</span>
                    </div>
                    <div>
                      <h4 className="font-medium">Drop & Collect</h4>
                      <p className="text-gray-600">Drop your items and collect them when ready</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Pricing Information */}
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold text-lg mb-3">Pricing</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="font-medium text-blue-900">Standard Cleaning</div>
                    <div className="text-2xl font-bold text-blue-600">Rp 35,000</div>
                    <div className="text-sm text-blue-700">per item</div>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg">
                    <div className="font-medium text-green-900">White Treatment</div>
                    <div className="text-2xl font-bold text-green-600">Rp 15,000</div>
                    <div className="text-sm text-green-700">automatically added for white shoes</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Action Button */}
            <div className="text-center py-4">
              <Button
                onClick={() => window.location.reload()}
                variant="outline"
                className="px-8"
              >
                Refresh Drop-Point Locations
              </Button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}