import ReportSummaryCards from './ReportSummaryCards';
import ReportTable from './ReportTable';

const ReportPreview = ({ report }) => (
  <div className="space-y-4">
    <ReportSummaryCards summary={report?.summary} />
    <ReportTable rows={report?.rows || []} />
  </div>
);

export default ReportPreview;
