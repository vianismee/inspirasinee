"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { ColumnDef } from "@tanstack/react-table";
import {
  MoreHorizontal,
  Pencil,
  PlusCircle,
  Trash2,
  Flame,
  Percent,
  Cake,
  Gift,
  Crown,
  Settings,
} from "lucide-react";
import { formatedCurrency } from "@/lib/utils";

import { useDataTable } from "@/hooks/use-data-table";
import { DataTable } from "../data-table/data-table";
import { DataTableToolbar } from "../data-table/data-table-toolbar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../ui/tabs";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Badge } from "../ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Separator } from "../ui/separator";
import { MembershipService, AdminReferralService } from "@/lib/client-services";
import type {
  MembershipLevel,
  MembershipBenefit,
  MembershipLevelWithBenefits,
} from "@/types/membership";
import { toast } from "sonner";
import { MEMBERSHIP_LEVEL_COLORS, MEMBERSHIP_ICON_NAMES } from "@/types/membership";

// Icon mapping for display
const ICON_COMPONENTS: Record<string, React.ElementType> = {
  Flame,
  Percent,
  Cake,
  Gift,
  Crown,
};

function getIconComponent(iconName: string) {
  return ICON_COMPONENTS[iconName] || Flame;
}

type MembershipLevelWithBenefitsAndRow = MembershipLevelWithBenefits & {
  benefits?: MembershipBenefit[];
};

export function MembershipTable() {
  const [isMounted, setIsMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<"levels" | "benefits" | "shine-points">("levels");
  const [selectedLevelFilter, setSelectedLevelFilter] = useState<string>("all");

  // Shine Points Settings state
  const [shinePointsSettings, setShinePointsSettings] = useState({
    shine_points_redemption_minimum: 50,
    shine_points_redemption_value: 1000,
  });
  const [savingShinePointsSettings, setSavingShinePointsSettings] = useState(false);

  // Level management state
  const [levels, setLevels] = useState<MembershipLevelWithBenefitsAndRow[]>([]);
  const [isLevelFormOpen, setIsLevelFormOpen] = useState(false);
  const [editingLevel, setEditingLevel] = useState<MembershipLevel | null>(null);

  // Benefit management state
  const [benefits, setBenefits] = useState<MembershipBenefit[]>([]);
  const [isBenefitFormOpen, setIsBenefitFormOpen] = useState(false);
  const [editingBenefit, setEditingBenefit] = useState<MembershipBenefit | null>(null);

  // Form state
  const [levelForm, setLevelForm] = useState({
    points_per_transaction: 1,
    discount_percent: 0,
    discount_max_amount: 0,
    transaction_threshold: 0,
    is_active: true,
  });

  const [benefitForm, setBenefitForm] = useState({
    membership_level_id: 0,
    icon_name: "Flame",
    title: "",
    description: "",
    display_order: 0,
  });

  // Fetch data
  const fetchLevels = useCallback(async () => {
    const data = await MembershipService.getMembershipLevelsWithBenefits();
    setLevels(data);
  }, []);

  const fetchBenefits = useCallback(async (levelId?: number) => {
    const data = await MembershipService.getMembershipBenefits(levelId);
    setBenefits(data);
  }, []);

  useEffect(() => {
    fetchLevels();
    fetchBenefits();
    fetchShinePointsSettings();
    setIsMounted(true);
  }, [fetchLevels, fetchBenefits]);

  // Fetch Shine Points Settings
  const fetchShinePointsSettings = useCallback(async () => {
    try {
      const settings = await AdminReferralService.getReferralSettings();
      setShinePointsSettings({
        shine_points_redemption_minimum: settings.shine_points_redemption_minimum || 50,
        shine_points_redemption_value: settings.shine_points_redemption_value || 1000,
      });
    } catch (error) {
      console.error("Error fetching shine points settings:", error);
    }
  }, []);

  // Handle Shine Points Settings change
  const handleShinePointsSettingsChange = (field: string, value: number) => {
    setShinePointsSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Save Shine Points Settings
  const handleSaveShinePointsSettings = async () => {
    setSavingShinePointsSettings(true);
    try {
      const result = await AdminReferralService.updateReferralSettings(shinePointsSettings);
      if (result) {
        toast.success("Shine Points settings updated successfully");
      } else {
        toast.error("Failed to update settings");
      }
    } catch (error) {
      console.error("Error updating settings:", error);
      toast.error("Failed to update shine points settings");
    } finally {
      setSavingShinePointsSettings(false);
    }
  };

  // Level columns
  const levelColumns = useMemo<ColumnDef<MembershipLevelWithBenefitsAndRow>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Level",
        cell: ({ row }) => {
          const level = row.original;
          const colors = MEMBERSHIP_LEVEL_COLORS[level.name as keyof typeof MEMBERSHIP_LEVEL_COLORS];
          return (
            <div className="flex items-center gap-2">
              <Badge className={`${colors.bg} ${colors.primary} border-0`}>
                {level.name}
              </Badge>
              {!level.is_active && (
                <Badge variant="secondary" className="text-gray-500">
                  Inactive
                </Badge>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "points_per_transaction",
        header: "Points Per Transaction",
        cell: ({ row }) => (
          <span>{row.original.points_per_transaction} pt</span>
        ),
      },
      {
        accessorKey: "discount_percent",
        header: "Discount %",
        cell: ({ row }) => (
          <span>{row.original.discount_percent}%</span>
        ),
      },
      {
        accessorKey: "discount_max_amount",
        header: "Max Discount",
        cell: ({ row }) => (
          <span>{formatedCurrency(row.original.discount_max_amount)}</span>
        ),
      },
      {
        accessorKey: "transaction_threshold",
        header: "Transactions Needed",
        cell: ({ row }) => (
          <span>{row.original.transaction_threshold}</span>
        ),
      },
      {
        accessorKey: "benefits",
        header: "Benefits",
        cell: ({ row }) => {
          const benefits = row.original.benefits || [];
          return (
            <span className="text-sm text-gray-600">
              {benefits.length} benefit{benefits.length !== 1 ? "s" : ""}
            </span>
          );
        },
      },
      {
        id: "actions",
        cell: ({ row }) => {
          const level = row.original;
          return (
            <div className="text-right">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 p-0">
                    <span className="sr-only">Open menu</span>
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                  <DropdownMenuItem
                    onClick={() => {
                      setEditingLevel(level);
                      setLevelForm({
                        points_per_transaction: level.points_per_transaction || 1,
                        discount_percent: level.discount_percent,
                        discount_max_amount: level.discount_max_amount,
                        transaction_threshold: level.transaction_threshold,
                        is_active: level.is_active,
                      });
                      setIsLevelFormOpen(true);
                    }}
                  >
                    <Pencil className="mr-2 h-4 w-4" /> Edit
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
      },
    ],
    []
  );

  // Benefit columns
  const benefitColumns = useMemo<ColumnDef<MembershipBenefit>[]>(
    () => [
      {
        id: "icon",
        header: "Icon",
        cell: ({ row }) => {
          const benefit = row.original;
          const IconComponent = getIconComponent(benefit.icon_name);
          return <IconComponent className="h-5 w-5" />;
        },
      },
      {
        accessorKey: "title",
        header: "Title",
      },
      {
        accessorKey: "description",
        header: "Description",
        cell: ({ row }) => (
          <span className="text-sm text-gray-600 max-w-xs truncate block">
            {row.original.description || "-"}
          </span>
        ),
      },
      {
        accessorKey: "membership_level_id",
        header: "Level",
        cell: ({ row }) => {
          const level = levels.find((l) => l.id === row.original.membership_level_id);
          if (!level) return <span>-</span>;
          const colors = MEMBERSHIP_LEVEL_COLORS[level.name as keyof typeof MEMBERSHIP_LEVEL_COLORS];
          return (
            <Badge className={`${colors.bg} ${colors.primary} border-0`}>
              {level.name}
            </Badge>
          );
        },
      },
      {
        accessorKey: "display_order",
        header: "Order",
        cell: ({ row }) => (
          <span className="text-sm text-gray-600">
            {row.original.display_order}
          </span>
        ),
      },
      {
        id: "actions",
        cell: ({ row }) => {
          const benefit = row.original;
          return (
            <div className="text-right">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 p-0">
                    <span className="sr-only">Open menu</span>
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                  <DropdownMenuItem
                    onClick={() => {
                      setEditingBenefit(benefit);
                      setBenefitForm({
                        membership_level_id: benefit.membership_level_id,
                        icon_name: benefit.icon_name,
                        title: benefit.title,
                        description: benefit.description || "",
                        display_order: benefit.display_order,
                      });
                      setSelectedLevelFilter(benefit.membership_level_id.toString());
                      setIsBenefitFormOpen(true);
                    }}
                  >
                    <Pencil className="mr-2 h-4 w-4" /> Edit
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-red-600"
                    onClick={async () => {
                      const confirmed = window.confirm("Are you sure you want to delete this benefit?");
                      if (confirmed) {
                        const success = await MembershipService.deleteBenefit(benefit.id);
                        if (success) {
                          toast.success("Benefit deleted successfully");
                          fetchBenefits(selectedLevelFilter === "all" ? undefined : parseInt(selectedLevelFilter));
                        } else {
                          toast.error("Failed to delete benefit");
                        }
                      }
                    }}
                  >
                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
      },
    ],
    [levels, selectedLevelFilter, fetchBenefits]
  );

  // Table handlers
  const levelsTable = useDataTable({
    data: levels,
    columns: levelColumns,
    pageCount: -1,
  });

  const benefitsTable = useDataTable({
    data: benefits,
    columns: benefitColumns,
    pageCount: -1,
  });

  // Form handlers
  const handleLevelDialogChange = (open: boolean) => {
    setIsLevelFormOpen(open);
    if (!open) {
      setEditingLevel(null);
      setLevelForm({
        points_per_transaction: 1,
        discount_percent: 0,
        discount_max_amount: 0,
        transaction_threshold: 0,
        is_active: true,
      });
    }
  };

  const handleBenefitDialogChange = (open: boolean) => {
    setIsBenefitFormOpen(open);
    if (!open) {
      setEditingBenefit(null);
      setBenefitForm({
        membership_level_id: 0,
        icon_name: "Flame",
        title: "",
        description: "",
        display_order: 0,
      });
    }
  };

  const handleLevelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLevel) return;

    const success = await MembershipService.updateMembershipLevel(editingLevel.id, levelForm);
    if (success) {
      toast.success("Level updated successfully");
      await fetchLevels();
      handleLevelDialogChange(false);
    } else {
      toast.error("Failed to update level");
    }
  };

  const handleBenefitSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingBenefit) {
      // Update existing benefit
      const success = await MembershipService.updateBenefit(editingBenefit.id, benefitForm);
      if (success) {
        toast.success("Benefit updated successfully");
        await fetchBenefits(selectedLevelFilter === "all" ? undefined : parseInt(selectedLevelFilter));
        await fetchLevels();
        handleBenefitDialogChange(false);
      } else {
        toast.error("Failed to update benefit");
      }
    } else {
      // Create new benefit
      const success = await MembershipService.createBenefit(benefitForm);
      if (success) {
        toast.success("Benefit created successfully");
        await fetchBenefits(selectedLevelFilter === "all" ? undefined : parseInt(selectedLevelFilter));
        await fetchLevels();
        handleBenefitDialogChange(false);
      } else {
        toast.error("Failed to create benefit");
      }
    }
  };

  // Handle level filter change for benefits
  const handleLevelFilterChange = (value: string) => {
    setSelectedLevelFilter(value);
    if (value === "all") {
      fetchBenefits();
    } else {
      fetchBenefits(parseInt(value));
    }
  };

  if (!isMounted) {
    return null;
  }

  return (
    <>
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "levels" | "benefits" | "shine-points")} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="levels">Level Configuration</TabsTrigger>
          <TabsTrigger value="benefits">Benefits Management</TabsTrigger>
          <TabsTrigger value="shine-points">Shine Points Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="levels">
          <Dialog open={isLevelFormOpen} onOpenChange={handleLevelDialogChange}>
            <DataTable table={levelsTable.table}>
              <DataTableToolbar table={levelsTable.table}>
                <div className="text-sm text-gray-600">
                  Configure points multiplier, discount rules, and transaction thresholds for each membership tier.
                </div>
              </DataTableToolbar>
            </DataTable>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Edit {editingLevel?.name} Level</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleLevelSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="points_per_transaction">Points Per Transaction</Label>
                    <Input
                      id="points_per_transaction"
                      type="number"
                      step="1"
                      min="1"
                      value={levelForm.points_per_transaction}
                      onChange={(e) => setLevelForm({ ...levelForm, points_per_transaction: parseInt(e.target.value) || 1 })}
                      required
                    />
                    <p className="text-xs text-gray-500">Points earned for each transaction (e.g., 1, 2, 3)</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="discount_percent">Discount Percent (%)</Label>
                    <Input
                      id="discount_percent"
                      type="number"
                      min="0"
                      max="100"
                      value={levelForm.discount_percent}
                      onChange={(e) => setLevelForm({ ...levelForm, discount_percent: parseInt(e.target.value) || 0 })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="discount_max_amount">Max Discount (Rp)</Label>
                    <Input
                      id="discount_max_amount"
                      type="number"
                      min="0"
                      value={levelForm.discount_max_amount}
                      onChange={(e) => setLevelForm({ ...levelForm, discount_max_amount: parseInt(e.target.value) || 0 })}
                      required
                    />
                    <p className="text-xs text-gray-500">Hard limit for discount</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="transaction_threshold">Transactions to Reach</Label>
                    <Input
                      id="transaction_threshold"
                      type="number"
                      min="0"
                      value={levelForm.transaction_threshold}
                      onChange={(e) => setLevelForm({ ...levelForm, transaction_threshold: parseInt(e.target.value) || 0 })}
                      required
                    />
                    <p className="text-xs text-gray-500">Orders needed for this level</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={levelForm.is_active}
                    onChange={(e) => setLevelForm({ ...levelForm, is_active: e.target.checked })}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="is_active">Active</Label>
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => handleLevelDialogChange(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Save Changes</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="benefits">
          <Dialog open={isBenefitFormOpen} onOpenChange={handleBenefitDialogChange}>
            <DataTable table={benefitsTable.table}>
              <DataTableToolbar table={benefitsTable.table}>
                <div className="flex items-center gap-4">
                  <Select value={selectedLevelFilter} onValueChange={handleLevelFilterChange}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter by level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Levels</SelectItem>
                      {levels.map((level) => (
                        <SelectItem key={level.id} value={level.id.toString()}>
                          {level.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <DialogTrigger asChild>
                    <Button onClick={() => setIsBenefitFormOpen(true)}>
                      <PlusCircle className="mr-2 h-4 w-4" /> Add Benefit
                    </Button>
                  </DialogTrigger>
                </div>
              </DataTableToolbar>
            </DataTable>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>{editingBenefit ? "Edit Benefit" : "Add New Benefit"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleBenefitSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="membership_level_id">Membership Level</Label>
                  <Select
                    value={benefitForm.membership_level_id.toString()}
                    onValueChange={(v) => setBenefitForm({ ...benefitForm, membership_level_id: parseInt(v) })}
                  >
                    <SelectTrigger id="membership_level_id">
                      <SelectValue placeholder="Select level" />
                    </SelectTrigger>
                    <SelectContent>
                      {levels.map((level) => (
                        <SelectItem key={level.id} value={level.id.toString()}>
                          {level.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="icon_name">Icon</Label>
                  <Select
                    value={benefitForm.icon_name}
                    onValueChange={(v) => setBenefitForm({ ...benefitForm, icon_name: v })}
                  >
                    <SelectTrigger id="icon_name">
                      <SelectValue placeholder="Select icon" />
                    </SelectTrigger>
                    <SelectContent>
                      {MEMBERSHIP_ICON_NAMES.map((icon) => {
                        const IconComponent = getIconComponent(icon);
                        return (
                          <SelectItem key={icon} value={icon}>
                            <div className="flex items-center gap-2">
                              <IconComponent className="h-4 w-4" />
                              {icon}
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={benefitForm.title}
                    onChange={(e) => setBenefitForm({ ...benefitForm, title: e.target.value })}
                    placeholder="e.g., Priority Service"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={benefitForm.description}
                    onChange={(e) => setBenefitForm({ ...benefitForm, description: e.target.value })}
                    placeholder="e.g., Get served faster"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="display_order">Display Order</Label>
                  <Input
                    id="display_order"
                    type="number"
                    min="0"
                    value={benefitForm.display_order}
                    onChange={(e) => setBenefitForm({ ...benefitForm, display_order: parseInt(e.target.value) || 0 })}
                  />
                  <p className="text-xs text-gray-500">Lower numbers appear first</p>
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => handleBenefitDialogChange(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">{editingBenefit ? "Update" : "Create"} Benefit</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="shine-points">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Flame className="h-5 w-5 text-purple-600" />
                Shine Points Settings
              </CardTitle>
              <CardDescription>
                Configure the redemption rate and minimum requirements for Shine Points (Membership Points)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={(e) => { e.preventDefault(); handleSaveShinePointsSettings(); }} className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="shine_points_redemption_minimum">
                      Minimum Shine Points to Redeem
                    </Label>
                    <Input
                      id="shine_points_redemption_minimum"
                      type="number"
                      min="1"
                      value={shinePointsSettings.shine_points_redemption_minimum}
                      onChange={(e) => handleShinePointsSettingsChange("shine_points_redemption_minimum", parseInt(e.target.value) || 0)}
                    />
                    <p className="text-sm text-muted-foreground">
                      Minimum shine points required for redemption
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="shine_points_redemption_value">
                      Shine Point Redemption Value (Rp)
                    </Label>
                    <Input
                      id="shine_points_redemption_value"
                      type="number"
                      min="1"
                      value={shinePointsSettings.shine_points_redemption_value}
                      onChange={(e) => handleShinePointsSettingsChange("shine_points_redemption_value", parseInt(e.target.value) || 0)}
                    />
                    <p className="text-sm text-muted-foreground">
                      Discount amount per shine point redeemed
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="rounded-md border border-purple-200 bg-purple-50 p-4">
                  <p className="text-sm font-medium text-purple-900 mb-2">Preview</p>
                  <p className="text-sm text-purple-700">
                    Customers will need at least <span className="font-bold">{shinePointsSettings.shine_points_redemption_minimum}</span> shine points to redeem.
                  </p>
                  <p className="text-sm text-purple-700">
                    Each shine point will be worth <span className="font-bold">{formatedCurrency(shinePointsSettings.shine_points_redemption_value)}</span> in discount.
                  </p>
                  <p className="text-xs text-purple-600 mt-2">
                    Example: 100 shine points = {formatedCurrency(100 * shinePointsSettings.shine_points_redemption_value)} discount
                  </p>
                </div>

                <div className="flex justify-end">
                  <Button type="submit" disabled={savingShinePointsSettings}>
                    {savingShinePointsSettings ? "Saving..." : "Save Settings"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  );
}
