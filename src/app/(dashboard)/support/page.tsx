'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  HelpCircle,
  Plus,
  MessageSquare,
  Clock,
  CheckCircle2,
  AlertCircle,
  Send,
  X,
  FileText,
  User,
  Shield,
  ChevronRight,
  ArrowLeft,
  Calendar,
  Filter,
} from 'lucide-react';
import {
  SectionCard,
  Badge,
  TableWrapper,
  TableHeaderCell,
  TableCell,
  TableRow,
  EmptyState,
  LoadingSpinner,
} from '@/components/ui/primitives';
import {
  fetchSupportTickets,
  fetchSupportTicketDetail,
  createSupportTicket,
  addSupportTicketMessage,
} from '@/lib/api';
import { QUERY_KEYS } from '@/lib/query-keys';
import type { SupportTicket, SupportTicketMessage } from '@/types';

export default function SupportPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedTicketNumber, setSelectedTicketNumber] = useState<string | null>(null);
  const [newMessageText, setNewMessageText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const [formData, setFormData] = useState({
    category: 'Telemetry & Device',
    subject: '',
    description: '',
    priority: 'Medium',
  });

  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(
    null
  );

  const queryClient = useQueryClient();

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg(null), 4000);
  };

  // Query: Tickets List
  const { data: tickets = [], isLoading: isTicketsLoading } = useQuery<SupportTicket[]>({
    queryKey: QUERY_KEYS.supportTickets(),
    queryFn: () => fetchSupportTickets(),
  });

  // Query: Selected Ticket Detail
  const {
    data: selectedTicket,
    isLoading: isTicketDetailLoading,
  } = useQuery<SupportTicket>({
    queryKey: QUERY_KEYS.supportTicket(selectedTicketNumber || ''),
    queryFn: () => fetchSupportTicketDetail(selectedTicketNumber!),
    enabled: !!selectedTicketNumber,
  });

  // Mutation: Create Ticket
  const createTicketMutation = useMutation({
    mutationFn: createSupportTicket,
    onSuccess: (newTicket) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.supportTickets() });
      setIsCreateModalOpen(false);
      setFormData({
        category: 'Telemetry & Device',
        subject: '',
        description: '',
        priority: 'Medium',
      });
      showToast('Support ticket created successfully');
      if (newTicket?.ticket_number || newTicket?.ticketNumber) {
        setSelectedTicketNumber(newTicket.ticket_number || newTicket.ticketNumber || null);
      }
    },
    onError: () => {
      showToast('Failed to create support ticket. Please try again.', 'error');
    },
  });

  // Mutation: Add Message
  const addMessageMutation = useMutation({
    mutationFn: ({
      ticketNumber,
      message,
    }: {
      ticketNumber: string;
      message: string;
    }) => addSupportTicketMessage(ticketNumber, { message }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.supportTicket(selectedTicketNumber || ''),
      });
      setNewMessageText('');
      showToast('Message sent to support engineers');
    },
    onError: () => {
      showToast('Failed to send message', 'error');
    },
  });

  const getPriorityBadge = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'urgent':
      case 'high':
        return <Badge variant="danger">{priority}</Badge>;
      case 'medium':
        return <Badge variant="warning">{priority}</Badge>;
      default:
        return <Badge variant="default">{priority || 'Low'}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'resolved':
      case 'closed':
        return (
          <Badge variant="success" className="gap-1">
            <CheckCircle2 className="h-3 w-3" />
            {status}
          </Badge>
        );
      case 'in_progress':
      case 'in progress':
        return (
          <Badge variant="info" className="gap-1">
            <Clock className="h-3 w-3" />
            In Progress
          </Badge>
        );
      default:
        return (
          <Badge variant="warning" className="gap-1">
            <AlertCircle className="h-3 w-3" />
            {status || 'Open'}
          </Badge>
        );
    }
  };

  // Filtered tickets
  const filteredTickets = tickets.filter((t) => {
    const matchesStatus =
      statusFilter === 'all' ||
      t.status?.toLowerCase() === statusFilter.toLowerCase();
    const matchesCategory =
      categoryFilter === 'all' ||
      t.category?.toLowerCase() === categoryFilter.toLowerCase();
    return matchesStatus && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Help & Technical Support
          </h1>
          <p className="text-sm text-slate-500">
            Contact DravYantra technical assistance, report hardware sensor issues, or inquire about fleet calibration.
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 transition-colors shrink-0"
        >
          <Plus className="h-4 w-4" />
          Create Ticket
        </button>
      </div>

      {/* Toast Notification */}
      {toastMsg && (
        <div
          className={`flex items-center gap-2 rounded-lg p-3 text-sm font-semibold shadow-sm transition-all ${
            toastMsg.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          {toastMsg.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          ) : (
            <AlertCircle className="h-4 w-4 text-rose-600" />
          )}
          <span>{toastMsg.text}</span>
        </div>
      )}

      {/* Support FAQ & Contact Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <MessageSquare className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900">Direct Support Line</h3>
              <p className="text-xs text-slate-500 font-mono">+91 1800 200 4567</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900">Dedicated Support SLA</h3>
              <p className="text-xs text-slate-500">24/7 Response for Critical Telemetry</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900">Email Assistance</h3>
              <p className="text-xs text-slate-500 font-mono">support@dravyantra.in</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content: Tickets View / Detail View */}
      {selectedTicketNumber ? (
        /* Ticket Conversation & Detail View */
        <div className="space-y-4">
          <button
            onClick={() => setSelectedTicketNumber(null)}
            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to all tickets
          </button>

          {isTicketDetailLoading ? (
            <div className="flex h-64 items-center justify-center">
              <LoadingSpinner size="lg" />
            </div>
          ) : !selectedTicket ? (
            <EmptyState
              icon={HelpCircle}
              title="Ticket not found"
              description="The requested ticket could not be loaded."
            />
          ) : (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* Messages / Conversation Column */}
              <div className="lg:col-span-2 space-y-4">
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
                  <div className="flex flex-col gap-2 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-blue-700 uppercase">
                          {selectedTicket.ticket_number || selectedTicket.ticketNumber}
                        </span>
                        {getStatusBadge(selectedTicket.status)}
                        {getPriorityBadge(selectedTicket.priority)}
                      </div>
                      <h2 className="text-lg font-bold text-slate-900 mt-1">
                        {selectedTicket.subject}
                      </h2>
                    </div>
                    <span className="text-xs text-slate-400">
                      {selectedTicket.created_at
                        ? new Date(selectedTicket.created_at).toLocaleString()
                        : '—'}
                    </span>
                  </div>

                  <div className="mt-4 text-xs text-slate-700 leading-relaxed bg-slate-50 p-3.5 rounded-lg border border-slate-100">
                    <p className="font-semibold text-slate-900 mb-1">Issue Description:</p>
                    {selectedTicket.description}
                  </div>

                  {/* Message Thread */}
                  <div className="mt-6 space-y-4">
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Conversation Thread
                    </h3>

                    {(!selectedTicket.messages || selectedTicket.messages.length === 0) ? (
                      <p className="text-xs text-slate-400 italic py-2">
                        No replies yet. Our technical staff will respond shortly.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {selectedTicket.messages.map((msg) => (
                          <div
                            key={msg.id}
                            className={`rounded-xl p-4 text-xs border ${
                              msg.sender_role === 'staff' || msg.sender_role === 'admin'
                                ? 'bg-blue-50/60 border-blue-200 text-slate-900'
                                : 'bg-slate-50 border-slate-200 text-slate-800'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1.5">
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-slate-900">
                                  {msg.sender_name || (msg.sender_role === 'staff' ? 'Support Agent' : 'You')}
                                </span>
                                <Badge
                                  variant={msg.sender_role === 'staff' ? 'info' : 'default'}
                                  className="text-[10px]"
                                >
                                  {msg.sender_role === 'staff' ? 'DravYantra Staff' : 'Fleet Owner'}
                                </Badge>
                              </div>
                              <span className="text-[11px] text-slate-400">
                                {msg.created_at ? new Date(msg.created_at).toLocaleTimeString() : ''}
                              </span>
                            </div>
                            <p className="leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Reply Input Box */}
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (!newMessageText.trim()) return;
                        addMessageMutation.mutate({
                          ticketNumber:
                            selectedTicket.ticket_number || selectedTicket.ticketNumber || '',
                          message: newMessageText,
                        });
                      }}
                      className="mt-4 pt-4 border-t border-slate-100"
                    >
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Add Message / Response
                      </label>
                      <div className="flex gap-2">
                        <textarea
                          rows={2}
                          placeholder="Type your message to support..."
                          value={newMessageText}
                          onChange={(e) => setNewMessageText(e.target.value)}
                          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                        <button
                          type="submit"
                          disabled={!newMessageText.trim() || addMessageMutation.isPending}
                          className="inline-flex items-center justify-center gap-1 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 transition-colors disabled:opacity-50 shrink-0 self-end"
                        >
                          <Send className="h-3.5 w-3.5" />
                          Send
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>

              {/* Sidebar Metadata Column */}
              <div className="space-y-4">
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs space-y-3">
                  <h3 className="text-xs font-bold text-slate-900 border-b border-slate-100 pb-2">
                    Ticket Metadata
                  </h3>
                  <div className="text-xs space-y-2">
                    <div>
                      <span className="text-slate-400 block">Category</span>
                      <span className="font-semibold text-slate-800">{selectedTicket.category}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Assigned Engineer</span>
                      <span className="font-semibold text-slate-800">
                        {selectedTicket.assigned_staff_name || 'Queued for Assignment'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Organization</span>
                      <span className="font-semibold text-slate-800">
                        {selectedTicket.organization_name || 'Fleet Owner'}
                      </span>
                    </div>
                    {selectedTicket.resolved_at && (
                      <div>
                        <span className="text-slate-400 block">Resolved Timestamp</span>
                        <span className="font-mono text-slate-800">
                          {new Date(selectedTicket.resolved_at).toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Tickets Table & List View */
        <SectionCard
          title="Active & Past Support Tickets"
          description="Monitor status, priority, and progress updates from our operations engineering team."
        >
          {/* Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:border-blue-500 focus:outline-none"
              >
                <option value="all">All Statuses</option>
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:border-blue-500 focus:outline-none"
              >
                <option value="all">All Categories</option>
                <option value="telemetry & device">Telemetry & Device</option>
                <option value="fuel sensor calibration">Fuel Sensor Calibration</option>
                <option value="driver app sync">Driver App Sync</option>
                <option value="billing & invoicing">Billing & Invoicing</option>
              </select>
            </div>
          </div>

          {isTicketsLoading ? (
            <div className="flex h-48 items-center justify-center">
              <LoadingSpinner size="lg" />
            </div>
          ) : filteredTickets.length === 0 ? (
            <EmptyState
              icon={HelpCircle}
              title="No support tickets found"
              description="You currently have no tickets matching your filter criteria. Click 'Create Ticket' if you require assistance."
              action={
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  Create Ticket
                </button>
              }
            />
          ) : (
            <TableWrapper>
              <thead>
                <TableRow isHeader>
                  <TableHeaderCell>Ticket #</TableHeaderCell>
                  <TableHeaderCell>Subject</TableHeaderCell>
                  <TableHeaderCell>Category</TableHeaderCell>
                  <TableHeaderCell>Priority</TableHeaderCell>
                  <TableHeaderCell>Status</TableHeaderCell>
                  <TableHeaderCell>Created Date</TableHeaderCell>
                  <TableHeaderCell>Action</TableHeaderCell>
                </TableRow>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTickets.map((ticket) => {
                  const tNumber = ticket.ticket_number || ticket.ticketNumber || String(ticket.id);
                  return (
                    <TableRow key={tNumber}>
                      <TableCell className="font-mono font-semibold text-blue-700">
                        {tNumber}
                      </TableCell>
                      <TableCell className="font-semibold text-slate-900">
                        {ticket.subject}
                        <span className="block text-xs font-normal text-slate-500 line-clamp-1">
                          {ticket.description}
                        </span>
                      </TableCell>
                      <TableCell className="text-slate-700">{ticket.category}</TableCell>
                      <TableCell>{getPriorityBadge(ticket.priority)}</TableCell>
                      <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                      <TableCell className="text-xs text-slate-500">
                        {ticket.created_at
                          ? new Date(ticket.created_at).toLocaleDateString()
                          : '—'}
                      </TableCell>
                      <TableCell>
                        <button
                          onClick={() => setSelectedTicketNumber(tNumber)}
                          className="inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-50 transition-colors"
                        >
                          View Thread
                          <ChevronRight className="h-3.5 w-3.5" />
                        </button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </tbody>
            </TableWrapper>
          )}
        </SectionCard>
      )}

      {/* Create Ticket Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Open a New Support Ticket</h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                createTicketMutation.mutate(formData);
              }}
              className="mt-4 space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Category *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="Telemetry & Device">Telemetry & Device / GPS</option>
                  <option value="Fuel Sensor Calibration">Fuel Sensor Calibration</option>
                  <option value="Driver App Sync">Driver App Sync</option>
                  <option value="Billing & Invoicing">Billing & Invoicing</option>
                  <option value="General Technical Query">General Technical Query</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Priority *
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Urgent">Urgent</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Subject *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., GPS offline on MH12-AB-1234"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Description *
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Describe the issue with specific vehicle number, error details, and observed behavior..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createTicketMutation.isPending}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  <Send className="h-3.5 w-3.5" />
                  {createTicketMutation.isPending ? 'Submitting...' : 'Submit Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
