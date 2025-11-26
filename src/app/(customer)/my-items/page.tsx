"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatedCurrency } from "@/lib/utils";
import { Package, Search, CheckCircle, User, ArrowLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { getDropPointDataCookie } from "@/lib/cookieUtils";

interface CookieItemData {
  code: string;
  shoeName: string;
  color: string;
  size: string;
  services: Array<{ name: string; amount: number }>;
  totalPrice: number;
}

interface DropPointCookieData {
  customerName: string;
  customerPhone: string;
  items: CookieItemData[];
  subtotal: number;
  total: number;
  verificationCode: string;
}

export default function MyItemsPage() {
  const router = useRouter();
  const [searchCode, setSearchCode] = useState("");
  const [dropPointData, setDropPointData] = useState<DropPointCookieData | null>(null);
  const [foundItem, setFoundItem] = useState<CookieItemData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const data = getDropPointDataCookie();
    setDropPointData(data);
    setIsLoading(false);
  }, []);

  const handleSearch = () => {
    if (!dropPointData || !searchCode.trim()) {
      setFoundItem(null);
      return;
    }

    const item = dropPointData.items.find(item =>
      item.code.toLowerCase() === searchCode.trim().toLowerCase()
    );

    setFoundItem(item || null);
  };

  const handleClearData = () => {
    if (typeof window !== 'undefined') {
      document.cookie = 'dropPointData=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; sameSite=lax';
      setDropPointData(null);
      setFoundItem(null);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <div className="w-full max-w-4xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="ghost"
              onClick={() => router.push('/')}
              className="text-gray-600"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Items</h1>
          <p className="text-gray-500">Check the status and collection codes for your dropped items</p>
        </div>

        {/* Customer Information Card */}
        {dropPointData && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Customer Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-500 mb-1">Name</div>
                  <div className="font-medium text-gray-900">{dropPointData.customerName}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 mb-1">Phone</div>
                  <div className="font-medium text-gray-900">{dropPointData.customerPhone}</div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <div className="text-sm text-gray-500 mb-1">Verification Code</div>
                  <div className="font-mono font-bold text-lg text-blue-600">{dropPointData.verificationCode}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 mb-1">Total Amount</div>
                  <div className="font-bold text-lg text-gray-900">{formatedCurrency(dropPointData.total)}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search by Collection Code */}
        {dropPointData && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Search by Collection Code
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Enter collection code (e.g., A1, A2, A3)"
                  value={searchCode}
                  onChange={(e) => setSearchCode(e.target.value.toUpperCase())}
                  className="flex-1"
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Button onClick={handleSearch}>
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </Button>
              </div>

              {foundItem && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="font-bold text-green-800">Item Found</span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium">Collection Code:</span>
                      <span className="ml-2 font-mono font-bold text-blue-600">{foundItem.code}</span>
                    </div>
                    <div>
                      <span className="font-medium">Shoe:</span>
                      <span className="ml-2">{foundItem.shoeName}</span>
                    </div>
                    <div>
                      <span className="font-medium">Size:</span>
                      <span className="ml-2">{foundItem.size}</span>
                    </div>
                    <div>
                      <span className="font-medium">Color:</span>
                      <span className="ml-2 capitalize">{foundItem.color}</span>
                    </div>
                    {foundItem.services.length > 0 && (
                      <div>
                        <span className="font-medium">Services:</span>
                        <div className="flex gap-1 flex-wrap mt-1">
                          {foundItem.services.map((service, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {service.name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    <div>
                      <span className="font-medium">Price:</span>
                      <span className="ml-2">{formatedCurrency(foundItem.totalPrice)}</span>
                    </div>
                  </div>
                </div>
              )}

              {searchCode && !foundItem && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="text-red-800 text-sm">
                    No item found with collection code &quot;{searchCode}&quot;
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* All Items List */}
        {dropPointData && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                All Your Items ({dropPointData.items.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dropPointData.items.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="font-bold text-blue-600">{item.code}</span>
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">{item.shoeName}</h3>
                          <p className="text-sm text-gray-500">
                            Size: {item.size} • Color: {item.color}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-1 flex-wrap">
                        {item.services.map((service, serviceIndex) => (
                          <Badge key={serviceIndex} variant="outline" className="text-xs">
                            {service.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-gray-900">{formatedCurrency(item.totalPrice)}</div>
                      <div className="text-sm text-gray-500">Item {index + 1}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-gray-900">Total</span>
                  <span className="text-xl font-bold text-blue-600">{formatedCurrency(dropPointData.total)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* No Data Message */}
        {!dropPointData && (
          <Card>
            <CardContent className="pt-6 pb-6 text-center">
              <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Items Found</h3>
              <p className="text-gray-500 mb-6">
                You don&apos;t have any items in our system. Please complete your order first.
              </p>
              <Button onClick={() => router.push('/drop-point')}>
                Start New Order
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Clear Data Button */}
        {dropPointData && (
          <div className="mt-6 text-center">
            <Button
              variant="ghost"
              onClick={handleClearData}
              className="text-gray-500 hover:text-red-600"
            >
              Clear My Items Data
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}