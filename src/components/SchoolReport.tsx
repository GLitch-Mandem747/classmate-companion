import React from 'react';
import { Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Subject {
  name: string;
  test1: number;
  test2: number;
  endOfTerm: number;
}

interface SchoolReportProps {
  studentName: string;
  className: string;
  entryResults: string;
  term: string;
  subjects: Subject[];
  pointsInBestSix: number;
  position: string;
  teacherName: string;
  remarks: string;
}

export const SchoolReport: React.FC<SchoolReportProps> = ({
  studentName,
  className,
  entryResults,
  term,
  subjects,
  pointsInBestSix,
  position,
  teacherName,
  remarks
}) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-[210mm] mx-auto bg-white print:shadow-none" style={{ fontFamily: 'Arial, sans-serif' }}>
        {/* Print Button */}
        <div className="p-4 print:hidden no-print">
          <Button onClick={handlePrint} className="flex items-center gap-2">
            <Printer size={20} />
            Print Report
          </Button>
        </div>

        {/* Report Content - A4 Size */}
        <div className="p-8 print:p-12" style={{ width: '210mm', minHeight: '297mm' }}>
          {/* Header */}
          <div className="text-center mb-4">
            <h1 className="font-bold mb-0.5" style={{ fontSize: '16pt', letterSpacing: '0.5px', color: '#000' }}>
              ST. DOMINIC'S BOYS SECONDARY SCHOOL
            </h1>
            <h2 className="font-bold mb-0.5" style={{ fontSize: '11pt', letterSpacing: '0.3px', color: '#000' }}>
              FRANCISCAN MISSIONARY BROTHERS OF SERVICE (FMBS)
            </h2>
            <h3 className="font-bold mb-1" style={{ fontSize: '11pt', letterSpacing: '0.3px', color: '#000' }}>
              FR. DOMINIC LIM'S MEMORIAL SCHOOL
            </h3>
            <p className="mb-0.5" style={{ fontSize: '9pt', color: '#000' }}>P. O. BOX 110214,</p>
            <p className="mb-1" style={{ fontSize: '9pt', color: '#000' }}>KABISAPI – MUSHINDAMO, ZAMBIA.</p>
            <p style={{ fontSize: '8pt', lineHeight: '1.2', color: '#000' }}>
              CONTACT: Secretary – 0950 087253, Accountant – 0765 649965, Email: stdominicsboys21@gmail.com
            </p>
          </div>

          {/* Horizontal Line */}
          <div className="border-t-2 border-black mb-3"></div>

          {/* Report Title */}
          <h2 className="font-bold text-center mb-4" style={{ fontSize: '14pt', letterSpacing: '1px', color: '#000' }}>
            SCHOOL REPORT
          </h2>

          {/* Student Info Grid */}
          <div className="grid grid-cols-3 gap-0 mb-3" style={{ fontSize: '9pt', color: '#000' }}>
            <div className="pr-2">
              <span className="font-bold block mb-0.5">STUDENT NAME</span>
              <p className="m-0">{studentName}</p>
            </div>
            <div className="px-2">
              <span className="font-bold block mb-0.5">CLASS</span>
              <p className="m-0">{className}</p>
            </div>
            <div className="pl-2">
              <span className="font-bold block mb-0.5">ENTRY RESULTS</span>
              <p className="m-0">{entryResults}</p>
            </div>
          </div>

          {/* Term */}
          <div className="text-center font-bold mb-3" style={{ fontSize: '10pt', letterSpacing: '0.5px', color: '#000' }}>
            {term}
          </div>

          {/* Subjects Table */}
          <table className="w-full mb-3" style={{ fontSize: '9pt', borderCollapse: 'collapse', color: '#000' }}>
            <thead>
              <tr>
                <th className="border-2 border-black p-1.5 text-left font-bold bg-white" style={{ width: '50%' }}>
                  SUBJECTS
                </th>
                <th className="border-2 border-black p-1.5 text-center font-bold bg-white" style={{ width: '16.66%' }}>
                  TEST ONE
                </th>
                <th className="border-2 border-black p-1.5 text-center font-bold bg-white" style={{ width: '16.66%' }}>
                  TEST TWO
                </th>
                <th className="border-2 border-black p-1.5 text-center font-bold bg-white" style={{ width: '16.66%' }}>
                  END OF TERM
                </th>
              </tr>
            </thead>
            <tbody>
              {subjects.map((subject, index) => (
                <tr key={index}>
                  <td className="border border-black p-1.5 font-bold">{subject.name}</td>
                  <td className="border border-black p-1.5 text-center">{subject.test1}</td>
                  <td className="border border-black p-1.5 text-center">{subject.test2}</td>
                  <td className="border border-black p-1.5 text-center">{subject.endOfTerm}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Performance Summary */}
          <div className="mb-3" style={{ fontSize: '9pt', lineHeight: '1.6', color: '#000' }}>
            <p className="font-bold m-0 mb-1">
              POINTS IN BEST SIX INCLUDING ENGLISH AND MATHEMATICS: {pointsInBestSix}
            </p>
            <p className="font-bold m-0">
              POSITION IN CLASS: {position}
            </p>
          </div>

          {/* Teacher's Remarks */}
          <div className="mb-4" style={{ fontSize: '9pt', color: '#000' }}>
            <p className="font-bold m-0 mb-1">CLASS TEACHER'S REMARKS {teacherName}</p>
            <p className="m-0" style={{ lineHeight: '1.5', textAlign: 'justify' }}>
              {remarks}
            </p>
          </div>

          {/* Grading Scale */}
          <div className="mb-6">
            <p className="font-bold mb-2" style={{ fontSize: '9pt', color: '#000' }}>
              Grades are awarded on an 8 point grade scale as follows
            </p>
            <table className="w-full" style={{ fontSize: '8pt', borderCollapse: 'collapse', color: '#000' }}>
              <tbody>
                <tr>
                  <td className="border border-black p-1 font-bold" style={{ width: '12%' }}>Grade</td>
                  <td className="border border-black p-1 text-center">1</td>
                  <td className="border border-black p-1 text-center">2</td>
                  <td className="border border-black p-1 text-center">3</td>
                  <td className="border border-black p-1 text-center">4</td>
                  <td className="border border-black p-1 text-center">5</td>
                  <td className="border border-black p-1 text-center">6</td>
                  <td className="border border-black p-1 text-center">7</td>
                  <td className="border border-black p-1 text-center">8</td>
                </tr>
                <tr>
                  <td className="border border-black p-1 font-bold">Score</td>
                  <td className="border border-black p-1 text-center">85-100</td>
                  <td className="border border-black p-1 text-center">75-84</td>
                  <td className="border border-black p-1 text-center">70-74</td>
                  <td className="border border-black p-1 text-center">65-69</td>
                  <td className="border border-black p-1 text-center">60-64</td>
                  <td className="border border-black p-1 text-center">55-59</td>
                  <td className="border border-black p-1 text-center">50-54</td>
                  <td className="border border-black p-1 text-center">0-49</td>
                </tr>
                <tr>
                  <td className="border border-black p-1 font-bold">Description</td>
                  <td className="border border-black p-1 text-center">Distinction</td>
                  <td className="border border-black p-1 text-center">Distinction</td>
                  <td className="border border-black p-1 text-center">Merit</td>
                  <td className="border border-black p-1 text-center">Merit</td>
                  <td className="border border-black p-1 text-center">Credit</td>
                  <td className="border border-black p-1 text-center">Credit</td>
                  <td className="border border-black p-1 text-center">Pass</td>
                  <td className="border border-black p-1 text-center">Fail</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="flex justify-between items-start mt-8">
            <div style={{ fontSize: '9pt', color: '#000' }}>
              <p className="font-bold m-0 mb-12">PRINCIPAL</p>
              <div className="border-t border-black pt-1" style={{ width: '180px' }}>
                <span className="text-xs">Signature</span>
              </div>
            </div>
            <div style={{ fontSize: '9pt', color: '#000' }}>
              <p className="font-bold m-0 mb-2">SCHOOL STAMP</p>
              <div className="border-2 border-black" style={{ width: '120px', height: '120px' }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 0;
          }
          body {
            margin: 0;
            padding: 0;
            background: white !important;
          }
          .print\\:hidden {
            display: none !important;
          }
          .no-print {
            display: none !important;
          }
          .print\\:shadow-none {
            box-shadow: none !important;
          }
          .print\\:p-12 {
            padding: 3rem !important;
          }
        }
      `}</style>
    </div>
  );
};