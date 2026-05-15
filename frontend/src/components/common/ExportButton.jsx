/**
 * ExportButton.jsx - Complete Export Functionality
 * Handles: Excel, PDF, CSV, Email downloads/sharing
 */

import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FileText, Download, Mail, ChevronDown } from 'lucide-react';

/**
 * Main Export Component
 */
export const ExportButton = ({ workspaceId, filters = {}, reportType = 'tasks' }) => {
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailData, setEmailData] = useState({
    to: '',
    subject: `${reportType} Report - ${new Date().toLocaleDateString('en-IN')}`,
    message: ''
  });

  // ========== EXCEL EXPORT ==========
  const handleExportExcel = async () => {
    setLoading(true);
    try {
      const response = await axios.post(
        `/api/workspaces/${workspaceId}/reports/export/${reportType}/excel`,
        filters,
        { responseType: 'blob' }
      );

      // Create blob and trigger download
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${reportType}_report_${Date.now()}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success('Excel downloaded successfully!');
      setIsOpen(false);
    } catch (err) {
      const message = err.response?.data?.message || 'Export failed';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  // ========== PDF EXPORT ==========
  const handleExportPDF = async () => {
    setLoading(true);
    try {
      const response = await axios.post(
        `/api/workspaces/${workspaceId}/reports/export/${reportType}/pdf`,
        filters,
        { responseType: 'blob' }
      );

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${reportType}_report_${Date.now()}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success('PDF downloaded successfully!');
      setIsOpen(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Export failed');
    } finally {
      setLoading(false);
    }
  };

  // ========== CSV EXPORT ==========
  const handleExportCSV = async () => {
    setLoading(true);
    try {
      const response = await axios.post(
        `/api/workspaces/${workspaceId}/reports/export/${reportType}/csv`,
        filters,
        { responseType: 'blob' }
      );

      const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${reportType}_report_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success('CSV downloaded successfully!');
      setIsOpen(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Export failed');
    } finally {
      setLoading(false);
    }
  };

  // ========== EMAIL REPORT ==========
  const handleEmailReport = async () => {
    if (!emailData.to.trim()) {
      toast.error('Please enter email address');
      return;
    }

    setLoading(true);
    try {
      await axios.post(
        `/api/workspaces/${workspaceId}/reports/email`,
        {
          reportType,
          filters,
          to: emailData.to,
          subject: emailData.subject,
          message: emailData.message
        }
      );

      toast.success('Report sent successfully!');
      setShowEmailModal(false);
      setEmailData({ to: '', subject: '', message: '' });
      setIsOpen(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* ========== MAIN BUTTON ========== */}
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          <Download size={16} />
          Export
          <ChevronDown size={16} />
        </button>

        {/* ========== DROPDOWN MENU ========== */}
        {isOpen && (
          <div className="absolute right-0 top-full mt-2 w-48 rounded-lg bg-white shadow-lg border border-slate-200 z-50">
            {/* Excel */}
            <button
              onClick={handleExportExcel}
              disabled={loading}
              className="w-full px-4 py-3 text-left text-sm hover:bg-slate-50 border-b border-slate-200 flex items-center gap-2 text-slate-700 font-medium disabled:opacity-50"
            >
              <FileText size={16} className="text-green-600" />
              📊 Excel (.xlsx)
            </button>

            {/* PDF */}
            <button
              onClick={handleExportPDF}
              disabled={loading}
              className="w-full px-4 py-3 text-left text-sm hover:bg-slate-50 border-b border-slate-200 flex items-center gap-2 text-slate-700 font-medium disabled:opacity-50"
            >
              <FileText size={16} className="text-red-600" />
              📄 PDF Report
            </button>

            {/* CSV */}
            <button
              onClick={handleExportCSV}
              disabled={loading}
              className="w-full px-4 py-3 text-left text-sm hover:bg-slate-50 border-b border-slate-200 flex items-center gap-2 text-slate-700 font-medium disabled:opacity-50"
            >
              <FileText size={16} className="text-blue-600" />
              📋 CSV File
            </button>

            {/* Email */}
            <button
              onClick={() => setShowEmailModal(true)}
              disabled={loading}
              className="w-full px-4 py-3 text-left text-sm hover:bg-slate-50 flex items-center gap-2 text-slate-700 font-medium disabled:opacity-50"
            >
              <Mail size={16} className="text-purple-600" />
              📧 Email Report
            </button>
          </div>
        )}
      </div>

      {/* ========== EMAIL MODAL ========== */}
      {showEmailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
            <h3 className="mb-4 text-lg font-bold text-slate-900">Email Report</h3>

            {/* To Email */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Recipients (comma-separated)
              </label>
              <input
                type="email"
                multiple
                placeholder="email@example.com, email2@example.com"
                value={emailData.to}
                onChange={(e) => setEmailData({ ...emailData, to: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
            </div>

            {/* Subject */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Subject
              </label>
              <input
                type="text"
                value={emailData.subject}
                onChange={(e) => setEmailData({ ...emailData, subject: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
            </div>

            {/* Message */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Message (Optional)
              </label>
              <textarea
                value={emailData.message}
                onChange={(e) => setEmailData({ ...emailData, message: e.target.value })}
                placeholder="Add a personal message..."
                rows={3}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-4">
              <button
                onClick={() => setShowEmailModal(false)}
                className="flex-1 rounded-lg border border-slate-300 py-2 font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleEmailReport}
                disabled={loading}
                className="flex-1 rounded-lg bg-blue-600 py-2 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Sending...' : 'Send Report'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ExportButton;
