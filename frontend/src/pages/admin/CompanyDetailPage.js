import React, { useMemo } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { Box, Tabs, Tab, Typography } from "@mui/material";
import { AdminLayout } from "../../components/layouts/AdminLayout";

// existing tabs you already have can remain
import { CompanyBranchesTab } from "./tabs/CompanyBranchesTab";
import { CompanyCourtsTab } from "./tabs/CompanyCourtsTab";
import { CompanyPricingRulesTab } from "./tabs/CompanyPricingRulesTab";
import { CompanyTrainersTab } from "./tabs/CompanyTrainersTab";
import { CompanyClassesTab } from "./tabs/CompanyClassesTab";
import { CompanyBookingsTab } from "./tabs/CompanyBookingsTab";
import { CompanyTrainerBookingsTab } from "./tabs/CompanyTrainerBookingsTab";

const TAB_KEYS = [
  { key: "branches", label: "Branches" },
  { key: "courts", label: "Courts" },
  { key: "pricing", label: "Price Matrix" },
  { key: "trainers", label: "Trainers" },
  { key: "classes", label: "Classes" },
  { key: "bookings", label: "Bookings" },
  { key: "trainer-bookings", label: "Trainer Bookings" },
];

const DEFAULT_TAB = "branches";

export const CompanyDetailPage = () => {
  const { id: companyId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();

  const rawTab = searchParams.get("tab") || DEFAULT_TAB;

  const activeKey = useMemo(() => {
    const valid = TAB_KEYS.some((t) => t.key === rawTab);
    return valid ? rawTab : DEFAULT_TAB;
  }, [rawTab]);

  const activeIndex = useMemo(() => {
    const idx = TAB_KEYS.findIndex((t) => t.key === activeKey);
    return idx >= 0 ? idx : 0;
  }, [activeKey]);

  const handleChange = (_, newIndex) => {
    setSearchParams({ tab: TAB_KEYS[newIndex].key });
  };

  if (!companyId) {
    return (
      <AdminLayout>
        <Typography color="error">Missing company id</Typography>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <Box sx={{ mb: 2 }}>
        <Typography variant="h4" sx={{ fontWeight: 900 }}>
          Company Console
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Manage branches, courts, pricing, trainers, classes & bookings
        </Typography>
      </Box>

      <Tabs
        value={activeIndex}
        onChange={handleChange}
        variant="scrollable"
        scrollButtons="auto"
        sx={{ mb: 2 }}
      >
        {TAB_KEYS.map((t) => (
          <Tab key={t.key} label={t.label} />
        ))}
      </Tabs>

      {activeKey === "branches" && <CompanyBranchesTab companyId={companyId} />}
      {activeKey === "courts" && <CompanyCourtsTab companyId={companyId} />}
      {activeKey === "pricing" && <CompanyPricingRulesTab companyId={companyId} />}
      {activeKey === "trainers" && <CompanyTrainersTab companyId={companyId} />}
      {activeKey === "classes" && <CompanyClassesTab companyId={companyId} />}
      {activeKey === "bookings" && <CompanyBookingsTab companyId={companyId} />}
      {activeKey === "trainer-bookings" && (
        <CompanyTrainerBookingsTab companyId={companyId} />
      )}
    </AdminLayout>
  );
};
