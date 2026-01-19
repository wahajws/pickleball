import React, { useEffect, useMemo, useState } from "react";
import { Box, Paper, Typography, Stack, FormControl, InputLabel, Select, MenuItem, Dialog, DialogTitle, DialogContent, Chip } from "@mui/material";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";

import { AdminLayout } from "../../components/layouts/AdminLayout";
import { adminFetch } from "./tabs/_adminApi"; // ✅ use your adminFetch
import { API_ENDPOINTS } from "../../config/api";

export default function BookingsCalendarPage() {
  const [loading, setLoading] = useState(false);
  const [bookings, setBookings] = useState([]);
  const [branchId, setBranchId] = useState("all");
  const [status, setStatus] = useState("all");

  const [open, setOpen] = useState(false);
  const [activeBooking, setActiveBooking] = useState(null);

  const loadBookings = async () => {
    setLoading(true);
    try {
      // ✅ you can replace this endpoint based on your backend:
      // Example: /admin/platform/bookings (developer console endpoint)
      const res = await adminFetch("/admin/platform/bookings");
      const list = res?.data?.data || res?.data || res || [];
      setBookings(Array.isArray(list) ? list : []);
    } catch (e) {
      console.log("Failed to load bookings", e);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, []);

  // ✅ Convert DB bookings -> FullCalendar events
  const events = useMemo(() => {
    return bookings
      .filter((b) => (branchId === "all" ? true : b.branch_id === branchId))
      .filter((b) => (status === "all" ? true : b.booking_status === status))
      .map((b) => {
        const start = b.start_datetime || b.start || b.booking_start || b.created_at;
        const end = b.end_datetime || b.end || b.booking_end || b.created_at;

        return {
          id: b.id,
          title: b.booking_number ? `#${b.booking_number}` : "Booking",
          start,
          end,
          extendedProps: b,
        };
      });
  }, [bookings, branchId, status]);

  const handleEventClick = (info) => {
    setActiveBooking(info.event.extendedProps);
    setOpen(true);
  };

  return (
    <AdminLayout>
      <Box sx={{ p: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 900, mb: 2 }}>
          Booking Calendar
        </Typography>

        {/* Filters */}
        <Paper sx={{ p: 2, mb: 2 }}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <FormControl fullWidth>
              <InputLabel>Branch</InputLabel>
              <Select
                value={branchId}
                label="Branch"
                onChange={(e) => setBranchId(e.target.value)}
              >
                <MenuItem value="all">All</MenuItem>
                {/* ✅ If you already have branches list, map it here */}
                {/* <MenuItem value="branch-uuid">KL Branch</MenuItem> */}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={status}
                label="Status"
                onChange={(e) => setStatus(e.target.value)}
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="confirmed">Confirmed</MenuItem>
                <MenuItem value="cancelled">Cancelled</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
                <MenuItem value="no_show">No Show</MenuItem>
                <MenuItem value="expired">Expired</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </Paper>

        {/* Calendar */}
        <Paper sx={{ p: 2 }}>
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="timeGridWeek"
            headerToolbar={{
              left: "prev,next today",
              center: "title",
              right: "dayGridMonth,timeGridWeek,timeGridDay",
            }}
            height="75vh"
            events={events}
            eventClick={handleEventClick}
            nowIndicator
            selectable
          />
        </Paper>

        {/* Booking Detail Dialog */}
        <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ fontWeight: 900 }}>Booking Details</DialogTitle>
          <DialogContent dividers>
            {activeBooking ? (
              <Stack spacing={1.5}>
                <Typography><b>ID:</b> {activeBooking.id}</Typography>
                <Typography><b>Booking No:</b> {activeBooking.booking_number || "-"}</Typography>
                <Typography><b>Status:</b> <Chip size="small" label={activeBooking.booking_status || "-"} /></Typography>
                <Typography><b>Branch:</b> {activeBooking.branch_id || "-"}</Typography>
                <Typography><b>Company:</b> {activeBooking.company_id || "-"}</Typography>
                <Typography><b>User:</b> {activeBooking.user_id || "-"}</Typography>
                <Typography><b>Start:</b> {activeBooking.start_datetime || "-"}</Typography>
                <Typography><b>End:</b> {activeBooking.end_datetime || "-"}</Typography>
              </Stack>
            ) : (
              <Typography>No booking selected</Typography>
            )}
          </DialogContent>
        </Dialog>
      </Box>
    </AdminLayout>
  );
}
